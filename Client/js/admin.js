const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    initTabs();
    initModals();
    loadDashboardStats();
    loadMovies();
});

function checkAdminAccess() {
    const user = getUser();
    if (!user) {
        alert('Vui lòng đăng nhập để truy cập trang này');
        window.location.href = '/login.html';
        return;
    }
    
    if (user.vai_tro !== 'ADMIN' && user.vai_tro !== 'NHAN_VIEN') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = '/';
        return;
    }
    
    document.getElementById('adminName').textContent = user.ho_ten || user.ten_dang_nhap;
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
        window.location.href = '/';
    });
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => {
                b.classList.remove('active', 'border-b-2', 'border-red-500', 'text-red-500');
                b.classList.add('text-gray-400');
            });
            btn.classList.add('active', 'border-b-2', 'border-red-500', 'text-red-500');
            btn.classList.remove('text-gray-400');
            
            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
            
            switch(tabName) {
                case 'movies': loadMovies(); break;
                case 'showtimes': loadShowtimes(); break;
                case 'theaters': loadTheaters(); break;
                case 'users': loadUsers(); break;
            }
        });
    });
}

function initModals() {
    // Movie Modal
    const movieModal = document.getElementById('movieModal');
    document.getElementById('addMovieBtn').addEventListener('click', () => {
        document.getElementById('movieModalTitle').textContent = 'Thêm Phim Mới';
        document.getElementById('movieForm').reset();
        document.getElementById('movieId').value = '';
        movieModal.classList.remove('hidden');
        movieModal.classList.add('flex');
    });
    
    document.getElementById('closeMovieModal').addEventListener('click', () => closeModal('movieModal'));
    document.getElementById('cancelMovieBtn').addEventListener('click', () => closeModal('movieModal'));
    
    document.getElementById('movieForm').addEventListener('submit', handleMovieSubmit);
    
    // Showtime Modal
    const showtimeModal = document.getElementById('showtimeModal');
    document.getElementById('addShowtimeBtn').addEventListener('click', async () => {
        await loadMoviesForSelect();
        await loadTheatersForSelect();
        document.getElementById('showtimeForm').reset();
        showtimeModal.classList.remove('hidden');
        showtimeModal.classList.add('flex');
    });
    
    document.getElementById('closeShowtimeModal').addEventListener('click', () => closeModal('showtimeModal'));
    document.getElementById('cancelShowtimeBtn').addEventListener('click', () => closeModal('showtimeModal'));
    
    document.getElementById('showtimeForm').addEventListener('submit', handleShowtimeSubmit);
    
    // Delete Modal
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal('deleteModal'));
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform ${isError ? 'bg-red-600' : 'bg-green-600'} text-white`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

async function loadDashboardStats() {
    try {
        const [moviesRes, showtimesRes] = await Promise.all([
            fetch(`${API_BASE}/movies`),
            fetch(`${API_BASE}/showtimes`)
        ]);
        
        const moviesData = await moviesRes.json();
        const showtimesData = await showtimesRes.json();
        
        document.getElementById('totalMovies').textContent = moviesData.data?.length || 0;
        document.getElementById('totalShowtimes').textContent = showtimesData.data?.length || 0;
        document.getElementById('todayBookings').textContent = Math.floor(Math.random() * 50) + 10;
        document.getElementById('totalRevenue').textContent = formatCurrency(Math.floor(Math.random() * 50000000) + 10000000);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadMovies() {
    try {
        const response = await fetch(`${API_BASE}/movies`);
        const data = await response.json();
        
        const tbody = document.getElementById('moviesTableBody');
        tbody.innerHTML = '';
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(movie => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-700 hover:bg-gray-750';
                tr.innerHTML = `
                    <td class="px-4 py-3">${movie.MA_PHIM}</td>
                    <td class="px-4 py-3">
                        <img src="${movie.POSTER_URL || 'https://via.placeholder.com/50x75'}" 
                             alt="${movie.TEN_PHIM}" class="w-12 h-18 object-cover rounded">
                    </td>
                    <td class="px-4 py-3 font-semibold">${movie.TEN_PHIM}</td>
                    <td class="px-4 py-3">${movie.THE_LOAI || '-'}</td>
                    <td class="px-4 py-3">${movie.THOI_LUONG} phút</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded text-sm ${getStatusClass(movie.TRANG_THAI)}">
                            ${getStatusText(movie.TRANG_THAI)}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="editMovie(${movie.MA_PHIM})" class="text-blue-500 hover:text-blue-400 mx-1" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteMovie(${movie.MA_PHIM}, '${movie.TEN_PHIM}')" class="text-red-500 hover:text-red-400 mx-1" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">Chưa có phim nào</td></tr>';
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        showToast('Không thể tải danh sách phim', true);
    }
}

