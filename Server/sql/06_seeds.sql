-- =============================================
-- CINEMA HUB - 06. Sample Data (Seeds)
-- Run as CINEMA_DB user
-- =============================================

SET SERVEROUTPUT ON;
SET DEFINE OFF;

-- =============================================
-- THEATERS
-- =============================================

INSERT INTO RAP_CHIEU (ten_rap, dia_chi, so_dien_thoai, email) 
VALUES ('CGV Vincom Center', '72 Lê Thánh Tôn, Quận 1, TP.HCM', '1900 6017', 'cgv.vincom@cgv.vn');

INSERT INTO RAP_CHIEU (ten_rap, dia_chi, so_dien_thoai, email) 
VALUES ('Lotte Cinema Nowzone', '235 Nguyễn Văn Cừ, Quận 1, TP.HCM', '1900 6699', 'lotte.nowzone@lottecinema.vn');

INSERT INTO RAP_CHIEU (ten_rap, dia_chi, so_dien_thoai, email) 
VALUES ('Galaxy Nguyễn Du', '116 Nguyễn Du, Quận 1, TP.HCM', '1900 6063', 'galaxy.nguyendu@galaxy.vn');

INSERT INTO RAP_CHIEU (ten_rap, dia_chi, so_dien_thoai, email) 
VALUES ('BHD Star Vincom Thảo Điền', '159 Xa lộ Hà Nội, Quận 2, TP.HCM', '1900 2099', 'bhd.thaodien@bhdstar.vn');

COMMIT;

BEGIN DBMS_OUTPUT.PUT_LINE('Inserted 4 theaters'); END;
/

-- =============================================
-- ROOMS
-- =============================================

-- CGV Vincom (ma_rap = 1)
INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (1, 'Phòng IMAX 1', 200, 10, 20, 'IMAX');

INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (1, 'Phòng VIP 2', 60, 6, 10, 'VIP');

INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (1, 'Phòng Thường 3', 120, 10, 12, 'THUONG');

-- Lotte Cinema (ma_rap = 2)
INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (2, 'Phòng 4DX', 80, 8, 10, '4DX');

INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (2, 'Phòng Gold Class', 40, 4, 10, 'GOLD_CLASS');

-- Galaxy (ma_rap = 3)
INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (3, 'Phòng 1', 100, 10, 10, 'THUONG');

INSERT INTO PHONG_CHIEU (ma_rap, ten_phong, so_ghe, so_hang_ghe, so_ghe_moi_hang, loai_phong) 
VALUES (3, 'Phòng VIP', 50, 5, 10, 'VIP');

COMMIT;

BEGIN DBMS_OUTPUT.PUT_LINE('Inserted 7 rooms'); END;
/

-- =============================================
-- SEATS (Generate for Room 1 - IMAX)
-- =============================================

DECLARE
    v_rows VARCHAR2(20) := 'ABCDEFGHIJ';
    v_cols NUMBER := 20;
BEGIN
    FOR i IN 1..LENGTH(v_rows) LOOP
        FOR j IN 1..v_cols LOOP
            INSERT INTO GHE_NGOI (ma_phong, ten_ghe, loai_ghe, vi_tri_hang, vi_tri_cot)
            VALUES (
                1, 
                SUBSTR(v_rows, i, 1) || j,
                CASE 
                    WHEN SUBSTR(v_rows, i, 1) IN ('I', 'J') THEN 'VIP'
                    WHEN SUBSTR(v_rows, i, 1) IN ('A', 'B') THEN 'THUONG'
                    ELSE 'THUONG'
                END,
                SUBSTR(v_rows, i, 1), 
                j
            );
        END LOOP;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Inserted 200 seats for Room 1 (IMAX)');
END;
/

-- Seats for Room 2 (VIP)
DECLARE
    v_rows VARCHAR2(6) := 'ABCDEF';
    v_cols NUMBER := 10;
BEGIN
    FOR i IN 1..LENGTH(v_rows) LOOP
        FOR j IN 1..v_cols LOOP
            INSERT INTO GHE_NGOI (ma_phong, ten_ghe, loai_ghe, vi_tri_hang, vi_tri_cot)
            VALUES (2, SUBSTR(v_rows, i, 1) || j, 'VIP', SUBSTR(v_rows, i, 1), j);
        END LOOP;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Inserted 60 seats for Room 2 (VIP)');
END;
/

-- Seats for Room 3 (Standard)
DECLARE
    v_rows VARCHAR2(10) := 'ABCDEFGHIJ';
    v_cols NUMBER := 12;
BEGIN
    FOR i IN 1..LENGTH(v_rows) LOOP
        FOR j IN 1..v_cols LOOP
            INSERT INTO GHE_NGOI (ma_phong, ten_ghe, loai_ghe, vi_tri_hang, vi_tri_cot)
            VALUES (
                3, 
                SUBSTR(v_rows, i, 1) || j,
                CASE WHEN SUBSTR(v_rows, i, 1) IN ('I', 'J') THEN 'VIP' ELSE 'THUONG' END,
                SUBSTR(v_rows, i, 1), 
                j
            );
        END LOOP;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Inserted 120 seats for Room 3');
