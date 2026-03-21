# PROMPT.md — Master Agent Prompt File

> **HOW TO USE THIS FILE**
> This is the only file you ever paste into Antigravity.
> Find the section for the phase you want to run.
> Change ONLY the phase number where instructed.
> Copy the entire block and paste it into Antigravity.
> The agent reads everything it needs from your instruction files automatically.
>
> **You never need to paste instructions.md manually.**
> The prompts below tell the agent to read it itself.

---

## ─────────────────────────────────────────
## STEP 0 — SEND THIS ONCE, VERY FIRST SESSION ONLY
## ─────────────────────────────────────────

```
STUDYLENS — SESSION INIT (FIRST TIME ONLY)

Read these files completely and in this order before doing anything else:
  1. instructions/GEMINI.md
  2. instructions/instructions.md
  3. instructions/security.md
  4. instructions/runflow.md
  5. instructions/tutor.md

Do not write a single line of code until you have read all five files.

About me:
- Solo developer
- Comfortable with TypeScript, Git, GitHub, npm, build tools
- Have NEVER built a browser extension before
- Windows machine, PowerShell terminal, building in Antigravity

My project is called StudyLens.
It is an open-source Chrome browser extension (Manifest V3).
Full spec is inside instructions/instructions.md.
Full rules are inside instructions/GEMINI.md.

When you have read all five files, respond with:
  - A one-paragraph summary of what StudyLens does
  - The complete list of V1 phases you found in instructions.md
  - Confirmation that you understand the hard stops in GEMINI.md
  - The words "READY FOR PHASE 1" on its own line at the end

Do not start building anything yet.
```

---

## ─────────────────────────────────────────
## STEP 1 — RE-LOCK PROMPT (SEND AT THE START OF EVERY NEW SESSION)
## ─────────────────────────────────────────

> Use this every time you reopen Antigravity after closing it.
> Fill in the bracketed fields before sending.

```
STUDYLENS — SESSION RESUME

Re-read these files before continuing. Do not rely on memory from a previous session:
  1. instructions/GEMINI.md
  2. instructions/instructions.md

Project: StudyLens — Chrome Extension (Manifest V3)
Developer: Solo, TypeScript/Git/npm comfortable, first extension project, Windows/PowerShell

Phases completed so far: [LIST THEM — e.g. "Phase 1, Phase 2, Phase 3"]
Current project state: [ONE SENTENCE — e.g. "Extension loads in Chrome, classifier verified, storage round-trip works"]
Next phase to build: Phase [NUMBER] — [NAME FROM instructions.md]

All rules from GEMINI.md still apply. Do not relax any rule.
Do not generate code for any phase beyond Phase [NUMBER].

When you have re-read the files, confirm with:
  "Re-locked. Ready for Phase [NUMBER] — [NAME]."

Do not start building until I paste the phase prompt below.
```

---

## ─────────────────────────────────────────
## STEP 2 — PHASE BUILD PROMPT
## ─────────────────────────────────────────

> **Change only the number on the line marked ★**
> Everything else stays exactly the same.
> Copy the entire block and paste it after the agent confirms it is re-locked.

