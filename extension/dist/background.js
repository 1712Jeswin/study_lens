// background.ts — Service worker: listens to Chrome events, tracks active tab time, writes to storage.
// IMPORTANT: This file runs in a service worker. No window, no document, no localStorage.
import { classifySite, isTrackableUrl, extractDomain } from './classifier.js';
import { initializeStorage, updateTodayRecord, getStreak, updateStreak, setPendingReflection, getTodayRecord } from './storage.js';
import { calculateStreak, streakQualifies } from './streak.js';
import { shouldTriggerReflection, createReflectionEntry } from './reflection.js';
// The currently active tab being timed. null when no trackable tab is active.
let activeSession = null;
// chrome.runtime.onInstalled fires when the extension is first installed, updated to a new version, or Chrome is updated.
chrome.runtime.onInstalled.addListener(async () => {
    try {
        await initializeStorage();
        // chrome.alarms.create schedules code to run periodically or at a specific time in the future.
        chrome.alarms.create('tick', { periodInMinutes: 1 });
        // Calculate next midnight timestamp. We use JS Date to get midnight tonight.
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        chrome.alarms.create('dailyReset', { when: midnight.getTime() });
        console.log('[StudyLens] Extension installed and alarms created');
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
});
// chrome.tabs.onActivated fires whenever the user switches to a different tab in the same window.
// tabInfo contains only tabId and windowId — we need to call chrome.tabs.get()
// to retrieve the actual URL of the newly active tab.
chrome.tabs.onActivated.addListener(async (tabInfo) => {
    try {
        // chrome.tabs.get requests details about a specific tab, such as its URL.
        const tab = await chrome.tabs.get(tabInfo.tabId);
        if (tab.url) {
            await handleTabChange(tab.url, tab.id ?? 0);
        }
    }
    catch (error) {
        // Tab was closed before this callback fired — expected behaviour, not a bug
        console.error('[StudyLens background] Could not read tab:', error);
    }
});
// chrome.tabs.onUpdated fires whenever a tab's URL changes or it reloads.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete' && tab.url) {
            if (tabId === activeSession?.tabId) {
                await handleTabChange(tab.url, tabId);
            }
            else if (activeSession === null && tab.active) {
                // If activeSession is null (e.g. from a new untrackable tab), we must verify
                // that this updated tab is in the currently focused window before tracking it.
                const win = await chrome.windows.get(tab.windowId);
                if (win.focused) {
                    await handleTabChange(tab.url, tabId);
                }
            }
        }
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
});
// chrome.windows.onFocusChanged fires whenever the user clicks to a different Chrome window or focuses away from Chrome.
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    try {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            if (activeSession !== null) {
                await finaliseSession(activeSession);
            }
            activeSession = null;
        }
        else {
            // chrome.tabs.query searches for tabs matching specific criteria.
            const tabs = await chrome.tabs.query({ active: true, windowId });
            if (tabs.length > 0 && tabs[0].url) {
                await handleTabChange(tabs[0].url, tabs[0].id ?? 0);
            }
        }
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
});
/**
 * Handles switching tracking to a new URL and finalising the previous one.
 */
async function handleTabChange(url, tabId) {
    try {
        const domain = extractDomain(url);
        if (activeSession !== null) {
            // Prevent rapid SPA navigations or duplicate onUpdated events from discarding time
            // If we are already tracking this exact tab and domain, continue the current session.
            if (activeSession.tabId === tabId && activeSession.domain === domain) {
                return;
            }
            await finaliseSession(activeSession);
        }
        if (!isTrackableUrl(url) || !domain) {
            activeSession = null;
            return;
        }
        activeSession = {
            domain,
            category: classifySite(url),
            startTime: Date.now(),
            tabId
        };
        console.log(`[StudyLens] Tracking: ${activeSession.domain} (${activeSession.category})`);
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
}
/**
 * Finalises an active session, calculating duration, updating storage, and updating streaks.
 */
async function finaliseSession(session) {
    try {
        const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);
        if (durationSeconds < 5) {
            return;
        }
        await updateTodayRecord(session.category, durationSeconds);
        if (shouldTriggerReflection({ ...session, durationSeconds })) {
            const entry = createReflectionEntry(session, durationSeconds);
            await setPendingReflection(entry);
            chrome.alarms.create('reflectionCheck', { delayInMinutes: 5 });
        }
        const record = await getTodayRecord();
        if (streakQualifies(record)) {
            const streak = await getStreak();
            const newStreak = calculateStreak(streak, true);
            await updateStreak(newStreak);
        }
        console.log(`[StudyLens] Finalised: ${session.domain} — ${durationSeconds}s (${session.category})`);
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
}
// chrome.alarms.onAlarm fires when scheduled alarms trigger.
chrome.alarms.onAlarm.addListener(async (alarm) => {
    try {
        if (alarm.name === 'tick') {
            if (activeSession === null) {
                return;
            }
            const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
            await updateTodayRecord(activeSession.category, elapsed);
            activeSession.startTime = Date.now();
            console.log(`[StudyLens] Tick: saved ${elapsed}s for ${activeSession.domain}`);
        }
        else if (alarm.name === 'dailyReset') {
            if (activeSession !== null) {
                await finaliseSession(activeSession);
                activeSession.startTime = Date.now();
            }
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            chrome.alarms.create('dailyReset', { when: midnight.getTime() });
            console.log('[StudyLens] Daily reset complete');
        }
        else if (alarm.name === 'reflectionCheck') {
            console.log('[StudyLens] Reflection check — popup will show prompt on next open');
        }
    }
    catch (error) {
        console.error('[StudyLens background]', error);
    }
});
