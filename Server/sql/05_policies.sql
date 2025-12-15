-- =============================================
-- CINEMA HUB - 05. Security Policies
-- Run as CINEMA_DB user (or SYS for VPD/OLS)
-- =============================================

SET SERVEROUTPUT ON;
SET DEFINE OFF;

-- =============================================
-- VPD (Virtual Private Database) Policies
-- Requires EXECUTE ON DBMS_RLS grant from SYS
-- =============================================

-- VPD policy function for user data access
CREATE OR REPLACE FUNCTION fn_vpd_nguoi_dung(
    p_schema IN VARCHAR2, 
    p_object IN VARCHAR2
) RETURN VARCHAR2 IS
    v_vai_tro VARCHAR2(20);
    v_ma_nguoi_dung NUMBER;
    v_predicate VARCHAR2(500);
BEGIN
    -- Get current user role from session context
    BEGIN
        v_vai_tro := SYS_CONTEXT('CINEMA_CTX', 'VAI_TRO');
        v_ma_nguoi_dung := TO_NUMBER(SYS_CONTEXT('CINEMA_CTX', 'MA_NGUOI_DUNG'));
    EXCEPTION
        WHEN OTHERS THEN
            v_vai_tro := NULL;
            v_ma_nguoi_dung := NULL;
    END;
    
    -- Admin can see all data
    IF v_vai_tro = 'ADMIN' THEN
        RETURN NULL; -- No restriction
    END IF;
    
    -- Staff can see customer data
    IF v_vai_tro = 'NHAN_VIEN' THEN
        RETURN 'vai_tro != ''ADMIN''';
    END IF;
    
    -- Regular users can only see their own data
    IF v_ma_nguoi_dung IS NOT NULL THEN
        RETURN 'ma_nguoi_dung = ' || v_ma_nguoi_dung;
    END IF;
    
    -- Default: block all access
    RETURN '1=0';
EXCEPTION
    WHEN OTHERS THEN
        RETURN '1=0'; -- Safe default
END fn_vpd_nguoi_dung;
/

-- VPD policy function for ticket data access
CREATE OR REPLACE FUNCTION fn_vpd_ve(
    p_schema IN VARCHAR2, 
    p_object IN VARCHAR2
) RETURN VARCHAR2 IS
    v_vai_tro VARCHAR2(20);
    v_ma_nguoi_dung NUMBER;
BEGIN
    BEGIN
        v_vai_tro := SYS_CONTEXT('CINEMA_CTX', 'VAI_TRO');
        v_ma_nguoi_dung := TO_NUMBER(SYS_CONTEXT('CINEMA_CTX', 'MA_NGUOI_DUNG'));
    EXCEPTION
        WHEN OTHERS THEN
            v_vai_tro := NULL;
            v_ma_nguoi_dung := NULL;
    END;
    
    -- Admin and Staff can see all tickets
    IF v_vai_tro IN ('ADMIN', 'NHAN_VIEN') THEN
        RETURN NULL;
    END IF;
    
    -- Users can only see their own tickets
    IF v_ma_nguoi_dung IS NOT NULL THEN
        RETURN 'ma_nguoi_dat = ' || v_ma_nguoi_dung || ' OR ma_nguoi_dat IS NULL';
    END IF;
    
    -- Show only available tickets for guests
    RETURN 'trang_thai = ''SAN_SANG''';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'trang_thai = ''SAN_SANG''';
END fn_vpd_ve;
/

-- =============================================
-- Application Context for Session Management
-- =============================================

-- Create application context
BEGIN
    EXECUTE IMMEDIATE 'CREATE OR REPLACE CONTEXT CINEMA_CTX USING pkg_session_context';
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Context creation requires higher privileges or already exists');
END;
/

-- Context management package
CREATE OR REPLACE PACKAGE pkg_session_context AS
    PROCEDURE set_user_context(
        p_ma_nguoi_dung IN NUMBER,
        p_vai_tro IN VARCHAR2
    );
    PROCEDURE clear_context;
END pkg_session_context;
/

CREATE OR REPLACE PACKAGE BODY pkg_session_context AS
    PROCEDURE set_user_context(
        p_ma_nguoi_dung IN NUMBER,
        p_vai_tro IN VARCHAR2
    ) IS
    BEGIN
        DBMS_SESSION.SET_CONTEXT('CINEMA_CTX', 'MA_NGUOI_DUNG', TO_CHAR(p_ma_nguoi_dung));
        DBMS_SESSION.SET_CONTEXT('CINEMA_CTX', 'VAI_TRO', p_vai_tro);
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Context might not be available
    END set_user_context;
    
    PROCEDURE clear_context IS
    BEGIN
        DBMS_SESSION.CLEAR_CONTEXT('CINEMA_CTX');
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END clear_context;
END pkg_session_context;
/

-- =============================================
-- Fine-Grained Auditing (FGA) Policies
-- =============================================

