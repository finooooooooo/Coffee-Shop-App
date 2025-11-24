class App {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.mainView = document.getElementById('main-view');
        this.sidebar = document.querySelector('.sidebar');
        
        this.views = {
            login: new LoginView(),
            pos: new POSView(),
            inventory: new InventoryView(),
            reports: new ReportsView(),
            history: new HistoryView()
        };

        // Sync Login State across windows (if any other windows existed)
        window.addEventListener('storage', (event) => {
            if (event.key === 'user' || event.key === 'userRole') {
                if (localStorage.getItem('user')) {
                    // Login happened elsewhere
                    this.init();
                } else {
                    // Logout happened elsewhere
                    this.logout();
                }
            }
        });

        this.init();
    }

    async init(isLoggedIn) {
        // Check if already logged in (simple persistence)
        if (isLoggedIn === undefined) {
            const storedRole = localStorage.getItem('userRole');
            const storedUser = localStorage.getItem('user');

            if (storedRole && storedUser) {
                this.userRole = storedRole;
                this.currentUser = JSON.parse(storedUser);
                isLoggedIn = true;
            } else {
                isLoggedIn = false;
            }
        }

        // Standard Logic (POS/Admin)
        if (isLoggedIn) {
            // Default to hidden sidebar for Kiosk mode, handled by navigate
            // If cashier -> POS, if Admin -> Inventory (or POS)
            const defaultPage = this.userRole === 'cashier' ? 'pos' : 'inventory';
            await this.navigate(defaultPage);
            this.applyRolePermissions();
        } else {
            const header = document.getElementById('kiosk-header');
            const sidebar = document.getElementById('app-sidebar');
            if (header) header.classList.add('hidden');
            if (sidebar) sidebar.classList.add('hidden');
            await this.navigate('login');
        }
    }

    // --- QUICK ACTION MENU ---
    toggleQuickActions() {
        const overlay = document.getElementById('quick-action-overlay');
        const menu = document.getElementById('quick-action-menu');

        if (overlay.classList.contains('active')) {
            this.closeQuickActions();
        } else {
            this.renderQuickActions();
            overlay.classList.add('active');
            menu.classList.add('active');
        }
    }

    closeQuickActions() {
        document.getElementById('quick-action-overlay').classList.remove('active');
        document.getElementById('quick-action-menu').classList.remove('active');
    }

    renderQuickActions() {
        const menu = document.getElementById('quick-action-menu');
        const user = this.currentUser ? this.currentUser.username : 'Guest';
        const role = this.userRole || 'Unknown';

        let links = '';

        if (this.userRole === 'admin') {
            links += `
                <button class="menu-link" onclick="app.navigateAndClose('inventory')">
                    <i class="fas fa-boxes" style="width:25px;"></i> Inventory
                </button>
                <button class="menu-link" onclick="app.navigateAndClose('reports')">
                    <i class="fas fa-chart-line" style="width:25px;"></i> Reports
                </button>
                <button class="menu-link" onclick="app.navigateAndClose('history')">
                    <i class="fas fa-history" style="width:25px;"></i> Order History
                </button>
            `;
        }

        // Common links (Logout)
        links += `
            <button class="menu-link logout" onclick="app.logout()">
                <i class="fas fa-sign-out-alt" style="width:25px;"></i> Log Out
            </button>
        `;

        menu.innerHTML = `
            <div class="menu-header">
                <div>
                    <h3>${user}</h3>
                    <span style="font-size:0.85rem; color:#888;">${role}</span>
                </div>
                <button class="close-menu-btn" onclick="app.closeQuickActions()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="menu-items" style="flex-grow:1;">
                ${links}
            </div>
        `;
    }

    navigateAndClose(page) {
        this.closeQuickActions();
        this.navigate(page);
    }

    login(authData) {
        this.currentUser = authData.user;
        this.userRole = this.currentUser.role;

        localStorage.setItem('userRole', this.userRole);
        localStorage.setItem('user', JSON.stringify(this.currentUser));

        // We re-init to handle navigation
        this.init(true);
    }

    logout() {
        this.userRole = null;
        this.currentUser = null;
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');

        // Reload to reset state clean
        window.location.reload();
    }

    async navigate(page) {
        if (page !== 'login' && !this.userRole) {
            return this.navigate('login');
        }

        // Clean up any open modals
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.add('hidden');

        // Load view content
        const view = this.views[page];
        if (view) {
            // Clear current view
            this.mainView.innerHTML = '';
            await view.render(this.mainView);
        } else {
            console.error("View not found:", page);
        }
    }

    applyRolePermissions() {
        const invLink = document.querySelector(`li[onclick="app.navigate('inventory')"]`);
        const repLink = document.querySelector(`li[onclick="app.navigate('reports')"]`);
        
        if (this.userRole === 'cashier') {
            if (invLink) invLink.style.display = 'none';
            if (repLink) repLink.style.display = 'none';
        } else {
            if (invLink) invLink.style.display = 'block';
            if (repLink) repLink.style.display = 'block';
        }
    }
}

const app = new App();
