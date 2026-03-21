# runflow.md — Developer Runflow Guide

> This document controls how you operate the AI coding agent session by session.
> It is written for a solo developer who is comfortable with TypeScript and Git but has never built a browser extension.
> Read this completely before opening the agent for the first time.

---

## The Three Laws of This Workflow

**Law 1 — One phase at a time.**
Never paste Phase 3 instructions while Phase 2 is still being built. The agent will try to future-proof code for phases it has not seen yet, and that breaks everything.

**Law 2 — You verify, not the agent.**
The agent cannot load the extension in Chrome and click things. Only you can. Every phase has a manual verification checklist. You run it, you check the boxes, you decide when to proceed.

**Law 3 — GEMINI.md is the rulebook.**
If the agent ever generates something that violates a rule in `GEMINI.md`, stop it immediately. Use the Hard Stop Recovery Prompt below.

---

## Before Your First Session — One-Time Setup

Do these things before you open the agent for the first time:

```bash
# 1. Create the GitHub repository
Go to github.com → New repository → name it "studylens" → Public → MIT license → Create

# 2. Clone it locally
git clone https://github.com/YOUR_USERNAME/studylens.git
cd studylens

# 3. Create the folder structure manually
mkdir -p extension/src/types extension/src/popup extension/assets docs instructions .github/ISSUE_TEMPLATE

# 4. Copy the instruction files into instructions/
# (GEMINI.md, instructions.md, runflow.md, security.md, TUTOR.md)

# 5. Initial commit
git add . && git commit -m "init: folder structure and instruction files"
git push origin main

# 6. Verify Chrome is ready for extension development
Open chrome://extensions
Toggle "Developer mode" ON (top-right)
Confirm you see the "Load unpacked" button appear
```

You are now ready to open the agent.

---

## Step 1 — Lock the Agent (Send This at the Start of Every Session)

Every time you start a new chat with the agent, paste this **exactly** before anything else:

```
You are helping me build StudyLens — an open-source Chrome browser extension (Manifest V3).
I am a solo developer comfortable with TypeScript and Git but I have never built a browser extension before.

Read GEMINI.md completely before writing any code.
Read instructions.md completely before writing any code.

Rules:
- Build one phase at a time only
- Do not generate code for future phases
- Do not combine phases
- Every Chrome API you use must have an inline comment explaining what it does
- Every exported function must have JSDoc
- No any types, no var, no CommonJS require(), no localStorage
- All interfaces live in src/types/index.ts only
- classifier.ts, score.ts, streak.ts, and reflection.ts must have zero chrome.* imports

Currently building: Phase [INSERT NUMBER] — [INSERT PHASE NAME]

Wait for my explicit confirmation before moving to the next phase.
If you hit a Hard Stop from GEMINI.md, stop immediately, state the violation, explain the correct approach, and wait.

Confirm you have read both files before I paste the phase instructions.
```

Replace `[INSERT NUMBER]` and `[INSERT PHASE NAME]` with the actual phase before sending.

---

## Step 2 — Paste the Phase Instructions

1. Open `instructions.md`
2. Find the current phase section (e.g. `## Phase 2 — Classifier Module`)
3. Copy the entire phase — from the heading to the verification checkpoint
4. Paste it into the agent after the locking prompt
5. Wait for the agent to generate all files
6. Do not interrupt mid-generation

---

## Step 3 — After Files Are Generated (Before Testing Yourself)

Ask the agent this validation prompt before you touch Chrome:

```
Review everything you just generated for Phase [NUMBER].

Check each file and confirm:
- npm run build would pass with zero errors
- No `: any` types present anywhere
- No `var` declarations
- No `chrome.*` imports in classifier.ts, score.ts, streak.ts, or reflection.ts
- No `chrome.storage` calls in popup.ts (only calls to storage.ts functions)
- No business logic (score calculation, classification) in background.ts or popup.ts
- Every exported function has a JSDoc comment
- Every interface is in src/types/index.ts, not defined inline
- Every async Chrome API call has a try/catch
- Every Chrome API has an inline comment explaining what it does (first use in each file)
- manifest.json still has only: tabs, storage, alarms — nothing added

List any violations found. Fix them before I test anything.
```

