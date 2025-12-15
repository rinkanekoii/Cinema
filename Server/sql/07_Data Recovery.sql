-- =============================================
-- CINEMA HUB - 07. Data Recovery (Flashback)
-- Run as CINEMA_DB user
-- =============================================

SET SERVEROUTPUT ON;

CREATE OR REPLACE PACKAGE pkg_recovery AS
    -- 1. Xem lại trạng thái vé trong quá khứ (Preview)
    PROCEDURE xem_lich_su_ve(
        p_ma_ve IN NUMBER,
        p_phut_truoc IN NUMBER -- Muốn xem lại cách đây bao nhiêu phút
    );

    -- 2. Khôi phục vé về trạng thái cũ (Restore)
    PROCEDURE phuc_hoi_ve(
        p_ma_ve IN NUMBER,
        p_phut_truoc IN NUMBER,
        p_ket_qua OUT VARCHAR2
    );
    
    -- 3. Khôi phục thông tin người dùng (Ví dụ lỡ tay xóa email/sđt)
    PROCEDURE phuc_hoi_nguoi_dung(
        p_ma_nguoi_dung IN NUMBER,
        p_phut_truoc IN NUMBER,
        p_ket_qua OUT VARCHAR2
    );
END pkg_recovery;
/

CREATE OR REPLACE PACKAGE BODY pkg_recovery AS

    -- Procedure 1: Chỉ in ra màn hình để kiểm tra
    PROCEDURE xem_lich_su_ve(
        p_ma_ve IN NUMBER,
        p_phut_truoc IN NUMBER
    ) IS
        v_ve_cu VE%ROWTYPE;
        v_thoi_gian TIMESTAMP;
    BEGIN
        v_thoi_gian := SYSTIMESTAMP - NUMTODSINTERVAL(p_phut_truoc, 'MINUTE');
        
        -- Sử dụng cú pháp AS OF TIMESTAMP để lấy dữ liệu cũ
        SELECT * INTO v_ve_cu
        FROM VE AS OF TIMESTAMP v_thoi_gian
        WHERE ma_ve = p_ma_ve;
        
        DBMS_OUTPUT.PUT_LINE('--- DỮ LIỆU LÚC ' || TO_CHAR(v_thoi_gian, 'HH24:MI:SS') || ' ---');
        DBMS_OUTPUT.PUT_LINE('Mã vé: ' || v_ve_cu.ma_ve);
        DBMS_OUTPUT.PUT_LINE('Trạng thái cũ: ' || v_ve_cu.trang_thai);
        DBMS_OUTPUT.PUT_LINE('Giá vé cũ: ' || v_ve_cu.gia_ve);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('Không tìm thấy vé này trong quá khứ (hoặc chưa được tạo lúc đó).');
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Lỗi: ' || SQLERRM);
    END xem_lich_su_ve;

    -- Procedure 2: Thực hiện khôi phục
    PROCEDURE phuc_hoi_ve(
        p_ma_ve IN NUMBER,
        p_phut_truoc IN NUMBER,
        p_ket_qua OUT VARCHAR2
    ) IS
        v_ve_cu VE%ROWTYPE;
        v_thoi_gian TIMESTAMP;
    BEGIN
        v_thoi_gian := SYSTIMESTAMP - NUMTODSINTERVAL(p_phut_truoc, 'MINUTE');

        -- 1. Lấy dữ liệu cũ
        SELECT * INTO v_ve_cu
        FROM VE AS OF TIMESTAMP v_thoi_gian
        WHERE ma_ve = p_ma_ve;

        -- 2. Cập nhật lại bảng hiện tại bằng dữ liệu cũ
        UPDATE VE
        SET trang_thai = v_ve_cu.trang_thai,
            gia_ve = v_ve_cu.gia_ve,
            ma_nguoi_dat = v_ve_cu.ma_nguoi_dat,
            updated_at = SYSTIMESTAMP
        WHERE ma_ve = p_ma_ve;

        COMMIT;
        p_ket_qua := 'Thành công! Đã khôi phục vé về trạng thái lúc ' || TO_CHAR(v_thoi_gian, 'HH24:MI:SS');
        
        -- Ghi log audit hành động phục hồi
        INSERT INTO AUDIT_LOG (table_name, action_type, record_id, mo_ta)
        VALUES ('VE', 'RECOVERY', p_ma_ve, 'Phục hồi dữ liệu từ ' || p_phut_truoc || ' phút trước');
        COMMIT;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_ket_qua := 'Thất bại: Dữ liệu không tồn tại tại thời điểm đó.';
            ROLLBACK;
        WHEN OTHERS THEN
            p_ket_qua := 'Lỗi hệ thống: ' || SQLERRM;
            ROLLBACK;
    END phuc_hoi_ve;
    
    -- Procedure 3: Khôi phục người dùng
    PROCEDURE phuc_hoi_nguoi_dung(
        p_ma_nguoi_dung IN NUMBER,
        p_phut_truoc IN NUMBER,
        p_ket_qua OUT VARCHAR2
    ) IS
        v_user_cu NGUOI_DUNG%ROWTYPE;
        v_thoi_gian TIMESTAMP;
    BEGIN
        v_thoi_gian := SYSTIMESTAMP - NUMTODSINTERVAL(p_phut_truoc, 'MINUTE');

        SELECT * INTO v_user_cu
        FROM NGUOI_DUNG AS OF TIMESTAMP v_thoi_gian
        WHERE ma_nguoi_dung = p_ma_nguoi_dung;

        UPDATE NGUOI_DUNG
        SET ho_ten = v_user_cu.ho_ten,
            email = v_user_cu.email,
            so_dien_thoai = v_user_cu.so_dien_thoai,
            diem_tich_luy = v_user_cu.diem_tich_luy,
            trang_thai = v_user_cu.trang_thai,
            updated_at = SYSTIMESTAMP
        WHERE ma_nguoi_dung = p_ma_nguoi_dung;

        COMMIT;
        p_ket_qua := 'Đã khôi phục thông tin người dùng ' || v_user_cu.ten_dang_nhap;
        
         INSERT INTO AUDIT_LOG (table_name, action_type, record_id, mo_ta)
        VALUES ('NGUOI_DUNG', 'RECOVERY', p_ma_nguoi_dung, 'Phục hồi dữ liệu từ ' || p_phut_truoc || ' phút trước');
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            p_ket_qua := 'Lỗi: ' || SQLERRM;
            ROLLBACK;
    END phuc_hoi_nguoi_dung;

