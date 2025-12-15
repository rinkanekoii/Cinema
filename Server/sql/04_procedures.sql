-- =============================================
-- CINEMA HUB - 04. Packages and Procedures
-- Run as CINEMA_DB user
-- =============================================

SET SERVEROUTPUT ON;
SET DEFINE OFF;

-- =============================================
-- HELPER PROCEDURES
-- =============================================

-- Error logging procedure
CREATE OR REPLACE PROCEDURE log_error(
    p_error_code IN VARCHAR2,
    p_error_msg IN VARCHAR2,
    p_error_type IN VARCHAR2 DEFAULT 'SYSTEM',
    p_procedure_name IN VARCHAR2 DEFAULT NULL
) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO ERROR_LOG (
        error_code, error_msg, error_type, stack_trace, 
        procedure_name, user_name, ip_address
    ) VALUES (
        p_error_code, p_error_msg, p_error_type, 
        DBMS_UTILITY.FORMAT_ERROR_BACKTRACE,
        p_procedure_name, 
        SYS_CONTEXT('USERENV', 'SESSION_USER'), 
        SYS_CONTEXT('USERENV', 'IP_ADDRESS')
    );
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
END log_error;
/

-- Audit logging procedure
CREATE OR REPLACE PROCEDURE log_audit(
    p_table_name IN VARCHAR2,
    p_record_id IN NUMBER,
    p_action IN VARCHAR2,
    p_old_values IN CLOB DEFAULT NULL,
    p_new_values IN CLOB DEFAULT NULL,
    p_mo_ta IN VARCHAR2 DEFAULT NULL
) AS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO AUDIT_LOG (
        table_name, action_type, record_id, old_values, new_values, 
        changed_by, changed_at, ip_address, mo_ta
    ) VALUES (
        p_table_name, p_action, p_record_id, p_old_values, p_new_values,
        SYS_CONTEXT('USERENV', 'SESSION_USER'), 
        SYSTIMESTAMP, 
        SYS_CONTEXT('USERENV', 'IP_ADDRESS'), 
        p_mo_ta
    );
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
END log_audit;
/

-- =============================================
-- SECURITY PACKAGE (Encryption/Hashing)
-- =============================================

CREATE OR REPLACE PACKAGE pkg_security AS
    -- Generate random salt for password hashing
    FUNCTION generate_salt RETURN VARCHAR2;
    
    -- Hash password with salt and pepper (SHA-512)
    FUNCTION hash_password(p_password IN VARCHAR2, p_salt IN VARCHAR2) RETURN VARCHAR2;
    
    -- Verify password against stored hash
    FUNCTION verify_password(
        p_password IN VARCHAR2, 
        p_salt IN VARCHAR2, 
        p_stored_hash IN VARCHAR2
    ) RETURN NUMBER;
    
    -- Encrypt sensitive data (AES-256)
    FUNCTION encrypt_data(p_data IN VARCHAR2) RETURN RAW;
    
    -- Decrypt sensitive data
    FUNCTION decrypt_data(p_data IN RAW) RETURN VARCHAR2;
END pkg_security;
/