```
STUDYLENS — BUILD PHASE ★[NUMBER]★
(example: replace ★[NUMBER]★ with ★1★ for Phase 1, ★2★ for Phase 2, etc.)

Read instructions/instructions.md now.
Find the section titled exactly: "## Phase [NUMBER]"
Build every file listed in that section.
Follow the spec in that section line by line — do not add, remove, or change anything.

Rules that apply to every file you generate (from GEMINI.md — non-negotiable):
  ✗ No `any` types anywhere
  ✗ No `var` — only const and let
  ✗ No `require()` — ES Module import only
  ✗ No `localStorage` or `sessionStorage` — chrome.storage.local only
  ✗ No `window` or `document` in background.ts — service worker has no DOM
  ✗ No `setInterval` or `setTimeout` for recurring tasks — use chrome.alarms
  ✗ No chrome.* imports in classifier.ts, score.ts, streak.ts, or reflection.ts
  ✗ No chrome.storage calls directly in popup.ts — go through storage.ts
  ✗ No interface definitions outside src/types/index.ts
  ✗ No business logic (score calculation, classification) in background.ts or popup.ts
  ✗ No inline scripts or styles in HTML files
  ✗ No permissions in manifest.json beyond: tabs, storage, alarms

  ✓ Every Chrome API used for the first time in a file must have an inline comment explaining it
  ✓ Every exported function must have a JSDoc comment with @param and @returns
  ✓ Every file must have a one-line responsibility comment at the top
  ✓ Every async Chrome API call must be wrapped in try/catch
  ✓ Every storage read must handle the case where the key does not exist (return a default)
  ✓ Every division in score.ts must guard against divide-by-zero

HARD STOP RULE:
If you are about to violate any rule above, stop immediately.
Write: "HARD STOP — [describe the violation]"
Explain the correct approach.
Wait for me to type "CONTINUE" before proceeding.

After generating all files for Phase [NUMBER]:
  1. Do NOT move to Phase [NUMBER+1]
  2. Run the AUTO AUDIT below on your own output before telling me you are done
  3. Report the audit result
  4. Then tell me the exact PowerShell commands to run to build and test
```

---

## ─────────────────────────────────────────
## STEP 3 — AUTO AUDIT PROMPT
## ─────────────────────────────────────────

> The build prompt above triggers this automatically.
> But you can also send it manually at any time to check the current state of the codebase.

```
STUDYLENS — AUTO AUDIT

Run a full audit of all files generated so far.
Check every item below. Report PASS or FAIL for each.
If any item FAILS, list exactly which file and which line caused the failure.
Do not proceed to any next step until all items PASS.

AUDIT CHECKLIST:

SECTION A — TypeScript Rules
  [ ] A1. No `: any` type used anywhere in src/
       Check: grep -rn ": any" extension/src/
  [ ] A2. No `var` declarations anywhere in src/
       Check: grep -rn "\bvar\b" extension/src/
  [ ] A3. No `require()` calls anywhere in src/
       Check: grep -rn "require(" extension/src/
  [ ] A4. Every exported function has a JSDoc comment directly above it
  [ ] A5. Every file has a one-line responsibility comment at line 1 or 2

SECTION B — Extension Architecture Rules
  [ ] B1. classifier.ts has zero chrome.* imports
       Check: grep -n "chrome\." extension/src/classifier.ts
  [ ] B2. score.ts has zero chrome.* imports
       Check: grep -n "chrome\." extension/src/score.ts
  [ ] B3. streak.ts has zero chrome.* imports
       Check: grep -n "chrome\." extension/src/streak.ts
  [ ] B4. reflection.ts has zero chrome.* imports
       Check: grep -n "chrome\." extension/src/reflection.ts
  [ ] B5. popup.ts has zero direct chrome.storage calls
       Check: grep -n "chrome\.storage" extension/src/popup/popup.ts
  [ ] B6. No score calculation logic in background.ts or popup.ts
  [ ] B7. No classifySite or extractDomain logic in background.ts or popup.ts
  [ ] B8. All interface definitions are in src/types/index.ts only
       Check: grep -rn "^interface\|^export interface" extension/src/ (should only appear in types/index.ts)

SECTION C — Privacy and Security Rules
  [ ] C1. No fetch() or XMLHttpRequest in any extension src file
       Check: grep -rn "fetch(\|XMLHttpRequest" extension/src/
  [ ] C2. No localStorage or sessionStorage anywhere
       Check: grep -rn "localStorage\|sessionStorage" extension/src/
  [ ] C3. No window or document used in background.ts
       Check: grep -n "\bwindow\b\|\bdocument\b" extension/src/background.ts
  [ ] C4. No setInterval or setTimeout in background.ts
       Check: grep -n "setInterval\|setTimeout" extension/src/background.ts
  [ ] C5. manifest.json permissions array contains only: tabs, storage, alarms
  [ ] C6. manifest.json host_permissions is empty array []
  [ ] C7. No inline <script> tags in popup.html
       Check: grep -n "<script" extension/src/popup/popup.html (only the module src tag allowed)

SECTION D — Code Quality Rules
  [ ] D1. Every async Chrome API call in background.ts has a try/catch block
  [ ] D2. Every storage read in storage.ts returns a default value when key is missing
  [ ] D3. score.ts calculateDependencyScore has a divide-by-zero guard
  [ ] D4. streak.ts calculateStreak never mutates the input object (returns new object)
  [ ] D5. All DOM queries in popup.ts have null checks before use

AUDIT RESULT FORMAT — respond exactly like this:

AUDIT COMPLETE — Phase [NUMBER]
PASSED: [number] checks
FAILED: [number] checks

FAILURES:
  [list each failure with file name, line number, and what the violation is]
  If no failures: write "None — all checks passed"

NEXT STEP:
  [If all passed]: "All checks passed. Run: npm run build"
  [If failures exist]: "Fix the above failures before building. Do not proceed."
```

