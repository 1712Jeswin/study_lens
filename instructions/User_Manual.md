# USER_MANUAL.md — Manual Testing Guide

> **What this document is:**
> After the agent finishes building each phase, you must manually verify it works in Chrome.
> The agent cannot open a browser. Only you can.
> This document tells you exactly what to click, what to look for, what numbers to expect,
> and what to do when something is wrong — phase by phase, version by version.
>
> **How to use this document:**
> Find the phase you just finished building.
> Go through every numbered step in order.
> Do not skip any step.
> Do not mark a phase as done until every single check passes.
> If something fails, the "If this fails" note tells you exactly what went wrong and how to fix it.

---

## Before You Begin — One-Time Setup Checks

Do these once before you start Phase 1. Never again after that.

### DevTools Setup

**How to open the Service Worker console (you will do this constantly):**
```
1. Open Chrome and go to: chrome://extensions
2. Find the StudyLens card
3. Click the blue "Service Worker" link (or "Inspect views: service worker")
4. A DevTools window opens — this is the background service worker's console
5. Click the "Console" tab
6. This is where all console.log from background.ts appears
```
Keep this window open in a separate corner of your screen while testing. You will check it after every tab switch.

**How to open the Extension Storage inspector (you will use this constantly):**
```
1. Open any normal Chrome tab (e.g. google.com)
2. Press F12 to open DevTools
3. Click the "Application" tab in the top bar
4. In the left sidebar, scroll down to "Storage"
5. Expand "Extension Storage" → "Local Storage"
6. Click on your extension from the list (you will see "StudyLens")
7. The right panel shows the raw key-value data in chrome.storage.local
8. Click any key to expand nested objects
9. You can also manually edit values here — you will use this to simulate edge cases
```

**How to open the Popup DevTools:**
```
1. Click the StudyLens icon in the Chrome toolbar to open the popup
2. Right-click anywhere inside the popup
3. Click "Inspect"
4. A DevTools window opens — this shows the popup's HTML, CSS, and console
5. Console tab shows all console.log from popup.ts
```

**How to reload the extension after a build:**
```
1. Run: npm run build (in PowerShell, inside the extension/ folder)
2. Wait for it to complete with zero errors
3. Go to chrome://extensions
4. Find the StudyLens card
5. Click the circular ↺ reload icon
6. Done — the extension now runs your new compiled code
```
You must do this after every `npm run build`. Chrome does not auto-reload.

---

# ══════════════════════════════════════════════════════
# VERSION 1 — MVP EXTENSION
# Phases 1 through 8
# ══════════════════════════════════════════════════════

---

## PHASE 1 — Project Scaffold and Extension Shell

**What was built:** The skeleton of the extension with no real functionality. Just enough to prove it can be installed in Chrome and open a popup.

**Time to verify: approximately 10 minutes**

---

### Step 1.1 — Run the build

Open PowerShell. Navigate into the extension folder:
```powershell
cd J:\Open-Source-Projects\study-lens\extension
npm install
npm run build
```

**What you must see:**
- `npm install` completes with no errors (warnings about deprecated packages are acceptable)
- `npm run build` completes and shows either nothing (success) or a line like `Found 0 errors`
- A new `dist/` folder now exists inside `extension/`

**If this fails:**
- `Cannot find module 'typescript'` → `npm install` did not complete correctly. Delete `node_modules/` and run `npm install` again.
- `tsconfig.json not found` → you are in the wrong folder. Make sure you are inside `extension/`, not `study-lens/`.
- TypeScript errors → paste the full error output back to the agent and ask it to fix them before proceeding.

---

### Step 1.2 — Load the extension in Chrome

```
1. Open Chrome
2. Go to: chrome://extensions  (type this in the address bar)
3. Look for the "Developer mode" toggle in the top-right corner
4. If it is OFF, click it to turn it ON
5. Three new buttons appear: "Load unpacked", "Pack extension", "Update"
6. Click "Load unpacked"
7. A file picker opens
8. Navigate to your extension/ folder (not dist/ — the extension/ folder that contains manifest.json)
9. Click "Select Folder"
```

**What you must see:**
- A new card appears on chrome://extensions labelled "StudyLens"
- The card shows version "1.0.0"
- There is NO red error banner on the card
- The StudyLens icon appears in the Chrome toolbar (top right, next to the address bar)

**If this fails:**
- Red banner: "Manifest file is missing or unreadable" → `manifest.json` is in the wrong location. It must be directly inside `extension/`, not inside `extension/src/` or `extension/dist/`.
- Red banner: "Could not load background script 'dist/background.js'" → the TypeScript build did not produce `dist/background.js`. Check that `npm run build` completed without errors.
- Red banner mentioning permissions or manifest_version → the agent generated an incorrect `manifest.json`. Paste the banner text to the agent and ask it to fix the manifest.
- Extension icon does not appear in toolbar → click the puzzle piece icon in Chrome toolbar and pin StudyLens.

---

### Step 1.3 — Check the popup

```
1. Click the StudyLens icon in the Chrome toolbar
2. A small popup window opens (approximately 320px wide)
```

**What you must see:**
- The popup opens immediately (no delay, no blank flash)
- The text "StudyLens" appears as a heading inside the popup
- The popup has a white background
- There are no error messages inside the popup

**Open the popup DevTools:**
```
Right-click inside the popup → Inspect
Click the Console tab
```

**What you must see in the popup console:**
- `[StudyLens] Popup loaded`
- No red error messages

**If this fails:**
- Popup opens blank → `popup.html` is not linking to `popup.css` or `popup.ts` was not compiled. Check that `dist/popup/popup.js` exists after the build.
- "Cannot GET popup.js" error → the script tag in `popup.html` has the wrong path. It should point to `popup.js` (which is the compiled version in the same folder).
- CSP error (Content Security Policy) → there is an inline script or style in `popup.html`. The agent must remove it.

---

### Step 1.4 — Check the service worker

```
1. Go to chrome://extensions
2. Find the StudyLens card
3. Click the "Service Worker" link (it shows as a blue hyperlink)
4. A separate DevTools window opens
5. Click the Console tab
```

**What you must see:**
- `[StudyLens] Extension installed`

**Important note:** This log only appears once — when the extension is first installed. If you already see the card and do not see this log, click the ↺ reload icon on the card, then check again. You may need to wait 1–2 seconds after reloading.

**If this fails:**
- Console shows a red error about `background.js` → the background script has a JavaScript error. Copy the full error and paste it to the agent.
- Console shows "Cannot use import statement in a non-module context" → `manifest.json` is missing `"type": "module"` in the background service worker declaration.
- The "Service Worker" link is not visible → the service worker failed to register. Check the manifest for typos in the `service_worker` file path.

---

### Step 1.5 — Verify the dist/ folder structure

Open File Explorer (or PowerShell) and check the `extension/dist/` folder exists and contains:
```
extension/dist/
├── background.js
├── background.js.map  (optional but good)
└── popup/
    ├── popup.js
    └── popup.js.map   (optional but good)
```

**If this structure is wrong:**
- Missing `popup/` folder → check `tsconfig.json` has `"rootDir": "./src"` and `"outDir": "./dist"`. The popup files should compile from `src/popup/popup.ts` to `dist/popup/popup.js`.

---

### Step 1.6 — Run the lint check

```powershell
npm run lint
```

**What you must see:**
- Zero errors
- Zero warnings (if there are warnings, note them but they do not block the phase)

---

### Step 1.7 — Git commit

```powershell
git add .
git commit -m "phase-1: scaffold, manifest, types, placeholder files"
git push origin main
```

**What you must see:**
- Commit succeeds
- Push succeeds
- On github.com, your repository shows the new files

---

### ✅ Phase 1 Complete Checklist

Mark every item before moving to Phase 2:

```
□ npm run build → zero TypeScript errors
□ npm run lint → zero errors
□ Extension card appears on chrome://extensions with no error banner
□ Extension icon appears in Chrome toolbar
□ Clicking the icon opens a popup showing "StudyLens" heading
□ Popup console shows "[StudyLens] Popup loaded" with no errors
□ Service worker console shows "[StudyLens] Extension installed"
□ dist/ folder contains background.js and popup/popup.js
□ Git commit pushed to GitHub
```

**If any box is unchecked, do not start Phase 2.**

---

## PHASE 2 — Classifier Module

**What was built:** The complete site classification system. A pure TypeScript module that takes a URL and returns one of five categories: ai, coding, study, distraction, uncategorized.

**Time to verify: approximately 15 minutes**

---

### Step 2.1 — Build check

```powershell
npm run build
```

**What you must see:** Zero errors. A new `dist/classifier.js` file exists.

---

### Step 2.2 — Reload and open service worker console

```
chrome://extensions → ↺ reload → click "Service Worker" → Console tab
```

---

### Step 2.3 — Test the classifier by temporarily adding test logs

The classifier is a pure module — it has no Chrome APIs and produces no output on its own. To verify it works, you will temporarily add test code to `background.ts`, build, reload, and check the console.