END;
/

-- =============================================
-- MOVIES
-- =============================================

INSERT INTO PHIM (ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong, ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat, poster_url, trailer_url, trang_thai)
VALUES (
    'Avatar: The Way of Water',
    'Jake Sully song cung gia dinh moi cua minh tren hanh tinh Pandora. Khi mot moi de doa quen thuoc tro lai de ket thuc nhung gi da bat dau truoc day, Jake phai lam viec voi Neytiri va quan doi cua chung toc Navi de bao ve hanh tinh cua ho.',
    'Hành động, Khoa học viễn tưởng, Phiêu lưu',
    'James Cameron',
    'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang',
    192,
    SYSDATE - 30,
    SYSDATE + 60,
    'Mỹ',
    '20th Century Studios',
    'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    'https://www.youtube.com/watch?v=d9MyW72ELq0',
    'DANG_CHIEU'
);

INSERT INTO PHIM (ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong, ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat, poster_url, trailer_url, trang_thai)
VALUES (
    'Oppenheimer',
    'Câu chuyện về nhà vật lý lý thuyết người Mỹ J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử trong Dự án Manhattan.',
    'Tiểu sử, Lịch sử, Chính kịch',
    'Christopher Nolan',
    'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh',
    180,
    SYSDATE - 15,
    SYSDATE + 45,
    'Mỹ, Anh',
    'Universal Pictures',
    'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    'https://www.youtube.com/watch?v=uYPbbksJxIg',
    'DANG_CHIEU'
);

INSERT INTO PHIM (ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong, ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat, poster_url, trailer_url, trang_thai)
VALUES (
    'Deadpool & Wolverine',
    'Deadpool và Wolverine hợp tác trong một cuộc phiêu lưu hoành tráng đầy hành động và hài hước, khi họ phải đối mặt với các mối đe dọa từ đa vũ trụ.',
    'Hành động, Hài, Siêu anh hùng',
    'Shawn Levy',
    'Ryan Reynolds, Hugh Jackman, Emma Corrin',
    128,
    SYSDATE + 30,
    SYSDATE + 120,
    'Mỹ',
    'Marvel Studios',
    'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    'https://www.youtube.com/watch?v=73_1biulkYk',
    'SAP_CHIEU'
);

INSERT INTO PHIM (ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong, ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat, poster_url, trailer_url, trang_thai)
VALUES (
    'Dune: Part Two',
    'Paul Atreides hợp tác với Chani và người Fremen để trả thù những kẻ đã phá hủy gia đình ông. Đối mặt với sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ.',
    'Khoa học viễn tưởng, Phiêu lưu, Chính kịch',
    'Denis Villeneuve',
    'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
    166,
    SYSDATE - 7,
    SYSDATE + 53,
    'Mỹ',
    'Warner Bros. Pictures',
    'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    'https://www.youtube.com/watch?v=Way9Dexny3w',
    'DANG_CHIEU'
);

INSERT INTO PHIM (ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong, ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat, poster_url, trailer_url, trang_thai)
VALUES (
    'Mai',
    'Câu chuyện về Mai - một cô gái massage với cuộc sống đầy biến cố, tìm kiếm hạnh phúc giữa những khó khăn và định kiến xã hội.',
    'Tâm lý, Tình cảm',
    'Trấn Thành',
    'Phương Anh Đào, Tuấn Trần, Hồng Đào, NSƯT Hồng Ánh',
    131,
    SYSDATE - 20,
    SYSDATE + 40,
    'Việt Nam',
    'Galaxy Studio',
    'https://image.tmdb.org/t/p/w500/aNKhV4JZmYLWxCMRG8x5k4xz7Bm.jpg',
    'https://www.youtube.com/watch?v=example',
    'DANG_CHIEU'
);

COMMIT;

BEGIN DBMS_OUTPUT.PUT_LINE('Inserted 5 movies'); END;
/

-- =============================================
-- SHOWTIMES
-- =============================================

-- Avatar showtimes
INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (1, 1, SYSTIMESTAMP + INTERVAL '1' DAY + INTERVAL '10' HOUR, 150000);

INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (1, 1, SYSTIMESTAMP + INTERVAL '1' DAY + INTERVAL '14' HOUR, 150000);

INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (1, 1, SYSTIMESTAMP + INTERVAL '1' DAY + INTERVAL '19' HOUR, 180000);

-- Oppenheimer showtimes
INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (2, 2, SYSTIMESTAMP + INTERVAL '1' DAY + INTERVAL '13' HOUR, 200000);

INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (2, 3, SYSTIMESTAMP + INTERVAL '2' DAY + INTERVAL '10' HOUR, 90000);