---

## ─────────────────────────────────────────
## STEP 4 — BUILD VERIFICATION PROMPT
## ─────────────────────────────────────────

> Send this after you have run `npm run build` in PowerShell and tested in Chrome.
> Fill in the bracketed fields with what you actually saw.

```
STUDYLENS — PHASE [NUMBER] VERIFICATION REPORT

Build result:
  npm run build output: [PASTE THE TERMINAL OUTPUT HERE]
  npm run lint output: [PASTE THE TERMINAL OUTPUT HERE]

Chrome test results:
  Extension loaded without errors: [YES / NO]
  Service worker console output: [PASTE WHAT YOU SAW]
  Popup opened correctly: [YES / NO — describe what appeared]
  chrome.storage.local contents (from DevTools): [PASTE OR DESCRIBE]

Verification checklist from instructions.md Phase [NUMBER]:
  [Go through each checkbox in the verification section and write PASS or FAIL]
  Example:
    PASS — Extension loads in Chrome without error banner
    PASS — Service worker shows "[StudyLens] Extension installed" in console
    FAIL — Popup shows blank white screen instead of "StudyLens" heading

Errors encountered:
  [Paste any errors, or write "None"]

Question for agent:
  Based on this report, is Phase [NUMBER] complete and stable?
  If not, what exactly needs to be fixed before I move to Phase [NUMBER+1]?
```

---

## ─────────────────────────────────────────
## STEP 5 — HARD STOP RECOVERY PROMPT
## ─────────────────────────────────────────

> Use this if the agent does something wrong — wrong API, wrong architecture, wrong pattern.

```
STUDYLENS — HARD STOP RECOVERY

STOP. Do not generate any more code.

Violation detected:
  [DESCRIBE EXACTLY WHAT WENT WRONG]

  Examples:
    "You used localStorage in background.ts instead of chrome.storage.local"
    "You defined an interface inline in score.ts instead of in src/types/index.ts"
    "You wrote chrome.storage.get() directly in popup.ts instead of going through storage.ts"
    "You used setInterval instead of chrome.alarms for the tick"
    "You added a new permission to manifest.json without justification"

Required steps before continuing:
  1. Delete the violating code — do not keep it
  2. Re-read the relevant Hard Stop rule in GEMINI.md
  3. In plain English, explain what the correct approach is and WHY the violation was wrong
  4. Show me the corrected version of only the affected file(s)
  5. Then re-run the AUTO AUDIT on the corrected output

I will type CONFIRMED once I am satisfied the fix is correct.
Do not proceed to any next step until I type CONFIRMED.
```

---

## ─────────────────────────────────────────
## STEP 6 — ARCHITECTURE AUDIT PROMPT
## ─────────────────────────────────────────

> Run this manually every 2 phases to catch structural drift before it compounds.
> Send this after Phase 2, Phase 4, Phase 6, and Phase 8.