**Tell the agent:**
```
Temporarily add these console.log calls to the onInstalled listener in background.ts for testing.
I will remove them after I verify the output.

import { classifySite, extractDomain } from './classifier'

console.log('[TEST] chatgpt.com:', classifySite('https://chatgpt.com/chat/abc'))
console.log('[TEST] leetcode:', classifySite('https://www.leetcode.com/problems/two-sum/'))
console.log('[TEST] coursera:', classifySite('https://coursera.org/learn/something'))
console.log('[TEST] instagram:', classifySite('https://instagram.com/feed'))
console.log('[TEST] unknown:', classifySite('https://randomsite123.xyz'))
console.log('[TEST] chrome url:', classifySite('chrome://extensions'))
console.log('[TEST] bad url:', classifySite('not a url at all'))
console.log('[TEST] www strip:', extractDomain('https://www.github.com/user/repo'))
```

After the agent adds these, run:
```powershell
npm run build
```

Then reload the extension and check the service worker console (you may need to click the reload ↺ icon on the card to trigger `onInstalled` to fire again — or right-click the service worker console and click "Clear" then click "Update" on the extension card).

**What you must see:**
```
[TEST] chatgpt.com: ai
[TEST] leetcode: coding
[TEST] coursera: study
[TEST] instagram: distraction
[TEST] unknown: uncategorized
[TEST] chrome url: uncategorized
[TEST] bad url: uncategorized
[TEST] www strip: github.com
```

**If any value is wrong:**
- `chatgpt.com` returns `uncategorized` → the `SITE_LISTS.ai` array does not include `'chatgpt.com'`. Ask the agent to check `classifier.ts` against the list in `GEMINI.md`.
- `chrome url` returns anything other than `uncategorized` → `isTrackableUrl()` is not filtering `chrome://` protocol. Ask the agent to fix it.
- `www strip` returns `www.github.com` → `extractDomain()` is not stripping the `www.` prefix. Fix in `classifier.ts`.

---

### Step 2.4 — Remove the test logs

Tell the agent: "Remove all the [TEST] console.log calls from background.ts. Then run npm run build and confirm zero errors."

After the agent removes them:
```powershell
npm run build
```
Zero errors required.

---

### Step 2.5 — Verify no Chrome API in classifier

In PowerShell:
```powershell
Select-String -Path "extension\src\classifier.ts" -Pattern "chrome\." -SimpleMatch
```

**What you must see:** No output (zero matches). If any line contains `chrome.`, that is a violation — tell the agent to remove it.

---

### Step 2.6 — Run lint

```powershell
npm run lint
```
Zero errors.

---

### Step 2.7 — Git commit

```powershell
git add .
git commit -m "phase-2: classifier with full site lists and pure functions"
git push origin main
```

---

### ✅ Phase 2 Complete Checklist

```
□ npm run build → zero errors
□ All 8 classification test outputs are exactly correct
□ Test logs removed from background.ts
□ grep for "chrome." in classifier.ts → zero results
□ npm run lint → zero errors
□ Git commit pushed
```

---

## PHASE 3 — Storage Module

**What was built:** The complete data persistence layer. Every read and write to `chrome.storage.local` goes through `storage.ts`. No other file touches storage directly.

**Time to verify: approximately 20 minutes**

---

### Step 3.1 — Build check

```powershell
npm run build
```
Zero errors. `dist/storage.js` now exists.

---

### Step 3.2 — Test storage with temporary logs in background.ts

Tell the agent to temporarily add this test to the `onInstalled` listener:

```typescript
import { initializeStorage, getTodayRecord, updateTodayRecord, getStreak } from './storage'

await initializeStorage()
console.log('[TEST] Storage initialized')

const record = await getTodayRecord()
console.log('[TEST] Today record (fresh):', JSON.stringify(record))
// Expected: { date: "today's date", ai: 0, coding: 0, study: 0, distraction: 0, uncategorized: 0 }

await updateTodayRecord('ai', 300)
console.log('[TEST] Added 300s to AI')

const updated = await getTodayRecord()
console.log('[TEST] AI seconds after adding 300:', updated.ai)
// Expected: 300

await updateTodayRecord('ai', 150)
const updatedAgain = await getTodayRecord()
console.log('[TEST] AI seconds after adding 150 more:', updatedAgain.ai)
// Expected: 450

const streak = await getStreak()
console.log('[TEST] Streak:', JSON.stringify(streak))
// Expected: { currentStreak: 0, longestStreak: 0, lastActiveDate: "" }
```

Build and reload:
```powershell
npm run build
```
Reload extension on `chrome://extensions`.

**What you must see in the service worker console:**
```
[TEST] Storage initialized
[TEST] Today record (fresh): {"date":"2026-03-21","ai":0,"coding":0,"study":0,"distraction":0,"uncategorized":0}
[TEST] Added 300s to AI
[TEST] AI seconds after adding 300: 300
[TEST] AI seconds after adding 150 more: 450
[TEST] Streak: {"currentStreak":0,"longestStreak":0,"lastActiveDate":""}
```

The date in the first output will be today's actual date.

**If this fails:**
- Any console.error about storage → a storage function has a bug. Copy the full error to the agent.
- AI seconds after adding 300 shows `0` → `updateTodayRecord` is not reading before writing (it is overwriting instead of accumulating). Ask the agent to fix the read-modify-write pattern.
- AI seconds after adding 150 more shows `150` instead of `450` → same bug as above.

---

### Step 3.3 — Verify storage contents in DevTools

Open any Chrome tab → DevTools → Application → Extension Storage → Local Storage → StudyLens.

**What you must see:**
```
records
  └── "2026-03-21"  (today's date)
        ├── date: "2026-03-21"
        ├── ai: 450
        ├── coding: 0
        ├── study: 0
        ├── distraction: 0
        └── uncategorized: 0

streak
  ├── currentStreak: 0
  ├── longestStreak: 0
  └── lastActiveDate: ""

installedAt: [a timestamp number]
pendingReflection: null
reflectionHistory: []
```

**If the storage looks different:**
- Missing keys → `initializeStorage()` is not writing defaults. Ask the agent to fix it.
- `ai` shows `0` instead of `450` → the test code ran but storage was not persisted. Check that `updateTodayRecord` actually `await`s the `chrome.storage.local.set()` call.

---

### Step 3.4 — Test persistence across reload

```
1. Note the current value of ai in storage (should be 450 from the test)
2. Close the service worker DevTools window
3. Click ↺ reload on the extension card
4. Reopen the service worker DevTools
5. Reopen Application → Extension Storage → check the same values
```

**What you must see:**
- The `ai: 450` value is still there
- Storage persists across extension reload (this confirms `chrome.storage.local` is working correctly, not in-memory only)

---

### Step 3.5 — Clear the test data

In Application → Extension Storage, right-click your extension → "Clear". This wipes the test data so it does not interfere with later phases.

Then confirm the storage is empty by refreshing the Application panel.

---

### Step 3.6 — Remove test logs and verify no business logic in storage.ts

Tell the agent to remove all `[TEST]` logs from `background.ts`.

In PowerShell, check that `storage.ts` has no classification or scoring logic:
```powershell
Select-String -Path "extension\src\storage.ts" -Pattern "classify|score|streak" -SimpleMatch
```

**What you must see:** Zero results. Storage must not contain any business logic.

---

### Step 3.7 — Build, lint, commit

```powershell
npm run build
npm run lint
git add .
git commit -m "phase-3: storage module with full CRUD and defaults"
git push origin main
```

---

### ✅ Phase 3 Complete Checklist

```
□ npm run build → zero errors
□ initializeStorage() creates correct default structure in chrome.storage.local
□ updateTodayRecord('ai', 300) → ai field becomes 300
□ updateTodayRecord('ai', 150) on top → ai field becomes 450 (accumulates, not overwrites)
□ getStreak() returns { currentStreak: 0, longestStreak: 0, lastActiveDate: "" }
□ Storage persists after extension reload
□ Test data cleared from storage
□ Test logs removed from background.ts
□ grep for "classify|score" in storage.ts → zero results
□ npm run lint → zero errors
□ Git commit pushed
```

---

## PHASE 4 — Score and Streak Modules

**What was built:** Two pure calculation modules. `score.ts` calculates the dependency score. `streak.ts` calculates streak state. Neither has any Chrome API calls.

**Time to verify: approximately 15 minutes**

---

### Step 4.1 — Build check

```powershell
npm run build
```
Zero errors.

---

### Step 4.2 — Test score calculation with temporary logs

Tell the agent to add these temporary test logs to `background.ts` `onInstalled`:

```typescript
import { calculateDependencyScore, formatSeconds } from './score'
import type { DailyRecord } from './types/index'

const highAI: DailyRecord = { date: '2026-03-21', ai: 7200, coding: 1800, study: 900, distraction: 3600, uncategorized: 0 }
const result1 = calculateDependencyScore(highAI)
console.log('[TEST] High AI score:', result1.score, result1.label)
// Expected: score=72 label=high
// Formula: 7200 / (7200+1800+900) = 7200/9900 = 0.727... → rounds to 73
// Note: distraction (3600) is EXCLUDED from denominator

const balanced: DailyRecord = { date: '2026-03-21', ai: 3600, coding: 3600, study: 1800, distraction: 0, uncategorized: 0 }
const result2 = calculateDependencyScore(balanced)
console.log('[TEST] Balanced score:', result2.score, result2.label)
// Expected: score=40 label=moderate
// Formula: 3600 / (3600+3600+1800) = 3600/9000 = 0.4 → 40

const allZero: DailyRecord = { date: '2026-03-21', ai: 0, coding: 0, study: 0, distraction: 0, uncategorized: 0 }
const result3 = calculateDependencyScore(allZero)
console.log('[TEST] Zero score:', result3.score, result3.label)
// Expected: score=0 label=healthy (divide-by-zero guard)

const noAI: DailyRecord = { date: '2026-03-21', ai: 0, coding: 7200, study: 3600, distraction: 0, uncategorized: 0 }
const result4 = calculateDependencyScore(noAI)
console.log('[TEST] No AI score:', result4.score, result4.label)
// Expected: score=0 label=healthy

console.log('[TEST] formatSeconds(0):', formatSeconds(0))         // Expected: "0m"
console.log('[TEST] formatSeconds(45):', formatSeconds(45))       // Expected: "45s"
console.log('[TEST] formatSeconds(90):', formatSeconds(90))       // Expected: "1m 30s"
console.log('[TEST] formatSeconds(3600):', formatSeconds(3600))   // Expected: "1h"
console.log('[TEST] formatSeconds(3690):', formatSeconds(3690))   // Expected: "1h 1m 30s"
```

