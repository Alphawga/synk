// ─── Synk Extension Popup ────────────────────────────────
// Handles UI interactions, communicates with background.js

// Change to 'https://synk.ai' before publishing to Chrome Web Store
const DEFAULT_API_URL = 'http://localhost:3000';

// ─── DOM References ──────────────────────────────────────
const saveCurrentBtn = document.getElementById('save-current-btn');
const saveAllBtn = document.getElementById('save-all-btn');
const saveCloseBtn = document.getElementById('save-close-btn');
const tabCountEl = document.getElementById('tab-count');
const tabCountCloseEl = document.getElementById('tab-count-close');
const recentList = document.getElementById('recent-list');
const searchInput = document.getElementById('search-input');
const settingsBtn = document.getElementById('settings-btn');
const viewAllLink = document.getElementById('view-all-link');
const openDashboard = document.getElementById('open-dashboard');
const successOverlay = document.getElementById('success-overlay');
const successMessage = document.getElementById('success-message');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');
const errorDismiss = document.getElementById('error-dismiss');
const authBtn = document.getElementById('auth-btn');
const authIcon = document.getElementById('auth-icon');

let isLoggedIn = false;

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Get tab count
  chrome.runtime.sendMessage({ action: 'GET_TAB_COUNT' }, (response) => {
    if (response?.count !== undefined) {
      tabCountEl.textContent = response.count;
      tabCountCloseEl.textContent = response.count;
    }
  });

  // Check auth state & load recent saves
  await checkAuthState();
  loadRecentSaves();
});

// ─── Save Current Tab ────────────────────────────────────
saveCurrentBtn.addEventListener('click', () => {
  setButtonLoading(saveCurrentBtn, true);

  chrome.runtime.sendMessage({ action: 'SAVE_CURRENT_TAB' }, (response) => {
    setButtonLoading(saveCurrentBtn, false);

    if (response?.success) {
      showSuccess(`Tab saved!`);
    } else {
      showError(response?.error || 'Failed to save tab');
    }
  });
});

// ─── Save All Tabs ───────────────────────────────────────
saveAllBtn.addEventListener('click', () => {
  setButtonLoading(saveAllBtn, true);

  chrome.runtime.sendMessage({ action: 'SAVE_ALL_TABS' }, (response) => {
    setButtonLoading(saveAllBtn, false);

    if (response?.success) {
      showSuccess(`${response.count} tabs saved!`);
    } else {
      showError(response?.error || 'Failed to save tabs');
    }
  });
});

// ─── Save & Close All ────────────────────────────────────
saveCloseBtn.addEventListener('click', () => {
  // Fire-and-forget: send message, close popup immediately
  // Background script handles save + close independently
  chrome.runtime.sendMessage({ action: 'SAVE_AND_CLOSE_ALL' });
  window.close();
});

// ─── Search ──────────────────────────────────────────────
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      const apiUrl = await getApiUrl();
      chrome.tabs.create({ url: `${apiUrl}/dashboard/search?q=${encodeURIComponent(query)}` });
      window.close();
    }
  }
});

// ─── Navigation ──────────────────────────────────────────
settingsBtn.addEventListener('click', async () => {
  const apiUrl = await getApiUrl();
  chrome.tabs.create({ url: `${apiUrl}/dashboard/settings` });
  window.close();
});

viewAllLink.addEventListener('click', async (e) => {
  e.preventDefault();
  const apiUrl = await getApiUrl();
  chrome.tabs.create({ url: `${apiUrl}/dashboard` });
  window.close();
});

openDashboard.addEventListener('click', async (e) => {
  e.preventDefault();
  const apiUrl = await getApiUrl();
  chrome.tabs.create({ url: `${apiUrl}/dashboard` });
  window.close();
});

errorDismiss.addEventListener('click', () => {
  errorOverlay.classList.add('hidden');
});

// ─── Auth ────────────────────────────────────────────────
async function checkAuthState() {
  const apiUrl = await getApiUrl();
  try {
    const cookies = await chrome.cookies.getAll({ url: apiUrl });
    const hasSession = cookies.some(c => c.name.includes('session-token'));
    isLoggedIn = hasSession;
  } catch {
    isLoggedIn = false;
  }
  updateAuthUI();
}

