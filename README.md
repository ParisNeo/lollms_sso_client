# LoLLMs SSO Client Library

A lightweight, dependency-free JavaScript client library to easily integrate third-party web applications with the LoLLMs Single Sign-On (SSO) service.

## Features

-   Simple initialization.
-   Handles redirection to and from the LoLLMs login page.
-   Manages SSO token storage in `localStorage`.
-   Provides a method to securely verify the token and fetch user data.
-   Logs the user out of the client application.

## 1. Setup in LoLLMs

Before using this library, you must configure your application within your LoLLMs instance:

1.  Navigate to **Settings -> Services** (if you are a regular user) or **Admin Panel -> Services** (if you are an administrator setting up a system-wide app).
2.  Add or Edit an Application.
3.  Set the **Authentication Type** to `LoLLMs SSO`.
4.  Fill in the **Redirect URI**. This is the exact URL in your application where LoLLMs will send the user back after they log in (e.g., `https://myapp.com/auth/callback`). This page must include this SSO client library.
5.  Select the user information your application requires (e.g., Email, First Name).
6.  If no **SSO Secret** exists, click `Generate Secret`. **Copy this secret immediately** and store it securely in your application's backend. You will not be able to see it again.

## 2. Integration into Your Application

### Step 1: Include the Library

Download `lollms_sso_client.js` and include it in your web page.

```html
<script src="path/to/lollms_sso_client.js"></script>
```

### Step 2: Initialize the Client

Create a new instance of the `LollmsSSOClient` with your LoLLMs server URL and your application's name.

```javascript
const ssoClient = new LollmsSSOClient({
    lollmsUrl: 'http://localhost:9642', // The URL of your LoLLMs instance
    appName: 'My Test App',             // The name of your app as configured in LoLLMs
});
```

### Step 3: Handle the Login Flow

1.  **Triggering Login:** Create a "Login with LoLLMs" button. When clicked, call the `login()` method. This will redirect the user to LoLLMs.

    ```javascript
    document.getElementById('login-button').addEventListener('click', () => {
        ssoClient.login();
    });
    ```

2.  **Handling the Redirect:** On the page specified as your **Redirect URI**, you must call `handleRedirect()`. This method will check the URL for a token, save it to `localStorage`, and clean the URL.

    ```javascript
    // Place this code on your redirect page (e.g., /auth/callback)
    document.addEventListener('DOMContentLoaded', () => {
        const token = ssoClient.handleRedirect();
        if (token) {
            console.log("Login successful! Token stored.");
            // Now you can redirect to the main part of your app, update the UI, etc.
            window.location.href = '/dashboard'; 
        }
    });
    ```

### Step 4: Accessing User Data

Once the user is logged in, you can verify their session and get their information using the `introspect()` method. This method should be called from your application's backend for maximum security, but can be called from the frontend for simplicity.

The `introspect` method communicates with the LoLLMs server, validates the token using the shared SSO secret, and returns the user's data.

```javascript
async function fetchUserInfo() {
    if (!ssoClient.isAuthenticated()) {
        console.log("User is not logged in.");
        return;
    }

    try {
        const userData = await ssoClient.introspect();
        console.log("User is valid:", userData);
        // `userData.user_info` will contain the shared data (e.g., email, first_name)
        document.getElementById('welcome-message').textContent = `Welcome, ${userData.user_info.username}!`;
    } catch (error) {
        console.error("Authentication check failed:", error.message);
        // The token is invalid or expired. The library automatically logs the user out.
        // Update your UI to show the login screen again.
    }
}
```

### Step 5: Handling Logout

To log a user out of your application, simply call the `logout()` method. This removes their token from `localStorage`.

```javascript
document.getElementById('logout-button').addEventListener('click', () => {
    ssoClient.logout();
    // Update your UI to show the login screen.
});
```

## API Reference

-   `new LollmsSSOClient({ lollmsUrl, appName, tokenStorageKey? })`
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
