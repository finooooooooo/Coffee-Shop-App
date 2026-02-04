class ReportsView {
    async render(container) {
        const today = new Date().toISOString().split('T')[0];

        const html = `
            <header class="app-header">
                <div class="header-title">
                    <h1>Admin Dashboard</h1>
                    <span>Reports & Analytics</span>
                </div>
                <div id="menu-trigger-btn" style="position:absolute; right:20px; cursor: pointer;" onclick="app.toggleQuickActions()">
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
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:10px;">
                        <h3>Transaction History</h3>

                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="date" id="start-date" value="${today}" style="padding:5px;">
                            <span>to</span>
                            <input type="date" id="end-date" value="${today}" style="padding:5px;">
                            <button class="btn btn-primary" onclick="reports.loadHistory()">Filter</button>
                        </div>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto; background:white; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:#f4f4f4;">
                                <tr>
                                    <th style="padding:10px; text-align:left;">Trx Code</th>
                                    <th style="padding:10px; text-align:left;">Date</th>
                                    <th style="padding:10px; text-align:left;">Cashier</th>
                                    <th style="padding:10px; text-align:right;">Total</th>
                                    <th style="padding:10px; text-align:center;">Method</th>
                                    <th style="padding:10px; text-align:center;">Status</th>
                                </tr>
                            </thead>
                            <tbody id="history-table">
                                <tr><td colspan="6" style="text-align:center; padding:20px;">Loading...</td></tr>
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
        try {
            const stats = await api.get('/report/dashboard');
            document.getElementById('stat-products').textContent = stats.total_products;
            document.getElementById('stat-stock').textContent = stats.low_stock;
        } catch(e) {
            console.error("Stats error", e);
        }
    }

    async loadHistory() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        let url = '/report/transactions';
        if (startDate || endDate) {
            url += `?start_date=${startDate}&end_date=${endDate}`;
        }

        try {
            const orders = await api.get(url);
            const tbody = document.getElementById('history-table');

            if (!orders || orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No transactions found.</td></tr>';
                return;
            }

            tbody.innerHTML = orders.map(o => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px; font-family:monospace;">${o.transaction_code}</td>
                    <td style="padding:10px;">${new Date(o.created_at).toLocaleString()}</td>
                    <td style="padding:10px;">${o.cashier || '-'}</td>
                    <td style="padding:10px; text-align:right; font-weight:bold;">Rp ${o.total_amount.toLocaleString()}</td>
                    <td style="padding:10px; text-align:center;">${o.payment_method}</td>
                    <td style="padding:10px; text-align:center;">
                        <span style="background:${o.status === 'paid' ? '#d4edda' : '#f8d7da'}; color:${o.status === 'paid' ? '#155724' : '#721c24'}; padding:3px 8px; border-radius:10px; font-size:0.8rem;">
                            ${o.status.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        } catch(e) {
            console.error(e);
            document.getElementById('history-table').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Error loading data</td></tr>';
        }
    }
}
