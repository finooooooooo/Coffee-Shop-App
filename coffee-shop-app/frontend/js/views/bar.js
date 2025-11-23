class BarView {
    constructor() {
        this.intervalId = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="kitchen-view-container"> <!-- Reuse Kitchen Container styles for consistency -->
                <div class="ticket-view-header">
                    <h2 class="view-title"><i class="fas fa-cocktail"></i> Bar Station</h2>
                    <div class="header-clock" id="bar-clock">--:--</div>
                </div>
                <div id="bar-orders-grid" class="ticket-container">
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
        const el = document.getElementById('bar-clock');
        if (el) {
            const now = new Date();
            el.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    startPolling() {
        if (this.intervalId) clearInterval(this.intervalId);
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

        if (!orders || orders.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-glass-cheers"></i>
                    <h3>All Clear</h3>
                    <p>No active drink orders</p>
                </div>`;
            return;
        }

        grid.innerHTML = orders.map(order => this.createTicket(order)).join('');
    }

    createTicket(order) {
        // Status determination
        const isPreparing = order.bar_status === 'preparing';
        const statusLabel = isPreparing ? 'POURING' : 'PENDING';
        const statusColor = isPreparing ? 'var(--warning)' : 'var(--danger)';

        // Time elapsed
        const created = new Date(order.created_at);
        const now = new Date();
        const diffMins = Math.floor((now - created) / 60000);
        const timeClass = diffMins > 10 ? 'text-danger' : '';

        const btnText = isPreparing ? 'Serve' : 'Make';
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
                    <button class="btn-ticket" style="${btnStyle}; width: 100%;" onclick="app.views.bar.updateStatus(${order.id}, '${btnAction}')">
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
        }
    }
}
