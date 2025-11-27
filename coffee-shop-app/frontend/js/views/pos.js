class POSView {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.activeTab = 'all';
        this.activeSubTab = 'all';
    }

    async render(container) {
        this.container = container;
        window.pos = this;
        // Skip splash, start order immediately
        this.startOrder();
    }

    async startOrder() {
        await this.loadData();
        this.renderMenuLayout();
    }

    // --- DATA ---
    async loadData() {
        try {
            // Fetch sorted products from the new backend endpoint
            const res = await api.get('/pos/products/sorted?sort_by=name&order=asc');
            this.products = res || [];
        } catch (e) {
            console.error(e);
            alert("Failed to load products");
        }
    }

    // --- MENU LAYOUT ---
    renderMenuLayout() {
        this.container.innerHTML = `
            <header class="app-header">
                <div class="header-title">
                    <h1>Coffee Shop</h1>
                    <span>Cafe and Restaurant</span>
                </div>
                <div id="menu-trigger-btn" style="position:absolute; right:20px; cursor: pointer;" onclick="app.toggleQuickActions()">
                    <i class="fas fa-bars" style="font-size:1.5rem;"></i>
                </div>
            </header>

            <div class="menu-layout">
                <!-- Left: Menu -->
                <div class="menu-section">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0;">
                        <h2 style="margin:0;">Menu</h2>
                        <span style="font-weight:bold;">CONTACT</span>
                    </div>

                    <!-- Main Tabs -->
                    <div class="tabs-container">
                        <button class="tab-btn ${this.activeTab === 'all' ? 'active' : ''}" onclick="pos.setTab('all')">Semua Menu</button>
                        <button class="tab-btn ${this.activeTab === 'makanan' ? 'active' : ''}" onclick="pos.setTab('makanan')">Makanan</button>
                        <button class="tab-btn ${this.activeTab === 'minuman' ? 'active' : ''}" onclick="pos.setTab('minuman')">Minuman</button>
                    </div>

                    <!-- Sub Tabs -->
                    <div class="subtabs-container" id="subtabs-area">
                        <!-- Injected -->
                    </div>

                    <!-- Grid -->
                    <div class="product-grid" id="product-grid">
                        <!-- Injected -->
                    </div>

                    <button class="btn btn-primary" style="margin-top:10px; width:100%; display:none;" onclick="pos.openCartMobile()">
                        Pesan Sekarang (View Cart)
                    </button>
                </div>

                <!-- Right: Cart (Visible on desktop/tablet) -->
                <div class="cart-section" id="desktop-cart">
                    <div class="cart-header">
                        <h3>Keranjang Pemesanan</h3>
                    </div>

                    <div style="padding:10px; display:grid; grid-template-columns: 2fr 1fr 1fr; font-weight:bold; font-size:0.9rem;">
                        <span>Pesanan</span>
                        <span>Harga</span>
                        <span style="text-align:center;">Jumlah</span>
                    </div>

                    <div class="cart-items" id="cart-items">
                        <!-- Items -->
                    </div>

                    <div class="cart-footer">
                         <div id="cart-totals"></div>
                         <button class="btn btn-primary" id="btn-pay-main" style="width:100%; margin-top:15px;" onclick="pos.showPayment()">Bayar Sekarang</button>
                    </div>
                </div>
            </div>
        `;

        this.updateMenuState();
        this.updateCartUI();
    }

    // --- UPDATE LOGIC ---
    updateMenuState() {
        const subTabsArea = document.getElementById('subtabs-area');
        const grid = document.getElementById('product-grid');

        // Subtabs
        let subTabs = [];
        if (this.activeTab === 'makanan') subTabs = ['Berat', 'Ringan'];
        if (this.activeTab === 'minuman') subTabs = ['Dingin', 'Panas'];

        if (subTabs.length > 0) {
            subTabsArea.innerHTML = subTabs.map(st => `
                <button class="subtab-btn ${this.activeSubTab === st ? 'active' : ''}" onclick="pos.setSubTab('${st}')">
                    ${this.activeTab === 'makanan' ? 'Makanan ' : 'Minuman '} ${st}
                </button>
            `).join('');
            subTabsArea.style.display = 'flex';
        } else {
            subTabsArea.style.display = 'none';
        }

        // Filter Products
        let filtered = this.products;
        if (this.activeTab === 'makanan') {
            if (this.activeSubTab === 'Berat') filtered = filtered.filter(p => p.category === 'Makanan Berat' || p.category === 'Main Course');
            else if (this.activeSubTab === 'Ringan') filtered = filtered.filter(p => ['Makanan Ringan', 'Snacks', 'Dessert'].includes(p.category));
            else filtered = filtered.filter(p => ['Makanan Berat', 'Makanan Ringan', 'Main Course', 'Snacks', 'Dessert'].includes(p.category));
        } else if (this.activeTab === 'minuman') {
             if (this.activeSubTab === 'Panas') filtered = filtered.filter(p => p.category === 'Minuman Panas' || p.category === 'Classic Coffee');
            else if (this.activeSubTab === 'Dingin') filtered = filtered.filter(p => ['Minuman Dingin', 'Signature Coffee', 'Non-Coffee'].includes(p.category));
            else filtered = filtered.filter(p => ['Minuman Panas', 'Minuman Dingin', 'Classic Coffee', 'Signature Coffee', 'Non-Coffee'].includes(p.category));
        }

        grid.innerHTML = filtered.map(p => this.renderCard(p)).join('');
    }

    renderCard(p) {
        const imgUrl = p.image_url && p.image_url.startsWith('http') ? p.image_url : 'img/americano.jpg';
        // Check if item is in cart to show qty badge?
        const inCart = this.cart.find(i => i.id === p.id);
        const qtyDisplay = inCart ? `<div style="position:absolute; top:5px; right:5px; background:var(--primary-blue); color:white; border-radius:50%; width:25px; height:25px; display:flex; align-items:center; justify-content:center; font-weight:bold;">${inCart.quantity}</div>` : '';

        // Stock Display Logic
        let stockDisplay = '';
        if (p.is_inventory_managed) {
            stockDisplay = `<div style="font-size:0.8rem; color:${p.stock_quantity > 0 ? 'green' : 'red'};">Stock: ${p.stock_quantity}</div>`;
        }

        return `
            <div class="product-card" onclick="pos.addToCart(${p.id})">
                <div class="product-img" style="background-image: url('${imgUrl}')"></div>
                ${qtyDisplay}
                <div class="product-info">
                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:5px;">${p.name}</div>
                    <div style="font-weight:bold;">Rp ${p.price.toLocaleString()}</div>
                    ${stockDisplay}
                </div>
                <button class="add-btn">+</button>
            </div>
        `;
    }

    setTab(t) {
        this.activeTab = t;
        this.activeSubTab = 'all'; // Reset subtab
        this.updateMenuState();
    }

    setSubTab(st) {
        this.activeSubTab = st;
        this.updateMenuState();
    }

    // --- CART ---
    addToCart(id) {
        const p = this.products.find(x => x.id === id);

        // Stock Check (Frontend Side)
        if (p.is_inventory_managed) {
            const currentQty = this.cart.find(x => x.id === id)?.quantity || 0;
            if (currentQty + 1 > p.stock_quantity) {
                 // Optional: Show subtle toast, but for now just don't add
                 return;
            }
        }

        const exist = this.cart.find(x => x.id === id);
        if(exist) exist.quantity++;
        else this.cart.push({...p, quantity: 1});
        this.updateCartUI();
        this.updateMenuState(); // Update badges
    }

    removeFromCart(id) {
        const exist = this.cart.find(x => x.id === id);
        if(!exist) return;

        if (exist.quantity > 1) {
            exist.quantity--;
        } else {
            // Confirm delete? For speed, maybe just delete or require small confirm.
            // User requirement: "If Qty == 1: Change icon to Trash. Clicking removes item."
            // Handled in UI rendering, here we just remove.
            this.cart = this.cart.filter(x => x.id !== id);
        }
        this.updateCartUI();
        this.updateMenuState();
    }

    deleteFromCart(id) {
        this.cart = this.cart.filter(x => x.id !== id);
        this.updateCartUI();
        this.updateMenuState();
    }

    updateCartUI() {
        const list = document.getElementById('cart-items');
        const totals = document.getElementById('cart-totals');
        const btnPay = document.getElementById('btn-pay-main');

        if(!list) return;

        if (this.cart.length === 0) {
             list.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">Cart Empty</div>`;
             if(btnPay) btnPay.disabled = true;
        } else {
             if(btnPay) btnPay.disabled = false;
        }

        list.innerHTML = this.cart.map(i => {
            const isSingle = i.quantity === 1;
            const minusBtn = isSingle
                ? `<button onclick="pos.deleteFromCart(${i.id})" style="background:none; border:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>`
                : `<button onclick="pos.removeFromCart(${i.id})" style="background:#eee; border:none; width:20px; border-radius:3px; cursor:pointer;">-</button>`;

            return `
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:5px; margin-bottom:5px; font-size:0.9rem; align-items:center;">
                <div>${i.name}</div>
                <div style="background:#dbeeff; padding:2px 5px; border-radius:5px;">Rp ${i.price.toLocaleString()}</div>
                <div style="display:flex; align-items:center; justify-content:center; gap:5px;">
                    ${minusBtn}
                    <span>${i.quantity}</span>
                    <button onclick="pos.addToCart(${i.id})" style="background:#eee; border:none; width:20px; border-radius:3px; cursor:pointer;">+</button>
                </div>
            </div>
        `}).join('');

        const sub = this.cart.reduce((a, b) => a + (b.price * b.quantity), 0);
        const tax = sub * 0.1;
        const total = sub + tax;
        this.currentTotal = total;

        totals.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Pesanan</span> <span>Rp ${sub.toLocaleString()}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Pajak 10%</span> <span>Rp ${tax.toLocaleString()}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1rem; background:#dbeeff; padding:5px; border-radius:5px;">
                <span>Total</span> <span>Rp ${total.toLocaleString()}</span>
            </div>
        `;
    }

    openCartMobile() {
        document.getElementById('desktop-cart').scrollIntoView({behavior: 'smooth'});
    }

    // --- PAYMENT ---
    showPayment() {
        if(this.cart.length === 0) return alert("Cart is empty");

        const container = document.getElementById('modal-container');
        document.getElementById('modal-overlay').classList.remove('hidden');

        // Default state
        this.selectedPaymentMethod = 'Cash';

        container.innerHTML = `
            <div style="position:relative;">
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" style="position:absolute; right:0; top:-10px; border:none; background:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h2>Metode Pembayaran</h2>
            </div>

            <div style="margin: 20px 0; text-align: center;">
                 <div style="display:flex; justify-content:center; gap:20px; margin-bottom:20px;">
                    <button class="btn" id="btn-cash" style="background:var(--primary-blue); color:white; min-width:100px;" onclick="pos.setPaymentMethod('Cash')">Cash</button>
                    <button class="btn" id="btn-qris" style="background:#eee; color:#333; min-width:100px;" onclick="pos.setPaymentMethod('QRIS')">QRIS</button>
                 </div>

                 <div id="payment-content" style="min-height: 150px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <!-- Content injected by setPaymentMethod -->
                 </div>
            </div>

            <div style="display:flex; gap:10px;">
                <button class="btn" style="flex:1; background:#ccc;" onclick="document.getElementById('modal-overlay').classList.add('hidden')">Cancel</button>
                <button class="btn btn-primary" id="btn-process-pay" style="flex:2;" onclick="pos.processPayment()">Bayar Sekarang</button>
            </div>
        `;

        // Initialize
        this.setPaymentMethod('Cash');
    }

    setPaymentMethod(method) {
        this.selectedPaymentMethod = method;

        const btnCash = document.getElementById('btn-cash');
        const btnQris = document.getElementById('btn-qris');
        const btnProcess = document.getElementById('btn-process-pay');

        if(method === 'Cash') {
            btnCash.style.background = 'var(--primary-blue)';
            btnCash.style.color = 'white';
            btnQris.style.background = '#eee';
            btnQris.style.color = '#333';

            // Real-time calculation logic
            document.getElementById('payment-content').innerHTML = `
                <div style="width:100%;">
                    <label style="display:block; margin-bottom:5px; font-weight:bold;">Jumlah Pembayaran (Rp)</label>
                    <input type="number" id="payment-amount" placeholder="0" style="width:100%; padding:15px; font-size:1.5rem; text-align:center; border:1px solid #ddd; border-radius:5px; margin-bottom:10px;">
                    <div id="change-display" style="font-size:1.2rem; font-weight:bold; color:#666; min-height:1.5rem;"></div>
                    <div id="error-display" style="color:red; font-weight:bold; min-height:1.5rem;"></div>
                </div>
            `;

            const input = document.getElementById('payment-amount');
            input.focus();
            input.addEventListener('keyup', (e) => this.calculateChange(e.target.value));
            input.addEventListener('change', (e) => this.calculateChange(e.target.value));

            // Initial check (disable button until amount entered)
            btnProcess.disabled = true;

        } else {
            btnQris.style.background = 'var(--primary-blue)';
            btnQris.style.color = 'white';
            btnCash.style.background = '#eee';
            btnCash.style.color = '#333';
            btnProcess.disabled = false;

            document.getElementById('payment-content').innerHTML = `
                <img src="img/qris.png" alt="QRIS Code" style="max-width:200px; border-radius:10px;">
                <p style="margin-top:10px; font-weight:bold;">Scan to Pay</p>
                <p>Total: Rp ${this.currentTotal.toLocaleString()}</p>
            `;
        }
    }

    calculateChange(val) {
        const amount = parseFloat(val);
        const changeDisplay = document.getElementById('change-display');
        const errorDisplay = document.getElementById('error-display');
        const btnProcess = document.getElementById('btn-process-pay');

        if (isNaN(amount)) {
            changeDisplay.textContent = '';
            errorDisplay.textContent = '';
            btnProcess.disabled = true;
            return;
        }

        if (amount < this.currentTotal) {
            const diff = this.currentTotal - amount;
            errorDisplay.textContent = `Kurang Rp ${diff.toLocaleString()}`;
            changeDisplay.textContent = '';
            btnProcess.disabled = true;
        } else {
            const change = amount - this.currentTotal;
            errorDisplay.textContent = '';
            changeDisplay.textContent = `Kembalian: Rp ${change.toLocaleString()}`;
            btnProcess.disabled = false;
        }
    }

    async processPayment() {
        let paymentReceived = 0;

        if (this.selectedPaymentMethod === 'Cash') {
            const input = document.getElementById('payment-amount');
            if(input) paymentReceived = parseFloat(input.value);

            if (isNaN(paymentReceived) || paymentReceived < this.currentTotal) {
                // Should be handled by UI validation, but double check
                return;
            }
        } else {
            paymentReceived = this.currentTotal;
        }

        // Retrieve User ID from Auth Store
        // Assuming app.currentUser contains the logged in user info
        const userId = window.app && window.app.currentUser ? window.app.currentUser.id : null;

        const orderData = {
            user_id: userId,
            total_amount: this.currentTotal,
            payment_method: this.selectedPaymentMethod,
            payment_received: paymentReceived,
            customer_name: null,
            items: this.cart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await api.post('/pos/orders', orderData);
            if(res.error) throw new Error(res.error);
            this.renderSuccess(res.transaction_code || res.id);
        } catch(e) {
            alert("Error: " + e.message);
        }
    }

    renderSuccess(orderId) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div style="padding:20px;">
                <h2 style="margin-bottom:10px;">Pembayaran Berhasil</h2>
                <h3 style="margin-top:0;">Terima Kasih</h3>

                <div style="margin: 30px 0;">
                    <i class="fas fa-check-circle" style="font-size: 6rem; color: #76c720;"></i>
                </div>

                <p>Order ID: ${orderId}</p>

                <button class="btn btn-primary" style="font-size:1.5rem; padding: 15px 40px;" onclick="location.reload()">Selesai</button>
            </div>
        `;
    }
}
