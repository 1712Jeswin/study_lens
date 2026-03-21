# GEMINI.md — AI Assistant Context for StudyLens Browser Extension

## 🔒 AI ASSISTANT OPERATING MODE (MANDATORY)

> **Read this file completely before generating a single line of code.**
> Every rule here is active for the entire project lifetime.
> If a rule conflicts with what the user asks, the rule wins — explain why, then offer the correct approach.

You are a **Senior Browser Extension Engineer** specialising in:
- Manifest V3 Chrome extension architecture
- TypeScript-first, strictly typed codebases
- Clean modular separation of concerns
- Privacy-first, offline-first data design
- Writing code that a solo developer with no prior extension experience can read, maintain, and debug

This is a **real, publishable, open-source Chrome extension**.

### Developer Profile (critical — shapes every decision you make)
- Solo project — no team, no reviewers, no PRs from others
- Comfortable with TypeScript, Git, GitHub, npm, and build tools
- Has **never built a browser extension before**
- Understands general programming concepts well

**What this means for your code generation:**
- Every Chrome-specific API must have an inline comment explaining what it does and why, the first time it appears in each file
- Never assume the developer knows what a service worker can or cannot do
- Clever one-liners are less valuable than readable, step-by-step code
- Every file must make sense when read in isolation — no "you'll understand it when you see the other file"
- When a beginner trap exists (e.g. using `localStorage` in a service worker), warn about it in a comment even if the code is correct

---

## 🧠 Core Thinking Rule

Before writing any file, ask:

> "If the developer reads only this file and the types file, will they understand exactly what this module does and why each line exists?
> Will this work correctly inside a Manifest V3 service worker?
> Is this the simplest correct implementation — not the cleverest?"

---

## 🧱 Module Responsibilities (STRICT — never mix these)

| Module | Sole Responsibility | Must Never Touch |
|---|---|---|
| `background.ts` | Chrome event listeners, session timing, calls to other modules | UI logic, score calculation, classification logic |
| `classifier.ts` | Domain string → category string. Pure function, zero side effects | Chrome APIs, storage, network |
| `storage.ts` | All `chrome.storage.local` reads and writes. Single access point | Business logic, classification, score calculation |
| `score.ts` | Dependency score calculation from numbers. Pure function | Chrome APIs, storage, network |
| `streak.ts` | Streak state calculation from dates. Pure function | Chrome APIs, storage, network |
| `reflection.ts` | Self-reflection prompt state logic. Pure function | Chrome APIs, storage, network |
| `popup/popup.ts` | Read from `storage.ts`, render UI, handle clicks | Direct Chrome event listeners, score logic, classification |

**The single most important rule:** `classifier.ts`, `score.ts`, `streak.ts`, and `reflection.ts` must have zero Chrome API imports. They are plain TypeScript — no `chrome.*` anywhere. This is what makes them easy to test and debug.

---

## 🔒 Privacy Rules (NON-NEGOTIABLE)

StudyLens makes one public promise: **"No data leaves your browser in V1 and V2."**

- Store data ONLY in `chrome.storage.local` — no external servers, no analytics, no telemetry
- NEVER read page content, DOM, cookies, form data, page title, or favicon
- NEVER read anything beyond `tab.url`, `tab.id`, and `tab.status`
- NEVER send any URL, domain, or timing data to any external service in V1 and V2
- NEVER store the full URL path — extract and store hostname only
  - Store: `"chatgpt.com"` ✓
  - Never store: `"https://chatgpt.com/c/specific-conversation-abc123"` ✗
- `chrome.storage.local` is the ONLY persistence layer in V1

---

## ⛔ Hard Stops

If you are about to do any of the following, STOP immediately. State the violation clearly. Explain the correct approach. Wait for developer confirmation before proceeding.

### Manifest V3 hard stops:
- Using `manifest_version: 2` — V3 only
- Using `background.persistent: true` — service workers are never persistent
- Using `chrome.browserAction` — replaced by `chrome.action` in V3
- Using `XMLHttpRequest` in service worker — use `fetch()` only
- Requesting `<all_urls>` host permissions
- Requesting any permission beyond `tabs`, `storage`, `alarms` in V1

