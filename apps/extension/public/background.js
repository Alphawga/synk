// Synk Extension - Background Service Worker

// ─── Configurable API URL ────────────────────────────────
// Default to production. Override via extension options or chrome.storage.
// Change to 'https://synk.ai' before publishing to Chrome Web Store
const DEFAULT_API_URL = 'http://localhost:3000';

async function getApiUrl() {
    try {
        const result = await chrome.storage.sync.get('apiUrl');
        return result.apiUrl || DEFAULT_API_URL;
    } catch {
        return DEFAULT_API_URL;
    }
}

// ─── Message Listener ────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'SAVE_ALL_TABS') {
        saveAllTabs()
            .then(result => sendResponse({ success: true, ...result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Async response
    }

    if (request.action === 'SAVE_CURRENT_TAB') {
        saveCurrentTab()
            .then(result => sendResponse({ success: true, ...result }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'SAVE_AND_CLOSE_ALL') {
        // Fire-and-forget from popup — no response needed
        saveAllTabs()
            .then(() => closeSavedTabs())
            .catch(err => console.error('[SYNK] Save & close failed:', err));
        return false; // No async response
    }

    if (request.action === 'GET_RECENT_SAVES') {
        getRecentSaves()
            .then(saves => sendResponse({ success: true, saves }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'GET_TAB_COUNT') {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const count = tabs.filter(t =>
                t.url &&
                !t.url.startsWith('chrome://') &&
                !t.url.startsWith('chrome-extension://') &&
                !t.pinned
            ).length;
            sendResponse({ count });
        });
        return true;
    }
});

// ─── Keyboard Shortcut ──────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'save-all-tabs') {
        await saveAllTabs();
    }
});

// ─── Save All Tabs ──────────────────────────────────────
async function saveAllTabs() {
    const API_BASE = await getApiUrl();

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const validTabs = tabs
        .filter(tab =>
            tab.url &&
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://') &&
            !tab.pinned
        )
        .map(tab => ({
            url: tab.url,
            title: tab.title || 'Untitled',
            favIconUrl: tab.favIconUrl
        }));

    if (validTabs.length === 0) {
        throw new Error('No tabs to save');
    }

    const response = await fetch(`${API_BASE}/api/extension/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabs: validTabs }),
    });

    if (response.status === 401) {
        chrome.tabs.create({ url: `${API_BASE}/api/auth/signin` });
        throw new Error('Please log in first');
    }

    if (!response.ok) {
        throw new Error('Failed to save tabs');
    }

    const data = await response.json();
    return { count: validTabs.length, sessionId: data.sessionId };
}

// ─── Close Saved Tabs (called after save completes) ─────
async function closeSavedTabs() {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const closableTabs = tabs.filter(tab =>
            tab.url &&
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://') &&
            !tab.pinned
        );

        if (closableTabs.length === 0) return;

        // Create a new tab first so the window stays open
        await chrome.tabs.create({ url: 'chrome://newtab' });

        const tabIds = closableTabs.map(t => t.id).filter(Boolean);
        if (tabIds.length > 0) {
            await chrome.tabs.remove(tabIds);
        }

        console.log(`[SYNK] ✅ Closed ${tabIds.length} tabs`);
    } catch (err) {
        console.error('[SYNK] Failed to close tabs:', err);
    }
}

// ─── Save Current Tab ───────────────────────────────────
async function saveCurrentTab() {
    const API_BASE = await getApiUrl();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || tab.url.startsWith('chrome://')) {
        throw new Error('Cannot save this tab');
    }

    const response = await fetch(`${API_BASE}/api/extension/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tabs: [{
                url: tab.url,
                title: tab.title || 'Untitled',
                favIconUrl: tab.favIconUrl
            }]
        }),
    });

    if (response.status === 401) {
        chrome.tabs.create({ url: `${API_BASE}/api/auth/signin` });
        throw new Error('Please log in first');
    }

    if (!response.ok) {
        throw new Error('Failed to save tab');
    }

    const data = await response.json();
    return { count: 1, sessionId: data.sessionId };
}

// ─── Get Recent Saves ───────────────────────────────────
async function getRecentSaves() {
    const API_BASE = await getApiUrl();

    const response = await fetch(`${API_BASE}/api/extension/recent`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
        return [];
    }

    if (!response.ok) {
        throw new Error('Failed to fetch recent saves');
    }

    return await response.json();
}
