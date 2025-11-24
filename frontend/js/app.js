class App {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.pos = new POSView(this.appContainer);
    }

    init() {
        // Start directly at Splash Screen
        this.pos.renderSplash();
    }
}

const app = new App();
window.app = app;
window.onload = () => app.init();