Build and reload. Check the service worker console.

**What you must see:**
```
[TEST] High AI score: 73 high
[TEST] Balanced score: 40 moderate
[TEST] Zero score: 0 healthy
[TEST] No AI score: 0 healthy
[TEST] formatSeconds(0): 0m
[TEST] formatSeconds(45): 45s
[TEST] formatSeconds(90): 1m 30s
[TEST] formatSeconds(3600): 1h
[TEST] formatSeconds(3690): 1h 1m 30s
```

**If any value is wrong:**
- Wrong score number → the formula has a bug. The denominator must be `ai + coding + study` only — distraction must not be included.
- `label=moderate` when expecting `high` → the score bands are wrong. Check: 0–30 healthy, 31–60 moderate, 61–100 high.
- `formatSeconds` returning wrong format → the time formatting logic has a bug. Ask the agent to fix with the exact expected outputs above.

---

### Step 4.3 — Test streak calculation with temporary logs

Add these to the same `onInstalled` block:

```typescript
import { calculateStreak, streakQualifies, getTodayISO, getYesterdayISO } from './streak'
import type { DailyRecord, StreakData } from './types/index'

const yesterday = getYesterdayISO()
const today = getTodayISO()
console.log('[TEST] Today ISO:', today)    // Expected: "2026-03-21" (today's date)
console.log('[TEST] Yesterday ISO:', yesterday)  // Expected: yesterday's date

// Test 1: streak continues when last active was yesterday
const streak1: StreakData = { currentStreak: 5, longestStreak: 10, lastActiveDate: yesterday }
const continued = calculateStreak(streak1, true)
console.log('[TEST] Streak continues:', continued.currentStreak, continued.lastActiveDate)
// Expected: currentStreak=6, lastActiveDate=today

// Test 2: streak does not double-count if already updated today
const streak2: StreakData = { currentStreak: 6, longestStreak: 10, lastActiveDate: today }
const noChange = calculateStreak(streak2, true)
console.log('[TEST] No double count:', noChange.currentStreak)
// Expected: currentStreak=6 (unchanged)

// Test 3: streak resets if gap is more than 1 day
const twoWeeksAgo = '2026-03-07'
const streak3: StreakData = { currentStreak: 5, longestStreak: 10, lastActiveDate: twoWeeksAgo }
const reset = calculateStreak(streak3, true)
console.log('[TEST] Streak reset:', reset.currentStreak)
// Expected: currentStreak=1 (starts fresh from today)

// Test 4: streakQualifies requires 30+ min of coding or study
const qualifyingRecord: DailyRecord = { date: today, ai: 0, coding: 1800, study: 0, distraction: 0, uncategorized: 0 }
console.log('[TEST] Streak qualifies (30min coding):', streakQualifies(qualifyingRecord))
// Expected: true

const notQualifyingRecord: DailyRecord = { date: today, ai: 7200, coding: 600, study: 0, distraction: 0, uncategorized: 0 }
console.log('[TEST] Streak qualifies (only 10min coding):', streakQualifies(notQualifyingRecord))
// Expected: false (10 minutes of coding is not enough)

// Test 5: calculateStreak never mutates input
const original: StreakData = { currentStreak: 5, longestStreak: 10, lastActiveDate: yesterday }
const returned = calculateStreak(original, true)
console.log('[TEST] Input not mutated:', original.currentStreak === 5)
// Expected: true (original still shows 5, not 6)
```

**What you must see:**
```
[TEST] Today ISO: 2026-03-21
[TEST] Yesterday ISO: 2026-03-20
[TEST] Streak continues: 6 2026-03-21
[TEST] No double count: 6
[TEST] Streak reset: 1
[TEST] Streak qualifies (30min coding): true
[TEST] Streak qualifies (only 10min coding): false
[TEST] Input not mutated: true
```

**If any value is wrong:**
- Streak continues shows `5` instead of `6` → `calculateStreak` is not incrementing when yesterday was the last date.
- No double count shows `7` instead of `6` → the "already counted today" check is missing.
- Streak reset shows `5` instead of `1` → the gap detection is missing. The function needs to check the date difference, not just whether it equals yesterday.
- Input not mutated shows `false` → `calculateStreak` is mutating the input object. Ask the agent to return a new object using `{ ...current, currentStreak: newValue }` instead of modifying properties directly.

---

### Step 4.4 — Remove test logs and verify purity

Remove all `[TEST]` logs from `background.ts`.

Check no Chrome APIs in score or streak:
```powershell
Select-String -Path "extension\src\score.ts" -Pattern "chrome\." -SimpleMatch
Select-String -Path "extension\src\streak.ts" -Pattern "chrome\." -SimpleMatch
```

Both must return zero results.

---

### Step 4.5 — Build, lint, commit

```powershell
npm run build
npm run lint
git add .
git commit -m "phase-4: score and streak pure calculation modules"
git push origin main
```

---

### ✅ Phase 4 Complete Checklist

```
□ npm run build → zero errors
□ High AI score: 73, label: high
□ Balanced score: 40, label: moderate
□ Zero state: 0, label: healthy (divide-by-zero guard works)
□ No AI (all coding): 0, label: healthy
□ All 5 formatSeconds outputs are correct
□ Streak increments correctly when last date was yesterday
□ Streak does not double-count when last date is today
□ Streak resets to 1 when gap is more than one day
□ streakQualifies: true for 30+ min coding
□ streakQualifies: false for only 10 min coding
□ calculateStreak never mutates the input object
□ grep for "chrome." in score.ts → zero results
□ grep for "chrome." in streak.ts → zero results
□ Test logs removed from background.ts
□ npm run lint → zero errors
□ Git commit pushed
```

---

## PHASE 5 — Reflection Module

**What was built:** The self-reflection prompt logic. Decides when to show a reflection prompt, creates reflection entries, and resolves them when the user answers.

**Time to verify: approximately 10 minutes**

---

### Step 5.1 — Build check

```powershell
npm run build
```
Zero errors.

---

### Step 5.2 — Test reflection logic with temporary logs

Tell the agent to add these temporary tests to `background.ts` `onInstalled`:

```typescript
import { shouldTriggerReflection, createReflectionEntry, resolveReflection, getReflectionMessage } from './reflection'
import type { ActiveSession } from './types/index'

const aiSession: ActiveSession = {
  domain: 'chatgpt.com',
  category: 'ai',
  startTime: Date.now() - 2000000,
  tabId: 1
}

// Test 1: should NOT trigger — under threshold (29 minutes)
console.log('[TEST] Under threshold (1799s):', shouldTriggerReflection({ ...aiSession, durationSeconds: 1799 }))
// Expected: false

// Test 2: SHOULD trigger — exactly at threshold (30 minutes)
console.log('[TEST] At threshold (1800s):', shouldTriggerReflection({ ...aiSession, durationSeconds: 1800 }))
// Expected: true

// Test 3: SHOULD trigger — over threshold
console.log('[TEST] Over threshold (3600s):', shouldTriggerReflection({ ...aiSession, durationSeconds: 3600 }))
// Expected: true

// Test 4: should NOT trigger — coding session, even if long
const codingSession: ActiveSession = { domain: 'leetcode.com', category: 'coding', startTime: Date.now(), tabId: 2 }
console.log('[TEST] Long coding session (no trigger):', shouldTriggerReflection({ ...codingSession, durationSeconds: 7200 }))
// Expected: false

// Test 5: create reflection entry
const entry = createReflectionEntry(aiSession, 1800)
console.log('[TEST] Entry created:', entry.domain, entry.solvedByAI, typeof entry.sessionId)
// Expected: chatgpt.com null string

// Test 6: resolve reflection — AI solved it
const resolved = resolveReflection(entry, true)
console.log('[TEST] Resolved yes:', resolved.solvedByAI)
// Expected: true

// Test 7: original entry not mutated
console.log('[TEST] Original not mutated:', entry.solvedByAI)
// Expected: null (still null — resolveReflection must not mutate input)

// Test 8: reflection message
console.log('[TEST] Message:', getReflectionMessage('chatgpt.com', 1800))
// Expected: a string containing "chatgpt.com" and "30 min"
```

**What you must see:**
```
[TEST] Under threshold (1799s): false
[TEST] At threshold (1800s): true
[TEST] Over threshold (3600s): true
[TEST] Long coding session (no trigger): false
[TEST] Entry created: chatgpt.com null string
[TEST] Resolved yes: true
[TEST] Original not mutated: null
[TEST] Message: You spent 30 min on chatgpt.com. Did AI solve the problem for you, or were you using it as a reference?
```

