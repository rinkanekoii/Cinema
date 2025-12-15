const express = require('express');
const router = express.Router();

const mockMovies = [
    {
        MA_PHIM: 1,
        TEN_PHIM: 'Avatar: The Way of Water',
        MO_TA: 'Jake Sully sống cùng gia đình mới của mình trên hành tinh Pandora. Khi một mối đe dọa quen thuộc trở lại để kết thúc những gì đã bắt đầu trước đây, Jake phải làm việc với Neytiri và quân đội của chủng tộc Na\'vi để bảo vệ hành tinh của họ.',
        THE_LOAI: 'Hành động, Khoa học viễn tưởng',
        DAO_DIEN: 'James Cameron',
        DIEN_VIEN: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
        THOI_LUONG: 192,
        NGAY_KHOI_CHIEU: '2024-01-15',
        NGAY_KET_THUC: '2024-03-15',
        NUOC_SAN_XUAT: 'Mỹ',
        NHA_SAN_XUAT: '20th Century Studios',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        TRAILER_URL: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        TRANG_THAI: 'DANG_CHIEU'
    },
    {
        MA_PHIM: 2,
        TEN_PHIM: 'Oppenheimer',
        MO_TA: 'Câu chuyện về nhà vật lý lý thuyết người Mỹ J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.',
        THE_LOAI: 'Tiểu sử, Lịch sử, Drama',
        DAO_DIEN: 'Christopher Nolan',
        DIEN_VIEN: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
        THOI_LUONG: 180,
        NGAY_KHOI_CHIEU: '2024-01-20',
        NGAY_KET_THUC: '2024-03-20',
        NUOC_SAN_XUAT: 'Mỹ, Anh',
        NHA_SAN_XUAT: 'Universal Pictures',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        TRAILER_URL: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        TRANG_THAI: 'DANG_CHIEU'
    },
    {
        MA_PHIM: 3,
        TEN_PHIM: 'Deadpool & Wolverine',
        MO_TA: 'Deadpool và Wolverine hợp tác trong một cuộc phiêu lưu hoành tráng đầy hành động và hài hước.',
        THE_LOAI: 'Hành động, Hài, Siêu anh hùng',
        DAO_DIEN: 'Shawn Levy',
        DIEN_VIEN: 'Ryan Reynolds, Hugh Jackman',
        THOI_LUONG: 128,
        NGAY_KHOI_CHIEU: '2024-02-01',
        NGAY_KET_THUC: '2024-04-01',
        NUOC_SAN_XUAT: 'Mỹ',
        NHA_SAN_XUAT: 'Marvel Studios',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        TRAILER_URL: 'https://www.youtube.com/watch?v=73_1biulkYk',
        TRANG_THAI: 'SAP_CHIEU'
    }
];

const mockShowtimes = [
    {
        MA_SUAT_CHIEU: 1,
        MA_PHIM: 1,
        TEN_PHIM: 'Avatar: The Way of Water',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        THOI_LUONG: 192,
        MA_PHONG: 1,
        TEN_PHONG: 'Phòng 1',
        LOAI_PHONG: 'IMAX',
        MA_RAP: 1,
        TEN_RAP: 'CGV Vincom',
        DIA_CHI_RAP: '72 Lê Thánh Tôn, Q1, TP.HCM',
        THOI_GIAN_BAT_DAU: new Date(Date.now() + 86400000).toISOString(),
        THOI_GIAN_KET_THUC: new Date(Date.now() + 97920000).toISOString(),
        GIA_VE: 150000,
        TRANG_THAI_SUAT_CHIEU: 'SAN_SANG',
        TONG_SO_GHE: 120,
        SO_GHE_DA_DAT: 45
    },
    {
        MA_SUAT_CHIEU: 2,
        MA_PHIM: 1,
        TEN_PHIM: 'Avatar: The Way of Water',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        THOI_LUONG: 192,
        MA_PHONG: 2,
        TEN_PHONG: 'Phòng 2',
        LOAI_PHONG: 'VIP',
        MA_RAP: 1,
        TEN_RAP: 'CGV Vincom',
        DIA_CHI_RAP: '72 Lê Thánh Tôn, Q1, TP.HCM',
        THOI_GIAN_BAT_DAU: new Date(Date.now() + 104400000).toISOString(),
        THOI_GIAN_KET_THUC: new Date(Date.now() + 116320000).toISOString(),
        GIA_VE: 120000,
        TRANG_THAI_SUAT_CHIEU: 'SAN_SANG',
        TONG_SO_GHE: 80,
        SO_GHE_DA_DAT: 20
    },
    {
        MA_SUAT_CHIEU: 3,
        MA_PHIM: 2,
        TEN_PHIM: 'Oppenheimer',
        POSTER_URL: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        THOI_LUONG: 180,
        MA_PHONG: 3,
        TEN_PHONG: 'Phòng 3',
        LOAI_PHONG: 'THUONG',
        MA_RAP: 2,
        TEN_RAP: 'Lotte Cinema',
        DIA_CHI_RAP: '469 Nguyễn Hữu Thọ, Q7, TP.HCM',
        THOI_GIAN_BAT_DAU: new Date(Date.now() + 93600000).toISOString(),
        THOI_GIAN_KET_THUC: new Date(Date.now() + 104400000).toISOString(),
        GIA_VE: 90000,
        TRANG_THAI_SUAT_CHIEU: 'SAN_SANG',
        TONG_SO_GHE: 100,
        SO_GHE_DA_DAT: 35
    }
];

