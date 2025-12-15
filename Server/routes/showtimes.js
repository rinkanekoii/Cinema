const express = require('express');
const router = express.Router();
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
            `BEGIN
                pkg_movie_management.them_suat_chieu(
                    :ma_phim, :ma_phong, 
                    TO_TIMESTAMP(:thoi_gian_bat_dau, 'YYYY-MM-DD HH24:MI:SS'),
                    :gia_ve, :created_by, :ma_suat_chieu
                );
            END;`,
            {
                ma_phim, ma_phong, thoi_gian_bat_dau, gia_ve,
                created_by: req.user.ma_nguoi_dung,
                ma_suat_chieu: { dir: db.getPool().BIND_OUT, type: db.getPool().NUMBER }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Showtime created successfully',
            ma_suat_chieu: result.outBinds.ma_suat_chieu
        });
    } catch (error) {
        console.error('Create showtime error:', error);
        res.status(500).json({ error: 'Failed to create showtime', details: error.message });
    }
});

module.exports = router;