**If any value is wrong:**
- `At threshold` returns `false` → the threshold check is using `>` instead of `>=`. Fix to `durationSeconds >= REFLECTION_THRESHOLD_SECONDS`.
- `Long coding session` returns `true` → the category check is missing. Only `'ai'` category should trigger.
- `Original not mutated` returns `true` instead of `null` → `resolveReflection` is mutating the input. Fix to return `{ ...entry, solvedByAI }`.

---

### Step 5.3 — Remove test logs and verify purity

Remove all `[TEST]` logs from `background.ts`.

```powershell
Select-String -Path "extension\src\reflection.ts" -Pattern "chrome\." -SimpleMatch
```
Zero results.

---

### Step 5.4 — Build, lint, commit

```powershell
npm run build
npm run lint
git add .
git commit -m "phase-5: reflection prompt logic module"
git push origin main
```

---

### ✅ Phase 5 Complete Checklist

```
□ npm run build → zero errors
□ shouldTriggerReflection: false at 1799s
□ shouldTriggerReflection: true at exactly 1800s
□ shouldTriggerReflection: true at 3600s
□ shouldTriggerReflection: false for coding category at any duration
□ createReflectionEntry produces entry with domain, null solvedByAI, string sessionId
□ resolveReflection sets solvedByAI to true
□ resolveReflection does NOT mutate the original entry
□ getReflectionMessage returns a string containing the domain name
□ grep for "chrome." in reflection.ts → zero results
□ Test logs removed from background.ts
□ npm run lint → zero errors
□ Git commit pushed
```

---

## PHASE 6 — Background Service Worker

**What was built:** The complete tracking engine. This is the most critical phase — everything that makes the extension actually work. The service worker tracks tab switches, records time to storage, and triggers reflection prompts.

**Time to verify: approximately 30–40 minutes. Do not rush this phase.**

---

### Step 6.1 — Build check

```powershell
npm run build
```
Zero errors. This is mandatory before any Chrome testing.

---

### Step 6.2 — Reload and prepare

```
1. chrome://extensions → ↺ reload the StudyLens extension
2. Click the "Service Worker" link to open the service worker console
3. Clear the console (right-click inside it → Clear console)
4. Open Application → Extension Storage and clear all existing data
   (right-click the extension → "Clear")
5. Reload the extension one more time after clearing storage
```

---

### Step 6.3 — Test basic tab tracking

This is the core test. You are verifying that switching tabs correctly records time.

```
1. Open a new tab and navigate to: https://chatgpt.com
2. Watch the service worker console immediately
```

**What you must see within 1–2 seconds:**
```
[StudyLens] Tracking: chatgpt.com (ai)
```

```
3. Stay on chatgpt.com for exactly 10 seconds (count in your head or use a timer)
4. Open a new tab and navigate to: https://leetcode.com
5. Watch the service worker console
```

**What you must see:**
```
[StudyLens] Finalised: chatgpt.com — Xs (ai)
[StudyLens] Tracking: leetcode.com (coding)
```

The `Xs` will be approximately 10 seconds. It may be 8–12 seconds depending on when Chrome fired the events — this is normal.

**If you do not see these logs:**
- No "Tracking" log appears → the `onActivated` listener is not firing or `handleTabChange` is not being called. Check `background.ts` for the listener.
- "Tracking" appears but "Finalised" does not → `finaliseSession` is not being called on tab change. Check that `handleTabChange` calls `finaliseSession` for the previous session before starting the new one.
- Logs appear but duration is wildly wrong (e.g. negative numbers or millions) → `startTime` is being set incorrectly. Check that `activeSession.startTime = Date.now()`.

---

### Step 6.4 — Verify storage updated correctly

```
Open DevTools → Application → Extension Storage
```

**What you must see:**
```
records
  └── "2026-03-21"  (today's date)
        ├── ai: [approximately 10]      ← from your chatgpt.com visit
        ├── coding: 0
        ├── study: 0
        ├── distraction: 0
        └── uncategorized: 0
```

The `ai` value should match the approximately 10 seconds you spent on chatgpt.com.

**If ai is 0:**
- `finaliseSession` is not calling `updateTodayRecord`. Check the implementation in `background.ts`.
- `durationSeconds < 5` check is filtering it — if you navigated away too quickly. Stay on the site for longer.

---

### Step 6.5 — Test the 1-minute alarm tick

The alarm tick saves time every minute to prevent data loss. You need to verify it is working.

```
1. Navigate to: https://github.com
2. Watch the service worker console
3. Wait 60–70 seconds
```

**What you must see after ~60 seconds:**
```
[StudyLens] Tick: saved ~60s for github.com
```

**Also verify:** Open Extension Storage and watch the `coding` value. It should increase by approximately 60 each time the tick fires.

**If tick does not appear after 90 seconds:**
- The alarm was not created. Reload the extension and check the `onInstalled` listener creates the `"tick"` alarm with `periodInMinutes: 1`.
- Check that `chrome.alarms.onAlarm` listener exists in `background.ts`.

**To speed up testing only (optional):** Ask the agent to temporarily change the alarm to `periodInMinutes: 0.1` (6 seconds). Do not forget to change it back to `1` before Phase 8.

---

### Step 6.6 — Test non-trackable URL filtering

```
1. Navigate to: chrome://extensions
2. Watch the service worker console
```

**What you must see:**
- The `chrome://extensions` page does NOT appear in the "Tracking" log
- If there was a previous session (e.g. github.com), you should see:
  ```
  [StudyLens] Finalised: github.com — Xs (coding)
  ```
  But NO new "Tracking" line for `chrome://extensions`.

---

### Step 6.7 — Test browser focus loss (window blur)

```
1. Navigate to: https://stackoverflow.com
2. Confirm you see: [StudyLens] Tracking: stackoverflow.com (coding)
3. Click on a different application on your computer (e.g. File Explorer, Notepad)
   (This causes Chrome to lose focus — simulating the user switching away from the browser)
4. Wait 3 seconds
5. Click back on Chrome
6. Watch the service worker console
```

**What you must see:**
When you click away from Chrome:
```
[StudyLens] Finalised: stackoverflow.com — Xs (coding)
```

When you click back on Chrome:
```
[StudyLens] Tracking: stackoverflow.com (coding)
```
(Or whatever tab is active when you return)

**If focus tracking does not work:**
- The `onFocusChanged` listener is missing or not correctly handling `WINDOW_ID_NONE`.

---

### Step 6.8 — Test reflection trigger

The reflection prompt should appear after 30 minutes on an AI site. You will simulate this by manually writing a reflection entry to storage.

```
1. Open Extension Storage in DevTools
2. Find the "pendingReflection" key (it should be null)
3. Click on it and manually set it to this JSON value:
   {
     "sessionId": "chatgpt.com-1742550000000",
     "domain": "chatgpt.com",
     "durationSeconds": 1800,
     "solvedByAI": null,
     "timestamp": 1742550000000
   }
4. After you build the popup in Phase 7, this will show the reflection prompt
```

For now, just verify storage accepted the value (the reflection UI test happens in Phase 7).

---

### Step 6.9 — Run the full tracking scenario

This is the end-to-end real-usage test. Do this in one continuous session:

```
1. Clear Extension Storage completely
2. Reload the extension
3. Visit chatgpt.com for 30 seconds
4. Visit leetcode.com for 30 seconds
5. Visit instagram.com for 15 seconds
6. Visit coursera.org for 20 seconds
7. Visit chrome://newtab
8. Open Extension Storage
```

**What you must see in storage:**
```
records["today"]
  ai: approximately 30
  coding: approximately 30
  distraction: approximately 15
  study: approximately 20
```

The values will not be exact — Chrome event timing is not perfectly precise. An error of ±5 seconds per category is acceptable.

---

### Step 6.10 — Verify no Chrome API violations in pure modules

```powershell
Select-String -Path "extension\src\classifier.ts","extension\src\score.ts","extension\src\streak.ts","extension\src\reflection.ts" -Pattern "chrome\." -SimpleMatch
```

**Must return zero results.**

---

### Step 6.11 — Architecture audit check

```powershell
# Check storage.ts has no calls outside of itself
Select-String -Path "extension\src\background.ts" -Pattern "chrome\.storage" -SimpleMatch
```

**Must return zero results** — `background.ts` must call `updateTodayRecord()` from `storage.ts`, never call `chrome.storage` directly.

---

### Step 6.12 — Build, lint, commit

```powershell
npm run build
npm run lint
git add .
git commit -m "phase-6: background service worker full tracking engine"
git push origin main
```

---

### ✅ Phase 6 Complete Checklist

```
□ npm run build → zero errors
□ Switching to chatgpt.com → console shows "Tracking: chatgpt.com (ai)"
□ Switching away after 10s → console shows "Finalised: chatgpt.com — ~10s (ai)"
□ Extension Storage shows correct ai seconds after chatgpt visit
□ 1-minute alarm tick fires and logs "Tick: saved ~60s"
□ Storage coding value increases every tick while on leetcode.com
□ Navigating to chrome://extensions → no "Tracking" log appears
□ Chrome loses focus → current session is finalised
□ Chrome regains focus → new tracking session starts
□ End-to-end scenario: all four categories record approximate correct times
□ grep for "chrome.storage" in background.ts → zero results (calls go through storage.ts)
□ grep for "chrome." in all four pure modules → zero results
□ npm run lint → zero errors
□ Git commit pushed
□ Architecture Audit: send the Architecture Audit prompt from PROMPT.md
```