-- Audit access to user sensitive data
BEGIN
    DBMS_FGA.ADD_POLICY(
        object_schema => 'CINEMA_DB',
        object_name => 'NGUOI_DUNG',
        policy_name => 'audit_nguoi_dung_access',
        audit_column => 'MAT_KHAU,EMAIL,SO_DIEN_THOAI',
        enable => TRUE,
        statement_types => 'SELECT,UPDATE,DELETE'
    );
    DBMS_OUTPUT.PUT_LINE('FGA policy for NGUOI_DUNG created');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('FGA policy creation failed (may require DBA privileges): ' || SQLERRM);
END;
/

-- Audit access to payment data
BEGIN
    DBMS_FGA.ADD_POLICY(
        object_schema => 'CINEMA_DB',
        object_name => 'THANH_TOAN',
        policy_name => 'audit_thanh_toan_access',
        audit_column => 'SO_TIEN,MA_HOA_DON',
        enable => TRUE,
        statement_types => 'SELECT,UPDATE,DELETE'
    );
    DBMS_OUTPUT.PUT_LINE('FGA policy for THANH_TOAN created');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('FGA policy creation failed: ' || SQLERRM);
END;
/

-- =============================================
-- Row-Level Security Constraints
-- =============================================

-- Function to validate ticket booking
CREATE OR REPLACE FUNCTION fn_validate_booking(
    p_ma_suat_chieu IN NUMBER,
    p_ma_ghe IN NUMBER
) RETURN BOOLEAN IS
    v_count NUMBER;
    v_showtime_status VARCHAR2(20);
    v_showtime_start TIMESTAMP;
BEGIN
    -- Check showtime status and time
    SELECT trang_thai, thoi_gian_bat_dau 
    INTO v_showtime_status, v_showtime_start
    FROM SUAT_CHIEU 
    WHERE ma_suat_chieu = p_ma_suat_chieu;
    
    -- Cannot book for past or cancelled showtimes
    IF v_showtime_status = 'HUY_CHIEU' OR v_showtime_start < SYSTIMESTAMP THEN
        RETURN FALSE;
    END IF;
    
    -- Check if seat is already booked
    SELECT COUNT(*) INTO v_count 
    FROM VE 
    WHERE ma_suat_chieu = p_ma_suat_chieu 
    AND ma_ghe = p_ma_ghe 
    AND trang_thai IN ('DA_DAT', 'DA_BAN');
    
    RETURN v_count = 0;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END fn_validate_booking;
/

-- =============================================
-- Data Masking Functions
-- =============================================

-- Mask email address
CREATE OR REPLACE FUNCTION fn_mask_email(p_email IN VARCHAR2) RETURN VARCHAR2 IS
    v_at_pos NUMBER;
    v_masked VARCHAR2(100);
BEGIN
    IF p_email IS NULL THEN RETURN NULL; END IF;
    
    v_at_pos := INSTR(p_email, '@');
    IF v_at_pos <= 2 THEN
        v_masked := '*' || SUBSTR(p_email, v_at_pos);
    ELSE
        v_masked := SUBSTR(p_email, 1, 2) || 
                   LPAD('*', v_at_pos - 3, '*') || 
                   SUBSTR(p_email, v_at_pos);
    END IF;
    
    RETURN v_masked;
END fn_mask_email;
/

-- Mask phone number
CREATE OR REPLACE FUNCTION fn_mask_phone(p_phone IN VARCHAR2) RETURN VARCHAR2 IS
BEGIN
    IF p_phone IS NULL OR LENGTH(p_phone) < 4 THEN 
        RETURN p_phone; 
    END IF;
    
    RETURN LPAD('*', LENGTH(p_phone) - 4, '*') || SUBSTR(p_phone, -4);
END fn_mask_phone;
/

-- =============================================
-- Secure Views with Data Masking
-- =============================================

CREATE OR REPLACE VIEW VW_NGUOI_DUNG_MASKED AS
SELECT 
    ma_nguoi_dung,
    ten_dang_nhap,
    ho_ten,
    fn_mask_email(email) AS email_masked,
    fn_mask_phone(so_dien_thoai) AS sdt_masked,
    vai_tro,
    trang_thai,
    diem_tich_luy,
    ngay_dang_ky
FROM NGUOI_DUNG;

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Security Policies created successfully ===');
    DBMS_OUTPUT.PUT_LINE('VPD Functions: fn_vpd_nguoi_dung, fn_vpd_ve');
    DBMS_OUTPUT.PUT_LINE('Context: CINEMA_CTX with pkg_session_context');
    DBMS_OUTPUT.PUT_LINE('Masking: fn_mask_email, fn_mask_phone');
    DBMS_OUTPUT.PUT_LINE('Secure View: VW_NGUOI_DUNG_MASKED');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Next: Run 06_seeds.sql');
END;
/
