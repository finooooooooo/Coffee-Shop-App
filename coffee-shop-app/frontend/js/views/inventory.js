class InventoryView {
    constructor() {
        this.currentId = null;
    }

    async render(container) {
        const html = `
            <div class="inventory-container fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <div>
                        <h2>Inventory Management</h2>
                        <p style="color:var(--text-secondary); font-size: 0.9rem;">Manage your products and stock levels</p>
                    </div>
                    <button class="btn btn-primary" onclick="inventory.openAddModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inv-table-body">
                            <tr><td colspan="5" class="text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
        window.inventory = this;
        await this.loadInventory();
    }

    async loadInventory() {
        try {
            const products = await api.get('/inventory/products');
            const tbody = document.getElementById('inv-table-body');

            if (!products || products.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem;">No products found</td></tr>`;
                return;
            }

            tbody.innerHTML = products.map(p => `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${p.name}</div>
                    </td>
                    <td>
                        <span style="background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
                            ${p.category || '-'}
                        </span>
                    </td>
                    <td>Rp ${p.price.toLocaleString()}</td>
                    <td>
                        <span style="color: ${p.stock < 10 ? 'var(--danger-color)' : 'var(--success-color)'}; font-weight: 600;">
                            ${p.stock} units
                        </span>
                    </td>
                    <td class="text-right">
                        <button class="btn btn-ghost" onclick="inventory.openEditModal(${p.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost" style="color: var(--danger-color);" onclick="inventory.delete(${p.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error(err);
            document.getElementById('inv-table-body').innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading inventory</td></tr>`;
        }
    }

    renderModal(title, data = {}) {
        const modalContainer = document.getElementById('modal-container');
        const overlay = document.getElementById('modal-overlay');
        
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn" onclick="inventory.closeModal()">&times;</button>
            </div>
            <form onsubmit="inventory.submitForm(event)" class="modal-body">
                <div class="mb-1">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Product Name</label>
                    <input type="text" id="prod-name" placeholder="e.g. Caramel Macchiato" value="${data.name || ''}" required>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:500;">Price (Rp)</label>
                        <input type="number" id="prod-price" placeholder="0" value="${data.price || ''}" required>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:500;">Stock</label>
                        <input type="number" id="prod-stock" placeholder="0" value="${data.stock || ''}" required>
                    </div>
                </div>

                <div class="mb-1">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Category</label>
                    <select id="prod-category">
                         <option value="Signature Coffee" ${data.category === 'Signature Coffee' ? 'selected' : ''}>Signature Coffee</option>
                         <option value="Classic Coffee" ${data.category === 'Classic Coffee' ? 'selected' : ''}>Classic Coffee</option>
                         <option value="Non-Coffee" ${data.category === 'Non-Coffee' ? 'selected' : ''}>Non-Coffee</option>
                         <option value="Main Course" ${data.category === 'Main Course' ? 'selected' : ''}>Main Course</option>
                         <option value="Snacks" ${data.category === 'Snacks' ? 'selected' : ''}>Snacks</option>
                         <option value="Dessert" ${data.category === 'Dessert' ? 'selected' : ''}>Dessert</option>
                    </select>
                </div>

                <div class="mb-1">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Image URL</label>
                    <input type="text" id="prod-img" placeholder="http://..." value="${data.image_url || ''}">
                </div>

                <div style="margin-top:2rem; display:flex; gap:10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-ghost" onclick="inventory.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Product</button>
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
        try {
            const products = await api.get('/inventory/products');
            const p = products.find(x => x.id === id);
            if (p) {
                this.renderModal("Edit Product", p);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async submitForm(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('prod-name').value,
            category: document.getElementById('prod-category').value,
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
