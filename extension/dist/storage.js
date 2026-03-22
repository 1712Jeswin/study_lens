// storage.ts — All chrome.storage.local reads and writes. Single access point.
/**
 * Helper to get today's date in ISO YYYY-MM-DD format.
 *
 * @returns Today's date string
 */
function getTodayISO() {
    return new Date().toISOString().slice(0, 10);
}
export const DEFAULT_DAILY_RECORD = (date = getTodayISO()) => ({
    date,
    ai: 0,
    coding: 0,
    study: 0,
    distraction: 0,
    uncategorized: 0
});
export const DEFAULT_STREAK = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: ''
};
export const DEFAULT_STORAGE = {
    records: {},
    streak: DEFAULT_STREAK,
    pendingReflection: null,
    reflectionHistory: [],
    installedAt: 0
};
/**
 * Initializes storage with defaults if not already present.
 * Called during extension installation.
 *
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeStorage() {
    // chrome.storage.local is the primary storage API for Manifest V3.
    // It persists data even after the browser is closed.
    try {
        const data = await chrome.storage.local.get(null);
        if (Object.keys(data).length === 0) {
            await chrome.storage.local.set({
                ...DEFAULT_STORAGE,
                installedAt: Date.now()
            });
            console.log('[StudyLens storage] Storage initialized with defaults');
        }
    }
    catch (error) {
        console.error('[StudyLens storage] Error initializing storage:', error);
    }
}
/**
 * Retrieves the complete storage object.
 * Always merges with defaults to ensure no field is undefined.
 *
 * @returns The complete StorageSchema
 */
export async function getStorageData() {
    try {
        const data = await chrome.storage.local.get(null);
        return {
            ...DEFAULT_STORAGE,
            ...data
        };
    }
    catch (error) {
        console.error('[StudyLens storage] Error reading storage data:', error);
        return DEFAULT_STORAGE;
    }
}
/**
 * Gets the record for the current day.
 * Returns a default record if none exists for today.
 *
 * @returns Today's DailyRecord
 */
export async function getTodayRecord() {
    const today = getTodayISO();
    try {
        const { records } = await getStorageData();
        return records[today] ?? DEFAULT_DAILY_RECORD(today);
    }
    catch (error) {
        console.error('[StudyLens storage] Error getting today record:', error);
        return DEFAULT_DAILY_RECORD(today);
    }
}
/**
 * Updates the time spent in a specific category for today.
 * This operation is atomic (read -> modify -> write).
 *
 * @param category - The SiteCategory to update
 * @param secondsToAdd - Number of seconds to add
 * @returns Promise that resolves when the write is complete
 */
export async function updateTodayRecord(category, secondsToAdd) {
    const today = getTodayISO();
    try {
        const data = await getStorageData();
        const records = data.records;
        const record = records[today] ?? DEFAULT_DAILY_RECORD(today);
        record[category] += secondsToAdd;
        records[today] = record;
        await chrome.storage.local.set({ records });
    }
    catch (error) {
        console.error('[StudyLens storage] Error updating today record:', error);
    }
}
/**
 * Retrieves the current streak data.
 *
 * @returns The current StreakData
 */
export async function getStreak() {
    try {
        const { streak } = await getStorageData();
        return streak;
    }
    catch (error) {
        console.error('[StudyLens storage] Error getting streak:', error);
        return DEFAULT_STREAK;
    }
}
/**
 * Updates the streak data in storage.
 *
 * @param streak - The new StreakData object
 * @returns Promise that resolves when the write is complete
 */
export async function updateStreak(streak) {
    try {
        await chrome.storage.local.set({ streak });
    }
    catch (error) {
        console.error('[StudyLens storage] Error updating streak:', error);
    }
}
/**
 * Gets the current pending reflection entry, if any.
 *
 * @returns The ReflectionEntry or null if none is pending
 */
export async function getPendingReflection() {
    try {
        const { pendingReflection } = await getStorageData();
        return pendingReflection;
    }
    catch (error) {
        console.error('[StudyLens storage] Error getting pending reflection:', error);
        return null;
    }
}
/**
 * Sets or clears the pending reflection entry.
 *
 * @param entry - The ReflectionEntry to set, or null to clear
 * @returns Promise that resolves when the write is complete
 */
export async function setPendingReflection(entry) {
    try {
        await chrome.storage.local.set({ pendingReflection: entry });
    }
    catch (error) {
        console.error('[StudyLens storage] Error setting pending reflection:', error);
    }
}
/**
 * Adds a completed reflection to the history and clears the pending entry.
 * Caps history at 100 entries, dropping the oldest.
 *
 * @param entry - The completed ReflectionEntry
 * @returns Promise that resolves when the write is complete
 */
