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
    }

    async checkShiftStatus() {
        const res = await api.get('/pos/shift/status');
        this.shiftOpen = res.active;
        this.updateShiftUI();
    }

    updateShiftUI() {
        const statusDiv = document.getElementById('shift-status-display');
        if (!statusDiv) return; // Safety check

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

    checkout() {
        if (this.cart.length === 0) return;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Simple prompt for now, can be upgraded to modal
        const payment = prompt(`Total: Rp ${total.toLocaleString()}\nEnter Payment Amount:`);

        if (payment && parseFloat(payment) >= total) {
            const orderData = {
                total_amount: total,
                payment_received: parseFloat(payment),
                change_given: parseFloat(payment) - total,
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
        }
    }
}
