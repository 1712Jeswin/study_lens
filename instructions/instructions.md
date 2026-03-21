# instructions.md — Developer Implementation Guide

> This is the master build document for StudyLens.
> Read it fully before starting. Then execute one phase at a time.
> Never skip a phase. Never combine two phases into one prompt.
> Every phase has a verification checkpoint — pass it before moving forward.
> The agent follows `GEMINI.md` at all times while executing these phases.

---

## 1. What You Are Building

StudyLens is a Chrome extension that:
1. Watches which tabs you have open and for how long
2. Classifies each website into one of four categories: AI tools, coding, study, distraction
3. Calculates an "AI dependency score" — what percentage of your productive time was AI-assisted
4. Shows a clean popup with your daily summary when you click the extension icon
5. Asks a yes/no self-reflection question after 30+ minutes on any AI tool

It is built in three versions. You are starting with V1, the MVP.

---

## 2. How Extensions Work at a High Level

Before you write any code, understand this mental model:

```
Your extension has three separate environments:

1. SERVICE WORKER (background.ts)
   - Runs silently in the background
   - Wakes up when Chrome fires an event (tab switch, alarm tick, etc.)
   - Goes to sleep between events to save memory
   - Has NO access to window, document, or any webpage's content
   - Cannot use localStorage or setInterval reliably
   - This is where your time tracking happens

2. POPUP (popup/popup.ts + popup.html)
   - Opens when the user clicks the extension icon
   - A tiny self-contained webpage (320px wide)
   - Has access to window and document — it IS a webpage
   - Cannot access other webpages' content
   - Reads data from chrome.storage.local and renders it

3. STORAGE (chrome.storage.local)
   - Key-value database inside the browser
   - Shared between the service worker and popup
   - Persists across browser restarts
   - Only your extension can read/write to it
   - This is the only communication channel between the two environments
```

---

## 3. Folder Structure (Complete — V1)

```
studylens/
├── extension/
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts          ← ALL TypeScript interfaces — defined once, used everywhere
│   │   ├── background.ts         ← Service worker: Chrome events, session timing
│   │   ├── classifier.ts         ← Pure function: domain string → category string
│   │   ├── storage.ts            ← All chrome.storage.local reads and writes
│   │   ├── score.ts              ← Pure function: numbers in → DependencyScore out
│   │   ├── streak.ts             ← Pure function: dates in → StreakData out
│   │   ├── reflection.ts         ← Pure function: session → reflection entry
│   │   └── popup/
│   │       ├── popup.html        ← Popup markup, no inline scripts or styles
│   │       ├── popup.ts          ← Reads storage, renders UI, handles button clicks
│   │       └── popup.css         ← All popup styles with CSS custom properties
│   ├── assets/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── manifest.json             ← Manifest V3 declaration — what Chrome reads
│   ├── tsconfig.json             ← TypeScript config (strict: true)
│   └── package.json              ← Build scripts and dev dependencies
├── docs/
│   └── INSTALL.md
├── instructions/
│   ├── GEMINI.md                 ← Agent operating rules
│   ├── instructions.md           ← This file
│   ├── runflow.md                ← How to operate the agent session by session
│   ├── security.md               ← Privacy and security rules
│   └── TUTOR.md                  ← Plain-language explanation of every concept
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── README.md
├── CONTRIBUTING.md
├── .gitignore
├── .eslintrc.json
└── .prettierrc
```

**Three placement rules to memorise:**
- Types → `src/types/index.ts` only. Never inline.
- Chrome API calls → `background.ts` and `storage.ts` only. Nowhere else.
- Business logic (scoring, classification) → their own pure modules. Never in background or popup.

---

## 4. Implementation Phases

---

# ════════════════════════════════════════════
# VERSION 1 — MVP EXTENSION
# Goal: A working, published Chrome extension
# Realistic timeline: 4–6 weeks at 2–3 hours/day
# ════════════════════════════════════════════

---

## Phase 1 — Project Scaffold and Extension Shell

**What this phase delivers:** A loadable extension that appears in Chrome's toolbar with a clickable popup showing a heading. No tracking yet — just proof the structure works.

**Why this phase matters:** Many beginners skip scaffold and go straight to logic. Then they spend days debugging because the extension structure was wrong from the start. This phase proves the plumbing works before the logic is added.

### Files to generate in this phase:

#### `extension/package.json`
- `"name": "studylens"`, `"version": "1.0.0"`, `"private": true`
- `"type": "module"` — ES Modules only throughout this project
- Dev dependencies only: `typescript`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`
- Scripts: `"build": "tsc"`, `"watch": "tsc --watch"`, `"lint": "eslint src --ext .ts"`, `"format": "prettier --write src/**/*.ts"`, `"clean": "rm -rf dist"`
- Zero runtime dependencies — extension uses only native browser APIs

#### `extension/tsconfig.json`
- `"target": "ES2020"` — supported by all modern Chromium browsers
- `"module": "ES2020"`, `"moduleResolution": "node"`
- `"strict": true` — enables all strict checks, no exceptions
- `"noImplicitAny": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`
- `"outDir": "./dist"`, `"rootDir": "./src"`
- `"include": ["src/**/*.ts"]`

#### `extension/manifest.json`
- `"manifest_version": 3` — never 2
- `"name": "StudyLens"`, `"version": "1.0.0"`, `"description": "Track how you study. Know your AI dependency."`
- `"background": { "service_worker": "dist/background.js", "type": "module" }`
- `"action": { "default_popup": "src/popup/popup.html", "default_icon": { "16": "assets/icon16.png", "48": "assets/icon48.png", "128": "assets/icon128.png" } }`
- `"permissions": ["tabs", "storage", "alarms"]`
- `"host_permissions": []`
- `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'none';" }`
- `"icons": { "16": "assets/icon16.png", "48": "assets/icon48.png", "128": "assets/icon128.png" }`

