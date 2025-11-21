class POSView {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.shiftOpen = false;
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
                    <button class="btn-checkout" onclick="pos.openCheckoutModal()">Checkout</button>
                </div>
            </div>
        `;
        container.innerHTML = html;

        window.pos = this;

        await this.checkShiftStatus();
        await this.loadData();
        this.updateCart();
    }

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
            }
        }
        this.updateShiftUI();
    }

    async loadData() {
        // Load categories and products in parallel
        const [cats, prods] = await Promise.all([
            api.get('/inventory/categories'),
            api.get('/inventory/products')
        ]);
        this.categories = cats;
        this.products = prods;
        
        this.renderCategories();
        this.renderProducts(this.products);
    }

    renderCategories() {
        const container = document.getElementById('category-list');
        let html = `<button class="btn-category active" onclick="pos.filterProducts('all', this)">All</button>`;
        html += this.categories.map(c => 
            `<button class="btn-category" onclick="pos.filterProducts(${c.id}, this)">${c.name}</button>`
        ).join('');
        container.innerHTML = html;
    }

    filterProducts(categoryId, btnElement) {
        // UI update
        document.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        if (categoryId === 'all') {
            this.renderProducts(this.products);
        } else {
            const filtered = this.products.filter(p => p.category_id === categoryId);
            this.renderProducts(filtered);
        }
    }

    renderProducts(products) {
        const grid = document.getElementById('product-grid');
        if (products.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:#888;">No products found in this category.</div>';
            return;
        }
        grid.innerHTML = products.map(p => `
            <div class="product-card" onclick="pos.addToCart(${p.id})">
                <div class="product-img-wrapper">
                    <img src="${p.image_url || 'https://via.placeholder.com/150'}" class="product-img" loading="lazy">
                    ${p.category ? `<span class="category-badge">${p.category}</span>` : ''}
                </div>
                <div class="product-info">
                    <h4>${p.name}</h4>
                    <div class="product-price">Rp ${p.price.toLocaleString()}</div>
                    <small class="stock-info ${p.stock < 10 ? 'low-stock' : ''}">Stock: ${p.stock}</small>
                </div>
            </div>
        `).join('');
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
        this.updateCart();
    }

    updateCart() {
        const container = document.getElementById('cart-items');
        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div>
                    <b>${item.name}</b><br>
                    <small>@ ${item.price.toLocaleString()}</small>
                </div>
                <div class="qty-control">
                    <button class="btn-qty" onclick="pos.changeQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty" onclick="pos.changeQty(${item.id}, 1)">+</button>
                </div>
                <div>${(item.price * item.quantity).toLocaleString()}</div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cart-total').textContent = total.toLocaleString();
    }

    changeQty(id, change) {
        const item = this.cart.find(i => i.id === id);
        item.quantity += change;
        if (item.quantity <= 0) {
            this.cart = this.cart.filter(i => i.id !== id);
        }
        this.updateCart();
    }

    openCheckoutModal() {
        if (this.cart.length === 0) return;
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const modalContainer = document.getElementById('modal-container');
        const overlay = document.getElementById('modal-overlay');
        
        modalContainer.innerHTML = `
            <h3>Checkout</h3>
            <div class="checkout-summary" style="margin: 1rem 0; font-size: 1.2rem;">
                Total Amount: <b>Rp ${total.toLocaleString()}</b>
            </div>
            <div class="form-group">
                <label>Payment Amount (Rp)</label>
                <input type="number" id="payment-input" oninput="pos.calculateChange(${total})" placeholder="Enter amount">
            </div>
            <div id="change-display" style="margin-bottom: 1rem; font-weight: bold;">
                Change: -
            </div>
            <div style="display:flex; gap:10px;">
                <button id="btn-confirm-pay" class="btn-checkout" disabled onclick="pos.confirmPayment(${total})">Confirm Payment</button>
                <button class="btn-shift" onclick="pos.closeModal()">Cancel</button>
            </div>
        `;
        overlay.classList.remove('hidden');
        setTimeout(() => document.getElementById('payment-input').focus(), 100);
    }

    calculateChange(total) {
        const input = document.getElementById('payment-input').value;
        const amount = parseFloat(input);
        const display = document.getElementById('change-display');
        const btn = document.getElementById('btn-confirm-pay');
        
        if (!isNaN(amount)) {
            if (amount >= total) {
                const change = amount - total;
                display.innerHTML = `Change: <span style="color:var(--success-color)">Rp ${change.toLocaleString()}</span>`;
                btn.disabled = false;
            } else {
                display.innerHTML = `Insufficient: <span style="color:var(--danger-color)">Rp ${(total - amount).toLocaleString()} more needed</span>`;
                btn.disabled = true;
            }
        } else {
            display.textContent = "Change: -";
            btn.disabled = true;
        }
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    async confirmPayment(total) {
        const payment = parseFloat(document.getElementById('payment-input').value);
        const orderData = {
            total_amount: total,
            payment_received: payment,
            items: this.cart.map(i => ({ id: i.id, quantity: i.quantity }))
        };

        try {
            const res = await api.post('/pos/orders', orderData);
            this.closeModal();
            alert(`Payment Successful!\nChange: Rp ${(payment - res.total_amount).toLocaleString()}`);
            this.cart = [];
            this.updateCart();
            this.loadData(); // Refresh stock
        } catch (err) {
            alert("Payment failed or server error.");
            console.error(err);
        }
    }
}
