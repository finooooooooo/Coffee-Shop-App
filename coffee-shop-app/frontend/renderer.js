const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const menuList = document.getElementById('menu-list');
    const orderList = document.getElementById('order-items');
    const totalDisplay = document.getElementById('total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const orderHistory = document.getElementById('order-history');

    // Modal elements
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.querySelector('.close');
    const cashInput = document.getElementById('cash-input');
    const modalTotal = document.getElementById('modal-total');
    const changeAmount = document.getElementById('change-amount');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

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
            menuList.innerHTML = '<p>Gagal memuat menu. Pastikan backend berjalan.</p>';
        }
    }

    // Display menu items
    function displayMenu(items) {
        menuList.innerHTML = ''; // Clear existing

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item';
            itemEl.innerHTML = `
                <img src="${item.gambar || 'https://via.placeholder.com/200x150?text=No+Image'}" alt="${item.nama_menu}" class="menu-image">
                <div class="menu-details">
                    <h3>${item.nama_menu}</h3>
                    <p class="category">${item.kategori}</p>
                    <p class="price">Rp ${parseFloat(item.harga).toLocaleString()}</p>
                    <button class="add-btn" data-id="${item.id_menu}">+ Tambah</button>
                </div>
            `;
            menuList.appendChild(itemEl);
        });

        // Add event listeners to buttons using delegation or direct attachment
        // Here direct attachment is fine since we rebuilt the list
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                addToOrder(id);
            });
        });
    }

    // Add item to order
    function addToOrder(itemId) {
        const item = menuItems.find(m => m.id_menu === itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }

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
    }

    // Update order display
    function updateOrderDisplay() {
        orderList.innerHTML = currentOrder.map(item => `
            <div class="order-item">
                <div class="item-info">
                    <span class="item-name">${item.nama_menu}</span>
                    <span class="item-price">@ Rp ${item.harga.toLocaleString()}</span>
                </div>
                <div class="item-controls">
                    <button class="qty-btn minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}">+</button>
                </div>
                <div style="margin-left: 10px; font-weight: bold;">
                    Rp ${(item.harga * item.quantity).toLocaleString()}
                </div>
            </div>
        `).join('');

        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        totalDisplay.textContent = `Rp ${total.toLocaleString()}`;

        // Re-attach listeners for quantity buttons
        document.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.dataset.id), -1));
        });
        document.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => updateQuantity(parseInt(e.target.dataset.id), 1));
        });
    }

    // Update item quantity
    function updateQuantity(itemId, change) {
        const item = currentOrder.find(o => o.id === itemId);
        if (!item) return;

        item.quantity += change;
        if (item.quantity <= 0) {
            currentOrder = currentOrder.filter(o => o.id !== itemId);
        }
        updateOrderDisplay();
    }

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
        cashInput.focus();
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    cancelPaymentBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
    });

    // Calculate change
    cashInput.addEventListener('input', () => {
        const total = currentOrder.reduce((sum, item) => sum + (item.harga * item.quantity), 0);
        const cash = parseFloat(cashInput.value) || 0;
        const change = cash - total;
        changeAmount.textContent = `Rp ${change.toLocaleString()}`;
        changeAmount.style.color = change < 0 ? 'red' : 'green';

        confirmPaymentBtn.disabled = change < 0;
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

        // Send to displays via Electron IPC
        try {
            ipcRenderer.send('new-order', orderToSend);
        } catch (ipcErr) {
            console.error('IPC send error:', ipcErr);
        }

        // Save to Backend
        try {
            const response = await fetch('http://localhost:5000/api/transaksi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_pelanggan: 1, // Default ID for now
                    total_bayar: order.total,
                    metode_pembayaran: 'Cash',
                    items: order.items.map(i => ({
                        id_menu: i.id,
                        jumlah: i.quantity,
                        subtotal: i.harga * i.quantity
                    }))
                })
            });

            if (response.ok) {
                const resData = await response.json();
                if (resData.id_transaksi) {
                    ipcRenderer.send('update-order-status', { orderId: orderToSend.id, newId: resData.id_transaksi });
                }

                printReceipt(orderToSend);

                // Add to history
                completedOrders.unshift(orderToSend);
                displayOrderHistory();

                alert(`Pembayaran berhasil! Kembalian: Rp ${(cash - total).toLocaleString()}`);
                paymentModal.style.display = 'none';
                currentOrder = [];
                document.getElementById('customer-name').value = '';
                document.getElementById('table-number').value = '';
                updateOrderDisplay();
            } else {
                alert('Gagal menyimpan pesanan ke server.');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Error network/server saat menyimpan pesanan.');
        }
    });

    function printReceipt(order) {
        // ... (Same as before, maybe improved style)
        const receiptWindow = window.open('', '_blank', 'width=300,height=500');
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; }
                    .center { text-align: center; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .item { display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="center">
                    <h3>COFFEE SHOP</h3>
                    <p>Jl. Kopi No. 123</p>
                </div>
                <div class="divider"></div>
                <p>Date: ${new Date(order.timestamp).toLocaleString()}</p>
                <p>Table: ${order.table} | Cust: ${order.customer}</p>
                <div class="divider"></div>
                ${order.items.map(item => `
                    <div class="item">
                        <span>${item.nama_menu} x${item.jumlah}</span>
                        <span>${(item.harga * item.jumlah).toLocaleString()}</span>
                    </div>
                `).join('')}
                <div class="divider"></div>
                <div class="item"><strong>TOTAL</strong> <strong>${order.total.toLocaleString()}</strong></div>
                <div class="item">CASH <span>${order.payment.toLocaleString()}</span></div>
                <div class="item">CHANGE <span>${order.change.toLocaleString()}</span></div>
                <div class="divider"></div>
                <div class="center">Thank You!</div>
            </body>
            </html>
        `;
        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();
        // receiptWindow.print();
    }

    function displayOrderHistory() {
        orderHistory.innerHTML = completedOrders.map(order => `
            <div class="history-item completed">
                <h4>#${order.id.toString().slice(-4)} - ${order.customer} (Meja ${order.table})</h4>
                <div class="time">${new Date(order.timestamp).toLocaleTimeString()}</div>
                <div class="total">Total: Rp ${order.total.toLocaleString()}</div>
            </div>
        `).join('');
    }

    // Initial fetch
    fetchMenu();

    // Button handlers for opening other windows
    const kitchenBtn = document.getElementById('kitchen-btn');
    const barBtn = document.getElementById('bar-btn');

    if (kitchenBtn) kitchenBtn.addEventListener('click', () => ipcRenderer.send('open-kitchen-display'));
    if (barBtn) barBtn.addEventListener('click', () => ipcRenderer.send('open-bar-display'));
});
