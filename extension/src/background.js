// Synk Extension - Background Service Worker
// Handles keyboard shortcuts, auth callback interception, and extension lifecycle

const API_BASE = 'http://localhost:3000';

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'save-all-tabs') {
        await saveAllTabs();
    } else if (command === 'save-current-tab') {
        await saveCurrentTab();
    }
});

// Listen for tab URL changes to intercept auth callback
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Check if this is the extension callback URL with token
    if (changeInfo.url && changeInfo.url.includes('/auth/extension-callback#token=')) {
        console.log('Synk: Detected auth callback, extracting token...');

        try {
            const url = new URL(changeInfo.url);
            const hash = url.hash.slice(1); // Remove #
            const params = new URLSearchParams(hash);
            const token = params.get('token');
            const userJson = params.get('user');

            if (token && userJson) {
                const user = JSON.parse(decodeURIComponent(userJson));

                // Store in chrome.storage.local
                await chrome.storage.local.set({ token, user });
                console.log('Synk: Auth token stored successfully for', user.email);

                // Show success badge
                chrome.action.setBadgeText({ text: '✓' });
                chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

                // Close the callback tab after a short delay
                setTimeout(() => {
                    chrome.tabs.remove(tabId);
                    chrome.action.setBadgeText({ text: '' });
                }, 1500);
            }
        } catch (err) {
            console.error('Synk: Failed to extract auth token:', err);
        }
    }
});

// Save all tabs
async function saveAllTabs() {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showNotification('Please sign in to Synk first');
        return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabsToSave = tabs.filter(tab =>
        !tab.pinned &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        tab.url !== 'about:blank' &&
        tab.url
    );

    if (tabsToSave.length === 0) {
        showNotification('No tabs to save');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/extension/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                tabs: tabsToSave.map(tab => ({
                    url: tab.url,
                    title: tab.title || 'Untitled',
                    favicon: tab.favIconUrl || null,
                    domain: new URL(tab.url).hostname,
                })),
            }),
        });

        if (response.ok) {
            const result = await response.json();
            showNotification(`✓ ${result.count} tabs saved`);

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
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
        showNotification('Please sign in to Synk first');
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || tab.url.startsWith('chrome://')) {
        showNotification('Cannot save this page');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/extension/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                tabs: [{
                    url: tab.url,
                    title: tab.title || 'Untitled',
                    favicon: tab.favIconUrl || null,
                    domain: new URL(tab.url).hostname,
                }],
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

// Show notification via badge
function showNotification(message) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
    }, 2000);

    console.log('Synk:', message);
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: API_BASE });
    }
});
