class App {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.mainView = document.getElementById('main-view');
        
        this.views = {
            login: new LoginView(),
            pos: new POSView(),
            inventory: new InventoryView(),
            reports: new ReportsView(),
            history: new HistoryView()
        };

        // Sync Login State across windows
        window.addEventListener('storage', (event) => {
            if (event.key === 'user' || event.key === 'userRole') {
                if (localStorage.getItem('user')) {
                    this.init();
                } else {
                    this.logout();
                }
            }
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', (e) => {
            const dropdown = document.getElementById('quick-action-menu');
            const trigger = document.getElementById('menu-trigger-btn');

            // If the click is NOT on the trigger AND NOT inside the dropdown, close it
            if (dropdown && dropdown.classList.contains('active')) {
                if (trigger && trigger.contains(e.target)) {
                    // It's the trigger, let the toggle function handle it (or do nothing here)
                    return;
                }
                if (!dropdown.contains(e.target)) {
                    this.closeQuickActions();
                }
            }
        });

        this.init();
    }

    async init(isLoggedIn) {
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

        if (isLoggedIn) {
            // Default View based on Role
            const defaultPage = this.userRole === 'cashier' ? 'pos' : 'inventory';
            await this.navigate(defaultPage);
        } else {
            await this.navigate('login');
        }
    }

    // --- QUICK ACTION MENU (DROPDOWN) ---
    toggleQuickActions() {
        const menu = document.getElementById('quick-action-menu');

        if (!menu) return;

        if (menu.classList.contains('active')) {
            this.closeQuickActions();
        } else {
            this.renderQuickActions();
            menu.classList.add('active');
        }
    }

    closeQuickActions() {
        const menu = document.getElementById('quick-action-menu');
        if (menu) menu.classList.remove('active');
    }

    renderQuickActions() {
        const menu = document.getElementById('quick-action-menu');
        if (!menu) return;

        const user = this.currentUser ? this.currentUser.username : 'Guest';
        const role = this.userRole || 'Unknown';

        // Format Role for display (capitalize first letter)
        const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

        let links = '';

        if (this.userRole === 'admin') {
            links += `
                <button class="menu-link" onclick="app.navigateAndClose('inventory')">
                    <i class="fas fa-boxes"></i> Inventory
                </button>
                <button class="menu-link" onclick="app.navigateAndClose('reports')">
                    <i class="fas fa-chart-line"></i> Reports
                </button>
                <button class="menu-link" onclick="app.navigateAndClose('history')">
                    <i class="fas fa-history"></i> Order History
                </button>
            `;
        }

        // Common links (Logout)
        links += `
            <button class="menu-link logout" onclick="app.logout()">
                <i class="fas fa-sign-out-alt"></i> Log Out
            </button>
        `;

        menu.innerHTML = `
            <div class="menu-header">
                <h3>${user}</h3>
                <span>${displayRole}</span>
            </div>
            <div class="menu-items">
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

        this.init(true);
    }

    logout() {
        this.userRole = null;
        this.currentUser = null;
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');

        window.location.reload();
    }

    async navigate(page) {
        if (page !== 'login' && !this.userRole) {
            return this.navigate('login');
        }

        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.add('hidden');

        // Close dropdown on navigation
        this.closeQuickActions();

        const view = this.views[page];
        if (view) {
            this.mainView.innerHTML = '';
            await view.render(this.mainView);
        } else {
            console.error("View not found:", page);
        }
    }
}

const app = new App();
