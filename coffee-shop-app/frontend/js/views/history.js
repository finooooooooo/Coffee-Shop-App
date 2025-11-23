class HistoryView {
    async render(container) {
        const html = `
            <div class="inventory-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h2>Order History (Last 50)</h2>
                    <button class="btn btn-danger" onclick="app.views.history.closeShift()">
                        <i class="fas fa-file-invoice-dollar"></i> Close Shift / Reset
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

    async closeShift() {
        if (!confirm("Are you sure you want to Close Shift? This will generate a report and reset the view.")) return;

        try {
            const report = await window.api.post('/pos/shift/close', {});
            alert(`Shift Closed!\nTotal Revenue: Rp ${report.total_revenue.toLocaleString()}\nTotal Orders: ${report.total_orders}`);
            // Since our backend logic for "history" just pulls the last 50 orders regardless of shift (it was requested to be simple),
            // and P001 resets daily, the "Reset" here is mostly symbolic or for the report.
            // If we want to clear the table, we can just reload.
            await this.loadHistory();
        } catch (error) {
            console.error("Error closing shift:", error);
            alert("Failed to close shift.");
        }
    }
}
