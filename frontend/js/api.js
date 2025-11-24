class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async get(endpoint) {
        const res = await fetch(`${this.baseUrl}${endpoint}`);
        return res.json();
    }

    async post(endpoint, data) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
}

const api = new API('/api');