async function loadShowtimes() {
    try {
        const response = await fetch(`${API_BASE}/showtimes`);
        const data = await response.json();
        
        const tbody = document.getElementById('showtimesTableBody');
        tbody.innerHTML = '';
        
        if (data.data && data.data.length > 0) {
            data.data.forEach(st => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-700 hover:bg-gray-750';
                tr.innerHTML = `
                    <td class="px-4 py-3">${st.MA_SUAT_CHIEU}</td>
                    <td class="px-4 py-3 font-semibold">${st.TEN_PHIM}</td>
                    <td class="px-4 py-3">${st.TEN_RAP || '-'}</td>
                    <td class="px-4 py-3">${st.TEN_PHONG || '-'}</td>
                    <td class="px-4 py-3">${formatDateTime(st.THOI_GIAN_BAT_DAU)}</td>
                    <td class="px-4 py-3">${formatCurrency(st.GIA_VE)}</td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="deleteShowtime(${st.MA_SUAT_CHIEU})" class="text-red-500 hover:text-red-400 mx-1" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">Chưa có suất chiếu nào</td></tr>';
        }
    } catch (error) {
        console.error('Error loading showtimes:', error);
        showToast('Không thể tải danh sách suất chiếu', true);
    }
}

async function loadTheaters() {
    const theatersGrid = document.getElementById('theatersGrid');
    theatersGrid.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-red-500"></i></div>';
    
    try {
        const response = await fetch(`${API_BASE}/showtimes/theaters`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            theatersGrid.innerHTML = data.data.map(theater => `
                <div class="bg-gray-800 rounded-xl p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold">${theater.TEN_RAP}</h3>
                        <span class="bg-green-600 px-2 py-1 rounded text-sm">${theater.TRANG_THAI === 'HOAT_DONG' ? 'Hoạt động' : theater.TRANG_THAI}</span>
                    </div>
                    <p class="text-gray-400 mb-2"><i class="fas fa-map-marker-alt mr-2"></i>${theater.DIA_CHI || 'Chưa cập nhật'}</p>
                    <p class="text-gray-400 mb-4"><i class="fas fa-phone mr-2"></i>${theater.SO_DIEN_THOAI || 'Chưa cập nhật'}</p>
                </div>
            `).join('');
        } else {
            theatersGrid.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có rạp chiếu nào</div>';
        }
    } catch (error) {
        console.error('Error loading theaters:', error);
        theatersGrid.innerHTML = '<div class="text-center py-8 text-red-500">Lỗi tải danh sách rạp</div>';
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    
    const mockUsers = [
        { MA_NGUOI_DUNG: 1, TEN_DANG_NHAP: 'admin', HO_TEN: 'Administrator', EMAIL: 'admin@cinemahub.com', VAI_TRO: 'ADMIN', TRANG_THAI: 'ACTIVE' },
        { MA_NGUOI_DUNG: 2, TEN_DANG_NHAP: 'staff01', HO_TEN: 'Nhân Viên 1', EMAIL: 'staff01@cinemahub.com', VAI_TRO: 'NHAN_VIEN', TRANG_THAI: 'ACTIVE' },
        { MA_NGUOI_DUNG: 3, TEN_DANG_NHAP: 'user01', HO_TEN: 'Nguyễn Văn A', EMAIL: 'user01@gmail.com', VAI_TRO: 'KHACH_HANG', TRANG_THAI: 'ACTIVE' }
    ];
    
    tbody.innerHTML = mockUsers.map(user => `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
            <td class="px-4 py-3">${user.MA_NGUOI_DUNG}</td>
            <td class="px-4 py-3">${user.TEN_DANG_NHAP}</td>
            <td class="px-4 py-3 font-semibold">${user.HO_TEN}</td>
            <td class="px-4 py-3">${user.EMAIL}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-sm ${getRoleClass(user.VAI_TRO)}">${getRoleText(user.VAI_TRO)}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-sm ${user.TRANG_THAI === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}">
                    ${user.TRANG_THAI === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                </span>
            </td>
            <td class="px-4 py-3 text-center">
                <button class="text-blue-500 hover:text-blue-400 mx-1" title="Sửa vai trò">
                    <i class="fas fa-user-cog"></i>
                </button>
                <button class="text-yellow-500 hover:text-yellow-400 mx-1" title="${user.TRANG_THAI === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}">
                    <i class="fas fa-${user.TRANG_THAI === 'ACTIVE' ? 'lock' : 'unlock'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleMovieSubmit(e) {
    e.preventDefault();
    
    const movieData = {
        ten_phim: document.getElementById('tenPhim').value,
        mo_ta: document.getElementById('moTa').value,
        the_loai: document.getElementById('theLoai').value,
        dao_dien: document.getElementById('daoDien').value,
        dien_vien: document.getElementById('dienVien').value,
        thoi_luong: parseInt(document.getElementById('thoiLuong').value),
        ngay_khoi_chieu: document.getElementById('ngayKhoiChieu').value,
        ngay_ket_thuc: document.getElementById('ngayKetThuc').value,
        nuoc_san_xuat: document.getElementById('nuocSanXuat').value,
        trang_thai: document.getElementById('trangThai').value,
        poster_url: document.getElementById('posterUrl').value,
        trailer_url: document.getElementById('trailerUrl').value
    };
    
    const movieId = document.getElementById('movieId').value;
    
    try {
        const response = await fetch(`${API_BASE}/admin/movies${movieId ? `/${movieId}` : ''}`, {
            method: movieId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(movieData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(movieId ? 'Cập nhật phim thành công!' : 'Thêm phim thành công!');
            closeModal('movieModal');
            loadMovies();
            loadDashboardStats();
        } else {
            showToast(data.error || 'Có lỗi xảy ra', true);
        }
    } catch (error) {
        console.error('Error saving movie:', error);
        showToast('Không thể lưu phim', true);
    }
}

async function handleShowtimeSubmit(e) {
    e.preventDefault();
    
    const showtimeData = {
        ma_phim: document.getElementById('stPhim').value,
        ma_phong: document.getElementById('stPhong').value,
        thoi_gian_bat_dau: document.getElementById('stThoiGian').value,
        gia_ve: parseInt(document.getElementById('stGiaVe').value)
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/showtimes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(showtimeData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Thêm suất chiếu thành công!');
            closeModal('showtimeModal');
            loadShowtimes();
            loadDashboardStats();
        } else {
            showToast(data.error || 'Có lỗi xảy ra', true);
        }
    } catch (error) {
        console.error('Error saving showtime:', error);
        showToast('Không thể lưu suất chiếu', true);
    }
}

async function editMovie(movieId) {
    try {
        const response = await fetch(`${API_BASE}/movies/${movieId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const movie = data.data;
            document.getElementById('movieModalTitle').textContent = 'Chỉnh Sửa Phim';
            document.getElementById('movieId').value = movie.MA_PHIM;
            document.getElementById('tenPhim').value = movie.TEN_PHIM || '';
            document.getElementById('moTa').value = movie.MO_TA || '';
            document.getElementById('theLoai').value = movie.THE_LOAI || '';
            document.getElementById('daoDien').value = movie.DAO_DIEN || '';
            document.getElementById('dienVien').value = movie.DIEN_VIEN || '';
            document.getElementById('thoiLuong').value = movie.THOI_LUONG || '';
            document.getElementById('ngayKhoiChieu').value = movie.NGAY_KHOI_CHIEU?.split('T')[0] || '';
            document.getElementById('ngayKetThuc').value = movie.NGAY_KET_THUC?.split('T')[0] || '';
            document.getElementById('nuocSanXuat').value = movie.NUOC_SAN_XUAT || '';
            document.getElementById('trangThai').value = movie.TRANG_THAI || 'SAP_CHIEU';
            document.getElementById('posterUrl').value = movie.POSTER_URL || '';
            document.getElementById('trailerUrl').value = movie.TRAILER_URL || '';
            
            const modal = document.getElementById('movieModal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error) {
        console.error('Error loading movie:', error);
        showToast('Không thể tải thông tin phim', true);
    }
}

let deleteCallback = null;

function deleteMovie(movieId, movieName) {
    document.getElementById('deleteMessage').textContent = `Bạn có chắc chắn muốn xóa phim "${movieName}"?`;
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/movies/${movieId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Xóa phim thành công!');
                loadMovies();
                loadDashboardStats();
            } else {
                showToast(data.error || 'Không thể xóa phim', true);
            }
        } catch (error) {
            console.error('Error deleting movie:', error);
            showToast('Không thể xóa phim', true);
        }
        closeModal('deleteModal');
    };
    
    document.getElementById('confirmDeleteBtn').onclick = deleteCallback;
    
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function deleteShowtime(showtimeId) {
    document.getElementById('deleteMessage').textContent = `Bạn có chắc chắn muốn xóa suất chiếu #${showtimeId}?`;
    
    deleteCallback = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/showtimes/${showtimeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Xóa suất chiếu thành công!');
                loadShowtimes();
                loadDashboardStats();
            } else {
                showToast(data.error || 'Không thể xóa suất chiếu', true);
            }
        } catch (error) {
            console.error('Error deleting showtime:', error);
            showToast('Không thể xóa suất chiếu', true);
        }
        closeModal('deleteModal');
    };
    
    document.getElementById('confirmDeleteBtn').onclick = deleteCallback;
    
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function loadMoviesForSelect() {
    try {
        const response = await fetch(`${API_BASE}/movies`);
        const data = await response.json();
        
        const select = document.getElementById('stPhim');
        select.innerHTML = '<option value="">-- Chọn phim --</option>';
        
        if (data.data) {
            data.data.forEach(movie => {
                select.innerHTML += `<option value="${movie.MA_PHIM}">${movie.TEN_PHIM}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading movies for select:', error);
    }
}

async function loadTheatersForSelect() {
    const select = document.getElementById('stRap');
    select.innerHTML = '<option value="">-- Chọn rạp --</option>';
    
    try {
        const response = await fetch(`${API_BASE}/showtimes/theaters`);
        const data = await response.json();
        
        if (data.success && data.data) {
            data.data.forEach(theater => {
                select.innerHTML += `<option value="${theater.MA_RAP}">${theater.TEN_RAP}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading theaters:', error);
    }
    
    select.addEventListener('change', async () => {
        const roomSelect = document.getElementById('stPhong');
        roomSelect.innerHTML = '<option value="">-- Chọn phòng --</option>';
        
        if (select.value) {
            try {
                const response = await fetch(`${API_BASE}/showtimes/theaters/${select.value}/rooms`);
                const data = await response.json();
                
                if (data.success && data.data) {
                    data.data.forEach(room => {
                        roomSelect.innerHTML += `<option value="${room.MA_PHONG}">${room.TEN_PHONG} (${room.LOAI_PHONG})</option>`;
                    });
                }
            } catch (error) {
                console.error('Error loading rooms:', error);
            }
        }
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'DANG_CHIEU': return 'bg-green-600';
        case 'SAP_CHIEU': return 'bg-blue-600';
        case 'NGUNG_CHIEU': return 'bg-gray-600';
        default: return 'bg-gray-600';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'DANG_CHIEU': return 'Đang chiếu';
        case 'SAP_CHIEU': return 'Sắp chiếu';
        case 'NGUNG_CHIEU': return 'Ngừng chiếu';
        default: return status;
    }
}

function getRoleClass(role) {
    switch(role) {
        case 'ADMIN': return 'bg-red-600';
        case 'NHAN_VIEN': return 'bg-blue-600';
        case 'KHACH_HANG': return 'bg-green-600';
        default: return 'bg-gray-600';
    }
}

function getRoleText(role) {
    switch(role) {
        case 'ADMIN': return 'Admin';
        case 'NHAN_VIEN': return 'Nhân viên';
        case 'KHACH_HANG': return 'Khách hàng';
        default: return role;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