function updateAuthUI() {
  if (isLoggedIn) {
    authIcon.textContent = 'logout';
    authBtn.title = 'Sign out';
  } else {
    authIcon.textContent = 'login';
    authBtn.title = 'Sign in';
  }
}

authBtn.addEventListener('click', async () => {
  const apiUrl = await getApiUrl();
  if (isLoggedIn) {
    // Sign out: navigate to NextAuth signout then close popup
    chrome.tabs.create({ url: `${apiUrl}/api/auth/signout` });
  } else {
    // Sign in: open the sign-in page
    chrome.tabs.create({ url: `${apiUrl}/auth/signin` });
  }
  window.close();
});

// ─── Recent Saves ────────────────────────────────────────
async function loadRecentSaves() {
  chrome.runtime.sendMessage({ action: 'GET_RECENT_SAVES' }, (response) => {
    if (response?.success && response.saves?.length > 0) {
      renderRecentSaves(response.saves);
    }
  });
}

function renderRecentSaves(saves) {
  recentList.innerHTML = '';

  const items = saves.slice(0, 5);
  items.forEach(save => {
    const li = document.createElement('li');
    li.className = 'recent-item';
    li.addEventListener('click', () => {
      chrome.tabs.create({ url: save.url });
      window.close();
    });

    const domain = getDomain(save.url);
    const timeAgo = getTimeAgo(save.createdAt);
    const iconBg = getIconColor(domain);

    li.innerHTML = `
            <div class="recent-item-icon" style="background: ${iconBg}">
                ${save.favicon
        ? `<img src="${save.favicon}" alt="" onerror="this.parentElement.textContent='${domain.charAt(0).toUpperCase()}';">`
        : `<span style="color: white; font-size: 12px; font-weight: 700;">${domain.charAt(0).toUpperCase()}</span>`
      }
            </div>
            <div class="recent-item-text">
                <p class="recent-item-title">${escapeHtml(save.title)}</p>
                <div class="recent-item-meta">
                    <span class="recent-item-domain">${domain}</span>
                    <span class="meta-dot"></span>
                    <span class="recent-item-time">${timeAgo}</span>
                </div>
            </div>
        `;

    recentList.appendChild(li);
  });
}

// ─── UI Helpers ──────────────────────────────────────────
function setButtonLoading(btn, loading) {
  const textEl = btn.querySelector('.btn-text');
  const iconEl = btn.querySelector('.btn-icon');

  if (loading) {
    btn.disabled = true;
    if (iconEl) iconEl.style.display = 'none';

    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    btn.insertBefore(spinner, textEl);

    if (textEl) textEl.textContent = 'Saving...';
  } else {
    btn.disabled = false;
    if (iconEl) iconEl.style.display = '';

    const spinner = btn.querySelector('.spinner');
    if (spinner) spinner.remove();

    // Restore original text
    if (btn === saveCurrentBtn && textEl) textEl.textContent = 'Save Current Tab';
    if (btn === saveAllBtn && textEl) textEl.textContent = 'Save All Tabs';
    if (btn === saveCloseBtn && textEl) textEl.textContent = 'Save & Close All';
  }
}

function showSuccess(message) {
  successMessage.textContent = message;
  successOverlay.classList.remove('hidden');
  setTimeout(() => {
    successOverlay.classList.add('hidden');
    loadRecentSaves(); // Refresh after save
  }, 1500);
}

function showError(message) {
  errorMessage.textContent = message;
  errorOverlay.classList.remove('hidden');
}

// ─── Utility ─────────────────────────────────────────────
async function getApiUrl() {
  try {
    const result = await chrome.storage.sync.get('apiUrl');
    return result.apiUrl || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getIconColor(domain) {
  // Brand colors for common domains
  const colors = {
    'x.com': '#000000',
    'twitter.com': '#000000',
    'github.com': '#24292e',
    'youtube.com': '#ff0000',
    'dribbble.com': '#ea4c89',
    'figma.com': '#a259ff',
    'stackoverflow.com': '#f48024',
  };

  return colors[domain] || '#1e293b';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