CREATE OR REPLACE PACKAGE BODY pkg_security AS
    -- Secret pepper (server-side secret key)
    gc_pepper VARCHAR2(100) := 'CinemaHub2024!@#$SecretPepper%^&*';
    
    -- AES-256 encryption key
    gc_encryption_key RAW(32) := UTL_RAW.CAST_TO_RAW('CinemaHubAES256Key!@#$%^&*');
    
    FUNCTION generate_salt RETURN VARCHAR2 IS
        l_salt RAW(32);
    BEGIN
        l_salt := DBMS_CRYPTO.RANDOMBYTES(32);
        RETURN UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(l_salt));
    END generate_salt;
    
    FUNCTION hash_password(p_password IN VARCHAR2, p_salt IN VARCHAR2) RETURN VARCHAR2 IS
        l_salted_password VARCHAR2(4000);
        l_hashed_raw RAW(64);
    BEGIN
        IF p_password IS NULL OR p_salt IS NULL THEN 
            RETURN NULL; 
        END IF;
        
        -- Combine password + salt + pepper
        l_salted_password := p_password || p_salt || gc_pepper;
        
        -- Hash using SHA-512
        l_hashed_raw := DBMS_CRYPTO.HASH(
            src => UTL_I18N.STRING_TO_RAW(l_salted_password, 'AL32UTF8'), 
            typ => DBMS_CRYPTO.HASH_SH512
        );
        
        -- Return Base64 encoded hash
        RETURN UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(l_hashed_raw));
    END hash_password;
    
    FUNCTION verify_password(
        p_password IN VARCHAR2, 
        p_salt IN VARCHAR2, 
        p_stored_hash IN VARCHAR2
    ) RETURN NUMBER IS
    BEGIN
        IF hash_password(p_password, p_salt) = p_stored_hash THEN
            RETURN 1; -- Password matches
        ELSE
            RETURN 0; -- Password does not match
        END IF;
    END verify_password;
    
    FUNCTION encrypt_data(p_data IN VARCHAR2) RETURN RAW IS
        l_encrypted_raw RAW(2000);
        l_encryption_type PLS_INTEGER := DBMS_CRYPTO.ENCRYPT_AES256 
                                        + DBMS_CRYPTO.CHAIN_CBC 
                                        + DBMS_CRYPTO.PAD_PKCS5;
    BEGIN
        IF p_data IS NULL THEN 
            RETURN NULL; 
        END IF;
        
        l_encrypted_raw := DBMS_CRYPTO.ENCRYPT(
            src => UTL_I18N.STRING_TO_RAW(p_data, 'AL32UTF8'), 
            typ => l_encryption_type, 
            key => gc_encryption_key
        );
        
        RETURN l_encrypted_raw;
    EXCEPTION 
        WHEN OTHERS THEN 
            log_error('ENCRYPT_ERR', SQLERRM, 'SECURITY', 'encrypt_data');
            RAISE; 
    END encrypt_data;
    
    FUNCTION decrypt_data(p_data IN RAW) RETURN VARCHAR2 IS
        l_decrypted_raw RAW(2000);
        l_encryption_type PLS_INTEGER := DBMS_CRYPTO.ENCRYPT_AES256 
                                        + DBMS_CRYPTO.CHAIN_CBC 
                                        + DBMS_CRYPTO.PAD_PKCS5;
    BEGIN
        IF p_data IS NULL THEN 
            RETURN NULL; 
        END IF;
        
        l_decrypted_raw := DBMS_CRYPTO.DECRYPT(
            src => p_data, 
            typ => l_encryption_type, 
            key => gc_encryption_key
        );
        
        RETURN UTL_I18N.RAW_TO_CHAR(l_decrypted_raw, 'AL32UTF8');
    EXCEPTION 
        WHEN OTHERS THEN 
            log_error('DECRYPT_ERR', SQLERRM, 'SECURITY', 'decrypt_data');
            RETURN NULL; 
    END decrypt_data;
END pkg_security;
/

-- =============================================
-- USER MANAGEMENT PACKAGE
-- =============================================

CREATE OR REPLACE PACKAGE pkg_user_management AS
    -- Register new user with encrypted password
    PROCEDURE dang_ky_nguoi_dung(
        p_ten_dang_nhap IN VARCHAR2,
        p_mat_khau IN VARCHAR2,
        p_ho_ten IN NVARCHAR2,
        p_email IN VARCHAR2,
        p_so_dien_thoai IN VARCHAR2,
        p_ngay_sinh IN DATE,
        p_gioi_tinh IN CHAR,
        p_dia_chi IN CLOB,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2,
        p_ma_nguoi_dung OUT NUMBER
    );
    
    -- Authenticate user login with password verification
    FUNCTION xac_thuc_dang_nhap(
        p_ten_dang_nhap IN VARCHAR2,
        p_mat_khau IN VARCHAR2
    ) RETURN NUMBER;
    
    -- Change password
    PROCEDURE doi_mat_khau(
        p_ma_nguoi_dung IN NUMBER,
        p_mat_khau_cu IN VARCHAR2,
        p_mat_khau_moi IN VARCHAR2,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2
    );
    
    -- Unlock account
    PROCEDURE mo_khoa_tai_khoan(
        p_ma_nguoi_dung IN NUMBER,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2
    );