---

## PHASE 7 — Popup UI

**What was built:** The complete user-facing popup. Everything the student sees when they click the extension icon: score, time breakdown, streak, and the reflection prompt.

**Time to verify: approximately 25 minutes**

---

### Step 7.1 — Build check

```powershell
npm run build
```
Zero errors.

---

### Step 7.2 — Fresh state test (zero data)

```
1. Open Extension Storage → clear all data
2. Reload the extension
3. Click the StudyLens icon in the Chrome toolbar
4. The popup opens
```

**What you must see:**
- Popup opens without a blank flash or loading spinner stuck permanently
- Score shows: `0` or `0%`
- Score label shows: `healthy`
- All four category bars (AI, Coding, Study, Distraction) show: `0m`
- Streak shows: `0` or "Start your streak today"
- No reflection prompt card is visible
- No JavaScript errors in the popup console (right-click popup → Inspect → Console)

**If popup shows blank white:**
- The CSS is not loading. Check that `popup.html` links to `popup.css` with the correct path.
- The JS has a runtime error. Check the popup console for red error messages.

**If popup console shows errors:**
- `TypeError: Cannot read properties of null (reading 'textContent')` → a DOM query returned null. `popup.ts` is trying to set content on an element that does not exist in `popup.html`. The ID names must match exactly.
- `Cannot find module` → an import path is wrong. Check all imports in `popup.ts`.

---

### Step 7.3 — Real data test

```
1. Navigate to chatgpt.com — stay for 2 minutes (120 seconds)
2. Navigate to leetcode.com — stay for 1 minute (60 seconds)
3. Navigate to instagram.com — stay for 30 seconds
4. Navigate to a new tab (chrome://newtab) to finalise the last session
5. Click the StudyLens icon
```

**What you must see in the popup:**

Score section:
- Score shows a number greater than 0
- If ai≈120s, coding≈60s, study=0, then: score = 120/(120+60) = 0.67 → 67% → label should be `high`
- Score colour should be RED (not green or amber) because it is above 60%

Category bars:
- AI bar shows approximately: `2m`
- Coding bar shows approximately: `1m`
- Study bar shows: `0m`
- Distraction bar shows approximately: `30s`

Streak section:
- Shows `0` or "Start your streak today" (streak requires 30 min of coding/study — you did not meet that threshold in this test)

**If score is showing 0 when it should be non-zero:**
- `popup.ts` is not reading from `getTodayRecord()` correctly
- `calculateDependencyScore` is returning 0 — check if `productiveSeconds` is being calculated with distraction included in the denominator

**If category bars all show 0:**
- Popup is reading from storage before Phase 6 data was written — check that `popup.ts` calls `getTodayRecord()` from `storage.ts` and awaits the result

---

### Step 7.4 — Score colour test

Navigate to different combinations and verify the score colour changes:

**Test A — Healthy (green):**
```
Clear storage. Visit leetcode.com for 3 minutes, then open popup.
Score should be 0% (no AI) → colour must be GREEN (#1D9E75)
```

**Test B — Moderate (amber):**
```
Clear storage. Visit chatgpt.com for 2 min, leetcode for 3 min, then open popup.
Score = 120/(120+180) = 40% → colour must be AMBER (#BA7517)
```

**Test C — High (red):**
```
Clear storage. Visit chatgpt.com for 5 min, then open popup.
Score = 100% → colour must be RED (#E24B4A)
```

---

### Step 7.5 — Reflection prompt test

```
1. Open Extension Storage
2. Manually add pendingReflection:
   {
     "sessionId": "chatgpt.com-1742550000000",
     "domain": "chatgpt.com",
     "durationSeconds": 2100,
     "solvedByAI": null,
     "timestamp": 1742550000000
   }
   (Click on pendingReflection key → edit the value in the field)
3. Close and reopen the popup
```

**What you must see:**
- A card appears at the TOP of the popup (above the score section)
- The card contains a message mentioning "chatgpt.com" and "35 min" (2100 seconds = 35 minutes)
- Two buttons are visible: one for "Yes, AI solved it" and one for "No, I used it as reference"
- No other popup content is obscured by the card

**Click "Yes, AI solved it":**
- The reflection card disappears immediately
- The popup returns to the normal score/breakdown view
- Open Extension Storage and verify:
  - `pendingReflection` is now `null`
  - `reflectionHistory` array has one entry with `solvedByAI: true`

**Click "No, I used it as reference" (repeat the test with a new pendingReflection):**
- Same flow — card disappears, storage updated with `solvedByAI: false`

**If the reflection card does not appear:**
- `popup.ts` is not reading `getPendingReflection()` from `storage.ts`
- The `#reflection-prompt` element in `popup.html` has `hidden` attribute and `popup.ts` is not removing it

**If clicking "Yes" does not make the card disappear:**
- The button's click listener is not attached correctly in `popup.ts`
- `setPendingReflection(null)` is not being called after resolving

---

### Step 7.6 — Popup size test

```
1. Open the popup
2. Right-click → Inspect
3. In DevTools Elements tab, click the <body> element
4. In the right panel, look at "Computed" styles
```

**What you must see:**
- `width: 320px`
- `min-height: 400px` (actual height may be taller — that is fine)
- No horizontal scrollbar visible in the popup

---

### Step 7.7 — Streak display test

Manually set the streak in Extension Storage to simulate a real streak:

```
1. Open Extension Storage
2. Find the "streak" key
3. Set it to: { "currentStreak": 7, "longestStreak": 14, "lastActiveDate": "2026-03-21" }
4. Close and reopen the popup
```

**What you must see:**
- Streak section shows `7` (or "7-day streak")
- No error in the popup console

---

### Step 7.8 — Build, lint, commit

```powershell
npm run build
npm run lint
git add .
git commit -m "phase-7: popup UI full implementation"
git push origin main
```

---

### ✅ Phase 7 Complete Checklist

```
□ npm run build → zero errors
□ Fresh popup (zero storage) → all values show 0, no errors, no blank screen
□ After real browsing → category bars show correct approximate times
□ Score percentage is mathematically correct (verify manually with formula)
□ Score colour is green for 0–30%, amber for 31–60%, red for 61–100%
□ Reflection card appears when pendingReflection is set in storage
□ Reflection card shows domain name and duration in the message
□ Clicking "Yes" → card disappears, pendingReflection becomes null, history updated with solvedByAI: true
□ Clicking "No" → card disappears, pendingReflection becomes null, history updated with solvedByAI: false
□ Popup width is exactly 320px, no horizontal scrollbar
□ Streak section correctly displays manually set streak value
□ No JavaScript errors in popup console under any test scenario
□ npm run lint → zero errors
□ Git commit pushed
□ Architecture Audit: send the Architecture Audit prompt from PROMPT.md
```

---

## PHASE 8 — Polish, Assets, and Publishing

**What was built:** Extension icons, documentation, and everything needed to submit to the Chrome Web Store.

**Time to verify: approximately 45 minutes**

---

### Step 8.1 — Icon verification

```
1. Open chrome://extensions
2. Look at the StudyLens card
```

**What you must see:**
- A proper icon appears on the card (not a broken image or default puzzle piece)
- The icon is recognisable at small size (the card shows approximately 48×48 pixels)

```
3. Look at the Chrome toolbar
```

**What you must see:**
- The icon in the toolbar is clean and identifiable at 16×16 pixels
- Not blurry, not broken

**Check all three icon files exist:**
```powershell
Test-Path "extension\assets\icon16.png"
Test-Path "extension\assets\icon48.png"
Test-Path "extension\assets\icon128.png"
```
All three must return `True`.

---

### Step 8.2 — README review

Open `README.md` in a text editor or VS Code.

**Check these items exist:**
```
□ Project name: StudyLens
□ One-line description of what it does
□ What the four categories are (AI tools, coding, study, distraction)
□ Privacy statement: "No data leaves your browser"
□ How to install from Chrome Web Store (even if just a placeholder "coming soon")
□ How to install manually for developers (or link to INSTALL.md)
□ Roadmap section mentioning V1, V2, V3
□ Contributing section
□ MIT license mention
```

---

### Step 8.3 — INSTALL.md review

Open `docs/INSTALL.md`.

**Check these items exist:**
```
□ Step-by-step instructions for cloning the repo
□ npm install command
□ npm run build command
□ How to open chrome://extensions
□ How to enable Developer mode
□ How to click "Load unpacked"
□ Which folder to select
□ How to reload after code changes
□ How to open the service worker console
□ How to inspect Extension Storage
```

---

### Step 8.4 — Security and privacy audit

```powershell
# Check for external fetch calls (should return zero results in V1)
Select-String -Path "extension\src\" -Pattern "fetch\(" -Recurse -SimpleMatch

# Check for localStorage (should return zero results)
Select-String -Path "extension\src\" -Pattern "localStorage" -Recurse -SimpleMatch

# Check for inline scripts in HTML
Select-String -Path "extension\src\popup\popup.html" -Pattern "<script" -SimpleMatch
```

**For the fetch check:** Zero results (no external API calls in V1).
**For localStorage:** Zero results.
**For inline scripts:** Exactly ONE result is acceptable — the module script tag that loads `popup.js`. Any additional `<script>` tags with inline code are a violation.

