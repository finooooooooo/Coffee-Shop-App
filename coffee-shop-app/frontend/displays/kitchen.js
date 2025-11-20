const { ipcRenderer } = require('electron');

// Handle incoming orders
ipcRenderer.on('update-orders', (event, order) => {
    const kitchenOrders = document.getElementById('kitchen-orders');

    // Create order card
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.id = `order-${order.id}`;

    // Filter for kitchen items only (non-beverages)
    const kitchenItems = order.items.filter(item => item.kategori !== 'Minuman');

    // Only show if there are kitchen items
    if (kitchenItems.length === 0) return;

    // Create order content
    orderCard.innerHTML = `
        <h3>Order #${order.id} - Meja ${order.table}</h3>
        <p>Waktu: ${new Date(order.timestamp).toLocaleTimeString()}</p>
        <p>Pelanggan: ${order.customer}</p>
        <div class="order-items">
            ${kitchenItems.map(item => `
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

    kitchenOrders.appendChild(orderCard);
});

// Helper function to get menu image based on item name
function getMenuImage(menuName) {
    const imageMap = {
        'Nasi Goreng': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=40&h=40&fit=crop',
        'Mie Goreng': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=40&h=40&fit=crop',
        'Ayam Bakar': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=40&h=40&fit=crop',
        'Sate Ayam': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=40&h=40&fit=crop',
        'Rendang': 'https://images.unsplash.com/photo-1608039755401-5131f1d3b643?w=40&h=40&fit=crop',
        'Gado-Gado': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=40&h=40&fit=crop'
    };
    return imageMap[menuName] || 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=40&h=40&fit=crop';
}

// Handle status updates
function updateStatus(orderId, status) {
    ipcRenderer.send('update-order-status', {
        orderId,
        status,
        source: 'kitchen'
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