END pkg_user_management;
/

CREATE OR REPLACE PACKAGE BODY pkg_user_management AS
    
    PROCEDURE dang_ky_nguoi_dung(
        p_ten_dang_nhap IN VARCHAR2,
        p_mat_khau IN VARCHAR2,
        p_ho_ten IN NVARCHAR2,
        p_email IN VARCHAR2,
        p_so_dien_thoai IN VARCHAR2,
        p_ngay_sinh IN DATE,
        p_gioi_tinh IN CHAR,
        p_dia_chi IN CLOB,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2,
        p_ma_nguoi_dung OUT NUMBER
    ) IS
        v_salt VARCHAR2(100);
        v_hashed_password VARCHAR2(4000);
        v_count NUMBER;
    BEGIN
        -- Validate username length
        IF LENGTH(p_ten_dang_nhap) < 3 THEN
            p_success := 0;
            p_message := 'Tên đăng nhập phải có ít nhất 3 ký tự';
            p_ma_nguoi_dung := NULL;
            RETURN;
        END IF;
        
        -- Validate password length
        IF LENGTH(p_mat_khau) < 6 THEN
            p_success := 0;
            p_message := 'Mật khẩu phải có ít nhất 6 ký tự';
            p_ma_nguoi_dung := NULL;
            RETURN;
        END IF;
        
        -- Check if username exists
        SELECT COUNT(*) INTO v_count FROM NGUOI_DUNG WHERE ten_dang_nhap = p_ten_dang_nhap;
        IF v_count > 0 THEN
            p_success := 0;
            p_message := 'Tên đăng nhập đã tồn tại';
            p_ma_nguoi_dung := NULL;
            RETURN;
        END IF;
        
        -- Check if email exists
        SELECT COUNT(*) INTO v_count FROM NGUOI_DUNG WHERE email = p_email;
        IF v_count > 0 THEN
            p_success := 0;
            p_message := 'Email đã được sử dụng';
            p_ma_nguoi_dung := NULL;
            RETURN;
        END IF;
        
        -- Generate salt and hash password
        v_salt := pkg_security.generate_salt();
        v_hashed_password := pkg_security.hash_password(p_mat_khau, v_salt);
        
        -- Insert new user
        INSERT INTO NGUOI_DUNG (
            ten_dang_nhap, mat_khau, salt, ho_ten, email, 
            so_dien_thoai, ngay_sinh, gioi_tinh, dia_chi
        ) VALUES (
            p_ten_dang_nhap, v_hashed_password, v_salt, p_ho_ten, p_email,
            p_so_dien_thoai, p_ngay_sinh, p_gioi_tinh, p_dia_chi
        ) RETURNING ma_nguoi_dung INTO p_ma_nguoi_dung;
        
        -- Log audit
        log_audit('NGUOI_DUNG', p_ma_nguoi_dung, 'INSERT', NULL, NULL, 'Đăng ký người dùng mới');
        
        COMMIT;
        p_success := 1;
        p_message := 'Đăng ký thành công';
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            p_message := SQLERRM;
            p_ma_nguoi_dung := NULL;
            log_error('REGISTER_ERR', SQLERRM, 'USER', 'dang_ky_nguoi_dung');
    END dang_ky_nguoi_dung;
    
    FUNCTION xac_thuc_dang_nhap(
        p_ten_dang_nhap IN VARCHAR2,
        p_mat_khau IN VARCHAR2
    ) RETURN NUMBER IS
        v_ma_nguoi_dung NUMBER;
        v_mat_khau VARCHAR2(200);
        v_salt VARCHAR2(100);
        v_so_lan_sai NUMBER;
        v_trang_thai VARCHAR2(20);
    BEGIN
        -- Get user info
        SELECT ma_nguoi_dung, mat_khau, salt, so_lan_dang_nhap_sai, trang_thai
        INTO v_ma_nguoi_dung, v_mat_khau, v_salt, v_so_lan_sai, v_trang_thai
        FROM NGUOI_DUNG
        WHERE ten_dang_nhap = p_ten_dang_nhap;
        
        -- Check if account is locked
        IF v_trang_thai = 'KHOA' OR v_so_lan_sai >= 5 THEN
            RETURN -2; -- Account locked
        END IF;
        
        -- Verify password using encryption
        IF pkg_security.verify_password(p_mat_khau, v_salt, v_mat_khau) = 1 THEN
            -- Reset failed attempts on successful login
            UPDATE NGUOI_DUNG 
            SET so_lan_dang_nhap_sai = 0, 
                updated_at = SYSTIMESTAMP
            WHERE ma_nguoi_dung = v_ma_nguoi_dung;
            COMMIT;
            
            log_audit('NGUOI_DUNG', v_ma_nguoi_dung, 'LOGIN', NULL, NULL, 'Đăng nhập thành công');
            RETURN v_ma_nguoi_dung; -- Return user ID on success
        ELSE
            -- Increment failed attempts
            UPDATE NGUOI_DUNG 
            SET so_lan_dang_nhap_sai = v_so_lan_sai + 1,
                trang_thai = CASE WHEN v_so_lan_sai + 1 >= 5 THEN 'KHOA' ELSE trang_thai END,
                updated_at = SYSTIMESTAMP
            WHERE ma_nguoi_dung = v_ma_nguoi_dung;
            COMMIT;
            
            log_audit('NGUOI_DUNG', v_ma_nguoi_dung, 'LOGIN_FAILED', NULL, NULL, 
                     'Đăng nhập thất bại lần ' || (v_so_lan_sai + 1));
            RETURN -1; -- Invalid password
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN -1; -- User not found
        WHEN OTHERS THEN
            log_error('LOGIN_ERR', SQLERRM, 'USER', 'xac_thuc_dang_nhap');
            RETURN -3; -- Error
    END xac_thuc_dang_nhap;
    
    PROCEDURE doi_mat_khau(
        p_ma_nguoi_dung IN NUMBER,
        p_mat_khau_cu IN VARCHAR2,
        p_mat_khau_moi IN VARCHAR2,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2
    ) IS
        v_mat_khau VARCHAR2(200);
        v_salt VARCHAR2(100);
        v_new_salt VARCHAR2(100);
        v_new_hash VARCHAR2(200);
    BEGIN
        -- Get current password info
        SELECT mat_khau, salt INTO v_mat_khau, v_salt
        FROM NGUOI_DUNG WHERE ma_nguoi_dung = p_ma_nguoi_dung;
        
        -- Verify old password
        IF pkg_security.verify_password(p_mat_khau_cu, v_salt, v_mat_khau) != 1 THEN
            p_success := 0;
            p_message := 'Mật khẩu cũ không đúng';
            RETURN;
        END IF;
        
        -- Validate new password
        IF LENGTH(p_mat_khau_moi) < 6 THEN
            p_success := 0;
            p_message := 'Mật khẩu mới phải có ít nhất 6 ký tự';
            RETURN;
        END IF;
        
        -- Generate new salt and hash
        v_new_salt := pkg_security.generate_salt();
        v_new_hash := pkg_security.hash_password(p_mat_khau_moi, v_new_salt);
        
        -- Update password
        UPDATE NGUOI_DUNG 
        SET mat_khau = v_new_hash, salt = v_new_salt, updated_at = SYSTIMESTAMP
        WHERE ma_nguoi_dung = p_ma_nguoi_dung;
        
        COMMIT;
        p_success := 1;
        p_message := 'Đổi mật khẩu thành công';
        
        log_audit('NGUOI_DUNG', p_ma_nguoi_dung, 'PASSWORD_CHANGE', NULL, NULL, 'Đổi mật khẩu');
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            p_message := SQLERRM;
    END doi_mat_khau;
    
    PROCEDURE mo_khoa_tai_khoan(
        p_ma_nguoi_dung IN NUMBER,
        p_success OUT NUMBER,
        p_message OUT VARCHAR2
    ) IS
    BEGIN
        UPDATE NGUOI_DUNG 
        SET trang_thai = 'HOAT_DONG', 
            so_lan_dang_nhap_sai = 0,
            updated_at = SYSTIMESTAMP
        WHERE ma_nguoi_dung = p_ma_nguoi_dung;
        
        COMMIT;
        p_success := 1;
        p_message := 'Mở khóa tài khoản thành công';
        
        log_audit('NGUOI_DUNG', p_ma_nguoi_dung, 'UNLOCK', NULL, NULL, 'Mở khóa tài khoản');
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_success := 0;
            p_message := SQLERRM;
    END mo_khoa_tai_khoan;
