# LoLLMs SSO Client Library

A lightweight, dependency-free JavaScript client library to easily integrate third-party web applications with the LoLLMs Single Sign-On (SSO) service.

## How It Works (The SSO Flow)

This library simplifies a secure authentication flow similar to OAuth2. The client application (your app) never handles user passwords or the SSO secret.

1.  **Redirect to LoLLMs**: Your application redirects the user to the LoLLMs login page.
2.  **User Login & Authorization**: The user logs into their LoLLMs account and authorizes your application to access their information.
3.  **Redirect Back with Token**: LoLLMs redirects the user back to your application's specified "Redirect URI" with a short-lived, single-use token in the URL.
4.  **Token Validation**: Your application's frontend captures the token from the URL using this library.
5.  **Fetch User Info**: Your application uses the library's `introspect()` method. This method securely sends the token to the LoLLMs backend, which validates it and returns the authorized user data.
6.  **Session Management**: Your application can now use the returned user data to create its own session, log the user in, and update the UI.

## 1. Setup in LoLLMs

Before using this library, you must configure your application within your LoLLMs instance:

1.  Navigate to **Settings -> Services** (for personal apps) or **Admin Panel -> Services** (for system-wide apps).
2.  Add or Edit an Application.
3.  Set the **Authentication Type** to `LoLLMs SSO`.
4.  A unique **Client ID** will be generated from the application name (e.g., `my_test_app`). You will need this for the client library.
5.  Fill in the **Redirect URI**. This is the exact URL in your application where LoLLMs will send the user back after they log in (e.g., `https://myapp.com/auth/callback`). This page must use this SSO client library to handle the redirect.
6.  Select the user information your application requires (e.g., Email, First Name).
7.  Click **Save Changes**. The SSO secret is managed by the LoLLMs backend and is **not required** by this client library.

## 2. Integration into Your Application

### Step 1: Include the Library

Download `lollms_sso_client.js` from the `lollms_sso_client/` directory and include it in your web page.

```html
<script src="path/to/lollms_sso_client.js"></script>
```

### Step 2: Initialize the Client

Create a new instance of `LollmsSSOClient` with your LoLLMs server URL and your application's **Client ID**.

```javascript
const ssoClient = new LollmsSSOClient({
    lollmsUrl: 'http://localhost:9642', // The URL of your LoLLMs instance
    clientId: 'my_test_app',            // The Client ID of your app from LoLLMs
});
```

### Step 3: Handle the Login Flow

1.  **Triggering Login**: Create a "Login with LoLLMs" button. When clicked, call the `login()` method.

    ```javascript
    // In your main login page script
    document.getElementById('login-button').addEventListener('click', () => {
        ssoClient.login();
    });
    ```

2.  **Handling the Redirect**: On the page specified as your **Redirect URI**, you must call `handleRedirect()`. This method checks the URL for a token, saves it to `localStorage`, and cleans the URL.

    ```javascript
    // Place this code on your redirect page (e.g., /auth/callback)
    document.addEventListener('DOMContentLoaded', () => {
        const token = ssoClient.handleRedirect();
        if (token) {
            console.log("Login successful! Token stored.");
            // Now you can verify the token and then redirect to the main part of your app.
            window.location.href = '/dashboard'; 
        }
    });
    ```

### Step 4: Verify Token and Access User Data

After the redirect, you have a token. Use `introspect()` to securely verify it with the LoLLMs server and get the user's information.

```javascript
// In your main application logic (e.g., on your dashboard page)
async function fetchAndDisplayUserInfo() {
    if (!ssoClient.isAuthenticated()) {
        console.log("User is not logged in. Redirecting to login.");
        // Redirect to your app's login page
        window.location.href = '/login.html';
        return;
    }

    try {
        const introspectionData = await ssoClient.introspect();
        console.log("User is valid:", introspectionData);
        // `introspectionData.user_info` contains the shared data (e.g., username, email)
        document.getElementById('welcome-message').textContent = `Welcome, ${introspectionData.user_info.username}!`;
    } catch (error) {
        console.error("Authentication check failed:", error.message);
        // The token is invalid or expired. The library automatically calls logout().
        // Redirect back to your login page.
        window.location.href = '/login.html';
    }
}

fetchAndDisplayUserInfo();
```

### Step 5: Handling Logout

To log a user out of your application, call `logout()`. This removes their token from `localStorage`.

```javascript
document.getElementById('logout-button').addEventListener('click', () => {
    ssoClient.logout();
    // Redirect to your login page
    window.location.href = '/login.html';
});
```

## API Reference

-   `new LollmsSSOClient({ lollmsUrl, clientId, tokenStorageKey? })`
    -   Creates a new client instance. `clientId` must match the one in your LoLLMs app configuration.
-   `.login()`
    -   Redirects the browser to the LoLLMs login page for your `clientId`.
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
    -   Async method. Securely validates the token with the LoLLMs server. Returns a promise that resolves with user data or rejects with an error.

```