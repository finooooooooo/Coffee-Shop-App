const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Disable hardware acceleration to prevent crashes on some systems
app.disableHardwareAcceleration();

let mainWindow = null;
let kitchenWindow = null;
let barWindow = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'POS Restoran',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false // Keep running in background
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools for debugging
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createKitchenWindow() {
    kitchenWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Kitchen Display',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    kitchenWindow.loadFile(path.join(__dirname, 'displays', 'kitchen.html'));

    kitchenWindow.on('closed', () => {
        kitchenWindow = null;
    });
}

function createBarWindow() {
    barWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Bar Display',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    barWindow.loadFile(path.join(__dirname, 'displays', 'bar.html'));

    barWindow.on('closed', () => {
        barWindow = null;
    });
}

// Open all windows when app is ready
app.whenReady().then(() => {
    createMainWindow();
    createKitchenWindow();
    createBarWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Handle closing windows
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Track order status across displays
let orderStatuses = {}; // orderId -> { kitchen: status, bar: status, order: orderData }

ipcMain.on('new-order', (event, order) => {
    // Initialize order status tracking
    orderStatuses[order.id] = {
        kitchen: order.items.some(item => item.kategori === 'Makanan') ? 'pending' : 'not-applicable',
        bar: order.items.some(item => item.kategori === 'Minuman') ? 'pending' : 'not-applicable',
        order: order
    };

    // Send order to appropriate displays based on item types
    if (kitchenWindow && !kitchenWindow.isDestroyed() && orderStatuses[order.id].kitchen === 'pending') {
        kitchenWindow.webContents.send('update-orders', order);
    }
    if (barWindow && !barWindow.isDestroyed() && orderStatuses[order.id].bar === 'pending') {
        barWindow.webContents.send('update-orders', order);
    }
});

// Handle order status updates
ipcMain.on('update-order-status', (event, orderUpdate) => {
    const { orderId, status, source } = orderUpdate;

    if (!orderStatuses[orderId]) return;

    // Update status for the source (kitchen or bar)
    orderStatuses[orderId][source] = status;

    // Check if order is completed (both kitchen and bar are ready or not applicable)
    const orderStatus = orderStatuses[orderId];
    const isCompleted = (
        (orderStatus.kitchen === 'ready' || orderStatus.kitchen === 'not-applicable') &&
        (orderStatus.bar === 'ready' || orderStatus.bar === 'not-applicable')
    );

    if (isCompleted) {
        // Send completion notification to main window for history
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('order-completed', orderStatus.order);
        }

        // Remove from tracking
        delete orderStatuses[orderId];
    }

    // Broadcast status updates to all windows
    const windows = [mainWindow, kitchenWindow, barWindow];
    windows.forEach(window => {
        if (window && !window.isDestroyed()) {
            window.webContents.send('order-status-update', orderUpdate);
        }
    });
});


// Handle opening display windows from renderer
ipcMain.on('open-kitchen-display', () => {
    if (!kitchenWindow || kitchenWindow.isDestroyed()) {
        createKitchenWindow();
    } else {
        kitchenWindow.focus();
    }
});

ipcMain.on('open-bar-display', () => {
    if (!barWindow || barWindow.isDestroyed()) {
        createBarWindow();
    } else {
        barWindow.focus();
    }
});
