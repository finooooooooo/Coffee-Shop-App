const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const menuList = document.getElementById('menu-list');
    const orderList = document.getElementById('order-items');
    const totalDisplay = document.getElementById('total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderHistory = document.getElementById('order-history');

    let currentOrder = [];
    let menuItems = [];
    let completedOrders = [];

    // Fetch menu items from backend
    async function fetchMenu() {
        try {
            const response = await fetch('http://localhost:5000/api/menu');
            menuItems = await response.json();
            displayMenu(menuItems);
        } catch (error) {
            console.error('Error fetching menu:', error);
            // Add some sample items if backend is not available
            menuItems = [
                { id_menu: 1, nama_menu: 'Nasi Goreng', harga: 25000, kategori: 'Makanan', gambar: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop' },
                { id_menu: 2, nama_menu: 'Mie Goreng', harga: 23000, kategori: 'Makanan', gambar: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop' },
                { id_menu: 3, nama_menu: 'Es Teh', harga: 5000, kategori: 'Minuman', gambar: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop' },
                { id_menu: 4, nama_menu: 'Es Jeruk', harga: 6000, kategori: 'Minuman', gambar: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=200&fit=crop' }
            ];
            displayMenu(menuItems);
        }
    }

    // Display menu items
    function displayMenu(items) {
        menuList.innerHTML = items.map(item => `
            <div class="menu-item" data-id="${item.id_menu}">
                <img src="${item.gambar || 'https://via.placeholder.com/200x150?text=No+Image'}" alt="${item.nama_menu}" class="menu-image">
                <h3>${item.nama_menu}</h3>
                <p class="price">Rp ${parseFloat(item.harga).toLocaleString()}</p>
                <p class="category">${item.kategori}</p>
                <button onclick="addToOrder(${item.id_menu})">+ Tambah</button>
            </div>
        `).join('');
    }

    // Add item to order
    window.addToOrder = (itemId) => {
        const item = menuItems.find(m => m.id_menu === itemId);
        if (!item) return;

        const existingItem = currentOrder.find(o => o.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentOrder.push({
                id: item.id_menu,
                nama_menu: item.nama_menu,
                harga: parseFloat(item.harga),
                quantity: 1,
                kategori: item.kategori
            });
        }
        updateOrderDisplay();
    };

    // Update order display
    function updateOrderDisplay() {
        orderList.innerHTML = currentOrder.map(item => `
            <div class="order-item">
                <span>${item.nama_menu}</span>
                <span>x${item.quantity}</span>
                <span>Rp ${(item.harga * item.quantity).toLocaleString()}</span>
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        totalDisplay.textContent = `Rp ${total.toLocaleString()}`;
    }

    // Update item quantity
    window.updateQuantity = (itemId, change) => {
        const item = currentOrder.find(o => o.id === itemId);
        if (!item) return;

        item.quantity += change;
        if (item.quantity <= 0) {
            currentOrder = currentOrder.filter(o => o.id !== itemId);
        }
        updateOrderDisplay();
    };

    // Modal elements
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.querySelector('.close');
    const cashInput = document.getElementById('cash-input');
    const modalTotal = document.getElementById('modal-total');
    const changeAmount = document.getElementById('change-amount');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

    // Handle checkout
    checkoutBtn.addEventListener('click', () => {
        if (currentOrder.length === 0) {
            alert('Silakan pilih menu terlebih dahulu');
            return;
        }

        const customerName = document.getElementById('customer-name').value;
        const tableNumber = document.getElementById('table-number').value;

        if (!customerName || !tableNumber) {
            alert('Mohon isi nama pelanggan dan nomor meja');
            return;
        }

        // Show payment modal
        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        modalTotal.textContent = `Rp ${total.toLocaleString()}`;
        changeAmount.textContent = 'Rp 0';
        cashInput.value = '';
        paymentModal.style.display = 'block';
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    cancelPaymentBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    // Calculate change when cash input changes
    cashInput.addEventListener('input', () => {
        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        const cash = parseFloat(cashInput.value) || 0;
        const change = cash - total;
        changeAmount.textContent = `Rp ${change.toLocaleString()}`;
        changeAmount.style.color = change < 0 ? 'red' : 'green';
    });

    // Confirm payment
    confirmPaymentBtn.addEventListener('click', async () => {
        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        const cash = parseFloat(cashInput.value) || 0;

        if (cash < total) {
            alert('Uang tunai tidak cukup!');
            return;
        }

        const customerName = document.getElementById('customer-name').value;
        const tableNumber = document.getElementById('table-number').value;

        const order = {
            items: currentOrder.map(item => ({
                id: item.id,
                nama_menu: item.nama_menu,
                quantity: item.quantity,
                harga: item.harga,
                kategori: item.kategori
            })),
            total: total,
            payment: cash,
            change: cash - total,
            customer_name: customerName,
            table_number: tableNumber,
            timestamp: new Date().toISOString()
        };

        // Build order object to send to displays
        const orderToSend = {
            id: Date.now(),
            items: order.items.map(i => ({
                nama_menu: i.nama_menu,
                jumlah: i.quantity,
                kategori: i.kategori,
                harga: i.harga
            })),
            timestamp: order.timestamp,
            table: order.table_number,
            customer: order.customer_name,
            total: order.total,
            payment: order.payment,
            change: order.change
        };

        // Send immediately to displays (optimistic) so Kitchen/Bar see it right away
        try {
            ipcRenderer.send('new-order', orderToSend);
        } catch (ipcErr) {
            console.error('IPC send error:', ipcErr);
        }

        // Then try to persist to backend; failures won't block display updates
        try {
            const response = await fetch('http://localhost:5000/api/transaksi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_pelanggan: 1,
                    total_bayar: order.total,
                    metode_pembayaran: 'Cash',
                    items: order.items.map(i => ({ id_menu: i.id, jumlah: i.quantity, subtotal: i.harga * i.quantity }))
                })
            });

            if (response.ok) {
                // Replace optimistic id with backend id if provided
                const resData = await response.json();
                // Optionally, notify displays about real id
                if (resData.id_transaksi) {
                    ipcRenderer.send('update-order-status', { orderId: orderToSend.id, newId: resData.id_transaksi });
                }

                // Print receipt
                printReceipt(orderToSend);

                alert(`Pembayaran berhasil! Kembalian: Rp ${(cash - total).toLocaleString()}`);
                paymentModal.style.display = 'none';
                currentOrder = [];
                updateOrderDisplay();
            } else {
                console.warn('Backend returned non-OK status for order persistence');
                alert('Pesanan tampil di display tetapi gagal disimpan ke server.');
            }
        } catch (error) {
            console.error('Error submitting order to backend:', error);
            alert('Pesanan tampil di display tetapi gagal disimpan ke server.');
        }
    });

    function printReceipt(order) {
        const receiptWindow = window.open('', '_blank', 'width=300,height=400');
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Struk Pembayaran</title>
                <style>
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 10px; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>POS Restoran</h2>
                    <p>Struk Pembayaran</p>
                </div>
                <div class="details">
                    <p>Pelanggan: ${order.customer}</p>
                    <p>Meja: ${order.table}</p>
                    <p>Tanggal: ${new Date(order.timestamp).toLocaleString()}</p>
                </div>
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <span>${item.nama_menu} x${item.jumlah}</span>
                            <span>Rp ${(item.harga * item.jumlah).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="total">
                    <div class="item">
                        <span>Total</span>
                        <span>Rp ${order.total.toLocaleString()}</span>
                    </div>
                    <div class="item">
                        <span>Bayar</span>
                        <span>Rp ${order.payment.toLocaleString()}</span>
                    </div>
                    <div class="item">
                        <span>Kembalian</span>
                        <span>Rp ${order.change.toLocaleString()}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Terima Kasih Atas Kunjungannya</p>
                    <p>POS Restoran - ${new Date().getFullYear()}</p>
                </div>
            </body>
            </html>
        `;

        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();

        // Auto print after content loads
        receiptWindow.onload = () => {
            receiptWindow.print();
            receiptWindow.close();
        };
    }

    // Display order history
    function displayOrderHistory() {
        orderHistory.innerHTML = completedOrders.map(order => `
            <div class="history-item completed">
                <h4>Order #${order.id} - Meja ${order.table}</h4>
                <div class="time">${new Date(order.timestamp).toLocaleString()}</div>
                <div class="items">
                    ${order.items.map(item => `
                        <div class="item">
                            <span>${item.nama_menu} x${item.jumlah}</span>
                            <span>Rp ${(item.harga * item.jumlah).toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="total">Total: Rp ${order.total.toLocaleString()}</div>
            </div>
        `).join('');
    }

    // Listen for order completion updates
    ipcRenderer.on('order-completed', (event, completedOrder) => {
        completedOrders.unshift(completedOrder); // Add to beginning
        if (completedOrders.length > 50) { // Keep only last 50 orders
            completedOrders = completedOrders.slice(0, 50);
        }
        displayOrderHistory();
    });

    // Handle kitchen and bar display buttons
    const kitchenBtn = document.getElementById('kitchen-btn');
    const barBtn = document.getElementById('bar-btn');

    if (kitchenBtn) {
        kitchenBtn.addEventListener('click', () => {
            ipcRenderer.send('open-kitchen-display');
        });
    }

    if (barBtn) {
        barBtn.addEventListener('click', () => {
            ipcRenderer.send('open-bar-display');
        });
    }

    // Initialize
    fetchMenu();
    displayOrderHistory();
});
