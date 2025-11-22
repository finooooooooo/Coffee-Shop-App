class POSView {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.shiftOpen = false;

        // New UI States
        this.currentView = 'lobby'; // lobby, menu, cart, success
        this.activeTab = 'all'; // all, makanan, minuman
        this.activeSubTab = 'all';
    }

    async render(container) {
        this.container = container;
        window.pos = this; // Expose to global scope

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
        try {
            const [products, categories] = await Promise.all([
                api.get('/inventory/products'),
                api.get('/inventory/categories')
            ]);
            this.products = products || [];
            this.categories = categories || [];
        } catch (e) {
            console.error("Failed to load data", e);
        }
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
            // Filter logic
            let filteredProducts = this.products;
            let subTabs = [];

            if (this.activeTab === 'makanan') {
                // Makanan: Berat (Main Course), Ringan (Snacks, Dessert)
                subTabs = ['Berat', 'Ringan'];
                if (this.activeSubTab === 'Berat') {
                    filteredProducts = this.products.filter(p => ['Main Course'].includes(p.category));
                } else if (this.activeSubTab === 'Ringan') {
                    filteredProducts = this.products.filter(p => ['Snacks', 'Dessert'].includes(p.category));
                } else {
                    // Show all food
                    filteredProducts = this.products.filter(p => ['Main Course', 'Snacks', 'Dessert'].includes(p.category));
                }
            } else if (this.activeTab === 'minuman') {
                // Minuman: Panas (Classic Coffee), Dingin (Signature Coffee, Non-Coffee)
                subTabs = ['Dingin', 'Panas'];
                if (this.activeSubTab === 'Panas') {
                    filteredProducts = this.products.filter(p => ['Classic Coffee'].includes(p.category));
                } else if (this.activeSubTab === 'Dingin') {
                    filteredProducts = this.products.filter(p => ['Signature Coffee', 'Non-Coffee'].includes(p.category));
                } else {
                    // Show all drinks
                    filteredProducts = this.products.filter(p => ['Classic Coffee', 'Signature Coffee', 'Non-Coffee'].includes(p.category));
                }
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

    renderProductCard(p) {
        const cartItem = this.cart.find(i => i.id === p.id);
        const qty = cartItem ? cartItem.quantity : 0;

        return `
            <div class="kiosk-card" onclick="pos.addToCart(${p.id})">
                ${qty > 0 ? `<div class="qty-badge">${qty}</div>` : ''}
                <img src="${p.image_url || 'https://via.placeholder.com/150'}" class="card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
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

                    <button class="btn-primary-action" onclick="pos.openPaymentModal()">
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
        // Don't full re-render, just update badge? For now full re-render is safer
        this.updateView();
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

    // --- PAYMENT LOGIC ---

    openPaymentModal() {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        
        container.innerHTML = `
            <div class="modal-header">
                <h2>Metode Pembayaran</h2>
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div style="padding: 20px;">
                <h3 style="text-align:center; margin-bottom: 20px;">Total: Rp ${this.currentTotal.toLocaleString()}</h3>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <button class="btn-huge" style="background:#2C3E50" onclick="pos.showCashPayment()">
                        <i class="fas fa-money-bill-wave"></i><br>Cash
                    </button>
                    <button class="btn-huge" style="background:#2C3E50" onclick="pos.showCashlessPayment()">
                        <i class="fas fa-qrcode"></i><br>Cashless (QRIS)
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
                <h2>Pembayaran Tunai (Cash)</h2>
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div style="padding: 20px;">
                <h3 style="text-align:center;">Total: Rp ${this.currentTotal.toLocaleString()}</h3>

                <div style="margin: 20px 0;">
                    <label>Nominal Diterima:</label>
                    <input type="number" id="cash-input" class="form-control" style="width:100%; padding:10px; font-size:1.2rem;" placeholder="Rp 0">
                </div>

                <div id="change-display" style="text-align:center; font-size:1.2rem; font-weight:bold; margin-bottom:20px;">
                    Kembalian: Rp 0
                </div>

                <button class="btn-primary-action" onclick="pos.processCashPayment()">Bayar</button>
            </div>
        `;

        const input = document.getElementById('cash-input');
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            const change = val - this.currentTotal;
            const disp = document.getElementById('change-display');
            if (change >= 0) {
                disp.style.color = 'green';
                disp.textContent = `Kembalian: Rp ${change.toLocaleString()}`;
            } else {
                disp.style.color = 'red';
                disp.textContent = `Kurang: Rp ${Math.abs(change).toLocaleString()}`;
            }
        });
        input.focus();
    }

    showCashlessPayment() {
        const container = document.getElementById('modal-container');
        // Use relative path from where index.html is loaded, or absolute web path if needed.
        // Since we downloaded it to coffee-shop-app/frontend/img/qris.png, the relative path from index.html is img/qris.png
        container.innerHTML = `
             <div class="modal-header">
                <h2>Pembayaran QRIS</h2>
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')">&times;</button>
            </div>
            <div style="padding: 20px; text-align:center;">
                <h3 style="margin-bottom: 10px;">Scan untuk Bayar</h3>
                <img src="img/qris.png" style="width:250px; height:250px; object-fit:contain; border: 1px solid #ccc;" alt="QRIS Code" onerror="this.src='https://via.placeholder.com/250?text=QRIS+Error'">

                <h3 style="margin: 20px 0;">Total: Rp ${this.currentTotal.toLocaleString()}</h3>

                <p style="color:#666; margin-bottom:20px;">Silakan tunjukkan bukti pembayaran ke kasir jika diperlukan.</p>

                <button class="btn-primary-action" onclick="pos.processCashlessPayment()">Konfirmasi Pembayaran</button>
            </div>
        `;
    }

    async processCashPayment() {
        const input = document.getElementById('cash-input');
        const amount = parseFloat(input.value);

        if (!amount || amount < this.currentTotal) {
            alert("Nominal pembayaran kurang!");
            return;
        }

        await this.finalizeOrder('Cash', amount);
    }

    async processCashlessPayment() {
        // In a real app, we might check a webhook here.
        // For now, we assume manual confirmation.
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
            if (res.error) {
                alert(res.error);
                return;
            }

            document.getElementById('modal-overlay').classList.add('hidden');
            this.setView('success');
            this.cart = [];
        } catch (err) {
            alert("Payment failed: " + err.message);
            console.error(err);
        }
    }

    finishOrder() {
        this.setView('lobby');
        this.loadData(); // Refresh stock
    }
}

// Expose to global scope
window.POSView = POSView;