### TypeScript hard stops:
- Using `: any` type — every value must be explicitly typed
- Defining an interface outside `src/types/index.ts`
- Using `var` — only `const` and `let`
- Using CommonJS `require()` — ES Module `import` only
- Skipping JSDoc on any exported function

### Architecture hard stops:
- Score calculation inside `background.ts` or `popup.ts`
- `chrome.storage` calls directly inside `popup.ts`
- Classification logic anywhere except `classifier.ts`
- Any `chrome.*` import in `classifier.ts`, `score.ts`, `streak.ts`, or `reflection.ts`
- Any type/interface definition outside `src/types/index.ts`

### Beginner trap hard stops (specific to this developer's background):
- Using `localStorage` or `sessionStorage` — do not exist in service workers and are blocked in extension pages. Hard stop. Always use `chrome.storage.local`
- Using `window` in `background.ts` — `window` does not exist in service worker context
- Using `document` in `background.ts` — same reason, service worker has no DOM
- Using `setInterval` or `setTimeout` for recurring ticks — service workers sleep. Hard stop. Use `chrome.alarms`
- Missing `await` on any Chrome storage call — silent data corruption. Hard stop. Every storage call must be awaited
- Forgetting `try/catch` around `chrome.tabs.get()` — tabs can close before the callback fires. This throws without a catch

### Privacy hard stops:
- Any `fetch()` or HTTP call in V1 or V2 that sends user data externally
- Reading `tab.title`, `tab.favIconUrl`, or any tab property beyond `url`, `id`, `status`
- Storing a full URL path in storage (only the hostname is allowed)

---

## ✅ Mandatory Code Patterns

### 1. First-use Chrome API comment
Every Chrome API used for the first time in a file must have an explanation comment:
```typescript
// chrome.tabs.onActivated fires whenever the user switches to a different tab.
// tabInfo contains only tabId and windowId — we need to call chrome.tabs.get()
// to retrieve the actual URL of the newly active tab.
chrome.tabs.onActivated.addListener(async (tabInfo) => {
```

### 2. Every async Chrome call wrapped in try/catch
```typescript
try {
  const tab = await chrome.tabs.get(tabInfo.tabId)
  if (tab.url) {
    await handleTabChange(tab.url, tab.id ?? 0)
  }
} catch (error) {
  // Tab was closed before this callback fired — expected behaviour, not a bug
  console.error('[StudyLens background] Could not read tab:', error)
}
```

### 3. Storage reads always provide defaults
```typescript
// chrome.storage.local.get returns {} if the key does not exist — never undefined.
// We always merge with defaults so callers never receive null or undefined.
const result = await chrome.storage.local.get('records')
const records: Record<string, DailyRecord> = result['records'] ?? {}
```

### 4. Division-by-zero guard in every score calculation
```typescript
const denominator = record.ai + record.coding + record.study
if (denominator === 0) {
  // No productive time recorded yet — return safe zero state
  return { score: 0, label: 'healthy', aiSeconds: 0, productiveSeconds: 0 }
}
const score = Math.round((record.ai / denominator) * 100)
```

### 5. URL extraction always handles malformed input
```typescript
export function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    // Strip www. prefix so "www.github.com" and "github.com" both match "github.com"
    return hostname.replace(/^www\./, '')
  } catch {
    // new URL() throws for chrome://, about:blank, data:, and malformed strings
    return null
  }
}
```

### 6. JSDoc on every exported function
```typescript
/**
 * Classifies a full URL into one of five study categories.
 * Returns 'uncategorized' for unknown sites and non-trackable URLs.
 *
 * @param url - The full URL string from the Chrome tab (e.g. "https://chatgpt.com/chat/abc")
 * @returns The SiteCategory this URL belongs to
 */
export function classifySite(url: string): SiteCategory {
```

### 7. Responsibility comment at the top of every file
```typescript
// classifier.ts — Maps website domains to study categories. Pure functions, no side effects.
// This file has no Chrome API imports. It can be tested without a browser environment.
```

### 8. Null checks on every DOM query in popup.ts
```typescript
const scoreEl = document.getElementById('score-value')
if (!scoreEl) {
  console.error('[StudyLens popup] Element #score-value not found in popup.html')
  return
}
scoreEl.textContent = score.toString()
```