---

## Step 4 — Run the Build Yourself

After the agent confirms no violations:

```bash
cd extension
npm install          # only needed first time or when package.json changes
npm run build
```

If errors appear, paste the full error output back to the agent. Ask it to fix the errors one by one. Do not proceed until build is clean.

```bash
npm run lint
```

Fix any lint errors the same way.

---

## Step 5 — Test in Chrome

Every phase has a verification checkpoint in `instructions.md`. Run through every item on that list yourself in Chrome. The agent cannot do this. Do not skip steps.

**How to reload the extension after a new build:**
```
chrome://extensions → find StudyLens card → click the circular ↺ icon
```
The popup and service worker now run the new compiled code.

**How to view the service worker console:**
```
chrome://extensions → StudyLens card → click "Service Worker" link
DevTools opens — click Console tab
All console.log from background.ts appears here
```

**How to inspect chrome.storage.local:**
```
Open any Chrome tab → DevTools → Application tab
Left sidebar: Storage → Extension Storage → Local Storage
Select your extension from the list
All key-value pairs from chrome.storage.local are visible and editable here
```
This is critical for debugging. You can manually set values here to test edge cases.

---

## Step 6 — Architecture Audit (Run Every 2 Phases)

After every second phase, ask the agent:

```
Audit the current project architecture. Check every file:

1. background.ts — contains ONLY Chrome event listeners and calls to imported modules.
   No score calculation, no classification logic, no UI code.

2. classifier.ts — contains ONLY pure functions.
   Grep confirms: zero chrome.* imports.

3. storage.ts — is the ONLY file that calls chrome.storage.local directly.
   No logic from other modules.

4. score.ts, streak.ts, reflection.ts — pure functions only.
   Grep confirms: zero chrome.* imports in all three.

5. popup.ts — reads from storage.ts only, renders DOM, handles button clicks.
   No direct chrome.storage calls. No score calculation. No classification.

6. src/types/index.ts — contains ALL interfaces.
   No interface defined anywhere else in the project.

List any violations. Fix them before continuing.
```

---

## Step 7 — Hard Stop Recovery

If the agent violates a Hard Stop from `GEMINI.md`, use this prompt:

```
STOP. You have violated a Hard Stop from GEMINI.md.

Violation: [DESCRIBE EXACTLY WHAT WENT WRONG]
Example: "You used localStorage instead of chrome.storage.local in background.ts"
Example: "You defined an interface inline in score.ts instead of in types/index.ts"
Example: "You wrote chrome.storage.local.get() directly in popup.ts"

Steps:
1. Do not generate any more code
2. Delete the violating code
3. Re-read the relevant Hard Stop rule in GEMINI.md
4. Explain in plain English what the correct approach is and why
5. Only after explaining — generate the corrected version
```

**Common violations to watch for as a first-time extension developer:**

| What the agent does | Why it's wrong | Correct approach |
|---|---|---|
| Uses `localStorage` | Does not exist in service workers | `chrome.storage.local` |
| Uses `window` in background.ts | No DOM in service worker | Remove — not needed |
| Uses `setInterval` for tick | Service worker sleeps — timer stops | `chrome.alarms` |
| Missing `await` on storage calls | Silent data corruption | Always `await` every `chrome.storage` call |
| Puts score logic in popup.ts | Mixes responsibilities | Move to `score.ts`, import the function |
| Defines interface inline | Breaks single source of truth | Move to `src/types/index.ts` |
| Adds permissions to manifest | Security/privacy violation | Question it — document justification first |
| Uses `require()` | CommonJS not ES Modules | `import/export` only |
| Missing try/catch on `chrome.tabs.get` | Tabs close before callback — throws | Wrap in try/catch |

---

