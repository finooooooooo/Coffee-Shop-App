class InventoryView {
    constructor() {
        this.currentId = null;
        this.categories = [];
    }

    async render(container) {
        const html = `
            <header class="app-header">
                <div class="header-title">
                    <h1>Admin Dashboard</h1>
                    <span>Inventory Management</span>
                </div>
                <div id="menu-trigger-btn" style="position:absolute; right:20px; cursor: pointer;" onclick="app.toggleQuickActions()">
                    <i class="fas fa-bars" style="font-size:1.5rem;"></i>
                </div>
            </header>

            <div class="inventory-container fade-in" style="padding: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <div>
                        <h2>Products</h2>
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
                                <th>Status / Stock</th>
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
        await this.loadCategories(); // Fetch categories once
        await this.loadInventory();
    }

    async loadCategories() {
        try {
            this.categories = await api.get('/inventory/categories');
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    }

    async loadInventory() {
        try {
            const products = await api.get('/inventory/products');
            const tbody = document.getElementById('inv-table-body');

            if (!products || products.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem;">No products found</td></tr>`;
                return;
            }

            tbody.innerHTML = products.map(p => {
                let stockDisplay = '';
                if (p.is_inventory_managed) {
                    const color = p.stock_quantity < 10 ? 'var(--danger-color)' : 'var(--success-color)';
                    stockDisplay = `<span style="color: ${color}; font-weight: 600;">${p.stock_quantity} units</span>`;
                } else {
                     const statusColor = p.is_active ? 'green' : 'gray';
                     stockDisplay = `<span style="color: ${statusColor}; font-weight: 600;">${p.is_active ? 'Available' : 'Unavailable'}</span>`;
                }

                return `
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
                    <td>${stockDisplay}</td>
                    <td class="text-right">
                        <button class="btn btn-ghost" onclick="inventory.openEditModal(${p.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost" style="color: var(--danger-color);" onclick="inventory.delete(${p.id})" title="Deactivate">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        } catch (err) {
            console.error(err);
            document.getElementById('inv-table-body').innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading inventory</td></tr>`;
        }
    }

    renderModal(title, data = {}) {
        const modalContainer = document.getElementById('modal-container');
        const overlay = document.getElementById('modal-overlay');
        
        // Defaults
        const isManaged = data.is_inventory_managed !== undefined ? data.is_inventory_managed : true;
        const isActive = data.is_active !== undefined ? data.is_active : true;

        const catOptions = this.categories.map(c =>
            `<option value="${c.id}" ${data.category_id === c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('');

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

                <div class="mb-1">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Category</label>
                    <select id="prod-category-id" required>
                         <option value="">Select Category...</option>
                         ${catOptions}
                    </select>
                </div>

                <div class="mb-1" style="background:#f9f9f9; padding:10px; border-radius:5px;">
                     <label style="display:block; margin-bottom:8px; font-weight:bold;">Inventory Type</label>
                     <div style="display:flex; gap:20px;">
                        <label style="cursor:pointer;">
                            <input type="radio" name="inv_type" value="retail" ${isManaged ? 'checked' : ''} onchange="inventory.toggleStockInput(true)">
                            Retail (Stock Count)
                        </label>
                        <label style="cursor:pointer;">
                            <input type="radio" name="inv_type" value="kitchen" ${!isManaged ? 'checked' : ''} onchange="inventory.toggleStockInput(false)">
                            Kitchen (Manual Avail.)
                        </label>
                     </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:500;">Price (Rp)</label>
                        <input type="number" id="prod-price" placeholder="0" value="${data.price || ''}" required>
                    </div>

                    <div id="stock-input-container" style="${isManaged ? '' : 'display:none;'}">
                        <label style="display:block; margin-bottom:8px; font-weight:500;">Stock Quantity</label>
                        <input type="number" id="prod-stock" placeholder="0" value="${data.stock_quantity || 0}">
                    </div>

                    <div id="active-toggle-container" style="${!isManaged ? '' : 'display:none;'}">
                         <label style="display:block; margin-bottom:8px; font-weight:500;">Availability</label>
                         <select id="prod-active">
                            <option value="true" ${isActive ? 'selected' : ''}>Available</option>
                            <option value="false" ${!isActive ? 'selected' : ''}>Unavailable</option>
                         </select>
                    </div>
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

    toggleStockInput(isRetail) {
        document.getElementById('stock-input-container').style.display = isRetail ? 'block' : 'none';
        document.getElementById('active-toggle-container').style.display = isRetail ? 'none' : 'block';
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

        const isManaged = document.querySelector('input[name="inv_type"]:checked').value === 'retail';
        const stockVal = document.getElementById('prod-stock').value;
        const activeVal = document.getElementById('prod-active').value === 'true';

        const data = {
            name: document.getElementById('prod-name').value,
            category_id: parseInt(document.getElementById('prod-category-id').value),
            price: parseFloat(document.getElementById('prod-price').value),
            image_url: document.getElementById('prod-img').value,
            is_inventory_managed: isManaged,
            stock_quantity: isManaged ? parseInt(stockVal) : 0,
            is_active: isManaged ? true : activeVal // If retail, active is derived from stock logic backend (initially true)
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
            alert("Error saving product: " + (err.message || "Unknown error"));
            console.error(err);
        }
    }

    delete(id) {
        if(confirm("Deactivate this product?")) {
            api.delete(`/inventory/products/${id}`).then(() => this.loadInventory());
        }
    }
}
