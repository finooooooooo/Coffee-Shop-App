class App {
    constructor() {
        this.currentPage = 'pos';
        this.mainView = document.getElementById('main-view');
        this.views = {
            pos: new POSView(),
            inventory: new InventoryView(),
            reports: new ReportsView()
        };
        this.init();
    }

    async init() {
        await this.navigate('pos');
    }

    async navigate(page) {
        // Update UI tabs
        document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
        document.querySelector(`li[onclick="app.navigate('${page}')"]`).classList.add('active');

        // Render view
        this.currentPage = page;
        this.mainView.innerHTML = ''; // Clear current view

        // Load view content
        const view = this.views[page];
        await view.render(this.mainView);
    }
}

const app = new App();
