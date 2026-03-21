// Placeholder code to ensure the import chain works
console.log('[StudyLens] Background script starting with session format:', {});
// chrome.runtime.onInstalled fires when the extension is first installed, updated, or Chrome is updated.
// We use this to initialize our database defaults and setup background alarms.
chrome.runtime.onInstalled.addListener(() => {
    console.log('[StudyLens] Extension installed');
});
export {};
