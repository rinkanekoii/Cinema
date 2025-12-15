const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware, isStaff } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const { trang_thai } = req.query;
        let query = `SELECT * FROM PHIM WHERE 1=1`;
        const binds = {};

        if (trang_thai) {
            query += ` AND trang_thai = :trang_thai`;
            binds.trang_thai = trang_thai;
        }

        query += ` ORDER BY ngay_khoi_chieu DESC`;

        const result = await db.execute(query, binds);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get movies error:', error);
        res.status(500).json({ error: 'Failed to fetch movies', details: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT * FROM PHIM WHERE ma_phim = :id`,
            { id: req.params.id }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Get movie error:', error);
        res.status(500).json({ error: 'Failed to fetch movie', details: error.message });
    }
});

router.post('/', authMiddleware, isStaff, async (req, res) => {
    const {
        ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong,
        ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat,
        poster_url, trailer_url
    } = req.body;

    try {
        const result = await db.execute(
            `BEGIN
                pkg_movie_management.them_phim_moi(
                    :ten_phim, :mo_ta, :the_loai, :dao_dien, :dien_vien, :thoi_luong,
                    TO_DATE(:ngay_khoi_chieu, 'YYYY-MM-DD'), TO_DATE(:ngay_ket_thuc, 'YYYY-MM-DD'),
                    :nuoc_san_xuat, :nha_san_xuat, :poster_url, :trailer_url,
                    :created_by, :ma_phim
                );
            END;`,
            {
                ten_phim, mo_ta, the_loai, dao_dien, dien_vien, thoi_luong,
                ngay_khoi_chieu, ngay_ket_thuc, nuoc_san_xuat, nha_san_xuat,
                poster_url, trailer_url,
                created_by: req.user.ma_nguoi_dung,
                ma_phim: { dir: db.getPool().BIND_OUT, type: db.getPool().NUMBER }
            }
        );

        res.status(201).json({ 
            success: true, 
            message: 'Movie created successfully',
            ma_phim: result.outBinds.ma_phim 
        });
    } catch (error) {
        console.error('Create movie error:', error);
        res.status(500).json({ error: 'Failed to create movie', details: error.message });
    }
});

router.get('/:id/showtimes', async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT sc.*, pc.ten_phong, pc.loai_phong, rc.ten_rap, rc.dia_chi,
                    (SELECT COUNT(*) FROM VE v 
                     WHERE v.ma_suat_chieu = sc.ma_suat_chieu 
                     AND v.trang_thai IN ('DA_DAT', 'DA_BAN')) as so_ghe_da_dat,
                    pc.so_ghe as tong_so_ghe
             FROM SUAT_CHIEU sc
             JOIN PHONG_CHIEU pc ON sc.ma_phong = pc.ma_phong
             JOIN RAP_CHIEU rc ON pc.ma_rap = rc.ma_rap
             WHERE sc.ma_phim = :id
             AND sc.thoi_gian_bat_dau > SYSTIMESTAMP
             AND sc.trang_thai = 'SAN_SANG'
             ORDER BY sc.thoi_gian_bat_dau`,
            { id: req.params.id }
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get showtimes error:', error);
        res.status(500).json({ error: 'Failed to fetch showtimes', details: error.message });
    }
});

module.exports = router;