```
STUDYLENS — ARCHITECTURE AUDIT (Run after every 2 phases)

Audit the overall project architecture across all files built so far.
Check each item. Report PASS or FAIL.

ARCHITECTURE CHECKS:

  [ ] ARCH-1. background.ts is the ONLY file that registers chrome event listeners
              (onActivated, onUpdated, onFocusChanged, onAlarm, onInstalled)

  [ ] ARCH-2. storage.ts is the ONLY file that calls chrome.storage.local directly
              No other file may call chrome.storage — they must import functions from storage.ts

  [ ] ARCH-3. classifier.ts, score.ts, streak.ts, reflection.ts are completely pure
              Confirmed by: zero chrome.* in all four files

  [ ] ARCH-4. popup.ts only reads data by calling functions from storage.ts
              It does NOT call chrome.storage directly
              It does NOT calculate scores directly
              It does NOT classify URLs directly

  [ ] ARCH-5. src/types/index.ts is the single source of truth for all interfaces
              No interface or type alias is defined anywhere else

  [ ] ARCH-6. Module dependency direction is correct (no circular imports):
              background.ts → imports from: classifier, storage, score, streak, reflection
              popup.ts → imports from: storage, score, streak, reflection
              storage.ts → imports from: types only
              classifier.ts → imports from: types only
              score.ts → imports from: types only
              streak.ts → imports from: types only
              reflection.ts → imports from: types only

  [ ] ARCH-7. All data flowing into chrome.storage.local matches the StorageSchema interface
              No ad-hoc keys being written outside the defined schema

  [ ] ARCH-8. manifest.json has not gained any new permissions since Phase 1

RESPOND WITH:

ARCHITECTURE AUDIT — After Phase [NUMBER]
PASSED: [number]
FAILED: [number]

FAILURES:
  [file, what went wrong, what the fix is]
  Or: "None — architecture is clean"

RECOMMENDATION:
  [Safe to continue to Phase [NUMBER+1] / OR / Fix these issues first]
```

---

## ─────────────────────────────────────────
## STEP 7 — PHASE COMPLETION COMMIT PROMPT
## ─────────────────────────────────────────

> Send this after a phase is fully verified and you are about to move on.
> The agent gives you the exact git commands to run.

```
STUDYLENS — PHASE [NUMBER] COMMIT

Phase [NUMBER] is verified and working in Chrome.
All audit checks passed.

Give me the exact PowerShell commands to:
  1. Stage all changed files
  2. Commit with the correct message format from runflow.md
  3. Push to origin main

Also tell me:
  - What phase comes next
  - Whether I need to run the Architecture Audit before starting it
    (Architecture Audit runs after phases 2, 4, 6, 8)
  - The one-sentence summary of what Phase [NUMBER+1] will build

Do not start Phase [NUMBER+1] yet. Wait for me to paste the Phase Build Prompt.
```

---

## ─────────────────────────────────────────
## QUICK REFERENCE — WHICH PROMPT TO USE WHEN
## ─────────────────────────────────────────

| Situation | Which prompt | Step number |
|---|---|---|
| Very first time opening Antigravity for this project | SESSION INIT | Step 0 |
| Coming back after closing Antigravity | SESSION RESUME | Step 1 |
| Starting to build a phase | PHASE BUILD | Step 2 |
| Checking generated code for violations | AUTO AUDIT | Step 3 |
| After you have run npm run build and tested in Chrome | VERIFICATION REPORT | Step 4 |
| Agent generated something wrong | HARD STOP RECOVERY | Step 5 |
| Every 2 phases (after 2, 4, 6, 8) | ARCHITECTURE AUDIT | Step 6 |
| Phase is done, ready to commit and move on | PHASE COMPLETION COMMIT | Step 7 |

---

## ─────────────────────────────────────────
## PHASE NUMBER REFERENCE
## ─────────────────────────────────────────

Swap these into the ★[NUMBER]★ field in the Phase Build prompt:

### VERSION 1 — MVP Extension
| Number | Phase Name | What it builds |
|---|---|---|
| 1 | Project Scaffold | Extension shell that loads in Chrome |
| 2 | Classifier Module | `classifier.ts` — pure URL → category function |
| 3 | Storage Module | `storage.ts` — all chrome.storage reads and writes |
| 4 | Score and Streak Modules | `score.ts` and `streak.ts` — pure calculation functions |
| 5 | Reflection Module | `reflection.ts` — self-reflection prompt logic |
| 6 | Background Service Worker | `background.ts` — full tab tracking engine |
| 7 | Popup UI | Complete user-facing popup with all sections |
| 8 | Polish and Publishing | Assets, README, Web Store submission prep |

### VERSION 2 — Dashboard + Planner (build after V1 is published)
| Number | Phase Name | What it builds |
|---|---|---|
| 9 | npm Core Package | `@studylens/core` extracted and published |
| 10 | Dashboard Web App | 4-page React dashboard |
| 11 | Study Planner | Daily goals and progress tracking |
| 12 | Detox Mode | Site blocking during focus sessions |
| 13 | Enhanced Streak and Report | Weekly summary and improved streak logic |

### VERSION 3 — Cloud Sync (build after V2 is stable)
| Number | Phase Name | What it builds |
|---|---|---|
| 14 | Backend API | Node.js + Supabase REST API |
| 15 | Multi-device Sync | Cross-device sync in the extension |
| 16 | Topic Tagging and Patterns | URL pattern analysis and weakness detection |

---

## ─────────────────────────────────────────
## EXAMPLE — EXACTLY WHAT ONE COMPLETE PHASE LOOKS LIKE
## ─────────────────────────────────────────

This is the full sequence for Phase 2 from start to finish:

```
SESSION START:
  → Paste Step 1 (SESSION RESUME) with Phase 2 details filled in
  → Agent confirms it has re-read GEMINI.md and instructions.md

BUILD:
  → Paste Step 2 (PHASE BUILD) with ★2★ filled in
  → Agent reads Phase 2 from instructions.md and builds classifier.ts
  → Agent runs AUTO AUDIT on its own output
  → Agent reports audit result and gives you PowerShell commands

YOU RUN:
  cd extension
  npm run build
  → If errors: paste them back using Step 4 (VERIFICATION REPORT) with errors filled in
  → Agent fixes errors, you rebuild

YOU TEST IN CHROME:
  → Reload extension in chrome://extensions
  → Run the verification steps listed in instructions.md Phase 2
  → Fill in Step 4 (VERIFICATION REPORT) and paste it to the agent

AGENT CONFIRMS:
  → "Phase 2 complete and stable"

YOU COMMIT:
  → Paste Step 7 (PHASE COMPLETION COMMIT)
  → Agent gives you the exact git commands
  → You run them in PowerShell

NEXT:
  → Phase 3 — paste Step 1 (SESSION RESUME) with Phase 3 details
  → After Phase 4 is done, paste Step 6 (ARCHITECTURE AUDIT) before Phase 5
```

---

## ─────────────────────────────────────────
## NOTES
## ─────────────────────────────────────────

**Do not edit the prompts above.** They are written to work with Antigravity's context window. Changing the wording changes how the agent interprets the rules.

**The only things you fill in are:**
- `[NUMBER]` → the phase number you are building
- `[NAME]` → the phase name from the reference table above
- `[LIST THEM]` → the phases already completed
- `[ONE SENTENCE]` → current state of the project
- Verification report fields → what you actually saw in Chrome

**If the agent ever says it cannot find instructions.md or GEMINI.md**, check that the file is in the `instructions/` folder relative to where Antigravity is running. The terminal path in your screenshot shows `J:\Open-Source-Projects\study-lens` — the files must be at `J:\Open-Source-Projects\study-lens\instructions\GEMINI.md` etc.

**V2 and V3 phases do not start until the version gates pass.** The gates are defined in runflow.md. Do not skip them.