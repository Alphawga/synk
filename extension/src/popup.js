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

  // Check auth status from chrome.storage
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign in to Synk
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
        <div class="save-item" data-url="${escapeHtml(save.url)}">
          <img class="save-favicon" src="${save.favicon || `https://www.google.com/s2/favicons?domain=${save.domain}&sz=32`}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23666%22><rect width=%2224%22 height=%2224%22 rx=%224%22/></svg>'">
          <div class="save-info">
            <div class="save-title">${escapeHtml(save.title)}</div>
            <div class="save-time">${formatTime(save.createdAt)}</div>
          </div>
        </div>
      `).join('')
    : '<p style="color: #9ca3af; font-size: 13px; text-align: center; padding: 10px 0;">No saves yet. Click above to save your tabs!</p>';

  return `
    <div class="header">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Synk
      </div>
      <div class="user-menu">
        <img class="user-avatar" src="${user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`}" alt="${user?.name || 'User'}" title="${user?.email}">
        <button class="logout-btn" id="logoutBtn" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
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
      <a href="${API_BASE}/dashboard" target="_blank" class="dashboard-link">Open Dashboard</a>
    </div>
  `;
}

// Event listeners
function attachEventListeners() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
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

// Handle login - opens web app auth flow
function handleLogin() {
  // Open the extension token API which handles auth and redirects with token
  chrome.tabs.create({
    url: `${API_BASE}/api/auth/extension-token`
  });

  // Close popup - user will reopen after auth
  window.close();
}

// Handle logout
async function handleLogout() {
  await chrome.storage.local.remove(['token', 'user']);
  isLoggedIn = false;
  user = null;
  recentSaves = [];
  render();
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
      tab.url !== 'about:blank' &&
      tab.url
    );

    if (tabsToSave.length === 0) {
      showToast('No tabs to save');
      resetButton(btn);
      return;
    }

    // Get auth token
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
      showToast('Please sign in first');
      resetButton(btn);
      return;
    }

    // Prepare the save data
    const saveData = tabsToSave.map(tab => ({
      url: tab.url,
      title: tab.title || 'Untitled',
      favicon: tab.favIconUrl || null,
      domain: new URL(tab.url).hostname,
    }));

    // Send to API
    const response = await fetch(`${API_BASE}/api/extension/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ tabs: saveData }),
    });

    if (response.ok) {
      const result = await response.json();
      showToast(`✓ ${result.count} tabs saved`);

      // Close saved tabs (except the current one)
      const currentTab = tabs.find(t => t.active);
      const tabIdsToClose = tabsToSave
        .filter(t => t.id !== currentTab?.id)
        .map(t => t.id);

      if (tabIdsToClose.length > 0) {
        chrome.tabs.remove(tabIdsToClose);
      }

      // Refresh recent saves and tab count
      tabCount = 1;
      await loadRecentSaves();
      render();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save tabs');
    }
  } catch (error) {
    console.error('Save error:', error);
    showToast(error.message || 'Failed to save tabs');
    resetButton(btn);
  }
}

function resetButton(btn) {
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

// Load recent saves from API
async function loadRecentSaves() {
  try {
    const { token } = await chrome.storage.local.get('token');
    if (!token) return;

    const response = await fetch(`${API_BASE}/api/extension/recent?limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      recentSaves = data.saves || [];
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
  if (!text) return '';
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
