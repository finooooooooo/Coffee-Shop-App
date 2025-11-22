class HistoryView {
    async render(container) {
        const html = `
            <div class="inventory-container">
                <h2>Order History (Last 50)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Items</th>
                        </tr>
                    </thead>
                    <tbody id="history-table-body"></tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        await this.loadHistory();
    }

    async loadHistory() {
        const orders = await api.get('/pos/orders');
        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>${new Date(o.created_at).toLocaleString()}</td>
                <td>#${o.id}</td>
                <td>${o.customer_name || '-'}</td>
                <td>Rp ${o.total_amount.toLocaleString()}</td>
                <td>${o.payment_method}</td>
                <td>${o.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}</td>
            </tr>
        `).join('');
    }
}
