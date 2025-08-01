# LoLLMs SSO Client Library

[![npm version](https://badge.fury.io/js/%40lollms%2Fsso-client.svg)](https://badge.fury.io/js/%40lollms%2Fsso-client)
[![GitHub repo](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/ParisNeo/lollms_sso_client)

A lightweight, dependency-free JavaScript client library to easily integrate third-party web applications with the LoLLMs Single Sign-On (SSO) service, which is part of the main [LoLLMs Chat](https://github.com/ParisNeo/lollms_chat) application.

## Features

-   Simple initialization.
-   Handles redirection to and from the LoLLMs login page.
-   Manages SSO token storage in `localStorage`.
-   Provides a method to securely verify the token and fetch user data.
-   Logs the user out of the client application.

## 1. Setup in LoLLMs Chat

Before using this library, you must configure your application within your LoLLMs Chat instance:

1.  Navigate to **Settings -> Services** (if you are a regular user) or **Admin Panel -> Services** (if you are an administrator setting up a system-wide app).
2.  Add or Edit an Application.
3.  Set the **Authentication Type** to `LoLLMs SSO`.
4.  Fill in the **Redirect URI**. This is the exact URL in your application where LoLLMs will send the user back after they log in (e.g., `https://myapp.com/auth/callback`). This page must use this SSO client library.
5.  Select the user information your application requires (e.g., Email, First Name).
6.  If no **SSO Secret** exists, click `Generate Secret`. **Copy this secret immediately** and store it securely. You will not be able to see it again.

## 2. Installation and Usage

You can use the library by installing it via NPM or by directly including it from a CDN.

### Option A: Using NPM (Recommended for modern projects)

1.  **Install the package:**
    ```bash
    npm install @lollms/sso-client
    ```

2.  **Import and use it in your project:**
    ```javascript
    import LollmsSSOClient from '@lollms/sso-client';

    const ssoClient = new LollmsSSOClient({
        lollmsUrl: 'http://localhost:9642',
        clientId: 'My Test App',
    });

    // Your application logic...
    ```

### Option B: Using a CDN

Include the script in your HTML file. This is the easiest way to get started.

```html
<script src="https://cdn.jsdelivr.net/npm/@lollms/sso-client/dist/lollms_sso_client.min.js"></script>
<script>
    const ssoClient = new LollmsSSOClient({
        lollmsUrl: 'http://localhost:9642',
        clientId: 'My Test App',
    });
    
    // Your application logic...
</script>
```

## 3. Implementation Guide

### Step 1: Triggering Login

Create a "Login with LoLLMs" button. When clicked, call the `login()` method. This will redirect the user to the LoLLMs authentication page.

```javascript
document.getElementById('login-button').addEventListener('click', () => {
    ssoClient.login();
});
```

### Step 2: Handling the Redirect

On the page specified as your **Redirect URI** in the LoLLMs settings, you must call `handleRedirect()`. This method checks the URL for a token, saves it, and cleans the URL for security.

```javascript
// Place this code on your redirect page (e.g., /auth/callback)
document.addEventListener('DOMContentLoaded', () => {
    const token = ssoClient.handleRedirect();
    if (token) {
        console.log("Login successful! Token stored.");
        // Redirect to the main part of your app, update the UI, etc.
        window.location.href = '/dashboard'; 
    }
});
```

### Step 3: Accessing User Data

Once the user is logged in, you can verify their session and get their information using the `introspect()` method. This allows your app to confirm the user is valid and access the information you configured in the LoLLMs SSO settings.

```javascript
async function fetchUserInfo() {
    if (!ssoClient.isAuthenticated()) {
        console.log("User is not logged in.");
        return;
    }

    try {
        const userData = await ssoClient.introspect();
        console.log("User is valid:", userData);
        
        // `userData.user_info` contains the shared data (e.g., username, email)
        const userInfo = userData.user_info;
        document.getElementById('welcome-message').textContent = `Welcome, ${userInfo.username}!`;
    } catch (error) {
        console.error("Authentication check failed:", error.message);
        // The token is likely invalid or expired. The library automatically calls logout().
        // You should update your UI to show the login screen again.
    }
}
```

### Step 4: Handling Logout

To log a user out of your application, call the `logout()` method. This removes their token from local storage.

```javascript
document.getElementById('logout-button').addEventListener('click', () => {
    ssoClient.logout();
    // Update your UI to show the login screen.
});
```

## API Reference

-   `new LollmsSSOClient({ lollmsUrl, clientId, tokenStorageKey? })`
    -   Creates a new client instance.
-   `.login()`
    -   Redirects the browser to the LoLLMs login page.
-   `.handleRedirect()`
    -   Processes the URL after returning from LoLLMs. Call this on your redirect page. Returns the token if found.
-   `.setToken(token)`
    -   Manually saves a token to storage.
-   `.getToken()`
    -   Returns the stored token, or `null`.
-   `.isAuthenticated()`
    -   Returns `true` if a token is stored, `false` otherwise.
-   `.logout()`
    -   Removes the token from storage.
-   `.introspect()`
    -   Async method. Validates the token with the LoLLMs server. Returns a promise that resolves with user data or rejects with an error.

## For Developers: Publishing to NPM

1.  **Login to NPM:**
    ```bash
    npm login
    ```
2.  **Build the library:**
    ```bash
    npm run build
    ```
3.  **Publish:**
    ```bash
    # Make sure your version in package.json is updated
    npm publish --access public
    ```