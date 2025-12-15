const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

if (!movieId) {
    window.location.href = '/movies.html';
}

async function loadMovieDetail() {
    const detailSection = document.getElementById('movieDetail');
    
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        const data = await response.json();
        
        if (data.success) {
            const movie = data.data;
            detailSection.innerHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-1">
                        <img src="${movie.POSTER_URL || '/images/placeholder.jpg'}" 
                             alt="${movie.TEN_PHIM}"
                             class="w-full rounded-lg shadow-2xl"
                             onerror="this.src='/images/placeholder.jpg'">
                    </div>
                    <div class="lg:col-span-2">
                        <h1 class="text-4xl font-bold mb-4">${movie.TEN_PHIM}</h1>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p class="text-gray-400">Thời lượng</p>
                                <p class="text-xl font-semibold">${movie.THOI_LUONG} phút</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Thể loại</p>
                                <p class="text-xl font-semibold">${movie.THE_LOAI || 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Đạo diễn</p>
                                <p class="text-xl font-semibold">${movie.DAO_DIEN || 'Chưa cập nhật'}</p>
                            </div>
                            <div>
                                <p class="text-gray-400">Quốc gia</p>
                                <p class="text-xl font-semibold">${movie.NUOC_SAN_XUAT || 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-xl font-bold mb-2">Mô tả</h3>
                            <p class="text-gray-300 leading-relaxed">${movie.MO_TA || 'Chưa có mô tả'}</p>
                        </div>
                        
                        ${movie.DIEN_VIEN ? `
                            <div class="mb-6">
                                <h3 class="text-xl font-bold mb-2">Diễn viên</h3>
                                <p class="text-gray-300">${movie.DIEN_VIEN}</p>
                            </div>
                        ` : ''}
                        
                        ${movie.TRAILER_URL ? `
                            <div class="mb-6">
                                <a href="${movie.TRAILER_URL}" target="_blank"
                                   class="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition">
                                    <i class="fas fa-play"></i> Xem Trailer
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            await loadShowtimes();
        } else {
            detailSection.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                    <p class="text-xl">Không tìm thấy thông tin phim</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load movie detail error:', error);
        detailSection.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-xl">Lỗi tải thông tin phim</p>
            </div>
        `;
    }
}

async function loadShowtimes() {
    const showtimesSection = document.getElementById('showtimesSection');
    const showtimesList = document.getElementById('showtimesList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}/showtimes`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            showtimesSection.classList.remove('hidden');
            
            const showtimesByDate = {};
            data.data.forEach(showtime => {
                const date = new Date(showtime.THOI_GIAN_BAT_DAU).toLocaleDateString('vi-VN');
                if (!showtimesByDate[date]) {
                    showtimesByDate[date] = [];
                }
                showtimesByDate[date].push(showtime);
            });
            
            showtimesList.innerHTML = Object.keys(showtimesByDate).map(date => `
                <div class="mb-6 bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">${date}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${showtimesByDate[date].map(showtime => {
                            const time = new Date(showtime.THOI_GIAN_BAT_DAU).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            const availableSeats = showtime.TONG_SO_GHE - showtime.SO_GHE_DA_DAT;
                            
                            return `
                                <div class="bg-gray-700 rounded-lg p-4">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <p class="text-2xl font-bold text-red-500">${time}</p>
                                            <p class="text-sm text-gray-400">${showtime.TEN_RAP}</p>
                                            <p class="text-sm text-gray-400">${showtime.TEN_PHONG} - ${showtime.LOAI_PHONG}</p>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <p class="text-sm text-gray-400">Còn ${availableSeats}/${showtime.TONG_SO_GHE} ghế</p>
                                        <p class="text-lg font-semibold text-yellow-500">${parseInt(showtime.GIA_VE).toLocaleString('vi-VN')} ₫</p>
                                    </div>
                                    <a href="/booking.html?showtime=${showtime.MA_SUAT_CHIEU}"
                                       class="block w-full text-center py-2 bg-red-600 hover:bg-red-700 rounded transition">
                                        Đặt vé
                                    </a>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load showtimes error:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadMovieDetail);
