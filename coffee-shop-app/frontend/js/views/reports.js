class ReportsView {
    async render(container) {
        const html = `
            <div class="inventory-container">
                <h2>Reports & Dashboard</h2>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:2rem;">
                    <div class="product-card" style="padding:1rem; text-align:center;">
                        <h3>Total Products</h3>
                        <h1 id="stat-products">-</h1>
                    </div>
                    <div class="product-card" style="padding:1rem; text-align:center;">
                        <h3>Low Stock Items</h3>
                        <h1 id="stat-stock" style="color:var(--danger-color)">-</h1>
                    </div>
                </div>
                <h3>Recent Transactions</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Time</th>
                            <th>Total</th>
                            <th>Payment</th>
                        </tr>
                    </thead>
                    <tbody id="report-table"></tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        this.loadStats();
    }

    async loadStats() {
        const stats = await api.get('/report/dashboard');
        document.getElementById('stat-products').textContent = stats.total_products;
        document.getElementById('stat-stock').textContent = stats.low_stock;

        document.getElementById('report-table').innerHTML = stats.recent_orders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${new Date(o.created_at).toLocaleString()}</td>
                <td>Rp ${o.total_amount.toLocaleString()}</td>
                <td>${o.payment_method}</td>
            </tr>
        `).join('');
    }
}
