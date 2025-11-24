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
                <div style="position:absolute; right:20px;">
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

                    <button class="btn btn-primary" style="margin-top:10px; width:100%;" onclick="pos.openCartMobile()">
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
                        <span>Jumlah</span>
                    </div>

                    <div class="cart-items" id="cart-items">
                        <!-- Items -->
                    </div>

                    <div class="cart-footer">
                         <div id="cart-totals"></div>
                         <button class="btn btn-primary" style="width:100%; margin-top:15px;" onclick="pos.showPayment()">Bayar Sekarang</button>
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

        return `
            <div class="product-card" onclick="pos.addToCart(${p.id})">
                <div class="product-img" style="background-image: url('${imgUrl}')"></div>
                ${qtyDisplay}
                <div class="product-info">
                    <div style="font-weight:bold; font-size:0.9rem; margin-bottom:5px;">${p.name}</div>
                    <div style="font-weight:bold;">Rp ${p.price.toLocaleString()}</div>
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
        const exist = this.cart.find(x => x.id === id);
        if(exist) exist.quantity++;
        else this.cart.push({...p, quantity: 1});
        this.updateCartUI();
        this.updateMenuState(); // Update badges
    }

    updateCartUI() {
        const list = document.getElementById('cart-items');
        const totals = document.getElementById('cart-totals');

        if(!list) return;

        list.innerHTML = this.cart.map(i => `
            <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:5px; margin-bottom:5px; font-size:0.9rem; align-items:center;">
                <div>${i.name}</div>
                <div style="background:#dbeeff; padding:2px 5px; border-radius:5px;">Rp ${i.price.toLocaleString()}</div>
                <div style="text-align:center; background:#dbeeff; padding:2px 5px; border-radius:5px;">${i.quantity}</div>
            </div>
        `).join('');

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
        // Just scroll to cart or show modal if mobile (omitted for simplicity, assuming desktop layout mainly)
        document.getElementById('desktop-cart').scrollIntoView({behavior: 'smooth'});
    }

    // --- PAYMENT ---
    showPayment() {
        if(this.cart.length === 0) return alert("Cart is empty");

        const container = document.getElementById('modal-container');
        document.getElementById('modal-overlay').classList.remove('hidden');

        container.innerHTML = `
            <h2>Metode Pembayaran</h2>

            <div style="margin: 15px 0;">
                <label style="display:block; margin-bottom:5px; font-weight:bold;">Nama Pelanggan:</label>
                <input type="text" id="customer-name" placeholder="Masukan Nama Pelanggan" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
            </div>

            <div style="text-align:left; margin:20px 0;">
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <span>E-Wallet (Dana/GoPay)</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <span>Kartu Kredit/Debit (VISA)</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; background:#eef; cursor:pointer;" onclick="pos.processPayment()">
                    <span>QRIS / Cash</span>
                    <i class="fas fa-check"></i>
                </div>
            </div>
            <button class="btn btn-primary" style="width:100%;" onclick="pos.processPayment()">Bayar Sekarang</button>
        `;
    }

    async processPayment() {
        const customerName = document.getElementById('customer-name').value;
        if (!customerName || customerName.trim() === '') {
            return alert("Silakan masukan nama pelanggan!");
        }

        // Simplified flow: Assume success immediately for "Bayar Sekarang"
        const orderData = {
            total_amount: this.currentTotal,
            payment_method: 'Cash', // Defaulting for simplicity
            payment_received: this.currentTotal,
            customer_name: customerName,
            items: this.cart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await api.post('/pos/orders', orderData);
            if(res.error) throw new Error(res.error);
            this.renderSuccess(res.order_id);
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