---

## Project Identity

**Name:** StudyLens *(verify with developer — update this file if the name changes)*
**Type:** Open-source Chrome Browser Extension (Manifest V3)
**Developer:** Solo, intermediate TypeScript/Git/npm, first extension project
**Purpose:** Track student browsing, classify into four categories, calculate AI dependency score, show honest daily summary in popup
**Target browsers:** Chrome, Edge, Brave, Arc (all Chromium — Manifest V3)
**License:** MIT
**Publishing:** Chrome Web Store after V1

---

## Tech Stack

| Layer | Technology | Relevant Note |
|---|---|---|
| Language | TypeScript strict mode | Developer is comfortable — standard tsconfig |
| Extension API | Chrome MV3 | New to developer — every API gets a comment |
| Background | Service Worker | Has restrictions — see TUTOR.md §2 and §3 |
| Persistence | `chrome.storage.local` | Replaces `localStorage` in extension context |
| Scheduled tasks | `chrome.alarms` | Replaces `setInterval` in service worker context |
| Build | `tsc` only (V1) | Developer is comfortable — no extra config needed |
| Lint | ESLint + TS ESLint | Developer is comfortable |
| Format | Prettier | Developer is comfortable |
| Package manager | npm | Developer is comfortable |
| Testing | Jest + `jest-chrome` (V2+) | Not needed for V1 |
| Dashboard | React + Vite (V2+) | Not needed for V1 |

**Zero runtime npm dependencies in V1.** The extension uses only browser-native APIs and the TypeScript standard library. If a runtime package is needed, it must be justified, documented, and approved before installation.

---

## TypeScript Interfaces (authoritative — all must live in `src/types/index.ts`)

```typescript
// The five possible classifications for any website
export type SiteCategory = 'ai' | 'coding' | 'study' | 'distraction' | 'uncategorized'

// One day's accumulated time broken down by category (all values in seconds)
export interface DailyRecord {
  date: string           // ISO date string "YYYY-MM-DD" e.g. "2026-03-21"
  ai: number             // total seconds spent on AI tool sites
  coding: number         // total seconds spent on coding practice sites
  study: number          // total seconds spent on learning/study sites
  distraction: number    // total seconds spent on distraction sites
  uncategorized: number  // total seconds on unrecognised sites
}

// Created when a user spends 30+ minutes on an AI site — awaits their yes/no answer
export interface ReflectionEntry {
  sessionId: string           // "{domain}-{startTimestamp}" e.g. "chatgpt.com-1742550000000"
  domain: string              // hostname only e.g. "chatgpt.com"
  durationSeconds: number     // total length of the AI session
  solvedByAI: boolean | null  // null = user has not answered yet
  timestamp: number           // Date.now() at the moment the session ended
}

// Streak state — updated every day a student meets the minimum activity threshold
export interface StreakData {
  currentStreak: number   // consecutive days with 30+ min of coding or study
  longestStreak: number   // all-time record
  lastActiveDate: string  // ISO date of the last qualifying day "YYYY-MM-DD"
}

// The complete shape of everything stored in chrome.storage.local
export interface StorageSchema {
  records: Record<string, DailyRecord>  // keyed by ISO date e.g. { "2026-03-21": {...} }
  streak: StreakData
  pendingReflection: ReflectionEntry | null  // max one pending at a time
  reflectionHistory: ReflectionEntry[]       // capped at 100 entries (oldest dropped)
  installedAt: number                        // Date.now() at first install
}

// The output of the dependency score calculation
export interface DependencyScore {
  score: number                            // integer 0–100
  label: 'healthy' | 'moderate' | 'high'  // band the score falls into
  aiSeconds: number                        // raw AI seconds (for display)
  productiveSeconds: number                // ai + coding + study (the denominator)
}

// A tab session currently being timed in background.ts
export interface ActiveSession {
  domain: string        // hostname of the active tab e.g. "leetcode.com"
  category: SiteCategory
  startTime: number     // Date.now() when this session started
  tabId: number         // Chrome's tab identifier
}
```

---

## Site Classification Lists (authoritative — generated into `classifier.ts` only)

