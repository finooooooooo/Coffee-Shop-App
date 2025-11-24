class HistoryView {
    async render(container) {
        const html = `
            <div class="inventory-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2>Order History (Uncleared)</h2>
                    <button class="btn btn-danger" onclick="app.views.history.clearHistory()">
                        <i class="fas fa-check-double"></i> Clear History & Send to Reports
                    </button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
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
        const orders = await window.api.get('/pos/orders');
        const tbody = document.getElementById('history-table-body');

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found for this session.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            // Determine overall status
            let status = 'Pending';
            const k = o.kitchen_status;
            const b = o.bar_status;

            if (k === 'completed' && b === 'completed') status = 'Completed';
            else if ((k === 'completed' && b === 'none') || (k === 'none' && b === 'completed')) status = 'Completed';
            else if (k === 'preparing' || b === 'preparing') status = 'Preparing';

            // Special case: if both are none? (e.g. only gum?) -> Completed
            if (k === 'none' && b === 'none') status = 'Completed';

            return `
            <tr>
                <td>${new Date(o.created_at).toLocaleString()}</td>
                <td><strong>${o.order_id}</strong></td>
                <td>${o.customer_name || '-'}</td>
                <td>Rp ${o.total_amount.toLocaleString()}</td>
                <td><span class="badge badge-${status === 'Completed' ? 'preparing' : 'pending'}" style="background-color: ${status === 'Completed' ? '#76C668' : ''}">${status}</span></td>
                <td>${o.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}</td>
            </tr>
        `}).join('');
    }

    async clearHistory() {
        if (!confirm("Are you sure you want to Clear History? This will move all current orders to Reports.")) return;

        try {
            const res = await window.api.post('/pos/history/clear', {});
            alert(res.message);
            await this.loadHistory();
        } catch (error) {
            console.error("Error clearing history:", error);
            alert("Failed to clear history.");
        }
    }
}