export async function addReflectionToHistory(entry) {
    try {
        const data = await getStorageData();
        const history = [...data.reflectionHistory, entry];
        // Cap history at 100 entries (oldest dropped)
        if (history.length > 100) {
            history.shift();
        }
        await chrome.storage.local.set({
            reflectionHistory: history,
            pendingReflection: null
        });
    }
    catch (error) {
        console.error('[StudyLens storage] Error adding reflection to history:', error);
    }
}
/**
 * Gets all recorded daily records.
 *
 * @returns A Record object keyed by ISO date strings
 */
export async function getAllRecords() {
    try {
        const { records } = await getStorageData();
        return records;
    }
    catch (error) {
        console.error('[StudyLens storage] Error getting all records:', error);
        return {};
    }
}
/**
 * Clears all extension data from storage.
 * Use with caution.
 *
 * @returns Promise that resolves when data is cleared
 */
export async function clearAllData() {
    try {
        await chrome.storage.local.clear();
        console.log('[StudyLens storage] All storage data cleared');
    }
    catch (error) {
        console.error('[StudyLens storage] Error clearing storage data:', error);
    }
}
/**
 * Appends a session entry to today's session log.
 * Caps the session log at 200 entries (drops oldest on overflow).
 *
 * @param entry - The SessionEntry to append
 * @returns Promise that resolves when the write is complete
 */
export async function appendSessionEntry(entry) {
    try {
        const data = await getStorageData();
        const today = getTodayISO();
        const records = data.records;
        const record = records[today] ?? DEFAULT_DAILY_RECORD(today);
        const sessionLog = record.sessionLog ?? [];
        sessionLog.push(entry);
        // Cap at 200 entries — drop oldest if exceeded
        while (sessionLog.length > 200) {
            sessionLog.shift();
        }
        record.sessionLog = sessionLog;
        records[today] = record;
        await chrome.storage.local.set({ records });
    }
    catch (error) {
        console.error('[StudyLens storage] Error appending session entry:', error);
    }
}
/**
 * Updates an activity sub-time field on today's record.
 * Initialises the field to 0 if it is undefined.
 *
 * @param field - The DailyRecord field key to update (e.g. 'practiceSeconds')
 * @param secondsToAdd - Number of seconds to add
 * @returns Promise that resolves when the write is complete
 */
export async function updateActivitySeconds(field, secondsToAdd) {
    try {
        const data = await getStorageData();
        const today = getTodayISO();
        const records = data.records;
        const record = records[today] ?? DEFAULT_DAILY_RECORD(today);
        const current = record[field] ?? 0;
        // Use Object.assign to set the field value safely
        Object.assign(record, { [field]: current + secondsToAdd });
        records[today] = record;
        await chrome.storage.local.set({ records });
    }
    catch (error) {
        console.error('[StudyLens storage] Error updating activity seconds:', error);
    }
}
/**
 * Updates or creates a topic tag entry on today's record.
 * Finds an existing TopicTag with a matching name, or creates a new one.
 *
 * @param name - The standardised topic name
 * @param seconds - Duration in seconds to add
 * @param isPractice - Whether this time was active practice
 * @returns Promise that resolves when the write is complete
 */
export async function updateTopicTag(name, seconds, isPractice) {
    try {
        const data = await getStorageData();
        const today = getTodayISO();
        const records = data.records;
        const record = records[today] ?? DEFAULT_DAILY_RECORD(today);
        const topicTags = record.topicTags ?? [];
        const existing = topicTags.find(t => t.name === name);
        if (existing) {
            existing.totalSeconds += seconds;
            if (isPractice)
                existing.practiceSeconds += seconds;
        }
        else {
            topicTags.push({
                name,
                totalSeconds: seconds,
                practiceSeconds: isPractice ? seconds : 0,
            });
        }
        record.topicTags = topicTags;
        records[today] = record;
        await chrome.storage.local.set({ records });
    }
    catch (error) {
        console.error('[StudyLens storage] Error updating topic tag:', error);
    }
}
/**
 * Retrieves today's session log.
 *
 * @returns An array of SessionEntry objects for today, or empty array if none
 */
export async function getSessionLog() {
    try {
        const record = await getTodayRecord();
        return record.sessionLog ?? [];
    }
    catch (error) {
        console.error('[StudyLens storage] Error getting session log:', error);
        return [];
    }
}
