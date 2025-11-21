class InventoryView {
    async render(container) {
        const html = `
            <div class="inventory-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h2>Inventory Management</h2>
                    <button class="btn-checkout" style="width:auto;" onclick="inventory.openModal()">+ Add Product</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inv-table-body"></tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
        window.inventory = this;
        await this.loadInventory();
    }

    async loadInventory() {
        const products = await api.get('/inventory/products');
        const tbody = document.getElementById('inv-table-body');
        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>Rp ${p.price.toLocaleString()}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="inventory.edit(${p.id})">Edit</button>
                    <button class="btn-action btn-delete" onclick="inventory.delete(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    openModal() {
        // Simplified prompt for demo
        const name = prompt("Product Name:");
        const price = prompt("Price:");
        const stock = prompt("Stock:");
        if (name && price) {
            api.post('/inventory/products', {
                name, price: parseFloat(price), stock: parseInt(stock)
            }).then(() => this.loadInventory());
        }
    }

    delete(id) {
        if(confirm("Delete this product?")) {
            api.delete(`/inventory/products/${id}`).then(() => this.loadInventory());
        }
    }

    edit(id) {
        alert("Edit feature coming in v2 (use delete + add for now)");
    }
}
