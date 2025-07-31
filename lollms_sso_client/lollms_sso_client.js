class LollmsSSOClient {
    /**
     * Initializes the SSO client.
     * @param {object} config - The configuration object.
     * @param {string} config.lollmsUrl - The base URL of the LoLLMs instance (e.g., 'https://lollms.instance.com').
     * @param {string} config.clientId - The Client ID of your application, as configured in LoLLMs.
     * @param {string} [config.tokenStorageKey='lollms_sso_token'] - The localStorage key for the token.
     */
    constructor({ lollmsUrl, clientId, tokenStorageKey = 'lollms_sso_token' }) {
        if (!lollmsUrl || !clientId) {
            throw new Error('lollmsUrl and clientId are required configuration properties.');
        }
        this.lollmsUrl = lollmsUrl.replace(/\/$/, ''); // Remove trailing slash if present
        this.clientId = clientId;
        this.tokenStorageKey = tokenStorageKey;
    }

    /**
     * Redirects the user to the LoLLMs SSO login page for the configured application.
     */
    login() {
        const ssoUrl = `${this.lollmsUrl}/app/${encodeURIComponent(this.clientId)}`;
        window.location.href = ssoUrl;
    }

    /**
     * Handles the redirect back from the LoLLMs SSO service.
     * It parses the token from the URL query parameters, saves it, and cleans the URL.
     * This method should be called on the page that the `sso_redirect_uri` points to.
     * @returns {string|null} The SSO token if found in the URL, otherwise null.
     */
    handleRedirect() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            this.setToken(token);
            // Clean the token from the URL to prevent it from being bookmarked or shared.
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            return token;
        }

        return null;
    }

    /**
     * Saves the SSO token to localStorage.
     * @param {string} token - The SSO token to save.
     */
    setToken(token) {
        localStorage.setItem(this.tokenStorageKey, token);
    }

    /**
     * Retrieves the SSO token from localStorage.
     * @returns {string|null} The stored token, or null if not found.
     */
    getToken() {
        return localStorage.getItem(this.tokenStorageKey);
    }

    /**
     * Removes the SSO token from localStorage, effectively logging the user out of the client app.
     */
    logout() {
        localStorage.removeItem(this.tokenStorageKey);
    }

    /**
     * Checks if a user is currently authenticated (i.e., a token exists).
     * @returns {boolean} True if a token is stored, false otherwise.
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Verifies the stored SSO token with the LoLLMs backend and retrieves user information.
     * This is the secure way to validate a token without exposing secrets to the client.
     * @returns {Promise<object>} A promise that resolves with the introspection data if the token is valid.
     * @throws {Error} If the token is invalid, expired, or the request fails.
     */
    async introspect() {
        const token = this.getToken();
        if (!token) {
            throw new Error('No SSO token found. Please login first.');
        }

        const introspectUrl = `${this.lollmsUrl}/api/sso/introspect`;
        const formData = new FormData();
        formData.append('token', token);

        try {
            const response = await fetch(introspectUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `Server responded with status: ${response.status}` }));
                throw new Error(errorData.detail || `Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.active) {
                this.logout(); // The token is invalid, so log out.
                throw new Error(data.error || 'Token is no longer active.');
            }

            return data;
        } catch (error) {
            console.error('Introspection failed:', error);
            throw error; // Re-throw the error for the calling application to handle.
        }
    }
}