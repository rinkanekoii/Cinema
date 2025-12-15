async function loadShowtimes() {
    const showtimesList = document.getElementById('showtimesList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/showtimes`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const showtimesByMovie = {};
            
            data.data.forEach(showtime => {
                const movieId = showtime.MA_PHIM;
                if (!showtimesByMovie[movieId]) {
                    showtimesByMovie[movieId] = {
                        info: showtime,
                        times: []
                    };
                }
                showtimesByMovie[movieId].times.push(showtime);
            });
            
            showtimesList.innerHTML = Object.values(showtimesByMovie).map(movie => {
                const info = movie.info;
                
                return `
                    <div class="bg-gray-800 rounded-lg overflow-hidden">
                        <div class="md:flex">
                            <div class="md:w-1/4">
                                <img src="${info.POSTER_URL || '/images/placeholder.jpg'}" 
                                     alt="${info.TEN_PHIM}"
                                     class="w-full h-full object-cover"
                                     onerror="this.src='/images/placeholder.jpg'">
                            </div>
                            <div class="md:w-3/4 p-6">
                                <h2 class="text-3xl font-bold mb-4">${info.TEN_PHIM}</h2>
                                <p class="text-gray-400 mb-4">
                                    <i class="fas fa-clock"></i> ${info.THOI_LUONG} phút
                                </p>
                                
                                <div class="space-y-6">
                                    ${Object.entries(groupByTheater(movie.times)).map(([theater, times]) => `
                                        <div>
                                            <h3 class="text-xl font-semibold mb-3">
                                                <i class="fas fa-map-marker-alt text-red-500"></i> ${theater}
                                            </h3>
                                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                ${times.map(showtime => {
                                                    const time = new Date(showtime.THOI_GIAN_BAT_DAU);
                                                    const availableSeats = showtime.TONG_SO_GHE - showtime.SO_GHE_DA_DAT;
                                                    
                                                    return `
                                                        <a href="/booking.html?showtime=${showtime.MA_SUAT_CHIEU}"
                                                           class="block bg-gray-700 hover:bg-red-600 rounded-lg p-3 transition text-center">
                                                            <p class="text-xl font-bold">
                                                                ${time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <p class="text-xs text-gray-400">${showtime.TEN_PHONG}</p>
                                                            <p class="text-xs text-gray-400">Còn ${availableSeats} ghế</p>
                                                        </a>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            showtimesList.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-calendar-times text-6xl text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-400">Hiện chưa có lịch chiếu</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load showtimes error:', error);
        showtimesList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-xl text-gray-400">Lỗi tải lịch chiếu</p>
            </div>
        `;
    }
}

function groupByTheater(times) {
    const grouped = {};
    times.forEach(time => {
        const theater = `${time.TEN_RAP} - ${time.DIA_CHI_RAP}`;
        if (!grouped[theater]) {
            grouped[theater] = [];
        }
        grouped[theater].push(time);
    });
    return grouped;
}

document.addEventListener('DOMContentLoaded', loadShowtimes);
