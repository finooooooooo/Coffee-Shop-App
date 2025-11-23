class KitchenView {
    constructor() {
        this.intervalId = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="kitchen-view-container">
                <div class="ticket-view-header">
                    <h2 class="view-title"><i class="fas fa-utensils"></i> Kitchen</h2>
                    <div class="header-clock" id="kitchen-clock">--:--</div>
                </div>
                <div id="kitchen-orders-grid" class="ticket-container">
                    <div class="loading-state"><i class="fas fa-circle-notch fa-spin"></i> Loading Tickets...</div>
                </div>
            </div>
        `;

        this.updateClock();
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
        this.startPolling();
    }

    updateClock() {
        const el = document.getElementById('kitchen-clock');
        if (el) {
            const now = new Date();
            el.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    startPolling() {
        if (this.intervalId) clearInterval(this.intervalId);
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

        if (!orders || orders.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>All Clear</h3>
                    <p>No active food orders</p>
                </div>`;
            return;
        }

        // Diffing logic could go here to prevent re-rendering, but for now full replace is safer
        grid.innerHTML = orders.map(order => this.createTicket(order)).join('');
    }

    createTicket(order) {
        // Status determination
        const isPreparing = order.kitchen_status === 'preparing';
        const statusLabel = isPreparing ? 'PREPARING' : 'PENDING';
        const statusColor = isPreparing ? 'var(--warning)' : 'var(--danger)'; // Warning is yellow, Danger is red?
        // Actually, Pending = Red (Urgent), Preparing = Yellow (In Progress) usually works well. Or vice versa.

        // Time elapsed
        const created = new Date(order.created_at);
        const now = new Date();
        const diffMins = Math.floor((now - created) / 60000);
        const timeClass = diffMins > 15 ? 'text-danger' : '';

        const btnText = isPreparing ? 'Done' : 'Cook';
        const btnAction = isPreparing ? 'completed' : 'preparing';
        const btnStyle = isPreparing ? 'background-color: var(--success); color: #000;' : 'background-color: var(--accent-primary); color: #000;';

        const itemsList = order.items.map(item => `
            <div class="ticket-item">
                <span class="ticket-qty">${item.quantity}</span>
                <span class="ticket-name">${item.product_name}</span>
            </div>
        `).join('');

        return `
            <div class="ticket-card" style="border-color: ${isPreparing ? 'var(--warning)' : 'var(--danger)'}">
                <div class="ticket-header">
                    <div>
                        <span class="ticket-id">#${order.daily_order_number || order.id}</span>
                        <span class="ticket-table">Table ${order.table_number || '-'}</span>
                    </div>
                    <div class="ticket-time ${timeClass}">${diffMins}m</div>
                </div>

                <div class="ticket-status-badge" style="background-color: ${statusColor}; color: #000; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7em; margin-bottom: 10px;">
                    ${statusLabel}
                </div>

                <div class="ticket-items">
                    ${itemsList}
                </div>

                <div class="ticket-actions">
                    <button class="btn-ticket" style="${btnStyle}; width: 100%;" onclick="app.views.kitchen.updateStatus(${order.id}, '${btnAction}')">
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
            this.fetchOrders();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }
}
