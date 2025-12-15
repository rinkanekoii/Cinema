const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const { ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, ngay_sinh, gioi_tinh, dia_chi } = req.body;

    if (!ten_dang_nhap || !mat_khau || !email) {
        return res.status(400).json({ error: 'Missing required fields: ten_dang_nhap, mat_khau, email' });
    }

    if (ten_dang_nhap.length < 3) {
        return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
    }

    if (mat_khau.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    try {
        const hashedPassword = await bcrypt.hash(mat_khau, 10);

        const result = await db.execute(
            `INSERT INTO NGUOI_DUNG (ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai, ngay_sinh, gioi_tinh, dia_chi, vai_tro, trang_thai)
             VALUES (:ten_dang_nhap, :mat_khau, :ho_ten, :email, :so_dien_thoai, 
                     TO_DATE(:ngay_sinh, 'YYYY-MM-DD'), :gioi_tinh, :dia_chi, 'KHACH_HANG', 'HOAT_DONG')
             RETURNING ma_nguoi_dung INTO :ma_nguoi_dung`,
            {
                ten_dang_nhap,
                mat_khau: hashedPassword,
                ho_ten: ho_ten || null,
                email,
                so_dien_thoai: so_dien_thoai || null,
                ngay_sinh: ngay_sinh || null,
                gioi_tinh: gioi_tinh || null,
                dia_chi: dia_chi || null,
                ma_nguoi_dung: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            ma_nguoi_dung: result.outBinds.ma_nguoi_dung[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.errorNum === 1) {
            return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
        }
        res.status(500).json({ error: 'Đăng ký thất bại', details: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body;

    if (!ten_dang_nhap || !mat_khau) {
        return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    try {
        const result = await db.execute(
            `SELECT ma_nguoi_dung, ten_dang_nhap, mat_khau, ho_ten, email, vai_tro, trang_thai, so_lan_dang_nhap_sai
             FROM NGUOI_DUNG
             WHERE ten_dang_nhap = :ten_dang_nhap`,
            { ten_dang_nhap }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const user = result.rows[0];

        if (user.TRANG_THAI === 'KHOA') {
            return res.status(403).json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' });
        }

        if (user.SO_LAN_DANG_NHAP_SAI >= 5) {
            await db.execute(
                `UPDATE NGUOI_DUNG SET trang_thai = 'KHOA', updated_at = SYSTIMESTAMP 
                 WHERE ma_nguoi_dung = :ma_nguoi_dung`,
                { ma_nguoi_dung: user.MA_NGUOI_DUNG }
            );
            return res.status(403).json({ error: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần' });
        }

        const isPasswordValid = await bcrypt.compare(mat_khau, user.MAT_KHAU);
        
        if (!isPasswordValid) {
            await db.execute(
                `UPDATE NGUOI_DUNG 
                 SET so_lan_dang_nhap_sai = so_lan_dang_nhap_sai + 1,
                     trang_thai = CASE WHEN so_lan_dang_nhap_sai + 1 >= 5 THEN 'KHOA' ELSE trang_thai END,
                     updated_at = SYSTIMESTAMP
                 WHERE ma_nguoi_dung = :ma_nguoi_dung`,
                { ma_nguoi_dung: user.MA_NGUOI_DUNG }
            );
            return res.status(401).json({ 
                error: 'Tên đăng nhập hoặc mật khẩu không đúng',
                attempts_left: 5 - (user.SO_LAN_DANG_NHAP_SAI + 1)
            });
        }

        await db.execute(
            `UPDATE NGUOI_DUNG 
             SET so_lan_dang_nhap_sai = 0, updated_at = SYSTIMESTAMP
             WHERE ma_nguoi_dung = :ma_nguoi_dung`,
            { ma_nguoi_dung: user.MA_NGUOI_DUNG }
        );

        const token = jwt.sign(
            {
                ma_nguoi_dung: user.MA_NGUOI_DUNG,
                ten_dang_nhap: user.TEN_DANG_NHAP,
                email: user.EMAIL,
                vai_tro: user.VAI_TRO
            },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                ma_nguoi_dung: user.MA_NGUOI_DUNG,
                ten_dang_nhap: user.TEN_DANG_NHAP,
                ho_ten: user.HO_TEN,
                email: user.EMAIL,
                vai_tro: user.VAI_TRO
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Đăng nhập thất bại', details: error.message });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT ma_nguoi_dung, ten_dang_nhap, ho_ten, email, so_dien_thoai, 
                    ngay_sinh, gioi_tinh, dia_chi, vai_tro, trang_thai, diem_tich_luy
             FROM NGUOI_DUNG
             WHERE ma_nguoi_dung = :ma_nguoi_dung`,
            { ma_nguoi_dung: req.user.ma_nguoi_dung }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Người dùng không tồn tại' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Không thể lấy thông tin người dùng', details: error.message });
    }
});

router.put('/profile', authMiddleware, async (req, res) => {
    const { ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, dia_chi } = req.body;

    try {
        await db.execute(
            `UPDATE NGUOI_DUNG 
             SET ho_ten = :ho_ten,
                 so_dien_thoai = :so_dien_thoai,
                 ngay_sinh = TO_DATE(:ngay_sinh, 'YYYY-MM-DD'),
                 gioi_tinh = :gioi_tinh,
                 dia_chi = :dia_chi,
                 updated_at = SYSTIMESTAMP
             WHERE ma_nguoi_dung = :ma_nguoi_dung`,
            {
                ho_ten: ho_ten || null,
                so_dien_thoai: so_dien_thoai || null,
                ngay_sinh: ngay_sinh || null,
                gioi_tinh: gioi_tinh || null,
                dia_chi: dia_chi || null,
                ma_nguoi_dung: req.user.ma_nguoi_dung
            }
        );

        res.json({ success: true, message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Cập nhật thông tin thất bại', details: error.message });
    }
});

router.post('/change-password', authMiddleware, async (req, res) => {
    const { mat_khau_cu, mat_khau_moi } = req.body;

    if (!mat_khau_cu || !mat_khau_moi) {
        return res.status(400).json({ error: 'Thiếu mật khẩu cũ hoặc mật khẩu mới' });
    }

    if (mat_khau_moi.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    try {
        const result = await db.execute(
            `SELECT mat_khau FROM NGUOI_DUNG WHERE ma_nguoi_dung = :ma_nguoi_dung`,
            { ma_nguoi_dung: req.user.ma_nguoi_dung }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Người dùng không tồn tại' });
        }

        const isPasswordValid = await bcrypt.compare(mat_khau_cu, result.rows[0].MAT_KHAU);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Mật khẩu cũ không đúng' });
        }

        const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);

        await db.execute(
            `UPDATE NGUOI_DUNG 
             SET mat_khau = :mat_khau, updated_at = SYSTIMESTAMP
             WHERE ma_nguoi_dung = :ma_nguoi_dung`,
            {
                mat_khau: hashedPassword,
                ma_nguoi_dung: req.user.ma_nguoi_dung
            }
        );

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Đổi mật khẩu thất bại', details: error.message });
    }
});

module.exports = router;