## Step 8 — Git After Every Phase

After every phase passes all checks:

```bash
git add .
git commit -m "phase-N: description"
git push origin main
```

Use these commit message templates:

```bash
git commit -m "phase-1: scaffold, manifest, types, placeholder files"
git commit -m "phase-2: classifier with full site lists and pure functions"
git commit -m "phase-3: storage module with full CRUD and defaults"
git commit -m "phase-4: score and streak pure calculation modules"
git commit -m "phase-5: reflection prompt logic module"
git commit -m "phase-6: background service worker full tracking engine"
git commit -m "phase-7: popup UI full implementation"
git commit -m "phase-8: assets, docs, publishing prep — V1 complete"
```

Pushing after every phase creates rollback points. If Phase 7 breaks something, you can roll back to the Phase 6 commit and try again.

---

## Step 9 — Resuming a Stopped Session

If you close the chat and return later, start fresh with:

```
We are building StudyLens — a Chrome browser extension.
I am a solo developer, comfortable with TypeScript/Git/npm, first extension project.

Read GEMINI.md and instructions.md before continuing.

Completed phases: 1 through [N]
Files built so far: [list them briefly]
Next phase: Phase [N+1] — [name]

Here is a summary of what's working:
[brief description of current state]

Confirm you understand the project before I paste the next phase instructions.
```

Never assume the agent remembers your previous session. Always re-lock it.

---

## Step 10 — Version Gates

You must pass these gates before moving to the next version. These are not bureaucratic checkpoints — they exist because building V2 before V1 has real users means you will build the wrong things.

### Gate: V1 → V2 (pass ALL before Phase 9)
```
□ Extension is live on the Chrome Web Store
□ You have installed it yourself on at least one other device or browser
□ At least 10 real people have installed it (not friends testing it for you — real users)
□ You have collected at least 5 pieces of genuine feedback (GitHub issues, DMs, comments)
□ You have decided which V2 feature to build first based on that feedback
□ All known V1 bugs are fixed in the store version
```

### Gate: V2 → V3 (pass ALL before Phase 14)
```
□ Dashboard is live and linked from the popup
□ @studylens/core is published on npm and has at least a few downloads
□ V2 has been stable for at least 4 weeks (no critical bug reports)
□ Multiple users have specifically asked for cross-device sync
□ You understand the GDPR implications of storing user data (read security.md §10)
□ You have budgeted for backend hosting costs
```

---

## Quick Reference

| Phase | V | Name | Key deliverable | Main test |
|---|---|---|---|---|
| 1 | V1 | Scaffold | Extension loads in Chrome | Click icon → popup opens |
| 2 | V1 | Classifier | `classifier.ts` pure module | 7 URL classifications verified |
| 3 | V1 | Storage | `storage.ts` full CRUD | Round-trip read/write verified in DevTools |
| 4 | V1 | Score + Streak | Two pure calculation modules | Formula traces correct |
| 5 | V1 | Reflection | `reflection.ts` prompt logic | Threshold and creation logic correct |
| 6 | V1 | Background | Service worker tracking engine | Console shows sessions + storage updates |
| 7 | V1 | Popup | Complete user-facing UI | Full end-to-end flow in popup |
| 8 | V1 | Polish + Publish | Store submission | Extension live on Web Store |
| 9 | V2 | Core Package | `@studylens/core` on npm | Package installs and extension still works |
| 10 | V2 | Dashboard | 4-page React dashboard | All pages render real data |
| 11 | V2 | Planner | Daily goals + progress | Progress bars update correctly |
| 12 | V2 | Detox | Site blocking | Distraction site redirected during focus |
| 13 | V2 | Streak + Report | Weekly summary | Report shows correct weekly totals |
| 14 | V3 | Backend API | Node.js + Supabase | All 5 endpoints pass |
| 15 | V3 | Sync | Cross-device sync | Data appears on second device |
| 16 | V3 | Topic Tags | URL pattern tagging | Tags appear in storage and dashboard |