# TUTOR.md — Extension Concepts for TypeScript Developers

> This document assumes you already know TypeScript, Git, npm, and general programming.
> It focuses exclusively on browser extension concepts — the parts that will be new and unfamiliar.
> Read this before Phase 1. Return to it whenever something in the Chrome API feels strange.

---

## 1. The Mental Model: Three Separate Worlds

A browser extension is not one program. It is three completely separate environments that can only communicate through a shared database (`chrome.storage`).

```
┌─────────────────────────────────────────────────────┐
│  SERVICE WORKER (background.ts)                      │
│  - Runs in its own isolated JS context               │
│  - No window, no document, no DOM                    │
│  - Wakes up on events, does work, goes back to sleep │
│  - Communicates with popup via chrome.storage only   │
└─────────────────────────────────────────────────────┘
         ↕ (only via chrome.storage.local)
┌─────────────────────────────────────────────────────┐
│  POPUP (popup.html + popup.ts)                       │
│  - A tiny self-contained webpage                     │
│  - Has window, document, full DOM access             │
│  - Only exists while the popup is open               │
│  - Reads from chrome.storage to display data         │
└─────────────────────────────────────────────────────┘
         ↕ (both read from the same storage)
┌─────────────────────────────────────────────────────┐
│  CHROME.STORAGE.LOCAL                                │
│  - Shared key-value database                         │
│  - Persists across browser restarts                  │
│  - The only bridge between the two worlds            │
└─────────────────────────────────────────────────────┘
```

The most common beginner mistake is trying to call something from the popup that only exists in the service worker, or vice versa. They cannot call each other directly. The storage is the only link.

---

## 2. Service Workers: What They Are and What They Cannot Do

A service worker is a JavaScript file that runs in the background, separate from any webpage. It's what makes the extension track your tabs even when you're not looking at the popup.