Open `manifest.json` and verify:
```
□ "manifest_version": 3
□ "permissions": ["tabs", "storage", "alarms"]  ← exactly these three, nothing more
□ "host_permissions": []  ← empty
□ "content_security_policy" is present and not empty
```

---

### Step 8.5 — Cross-browser test

**Edge (if installed):**
```
1. Open Microsoft Edge
2. Go to: edge://extensions
3. Enable Developer mode (same toggle as Chrome)
4. Click "Load unpacked" → select extension/ folder
5. Verify it loads without errors
6. Click the icon, verify popup opens and shows "StudyLens"
```

**Brave (if installed):**
```
1. Open Brave browser
2. Go to: brave://extensions
3. Same steps as Edge above
```

All Chromium-based browsers should work identically. If any fail, document the error.

---

### Step 8.6 — Full end-to-end final test

This is the complete user journey from fresh install.

```
1. Clear Extension Storage completely
2. Reload the extension
3. Open the popup → verify all zeros, no errors
4. Visit chatgpt.com for 2 minutes
5. Visit leetcode.com for 2 minutes
6. Visit instagram.com for 1 minute
7. Visit coursera.org for 1 minute
8. Switch to a blank tab
9. Open the popup
10. Verify:
    - Score is approximately 50% (2min AI out of 2min AI + 2min coding + 1min study = 2/5 = 40%)
    - AI bar shows approximately 2m
    - Coding bar shows approximately 2m
    - Study bar shows approximately 1m
    - Distraction bar shows approximately 1m (distraction excluded from score, shown separately)
    - Streak shows 0 (not enough coding/study time to qualify)
    - No reflection prompt (did not reach 30 minutes on AI)
```

---

### Step 8.7 — Pre-publish final checklist

Work through this checklist item by item. This is what you present to the Chrome Web Store reviewer:

```
□ npm run build → zero TypeScript errors, zero warnings
□ npm run lint → zero ESLint errors
□ Extension loads without error banner on chrome://extensions
□ Extension loads without error banner on edge://extensions
□ Popup opens correctly and renders all sections
□ Time tracking works after 60 seconds of active tab use
□ Dependency score updates correctly after switching between category tabs
□ Score colour matches the correct band (green/amber/red)
□ Reflection prompt appears after manually setting pendingReflection in storage
□ Reflection "Yes" button clears prompt and updates history with solvedByAI: true
□ Reflection "No" button clears prompt and updates history with solvedByAI: false
□ Streak counter displays correctly
□ chrome://newtab is not tracked (no entry in storage)
□ chrome://extensions is not tracked (no entry in storage)
□ All three icon files exist (icon16, icon48, icon128)
□ Icons render correctly on the extension card and in the toolbar
□ README.md is complete and accurate
□ INSTALL.md is complete
□ CONTRIBUTING.md exists and mentions how to add site classifications
□ .gitignore is present and excludes node_modules/ and dist/
□ manifest.json permissions: only tabs, storage, alarms
□ manifest.json host_permissions: empty array
□ No fetch() or HTTP calls in any source file
□ No localStorage usage in any source file
□ No inline scripts in popup.html
□ Final commit pushed to GitHub
□ GitHub repository is PUBLIC (check on github.com)
□ Repository has a proper description and topics set (e.g. "chrome-extension", "student-productivity")
```

---

### Step 8.8 — Chrome Web Store submission

```
1. Create a zip file of the extension:
   - Include: dist/, assets/, manifest.json
   - Exclude: src/, node_modules/, tsconfig.json, package.json, package-lock.json
   Run in PowerShell:
   Compress-Archive -Path "extension\dist","extension\assets","extension\manifest.json" -DestinationPath "studylens-v1.0.0.zip"

2. Verify zip is under 10MB:
   Get-Item "studylens-v1.0.0.zip" | Select-Object Length

3. Go to: https://chrome.google.com/webstore/devconsole
4. Pay the one-time $5 developer fee if not already done
5. Click "New item" → upload the zip
6. Fill in the store listing:
   - Name: StudyLens
   - Short description (max 132 chars): "Track your study time and AI dependency. Know exactly how much you practice vs how much you outsource to AI."
   - Category: Productivity
   - Screenshots: at least 1 at 1280×800 showing the popup with real data
   - Privacy practices: "Does not collect or use data" (because all data is local)
7. Submit for review (takes 1–7 business days)
```

---

### Step 8.9 — Git tag

```powershell
git add .
git commit -m "phase-8: assets, docs, publishing prep — V1 complete"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

---

### ✅ Phase 8 Complete Checklist

```
□ All three icon files exist and render correctly in Chrome toolbar and on extension card
□ Extension loads correctly in Edge browser
□ Extension loads correctly in Brave browser (if available)
□ Full end-to-end scenario passes all expected values
□ README.md complete with all required sections
□ INSTALL.md complete with all developer steps
□ Security audit: zero fetch() calls, zero localStorage, only one script tag in popup.html
□ manifest.json permissions exactly: tabs, storage, alarms
□ All pre-publish checklist items checked
□ Chrome Web Store zip created and under 10MB
□ Web Store listing submitted (or prepared and ready to submit)
□ Final git commit and v1.0.0 tag pushed
□ GitHub repository is public
```

---

# ══════════════════════════════════════════════════════
# VERSION 2 — DASHBOARD + PLANNER + REPORTS
# Phases 9 through 13
# Do not begin until the V1 → V2 gate is passed
# ══════════════════════════════════════════════════════

---

## V2 Gate Verification

Before starting any V2 phase, confirm all of these are true:

```
□ StudyLens V1 is LIVE on the Chrome Web Store (has a public store URL)
□ At least 10 real people (not yourself) have installed it
□ You have collected at least 5 pieces of genuine feedback
   (GitHub issues, comments, emails, DMs from real users)
□ All known P0 and P1 bugs from V1 are fixed and a v1.x.x update is live on the store
□ You have decided which V2 feature to build first based on user feedback
```

---

## PHASE 9 — npm Core Package

**What was built:** The four pure logic modules extracted into a publishable npm package `@studylens/core`.

**Time to verify: approximately 20 minutes**

---

### Step 9.1 — Verify the package builds correctly

```powershell
cd J:\Open-Source-Projects\study-lens\core
npm install
npm run build
```

**What you must see:**
- Zero TypeScript errors
- A `core/dist/` folder containing:
  - `index.js` (CommonJS build)
  - `index.mjs` (ES Module build)
  - `index.d.ts` (TypeScript declarations)

---

### Step 9.2 — Verify the package exports

```powershell
cd core
node -e "const { classifySite, calculateDependencyScore, calculateStreak } = require('./dist/index.js'); console.log(classifySite('https://chatgpt.com')); console.log(calculateDependencyScore({ date: '2026-03-21', ai: 3600, coding: 1800, study: 900, distraction: 0, uncategorized: 0 }))"
```

**What you must see:**
```
ai
{ score: 67, label: 'high', aiSeconds: 3600, productiveSeconds: 6300 }
```

---

### Step 9.3 — Verify extension still works after import switch

After updating the extension to import from `@studylens/core` instead of local files:

```powershell
cd extension
npm run build
```

Zero errors. Then reload the extension in Chrome and run the basic tracking test from Phase 6 Step 6.3.

**If the extension breaks after switching imports:**
- The package exports are not correctly named
- A type is missing from the package's `index.ts` re-export
- The package's TypeScript declarations are incorrect

---

### Step 9.4 — Publish and verify

```powershell
cd core
npm publish --access public
```

After publishing:
```powershell
# In a completely new empty folder to verify it installs cleanly
mkdir C:\temp\studylens-test
cd C:\temp\studylens-test
npm init -y
npm install @studylens/core
node -e "const core = require('@studylens/core'); console.log(core.classifySite('https://leetcode.com'))"
```

**What you must see:**
```
coding
```

---

### ✅ Phase 9 Complete Checklist

```
□ core/dist/ contains .js, .mjs, and .d.ts files
□ classifySite exports work correctly from the package
□ calculateDependencyScore exports work correctly from the package
□ Extension imports from @studylens/core and still builds with zero errors
□ Extension tracking still works in Chrome after import switch
□ Package successfully published to npm
□ Installing @studylens/core in a blank folder and importing it works
□ Git commit pushed
```

---

## PHASE 10 — Dashboard Web App

**What was built:** A full-page React dashboard with four pages: Today, Weekly, History, Settings.

**Time to verify: approximately 35 minutes**

---

### Step 10.1 — Open the dashboard from the popup

```
1. Open the popup
2. Find the "Open full dashboard →" link in the popup footer
3. Click it
```

**What you must see:**
- A new Chrome tab opens
- The dashboard loads (a full webpage, not the small popup)
- Navigation tabs are visible: Today, Weekly, History, Settings

**If the link does nothing:**
- `chrome.tabs.create()` is not being called on click
- The dashboard build output is not included in the extension package

---

### Step 10.2 — Today page

```
1. Add some test data first:
   Visit chatgpt.com for 2 minutes, leetcode.com for 3 minutes, youtube.com for 1 minute
