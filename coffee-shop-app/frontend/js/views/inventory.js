class InventoryView {
    constructor() {
        this.currentId = null;
    }

    async render(container) {
        const html = `
            <div class="inventory-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h2>Inventory Management</h2>
                    <button class="btn-checkout" style="width:auto;" onclick="inventory.openAddModal()">+ Add Product</button>
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
                    <button class="btn-action btn-edit" onclick="inventory.openEditModal(${p.id})">Edit</button>
                    <button class="btn-action btn-delete" onclick="inventory.delete(${p.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    renderModal(title, data = {}) {
        const modalContainer = document.getElementById('modal-container');
        const overlay = document.getElementById('modal-overlay');
        
        modalContainer.innerHTML = `
            <h3>${title}</h3>
            <form onsubmit="inventory.submitForm(event)">
                <input type="text" id="prod-name" placeholder="Product Name" value="${data.name || ''}" required>
                <input type="number" id="prod-price" placeholder="Price" value="${data.price || ''}" required>
                <input type="number" id="prod-stock" placeholder="Stock" value="${data.stock || ''}" required>
                <input type="text" id="prod-img" placeholder="Image URL" value="${data.image_url || ''}">
                <div style="margin-top:1rem; display:flex; gap:10px;">
                    <button type="submit" class="btn-checkout">Save</button>
                    <button type="button" class="btn-shift" onclick="inventory.closeModal()">Cancel</button>
                </div>
            </form>
        `;
        overlay.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        this.currentId = null;
    }

    openAddModal() {
        this.currentId = null;
        this.renderModal("Add Product");
    }

    async openEditModal(id) {
        this.currentId = id;
        // Fetch latest data or find in list. For now we fetch list again or pass data?
        // Better to fetch specific, but inventory list is small.
        const products = await api.get('/inventory/products'); // inefficient but safe
        const p = products.find(x => x.id === id);
        if (p) {
            this.renderModal("Edit Product", p);
        }
    }

    async submitForm(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('prod-name').value,
            price: parseFloat(document.getElementById('prod-price').value),
            stock: parseInt(document.getElementById('prod-stock').value),
            image_url: document.getElementById('prod-img').value
        };

        try {
            if (this.currentId) {
                await api.put(`/inventory/products/${this.currentId}`, data);
            } else {
                await api.post('/inventory/products', data);
            }
            this.closeModal();
            this.loadInventory();
        } catch (err) {
            alert("Error saving product");
            console.error(err);
        }
    }

    delete(id) {
        if(confirm("Delete this product?")) {
            api.delete(`/inventory/products/${id}`).then(() => this.loadInventory());
        }
    }
}