END pkg_user_management;
/

-- =============================================
-- BOOKING PACKAGE
-- =============================================

CREATE OR REPLACE PACKAGE pkg_booking AS
    -- Check if seat is available
    FUNCTION kiem_tra_ghe_trong(
        p_ma_suat_chieu IN NUMBER, 
        p_ma_ghe IN NUMBER
    ) RETURN NUMBER;
    
    -- Book a ticket
    PROCEDURE sp_dat_ve(
        p_ma_suat_chieu IN NUMBER,
        p_ma_ghe IN NUMBER,
        p_ma_nguoi_dat IN NUMBER,
        p_result OUT NUMBER
    );
    
    -- Cancel a ticket
    PROCEDURE sp_huy_ve(
        p_ma_ve IN NUMBER,
        p_ly_do IN VARCHAR2,
        p_result OUT NUMBER
    );
END pkg_booking;
/

CREATE OR REPLACE PACKAGE BODY pkg_booking AS
    
    FUNCTION kiem_tra_ghe_trong(
        p_ma_suat_chieu IN NUMBER, 
        p_ma_ghe IN NUMBER
    ) RETURN NUMBER IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count 
        FROM VE 
        WHERE ma_suat_chieu = p_ma_suat_chieu 
        AND ma_ghe = p_ma_ghe 
        AND trang_thai IN ('DA_DAT', 'DA_BAN');
        
        IF v_count = 0 THEN
            RETURN 1; -- Seat is available
        ELSE
            RETURN 0; -- Seat is taken
        END IF;
    END kiem_tra_ghe_trong;
    
    PROCEDURE sp_dat_ve(
        p_ma_suat_chieu IN NUMBER,
        p_ma_ghe IN NUMBER,
        p_ma_nguoi_dat IN NUMBER,
        p_result OUT NUMBER
    ) IS
        v_gia_ve NUMBER;
        v_ma_ve NUMBER;
    BEGIN
        -- Check if seat is available
        IF kiem_tra_ghe_trong(p_ma_suat_chieu, p_ma_ghe) = 0 THEN
            p_result := 0; -- Seat already taken
            RETURN;
        END IF;
        
        -- Get ticket price from showtime
        SELECT gia_ve INTO v_gia_ve 
        FROM SUAT_CHIEU 
        WHERE ma_suat_chieu = p_ma_suat_chieu;
        
        -- Insert ticket
        INSERT INTO VE (
            ma_suat_chieu, ma_ghe, ma_nguoi_dat, gia_ve, trang_thai, ngay_dat
        ) VALUES (
            p_ma_suat_chieu, p_ma_ghe, p_ma_nguoi_dat, v_gia_ve, 'DA_DAT', SYSTIMESTAMP
        ) RETURNING ma_ve INTO v_ma_ve;
        
        COMMIT;
        p_result := 1; -- Success
        
        log_audit('VE', v_ma_ve, 'INSERT', NULL, NULL, 'Đặt vé mới');
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_result := 0;
            log_error('BOOKING_ERR', SQLERRM, 'BOOKING', 'sp_dat_ve');
    END sp_dat_ve;
    
    PROCEDURE sp_huy_ve(
        p_ma_ve IN NUMBER,
        p_ly_do IN VARCHAR2,
        p_result OUT NUMBER
    ) IS
    BEGIN
        UPDATE VE SET trang_thai = 'DA_HUY', updated_at = SYSTIMESTAMP
        WHERE ma_ve = p_ma_ve;
        
        COMMIT;
        p_result := 1;
        
        log_audit('VE', p_ma_ve, 'CANCEL', NULL, NULL, 'Hủy vé: ' || p_ly_do);
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            p_result := 0;
    END sp_huy_ve;
