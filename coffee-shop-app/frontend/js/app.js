class App {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.mainView = document.getElementById('main-view');
        this.sidebar = document.querySelector('.sidebar');
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

        this.init();
    }

    async init() {
        // Check session (simplified)
        const user = localStorage.getItem('user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.postLogin();
        } else {
            this.navigate('login');
        }
    }

    async login(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');

        try {
            const res = await api.post('/auth/login', { username, password });
            if (res.success) {
                this.currentUser = res.user;
                localStorage.setItem('user', JSON.stringify(res.user));
                this.postLogin();
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = res.error || 'Login failed';
            }
        } catch (err) {
            console.error(err);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Network error';
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('user');
        this.navigate('login');
    }

    postLogin() {
        // Show Sidebar
        this.sidebar.classList.remove('hidden');

        // RBAC: Configure Navigation
        this.configureNav();

        // Navigate to default page based on role
        if (this.currentUser.role === 'cashier') {
            this.navigate('pos');
        } else {
            this.navigate('inventory'); // Admin default
        }
    }
        
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

    configureNav() {
        const role = this.currentUser.role;
        const navItems = document.querySelectorAll('.nav-links li');

        // Item 0: POS (Cashier & Admin?) -> Admin said "Kasir untuk kasir", "Admin untuk inventory".
        // However, Admin usually wants to see everything.
        // User Request: "admin untuk penyimpanan database (Inventory), kasir untuk kasir dan history"

        // Let's hide Inventory for Cashier
        // Let's hide POS for Admin? (Or allow it?)
        // Usually Admin should see everything.
        // But strict interpretation:

        // navItems[0] = POS
        // navItems[1] = Inventory
        // navItems[2] = Reports

        if (role === 'cashier') {
            navItems[0].style.display = 'flex'; // POS
            navItems[1].style.display = 'none'; // Inventory
            navItems[2].style.display = 'flex'; // Reports (History)
        } else if (role === 'admin') {
            navItems[0].style.display = 'flex'; // POS (Allow admin to sell too?)
            navItems[1].style.display = 'flex'; // Inventory
            navItems[2].style.display = 'flex'; // Reports
        }

        // Add Logout Button
        const profileDiv = document.querySelector('.user-profile');
        if (!document.getElementById('btn-logout')) {
            const btn = document.createElement('button');
            btn.id = 'btn-logout';
            btn.className = 'btn-shift';
            btn.style.backgroundColor = 'var(--danger-color)';
            btn.style.marginTop = '10px';
            btn.textContent = 'Logout';
            btn.onclick = () => this.logout();
            profileDiv.appendChild(btn);
        }
    }

    async navigate(page) {
        this.currentPage = page;

        if (page === 'login') {
            this.sidebar.classList.add('hidden');
            this.mainView.innerHTML = '';
            this.views.login.render(this.mainView);
        } else {
            this.sidebar.classList.remove('hidden');

            // Update UI tabs
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            const activeLi = document.querySelector(`li[onclick="app.navigate('${page}')"]`);
            if (activeLi) activeLi.classList.add('active');

            // Render view
            this.mainView.innerHTML = '';
            const view = this.views[page];
            await view.render(this.mainView);
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