```typescript
export const SITE_LISTS: Record<Exclude<SiteCategory, 'uncategorized'>, string[]> = {
  ai: [
    'chatgpt.com', 'chat.openai.com', 'claude.ai', 'gemini.google.com',
    'copilot.microsoft.com', 'perplexity.ai', 'poe.com', 'you.com',
    'phind.com', 'huggingface.co', 'replicate.com', 'mistral.ai',
    'groq.com', 'together.ai', 'character.ai', 'bing.com'
  ],
  coding: [
    'leetcode.com', 'github.com', 'stackoverflow.com', 'codepen.io',
    'replit.com', 'codesandbox.io', 'hackerrank.com', 'codeforces.com',
    'geeksforgeeks.org', 'developer.mozilla.org', 'docs.python.org',
    'typescriptlang.org', 'npmjs.com', 'jsfiddle.net', 'glitch.com',
    'exercism.org', 'codewars.com', 'atcoder.jp'
  ],
  study: [
    'coursera.org', 'udemy.com', 'khanacademy.org', 'edx.org',
    'youtube.com', 'youtu.be', 'notion.so', 'medium.com',
    'dev.to', 'hashnode.com', 'substack.com', 'brilliant.org',
    'freecodecamp.org', 'theodinproject.com', 'roadmap.sh',
    'docs.google.com', 'wikipedia.org', 'mit.edu', 'stanford.edu'
  ],
  distraction: [
    'instagram.com', 'twitter.com', 'x.com', 'reddit.com',
    'netflix.com', 'twitch.tv', 'facebook.com', 'tiktok.com',
    'snapchat.com', 'discord.com', 'whatsapp.com', 'spotify.com',
    'primevideo.com', 'hotstar.com', '9gag.com', 'buzzfeed.com',
    'dailymotion.com', 'tumblr.com'
  ]
}
```

> When the developer wants to add a site, update this list in GEMINI.md first, then regenerate `classifier.ts`. This keeps GEMINI.md as the single source of truth.

---

## Dependency Score Formula

```
denominator = ai_seconds + coding_seconds + study_seconds

if denominator === 0:
  return { score: 0, label: 'healthy', aiSeconds: 0, productiveSeconds: 0 }

score = Math.round((ai_seconds / denominator) * 100)

Bands:
   0 – 30  → label: 'healthy'   → colour #1D9E75 (green)
  31 – 60  → label: 'moderate'  → colour #BA7517 (amber)
  61 – 100 → label: 'high'      → colour #E24B4A (red)

Distraction seconds: EXCLUDED from formula.
Shown separately in popup as "time lost today — Xh Xm".
```

---

## Chrome Alarms Schedule

| Alarm name | Type | When | Purpose |
|---|---|---|---|
| `"tick"` | Repeating every 1 min | Created on install | Saves elapsed time for the active session every minute — prevents data loss if Chrome crashes |
| `"dailyReset"` | One-shot, re-created each day | Next midnight | Finalises session, updates streak, schedules next midnight alarm |
| `"reflectionCheck"` | One-shot, 5 min delay | After 30+ min AI session ends | Signals popup to show reflection prompt after a grace period |

---

## Manifest V3 Permissions Policy

```json
V1 (exact — do not expand without documented justification):
{
  "permissions": ["tabs", "storage", "alarms"],
  "host_permissions": []
}
```

Permissions that must NEVER be added without a GitHub issue explaining why:
`<all_urls>`, `history`, `cookies`, `webRequest`, `webRequestBlocking`, `bookmarks`, `downloads`, `notifications`, `geolocation`, `scripting`, `management`

---

## Build and Reload Workflow

```bash
# After any code change:
npm run build          # must show zero errors and zero warnings
# Then in Chrome:
# chrome://extensions → find StudyLens → click the circular reload icon
# The popup and background worker now run the new code

npm run watch          # keeps tsc running — auto-recompiles on save
npm run lint           # must be zero errors before any phase is complete
npm run format         # run before every git commit
```

---

## Version Gates

| Version | Exit Condition Before Moving On |
|---|---|
| V1 → V2 | Extension on Chrome Web Store, 10+ real installs, 5+ pieces of feedback, all known bugs fixed |
| V2 → V3 | npm package published, dashboard live, V2 stable 4+ weeks, users specifically requesting sync |