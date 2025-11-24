class POSView {
    constructor(container) {
        this.container = container;
        this.cart = [];
        this.products = [];
        this.activeTab = 'all';
    }

    // --- 1. SPLASH SCREEN ---
    renderSplash() {
        this.container.innerHTML = `
            <div class="splash-container">
                <div class="splash-box">
                    <h2>WELCOME TO THE</h2>
                    <h1 style="font-size:3rem; margin:10px 0; font-family:cursive;">Coffee Shop</h1>
                    <p>Cafe and Restaurant</p>
                </div>
                <button class="btn btn-blue" style="padding: 15px 50px; font-size: 1.2rem;" onclick="app.pos.startOrder()">
                    PESAN (ORDER)
                </button>
            </div>
        `;
    }

    async startOrder() {
        // Load data then show menu
        try {
            // Fetch sorted products (Sort by Name Ascending)
            this.products = await api.get('/pos/products?sort_by=name&order=asc');
            this.renderMenu();
        } catch (e) {
            alert("Error loading products");
        }
    }

    // --- 2. MENU SCREEN ---
    renderMenu() {
        this.container.innerHTML = `
            <header class="app-header">
                <h1>Coffee Shop</h1>
            </header>
            <div class="menu-layout">
                <!-- LEFT: MENU -->
                <div class="menu-section">
                    <div class="tabs">
                        <button class="tab-btn ${this.activeTab==='all'?'active':''}" onclick="app.pos.setTab('all')">All Menu</button>
                        <button class="tab-btn ${this.activeTab==='makanan'?'active':''}" onclick="app.pos.setTab('makanan')">Foods</button>
                        <button class="tab-btn ${this.activeTab==='minuman'?'active':''}" onclick="app.pos.setTab('minuman')">Drinks</button>
                    </div>

                    <div class="product-grid" id="grid">
                        <!-- Items Injected Here -->
                    </div>
                </div>

                <!-- RIGHT: CART -->
                <div class="cart-section">
                    <div class="cart-header"><h3>Order Cart</h3></div>
                    <div class="cart-items" id="cart-list"></div>
                    <div class="cart-footer">
                        <div id="cart-total" style="font-size:1.5rem; font-weight:bold; margin-bottom:10px;">Total: Rp 0</div>
                        <button class="btn btn-blue" style="width:100%" onclick="app.pos.showPayment()">Bayar Sekarang</button>
                    </div>
                </div>
            </div>
        `;
        this.updateGrid();
        this.updateCart();
    }

    setTab(t) {
        this.activeTab = t;
        this.updateGrid();
        // Re-highlight tabs manually or re-render (simplified here by re-rendering whole menu for clarity)
        this.renderMenu();
    }

    updateGrid() {
        const grid = document.getElementById('grid');
        if(!grid) return;

        let filtered = this.products;
        if (this.activeTab === 'makanan') {
            filtered = this.products.filter(p => ['Main Course', 'Snacks'].includes(p.category));
        } else if (this.activeTab === 'minuman') {
            filtered = this.products.filter(p => ['Classic Coffee', 'Signature Coffee'].includes(p.category));
        }

        grid.innerHTML = filtered.map(p => `
            <div class="product-card" onclick="app.pos.addToCart(${p.id})">
                <div class="product-img" style="background-image: url('${p.image_url || 'img/placeholder.jpg'}')"></div>
                <div class="product-info">
                    <div style="font-weight:bold;">${p.name}</div>
                    <div style="color:#666;">Rp ${p.price.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    // --- CART LOGIC ---
    addToCart(id) {
        const p = this.products.find(x => x.id === id);
        const exist = this.cart.find(x => x.id === id);
        if(exist) exist.quantity++;
        else this.cart.push({...p, quantity: 1});
        this.updateCart();
    }

    updateCart() {
        const list = document.getElementById('cart-list');
        const totalEl = document.getElementById('cart-total');
        if(!list) return;

        list.innerHTML = this.cart.map(i => `
            <div class="cart-item">
                <div>
                    <div>${i.name}</div>
                    <small>@ Rp ${i.price.toLocaleString()}</small>
                </div>
                <div>x${i.quantity}</div>
            </div>
        `).join('');

        this.total = this.cart.reduce((a,b) => a + (b.price * b.quantity), 0);
        totalEl.textContent = `Total: Rp ${this.total.toLocaleString()}`;
    }

    // --- 3. PAYMENT MODAL ---
    showPayment() {
        if(this.cart.length === 0) return alert("Cart empty!");

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box">
                <h2>Payment Method</h2>
                <div style="display:grid; gap:10px; margin:20px 0;">
                    <button class="btn btn-grey" onclick="app.pos.processPay('QRIS')">QRIS / E-Wallet</button>
                    <button class="btn btn-grey" onclick="app.pos.processPay('Cash')">Cash</button>
                </div>
                <button class="btn btn-grey" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async processPay(method) {
        // Close modal
        document.querySelector('.modal-overlay').remove();

        // Send to Backend
        const payload = {
            items: this.cart.map(i => ({id: i.id, quantity: i.quantity})),
            payment_method: method,
            payment_received: this.total // Auto-fill for simplicity
        };

        try {
            const res = await api.post('/pos/orders', payload);
            if(res.error) throw new Error(res.error);

            // Show Success
            this.renderSuccess(res.order_id);
            this.cart = []; // Reset
        } catch(e) {
            alert("Order Failed: " + e.message);
        }
    }

    // --- 4. SUCCESS SCREEN ---
    renderSuccess(orderId) {
        this.container.innerHTML = `
            <div class="splash-container">
                <div class="splash-box" style="border-color:#76c720;">
                    <h2 style="color:#76c720;">PAYMENT SUCCESSFUL</h2>
                    <h1 style="font-size:4rem; margin:20px 0;">✔</h1>
                    <p>Order ID: <strong>${orderId}</strong></p>
                    <p>Receipt Generated.</p>
                </div>
                <button class="btn btn-blue" onclick="app.pos.renderSplash()">SELESAI (DONE)</button>
            </div>
        `;
    }
}
