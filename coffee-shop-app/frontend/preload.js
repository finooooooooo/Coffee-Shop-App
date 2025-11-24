const { contextBridge, ipcRenderer } = require('electron');
const axios = require('axios');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
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
                // Deliberately strip event as it includes `sender`
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        // Direct Axios wrapper for API calls to Python Backend
        get: async (url) => {
            try {
                // Prepend base URL if relative
                const baseURL = 'http://localhost:5000/api';
                const fullURL = url.startsWith('/') ? `${baseURL}${url}` : url;
                const response = await axios.get(fullURL);
                return response.data;
            } catch (error) {
                console.error("API GET Error:", error);
                throw error;
            }
        },
        post: async (url, data) => {
             try {
                const baseURL = 'http://localhost:5000/api';
                const fullURL = url.startsWith('/') ? `${baseURL}${url}` : url;
                const response = await axios.post(fullURL, data);
                return response.data;
            } catch (error) {
                // Handle 400 errors gracefully by returning error object if possible
                if (error.response && error.response.data) {
                    return { error: error.response.data.error || 'Unknown Error' };
                }
                console.error("API POST Error:", error);
                throw error;
            }
        },
        put: async (url, data) => {
             try {
                const baseURL = 'http://localhost:5000/api';
                const fullURL = url.startsWith('/') ? `${baseURL}${url}` : url;
                const response = await axios.put(fullURL, data);
                return response.data;
            } catch (error) {
                if (error.response && error.response.data) {
                    return { error: error.response.data.error || 'Unknown Error' };
                }
                console.error("API PUT Error:", error);
                throw error;
            }
        },
        delete: async (url) => {
             try {
                const baseURL = 'http://localhost:5000/api';
                const fullURL = url.startsWith('/') ? `${baseURL}${url}` : url;
                const response = await axios.delete(fullURL);
                return response.data;
            } catch (error) {
                if (error.response && error.response.data) {
                    return { error: error.response.data.error || 'Unknown Error' };
                }
                console.error("API DELETE Error:", error);
                throw error;
            }
        }
    }
);
