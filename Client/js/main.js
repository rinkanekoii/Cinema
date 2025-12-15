async function loadMovies() {
    const moviesGrid = document.getElementById('moviesGrid');
    
    try {
        const response = await fetch(`${API_BASE_URL}/movies?trang_thai=DANG_CHIEU`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            moviesGrid.innerHTML = data.data.map(movie => `
                <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div class="relative h-96">
                        <img src="${movie.POSTER_URL || '/images/placeholder.jpg'}" 
                             alt="${movie.TEN_PHIM}" 
                             class="w-full h-full object-cover"
                             onerror="this.src='/images/placeholder.jpg'">
                        <div class="absolute top-2 right-2 bg-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                            ${movie.TRANG_THAI === 'DANG_CHIEU' ? 'Đang chiếu' : 'Sắp chiếu'}
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="text-xl font-bold mb-2 truncate">${movie.TEN_PHIM}</h3>
                        <div class="text-gray-400 text-sm mb-4">
                            <p><i class="fas fa-clock"></i> ${movie.THOI_LUONG} phút</p>
                            <p><i class="fas fa-theater-masks"></i> ${movie.THE_LOAI || 'Chưa cập nhật'}</p>
                        </div>
                        <a href="/movie-detail.html?id=${movie.MA_PHIM}" 
                           class="block w-full text-center py-2 bg-red-600 hover:bg-red-700 rounded transition">
                            Chi tiết
                        </a>
                    </div>
                </div>
            `).join('');
        } else {
            moviesGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-film text-6xl text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-400">Không có phim nào đang chiếu</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load movies error:', error);
        moviesGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-xl text-gray-400">Lỗi tải danh sách phim</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadMovies);
