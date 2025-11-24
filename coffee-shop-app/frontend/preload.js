const { contextBridge, ipcRenderer } = require('electron');

// Helper for fetch to mimic the previous behavior
async function request(url, method, data = null) {
    const baseURL = 'http://localhost:5000/api';
    const fullURL = url.startsWith('/') ? `${baseURL}${url}` : url;

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(fullURL, options);

        // Handle non-2xx responses that are still valid JSON (like 400 Bad Request)
        const contentType = response.headers.get("content-type");
        let result;
        if (contentType && contentType.indexOf("application/json") !== -1) {
             result = await response.json();
        } else {
             // Fallback for non-JSON responses (rare in this API but good for safety)
             result = { status: response.status, statusText: response.statusText };
        }

        // If the fetch itself succeeded (network-wise), we return the result.
        // The previous axios wrapper returned `response.data`.
        // If the backend returns { error: ... }, the frontend views usually handle it by checking .error
        return result;

    } catch (error) {
        console.error(`API ${method} Error:`, error);
        // Return an error object that the frontend can display
        return { error: error.message || 'Network Error' };
    }
}

contextBridge.exposeInMainWorld(
    'api', {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ['toMain'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = ['fromMain'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        // Direct Fetch wrapper for API calls to Python Backend
        get: async (url) => request(url, 'GET'),
        post: async (url, data) => request(url, 'POST', data),
        put: async (url, data) => request(url, 'PUT', data),
        delete: async (url) => request(url, 'DELETE')
    }
);