router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running in DEMO mode', demo: true });
});

router.get('/movies', (req, res) => {
    const { trang_thai } = req.query;
    let movies = mockMovies;
    
    if (trang_thai) {
        movies = movies.filter(m => m.TRANG_THAI === trang_thai);
    }
    
    res.json({ success: true, data: movies, demo: true });
});

router.get('/movies/:id', (req, res) => {
    const movie = mockMovies.find(m => m.MA_PHIM == req.params.id);
    if (movie) {
        res.json({ success: true, data: movie, demo: true });
    } else {
        res.status(404).json({ error: 'Movie not found' });
    }
});

router.get('/movies/:id/showtimes', (req, res) => {
    const showtimes = mockShowtimes.filter(s => s.MA_PHIM == req.params.id);
    res.json({ success: true, data: showtimes, demo: true });
});

router.get('/showtimes', (req, res) => {
    res.json({ success: true, data: mockShowtimes, demo: true });
});

router.get('/showtimes/:id/seats', (req, res) => {
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 10;
    
    let seatId = 1;
    for (const row of rows) {
        for (let col = 1; col <= seatsPerRow; col++) {
            const isBooked = Math.random() > 0.7;
            const isVip = row === 'G' || row === 'H';
            
            seats.push({
                MA_GHE: seatId++,
                TEN_GHE: `${row}${col}`,
                LOAI_GHE: isVip ? 'VIP' : 'THUONG',
                VI_TRI_HANG: row,
                VI_TRI_COT: col,
                TRANG_THAI_GHE: isBooked ? 'DA_DAT' : 'SAN_SANG'
            });
        }
    }
    
    res.json({ success: true, data: seats, demo: true });
});

router.post('/auth/register', (req, res) => {
    res.json({
        success: false,
        error: 'Registration not available in demo mode',
        demo: true,
        message: 'Please set up database to use authentication features'
    });
});

router.post('/auth/login', (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body;
    
    // Demo accounts for testing
    const demoUsers = {
        'admin': { ma_nguoi_dung: 1, ten_dang_nhap: 'admin', ho_ten: 'Administrator', email: 'admin@cinemahub.com', vai_tro: 'ADMIN', password: 'admin123' },
        'staff': { ma_nguoi_dung: 2, ten_dang_nhap: 'staff', ho_ten: 'Nhân Viên Demo', email: 'staff@cinemahub.com', vai_tro: 'NHAN_VIEN', password: 'staff123' },
        'user': { ma_nguoi_dung: 3, ten_dang_nhap: 'user', ho_ten: 'Người Dùng Demo', email: 'user@cinemahub.com', vai_tro: 'KHACH_HANG', password: 'user123' }
    };
    
    const demoUser = demoUsers[ten_dang_nhap];
    
    if (demoUser && demoUser.password === mat_khau) {
        const { password, ...userWithoutPassword } = demoUser;
        res.json({
            success: true,
            token: 'demo_token_' + Date.now(),
            user: userWithoutPassword,
            demo: true
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials. Demo accounts: admin/admin123, staff/staff123, user/user123',
            demo: true
        });
    }
});

router.post('/bookings', (req, res) => {
    res.json({
        success: false,
        error: 'Booking not available in demo mode',
        demo: true,
        message: 'Please set up database to book tickets'
    });
});

router.get('/bookings/my-bookings', (req, res) => {
    res.json({
        success: true,
        data: [],
        demo: true,
        message: 'No bookings in demo mode'
    });
});

