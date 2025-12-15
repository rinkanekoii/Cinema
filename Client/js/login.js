document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ten_dang_nhap = document.getElementById('ten_dang_nhap').value;
    const mat_khau = document.getElementById('mat_khau').value;
    const errorDiv = document.getElementById('errorMessage');
    
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ten_dang_nhap, mat_khau })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            setToken(data.token);
            setUser(data.user);
            window.location.href = '/';
        } else {
            errorDiv.textContent = data.error || 'Đăng nhập thất bại';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Lỗi kết nối đến server';
        errorDiv.classList.remove('hidden');
    }
});
