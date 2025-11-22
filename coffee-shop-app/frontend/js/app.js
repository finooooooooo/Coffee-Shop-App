class App {
    constructor() {
        this.currentPage = 'login';
        this.mainView = document.getElementById('main-view');
        this.sidebar = document.querySelector('.sidebar');
        this.userRole = null;
        
        this.views = {
            login: new LoginView(),
            pos: new POSView(),
            inventory: new InventoryView(),
            reports: new ReportsView(),
            history: new HistoryView()
        };
        
        // Check if already logged in (simple persistence)
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
            this.userRole = storedRole;
            this.init(true);
        } else {
            this.init(false);
        }
    }

    async init(isLoggedIn) {
        if (isLoggedIn) {
            // Default to hidden sidebar for Kiosk mode, handled by navigate
            await this.navigate('pos');
            this.applyRolePermissions();
        } else {
            document.getElementById('kiosk-header').classList.add('hidden');
            this.sidebar.classList.add('hidden');
            await this.navigate('login');
        }
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('hidden');
    }

    login(authData) {
        this.userRole = authData.role;
        localStorage.setItem('userRole', this.userRole);
        this.init(true);
    }

    logout() {
        this.userRole = null;
        localStorage.removeItem('userRole');
        this.init(false);
    }

    async navigate(page) {
        if (page !== 'login' && !this.userRole) {
            return this.navigate('login');
        }

        const header = document.getElementById('kiosk-header');
        const sidebar = document.getElementById('app-sidebar');

        // Handle UI State based on page
        if (page === 'pos') {
            header.classList.remove('hidden');
            sidebar.classList.add('hidden'); // Sidebar hidden by default in POS
            document.body.classList.add('kiosk-mode');
        } else if (page === 'login') {
            header.classList.add('hidden');
            sidebar.classList.add('hidden');
            document.body.classList.remove('kiosk-mode');
        } else {
            // Admin pages
            header.classList.add('hidden');
            sidebar.classList.remove('hidden');
            document.body.classList.remove('kiosk-mode');
        }

        // Update UI tabs
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        const activeLink = document.querySelector(`li[onclick="app.navigate('${page}')"]`);
        if (activeLink) activeLink.classList.add('active');

        // Render view
        this.currentPage = page;
        this.mainView.innerHTML = ''; // Clear current view

        // Load view content
        const view = this.views[page];
        if (view) {
            await view.render(this.mainView);
        } else {
            console.error("View not found:", page);
        }
    }

    applyRolePermissions() {
        const invLink = document.querySelector(`li[onclick="app.navigate('inventory')"]`);
        const repLink = document.querySelector(`li[onclick="app.navigate('reports')"]`);
        
        if (this.userRole === 'Kasir') {
            if (invLink) invLink.style.display = 'none';
            if (repLink) repLink.style.display = 'none';
        } else {
            if (invLink) invLink.style.display = 'block';
            if (repLink) repLink.style.display = 'block';
        }
        
        // Update profile section
        const profileDiv = document.querySelector('.user-profile');
        // Add logout button if not exists
        if (!document.getElementById('btn-logout')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'btn-logout';
            logoutBtn.className = 'btn-logout';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            logoutBtn.onclick = () => app.logout();
            profileDiv.appendChild(logoutBtn);
        }
    }
}

const app = new App();