// Admin Routes
router.post('/admin/movies', (req, res) => {
    const newMovie = {
        MA_PHIM: Date.now(),
        ...req.body,
        TEN_PHIM: req.body.ten_phim,
        MO_TA: req.body.mo_ta,
        THE_LOAI: req.body.the_loai,
        DAO_DIEN: req.body.dao_dien,
        DIEN_VIEN: req.body.dien_vien,
        THOI_LUONG: req.body.thoi_luong,
        NGAY_KHOI_CHIEU: req.body.ngay_khoi_chieu,
        NGAY_KET_THUC: req.body.ngay_ket_thuc,
        NUOC_SAN_XUAT: req.body.nuoc_san_xuat,
        POSTER_URL: req.body.poster_url,
        TRAILER_URL: req.body.trailer_url,
        TRANG_THAI: req.body.trang_thai || 'SAP_CHIEU'
    };
    mockMovies.push(newMovie);
    res.json({ success: true, message: 'Movie added successfully (demo)', data: newMovie });
});

router.put('/admin/movies/:id', (req, res) => {
    const movieIndex = mockMovies.findIndex(m => m.MA_PHIM == req.params.id);
    if (movieIndex !== -1) {
        mockMovies[movieIndex] = {
            ...mockMovies[movieIndex],
            TEN_PHIM: req.body.ten_phim || mockMovies[movieIndex].TEN_PHIM,
            MO_TA: req.body.mo_ta || mockMovies[movieIndex].MO_TA,
            THE_LOAI: req.body.the_loai || mockMovies[movieIndex].THE_LOAI,
            DAO_DIEN: req.body.dao_dien || mockMovies[movieIndex].DAO_DIEN,
            DIEN_VIEN: req.body.dien_vien || mockMovies[movieIndex].DIEN_VIEN,
            THOI_LUONG: req.body.thoi_luong || mockMovies[movieIndex].THOI_LUONG,
            NGAY_KHOI_CHIEU: req.body.ngay_khoi_chieu || mockMovies[movieIndex].NGAY_KHOI_CHIEU,
            NGAY_KET_THUC: req.body.ngay_ket_thuc || mockMovies[movieIndex].NGAY_KET_THUC,
            NUOC_SAN_XUAT: req.body.nuoc_san_xuat || mockMovies[movieIndex].NUOC_SAN_XUAT,
            POSTER_URL: req.body.poster_url || mockMovies[movieIndex].POSTER_URL,
            TRAILER_URL: req.body.trailer_url || mockMovies[movieIndex].TRAILER_URL,
            TRANG_THAI: req.body.trang_thai || mockMovies[movieIndex].TRANG_THAI
        };
        res.json({ success: true, message: 'Movie updated successfully (demo)', data: mockMovies[movieIndex] });
    } else {
        res.status(404).json({ success: false, error: 'Movie not found' });
    }
});

router.delete('/admin/movies/:id', (req, res) => {
    const movieIndex = mockMovies.findIndex(m => m.MA_PHIM == req.params.id);
    if (movieIndex !== -1) {
        mockMovies.splice(movieIndex, 1);
        res.json({ success: true, message: 'Movie deleted successfully (demo)' });
    } else {
        res.status(404).json({ success: false, error: 'Movie not found' });
    }
});

router.post('/admin/showtimes', (req, res) => {
    const newShowtime = {
        MA_SUAT_CHIEU: Date.now(),
        MA_PHIM: req.body.ma_phim,
        TEN_PHIM: mockMovies.find(m => m.MA_PHIM == req.body.ma_phim)?.TEN_PHIM || 'Unknown',
        MA_PHONG: req.body.ma_phong,
        TEN_PHONG: `Phòng ${req.body.ma_phong}`,
        TEN_RAP: 'Demo Cinema',
        THOI_GIAN_BAT_DAU: req.body.thoi_gian_bat_dau,
        GIA_VE: req.body.gia_ve
    };
    mockShowtimes.push(newShowtime);
    res.json({ success: true, message: 'Showtime added successfully (demo)', data: newShowtime });
});

router.delete('/admin/showtimes/:id', (req, res) => {
    const index = mockShowtimes.findIndex(s => s.MA_SUAT_CHIEU == req.params.id);
    if (index !== -1) {
        mockShowtimes.splice(index, 1);
        res.json({ success: true, message: 'Showtime deleted successfully (demo)' });
    } else {
        res.status(404).json({ success: false, error: 'Showtime not found' });
    }
});

module.exports = router;
