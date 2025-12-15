-- =============================================
-- CINEMA HUB - 03. Database Schema (Tables, Indexes, Views)
-- Run as CINEMA_DB user
-- =============================================

SET SERVEROUTPUT ON;
SET DEFINE OFF;

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE NGUOI_DUNG (
    ma_nguoi_dung         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_dang_nhap         VARCHAR2(50) NOT NULL UNIQUE,
    mat_khau              VARCHAR2(200) NOT NULL,
    salt                  VARCHAR2(100),
    ho_ten                NVARCHAR2(100),
    email                 VARCHAR2(100) NOT NULL UNIQUE,
    so_dien_thoai         VARCHAR2(15),
    ngay_sinh             DATE,
    gioi_tinh             CHAR(1) CHECK (gioi_tinh IN ('M', 'F', 'O')),
    dia_chi               CLOB,
    vai_tro               VARCHAR2(20) DEFAULT 'KHACH_HANG' 
                              CHECK (vai_tro IN ('ADMIN', 'NHAN_VIEN', 'KHACH_HANG')),
    trang_thai            VARCHAR2(20) DEFAULT 'HOAT_DONG' 
                              CHECK (trang_thai IN ('HOAT_DONG', 'KHOA', 'CHUA_KICH_HOAT')),
    diem_tich_luy         NUMBER(15) DEFAULT 0,
    ngay_dang_ky          TIMESTAMP DEFAULT SYSTIMESTAMP,
    so_lan_dang_nhap_sai  NUMBER DEFAULT 0,
    created_at            TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at            TIMESTAMP
);

-- Movies table
CREATE TABLE PHIM (
    ma_phim        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_phim       NVARCHAR2(200) NOT NULL,
    mo_ta          CLOB,
    the_loai       NVARCHAR2(200),
    dao_dien       NVARCHAR2(100),
    dien_vien      CLOB,
    thoi_luong     NUMBER,
    ngay_khoi_chieu DATE,
    ngay_ket_thuc  DATE,
    nuoc_san_xuat  NVARCHAR2(100),
    nha_san_xuat   NVARCHAR2(200),
    poster_url     VARCHAR2(500),
    trailer_url    VARCHAR2(500),
    trang_thai     VARCHAR2(20) DEFAULT 'SAP_CHIEU' 
                      CHECK (trang_thai IN ('SAP_CHIEU', 'DANG_CHIEU', 'NGUNG_CHIEU')),
    created_at     TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at     TIMESTAMP,
    created_by     NUMBER
);

-- Theaters table
CREATE TABLE RAP_CHIEU (
    ma_rap        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_rap       NVARCHAR2(200) NOT NULL,
    dia_chi       CLOB,
    so_dien_thoai VARCHAR2(15),
    email         VARCHAR2(100),
    trang_thai    VARCHAR2(20) DEFAULT 'HOAT_DONG' 
                      CHECK (trang_thai IN ('HOAT_DONG', 'DUNG_HOAT_DONG', 'BAO_TRI')),
    created_at    TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at    TIMESTAMP
);

-- Rooms table
CREATE TABLE PHONG_CHIEU (
    ma_phong      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_rap        NUMBER NOT NULL,
    ten_phong     VARCHAR2(50) NOT NULL,
    so_ghe        NUMBER DEFAULT 0,
    so_hang_ghe   NUMBER,
    so_ghe_moi_hang NUMBER,
    loai_phong    VARCHAR2(50) DEFAULT 'THUONG' 
                      CHECK (loai_phong IN ('THUONG', 'VIP', 'IMAX', '4DX', 'GOLD_CLASS')),
    trang_thai    VARCHAR2(20) DEFAULT 'SAN_SANG' 
                      CHECK (trang_thai IN ('SAN_SANG', 'DANG_BAO_TRI', 'NGUNG_HOAT_DONG')),
    created_at    TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at    TIMESTAMP,
    CONSTRAINT fk_phong_rap FOREIGN KEY (ma_rap) 
        REFERENCES RAP_CHIEU(ma_rap) ON DELETE CASCADE
);

