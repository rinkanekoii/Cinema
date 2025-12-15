const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
    const { ma_suat_chieu, ma_ghe_list, phuong_thuc_thanh_toan } = req.body;

    if (!Array.isArray(ma_ghe_list) || ma_ghe_list.length === 0) {
        return res.status(400).json({ error: 'At least one seat must be selected' });
    }

    let connection;
    try {
        connection = await db.getPool().getConnection();
        
        await connection.execute(`BEGIN NULL; END;`);

        const bookingResults = [];
        let totalAmount = 0;

        for (const ma_ghe of ma_ghe_list) {
            const result = await connection.execute(
                `BEGIN
                    pkg_booking.sp_dat_ve(:ma_suat_chieu, :ma_ghe, :ma_nguoi_dat, :result);
                END;`,
                {
                    ma_suat_chieu,
                    ma_ghe,
                    ma_nguoi_dat: req.user.ma_nguoi_dung,
                    result: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
                }
            );

            if (result.outBinds.result !== 1) {
                await connection.rollback();
                return res.status(400).json({ error: `Failed to book seat ${ma_ghe}` });
            }

            const ticketInfo = await connection.execute(
                `SELECT ma_ve, gia_ve FROM VE 
                 WHERE ma_suat_chieu = :ma_suat_chieu 
                 AND ma_ghe = :ma_ghe 
                 AND ma_nguoi_dat = :ma_nguoi_dat
                 ORDER BY created_at DESC
                 FETCH FIRST 1 ROW ONLY`,
                { ma_suat_chieu, ma_ghe, ma_nguoi_dat: req.user.ma_nguoi_dung }
            );

            if (ticketInfo.rows.length > 0) {
                bookingResults.push(ticketInfo.rows[0]);
                totalAmount += ticketInfo.rows[0].GIA_VE;
            }
        }

        const maHoaDon = `HD${Date.now()}`;
        const paymentResult = await connection.execute(
            `INSERT INTO THANH_TOAN 
             (ma_hoa_don, ma_nguoi_thanh_toan, so_tien, phuong_thuc, trang_thai)
             VALUES (:ma_hoa_don, :ma_nguoi_dung, :so_tien, :phuong_thuc, 'CHO_XU_LY')
             RETURNING ma_thanh_toan INTO :ma_thanh_toan`,
            {
                ma_hoa_don: maHoaDon,
                ma_nguoi_dung: req.user.ma_nguoi_dung,
                so_tien: totalAmount,
                phuong_thuc: phuong_thuc_thanh_toan || 'CASH',
                ma_thanh_toan: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            }
        );

        const maThanhToan = paymentResult.outBinds.ma_thanh_toan[0];

        for (const ticket of bookingResults) {
            await connection.execute(
                `INSERT INTO CHI_TIET_THANH_TOAN 
                 (ma_thanh_toan, ma_ve, gia_ve, giam_gia, thanh_tien)
                 VALUES (:ma_thanh_toan, :ma_ve, :gia_ve, 0, :thanh_tien)`,
                {
                    ma_thanh_toan: maThanhToan,
                    ma_ve: ticket.MA_VE,
                    gia_ve: ticket.GIA_VE,
                    thanh_tien: ticket.GIA_VE
                }
            );

            await connection.execute(
                `UPDATE VE SET ma_hoa_don = :ma_hoa_don, 
                 ngay_dat = SYSTIMESTAMP, trang_thai = 'DA_DAT'
                 WHERE ma_ve = :ma_ve`,
                { ma_hoa_don: maHoaDon, ma_ve: ticket.MA_VE }
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Booking successful',
            ma_hoa_don: maHoaDon,
            ma_thanh_toan: maThanhToan,
            total_amount: totalAmount,
            tickets: bookingResults
        });

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Booking failed', details: error.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                console.error('Connection close error:', closeError);
            }
        }
    }
});

router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        const result = await db.execute(
            `SELECT * FROM VW_LICH_SU_DAT_VE 
             WHERE ma_nguoi_dat = :ma_nguoi_dung
             ORDER BY ngay_dat DESC`,
            { ma_nguoi_dung: req.user.ma_nguoi_dung }
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
    }
});

router.post('/payment/:ma_thanh_toan/complete', authMiddleware, async (req, res) => {
    try {
        await db.execute(
            `UPDATE THANH_TOAN 
             SET trang_thai = 'THANH_CONG',
                 updated_at = SYSTIMESTAMP
             WHERE ma_thanh_toan = :ma_thanh_toan
             AND ma_nguoi_thanh_toan = :ma_nguoi_dung`,
            {
                ma_thanh_toan: req.params.ma_thanh_toan,
                ma_nguoi_dung: req.user.ma_nguoi_dung
            }
        );

        await db.execute(
            `UPDATE VE 
             SET trang_thai = 'DA_BAN',
                 ngay_thanh_toan = SYSTIMESTAMP
             WHERE ma_hoa_don IN (
                 SELECT ma_hoa_don FROM THANH_TOAN 
                 WHERE ma_thanh_toan = :ma_thanh_toan
             )`,
            { ma_thanh_toan: req.params.ma_thanh_toan }
        );

        res.json({ success: true, message: 'Payment completed successfully' });
    } catch (error) {
        console.error('Payment completion error:', error);
        res.status(500).json({ error: 'Payment completion failed', details: error.message });
    }
});

module.exports = router;
