class ReportsView {
    async render(container) {
        const html = `
            <header class="app-header">
                <div class="header-title">
                    <h1>Admin Dashboard</h1>
                    <span>Reports & Analytics</span>
                </div>
                <div style="position:absolute; right:20px; cursor: pointer;" onclick="app.toggleQuickActions()">
                    <i class="fas fa-bars" style="font-size:1.5rem;"></i>
                </div>
            </header>

            <div class="inventory-container" style="padding: 20px;">
                <h2>Reports & Dashboard</h2>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:2rem;">
                    <div class="product-card" style="padding:1rem; text-align:center;">
                        <h3>Total Products</h3>
                        <h1 id="stat-products">-</h1>
                    </div>
                    <div class="product-card" style="padding:1rem; text-align:center;">
                        <h3>Low Stock Items</h3>
                        <h1 id="stat-stock" style="color:var(--danger-color)">-</h1>
                    </div>
                </div>

                <div style="margin-top: 2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3>Transaction History</h3>
                        <button class="btn-action" onclick="reports.loadHistory()">Refresh</button>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Time</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                </tr>
                            </thead>
                            <tbody id="history-table">
                                <tr><td colspan="6" style="text-align:center">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        window.reports = this;
        this.loadStats();
        this.loadHistory();
    }

    async loadStats() {
        const stats = await api.get('/report/dashboard');
        document.getElementById('stat-products').textContent = stats.total_products;
        document.getElementById('stat-stock').textContent = stats.low_stock;
    }

    async loadHistory() {
        const orders = await api.get('/report/transactions');
        const tbody = document.getElementById('history-table');

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${new Date(o.created_at).toLocaleString()}</td>
                <td>${o.customer_name || '-'}</td>
                <td>${o.items.length} items</td>
                <td style="font-weight:bold">Rp ${o.total_amount.toLocaleString()}</td>
                <td>${o.payment_method}</td>
            </tr>
        `).join('');
    }
}