-- Seats table
CREATE TABLE GHE_NGOI (
    ma_ghe       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_phong     NUMBER NOT NULL,
    ten_ghe      VARCHAR2(10) NOT NULL,
    loai_ghe     VARCHAR2(20) DEFAULT 'THUONG' 
                     CHECK (loai_ghe IN ('THUONG', 'VIP', 'DOI', 'SWEET_BOX')),
    vi_tri_hang  VARCHAR2(10) NOT NULL,
    vi_tri_cot   NUMBER NOT NULL,
    trang_thai   VARCHAR2(20) DEFAULT 'SAN_SANG' 
                     CHECK (trang_thai IN ('SAN_SANG', 'DANG_BAO_TRI', 'HU_HONG')),
    created_at   TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at   TIMESTAMP,
    CONSTRAINT fk_ghe_phong FOREIGN KEY (ma_phong) 
        REFERENCES PHONG_CHIEU(ma_phong) ON DELETE CASCADE,
    CONSTRAINT uk_ghe_trong_phong UNIQUE (ma_phong, ten_ghe)
);

-- Showtimes table
CREATE TABLE SUAT_CHIEU (
    ma_suat_chieu     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_phim           NUMBER NOT NULL,
    ma_phong          NUMBER NOT NULL,
    thoi_gian_bat_dau TIMESTAMP NOT NULL,
    thoi_gian_ket_thuc TIMESTAMP,
    gia_ve            NUMBER(12) NOT NULL,
    trang_thai        VARCHAR2(20) DEFAULT 'SAN_SANG' 
                         CHECK (trang_thai IN ('SAN_SANG', 'DANG_CHIEU', 'DA_CHIEU', 'HUY_CHIEU')),
    created_at        TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at        TIMESTAMP,
    created_by        NUMBER,
    CONSTRAINT fk_sc_phim FOREIGN KEY (ma_phim) 
        REFERENCES PHIM(ma_phim) ON DELETE CASCADE,
    CONSTRAINT fk_sc_phong FOREIGN KEY (ma_phong) 
        REFERENCES PHONG_CHIEU(ma_phong) ON DELETE CASCADE
);

-- Tickets table
CREATE TABLE VE (
    ma_ve                  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_suat_chieu          NUMBER NOT NULL,
    ma_ghe                 NUMBER NOT NULL,
    ma_nguoi_dat           NUMBER,
    ma_hoa_don             VARCHAR2(50),
    gia_ve                 NUMBER(12) NOT NULL,
    trang_thai             VARCHAR2(20) DEFAULT 'SAN_SANG' 
                               CHECK (trang_thai IN ('SAN_SANG', 'DA_DAT', 'DA_BAN', 'DA_HUY', 'DA_SU_DUNG')),
    ngay_dat               TIMESTAMP,
    ngay_thanh_toan        TIMESTAMP,
    phuong_thuc_thanh_toan VARCHAR2(50),
    created_at             TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at             TIMESTAMP,
    CONSTRAINT fk_ve_suat_chieu FOREIGN KEY (ma_suat_chieu) 
        REFERENCES SUAT_CHIEU(ma_suat_chieu) ON DELETE CASCADE,
    CONSTRAINT fk_ve_ghe FOREIGN KEY (ma_ghe) 
        REFERENCES GHE_NGOI(ma_ghe) ON DELETE CASCADE,
    CONSTRAINT fk_ve_nguoi_dat FOREIGN KEY (ma_nguoi_dat) 
        REFERENCES NGUOI_DUNG(ma_nguoi_dung) ON DELETE SET NULL,
    CONSTRAINT uk_ve_ghe_suat_chieu UNIQUE (ma_suat_chieu, ma_ghe)
);

