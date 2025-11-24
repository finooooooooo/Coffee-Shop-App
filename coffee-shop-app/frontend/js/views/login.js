class LoginView {
    constructor() {
        this.username = '';
        this.password = '';
    }

    render(container) {
        const html = `
            <div class="login-container">
                <div class="login-card">
                    <div class="brand-logo">
                        <i class="fas fa-coffee fa-3x"></i>
                        <h2>Coffee POS</h2>
                    </div>
                    <form onsubmit="login.submit(event)">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="username" required placeholder="Enter username">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="password" required placeholder="Enter password">
                        </div>
                        <button type="submit" class="btn-login">Login</button>
                    </form>
                    <div class="login-help">
                        <small>Default: Admin/admin or Kasir/kasir</small>
                        <br>
                        <small>Enter credentials to access Admin or POS/Cashier modes.</small>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
        window.login = this;
    }

    async submit(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await api.post('/auth/login', { username, password });
            if (res.success) {
                app.login(res);
            } else {
                alert(res.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            alert('Login error');
        }
    }
}
