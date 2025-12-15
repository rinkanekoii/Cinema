const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const db = require('../config/database');
const { authMiddleware, isStaff } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT * FROM VW_LICH_CHIEU_PHIM
             ORDER BY thoi_gian_bat_dau`
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get showtimes error:', error);
        res.status(500).json({ error: 'Failed to fetch showtimes', details: error.message });
    }
});

router.get('/:id/seats', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT g.ma_ghe, g.ten_ghe, g.loai_ghe, g.vi_tri_hang, g.vi_tri_cot,
                    CASE WHEN v.ma_ve IS NOT NULL AND v.trang_thai IN ('DA_DAT', 'DA_BAN') 
                         THEN 'DA_DAT' ELSE 'SAN_SANG' END AS trang_thai_ghe
             FROM SUAT_CHIEU sc
             JOIN PHONG_CHIEU pc ON sc.ma_phong = pc.ma_phong
             JOIN GHE_NGOI g ON pc.ma_phong = g.ma_phong
             LEFT JOIN VE v ON sc.ma_suat_chieu = v.ma_suat_chieu AND g.ma_ghe = v.ma_ghe
             WHERE sc.ma_suat_chieu = :id
             ORDER BY g.vi_tri_hang, g.vi_tri_cot`,
            { id: req.params.id }
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get seats error:', error);
        res.status(500).json({ error: 'Failed to fetch seats', details: error.message });
    }
});

router.post('/', authMiddleware, isStaff, async (req, res) => {
    const { ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve } = req.body;

    try {
        const result = await db.execute(
            `INSERT INTO SUAT_CHIEU (ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve, created_by)
             VALUES (:ma_phim, :ma_phong, TO_TIMESTAMP(REPLACE(:thoi_gian_bat_dau, 'T', ' '), 'YYYY-MM-DD HH24:MI'), :gia_ve, :created_by)
             RETURNING ma_suat_chieu INTO :ma_suat_chieu`,
            {
                ma_phim,
                ma_phong,
                thoi_gian_bat_dau,
                gia_ve,
                created_by: req.user.ma_nguoi_dung,
                ma_suat_chieu: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Thêm suất chiếu thành công',
            ma_suat_chieu: result.outBinds.ma_suat_chieu[0]
        });
    } catch (error) {
        console.error('Create showtime error:', error);
        res.status(500).json({ error: 'Thêm suất chiếu thất bại', details: error.message });
    }
});

// PUT - Update showtime
router.put('/:id', authMiddleware, isStaff, async (req, res) => {
    const { ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve, trang_thai } = req.body;

    try {
        await db.execute(
            `UPDATE SUAT_CHIEU SET 
                ma_phim = :ma_phim,
                ma_phong = :ma_phong,
                thoi_gian_bat_dau = TO_TIMESTAMP(REPLACE(:thoi_gian_bat_dau, 'T', ' '), 'YYYY-MM-DD HH24:MI'),
                gia_ve = :gia_ve,
                trang_thai = :trang_thai,
                updated_at = SYSTIMESTAMP
             WHERE ma_suat_chieu = :ma_suat_chieu`,
            { ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve, trang_thai, ma_suat_chieu: req.params.id }
        );

        res.json({ success: true, message: 'Cập nhật suất chiếu thành công' });
    } catch (error) {
        console.error('Update showtime error:', error);
        res.status(500).json({ error: 'Cập nhật suất chiếu thất bại', details: error.message });
    }
});

// DELETE - Delete showtime
router.delete('/:id', authMiddleware, isStaff, async (req, res) => {
    try {
        await db.execute(
            `DELETE FROM SUAT_CHIEU WHERE ma_suat_chieu = :ma_suat_chieu`,
            { ma_suat_chieu: req.params.id }
        );

        res.json({ success: true, message: 'Xóa suất chiếu thành công' });
    } catch (error) {
        console.error('Delete showtime error:', error);
        res.status(500).json({ error: 'Xóa suất chiếu thất bại', details: error.message });
    }
});

// GET theaters list
router.get('/theaters', async (req, res) => {
    try {
        const result = await db.execute(`SELECT * FROM RAP_CHIEU WHERE trang_thai = 'HOAT_DONG' ORDER BY ten_rap`);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get theaters error:', error);
        res.status(500).json({ error: 'Failed to fetch theaters', details: error.message });
    }
});

// GET rooms by theater
router.get('/theaters/:id/rooms', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT * FROM PHONG_CHIEU WHERE ma_rap = :ma_rap AND trang_thai = 'SAN_SANG' ORDER BY ten_phong`,
            { ma_rap: req.params.id }
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms', details: error.message });
    }
});

module.exports = router;
