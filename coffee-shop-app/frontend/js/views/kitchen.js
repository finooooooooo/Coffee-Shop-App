class KitchenView {
    constructor() {
        this.intervalId = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="kitchen-view">
                <div class="view-header">
                    <h2><i class="fas fa-utensils"></i> Kitchen Display System</h2>
                    <div class="status-indicators">
                        <span class="badge badge-pending">Pending</span>
                        <span class="badge badge-preparing">Preparing</span>
                    </div>
                </div>
                <div id="kitchen-orders-grid" class="orders-grid">
                    <div class="loading">Loading orders...</div>
                </div>
            </div>
        `;

        this.startPolling();
    }

    startPolling() {
        this.fetchOrders();
        this.intervalId = setInterval(() => this.fetchOrders(), 3000); // Poll every 3s
    }

    stopPolling() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    async fetchOrders() {
        try {
            const orders = await window.api.get('/pos/kitchen/orders');
            this.renderOrders(orders);
        } catch (error) {
            console.error("Failed to fetch kitchen orders:", error);
        }
    }

    renderOrders(orders) {
        const grid = document.getElementById('kitchen-orders-grid');
        if (!grid) return;

        if (orders.length === 0) {
            grid.innerHTML = '<div class="no-orders">No active orders</div>';
            return;
        }

        grid.innerHTML = orders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        // Filter only kitchen items (Snacks, Main Course, Dessert)
        // Since backend only routes orders here if they HAVE kitchen items,
        // but the order object contains ALL items. We should visually highlight or only show kitchen items?
        // Backend didn't filter items in to_dict. Let's filter client side for clarity.

        const kitchenCategories = ["Snacks", "Main Course", "Dessert"];
        // We rely on category name being in the product info or we assume checks.
        // The current OrderItem to_dict does not have category.
        // However, the chef needs to see what to cook.
        // OPTION: Show all items but maybe dim non-kitchen?
        // OR: Modify backend to include category in OrderItem.
        // FOR NOW: Show all items. The backend logic ensures this order HAS kitchen items.
        // Ideally we should distinguish. But let's show all items for context (sometimes chef needs to know drink timing).

        const statusClass = order.kitchen_status === 'preparing' ? 'card-preparing' : 'card-pending';
        const btnText = order.kitchen_status === 'pending' ? 'Start Preparing' : 'Complete Order';
        const btnAction = order.kitchen_status === 'pending' ? 'preparing' : 'completed';
        const btnClass = order.kitchen_status === 'pending' ? 'btn-warning' : 'btn-success';

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
                    <button class="btn ${btnClass}" onclick="app.views.kitchen.updateStatus(${order.id}, '${btnAction}')">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    }

    async updateStatus(orderId, status) {
        try {
            await window.api.post(`/pos/orders/${orderId}/status`, {
                role: 'kitchen',
                status: status
            });
            this.fetchOrders(); // Refresh immediately
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    }
}
