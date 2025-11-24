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

    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) sidebar.classList.toggle('hidden');
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

        const header = document.getElementById('kiosk-header');
        const sidebar = document.getElementById('app-sidebar');

        // Handle UI State based on page
        if (page === 'pos') {
            if (header) header.classList.remove('hidden');
            if (sidebar) sidebar.classList.add('hidden'); // Sidebar hidden by default in POS
            document.body.classList.add('kiosk-mode');
        } else if (page === 'login') {
            if (header) header.classList.add('hidden');
            if (sidebar) sidebar.classList.add('hidden');
            document.body.classList.remove('kiosk-mode');
        } else {
            // Admin pages
            if (header) header.classList.add('hidden');
            if (sidebar) sidebar.classList.remove('hidden');
            document.body.classList.remove('kiosk-mode');
        }

        // Update UI tabs (only if sidebar is visible)
        if (!sidebar || !sidebar.classList.contains('hidden')) {
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            const activeLink = document.querySelector(`li[onclick="app.navigate('${page}')"]`);
            if (activeLink) activeLink.classList.add('active');
        }

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
