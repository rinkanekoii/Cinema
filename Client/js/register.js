document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    const mat_khau = document.getElementById('mat_khau').value;
    const xac_nhan_mat_khau = document.getElementById('xac_nhan_mat_khau').value;
    
    if (mat_khau !== xac_nhan_mat_khau) {
        errorDiv.textContent = 'Mật khẩu xác nhận không khớp';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    const formData = {
        ten_dang_nhap: document.getElementById('ten_dang_nhap').value,
        mat_khau: mat_khau,
        ho_ten: document.getElementById('ho_ten').value,
        email: document.getElementById('email').value,
        so_dien_thoai: document.getElementById('so_dien_thoai').value || null,
        ngay_sinh: document.getElementById('ngay_sinh').value || null,
        gioi_tinh: document.getElementById('gioi_tinh').value,
        dia_chi: document.getElementById('dia_chi').value || null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            successDiv.textContent = 'Đăng ký thành công! Chuyển hướng đến trang đăng nhập...';
            successDiv.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            errorDiv.textContent = data.message || data.error || 'Đăng ký thất bại';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Register error:', error);
        errorDiv.textContent = 'Lỗi kết nối đến server';
        errorDiv.classList.remove('hidden');
    }
});