2. Open the dashboard → Today page
```

**What you must see:**
- Score gauge showing a visual arc (not just a number)
- Score percentage matches the formula: 2/(2+3+1) = 33% → label: moderate → amber colour
- All four category bars showing correct approximate times with labels
- "Time lost today" counter showing distraction time (if any)
- Reflection history section (may be empty or show recent entries)

---

### Step 10.3 — Weekly page

```
1. Navigate to the Weekly page
```

**What you must see:**
- A 7-day bar chart rendered (Chart.js)
- Today's bar shows some data if you have been testing
- Previous days show zero or whatever you had
- Weekly average score is displayed
- Best day callout is displayed (even if it is just today)

---

### Step 10.4 — History page

```
1. Navigate to the History page
```

**What you must see:**
- A paginated table of daily records
- Today's record appears at the top
- Date, category times, and score label columns are present

**Test CSV export:**
```
1. Click the "Export CSV" button
2. A file download dialog appears
3. Save the file
4. Open it in Notepad or Excel
```

**What you must see in the CSV:**
- A header row: `date,ai_seconds,coding_seconds,study_seconds,distraction_seconds,dependency_score,score_label`
- Today's data row below it with correct values

---

### Step 10.5 — Settings page

```
1. Navigate to the Settings page
```

**Test custom site addition:**
```
1. Type "newsite.com" in the domain field
2. Select "study" from the category dropdown
3. Click "Add"
4. Verify "newsite.com" appears in the custom sites list
5. Open a new tab and navigate to: https://newsite.com
6. Open Extension Storage
7. Verify today's "study" seconds increased (may need to wait for a tick or tab switch)
```

**Test data reset:**
```
1. Click "Reset all data"
2. A confirmation dialog appears
3. Click "Cancel" → data is NOT cleared
4. Click "Reset all data" again → click "Confirm"
5. Open Extension Storage → everything is cleared to defaults
```

**Important:** After the reset test, add some fresh data before testing other phases.

---

### ✅ Phase 10 Complete Checklist

```
□ Dashboard opens from popup footer link
□ Today page: score gauge renders correctly with correct percentage
□ Today page: all four category bars show correct times
□ Today page: score colour matches the correct band
□ Weekly page: 7-day bar chart renders without errors
□ Weekly page: weekly average score is displayed
□ History page: today's record appears
□ History page: CSV export downloads a valid file with correct headers and data
□ Settings page: custom site addition works and affects tracking
□ Settings page: data reset clears storage after confirmation
□ Settings page: cancel on reset does NOT clear data
□ Git commit pushed
```

---

## PHASE 11 — Study Planner

**What was built:** Daily coding and study goals with progress tracking in both the popup and dashboard.

**Time to verify: approximately 20 minutes**

---

### Step 11.1 — Set goals in dashboard Settings

```
1. Open dashboard → Settings
2. Set coding goal to: 60 minutes
3. Set study goal to: 90 minutes
4. Goals save automatically or click "Save"
5. Open Extension Storage → verify goals object:
   { "coding": 60, "study": 90, "aiCeiling": [whatever default is] }
```

---

### Step 11.2 — Verify progress in popup

```
1. Visit leetcode.com for 30 minutes (or simulate by setting coding seconds to 1800 in storage)
2. Open the popup
```

**What you must see below the Coding category bar:**
- `Coding: 30m / 1h goal` or similar format
- A progress bar or indicator showing 50%
- Colour should be AMBER (30m out of 60m goal = 50% — behind schedule)

**Test goal met (green):**
```
Set coding seconds in storage to 3300 (55 out of 60 minutes = 92% of goal)
Open popup
```

**What you must see:**
- Coding progress is GREEN (≥80% of goal)

---

### Step 11.3 — Verify goals persist after browser restart

```
1. Close Chrome completely
2. Reopen Chrome
3. Open Extension Storage
4. Verify goals are still: { coding: 60, study: 90, ... }
```

**What you must see:**
- Goals are unchanged after browser restart (stored in `chrome.storage.local`, persists)

---

### ✅ Phase 11 Complete Checklist

```
□ Goals set in Settings page are saved to Extension Storage
□ Popup shows progress bar/indicator below coding and study bars
□ Progress is green when ≥80% of goal is met
□ Progress is amber when 50–79% of goal is met
□ Progress is red when <50% of goal is met
□ Goals persist after closing and reopening Chrome
□ Git commit pushed
```

---

## PHASE 12 — Detox Mode

**What was built:** Voluntary site blocking during a focus session. Distraction sites redirect to a "focus mode" page.

**Time to verify: approximately 20 minutes**

⚠️ **Warning:** This phase actively blocks sites. Test this carefully. If blocking is too aggressive, you may find yourself unable to navigate the browser properly. Keep the Chrome DevTools open so you can disable the extension if needed.

---

### Step 12.1 — Start a short detox session

```
1. Open the popup
2. Find the "Start focus session" button
3. Configure: 5 minutes, block: distraction only
4. Click Start
5. The popup should show a countdown: "Focus mode active — 4:58 remaining"
```

---

### Step 12.2 — Test blocking

```
1. Open a new tab
2. Navigate to: https://instagram.com
```

**What you must see:**
- You are redirected to the StudyLens detox page (NOT instagram.com)
- The detox page shows a message like "Focus mode active"
- A countdown timer shows remaining time

---

### Step 12.3 — Test allowed sites

```
1. Navigate to: https://leetcode.com
```

**What you must see:**
- LeetCode loads normally (coding category is NOT blocked)
- The detox session continues running

---

### Step 12.4 — Test cancel

```
1. Open the popup during an active detox session
2. Click "Cancel" or "End early"
3. A confirmation dialog appears
4. Click "Confirm"
5. Navigate to: https://instagram.com
```

**What you must see:**
- Instagram loads normally after cancelling (blocking is removed immediately)

---

### Step 12.5 — Test automatic expiry

```
1. Start a new 1-minute detox session (edit the duration to 1 minute temporarily)
2. Wait 70 seconds
3. Navigate to: https://instagram.com
```

**What you must see:**
- After the session expires, instagram.com loads normally without redirecting

---

### ✅ Phase 12 Complete Checklist

```
□ Starting a detox session shows countdown in popup
□ Visiting a distraction site (instagram.com) during detox → redirected to detox page
□ Visiting a coding site (leetcode.com) during detox → loads normally
□ Cancelling detox → distraction sites load normally immediately
□ Detox session expires automatically → distraction sites load normally
□ Detox page shows correct remaining time countdown
□ Git commit pushed
```

---

## PHASE 13 — Enhanced Streak and Weekly Report

**What was built:** Improved streak logic (requires 30 min of real practice), flame indicator, and a weekly report that appears every Sunday.

**Time to verify: approximately 20 minutes**

---

### Step 13.1 — Verify improved streak logic

**Test: streak requires 30 min of coding or study, not just any activity**

```
1. Clear Extension Storage
2. Set today's record: ai=7200, coding=600, study=0 (2 hours AI, only 10 min coding)
3. Trigger streak update (visit any site, then come back)
4. Open popup
```

**What you must see:**
- Streak shows 0 or "Start your streak today"
- The streak did NOT increment because 10 minutes of coding does not meet the 30-minute threshold

**Test: streak increments with sufficient practice:**
```
1. Set today's record: ai=1800, coding=2400, study=0 (30 min AI, 40 min coding)
2. Set streak: { currentStreak: 4, longestStreak: 10, lastActiveDate: "yesterday's date" }
3. Trigger streak update
4. Open popup
```

**What you must see:**
- Streak shows 5 (incremented because 40 min coding ≥ 30 min threshold)
- longestStreak still shows 10 (5 did not beat the record of 10)

---

### Step 13.2 — Verify weekly report generation

The weekly report fires every Sunday at 20:00. You cannot wait until Sunday to test it. Instead, manually trigger it:

Tell the agent: "Temporarily fire the weekly report generation function manually from the service worker console."

Alternatively, set the alarm to fire in 1 minute:
```
In the service worker console (DevTools):
chrome.alarms.create('weeklyReport', { delayInMinutes: 0.1 })
```

Wait 6 seconds, then open the popup.

**What you must see:**
- The popup shows a "Weekly Review" view instead of the normal today view
- The view shows total hours per category for the week
- A "Share" button is visible

---

### Step 13.3 — Test the share card

```
1. In the weekly report view, click "Share"
2. Text is copied to clipboard (or appears in a text box)
3. Paste it into Notepad
```

**What you must see:**
- A short sentence containing: week dates, total study time, dependency score percentage, streak number
- No placeholder text like "[INSERT VALUE HERE]"
- Grammatically correct English

---

### ✅ Phase 13 Complete Checklist

```
□ Streak does NOT increment when coding+study time is under 30 minutes
□ Streak DOES increment when coding+study time is 30+ minutes
□ Streak shows flame indicator for streaks of 3+
□ longestStreak updates correctly when current exceeds it
□ Weekly report generates with correct weekly totals
□ Weekly report shows correct category breakdowns
□ Share card text is grammatically correct and contains real data (no placeholders)
□ Git commit pushed
```

---

# ══════════════════════════════════════════════════════
# VERSION 3 — CLOUD SYNC + PROFILES + BACKEND
# Phases 14 through 16
# Do not begin until the V2 → V3 gate is passed
# ══════════════════════════════════════════════════════

---

## V3 Gate Verification

```
□ @studylens/core is published on npm and has at least a few external downloads
□ Dashboard is live and linked from the popup
□ V2 has been stable for at least 4 weeks (no critical bugs reported)
□ At least 3 different users have explicitly requested cross-device sync
□ You have read and understood GDPR Article 17 (right to deletion) — documented in FUTURE.md §12
□ Privacy audit of V2 has been completed (see FUTURE.md §12.1)
```

---

## PHASE 14 — Backend API

**What was built:** A Node.js + Supabase REST API that enables optional cloud sync.

**Time to verify: approximately 45 minutes**

---

### Step 14.1 — Environment setup verification

```powershell
cd J:\Open-Source-Projects\study-lens\backend
npm install
```

Check all required environment variables are set in `.env`:
```
NODE_ENV
PORT
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
```

```powershell
npm run dev
```

**What you must see:**
- Server starts on the configured port (e.g. 3000)
- No errors about missing environment variables
- Log line: "Server running on port 3000" or similar

---

### Step 14.2 — Test auth endpoints with a REST client

Use either PowerShell's `Invoke-RestMethod` or install a tool like Postman.

**Test signup:**
```powershell
$body = '{"email":"test@example.com","password":"TestPassword123!"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

