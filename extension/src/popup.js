// Synk Extension - Popup Script
// Handles the popup UI and tab saving functionality

const API_BASE = 'http://localhost:3000';

// State
let isLoggedIn = false;
let user = null;
let recentSaves = [];
let tabCount = 0;

// DOM Elements
const root = document.getElementById('root');

// Initialize popup
async function init() {
    // Get current tab count
    const tabs = await chrome.tabs.query({ currentWindow: true });
    tabCount = tabs.filter(tab =>
        !tab.pinned &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://')
    ).length;

    // Check auth status
    const authData = await chrome.storage.local.get(['token', 'user']);
    if (authData.token && authData.user) {
        isLoggedIn = true;
        user = authData.user;
        await loadRecentSaves();
    }

    render();
}

// Render the popup UI
function render() {
    if (!isLoggedIn) {
        root.innerHTML = renderLoginPrompt();
    } else {
        root.innerHTML = renderMainView();
    }
    attachEventListeners();
}

function renderLoginPrompt() {
    return `
    <div class="login-prompt">
      <h2>Welcome to Synk</h2>
      <p>Sign in to start saving your tabs</p>
      <button class="login-btn" id="loginBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>
    </div>
    <div class="footer">
      <a href="${API_BASE}" target="_blank" class="dashboard-link">Open Synk</a>
    </div>
  `;
}

function renderMainView() {
    const recentSavesHtml = recentSaves.length > 0
        ? recentSaves.map(save => `
        <div class="save-item" data-url="${save.url}">
          <img class="save-favicon" src="${save.favicon || `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`}" alt="">
          <div class="save-info">
            <div class="save-title">${escapeHtml(save.title)}</div>
            <div class="save-time">${formatTime(save.createdAt)}</div>
          </div>
        </div>
      `).join('')
        : '<p style="color: #9ca3af; font-size: 13px;">No saves yet</p>';

    return `
    <div class="header">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Synk
      </div>
      <img class="user-avatar" src="${user?.image || ''}" alt="${user?.name || 'User'}">
    </div>
    <div class="main">
      <button class="save-all-btn" id="saveAllBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
        Save All Tabs
      </button>
      <div class="tab-count">${tabCount} tab${tabCount !== 1 ? 's' : ''} to save</div>
      
      <div class="recent-section">
        <div class="section-title">Recent Saves</div>
        ${recentSavesHtml}
      </div>
    </div>
    <div class="footer">
      <a href="${API_BASE}" target="_blank" class="dashboard-link">Open Dashboard</a>
    </div>
  `;
}

// Event listeners
function attachEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    const saveAllBtn = document.getElementById('saveAllBtn');
    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', handleSaveAll);
    }

    // Open saved items in new tab
    document.querySelectorAll('.save-item').forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            chrome.tabs.create({ url });
        });
    });
}

// Handle login
function handleLogin() {
    chrome.tabs.create({ url: `${API_BASE}/auth/signin?callbackUrl=/auth/extension-callback` });
}

// Handle save all tabs
async function handleSaveAll() {
    const btn = document.getElementById('saveAllBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const tabsToSave = tabs.filter(tab =>
            !tab.pinned &&
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://') &&
            tab.url !== 'about:blank'
        );

        if (tabsToSave.length === 0) {
            showToast('No tabs to save');
            return;
        }

        // Get auth token
        const { token } = await chrome.storage.local.get('token');
        if (!token) {
            showToast('Please sign in first');
            return;
        }

        // Send to API
        const response = await fetch(`${API_BASE}/api/trpc/saves.createMany`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                json: tabsToSave.map(tab => ({
                    url: tab.url,
                    title: tab.title || 'Untitled',
                    favicon: tab.favIconUrl,
                    domain: new URL(tab.url).hostname,
                })),
            }),
        });

        if (response.ok) {
            const result = await response.json();
            showToast(`✓ ${tabsToSave.length} tabs saved`);

            // Close saved tabs (except the current one)
            const currentTab = tabs.find(t => t.active);
            const tabIdsToClose = tabsToSave
                .filter(t => t.id !== currentTab?.id)
                .map(t => t.id);

            if (tabIdsToClose.length > 0) {
                chrome.tabs.remove(tabIdsToClose);
            }

            // Refresh recent saves
            await loadRecentSaves();
            render();
        } else {
            throw new Error('Failed to save tabs');
        }
    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save tabs');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
        Save All Tabs
      `;
        }
    }
}

// Load recent saves from API
async function loadRecentSaves() {
    try {
        const { token } = await chrome.storage.local.get('token');
        if (!token) return;

        const response = await fetch(`${API_BASE}/api/trpc/saves.getRecent?input=${encodeURIComponent(JSON.stringify({ json: { limit: 5 } }))}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            const data = await response.json();
            recentSaves = data.result?.data?.json || [];
        }
    } catch (error) {
        console.error('Failed to load recent saves:', error);
    }
}

// Helper: Show toast notification
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Initialize
init();