#### `extension/src/types/index.ts`
Generate the complete TypeScript interfaces exactly as defined in `GEMINI.md`:
- `SiteCategory` type union
- `DailyRecord` interface
- `ReflectionEntry` interface
- `StreakData` interface
- `StorageSchema` interface
- `DependencyScore` interface
- `ActiveSession` interface
Export all. No logic in this file — interfaces and types only.

#### `extension/src/background.ts` (placeholder)
- One-line responsibility comment at top
- `chrome.runtime.onInstalled` listener that logs `"[StudyLens] Extension installed"` to console
- Import `ActiveSession` from types (to confirm import chain works)
- Nothing else — no tracking logic yet

#### `extension/src/popup/popup.html` (placeholder)
- Valid HTML5 doctype and structure
- Link to `popup.css` in `<head>`
- Single `<h1 id="title">StudyLens</h1>` in `<body>`
- Script tag at bottom of body: `<script src="popup.js" type="module"></script>`
- No inline styles, no inline scripts (CSP will block them)

#### `extension/src/popup/popup.css` (placeholder)
- CSS custom properties on `:root`:
  - `--color-green: #1D9E75`, `--color-amber: #BA7517`, `--color-red: #E24B4A`
  - `--color-text: #1a1a1a`, `--color-muted: #666`, `--color-bg: #ffffff`, `--color-surface: #f5f5f5`
  - `--font-size-base: 14px`, `--space-sm: 8px`, `--space-md: 16px`, `--radius: 8px`
- `body { width: 320px; min-height: 400px; margin: 0; font-family: system-ui, sans-serif; }`
- Nothing else yet

#### `extension/src/popup/popup.ts` (placeholder)
- One-line responsibility comment at top
- `document.addEventListener('DOMContentLoaded', () => { console.log('[StudyLens] Popup loaded') })`
- No Chrome API calls yet

#### `.eslintrc.json`
- Parser: `@typescript-eslint/parser`
- Plugin: `@typescript-eslint`
- Rules: `"@typescript-eslint/no-explicit-any": "error"`, `"no-var": "error"`, `"prefer-const": "error"`, `"@typescript-eslint/no-unused-vars": "error"`

#### `.prettierrc`
- `"singleQuote": true`, `"semi": false`, `"tabWidth": 2`, `"trailingComma": "es5"`, `"printWidth": 100`

#### `.gitignore`
- `node_modules/`, `dist/`, `*.log`, `.DS_Store`, `*.zip`

---

### ✅ Phase 1 Verification Checkpoint

Run these checks yourself. Do not proceed until all pass.

```
STEP 1 — Build check:
  cd extension && npm install && npm run build
  Expected: "Found 0 errors. Watching for file changes."
  If you used "npm run build" (not watch): exits with code 0, no error lines

STEP 2 — Load in Chrome:
  Open chrome://extensions in Chrome
  Toggle "Developer mode" ON (top-right switch)
  Click "Load unpacked"
  Select the extension/ folder (the one containing manifest.json)
  Expected: "StudyLens" card appears with version 1.0.0
  Expected: No red error banner on the card

STEP 3 — Popup check:
  Click the StudyLens icon in the Chrome toolbar
  Expected: Small popup opens showing "StudyLens" heading
  Expected: No errors in the popup (right-click popup → Inspect → Console tab)

STEP 4 — Service worker check:
  On the chrome://extensions card, click "Service Worker" link
  Expected: DevTools opens on the service worker
  Expected: Console shows "[StudyLens] Extension installed"
  (This only appears after first install — if you already installed it, click the reload ↺ icon first)

STEP 5 — Git snapshot:
  git add . && git commit -m "phase-1: scaffold, manifest, types, placeholder files"
  git push origin main
```

**Do NOT start Phase 2 until all 5 steps above pass.**

---

## Phase 2 — Classifier Module

**What this phase delivers:** The complete site classification system as a pure, self-contained TypeScript module with no Chrome dependencies.

**Why pure functions first:** Building the classifier before the background script means you can verify the classification logic is correct before wiring it into the Chrome event system. Pure functions are much easier to reason about.

### Files to generate in this phase:

