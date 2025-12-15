const API_BASE_URL = 'http://localhost:3000/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function isAuthenticated() {
    return !!getToken();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
    }
}

function updateNavAuth() {
    const user = getUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const navAuth = document.getElementById('navAuth');
    
    if (isAuthenticated() && user) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = user.ho_ten || user.ten_dang_nhap;
        }
        
        // Add admin link for admin/staff users
        if (user.vai_tro === 'ADMIN' || user.vai_tro === 'NHAN_VIEN') {
            const navLinks = document.querySelector('nav .hidden.md\\:flex.space-x-6');
            if (navLinks && !document.getElementById('adminLink')) {
                const adminLink = document.createElement('a');
                adminLink.id = 'adminLink';
                adminLink.href = '/admin.html';
                adminLink.className = 'hover:text-red-500 transition text-yellow-400 font-semibold';
                adminLink.innerHTML = '<i class="fas fa-cog"></i> Admin';
                navLinks.appendChild(adminLink);
            }
        }
        
        if (navAuth) {
            navAuth.innerHTML = `
                <div class="flex items-center space-x-4">
                    <a href="/my-bookings.html" class="hover:text-red-500">Vé của tôi</a>
                    <button id="logoutBtn" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">
                        Đăng xuất
                    </button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', logout);
        }
    } else {
        if (userMenu) userMenu.classList.add('hidden');
        if (authButtons) authButtons.classList.remove('hidden');
        if (navAuth) {
            navAuth.innerHTML = `
                <div class="flex space-x-2">
                    <a href="/login.html" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">Đăng nhập</a>
                    <a href="/register.html" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">Đăng ký</a>
                </div>
            `;
        }
    }
}

function logout() {
    removeToken();
    window.location.href = '/';
}

if (document.getElementById('userMenuBtn')) {
    document.getElementById('userMenuBtn').addEventListener('click', () => {
        document.getElementById('userDropdown').classList.toggle('hidden');
    });
}

if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
