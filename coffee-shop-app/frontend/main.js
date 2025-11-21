const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable hardware acceleration to prevent crashes on some systems
app.disableHardwareAcceleration();

let mainWindow = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: 'Coffee Shop POS System',
        webPreferences: {
            nodeIntegration: false, // Security: Disable node integration
            contextIsolation: true, // Security: Enable context isolation
            backgroundThrottling: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools for debugging (optional, good for beta)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
