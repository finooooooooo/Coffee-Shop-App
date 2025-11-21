class LoginView {
    render(container) {
        const html = `
            <div class="login-container">
                <div class="login-card">
                    <div class="brand" style="justify-content: center; color: var(--primary-color);">
                        <i class="fas fa-coffee fa-2x"></i>
                        <h1 style="font-size: 2rem;">COFFEE POS</h1>
                    </div>
                    <h3 style="text-align:center; margin-bottom:1.5rem; color:#666;">Sign In</h3>
                    <form onsubmit="app.login(event)">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="username" placeholder="Enter username" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="password" placeholder="Enter password" required>
                        </div>
                        <button type="submit" class="btn-login">Login</button>
                    </form>
                    <div id="login-error" style="color:var(--danger-color); text-align:center; margin-top:1rem; display:none;">
                        Invalid credentials
                    </div>
                    <div style="margin-top: 1rem; font-size: 0.8rem; color: #888; text-align: center;">
                        Default: admin/password123<br>cashier/password123
                    </div>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }
}