-- Payments table
CREATE TABLE THANH_TOAN (
    ma_thanh_toan       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_hoa_don          VARCHAR2(50) NOT NULL UNIQUE,
    ma_nguoi_thanh_toan NUMBER,
    so_tien             NUMBER(15) NOT NULL,
    phuong_thuc         VARCHAR2(50) NOT NULL,
    trang_thai          VARCHAR2(20) DEFAULT 'CHO_XU_LY' 
                          CHECK (trang_thai IN ('CHO_XU_LY', 'THANH_CONG', 'THAT_BAI', 'HOAN_TIEN')),
    noi_dung            NVARCHAR2(500),
    created_at          TIMESTAMP DEFAULT SYSTIMESTAMP,
    updated_at          TIMESTAMP,
    CONSTRAINT fk_tt_nguoi_dung FOREIGN KEY (ma_nguoi_thanh_toan) 
        REFERENCES NGUOI_DUNG(ma_nguoi_dung) ON DELETE SET NULL
);

-- Payment details table
CREATE TABLE CHI_TIET_THANH_TOAN (
    ma_chi_tiet   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_thanh_toan NUMBER NOT NULL,
    ma_ve         NUMBER NOT NULL,
    gia_ve        NUMBER(12) NOT NULL,
    giam_gia      NUMBER(12) DEFAULT 0,
    thanh_tien    NUMBER(12) NOT NULL,
    created_at    TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT fk_cttt_thanh_toan FOREIGN KEY (ma_thanh_toan) 
        REFERENCES THANH_TOAN(ma_thanh_toan) ON DELETE CASCADE,
    CONSTRAINT fk_cttt_ve FOREIGN KEY (ma_ve) 
        REFERENCES VE(ma_ve) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE AUDIT_LOG (
    log_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name  VARCHAR2(50) NOT NULL,
    action_type VARCHAR2(20) NOT NULL,
    record_id   NUMBER,
    old_values  CLOB,
    new_values  CLOB,
    changed_by  VARCHAR2(100),
    changed_at  TIMESTAMP DEFAULT SYSTIMESTAMP,
    ip_address  VARCHAR2(50),
    mo_ta       VARCHAR2(1000)
);

-- Error log table
CREATE TABLE ERROR_LOG (
    error_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    error_code  VARCHAR2(20),
    error_msg   VARCHAR2(4000),
    error_type  VARCHAR2(50),
    stack_trace CLOB,
    procedure_name VARCHAR2(100),
    user_name   VARCHAR2(100),
    occurred_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    ip_address  VARCHAR2(50)
);

-- =============================================
-- INDEXES
-- =============================================

-- Note: idx_nguoi_dung_email not needed - UNIQUE constraint auto-creates index
CREATE INDEX idx_nguoi_dung_trang_thai ON NGUOI_DUNG(trang_thai);
CREATE INDEX idx_phim_ngay_chieu ON PHIM(ngay_khoi_chieu, ngay_ket_thuc);
CREATE INDEX idx_phim_trang_thai ON PHIM(trang_thai);
CREATE INDEX idx_suat_chieu_phim ON SUAT_CHIEU(ma_phim);
CREATE INDEX idx_suat_chieu_phong ON SUAT_CHIEU(ma_phong);
CREATE INDEX idx_suat_chieu_ngay_gio ON SUAT_CHIEU(thoi_gian_bat_dau);
CREATE INDEX idx_ve_suat_chieu ON VE(ma_suat_chieu);
CREATE INDEX idx_ve_nguoi_dat ON VE(ma_nguoi_dat);
CREATE INDEX idx_ve_trang_thai ON VE(trang_thai);
CREATE INDEX idx_thanh_toan_nguoi_tt ON THANH_TOAN(ma_nguoi_thanh_toan);
CREATE INDEX idx_thanh_toan_trang_thai ON THANH_TOAN(trang_thai);
CREATE INDEX idx_audit_log_table ON AUDIT_LOG(table_name);
CREATE INDEX idx_audit_log_changed_at ON AUDIT_LOG(changed_at);

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW VW_LICH_CHIEU_PHIM AS
SELECT 
    p.ma_phim, p.ten_phim, p.thoi_luong, p.poster_url, p.trailer_url, 
    p.trang_thai AS trang_thai_phim, p.the_loai,
    sc.ma_suat_chieu, sc.thoi_gian_bat_dau, sc.thoi_gian_ket_thuc, 
    sc.gia_ve, sc.trang_thai AS trang_thai_suat_chieu,
    pc.ma_phong, pc.ten_phong, pc.loai_phong,
    rc.ma_rap, rc.ten_rap, rc.dia_chi AS dia_chi_rap,
    (SELECT COUNT(*) FROM GHE_NGOI gn WHERE gn.ma_phong = pc.ma_phong) AS tong_so_ghe,
    (SELECT COUNT(*) FROM VE v WHERE v.ma_suat_chieu = sc.ma_suat_chieu 
     AND v.trang_thai IN ('DA_DAT', 'DA_BAN')) AS so_ghe_da_dat
FROM PHIM p 
JOIN SUAT_CHIEU sc ON p.ma_phim = sc.ma_phim 
JOIN PHONG_CHIEU pc ON sc.ma_phong = pc.ma_phong 
JOIN RAP_CHIEU rc ON pc.ma_rap = rc.ma_rap
WHERE sc.thoi_gian_bat_dau > SYSDATE 
ORDER BY sc.thoi_gian_bat_dau;

CREATE OR REPLACE VIEW VW_LICH_SU_DAT_VE AS
SELECT 
    v.ma_ve, v.ma_hoa_don, v.ma_nguoi_dat, 
    nd.ho_ten AS ten_nguoi_dat, nd.email AS email_nguoi_dat,
    v.ma_suat_chieu, p.ma_phim, p.ten_phim, p.poster_url,
    sc.thoi_gian_bat_dau, sc.thoi_gian_ket_thuc,
    pc.ma_phong, pc.ten_phong, rc.ma_rap, rc.ten_rap,
    g.ma_ghe, g.ten_ghe, g.loai_ghe,
    v.gia_ve, v.trang_thai, v.ngay_dat, v.ngay_thanh_toan
FROM VE v 
JOIN NGUOI_DUNG nd ON v.ma_nguoi_dat = nd.ma_nguoi_dung 
JOIN SUAT_CHIEU sc ON v.ma_suat_chieu = sc.ma_suat_chieu
JOIN PHIM p ON sc.ma_phim = p.ma_phim 
JOIN PHONG_CHIEU pc ON sc.ma_phong = pc.ma_phong 
JOIN RAP_CHIEU rc ON pc.ma_rap = rc.ma_rap
JOIN GHE_NGOI g ON v.ma_ghe = g.ma_ghe 
ORDER BY v.ngay_dat DESC;

CREATE OR REPLACE VIEW VW_GHE_TRONG AS
SELECT 
    sc.ma_suat_chieu, sc.thoi_gian_bat_dau, p.ma_phim, p.ten_phim,
    pc.ma_phong, pc.ten_phong, g.ma_ghe, g.ten_ghe, g.vi_tri_hang, g.vi_tri_cot, g.loai_ghe,
    CASE WHEN v.ma_ve IS NOT NULL AND v.trang_thai IN ('DA_DAT', 'DA_BAN') 
         THEN 'DA_DAT' ELSE 'SAN_SANG' END AS trang_thai_ghe
FROM SUAT_CHIEU sc 
JOIN PHIM p ON sc.ma_phim = p.ma_phim 
JOIN PHONG_CHIEU pc ON sc.ma_phong = pc.ma_phong 
JOIN GHE_NGOI g ON pc.ma_phong = g.ma_phong
LEFT JOIN VE v ON sc.ma_suat_chieu = v.ma_suat_chieu AND g.ma_ghe = v.ma_ghe 
WHERE sc.thoi_gian_bat_dau > SYSDATE 
ORDER BY sc.ma_suat_chieu, g.vi_tri_hang, g.vi_tri_cot;

BEGIN
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== Schema created successfully ===');
    DBMS_OUTPUT.PUT_LINE('Tables: NGUOI_DUNG, PHIM, RAP_CHIEU, PHONG_CHIEU, GHE_NGOI, SUAT_CHIEU, VE, THANH_TOAN');
    DBMS_OUTPUT.PUT_LINE('Views: VW_LICH_CHIEU_PHIM, VW_LICH_SU_DAT_VE, VW_GHE_TRONG');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Next: Run 04_procedures.sql');
END;
/
