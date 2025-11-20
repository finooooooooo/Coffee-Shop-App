const { ipcRenderer } = require('electron');

// Handle incoming orders
ipcRenderer.on('update-orders', (event, order) => {
    const barOrders = document.getElementById('bar-orders');

    // Create order card
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.id = `order-${order.id}`;

    // Filter for bar items only (beverages)
    const barItems = order.items.filter(item => item.kategori === 'Minuman');

    // Only show orders that have beverages
    if (barItems.length === 0) return;

    // Create order content
    orderCard.innerHTML = `
        <h3>Order #${order.id} - Meja ${order.table}</h3>
        <p>Waktu: ${new Date(order.timestamp).toLocaleTimeString()}</p>
        <p>Pelanggan: ${order.customer}</p>
        <div class="order-items">
            ${barItems.map(item => `
                <div class="item">
                    <span><img src="${getMenuImage(item.nama_menu)}" alt="${item.nama_menu}">${item.nama_menu}</span>
                    <span>x${item.jumlah}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-actions">
            <button onclick="updateStatus(${order.id}, 'preparing')">Preparing</button>
            <button onclick="updateStatus(${order.id}, 'ready')">Ready</button>
        </div>
    `;

    barOrders.appendChild(orderCard);
});

// Helper function to get menu image based on item name
function getMenuImage(menuName) {
    const imageMap = {
        'Es Teh': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=40&h=40&fit=crop',
        'Es Jeruk': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=40&h=40&fit=crop',
        'Jus Alpukat': 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=40&h=40&fit=crop',
        'Kopi Hitam': 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=40&h=40&fit=crop',
        'Teh Tarik': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=40&h=40&fit=crop',
        'Soda Gembira': 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=40&h=40&fit=crop'
    };
    return imageMap[menuName] || 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=40&h=40&fit=crop';
}

// Handle status updates
function updateStatus(orderId, status) {
    ipcRenderer.send('update-order-status', {
        orderId,
        status,
        source: 'bar'
    });

    // If status is 'ready', update the UI immediately
    if (status === 'ready') {
        const orderCard = document.getElementById(`order-${orderId}`);
        if (orderCard) {
            orderCard.classList.add('completed');
            setTimeout(() => {
                orderCard.remove();
            }, 5000);
        }
    }
}

// Listen for status updates from other windows
ipcRenderer.on('order-status-update', (event, update) => {
    const orderCard = document.getElementById(`order-${update.orderId}`);
    if (orderCard) {
        if (update.status === 'ready' || update.status === 'served') {
            orderCard.classList.add('completed');
            setTimeout(() => {
                orderCard.remove();
            }, 5000);
        } else {
            orderCard.setAttribute('data-status', update.status);
        }
    }
});