END pkg_recovery;


-- KỊCH BẢN DEMO PHỤC HỒI DỮ LIỆU
-- 1. Xem dữ liệu hiện tại của vé số 1 (Giả sử đang SAN_SANG hoặc DA_DAT)
SELECT ma_ve, trang_thai, gia_ve FROM VE WHERE ma_ve = 1;

-- 2. Đợi 1 chút... (Khoảng 10-20 giây để tạo mốc thời gian)
-- ...

-- 3. GÂY LỖI: Giả sử nhân viên lỡ tay hủy vé hoặc sửa sai giá vé
UPDATE VE SET trang_thai = 'DA_HUY', gia_ve = 0 WHERE ma_ve = 1;
COMMIT;

-- 4. Kiểm tra lại: Vé đã bị hủy và giá về 0
SELECT ma_ve, trang_thai, gia_ve FROM VE WHERE ma_ve = 1;

-- 5. PHỤC HỒI: Gọi hàm phục hồi để lấy lại dữ liệu cách đây 1 phút (hoặc 5 phút)
DECLARE
    v_msg VARCHAR2(200);
BEGIN
    -- Thử xem trước dữ liệu cũ (Preview)
    pkg_recovery.xem_lich_su_ve(1, 1); -- Xem lại 1 phút trước
    
    -- Thực hiện phục hồi
    pkg_recovery.phuc_hoi_ve(
        p_ma_ve => 1,
        p_phut_truoc => 1, -- Quay lại 1 phút trước
        p_ket_qua => v_msg
    );
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- 6. KIỂM TRA LẠI: Vé đã quay về trạng thái ban đầu
SELECT ma_ve, trang_thai, gia_ve FROM VE WHERE ma_ve = 1;
/