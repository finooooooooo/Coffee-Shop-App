class App {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'login';
        this.mainView = document.getElementById('main-view');
        this.sidebar = document.querySelector('.sidebar');
        this.views = {
            login: new LoginView(),
            pos: new POSView(),
            inventory: new InventoryView(),
            reports: new ReportsView()
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
        }
    }
}

const app = new App();
