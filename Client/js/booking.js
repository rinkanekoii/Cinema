requireAuth();

const urlParams = new URLSearchParams(window.location.search);
const showtimeId = urlParams.get('showtime');

if (!showtimeId) {
    window.location.href = '/movies.html';
}

let selectedSeats = [];
let ticketPrice = 0;
let showtimeData = null;

async function loadShowtimeInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/showtimes`);
        const data = await response.json();
        
        if (data.success) {
            showtimeData = data.data.find(s => s.MA_SUAT_CHIEU == showtimeId);
            
            if (showtimeData) {
                ticketPrice = parseInt(showtimeData.GIA_VE);
                const time = new Date(showtimeData.THOI_GIAN_BAT_DAU);
                
                document.getElementById('showtimeInfo').innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold mb-2">${showtimeData.TEN_PHIM}</h2>
                            <p class="text-gray-400">
                                <i class="fas fa-calendar"></i> ${time.toLocaleDateString('vi-VN')} 
                                <i class="fas fa-clock ml-4"></i> ${time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p class="text-gray-400 mt-1">
                                <i class="fas fa-map-marker-alt"></i> ${showtimeData.TEN_RAP} - ${showtimeData.TEN_PHONG}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-400">Giá vé</p>
                            <p class="text-3xl font-bold text-yellow-500">${ticketPrice.toLocaleString('vi-VN')} ₫</p>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Load showtime info error:', error);
    }
}

async function loadSeats() {
    const container = document.getElementById('seatsContainer');
    
    try {
        const response = await fetch(`${API_BASE_URL}/showtimes/${showtimeId}/seats`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const seats = data.data;
            const rows = {};
            
            seats.forEach(seat => {
                if (!rows[seat.VI_TRI_HANG]) {
                    rows[seat.VI_TRI_HANG] = [];
                }
                rows[seat.VI_TRI_HANG].push(seat);
            });
            
            container.innerHTML = Object.keys(rows).sort().map(row => `
                <div class="flex items-center justify-center mb-2">
                    <span class="w-8 text-center font-bold mr-2">${row}</span>
                    <div class="flex">
                        ${rows[row].sort((a, b) => a.VI_TRI_COT - b.VI_TRI_COT).map(seat => {
                            const isBooked = seat.TRANG_THAI_GHE === 'DA_DAT';
                            const isVip = seat.LOAI_GHE === 'VIP';
                            
                            return `
                                <div class="seat ${isBooked ? 'booked' : 'available'} ${isVip ? 'vip' : ''}"
                                     data-seat-id="${seat.MA_GHE}"
                                     data-seat-name="${seat.TEN_GHE}"
                                     onclick="${isBooked ? '' : 'toggleSeat(this)'}">
                                    ${seat.TEN_GHE}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load seats error:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
                <p class="mt-4">Lỗi tải sơ đồ ghế</p>
            </div>
        `;
    }
}

function toggleSeat(element) {
    const seatId = parseInt(element.dataset.seatId);
    const seatName = element.dataset.seatName;
    
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        element.classList.add('available');
        selectedSeats = selectedSeats.filter(s => s.id !== seatId);
    } else {
        element.classList.remove('available');
        element.classList.add('selected');
        selectedSeats.push({ id: seatId, name: seatName });
    }
    
    updateBookingInfo();
}

function updateBookingInfo() {
    const infoDiv = document.getElementById('selectedSeatsInfo');
    const totalDiv = document.getElementById('totalAmount');
    const bookButton = document.getElementById('bookButton');
    
    if (selectedSeats.length === 0) {
        infoDiv.innerHTML = '<p class="text-gray-400">Chưa chọn ghế</p>';
        totalDiv.textContent = '0 ₫';
        bookButton.disabled = true;
    } else {
        const seatNames = selectedSeats.map(s => s.name).join(', ');
        const total = selectedSeats.length * ticketPrice;
        
        infoDiv.innerHTML = `
            <p class="font-semibold mb-2">Ghế đã chọn (${selectedSeats.length}):</p>
            <p class="text-sm">${seatNames}</p>
        `;
        totalDiv.textContent = total.toLocaleString('vi-VN') + ' ₫';
        bookButton.disabled = false;
    }
}

document.getElementById('bookButton').addEventListener('click', async () => {
    if (selectedSeats.length === 0) return;
    
    const button = document.getElementById('bookButton');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                ma_suat_chieu: showtimeId,
                ma_ghe_list: selectedSeats.map(s => s.id),
                phuong_thuc_thanh_toan: document.getElementById('paymentMethod').value
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            if (data.ma_thanh_toan) {
                await completePayment(data.ma_thanh_toan);
            }
            
            document.getElementById('successMessage').textContent = 
                `Mã đơn hàng: ${data.ma_hoa_don}. Tổng tiền: ${data.total_amount.toLocaleString('vi-VN')} ₫`;
            document.getElementById('successModal').classList.remove('hidden');
        } else {
            alert('Đặt vé thất bại: ' + (data.error || 'Unknown error'));
            button.disabled = false;
            button.textContent = 'Đặt vé';
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('Lỗi kết nối đến server');
        button.disabled = false;
        button.textContent = 'Đặt vé';
    }
});

async function completePayment(maThanhToan) {
    try {
        await fetch(`${API_BASE_URL}/bookings/payment/${maThanhToan}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
    } catch (error) {
        console.error('Payment completion error:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadShowtimeInfo();
    await loadSeats();
});
