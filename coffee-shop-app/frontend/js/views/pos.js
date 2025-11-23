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
                <h1 style="font-size: 3.5rem; margin-bottom: 1rem; color: var(--accent-primary);">Welcome</h1>
                <p style="color: var(--text-secondary); margin-bottom: 3rem; font-size: 1.2rem;">Start a new order to begin</p>
                <button class="btn" style="padding: 1.2rem 3.5rem; font-size: 1.2rem; border-radius: 50px; background-color: var(--accent-primary); color: #1a1a1a; font-weight: bold;" onclick="pos.startOrder()">
                    New Order
                </button>
            </div>
        `;
    }

    renderSplitLayout() {
        this.container.innerHTML = `
            <div class="pos-layout">
                <div class="pos-menu-section" style="padding: 20px;">
                    <!-- Tabs -->
                    <div class="category-tabs" style="margin-bottom: 20px; display: flex; gap: 10px;">
                        <button class="btn ${this.activeTab === 'all' ? 'active-tab' : 'inactive-tab'}" style="flex:1" onclick="pos.setTab('all')">All Menu</button>
                        <button class="btn ${this.activeTab === 'makanan' ? 'active-tab' : 'inactive-tab'}" style="flex:1" onclick="pos.setTab('makanan')">Food</button>
                        <button class="btn ${this.activeTab === 'minuman' ? 'active-tab' : 'inactive-tab'}" style="flex:1" onclick="pos.setTab('minuman')">Drinks</button>
                    </div>

                    <!-- Sub Tabs -->
                    <div class="sub-tabs-container" id="sub-tabs-area" style="margin-bottom: 20px; display:flex; gap:10px; overflow-x:auto;"></div>

                    <!-- Grid -->
                    <div class="product-grid" id="product-grid-area" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; padding-bottom: 80px;">
                        <!-- Products injected here -->
                    </div>
                </div>

                <div class="pos-cart-section" style="background-color: var(--bg-sidebar); display:flex; flex-direction:column; border-left: 1px solid rgba(255,255,255,0.05);">
                    <div class="cart-header" style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color: var(--accent-primary);">Current Order</h3>
                        <button class="btn" style="background-color: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 5px 10px;" onclick="pos.clearCart()">Clear</button>
                    </div>

                    <div class="cart-items" id="cart-items-area" style="flex:1; overflow-y:auto; padding: 10px;">
                        <!-- Cart items injected here -->
                    </div>

                    <div class="cart-footer" id="cart-footer-area" style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); background-color: rgba(0,0,0,0.2);">
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
                <button class="btn btn-sm ${this.activeSubTab === 'all' ? 'active-subtab' : 'inactive-subtab'}" style="border-radius:20px; padding: 5px 15px;" onclick="pos.setSubTab('all')">All</button>
                ${subTabs.map(st => `
                    <button class="btn btn-sm ${this.activeSubTab === st ? 'active-subtab' : 'inactive-subtab'}" style="border-radius:20px; padding: 5px 15px;" onclick="pos.setSubTab('${st}')">${st}</button>
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
        // Fallback image if none
        const imgUrl = p.image_url && p.image_url.startsWith('http') ? p.image_url : 'img/americano.jpg'; // Simple fallback

        return `
            <div class="menu-item" onclick="pos.addToCart(${p.id})" style="cursor:pointer; overflow:hidden; transition: transform 0.2s;">
                <div style="height: 120px; background-image: url('${imgUrl}'); background-size: cover; background-position: center;"></div>
                <div style="padding: 10px;">
                    <div style="font-weight: bold; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
                    <div style="color: var(--accent-primary);">Rp ${p.price.toLocaleString()}</div>
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
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px;">
                <div class="cart-item-info">
                    <div class="cart-item-title" style="font-weight:bold;">${item.name}</div>
                    <div class="cart-item-price" style="font-size:0.8rem; color: var(--text-muted);">Rp ${(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div class="cart-item-controls" style="display:flex; align-items:center; gap: 10px;">
                    <button class="btn-qty-sm" style="padding: 2px 8px; border-radius: 4px; background: var(--bg-primary); border: 1px solid rgba(255,255,255,0.1); color: white;" onclick="pos.changeQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty-sm" style="padding: 2px 8px; border-radius: 4px; background: var(--bg-primary); border: 1px solid rgba(255,255,255,0.1); color: white;" onclick="pos.changeQty(${item.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

        // Render Totals
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;
        this.currentTotal = total;

        footerArea.innerHTML = `
            <div class="cart-summary-row" style="display:flex; justify-content:space-between; margin-bottom: 5px; color: var(--text-secondary);">
                <span>Subtotal</span>
                <span>Rp ${subtotal.toLocaleString()}</span>
            </div>
            <div class="cart-summary-row" style="display:flex; justify-content:space-between; margin-bottom: 10px; color: var(--text-secondary);">
                <span>Tax (10%)</span>
                <span>Rp ${tax.toLocaleString()}</span>
            </div>
            <div class="cart-total-row" style="display:flex; justify-content:space-between; font-size: 1.5rem; font-weight: bold; margin-bottom: 20px; color: var(--accent-primary);">
                <span>Total</span>
                <span>Rp ${total.toLocaleString()}</span>
            </div>
            <button class="btn" style="width:100%; padding: 1rem; font-size: 1.1rem; background-color: var(--accent-primary); color: #1a1a1a; font-weight:bold;" onclick="pos.openPaymentModal()">
                Process Payment
            </button>
        `;
    }

    // --- PAYMENT MODAL ---

    openPaymentModal() {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        
        container.innerHTML = `
            <div class="modal-header" style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                <h2 style="margin:0;">Select Payment Method</h2>
                <button class="close-btn" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align:center; margin-bottom: 2rem;">
                    <span style="font-size: 0.9rem; color: var(--text-secondary);">Total Amount</span>
                    <div style="font-size: 2.5rem; font-weight: 800; color: var(--accent-primary);">Rp ${this.currentTotal.toLocaleString()}</div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="payment-method-card" style="padding: 30px; background: var(--bg-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; color: white;" onclick="pos.showCashPayment()">
                        <i class="fas fa-money-bill-wave" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                        <span>Cash</span>
                    </button>
                    <button class="payment-method-card" style="padding: 30px; background: var(--bg-primary); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; color: white;" onclick="pos.showCashlessPayment()">
                        <i class="fas fa-qrcode" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
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
            <div class="modal-header" style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                <h2 style="margin:0;">Cash Payment</h2>
                <button class="close-btn" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align:center; margin-bottom: 2rem;">
                     <div style="font-size: 2.5rem; font-weight: 800; color: var(--accent-primary);">Rp ${this.currentTotal.toLocaleString()}</div>
                </div>

                <div class="mb-1" style="margin-bottom: 15px;">
                    <label style="font-weight:600; display:block; margin-bottom: 5px;">Cash Received</label>
                    <input type="number" id="cash-input" style="width: 100%; font-size:1.5rem; font-weight:bold; background: var(--bg-primary); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;" placeholder="0" autofocus>
                </div>

                <div id="change-display" style="text-align:center; font-size:1.2rem; font-weight:600; margin: 1.5rem 0; min-height: 24px;">
                    Change: -
                </div>

                <button class="btn" style="width:100%; padding: 1rem; font-size:1.1rem; background-color: var(--accent-primary); color: #1a1a1a; font-weight:bold;" onclick="pos.processCashPayment()">Complete Order</button>
            </div>
        `;

        const input = document.getElementById('cash-input');
        input.focus();
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            const change = val - this.currentTotal;
            const disp = document.getElementById('change-display');
            if (change >= 0) {
                disp.style.color = 'var(--success)';
                disp.textContent = `Change: Rp ${change.toLocaleString()}`;
            } else {
                disp.style.color = 'var(--danger)';
                disp.textContent = `Remaining: Rp ${Math.abs(change).toLocaleString()}`;
            }
        });
    }

    showCashlessPayment() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal-header" style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                <h2 style="margin:0;">Scan QRIS</h2>
                <button class="close-btn" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <div style="background:white; padding:1rem; border:1px solid #EEE; display:inline-block; border-radius:12px; margin-bottom:1rem;">
                    <img src="img/qris.png" style="width:200px; height:200px; object-fit:contain;" onerror="this.src='https://via.placeholder.com/200?text=QRIS'">
                </div>
                <p>Scan with your payment app</p>
                <h3 style="margin: 1rem 0; color: var(--accent-primary);">Rp ${this.currentTotal.toLocaleString()}</h3>

                <button class="btn" style="width:100%; margin-top:1rem; padding: 1rem; background-color: var(--accent-primary); color: #1a1a1a; font-weight:bold;" onclick="pos.processCashlessPayment()">Confirm Payment</button>
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
            // Hide modal after a delay or let renderSuccess handle it
            setTimeout(() => {
                document.getElementById('modal-overlay').classList.add('hidden');
                this.cart = [];
                this.startOrder(); // Go back to new order automatically
            }, 3000);

        } catch (err) {
            alert("Order failed: " + err.message);
        }
    }

    renderSuccess() {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; animation: fade-in 0.5s; padding: 40px;">
                <div style="width:80px; height:80px; background:var(--success); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#1a1a1a; font-size:2.5rem; margin-bottom:1.5rem; box-shadow: var(--shadow-md);">
                    <i class="fas fa-check"></i>
                </div>
                <h2 style="margin-bottom:0.5rem;">Payment Successful!</h2>
                <p style="color:var(--text-secondary); margin-bottom:2rem;">Thank you for your order.</p>
            </div>
        `;
    }
}
