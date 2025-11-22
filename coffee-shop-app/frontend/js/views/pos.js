class POSView {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.shiftOpen = false;
        this.activeCategory = 'All';
    }

    async render(container) {
        const html = `
            <div class="pos-container">
                <div class="products-area">
                    <div class="category-filter" id="category-list">
                        <!-- Categories here -->
                    </div>
                    <div class="product-grid" id="product-grid">
                        <!-- Products here -->
                    </div>
                </div>
                <div class="cart-area">
                    <h2>Current Order</h2>
                    <div class="cart-items" id="cart-items">
                        <!-- Cart items here -->
                    </div>
                    <div class="cart-total">
                        Total: Rp <span id="cart-total">0</span>
                    </div>
                    <button class="btn-checkout" onclick="pos.checkout()">Checkout</button>
                </div>
            </div>
        `;
        container.innerHTML = html;
        window.pos = this;

        await this.checkShiftStatus();
        await this.loadData();

        // New UI States
        this.currentView = 'lobby'; // lobby, menu, cart, success
        this.activeTab = 'all'; // all, makanan, minuman
        this.activeSubTab = 'all';

        window.pos = this; // Make instance globally available immediately
    }

    async render(container) {
        this.container = container;
        // Initial check and load
        await this.checkShiftStatus();
        await this.loadData();

        // Route to correct internal view
        this.updateView();
    }

    updateView() {
        this.container.innerHTML = '';
        switch(this.currentView) {
            case 'lobby':
                this.renderLobby();
                break;
            case 'menu':
                this.renderMenu();
                break;
            case 'cart':
                this.renderCart();
                break;
            case 'success':
                this.renderSuccess();
                break;
        }
    }

    // --- DATA LOADING ---
    async checkShiftStatus() {
        try {
            const res = await api.get('/pos/shift/status');
            this.shiftOpen = res.active;
            this.updateShiftUI();
        } catch (e) { console.error(e); }
    }

    updateShiftUI() {
        const statusDiv = document.getElementById('shift-status-display');
        if (!statusDiv) return; // Safety check

        if (!statusDiv) return;
        const indicator = statusDiv.querySelector('.indicator');
        const text = statusDiv.querySelector('span');

        if (this.shiftOpen) {
            indicator.className = 'indicator green';
            text.textContent = 'Shift Open';
        } else {
            indicator.className = 'indicator red';
            text.textContent = 'Shift Closed';
        }
    }

    async toggleShift() {
        if (this.shiftOpen) {
            const amount = prompt("Enter closing cash amount:", "0");
            if (amount !== null) {
                await api.post('/pos/shift/end', { end_cash: parseFloat(amount) });
                this.shiftOpen = false;
            }
        } else {
            const amount = prompt("Enter starting cash amount:", "0");
            if (amount !== null) {
                await api.post('/pos/shift/start', { start_cash: parseFloat(amount) });
                this.shiftOpen = true;
        try {
            if (this.shiftOpen) {
                const amount = prompt("Enter closing cash amount:", "0");
                if (amount !== null) {
                    const res = await api.post('/pos/shift/end', { end_cash: parseFloat(amount) });
                    if (res.error && res.error !== 'No active shift') {
                        alert(res.error);
                        return;
                    }
                    this.shiftOpen = false;
                }
            } else {
                const amount = prompt("Enter starting cash amount:", "0");
                if (amount !== null) {
                    const res = await api.post('/pos/shift/start', { start_cash: parseFloat(amount) });
                    if (res.error && res.error !== 'Shift already open') {
                        alert(res.error);
                        return;
                    }
                    this.shiftOpen = true;
                }
            }
            this.updateShiftUI();
        } catch (e) {
            console.error("Toggle Shift Error:", e);
            alert("Failed to toggle shift. Check console for details.");
        }
    }

    async loadData() {
        const [cats, prods] = await Promise.all([
            api.get('/inventory/categories'),
            api.get('/inventory/products')
        ]);
        this.categories = cats;
        this.products = prods;
    }

    // --- VIEWS ---

    renderLobby() {
        this.container.innerHTML = `
            <div class="lobby-container">
                <h1 class="lobby-title">Welcome to The Coffee Shop</h1>
                <button class="btn-huge" onclick="pos.setView('menu')">
                    Pesan (Order)
                </button>
                <div style="margin-top: 2rem; color: #888;">
                    <i class="fas fa-info-circle"></i> Please order at the kiosk
                </div>
            </div>
        `;
    }

    renderMenu() {
        try {
            // If products not loaded yet, show loading or try to load
            if (!this.products) {
                this.loadData().then(() => {
                    if (this.currentView === 'menu') this.renderMenu();
                });
                this.container.innerHTML = '<div style="text-align:center; padding:2rem;">Loading menu...</div>';
                return;
            }

            // Filter logic
            let filteredProducts = this.products;
        let subTabs = [];

        if (this.activeTab === 'makanan') {
            // Filter for Food categories (Snacks, Main Course)
            const foodCats = ['Snacks', 'Main Course'];
            filteredProducts = this.products.filter(p => foodCats.includes(p.category));
            subTabs = foodCats;
        } else if (this.activeTab === 'minuman') {
            // Filter for Drink categories
            const drinkCats = ['Signature Coffee', 'Classic Coffee', 'Non-Coffee'];
            filteredProducts = this.products.filter(p => drinkCats.includes(p.category));
            subTabs = drinkCats;
        }

        // Sub-tab filter
        if (this.activeSubTab !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === this.activeSubTab);
        }

        const cartCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const html = `
                <div style="height:100%; display:flex; flex-direction:column; overflow-y:auto;">
                    <!-- Tabs -->
                    <div class="kiosk-tabs">
                    <button class="kiosk-tab ${this.activeTab === 'all' ? 'active' : ''}"
                        onclick="pos.setTab('all')">Semua Menu</button>
                    <button class="kiosk-tab ${this.activeTab === 'makanan' ? 'active' : ''}"
                        onclick="pos.setTab('makanan')">Makanan</button>
                    <button class="kiosk-tab ${this.activeTab === 'minuman' ? 'active' : ''}"
                        onclick="pos.setTab('minuman')">Minuman</button>
                </div>

                <!-- Sub Tabs -->
                ${subTabs.length > 0 ? `
                    <div class="kiosk-subtabs">
                        <button class="subtab ${this.activeSubTab === 'all' ? 'active' : ''}"
                            onclick="pos.setSubTab('all')">All</button>
                        ${subTabs.map(st => `
                            <button class="subtab ${this.activeSubTab === st ? 'active' : ''}"
                                onclick="pos.setSubTab('${st}')">${st}</button>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Grid -->
                <div class="kiosk-grid">
                    ${filteredProducts.map(p => this.renderProductCard(p)).join('')}
                </div>

                <!-- Bottom Bar -->
                ${cartCount > 0 ? `
                    <div class="bottom-bar">
                        <div>
                            <div style="font-weight:bold;">${cartCount} Item(s)</div>
                            <div style="color:var(--kiosk-primary);">Rp ${cartTotal.toLocaleString()}</div>
                        </div>
                        <button class="btn-primary-action" style="width:auto;" onclick="pos.setView('cart')">
                            Pesan Sekarang <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                ` : ''}
                </div>
            `;
            this.container.innerHTML = html;
        } catch (e) {
            console.error("Error in renderMenu:", e);
            this.container.innerHTML = `<div style="color:red">Error rendering menu: ${e.message}</div>`;
        }
    }

    async loadData() {
        const [products, categories] = await Promise.all([
            api.get('/inventory/products'),
            api.get('/inventory/categories')
        ]);
        this.products = products;
        this.categories = categories;

        this.renderCategories();
        this.renderProducts();
    }

    renderCategories() {
        const container = document.getElementById('category-list');
        const allBtn = `<button class="btn-category ${this.activeCategory === 'All' ? 'active' : ''}" onclick="pos.filterCategory('All')">All</button>`;

        const catBtns = this.categories.map(c => `
            <button class="btn-category ${this.activeCategory === c.name ? 'active' : ''}" onclick="pos.filterCategory('${c.name}')">${c.name}</button>
        `).join('');

        container.innerHTML = allBtn + catBtns;
    }

    filterCategory(name) {
        this.activeCategory = name;
        this.renderCategories(); // Re-render to update active class
        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('product-grid');

        let filtered = this.products;
        if (this.activeCategory !== 'All') {
            filtered = this.products.filter(p => p.category === this.activeCategory);
        }

        grid.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="pos.addToCart(${p.id})">
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" class="product-img">
                <div class="product-info">
                    <h4>${p.name}</h4>
                    <div class="product-price">Rp ${p.price.toLocaleString()}</div>
                    <small>Stock: ${p.stock}</small>
    renderProductCard(p) {
        const cartItem = this.cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.quantity : 0;

        return `
            <div class="kiosk-card" onclick="pos.addToCart(${p.id})">
                ${qty > 0 ? `<div class="qty-badge">${qty}</div>` : ''}
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" class="card-img" loading="lazy">
                <div class="card-body">
                    <div class="card-title">${p.name}</div>
                    <div class="card-price">Rp ${p.price.toLocaleString()}</div>
                    <button class="btn-add">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderCart() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        this.currentTotal = total; // Store for payment

        const html = `
            <div class="cart-page">
                <h2><i class="fas fa-shopping-cart"></i> Keranjang Pesanan</h2>

                <div style="flex:1; overflow-y:auto;">
                    <table class="cart-table">
                        <thead>
                            <tr>
                                <th>Pesanan</th>
                                <th>Harga</th>
                                <th>Jumlah</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.cart.map(item => `
                                <tr>
                                    <td>
                                        <b>${item.name}</b><br>
                                        <small>${item.category || ''}</small>
                                    </td>
                                    <td>Rp ${item.price.toLocaleString()}</td>
                                    <td>
                                        <div class="qty-control">
                                            <button class="btn-qty" onclick="pos.changeQty(${item.id}, -1)">-</button>
                                            <span style="margin:0 10px;">${item.quantity}</span>
                                            <button class="btn-qty" onclick="pos.changeQty(${item.id}, 1)">+</button>
                                        </div>
                                    </td>
                                    <td>Rp ${(item.price * item.quantity).toLocaleString()}</td>
                                    <td>
                                        <button class="btn-delete" onclick="pos.changeQty(${item.id}, -${item.quantity})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="cart-summary">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                        <span>Subtotal</span>
                        <span>Rp ${subtotal.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <span>Pajak (10%)</span>
                        <span>Rp ${tax.toLocaleString()}</span>
                    </div>
                    <div class="cart-total" style="display:flex; justify-content:space-between; font-size:1.5rem; font-weight:bold; color:var(--kiosk-primary); margin-bottom:1.5rem;">
                        <span>Total</span>
                        <span>Rp ${total.toLocaleString()}</span>
                    </div>

                    <button class="btn-primary-action" onclick="pos.processPayment()">
                        Bayar Sekarang
                    </button>
                    <button style="margin-top:10px; width:100%; padding:1rem; background:transparent; border:none; color:#888; cursor:pointer;"
                        onclick="pos.setView('menu')">
                        Kembali ke Menu
                    </button>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
    }

    renderSuccess() {
        this.container.innerHTML = `
            <div class="lobby-container">
                <div style="width:100px; height:100px; background:var(--kiosk-success); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:3rem; margin-bottom:2rem;">
                    <i class="fas fa-check"></i>
                </div>
                <h1 class="lobby-title">Pembayaran Berhasil</h1>
                <p style="font-size:1.2rem; margin-bottom:2rem;">Terima Kasih!</p>
                <button class="btn-huge" onclick="pos.finishOrder()">
                    Selesai
                </button>
            </div>
        `;
    }

    // --- LOGIC HANDLERS ---

    setView(view) {
        this.currentView = view;
        this.updateView();
    }

    setTab(tab) {
        this.activeTab = tab;
        this.activeSubTab = 'all';
        this.updateView();
    }

    setSubTab(subTab) {
        this.activeSubTab = subTab;
        this.updateView();
    }

    addToCart(id) {
        if (!this.shiftOpen) {
            alert("Please open a shift first!");
            return;
        }

        const product = this.products.find(p => p.id === id);
        const existing = this.cart.find(i => i.id === id);

        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.updateView(); // Re-render to update badges/bottom bar
    }

    changeQty(id, change) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.cart = this.cart.filter(i => i.id !== id);
            }
            this.updateView();
        }
    }

    async processPayment() {
        // Simulating a payment modal input or direct success for Kiosk
        // Ideally we ask for payment type. For now, let's assume full cash/card payment matches total.
        
        const amount = prompt(`Total is Rp ${this.currentTotal.toLocaleString()}. Enter payment amount:`, this.currentTotal);
        if (!amount) return;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Simple prompt for now, can be upgraded to modal
        const payment = prompt(`Total: Rp ${total.toLocaleString()}\nEnter Payment Amount:`);
        const payment = parseFloat(amount);
        if (isNaN(payment) || payment < this.currentTotal) {
            alert("Insufficient payment.");
            return;
        }

        const orderData = {
            total_amount: this.currentTotal, // Backend recalculates this anyway
            payment_received: payment,
            items: this.cart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

            api.post('/pos/orders', orderData).then(() => {
                alert(`Success! Change: Rp ${(parseFloat(payment) - total).toLocaleString()}`);
                this.cart = [];
                this.updateCart();
                this.loadData(); // Refresh stock
            });
        } else {
            alert("Insufficient payment or cancelled.");
        try {
            await api.post('/pos/orders', orderData);
            this.setView('success');
            this.cart = [];
        } catch (err) {
            alert("Payment failed: " + err.message);
        }
    }

    finishOrder() {
        this.setView('lobby');
        this.loadData(); // Refresh stock
    }
}

// Expose to global scope
window.POSView = POSView;
