class BarView {
    constructor() {
        this.intervalId = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="bar-view">
                <div class="view-header">
                    <h2><i class="fas fa-cocktail"></i> Bar Display System</h2>
                    <div class="status-indicators">
                        <span class="badge badge-pending">Pending</span>
                        <span class="badge badge-preparing">Preparing</span>
                    </div>
                </div>
                <div id="bar-orders-grid" class="orders-grid">
                    <div class="loading">Loading orders...</div>
                </div>
            </div>
        `;

        this.startPolling();
    }

    startPolling() {
        this.fetchOrders();
        this.intervalId = setInterval(() => this.fetchOrders(), 3000);
    }

    stopPolling() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    async fetchOrders() {
        try {
            const orders = await window.api.get('/pos/bar/orders');
            this.renderOrders(orders);
        } catch (error) {
            console.error("Failed to fetch bar orders:", error);
        }
    }

    renderOrders(orders) {
        const grid = document.getElementById('bar-orders-grid');
        if (!grid) return;

        if (orders.length === 0) {
            grid.innerHTML = '<div class="no-orders">No active orders</div>';
            return;
        }

        grid.innerHTML = orders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const statusClass = order.bar_status === 'preparing' ? 'card-preparing' : 'card-pending';
        const btnText = order.bar_status === 'pending' ? 'Start Preparing' : 'Complete Order';
        const btnAction = order.bar_status === 'pending' ? 'preparing' : 'completed';
        const btnClass = order.bar_status === 'pending' ? 'btn-warning' : 'btn-success';

        const itemsList = order.items.map(item => `
            <li class="order-item">
                <span class="qty">${item.quantity}x</span>
                <span class="name">${item.product_name}</span>
            </li>
        `).join('');

        return `
            <div class="order-card ${statusClass}">
                <div class="card-header">
                    <span class="order-id">${order.order_id}</span>
                    <span class="timer">${new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                <div class="card-info">
                    <div>Table: <strong>${order.table_number || 'N/A'}</strong></div>
                    <div>Customer: ${order.customer_name || 'Guest'}</div>
                </div>
                <ul class="item-list">
                    ${itemsList}
                </ul>
                <div class="card-actions">
                    <button class="btn ${btnClass}" onclick="app.views.bar.updateStatus(${order.id}, '${btnAction}')">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    }

    async updateStatus(orderId, status) {
        try {
            await window.api.post(`/pos/orders/${orderId}/status`, {
                role: 'bar',
                status: status
            });
            this.fetchOrders();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    }
}
