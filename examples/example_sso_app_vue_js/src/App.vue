<script setup>
import { ref, onMounted } from 'vue';
import LollmsSSOClient from '@lollms/sso-client';

// --- Configuration ---
const lollmsUrl = 'http://localhost:9642';
const appName = 'My Test App';

const ssoClient = new LollmsSSOClient({ lollmsUrl, appName });

// --- Component State ---
const isAuthenticated = ref(false);
const user = ref(null);
const note = ref('');
const statusMessage = ref('');
const statusIsError = ref(false);

// --- Functions ---
const showStatus = (message, isError = false) => {
    statusMessage.value = message;
    statusIsError.value = isError;
    setTimeout(() => {
        statusMessage.value = '';
    }, 3000);
};

const handleLogin = () => {
    ssoClient.login();
};

const handleLogout = () => {
    ssoClient.logout();
    isAuthenticated.value = false;
    user.value = null;
};

const handleSaveNote = async () => {
    if (!note.value.trim()) {
        showStatus("Note cannot be empty.", true);
        return;
    }

    const token = ssoClient.getToken();
    const formData = new FormData();
    formData.append('note', note.value);

    try {
        const response = await fetch('/api/save_note', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail);
        
        showStatus(result.message);
        note.value = '';
    } catch (error) {
        showStatus(`Error saving note: ${error.message}`, true);
    }
};

// --- Lifecycle Hook ---
onMounted(async () => {
    ssoClient.handleRedirect();
    isAuthenticated.value = ssoClient.isAuthenticated();

    if (isAuthenticated.value) {
        try {
            const userData = await ssoClient.introspect();
            user.value = userData.user_info;
        } catch (error) {
            showStatus(`Session invalid: ${error.message}`, true);
            handleLogout(); // Log out if introspection fails
        }
    }
});
</script>

<template>
    <div class="container">
        <h1>Vue.js SSO Example</h1>

        <div v-if="!isAuthenticated">
            <p>You are not logged in.</p>
            <button @click="handleLogin" class="btn-primary">Login with LoLLMs</button>
        </div>

        <div v-else>
            <p v-if="user">Welcome, {{ user.username }}!</p>
            <div class="form-group">
                <label for="note-input">Enter a note to save:</label>
                <textarea v-model="note" id="note-input" placeholder="My secret note..."></textarea>
                <button @click="handleSaveNote" class="btn-primary">Save Note</button>
            </div>
            <hr>
            <button @click="handleLogout" class="btn-secondary">Logout</button>
        </div>

        <div v-if="statusMessage" id="status" :class="{ 'status-success': !statusIsError, 'status-error': statusIsError }">
            {{ statusMessage }}
        </div>
    </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 2em auto; background: white; padding: 2em; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
button { font-size: 1em; padding: 0.5em 1em; cursor: pointer; border-radius: 6px; border: 1px solid transparent; margin-top: 0.5em;}
.btn-primary { background-color: #2563eb; color: white; }
.btn-secondary { background-color: #e5e7eb; color: #1f2937; }
textarea { width: 100%; padding: 0.5em; border-radius: 6px; border: 1px solid #d1d5db; min-height: 80px; }
.form-group { margin-top: 1em; }
hr { margin: 1.5em 0; border: none; border-top: 1px solid #e5e7eb; }
#status { margin-top: 1em; padding: 0.5em; border-radius: 4px; }
.status-success { background-color: #d1fae5; color: #065f46; }
.status-error { background-color: #fee2e2; color: #991b1b; }
</style>