-- Dune showtimes
INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (4, 1, SYSTIMESTAMP + INTERVAL '2' DAY + INTERVAL '15' HOUR, 150000);

INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve)
VALUES (4, 3, SYSTIMESTAMP + INTERVAL '2' DAY + INTERVAL '20' HOUR, 100000);

-- Mai showtimes
-- Note: Movie 5 showtimes depend on ma_phim=5 existing
-- If Mai movie insert failed, these will also fail

COMMIT;

BEGIN DBMS_OUTPUT.PUT_LINE('Inserted 7 showtimes'); END;
/

-- =============================================
-- ADMIN USER (password: admin123)
-- =============================================

DECLARE
    v_success NUMBER;
    v_message VARCHAR2(200);
    v_ma_nguoi_dung NUMBER;
BEGIN
    pkg_user_management.dang_ky_nguoi_dung(
        p_ten_dang_nhap => 'admin',
        p_mat_khau => 'admin123',
        p_ho_ten => 'System Administrator',
        p_email => 'admin@cinemahub.com',
        p_so_dien_thoai => '0901234567',
        p_ngay_sinh => TO_DATE('1990-01-01', 'YYYY-MM-DD'),
        p_gioi_tinh => 'O',
        p_dia_chi => 'TP. Hồ Chí Minh',
        p_success => v_success,
        p_message => v_message,
        p_ma_nguoi_dung => v_ma_nguoi_dung
    );
    
    IF v_success = 1 THEN
        UPDATE NGUOI_DUNG SET vai_tro = 'ADMIN' WHERE ma_nguoi_dung = v_ma_nguoi_dung;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Admin user created: admin / admin123');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Admin creation failed: ' || v_message);
    END IF;
END;
/

-- =============================================
-- STAFF USER (password: staff123)
-- =============================================

DECLARE
    v_success NUMBER;
    v_message VARCHAR2(200);
    v_ma_nguoi_dung NUMBER;
BEGIN
    pkg_user_management.dang_ky_nguoi_dung(
        p_ten_dang_nhap => 'staff',
        p_mat_khau => 'staff123',
        p_ho_ten => 'Nhân Viên Quầy',
        p_email => 'staff@cinemahub.com',
        p_so_dien_thoai => '0901234568',
        p_ngay_sinh => TO_DATE('1995-05-15', 'YYYY-MM-DD'),
        p_gioi_tinh => 'F',
        p_dia_chi => 'TP. Hồ Chí Minh',
        p_success => v_success,
        p_message => v_message,
        p_ma_nguoi_dung => v_ma_nguoi_dung
    );
    
    IF v_success = 1 THEN
        UPDATE NGUOI_DUNG SET vai_tro = 'NHAN_VIEN' WHERE ma_nguoi_dung = v_ma_nguoi_dung;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Staff user created: staff / staff123');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Staff creation failed: ' || v_message);
    END IF;
END;
/

-- =============================================
-- DEMO CUSTOMER (password: demo123)
-- =============================================

DECLARE
    v_success NUMBER;
    v_message VARCHAR2(200);
    v_ma_nguoi_dung NUMBER;
BEGIN
    pkg_user_management.dang_ky_nguoi_dung(
        p_ten_dang_nhap => 'demo',
        p_mat_khau => 'demo123',
        p_ho_ten => 'Nguyễn Văn Demo',
        p_email => 'demo@gmail.com',
        p_so_dien_thoai => '0909123456',
        p_ngay_sinh => TO_DATE('1998-08-20', 'YYYY-MM-DD'),
        p_gioi_tinh => 'M',
        p_dia_chi => 'Quận 7, TP. Hồ Chí Minh',
        p_success => v_success,
        p_message => v_message,
        p_ma_nguoi_dung => v_ma_nguoi_dung
    );
    
    IF v_success = 1 THEN
        DBMS_OUTPUT.PUT_LINE('Demo user created: demo / demo123');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Demo user creation failed: ' || v_message);
    END IF;
END;
/

COMMIT;

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('==============================================');
    DBMS_OUTPUT.PUT_LINE('   CINEMA HUB DATABASE SETUP COMPLETE!');
    DBMS_OUTPUT.PUT_LINE('==============================================');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Database: CINEMA_DB / cinema123');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Test Accounts (SHA-512 encrypted passwords):');
    DBMS_OUTPUT.PUT_LINE('  Admin:    admin / admin123');
    DBMS_OUTPUT.PUT_LINE('  Staff:    staff / staff123');
    DBMS_OUTPUT.PUT_LINE('  Customer: demo / demo123');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Sample Data:');
    DBMS_OUTPUT.PUT_LINE('  - 4 Theaters');
    DBMS_OUTPUT.PUT_LINE('  - 7 Rooms with seats');
    DBMS_OUTPUT.PUT_LINE('  - 5 Movies');
    DBMS_OUTPUT.PUT_LINE('  - 7 Showtimes');
    DBMS_OUTPUT.PUT_LINE('');
END;
/
