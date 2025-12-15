requireAuth();

async function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const bookingsByInvoice = {};
            
            data.data.forEach(booking => {
                const invoice = booking.MA_HOA_DON;
                if (!bookingsByInvoice[invoice]) {
                    bookingsByInvoice[invoice] = {
                        info: booking,
                        tickets: []
                    };
                }
                bookingsByInvoice[invoice].tickets.push(booking);
            });
            
            bookingsList.innerHTML = Object.values(bookingsByInvoice).map(booking => {
                const info = booking.info;
                const showtime = new Date(info.THOI_GIAN_BAT_DAU);
                const bookingDate = new Date(info.NGAY_DAT);
                
                const statusColors = {
                    'DA_DAT': 'bg-yellow-600',
                    'DA_BAN': 'bg-green-600',
                    'DA_HUY': 'bg-red-600',
                    'DA_SU_DUNG': 'bg-gray-600'
                };
                
                const statusText = {
                    'DA_DAT': 'Đã đặt',
                    'DA_BAN': 'Đã thanh toán',
                    'DA_HUY': 'Đã hủy',
                    'DA_SU_DUNG': 'Đã sử dụng'
                };
                
                return `
                    <div class="bg-gray-800 rounded-lg p-6 mb-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-2xl font-bold mb-2">${info.TEN_PHIM}</h3>
                                <p class="text-gray-400">
                                    <i class="fas fa-receipt"></i> Mã đơn: ${info.MA_HOA_DON}
                                </p>
                                <p class="text-gray-400">
                                    <i class="fas fa-calendar"></i> ${showtime.toLocaleDateString('vi-VN')} 
                                    <i class="fas fa-clock ml-4"></i> ${showtime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p class="text-gray-400">
                                    <i class="fas fa-map-marker-alt"></i> ${info.TEN_RAP} - ${info.TEN_PHONG}
                                </p>
                            </div>
                            <div class="text-right">
                                <span class="${statusColors[info.TRANG_THAI] || 'bg-gray-600'} px-4 py-2 rounded-full text-sm font-semibold">
                                    ${statusText[info.TRANG_THAI] || info.TRANG_THAI}
                                </span>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-4 mb-4">
                            <h4 class="font-semibold mb-2">Thông tin vé:</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${booking.tickets.map(ticket => `
                                    <div class="bg-gray-700 rounded-lg p-4">
                                        <p class="text-sm text-gray-400">Ghế</p>
                                        <p class="text-2xl font-bold text-red-500">${ticket.TEN_GHE}</p>
                                        <p class="text-sm text-gray-400 mt-2">${ticket.LOAI_GHE}</p>
                                        <p class="text-lg font-semibold text-yellow-500">
                                            ${parseInt(ticket.GIA_VE).toLocaleString('vi-VN')} ₫
                                        </p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-4">
                            <div class="flex justify-between items-center">
                                <div class="text-gray-400 text-sm">
                                    <p>Ngày đặt: ${bookingDate.toLocaleString('vi-VN')}</p>
                                    ${info.PHUONG_THUC_THANH_TOAN ? 
                                        `<p>Phương thức: ${info.PHUONG_THUC_THANH_TOAN}</p>` : ''}
                                </div>
                                <div class="text-right">
                                    <p class="text-gray-400">Tổng tiền</p>
                                    <p class="text-3xl font-bold text-red-500">
                                        ${parseInt(info.TONG_TIEN || info.GIA_VE * booking.tickets.length).toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            bookingsList.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-ticket-alt text-6xl text-gray-600 mb-4"></i>
                    <p class="text-xl text-gray-400">Bạn chưa có vé nào</p>
                    <a href="/movies.html" class="inline-block mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition">
                        Đặt vé ngay
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load bookings error:', error);
        bookingsList.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-xl text-gray-400">Lỗi tải danh sách vé</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadBookings);