**What you must see:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": { "user": { "id": "...", "email": "test@example.com" } }
}
```

**Test login:**
```powershell
$body = '{"email":"test@example.com","password":"TestPassword123!"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.accessToken
```

**What you must see:**
- `success: true`
- An `accessToken` string in the data

---

### Step 14.3 — Test records sync endpoint

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = '{"records":[{"date":"2026-03-21","ai":3600,"coding":1800,"study":900,"distraction":600,"uncategorized":0}]}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/records/sync" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

**What you must see:**
```json
{
  "success": true,
  "message": "Records synced",
  "data": { "synced": 1, "skipped": 0 }
}
```

---

### Step 14.4 — Test records retrieval

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/records?from=2026-03-01&to=2026-03-31" -Method GET -Headers $headers
```

**What you must see:**
- The record you just synced appears in the response
- Values match what you sent

---

### Step 14.5 — Test GDPR deletion endpoint

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/user" -Method DELETE -Headers $headers
```

**What you must see:**
```json
{ "success": true, "message": "Account and all data deleted successfully" }
```

**Verify in Supabase dashboard:**
- Log into your Supabase project
- Open the database table browser
- Verify the `daily_records` table has no rows for the deleted user
- Verify the `user_profiles` table has no row for the deleted user

---

### ✅ Phase 14 Complete Checklist

```
□ Backend server starts without errors
□ All required environment variables are loaded
□ POST /api/v1/auth/signup creates a user in Supabase Auth
□ POST /api/v1/auth/login returns a valid access token
□ POST /api/v1/records/sync successfully upserts a daily record
□ GET /api/v1/records returns the synced record with correct values
□ DELETE /api/v1/user deletes all user data from Supabase (verified in dashboard)
□ All responses follow the frozen API contract: { success, message, data }
□ Git commit pushed
```

---

## PHASE 15 — Multi-device Sync in Extension

**What was built:** Login/signup UI in the dashboard, JWT stored in extension storage, automatic sync on the daily alarm.

**Time to verify: approximately 30 minutes — requires TWO Chrome profiles or TWO computers**

---

### Step 15.1 — Login flow in dashboard

```
1. Open the dashboard → Settings (or new Auth page)
2. Enter your email and password
3. Click "Login" or "Sign in"
```

**What you must see:**
- A success message: "Logged in as [your email]"
- In Extension Storage: `auth.accessToken` is now populated, `auth.syncEnabled` is true

---

### Step 15.2 — Manual sync test

```
1. Study for a few minutes (visit leetcode.com for 2 minutes)
2. Open dashboard → find "Sync now" button or wait for the daily alarm
3. Click "Sync now"
```

**What you must see:**
- "Synced successfully" message appears
- In Supabase dashboard → database → daily_records table, today's record appears

---

### Step 15.3 — Cross-device test

This requires a second Chrome profile or a second computer.

```
DEVICE A (or Chrome profile 1):
1. Log in with your account
2. Study for 5 minutes
3. Sync

DEVICE B (or Chrome profile 2):
1. Install the extension
2. Log in with the SAME account
3. Open the dashboard → History page
```

**What you must see on Device B:**
- Device A's 5-minute session appears in the History (fetched from the backend on login)

---

### Step 15.4 — Test account deletion from extension

```
1. Open dashboard → Settings
2. Click "Delete my account and all data"
3. Confirm
```

**What you must see:**
- Auth is cleared from Extension Storage: `auth.accessToken` is null
- Local storage is cleared (all records gone)
- Extension returns to "not logged in" state
- In Supabase: user no longer exists

---

### ✅ Phase 15 Complete Checklist

```
□ Login stores accessToken in Extension Storage
□ Popup shows "Synced X minutes ago" after a successful sync
□ Records appear in Supabase database after sync
□ Data from Device A appears in Device B's history after login (cross-device sync works)
□ Sync fails gracefully when offline (shows error message, does not crash)
□ "Delete account" removes all data from Supabase AND clears local storage
□ Extension works 100% offline without any sync-related errors
□ Git commit pushed
```

---

## PHASE 16 — Topic Tagging and Pattern Analysis

**What was built:** URL pattern matching to tag sessions with topic labels. Weakness detection based on AI dependency ratio per topic.

**Time to verify: approximately 20 minutes**

---

### Step 16.1 — Test topic tagging

```
1. Navigate to: https://leetcode.com/problems/coin-change/
2. Stay for 30 seconds
3. Open Extension Storage
```

**What you must see:**
- In the session data or topic records: a tag like `"dynamic-programming"` associated with this session
- The tag was derived from the URL path pattern, not the page content

---

### Step 16.2 — Test weakness flag in dashboard

You need to simulate high AI usage on one topic:

```
1. Manually set topicRecords in storage:
   {
     "dynamic-programming": {
       "topic": "dynamic-programming",
       "totalAiSeconds": 7200,
       "totalCodingSeconds": 3600,
       "totalStudySeconds": 0,
       "sessionCount": 10,
       "weaknessFlag": false
     }
   }
2. Open the dashboard
```

**What you must see:**
- A warning card appears mentioning "dynamic-programming" as a potential weakness
- The card explains that AI usage is high relative to direct practice on this topic
- The card is non-intrusive (not a modal or popup — just an inline card)

---

### Step 16.3 — Verify no page content is read

```powershell
# This grep must return zero results — topic tagging must use URL patterns only
Select-String -Path "extension\src\" -Pattern "tab\.title\|innerHTML\|textContent\|document\.body" -Recurse -SimpleMatch
```

Zero results. Topic tagging must use URL patterns only — never page content.

---

### ✅ Phase 16 Complete Checklist

```
□ Visiting leetcode.com/problems/* → session is tagged with the correct topic
□ Topic records appear in Extension Storage with correct time accumulation
□ Dashboard shows weakness flag card when AI dependency on a topic exceeds 70%
□ Dashboard shows top topics by time spent
□ grep for page content access (title, innerHTML, textContent) → zero results
□ Topics work for all URL patterns defined in classifier.ts
□ Git commit pushed
```

---

# ══════════════════════════════════════════════════════
# CROSS-VERSION REGRESSION TESTS
# Run these after completing any phase that modifies storage or background.ts
# ══════════════════════════════════════════════════════

---

## Regression Test Suite

Run this mini test suite after every phase that touches `background.ts`, `storage.ts`, or `StorageSchema`:

```
REGRESSION-01: Fresh install
  Clear all data → reload extension → popup opens with all zeros → no console errors
  Expected: PASS

REGRESSION-02: Basic tracking
  Visit chatgpt.com 30 seconds → visit leetcode.com → check storage.ai ≈ 30
  Expected: PASS

REGRESSION-03: Score formula
  ai=3600, coding=3600, study=1800 in storage → open popup → score ≈ 40%
  Expected: PASS

REGRESSION-04: Reflection prompt
  Set pendingReflection in storage → open popup → card appears → click Yes → card gone
  Expected: PASS

REGRESSION-05: Storage persistence
  Add data → close Chrome completely → reopen Chrome → check data is still there
  Expected: PASS

REGRESSION-06: Non-trackable URLs
  Navigate to chrome://extensions → check console shows NO "Tracking" log
  Expected: PASS

REGRESSION-07: Permissions unchanged
  Open manifest.json → verify: "permissions": ["tabs", "storage", "alarms"] only
  Expected: PASS
```

---

## Emergency Recovery

**If the extension stops loading entirely:**
```
1. chrome://extensions → find StudyLens → toggle it OFF
2. Run: npm run build in PowerShell
3. Fix any TypeScript errors the agent introduces
4. chrome://extensions → toggle it back ON → click ↺ reload
```

**If chrome.storage.local becomes corrupted:**
```
1. Open any tab → DevTools → Application → Extension Storage
2. Right-click your extension → Clear
3. Reload the extension
4. Data resets to defaults
5. Re-run the phase from where you were
```

**If the popup stops opening:**
```
1. Right-click the extension icon → Inspect popup
2. If DevTools do not open, the popup has a fatal JavaScript error at load time
3. Check the Elements tab — if the popup HTML is empty, popup.ts crashed before rendering
4. Open the popup console and look for the first red error
5. Copy the full error and paste it to the agent
```

**If the service worker crashes:**
```
1. chrome://extensions → StudyLens card → click "Service Worker"
2. If it shows "Inactive" and clicking does nothing, the service worker crashed
3. Click the ↺ reload icon on the extension card to restart it
4. Immediately reopen the service worker console
5. Look for the crash error and copy it to the agent
```