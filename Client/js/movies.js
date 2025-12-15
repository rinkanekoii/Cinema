let allMovies = [];
let currentFilter = 'all';

async function loadMovies(filter = 'all') {
    const moviesGrid = document.getElementById('moviesGrid');
    
    try {
        let url = `${API_BASE_URL}/movies`;
        if (filter !== 'all') {
            url += `?trang_thai=${filter}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            allMovies = data.data;
            displayMovies(data.data);
        } else {
            moviesGrid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-film text-6xl text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-400">Không có phim nào</p>
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

function displayMovies(movies) {
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = movies.map(movie => {
        const statusText = {
            'DANG_CHIEU': 'Đang chiếu',
            'SAP_CHIEU': 'Sắp chiếu',
            'NGUNG_CHIEU': 'Ngưng chiếu'
        };
        
        return `
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div class="relative h-96">
                    <img src="${movie.POSTER_URL || '/images/placeholder.jpg'}" 
                         alt="${movie.TEN_PHIM}" 
                         class="w-full h-full object-cover"
                         onerror="this.src='/images/placeholder.jpg'">
                    <div class="absolute top-2 right-2 bg-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        ${statusText[movie.TRANG_THAI] || movie.TRANG_THAI}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="text-xl font-bold mb-2 line-clamp-2">${movie.TEN_PHIM}</h3>
                    <div class="text-gray-400 text-sm mb-4 space-y-1">
                        <p><i class="fas fa-clock"></i> ${movie.THOI_LUONG} phút</p>
                        <p><i class="fas fa-theater-masks"></i> ${movie.THE_LOAI || 'Chưa cập nhật'}</p>
                        <p><i class="fas fa-user-tie"></i> ${movie.DAO_DIEN || 'Chưa cập nhật'}</p>
                    </div>
                    <a href="/movie-detail.html?id=${movie.MA_PHIM}" 
                       class="block w-full text-center py-2 bg-red-600 hover:bg-red-700 rounded transition">
                        Chi tiết & Đặt vé
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function filterMovies(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-red-600');
        btn.classList.add('bg-gray-700');
    });
    
    event.target.classList.add('active', 'bg-red-600');
    event.target.classList.remove('bg-gray-700');
    
    loadMovies(filter);
}

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
});