#### `extension/src/classifier.ts`
Generate with these exact requirements:
- One-line responsibility comment at top: `// classifier.ts — Maps website domains to study categories. Pure functions, no side effects, no Chrome APIs.`
- Import only `SiteCategory` from `../types/index`
- Export `SITE_LISTS` constant exactly as defined in `GEMINI.md` — do not abbreviate or trim the list
- Export `extractDomain(url: string): string | null`
  - Wrap `new URL(url)` in try/catch — malformed URLs throw
  - Strip `www.` prefix from hostname
  - Return `null` for any URL that throws (chrome://, about:blank, data:, etc.)
  - JSDoc required
- Export `isTrackableUrl(url: string): boolean`
  - Returns `false` for: null domain, `chrome` protocol, `about` protocol, `localhost` or `127.0.0.1`, `chrome-extension` protocol
  - Returns `true` for everything else
  - JSDoc required
- Export `classifySite(url: string): SiteCategory`
  - Call `isTrackableUrl` first — return `'uncategorized'` if false
  - Call `extractDomain` — return `'uncategorized'` if null
  - Check domain against each list in order: ai → coding → study → distraction
  - Return `'uncategorized'` if no match
  - JSDoc required
- Export `isProductiveCategory(category: SiteCategory): boolean`
  - Returns true for `'ai'`, `'coding'`, `'study'` — false for `'distraction'` and `'uncategorized'`
  - JSDoc required
- Zero `chrome.*` imports in this file — verified by grep

---

### ✅ Phase 2 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Manual classification trace (paste these into the service worker console after build):
  Temporarily import classifySite in background.ts and log results:
    console.log(classifySite('https://chatgpt.com/chat'))       // expected: 'ai'
    console.log(classifySite('https://www.leetcode.com/problems/')) // expected: 'coding'
    console.log(classifySite('https://coursera.org/learn'))     // expected: 'study'
    console.log(classifySite('https://instagram.com'))          // expected: 'distraction'
    console.log(classifySite('https://unknownsite.xyz'))        // expected: 'uncategorized'
    console.log(classifySite('chrome://extensions'))            // expected: 'uncategorized'
    console.log(classifySite('not a url at all'))               // expected: 'uncategorized'
  Remove the temporary logs from background.ts after verifying

STEP 3 — Chrome API grep (must return no results):
  grep -r "chrome\." extension/src/classifier.ts
  Expected: no output (classifier must have zero Chrome API usage)

STEP 4 — Git snapshot:
  git add . && git commit -m "phase-2: classifier with full site lists and pure functions"
  git push origin main
```

---

## Phase 3 — Storage Module

**What this phase delivers:** A complete storage abstraction layer. Every read and write to `chrome.storage.local` in the entire project goes through this one file.

**Why centralise storage:** If storage is called from multiple places, one wrong key name or missing default breaks data silently and is very hard to debug. One file, one source of truth.

### Files to generate in this phase:

#### `extension/src/storage.ts`
Generate with these exact requirements:
- One-line responsibility comment at top
- Import all necessary types from `../types/index`
- No imports from `classifier.ts`, `score.ts`, or any other module — storage is a leaf node

**Default constants (exported):**
```typescript
export const DEFAULT_DAILY_RECORD: DailyRecord  // all seconds: 0, date: today's ISO string
export const DEFAULT_STREAK: StreakData          // currentStreak: 0, longestStreak: 0, lastActiveDate: ''
export const DEFAULT_STORAGE: StorageSchema      // records: {}, streak: DEFAULT_STREAK,
                                                 // pendingReflection: null, reflectionHistory: [], installedAt: 0
```

**Exported functions (all async, all with JSDoc, all with try/catch):**
- `initializeStorage(): Promise<void>` — called on install. Writes defaults for any key that does not already exist (do not overwrite existing data)
- `getStorageData(): Promise<StorageSchema>` — reads entire storage, merges with `DEFAULT_STORAGE` so no field is ever undefined or null
- `getTodayRecord(): Promise<DailyRecord>` — gets today's ISO date, reads from `records`, returns `DEFAULT_DAILY_RECORD` if not found
- `updateTodayRecord(category: SiteCategory, secondsToAdd: number): Promise<void>` — reads current today record, adds seconds to the correct field, writes back. Must be atomic: read → modify → write in one async function
- `getStreak(): Promise<StreakData>` — returns streak or `DEFAULT_STREAK`
- `updateStreak(streak: StreakData): Promise<void>` — writes updated streak
- `getPendingReflection(): Promise<ReflectionEntry | null>` — returns pending reflection or null
- `setPendingReflection(entry: ReflectionEntry | null): Promise<void>` — sets or clears pending reflection
- `addReflectionToHistory(entry: ReflectionEntry): Promise<void>` — reads history array, appends new entry, caps at 100 entries (drop oldest), writes back
- `getAllRecords(): Promise<Record<string, DailyRecord>>` — returns the full records object keyed by date (used by dashboard in V2)
- `clearAllData(): Promise<void>` — clears everything (used by reset button in V2 settings)

**Helper (not exported):**
- `getTodayISO(): string` — returns `new Date().toISOString().slice(0, 10)` — the "YYYY-MM-DD" format

---

### ✅ Phase 3 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Storage round-trip test:
  In background.ts, temporarily add after onInstalled:
    await initializeStorage()
    const record = await getTodayRecord()
    console.log('[TEST] Today record:', record)
    await updateTodayRecord('ai', 300)
    const updated = await getTodayRecord()
    console.log('[TEST] After adding 300s AI:', updated.ai) // expected: 300
  Reload extension, check service worker console for correct output
  Remove test code from background.ts after verifying

STEP 3 — DevTools storage check:
  Open any Chrome tab → DevTools → Application → Storage → Extension Storage
  Select your extension → check chrome.storage.local
  Expected: records object with today's date key, streak object, installedAt timestamp

STEP 4 — No business logic grep:
  grep -n "score\|classify\|streak" extension/src/storage.ts
  Expected: no results (storage has no classification or scoring logic)

STEP 5 — Git snapshot:
  git add . && git commit -m "phase-3: storage module with full CRUD and defaults"
  git push origin main
```

---

## Phase 4 — Score and Streak Modules

**What this phase delivers:** Two pure calculation modules that take data as input and return computed values. Zero side effects, zero Chrome dependency.

### Files to generate in this phase:

#### `extension/src/score.ts`
- One-line responsibility comment at top
- Import `DailyRecord`, `DependencyScore` from types
- `calculateDependencyScore(record: DailyRecord): DependencyScore`
  - Implement the formula and bands from `GEMINI.md`
  - Division-by-zero guard required (see mandatory patterns in `GEMINI.md`)
  - JSDoc required
- `formatSeconds(seconds: number): string`
  - 0 → `"0m"`, 45 → `"45s"`, 90 → `"1m 30s"`, 3600 → `"1h"`, 3690 → `"1h 1m 30s"`
  - JSDoc required
- `getScoreColour(label: DependencyScore['label']): string`
  - Returns hex colour strings from GEMINI.md
  - JSDoc required
- Zero `chrome.*` imports — grep verified

#### `extension/src/streak.ts`
- One-line responsibility comment at top
- Import `StreakData` from types
- `getTodayISO(): string` — `"YYYY-MM-DD"` format
- `getYesterdayISO(): string` — yesterday in same format
- `calculateStreak(current: StreakData, todayQualifies: boolean): StreakData`
  - If `lastActiveDate` is already today → return current unchanged (already counted today)
  - If `lastActiveDate` is yesterday AND `todayQualifies` → increment streak, update date, update longestStreak if beaten
  - If `lastActiveDate` is older than yesterday → reset currentStreak to 1 if `todayQualifies`, else 0
  - Never mutate the input — always return a new object
  - JSDoc required
- `streakQualifies(record: DailyRecord): boolean`
  - Returns true if `coding + study >= 1800` (30 minutes of real practice) — not just any activity
  - JSDoc required
- `formatStreak(streak: StreakData): string`
  - 0 → `"Start your streak today"`, 1 → `"1-day streak"`, 7 → `"7-day streak 🔥"` (flame only for 3+)
  - JSDoc required
- Zero `chrome.*` imports — grep verified

---

### ✅ Phase 4 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Score formula trace:
  Temporarily log in background.ts:
    import { calculateDependencyScore } from './score'
    const testRecord = { date: '2026-03-21', ai: 3600, coding: 3600, study: 1800, distraction: 0, uncategorized: 0 }
    console.log(calculateDependencyScore(testRecord))
    // expected: { score: 50, label: 'moderate', aiSeconds: 3600, productiveSeconds: 9000 }
    const zeroRecord = { date: '2026-03-21', ai: 0, coding: 0, study: 0, distraction: 0, uncategorized: 0 }
    console.log(calculateDependencyScore(zeroRecord))
    // expected: { score: 0, label: 'healthy', aiSeconds: 0, productiveSeconds: 0 }
  Remove after verifying

STEP 3 — Streak trace:
    import { calculateStreak, getYesterdayISO } from './streak'
    const streak = { currentStreak: 5, longestStreak: 10, lastActiveDate: getYesterdayISO() }
    console.log(calculateStreak(streak, true))
    // expected: { currentStreak: 6, longestStreak: 10, lastActiveDate: todayISO }

STEP 4 — Chrome API grep (both files):
  grep -r "chrome\." extension/src/score.ts extension/src/streak.ts
  Expected: no output

STEP 5 — Git snapshot:
  git add . && git commit -m "phase-4: score and streak pure calculation modules"
  git push origin main
```

---

## Phase 5 — Reflection Module

**What this phase delivers:** The self-reflection prompt logic — the feature that makes the dependency score more honest than URL time alone.

### Files to generate in this phase:

#### `extension/src/reflection.ts`
- One-line responsibility comment at top
- Import `ReflectionEntry`, `ActiveSession` from types
- `REFLECTION_THRESHOLD_SECONDS: number = 1800` — exported constant (30 minutes). Makes it easy to change later.
- `shouldTriggerReflection(session: ActiveSession & { durationSeconds: number }): boolean`
  - Returns true only if: category is `'ai'` AND durationSeconds >= `REFLECTION_THRESHOLD_SECONDS`
  - JSDoc required
- `createReflectionEntry(session: ActiveSession, durationSeconds: number): ReflectionEntry`
  - `sessionId`: `\`${session.domain}-${session.startTime}\``
  - `solvedByAI`: `null` (awaiting answer)
  - `timestamp`: `Date.now()`
  - JSDoc required
- `resolveReflection(entry: ReflectionEntry, solvedByAI: boolean): ReflectionEntry`
  - Returns NEW object with `solvedByAI` set — never mutates input
  - JSDoc required
- `getReflectionMessage(domain: string, durationSeconds: number): string`
  - Returns: `\`You spent ${formatMinutes(durationSeconds)} on ${domain}. Did AI solve the problem for you, or were you using it as a reference?\``
  - Include `formatMinutes` as a private helper: `Math.round(seconds / 60)` with `"min"` suffix
  - JSDoc required
- Zero `chrome.*` imports

---

### ✅ Phase 5 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Logic trace:
  shouldTriggerReflection({ category: 'ai', durationSeconds: 1799, ... }) → false
  shouldTriggerReflection({ category: 'ai', durationSeconds: 1800, ... }) → true
  shouldTriggerReflection({ category: 'coding', durationSeconds: 3600, ... }) → false

STEP 3 — Chrome API grep:
  grep -r "chrome\." extension/src/reflection.ts → no output

STEP 4 — Git snapshot:
  git add . && git commit -m "phase-5: reflection prompt logic module"
  git push origin main
```

---

## Phase 6 — Background Service Worker (Core Engine)

**What this phase delivers:** The complete background service worker — the engine that tracks all tab activity silently and writes data to storage.

**This is the most complex phase.** Take it slowly. Build each section, reload, verify the console, then continue.

### Files to generate in this phase:

#### `extension/src/background.ts` (full implementation)
- One-line responsibility comment at top
- `// background.ts — Service worker: listens to Chrome events, tracks active tab time, writes to storage.`
- `// IMPORTANT: This file runs in a service worker. No window, no document, no localStorage.`

**Imports:**
```typescript
import type { ActiveSession } from './types/index'
import { classifySite, isTrackableUrl, extractDomain } from './classifier'
import { initializeStorage, updateTodayRecord, getStreak, updateStreak, setPendingReflection } from './storage'
import { calculateStreak, streakQualifies, getTodayRecord as getTodayStreakRecord } from './streak'
import { shouldTriggerReflection, createReflectionEntry } from './reflection'
```

Wait — `getTodayRecord` is in storage, not streak. The streak module's `streakQualifies` takes a `DailyRecord`. Import `getTodayRecord` from `./storage`.

**Module-level state:**
```typescript
// The currently active tab being timed. null when no trackable tab is active.
let activeSession: ActiveSession | null = null
```

**`chrome.runtime.onInstalled` listener:**
- Call `await initializeStorage()`
- Create alarm `"tick"` with `{ periodInMinutes: 1 }`
- Calculate next midnight timestamp, create alarm `"dailyReset"` with `{ when: nextMidnight }`
- Log `"[StudyLens] Extension installed and alarms created"`
- Explain midnight calculation with a comment: `const now = new Date(); const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);`

**`chrome.tabs.onActivated` listener:**
- `chrome.tabs.get(tabInfo.tabId)` in try/catch (tab may close before callback fires)
- If `tab.url` exists: call `await handleTabChange(tab.url, tab.id)`

**`chrome.tabs.onUpdated` listener:**
- Only act when `changeInfo.status === 'complete'` AND `tab.url` is defined
- Only act when `tab.id === activeSession?.tabId` (same tab navigated to a new URL)
- Call `await handleTabChange(tab.url, tab.id)`

**`chrome.windows.onFocusChanged` listener:**
- If `windowId === chrome.windows.WINDOW_ID_NONE` (browser lost focus / minimised):
  - Finalise current session if active: `await finaliseSession(activeSession)`
  - Set `activeSession = null`
- Otherwise: get the active tab in the focused window and call `handleTabChange`

**`handleTabChange(url: string, tabId: number): Promise<void>`:**
- If `activeSession` is not null: `await finaliseSession(activeSession)`
- If `!isTrackableUrl(url)`: set `activeSession = null`, return
- Set `activeSession = { domain: extractDomain(url)!, category: classifySite(url), startTime: Date.now(), tabId }`
- Log `"[StudyLens] Tracking: ${activeSession.domain} (${activeSession.category})"`

**`finaliseSession(session: ActiveSession): Promise<void>`:**
- `const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000)`
- If `durationSeconds < 5`: return (ignore accidental brief visits — tab switch bounces)
- `await updateTodayRecord(session.category, durationSeconds)`
- If `shouldTriggerReflection({ ...session, durationSeconds })`:
  - `const entry = createReflectionEntry(session, durationSeconds)`
  - `await setPendingReflection(entry)`
  - `chrome.alarms.create('reflectionCheck', { delayInMinutes: 5 })`
- Update streak: get today's full record, check `streakQualifies`, get current streak, calculate new streak, save
- Log `"[StudyLens] Finalised: ${session.domain} — ${durationSeconds}s (${session.category})"`

**`chrome.alarms.onAlarm` listener:**
- If `alarm.name === 'tick'`:
  - If `activeSession` is null: return
  - Calculate elapsed seconds since `activeSession.startTime`
  - Call `await updateTodayRecord(activeSession.category, elapsed)`
  - Reset `activeSession.startTime = Date.now()` (rolling window — avoids double-counting)
  - Log `"[StudyLens] Tick: saved ${elapsed}s for ${activeSession.domain}"`
- If `alarm.name === 'dailyReset'`:
  - Finalise current session
  - Re-create the alarm for next midnight
  - Log `"[StudyLens] Daily reset complete"`
- If `alarm.name === 'reflectionCheck'`:
  - Log `"[StudyLens] Reflection check — popup will show prompt on next open"`
  - (Popup reads `pendingReflection` on every open — no extra action needed here)

**Error handling:** Every async function must have try/catch. Errors logged with `console.error('[StudyLens background]', error)`. Service worker must never crash silently.

---

### ✅ Phase 6 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Load and verify basic tracking:
  Reload extension in chrome://extensions (click ↺ icon)
  Open service worker DevTools (click "Service Worker" link)
  Open a new tab, navigate to chatgpt.com
  Expected console: "[StudyLens] Tracking: chatgpt.com (ai)"
  Wait 10 seconds, navigate to leetcode.com
  Expected console: "[StudyLens] Finalised: chatgpt.com — ~10s (ai)"
  Expected console: "[StudyLens] Tracking: leetcode.com (coding)"

STEP 3 — Storage verification:
  Open DevTools on any tab → Application → Extension Storage
  Expected: records["today's date"].ai contains a value > 0

STEP 4 — Alarm tick verification:
  Keep leetcode.com active for 2+ minutes
  Expected every 60 seconds: "[StudyLens] Tick: saved ~60s for leetcode.com"
  Expected: coding seconds in storage increase each minute

STEP 5 — Non-trackable URL test:
  Navigate to chrome://extensions
  Expected: "[StudyLens] Tracking:" does NOT appear (chrome:// URLs are skipped)
  Expected: previous session is finalised

STEP 6 — Git snapshot:
  git add . && git commit -m "phase-6: background service worker full tracking engine"
  git push origin main
```

---

## Phase 7 — Popup UI

**What this phase delivers:** The complete user-facing popup. The student clicks the extension icon and sees their full daily summary.

### Files to generate in this phase:

#### `extension/src/popup/popup.css` (full implementation)
- All CSS custom properties already defined in Phase 1 — extend as needed
- Popup fixed at `width: 320px`, `min-height: 400px` (Chrome popup size constraints — do not exceed 800px)
- Layout: vertical flex column, top to bottom: reflection card → score section → breakdown section → streak section → footer
- **Reflection card** (`#reflection-prompt`): visible only when pending reflection exists. Amber left border (`4px solid var(--color-amber)`), two full-width buttons: `#btn-yes` and `#btn-no`
- **Score section**: large centred score number `#score-value` (48px), label below `#score-label`, colour class `.score-healthy`, `.score-moderate`, `.score-high` applied by JS
- **Breakdown bars** (`#breakdown-section`): four rows (AI, Coding, Study, Distraction). Each row: label left, time right, thin coloured progress bar below. Bar widths set by JS via `style.width`
- **Streak** (`#streak-section`): `#streak-count` and `#streak-label` text
- **Footer**: `#footer-version` showing version string
- No gradients, no box shadows — flat design. Must look clean at exactly 320px wide.
- Loading state: `#loading` element visible by default, hidden after data loads. All sections hidden by default, revealed by JS after load.

#### `extension/src/popup/popup.html` (full implementation)
- All IDs must match exactly what `popup.ts` will query — document them
- Semantic HTML: `<main>`, `<section>`, `<footer>` — no `<div>` soup
- Structure:
```html
<div id="loading">Loading...</div>
<section id="reflection-prompt" hidden>
  <p id="reflection-message"></p>
  <button id="btn-yes">Yes, AI solved it</button>
  <button id="btn-no">No, I used it as reference</button>
</section>
<section id="score-section" hidden>
  <div id="score-value">0</div>
  <div id="score-label">Loading...</div>
  <div id="score-desc"></div>
</section>
<section id="breakdown-section" hidden>
  <!-- four category rows generated by JS -->
</section>
<section id="streak-section" hidden>
  <div id="streak-count">0</div>
  <div id="streak-label"></div>
</section>
<footer>
  <span id="footer-version"></span>
</footer>
```

#### `extension/src/popup/popup.ts` (full implementation)
- One-line responsibility comment at top
- Import all needed functions from `../storage`, `../score`, `../streak`, `../reflection`
- Import types from `../types/index`
- Entry point: `document.addEventListener('DOMContentLoaded', () => { renderPopup().catch(showError) })`
- `renderPopup(): Promise<void>`:
  - Read in parallel: `const [record, streakData, pending] = await Promise.all([getTodayRecord(), getStreak(), getPendingReflection()])`
  - Calculate: `const score = calculateDependencyScore(record)`
  - Call: `renderReflectionPrompt(pending)`, `renderScore(score)`, `renderBreakdown(record)`, `renderStreak(streakData)`
  - Hide `#loading`, show all sections (remove `hidden` attribute)
- `renderScore(score: DependencyScore): void` — sets `#score-value`, `#score-label`, applies colour class to `#score-section`
- `renderBreakdown(record: DailyRecord): void` — renders four bars. For each category, total productive time is the denominator for bar width percentage.
- `renderStreak(streak: StreakData): void` — sets `#streak-count` and `#streak-label` using `formatStreak()`
- `renderReflectionPrompt(entry: ReflectionEntry | null): void` — shows/hides `#reflection-prompt`, sets `#reflection-message` text using `getReflectionMessage()`
- Button listeners: `#btn-yes` and `#btn-no` call `handleReflection(true/false)`
- `handleReflection(solvedByAI: boolean): Promise<void>`:
  - Get pending, resolve it with `resolveReflection()`, add to history, clear pending, re-render
- `showError(error: unknown): void` — displays error message in popup instead of crashing silently. Shows `"Something went wrong. Try reloading."` in `#loading` div.
- All `document.getElementById()` calls must check for null before use

---

### ✅ Phase 7 Verification Checkpoint

```
STEP 1 — Build check:
  npm run build → zero errors

STEP 2 — Fresh state test:
  Open DevTools → Application → Extension Storage → clear chrome.storage.local
  Reload extension. Click popup.
  Expected: all values show 0. Score shows 0% — healthy. No reflection prompt visible.

STEP 3 — Real data test:
  Navigate to chatgpt.com, stay 2 minutes, switch away
  Click popup icon
  Expected: AI bar shows ~2m. Score shows a non-zero value.
  Expected: Score label matches the band (healthy/moderate/high)

STEP 4 — Reflection prompt test:
  In DevTools Extension Storage, manually set pendingReflection:
    {
      "sessionId": "chatgpt.com-1742550000000",
      "domain": "chatgpt.com",
      "durationSeconds": 2000,
      "solvedByAI": null,
      "timestamp": 1742550000000
    }
  Click popup.
  Expected: reflection card appears at top with message and two buttons.
  Click "Yes, AI solved it."
  Expected: card disappears, data updates.
  Check storage: pendingReflection should be null, reflectionHistory should have one entry with solvedByAI: true.

STEP 5 — Width test:
  Right-click popup → Inspect → in DevTools, verify popup element is exactly 320px wide
  No horizontal scrollbar should appear

STEP 6 — Git snapshot:
  git add . && git commit -m "phase-7: popup UI full implementation"
  git push origin main
```

---

## Phase 8 — Polish, Assets, and Publishing

**What this phase delivers:** Everything needed to submit to the Chrome Web Store and go live.

### 8.1 — Extension icons
Create or source three PNG icons: 16×16, 48×48, 128×128 pixels.
- Place in `extension/assets/`
- Design: simple, readable at 16px. Suggestion: a lens/magnifier shape or "SL" monogram on a solid background
- Free tool: figma.com or favicon.io for quick generation

### 8.2 — `docs/INSTALL.md`
Write step-by-step developer install guide:
- Clone repo, cd to `extension/`, `npm install`, `npm run build`
- chrome://extensions → Developer mode → Load unpacked → select `extension/`
- How to see the service worker console
- How to inspect storage in DevTools
- How to reload after code changes
- Screenshots or ASCII diagrams of each step

### 8.3 — `README.md`
Write the public GitHub README (see separate README.md file).

### 8.4 — `CONTRIBUTING.md`
Write contributor guide focused on the most common contribution:
- How to add a new site to the classifier (edit `GEMINI.md` first, then `classifier.ts`, submit PR)
- Code style requirements: TypeScript strict, ESLint zero errors, Prettier formatted
- How to run a build locally
- Description of the issue templates

### 8.5 — Chrome Web Store submission prep
- Run `npm run build` one final time — must be zero errors
- Create a zip of the extension: include `dist/`, `assets/`, `manifest.json` — exclude `src/`, `node_modules/`, `tsconfig.json`, `package.json`
- Verify zip is under 10MB
- Write store listing:
  - Short description (max 132 chars): `"Track your study time and AI dependency. Know exactly how much you practice vs how much you outsource to AI."`
  - Detailed description: expand from README
  - Privacy practices: select "Does not collect or use data" — because all data is local
- Screenshots: minimum 1 at 1280×800. Capture the popup with real data showing.

### 8.6 — Final V1 pre-publish checklist
```
□ npm run build → zero errors
□ npm run lint → zero errors
□ Popup renders correctly in Chrome
□ Popup renders correctly in Edge (download if needed)
□ Popup renders correctly in Brave (download if needed)
□ Time tracking works correctly after 60 seconds of active use
□ Score updates correctly after switching between AI and coding tabs
□ Reflection prompt appears after manually setting pendingReflection
□ Streak increments (test by setting lastActiveDate to yesterday in DevTools storage)
□ No TypeScript any types: grep -rn ": any" extension/src/ → no results
□ No var declarations: grep -rn "\bvar\b" extension/src/ → no results
□ No inline scripts in HTML files
□ No external fetch calls: grep -rn "fetch\|XMLHttpRequest" extension/src/ → no results
□ Manifest permissions unchanged from Phase 1
□ Icons exist at all three sizes
□ README.md complete and accurate
□ INSTALL.md complete
□ CONTRIBUTING.md complete
□ .gitignore present and correct
□ Final commit pushed to GitHub
□ GitHub repository is public
□ Chrome Web Store developer account created ($5 fee)
□ Store listing submitted
```

**Git snapshot:**
```bash
git add . && git commit -m "phase-8: assets, docs, publishing prep — V1 complete"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

---

# ════════════════════════════════════════════
# VERSION 2 — DASHBOARD + PLANNER + REPORTS
# Build only after V1 is published and you have real user feedback
# Do not start any phase below until the V1 → V2 gate is passed (see runflow.md)
# ════════════════════════════════════════════

---

## Phase 9 — npm Core Package (`@studylens/core`)

**Goal:** Extract the four pure modules into a public npm package so other developers can build tools using the same classifier and scoring logic.

### 9.1 — Create `core/` package alongside `extension/`
- New folder: `studylens/core/`
- Copy `classifier.ts`, `score.ts`, `streak.ts`, `reflection.ts`, and `types/index.ts` into `core/src/`
- Create `core/package.json` with `"name": "@studylens/core"`, `"version": "1.0.0"`, `"main": "dist/index.js"`, proper `"exports"` config
- Create `core/src/index.ts` that re-exports everything from all four modules
- Build: `tsc` → `core/dist/`
- Publish: `npm publish --access public`

### 9.2 — Update extension to import from package
- `npm install @studylens/core` in `extension/`
- Update all imports in `background.ts`, `storage.ts`, `popup.ts` to import from `@studylens/core`
- Remove the local module files now covered by the package
- Verify: `npm run build` in extension → zero errors

**Phase 9 verification:** `npm install @studylens/core` in a blank folder and confirm the package resolves. All V1 features still work after the import switch.

---

## Phase 10 — Dashboard Web App

**Goal:** A full-page React dashboard that the extension opens in a new tab — richer than the popup allows.

### 10.1 — Create `dashboard/` app
- `studylens/dashboard/` — Vite + React + TypeScript
- `npm install @studylens/core` — uses same logic as extension
- Data bridge: popup opens dashboard as `chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })`. Dashboard reads from `chrome.storage.local` directly (it's part of the extension)

### 10.2 — Four pages
- **Today** — mirrors popup but full-width. Score gauge, full category bars with exact times, reflection history (last 7 days)
- **Weekly** — 7-day bar chart per category (Chart.js), average weekly score, "best day" highlight
- **History** — paginated list of all daily records, export to CSV button
- **Settings** — custom site addition form, data reset button with confirmation, version display

### 10.3 — Extension popup link
- Add `<a>` in popup footer: `"Open full dashboard →"` opens dashboard tab

**Phase 10 verification:** Dashboard opens from popup. All four pages render with real storage data. CSV export downloads a valid file.

---

## Phase 11 — Study Planner

**Goal:** Let students set daily time goals and track progress toward them.

### 11.1 — Planner data model
- Add `PlannerGoals` interface: `{ coding: number, study: number }` (minutes per day)
- Add `goals` to `StorageSchema` — default: `{ coding: 120, study: 120 }`
- Add `getGoals()` and `setGoals()` to `storage.ts`

### 11.2 — UI in dashboard Settings page
- Sliders for coding and study daily goals
- Saved on change

### 11.3 — Progress display in popup and dashboard Today page
- Below each category bar: `"Coding: 45m / 2h goal"` with percentage fill
- Green when on track (≥80%), amber when behind (50–79%), red when far behind (<50%)

**Phase 11 verification:** Set coding goal to 60 min. Code for 30 min. Popup shows 50% progress. Goal persists after browser restart.

---

## Phase 12 — Detox Mode

**Goal:** Block distraction sites during a self-chosen focus window.

### 12.1 — DetoxSession data model
- `DetoxSession` interface: `{ active: boolean, endTime: number, blockedCategories: SiteCategory[] }`
- Add to `StorageSchema`

### 12.2 — Background enforcement
- In `handleTabChange`, check if detox is active and the new tab's category is blocked
- If blocked: `chrome.tabs.update(tabId, { url: chrome.runtime.getURL('src/popup/detox.html') })`
- Create `src/popup/detox.html` — simple page saying "Focus mode active. Back in X minutes."

### 12.3 — Detox controls in popup
- "Start 25-min focus" button
- Countdown timer during active session
- Cancel button with confirmation

**Phase 12 verification:** Start 5-min detox. Visit instagram.com → redirected. Visit leetcode.com → loads. After 5 min, instagram loads normally.

---

## Phase 13 — Enhanced Streak and Weekly Report

**Goal:** Strengthen the habit loop and add a weekly summary.

### 13.1 — Streak display improvements
- Separate "study streak" (coding + study ≥ 30 min/day) from any-activity streak
- Flame indicator using CSS triangles (no emoji dependency)
- `longestStreak` displayed alongside current

### 13.2 — Weekly review
- Every Sunday at 20:00, `chrome.alarms` fires `"weeklyReport"` alarm
- Popup shows special weekly view: total hours per category, avg score, best day
- "Share" button generates copyable text summary

**Phase 13 verification:** Weekly totals are correct. Share text is grammatically correct and accurately reflects the week's data.

---

# ════════════════════════════════════════════
# VERSION 3 — CLOUD SYNC + PROFILES + BACKEND
# Build only after V2 gate is passed (see runflow.md)
# A separate GEMINI.md for the backend will be created at this point
# ════════════════════════════════════════════

---

## Phase 14 — Backend API (Node.js + Supabase)

**Goal:** A minimal backend enabling optional user accounts and cross-device sync.

Tech: Node.js + Express, Supabase (PostgreSQL + Auth), Railway for hosting.

Endpoints:
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/sync` (authenticated — upserts daily records)
- `GET /api/v1/records?from=date&to=date` (authenticated)
- `DELETE /api/v1/data` (authenticated — full GDPR deletion)

