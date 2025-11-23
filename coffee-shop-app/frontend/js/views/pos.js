class POSView {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.activeTab = 'all'; // all, makanan, minuman
        this.activeSubTab = 'all';
    }

    async render(container) {
        this.container = container;
        window.pos = this;

        // Initial splash screen or direct load
        this.renderLobby();
    }

    async startOrder() {
        await this.loadData();
        this.renderSplitLayout();
    }

    // --- DATA LOADING ---
    async loadData() {
        try {
            const [products, categories] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/inventory/categories')
            ]);
            this.products = products || [];
            this.categories = categories || [];
        } catch (e) {
            console.error("Failed to load data", e);
            alert("Failed to load products. Check connection.");
        }
    }

    // --- VIEWS ---

    renderLobby() {
        this.container.innerHTML = `
            <div class="lobby-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary-color);">Welcome</h1>
                <p style="color: var(--text-secondary); margin-bottom: 3rem; font-size: 1.2rem;">Start a new order to begin</p>
                <button class="btn btn-primary" style="padding: 1rem 3rem; font-size: 1.2rem; border-radius: 50px;" onclick="pos.startOrder()">
                    New Order
                </button>
            </div>
        `;
    }

    renderSplitLayout() {
        this.container.innerHTML = `
            <div class="pos-layout">
                <div class="pos-menu-section">
                    <!-- Tabs -->
                    <div class="category-tabs">
                        <button class="tab-pill ${this.activeTab === 'all' ? 'active' : ''}" onclick="pos.setTab('all')">All Menu</button>
                        <button class="tab-pill ${this.activeTab === 'makanan' ? 'active' : ''}" onclick="pos.setTab('makanan')">Food</button>
                        <button class="tab-pill ${this.activeTab === 'minuman' ? 'active' : ''}" onclick="pos.setTab('minuman')">Drinks</button>
                    </div>

                    <!-- Sub Tabs -->
                    <div class="sub-tabs-container" id="sub-tabs-area"></div>

                    <!-- Grid -->
                    <div class="product-grid" id="product-grid-area">
                        <!-- Products injected here -->
                    </div>
                </div>

                <div class="pos-cart-section">
                    <div class="cart-header">
                        <h3>Current Order</h3>
                        <button class="btn btn-ghost btn-sm" onclick="pos.clearCart()">Clear</button>
                    </div>

                    <div class="cart-items" id="cart-items-area">
                        <!-- Cart items injected here -->
                    </div>

                    <div class="cart-footer" id="cart-footer-area">
                         <!-- Totals injected here -->
                    </div>
                </div>
            </div>
        `;

        this.updateMenu();
        this.updateCart();
    }

    // --- MENU LOGIC ---

    updateMenu() {
        const grid = document.getElementById('product-grid-area');
        const subTabsArea = document.getElementById('sub-tabs-area');
        if (!grid) return;

        // Subtabs Logic
        let subTabs = [];
        if (this.activeTab === 'makanan') subTabs = ['Berat', 'Ringan'];
        if (this.activeTab === 'minuman') subTabs = ['Dingin', 'Panas'];

        if (subTabs.length > 0) {
            subTabsArea.innerHTML = `
                <button class="subtab-pill ${this.activeSubTab === 'all' ? 'active' : ''}" onclick="pos.setSubTab('all')">All</button>
                ${subTabs.map(st => `
                    <button class="subtab-pill ${this.activeSubTab === st ? 'active' : ''}" onclick="pos.setSubTab('${st}')">${st}</button>
                `).join('')}
            `;
            subTabsArea.style.display = 'flex';
        } else {
            subTabsArea.style.display = 'none';
        }

        // Filtering
        let filtered = this.products;
        if (this.activeTab === 'makanan') {
            if (this.activeSubTab === 'Berat') filtered = filtered.filter(p => p.category === 'Main Course');
            else if (this.activeSubTab === 'Ringan') filtered = filtered.filter(p => ['Snacks', 'Dessert'].includes(p.category));
            else filtered = filtered.filter(p => ['Main Course', 'Snacks', 'Dessert'].includes(p.category));
        } else if (this.activeTab === 'minuman') {
             if (this.activeSubTab === 'Panas') filtered = filtered.filter(p => p.category === 'Classic Coffee');
            else if (this.activeSubTab === 'Dingin') filtered = filtered.filter(p => ['Signature Coffee', 'Non-Coffee'].includes(p.category));
            else filtered = filtered.filter(p => ['Classic Coffee', 'Signature Coffee', 'Non-Coffee'].includes(p.category));
        }

        grid.innerHTML = filtered.map(p => this.renderProductCard(p)).join('');
    }

    renderProductCard(p) {
        return `
            <div class="pos-card" onclick="pos.addToCart(${p.id})">
                <div class="pos-card-img" style="background-image: url('${p.image_url || 'https://via.placeholder.com/150'}');"></div>
                <div class="pos-card-content">
                    <div class="pos-card-title">${p.name}</div>
                    <div class="pos-card-price">Rp ${p.price.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    setTab(tab) {
        this.activeTab = tab;
        this.activeSubTab = 'all';
        this.updateMenu();
    }

    setSubTab(st) {
        this.activeSubTab = st;
        this.updateMenu();
    }

    // --- CART LOGIC ---

    addToCart(id) {
        const product = this.products.find(p => p.id === id);
        const existing = this.cart.find(i => i.id === id);

        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.updateCart();
    }

    changeQty(id, change) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.cart = this.cart.filter(i => i.id !== id);
            }
            this.updateCart();
        }
    }

    clearCart() {
        if(confirm("Clear cart?")) {
            this.cart = [];
            this.updateCart();
        }
    }

    updateCart() {
        const cartArea = document.getElementById('cart-items-area');
        const footerArea = document.getElementById('cart-footer-area');
        if (!cartArea) return;

        if (this.cart.length === 0) {
            cartArea.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary); opacity:0.5;">
                    <i class="fas fa-shopping-basket" style="font-size:3rem; margin-bottom:1rem;"></i>
                    <p>No items added</p>
                </div>
            `;
            footerArea.innerHTML = '';
            return;
        }

        // Render Items
        cartArea.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">Rp ${(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="btn-qty-sm" onclick="pos.changeQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty-sm" onclick="pos.changeQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

        // Render Totals
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        this.currentTotal = total;

        footerArea.innerHTML = `
            <div class="cart-summary-row">
                <span>Subtotal</span>
                <span>Rp ${subtotal.toLocaleString()}</span>
            </div>
            <div class="cart-summary-row">
                <span>Tax (10%)</span>
                <span>Rp ${tax.toLocaleString()}</span>
            </div>
            <div class="cart-total-row">
                <span>Total</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
            <button class="btn btn-primary btn-block" style="width:100%; margin-top:1rem; padding: 1rem;" onclick="pos.openPaymentModal()">
                Process Payment
            </button>
        `;
    }

    // --- PAYMENT MODAL ---

    openPaymentModal() {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        
        container.innerHTML = `
            <div class="modal-header">
                <h2>Select Payment Method</h2>
                <button class="close-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align:center; margin-bottom: 2rem;">
                    <span style="font-size: 0.9rem; color: var(--text-secondary);">Total Amount</span>
                    <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color);">Rp ${this.currentTotal.toLocaleString()}</div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="payment-method-card" onclick="pos.showCashPayment()">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Cash</span>
                    </button>
                    <button class="payment-method-card" onclick="pos.showCashlessPayment()">
                        <i class="fas fa-qrcode"></i>
                        <span>QRIS</span>
                    </button>
                </div>
            </div>
        `;
        overlay.classList.remove('hidden');
    }

    showCashPayment() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-header">
                <h2>Cash Payment</h2>
                <button class="close-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align:center; margin-bottom: 2rem;">
                     <div style="font-size: 2rem; font-weight: 800; color: var(--primary-color);">Rp ${this.currentTotal.toLocaleString()}</div>
                </div>

                <div class="mb-1">
                    <label style="font-weight:600;">Cash Received</label>
                    <input type="number" id="cash-input" style="font-size:1.5rem; font-weight:bold;" placeholder="0" autofocus>
                </div>

                <div id="change-display" style="text-align:center; font-size:1.1rem; font-weight:600; margin: 1.5rem 0; min-height: 24px;">
                    Change: -
                </div>

                <button class="btn btn-primary" style="width:100%; padding: 1rem;" onclick="pos.processCashPayment()">Complete Order</button>
            </div>
        `;

        const input = document.getElementById('cash-input');
        input.focus();
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            const change = val - this.currentTotal;
            const disp = document.getElementById('change-display');
            if (change >= 0) {
                disp.style.color = 'var(--success-color)';
                disp.textContent = `Change: Rp ${change.toLocaleString()}`;
            } else {
                disp.style.color = 'var(--danger-color)';
                disp.textContent = `Remaining: Rp ${Math.abs(change).toLocaleString()}`;
            }
        });
    }

    showCashlessPayment() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-header">
                <h2>Scan QRIS</h2>
                <button class="close-btn" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <div style="background:white; padding:1rem; border:1px solid #EEE; display:inline-block; border-radius:12px; margin-bottom:1rem;">
                    <img src="img/qris.png" style="width:200px; height:200px; object-fit:contain;" onerror="this.src='https://via.placeholder.com/200?text=QRIS'">
                </div>
                <p>Scan with your payment app</p>
                <h3 style="margin: 1rem 0;">Rp ${this.currentTotal.toLocaleString()}</h3>

                <button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="pos.processCashlessPayment()">Confirm Payment</button>
            </div>
        `;
    }

    async processCashPayment() {
        const input = document.getElementById('cash-input');
        const amount = parseFloat(input.value);
        if (!amount || amount < this.currentTotal) {
            alert("Insufficient cash!");
            return;
        }
        await this.finalizeOrder('Cash', amount);
    }

    async processCashlessPayment() {
        await this.finalizeOrder('QRIS', this.currentTotal);
    }

    async finalizeOrder(method, received) {
        const orderData = {
            total_amount: this.currentTotal,
            payment_method: method,
            payment_received: received,
            items: this.cart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await api.post('/pos/orders', orderData);
            if (res.error) throw new Error(res.error);

            this.renderSuccess();
            document.getElementById('modal-overlay').classList.add('hidden');
            this.cart = [];
        } catch (err) {
            alert("Order failed: " + err.message);
        }
    }

    renderSuccess() {
        // Simple success overlay or toast could be better, but we'll stick to a view or modal.
        // Let's replace the whole view temporarily.
        this.container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; animation: fade-in 0.5s;">
                <div style="width:80px; height:80px; background:var(--success-color); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:2.5rem; margin-bottom:1.5rem; box-shadow: var(--shadow-md);">
                    <i class="fas fa-check"></i>
                </div>
                <h2 style="margin-bottom:0.5rem;">Payment Successful!</h2>
                <p style="color:var(--text-secondary); margin-bottom:2rem;">Thank you for your order.</p>
                <button class="btn btn-primary" onclick="pos.startOrder()">New Order</button>
            </div>
        `;
    }
}