### What service workers CAN do:
- Listen to Chrome events (tab switches, alarm ticks, installs)
- Call Chrome extension APIs (`chrome.tabs`, `chrome.storage`, `chrome.alarms`)
- Make `fetch()` requests to external servers (we don't do this in V1/V2 for privacy)
- Run JavaScript calculations

### What service workers CANNOT do — and why:
| You might try | Why it fails | What to use instead |
|---|---|---|
| `window.localStorage.setItem(...)` | `window` does not exist in service worker context | `chrome.storage.local` |
| `document.getElementById(...)` | `document` does not exist — no DOM, no HTML | Only usable in popup.ts |
| `setInterval(() => {}, 60000)` | Service worker sleeps between events — timer stops firing | `chrome.alarms` |
| `setTimeout(() => {}, 5000)` | Same reason — unreliable in service workers | `chrome.alarms` with `delayInMinutes` |
| `console.log(window.location)` | No `window` | Use `chrome.tabs` to get URL information |

If you paste code that uses `window` or `document` into `background.ts`, TypeScript will actually catch it — those globals are not typed in the service worker context. This is one of the few cases where TypeScript's strict mode saves you automatically.

---

## 3. Why Service Workers Wake Up and Go to Sleep

In Manifest V2, extensions had a "background page" — a persistent invisible tab that stayed open forever and consumed RAM.

Manifest V3 replaced this with service workers, which are event-driven:
1. Chrome fires an event (e.g. you switch tabs)
2. The service worker wakes up
3. It handles the event
4. If no events arrive for ~30 seconds, Chrome may kill it to save memory

This creates a trap: **module-level variables do not persist between wake cycles.**

```typescript
// This seems reasonable but is a trap:
let visitCount = 0  // resets to 0 every time the service worker wakes up

// Instead, persist anything important to chrome.storage.local immediately
```

In StudyLens, `activeSession` is a module-level variable — it tracks the currently open tab. If the service worker is killed mid-session, `activeSession` is lost. The `"tick"` alarm fires every minute specifically to write the accumulated time to storage before this can happen. This is the "rolling window" pattern.

---

## 4. `chrome.storage.local` vs `localStorage`

You are used to `localStorage` from web development. They look similar but behave very differently in an extension.

| | `localStorage` | `chrome.storage.local` |
|---|---|---|
| Where it works | Webpages, popup.ts | Service worker, popup.ts — everywhere in the extension |
| API style | Synchronous | Async (returns Promises) |
| Storage limit | ~5MB | ~10MB by default, can request more |
| Shared between service worker and popup? | No | Yes |
| Persists across browser restart? | Yes | Yes |
| Available in service worker? | No — will throw | Yes |

The async nature is the key difference. Every storage call must be awaited:

```typescript
// WRONG — localStorage pattern, synchronous
const data = chrome.storage.local.getItem('records')  // this doesn't exist

// WRONG — forgot to await
const result = chrome.storage.local.get('records')  // result is a Promise, not the data

// CORRECT
const result = await chrome.storage.local.get('records')
const records = result['records'] ?? {}
```

Missing `await` is the most common source of silent bugs in extension code. TypeScript will not catch this for you — `chrome.storage.local.get()` returns `Promise<{[key: string]: any}>`, and assigning a Promise to a variable is valid TypeScript.

---

## 5. `chrome.alarms` — Why It Exists and How to Think About It

In a webpage, you would use `setInterval` to run code every 60 seconds:
```typescript
setInterval(() => updateDisplay(), 60000)  // works fine in a webpage
```

This does not work reliably in a service worker because Chrome may kill the service worker between intervals. When it wakes up again, the interval is gone.

`chrome.alarms` solves this. Alarms are registered with Chrome itself, not with the JavaScript runtime. Even if the service worker is killed and restarted, Chrome will wake it up when the alarm fires:

```typescript
// Create an alarm that fires every minute
// This survives the service worker being killed and restarted
chrome.alarms.create('tick', { periodInMinutes: 1 })

// Listen for it — Chrome wakes up the service worker to run this
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tick') {
    // This fires reliably every minute
  }
})
```

Alarms persist across browser restarts. That's why StudyLens creates alarms in `onInstalled` — they are registered once and survive indefinitely until explicitly cancelled.

---

## 6. Tab Events — The Three You Need

Chrome fires events when things happen in the browser. StudyLens listens to three:

### `chrome.tabs.onActivated`
Fires when the user switches to a different tab.
```typescript
chrome.tabs.onActivated.addListener(async (tabInfo) => {
  // tabInfo only contains tabId and windowId
  // You need to call chrome.tabs.get() to get the URL
  const tab = await chrome.tabs.get(tabInfo.tabId)
  // tab.url is the URL of the newly active tab
})
```

**Important catch:** The `onActivated` callback only gives you the tab ID, not the URL. You must call `chrome.tabs.get()` separately. And `chrome.tabs.get()` can throw — if the user closes the tab between the event firing and your callback running. Always wrap in try/catch.

### `chrome.tabs.onUpdated`
Fires when a tab's content changes — including when a page finishes loading.
```typescript
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // changeInfo.status tells you what changed
  // Only act when status === 'complete' — the page finished loading
  // It also fires for 'loading' and other states you don't care about
  if (changeInfo.status === 'complete' && tab.url) {
    // The user navigated to a new URL in an existing tab
  }
})
```

### `chrome.windows.onFocusChanged`
Fires when the user switches to a different window — or when Chrome loses focus entirely (user switches to another app).
```typescript
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Chrome is no longer the focused application
    // Pause time tracking — don't count time when user isn't in the browser
  }
})
```

---

## 7. `manifest.json` — What Chrome Actually Reads

When you install an extension, Chrome reads `manifest.json` to understand what the extension is and what permissions it needs. It does not read your TypeScript — it reads the compiled `dist/` JavaScript files.

Key fields you need to understand:

```json
{
  "manifest_version": 3,
  // 3 = Manifest V3. This must be 3. Chrome rejects V2 for new submissions.

  "background": {
    "service_worker": "dist/background.js",
    "type": "module"
    // Points Chrome to your compiled background script
    // "type": "module" enables ES Module imports in the service worker
  },

  "action": {
    "default_popup": "src/popup/popup.html"
    // The HTML file that opens when you click the extension icon
    // Note: this points to src/popup/popup.html, not dist/
    // popup.html loads its own compiled popup.js from dist/
  },

  "permissions": ["tabs", "storage", "alarms"],
  // The minimum set. Chrome shows users these permissions at install time.
  // Only request what you actually use.

  "host_permissions": []
  // Empty — we don't need to access specific websites' content
}
```

**Why does `manifest.json` point to `dist/background.js` but `src/popup/popup.html` for the popup?**
Because `background.ts` is compiled to `dist/background.js` by TypeScript. But `popup.html` is not compiled — it's plain HTML. The popup.html file has a `<script>` tag that points to the compiled `dist/popup/popup.js`. Chrome loads the HTML directly, and the HTML loads the compiled script.

---

## 8. How Chrome DevTools Works for Extensions

You are already comfortable with browser DevTools. Extensions add two new contexts:

### Service worker DevTools
```
chrome://extensions → StudyLens card → click "Service Worker" link
```
This opens a separate DevTools window for the service worker context. The Console tab shows all `console.log` output from `background.ts`. The Sources tab lets you inspect the running code. The Application tab is NOT the same as the tab you see in a normal page DevTools — go back to a normal page for storage inspection.

### Storage inspection
```
Open any Chrome tab → DevTools → Application → Storage → Extension Storage → Local Storage
```
Click your extension in the left sidebar. You see the raw contents of `chrome.storage.local` as a tree. You can expand objects, edit values, and add keys directly here. This is your primary debugging tool for checking that storage reads and writes are working correctly.

### Popup DevTools
```
Click the extension icon to open the popup
Right-click inside the popup → Inspect
```
This opens DevTools for the popup page. Console shows output from `popup.ts`. Elements tab shows the DOM. Sources shows the compiled popup.js.

---

## 9. ES Modules in Extensions

You already know ES Modules (`import/export`). In extensions, there is one extra thing to know: you must declare `"type": "module"` in both the service worker entry in `manifest.json` and in `package.json`.

```json
// manifest.json — required for ES module imports in background.ts
"background": { "service_worker": "dist/background.js", "type": "module" }

// package.json — required for tsc to output ES module syntax
"type": "module"
```

Without `"type": "module"` in the manifest, Chrome treats the service worker as CommonJS and `import` statements throw.

---

## 10. The Popup Lifecycle — A Detail That Surprises Everyone

The popup only exists while it is open. When the user closes the popup (clicks away), the entire popup JavaScript context is destroyed. Any variables declared in `popup.ts` are gone.

This means:
- Popup cannot "remember" state between openings — it must re-read from `chrome.storage.local` every time it opens
- Any event listeners attached in `popup.ts` are re-attached fresh every time the popup opens
- There is no need to "clean up" listeners in popup — they die with the popup

This is why `popup.ts` starts by reading storage on every `DOMContentLoaded` — there is no other option.

---

## 11. Debugging the Tick Alarm

The 1-minute alarm is crucial but slow to test manually (you'd wait a minute per test cycle). During development, you can temporarily create a shorter alarm:

```typescript
// Temporary — for testing only, remove before shipping
chrome.alarms.create('tick', { periodInMinutes: 0.1 })  // fires every 6 seconds
```

Then check the service worker console every few seconds for the tick log. Return to `1` minute before Phase 8.

Alternatively, you can trigger the alarm handler manually from the service worker DevTools console:
```javascript
// In the service worker DevTools console:
chrome.alarms.onAlarm.dispatch({ name: 'tick' })
```

---

## 12. What "Load Unpacked" Actually Means

When you click "Load unpacked" and select your `extension/` folder, Chrome:
1. Reads `extension/manifest.json`
2. Registers the service worker from `dist/background.js`
3. Prepares the popup from `src/popup/popup.html`
4. Makes the extension icons and ID available

Chrome does NOT continuously watch your source files. After every `npm run build`, you must click the reload ↺ icon on the extension card in `chrome://extensions` to load the new compiled files.

A common workflow during development:
```bash
npm run watch  # terminal 1 — auto-recompiles on save
# Then after each save: go to chrome://extensions → click ↺ → test
```

---

## 13. Why This Project Uses Pure Functions for Core Logic

`classifier.ts`, `score.ts`, `streak.ts`, and `reflection.ts` are pure functions with no Chrome API imports. This is intentional.

**Testing:** Pure functions can be unit tested with Jest without setting up a Chrome environment. You call the function with input, assert the output. No browser needed.

**Debugging:** When a score calculation is wrong, you know the bug is in `score.ts`. You don't have to wonder if it's an async storage issue, a Chrome API timing problem, or a classification error. Each concern is isolated.

**Reusability:** The same modules get extracted into `@studylens/core` in V2. They work in a Node.js environment, a browser, or a test runner — because they depend on nothing external.

**Reasoning:** A pure function with the same input always produces the same output. You can trace through the logic mentally without running the code.

This architecture pattern is sometimes called "functional core, imperative shell" — the pure logic lives in the core, and the side effects (Chrome API calls, storage writes) are in the shell (`background.ts`, `storage.ts`).