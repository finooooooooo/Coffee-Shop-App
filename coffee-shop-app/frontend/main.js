const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Disable hardware acceleration to prevent crashes on some systems
app.disableHardwareAcceleration();

let posWindow = null;

function createWindows() {
    // Get primary display size to calculate positioning
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 1. POS Window (Main)
    posWindow = new BrowserWindow({
        width: Math.floor(width * 0.8),
        height: height,
        x: 0,
        y: 0,
        title: 'Coffee Shop POS',
        webPreferences: {
            nodeIntegration: false, // Security: Disable node integration
            contextIsolation: true, // Security: Enable context isolation
            backgroundThrottling: false, // Keep running in background
            preload: path.join(__dirname, 'preload.js')
        }
    });

    posWindow.loadFile(path.join(__dirname, 'index.html'));

    // Lifecycle Management
    posWindow.on('closed', () => {
        // If POS closes, close everything
        app.quit();
    });
}

app.whenReady().then(() => {
    createWindows();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindows();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