---

## Phase 15 — Multi-device Sync in Extension

**Goal:** Connect the extension to the backend. Sync is optional and opt-in only.

- Login/signup page in dashboard
- JWT stored in `chrome.storage.local`
- Sync status shown in popup ("Synced 2 minutes ago")
- On daily alarm: if logged in, POST today's record
- On startup: if logged in, fetch and merge records (server wins for past dates, local wins for today)
- Delete account: removes server data AND clears local storage AND logs out

---

## Phase 16 — Topic Tagging and Pattern Analysis

**Goal:** Deeper insight from URL patterns — no page content reading ever.

- Sub-classify URLs by path patterns (e.g. `leetcode.com/problems/*` → topic: "algorithms")
- Topic tags stored with daily records
- Dashboard page: top topics by time, day-of-week heatmap
- Heuristic weakness flag: if AI usage on a topic > 70% of that topic's total time → flag shown as non-intrusive card
- Never reads page content — URL patterns only

---

## 5. Cross-Version Rules

1. No phase is done until `npm run build` passes with zero errors.
2. No phase is done until the developer has manually tested it in Chrome.
3. No V2 phase starts until V1 is on the Chrome Web Store.
4. No V3 phase starts until V2 is stable.
5. Privacy rule: no user data leaves the browser until Phase 15, and only with explicit opt-in.
6. All `GEMINI.md` hard stops apply in every phase — they never relax.
7. Every new interface goes in `src/types/index.ts`.
8. `npm run lint` must pass with zero errors after every phase.
9. Git commit after every phase — every phase is a rollback point.