END pkg_booking;
/

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-calculate showtime end time
CREATE OR REPLACE TRIGGER trg_suat_chieu_ket_thuc
BEFORE INSERT OR UPDATE OF ma_phim, thoi_gian_bat_dau ON SUAT_CHIEU
FOR EACH ROW
DECLARE 
    v_thoi_luong NUMBER;
BEGIN
    SELECT thoi_luong INTO v_thoi_luong FROM PHIM WHERE ma_phim = :NEW.ma_phim;
    :NEW.thoi_gian_ket_thuc := :NEW.thoi_gian_bat_dau + (v_thoi_luong / 1440);
EXCEPTION
    WHEN NO_DATA_FOUND THEN NULL;
END;
/

-- Audit trigger for users
CREATE OR REPLACE TRIGGER trg_audit_nguoi_dung
AFTER INSERT OR UPDATE OR DELETE ON NGUOI_DUNG
FOR EACH ROW
DECLARE 
    v_action VARCHAR2(10); 
    v_pk NUMBER;
BEGIN
    IF INSERTING THEN 
        v_action := 'INSERT'; 
        v_pk := :NEW.ma_nguoi_dung;
    ELSIF UPDATING THEN 
        v_action := 'UPDATE'; 
        v_pk := :NEW.ma_nguoi_dung;
    ELSE 
        v_action := 'DELETE'; 
        v_pk := :OLD.ma_nguoi_dung; 
    END IF;
    log_audit('NGUOI_DUNG', v_pk, v_action, NULL, NULL, NULL);
END;
/

-- Audit trigger for tickets
CREATE OR REPLACE TRIGGER trg_audit_ve
AFTER INSERT OR UPDATE OR DELETE ON VE
FOR EACH ROW
DECLARE 
    v_action VARCHAR2(10); 
    v_pk NUMBER;
BEGIN
    IF INSERTING THEN 
        v_action := 'INSERT'; 
        v_pk := :NEW.ma_ve;
    ELSIF UPDATING THEN 
        v_action := 'UPDATE'; 
        v_pk := :NEW.ma_ve;
    ELSE 
        v_action := 'DELETE'; 
        v_pk := :OLD.ma_ve; 
    END IF;
    log_audit('VE', v_pk, v_action, NULL, NULL, NULL);
END;
/

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Procedures created successfully ===');
    DBMS_OUTPUT.PUT_LINE('Packages: pkg_security, pkg_user_management, pkg_booking');
    DBMS_OUTPUT.PUT_LINE('Triggers: trg_suat_chieu_ket_thuc, trg_audit_nguoi_dung, trg_audit_ve');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Next: Run 05_policies.sql');
END;
/
