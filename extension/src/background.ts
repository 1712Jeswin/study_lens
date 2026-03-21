import { initializeStorage } from './storage.js'

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[StudyLens] Extension installed')
  
  // chrome.runtime.onInstalled is the best place to initialize our storage schema
  // to ensure all expected keys exist before the extension starts tracking.
  try {
    await initializeStorage()
  } catch (error) {
    console.error('[StudyLens background] Initialization failed:', error)
  }
})
