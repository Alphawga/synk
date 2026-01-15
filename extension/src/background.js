// Synk Extension - Background Service Worker
// Handles keyboard shortcuts and extension lifecycle

const API_BASE = 'http://localhost:3000';

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'save-all-tabs') {
        await saveAllTabs();
    } else if (command === 'save-current-tab') {
        await saveCurrentTab();
    }
});

// Save all tabs
async function saveAllTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToSave = tabs.filter(tab =>
        !tab.pinned &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        tab.url !== 'about:blank'
    );

    if (tabsToSave.length === 0) {
        showNotification('No tabs to save');
        return;
    }

    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showNotification('Please sign in to Synk first');
        return;
    }

    try {
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
            showNotification(`✓ ${tabsToSave.length} tabs saved`);

            // Close saved tabs (except the current one)
            const currentTab = tabs.find(t => t.active);
            const tabIdsToClose = tabsToSave
                .filter(t => t.id !== currentTab?.id)
                .map(t => t.id);

            if (tabIdsToClose.length > 0) {
                chrome.tabs.remove(tabIdsToClose);
            }
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.error('Save all tabs error:', error);
        showNotification('Failed to save tabs');
    }
}

// Save current tab only
async function saveCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || tab.url.startsWith('chrome://')) {
        showNotification('Cannot save this page');
        return;
    }

    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showNotification('Please sign in to Synk first');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/trpc/saves.create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                json: {
                    url: tab.url,
                    title: tab.title || 'Untitled',
                    favicon: tab.favIconUrl,
                    domain: new URL(tab.url).hostname,
                },
            }),
        });

        if (response.ok) {
            showNotification('✓ Page saved');
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.error('Save current tab error:', error);
        showNotification('Failed to save page');
    }
}

// Show notification (badge or chrome notification)
function showNotification(message) {
    // Use badge text for quick feedback
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
    }, 2000);

    // Also log for debugging
    console.log('Synk:', message);
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_SUCCESS') {
        // Store auth data
        chrome.storage.local.set({
            token: message.token,
            user: message.user,
        });
        sendResponse({ success: true });
    }
    return true;
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Open onboarding page on first install
        chrome.tabs.create({ url: API_BASE });
    }
});
