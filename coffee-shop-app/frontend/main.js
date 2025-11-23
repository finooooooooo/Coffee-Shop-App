const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// Disable hardware acceleration to prevent crashes on some systems
app.disableHardwareAcceleration();

let posWindow = null;
let kitchenWindow = null;
let barWindow = null;

function createWindows() {
    // Get primary display size to calculate positioning
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 1. POS Window (Main - Left side)
    posWindow = new BrowserWindow({
        width: Math.floor(width * 0.6),
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

    // 2. Kitchen Window (Top Right)
    kitchenWindow = new BrowserWindow({
        width: Math.floor(width * 0.4),
        height: Math.floor(height / 2),
        x: Math.floor(width * 0.6),
        y: 0,
        title: 'Kitchen Display',
        parent: posWindow, // Optional: makes it a child window
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Load with hash for routing
    kitchenWindow.loadFile(path.join(__dirname, 'index.html'), { hash: 'kitchen' });

    // 3. Bar Window (Bottom Right)
    barWindow = new BrowserWindow({
        width: Math.floor(width * 0.4),
        height: Math.floor(height / 2),
        x: Math.floor(width * 0.6),
        y: Math.floor(height / 2),
        title: 'Bar Display',
        parent: posWindow, // Optional
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    barWindow.loadFile(path.join(__dirname, 'index.html'), { hash: 'bar' });

    // Lifecycle Management
    posWindow.on('closed', () => {
        // If POS closes, close everything
        app.quit();
    });

    kitchenWindow.on('closed', () => { kitchenWindow = null; });
    barWindow.on('closed', () => { barWindow = null; });
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
