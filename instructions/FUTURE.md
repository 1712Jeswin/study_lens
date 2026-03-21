# FUTURE.md — StudyLens Future Goals and Development Roadmap

> **Document Status:** Living document — updated as versions ship and priorities shift
> **Last Reviewed:** 2026-03-21
> **Owner:** Solo developer (escalates to core team if contributors join)
> **Scope:** All planned, proposed, and speculative development beyond the current build phase
> **Reading time:** ~45 minutes — read completely before making any architectural decision

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [Current State Snapshot](#2-current-state-snapshot)
3. [Strategic Vision](#3-strategic-vision)
4. [Version Roadmap Overview](#4-version-roadmap-overview)
5. [V2 — Full Feature Specification](#5-v2--full-feature-specification)
6. [V3 — Cloud and Platform Specification](#6-v3--cloud-and-platform-specification)
7. [V4 — Intelligence Layer](#7-v4--intelligence-layer)
8. [V5 — Ecosystem and Platform](#8-v5--ecosystem-and-platform)
9. [Technical Debt Register](#9-technical-debt-register)
10. [Architecture Evolution Plan](#10-architecture-evolution-plan)
11. [Infrastructure Roadmap](#11-infrastructure-roadmap)
12. [Security and Privacy Evolution](#12-security-and-privacy-evolution)
13. [Performance Targets](#13-performance-targets)
14. [Open Source Strategy](#14-open-source-strategy)
15. [Monetisation Strategy](#15-monetisation-strategy)
16. [Platform Expansion](#16-platform-expansion)
17. [Research and Experimentation Backlog](#17-research-and-experimentation-backlog)
18. [Decisions Log](#18-decisions-log)
19. [Deprecation Schedule](#19-deprecation-schedule)
20. [Success Metrics](#20-success-metrics)

---

## 1. Document Purpose

This document exists to answer one question before any new work begins:

> **"Does this next thing fit the long-term direction of StudyLens, or are we building a dead end?"**

Every engineering decision — a new API endpoint, a schema change, a new npm dependency, a new permission in `manifest.json` — must be evaluated against what is planned three versions ahead. A decision that feels correct for V2 but prevents V4 from being buildable is an architectural mistake, even if the V2 code is technically correct.

### How to Use This Document

- **Before adding any new feature:** Find it here. If it is not here, create a proposal section in §17 before building it.
- **Before any schema change to `StorageSchema`:** Read §10 Architecture Evolution — schema changes have migration implications.
- **Before adding any npm dependency:** Read §10.4 Dependency Strategy.
- **Before any privacy decision:** Read §12 Security and Privacy Evolution — privacy posture changes require this document to be updated first.
- **When onboarding a contributor:** This is the third document they read, after `GEMINI.md` and `instructions.md`.

---

## 2. Current State Snapshot

### What exists today (V1 target)

| Component | Status | Location |
|---|---|---|
| Chrome extension — Manifest V3 | In development | `extension/src/` |
| Site classifier — 4 categories, ~60 sites | In development | `extension/src/classifier.ts` |
| Storage layer — `chrome.storage.local` | In development | `extension/src/storage.ts` |
| Dependency score (heuristic formula) | In development | `extension/src/score.ts` |
| Streak counter | In development | `extension/src/streak.ts` |
| Self-reflection prompt (30min threshold) | In development | `extension/src/reflection.ts` |
| Popup UI — 320px, plain HTML/CSS/TS | In development | `extension/src/popup/` |
| GitHub repository — public, MIT | Exists | github.com |
| Chrome Web Store listing | Not started | — |
| npm package `@studylens/core` | Not started | — |
| Backend API | Not started | — |
| Dashboard web app | Not started | — |

### What does NOT exist yet (do not reference in V1 code)

- No user accounts of any kind
- No server, no database, no backend
- No cross-device sync
- No analytics or telemetry
- No React or any UI framework
- No external API calls
- No unit tests
- No CI/CD pipeline
- No Firefox support
- No mobile app

---

## 3. Strategic Vision

### 3.1 The Core Problem StudyLens Solves

Students in the AI era suffer from **invisible dependency**. They use AI tools constantly, believe they are studying, and have no quantitative evidence to confront the habit. The problem is not that AI tools are bad — it is that students lack self-awareness about the degree to which they have outsourced their thinking.

StudyLens does not block AI. It does not judge. It provides a mirror: here is what you actually did today, measured in seconds, broken into honest categories.

### 3.2 The Long-Term Mission

> **"Give every student in the world an honest, private, free way to understand their own learning behaviour — with the precision of data and the simplicity of a mirror."**

The word "honest" is load-bearing. Everything in this roadmap must be evaluated against it. A feature that distorts the picture — that makes the score look better than reality to keep users happy — is antithetical to the mission even if it increases retention.

### 3.3 What StudyLens Is Not

These are boundaries. No feature that crosses them should ever ship:

- **Not a productivity enforcer.** We do not lock users out of sites. Detox mode (V2) is entirely voluntary and always cancellable. We are a mirror, not a warden.
- **Not a surveillance tool.** We never read page content, titles, or search queries — not in any version. The privacy promise is permanent, not temporary.
- **Not a gamification trap.** Streak mechanics and XP systems must serve genuine learning, not manufactured engagement. We will not add features whose primary effect is to make students feel good about behaviour that has not actually changed.
- **Not a monetisation vehicle that compromises the core.** The free tier is permanently full-featured. We will never put the dependency score, the classifier, or any core insight behind a paywall.
- **Not an AI company.** We use heuristics, not machine learning models, to generate insights. ML features (V4+) are always additive and always opt-in.

### 3.4 Target Users by Version

| Version | Primary Target User |
|---|---|
| V1 | Computer science and engineering students at university, self-taught developers, bootcamp students |
| V2 | Any student with structured study goals — expands beyond CS to any discipline using online resources |
| V3 | Students who study across multiple devices (laptop + desktop + work machine) |
| V4 | Educators and students who want curriculum-aligned analysis — institutions, bootcamps, cohorts |
| V5 | Any knowledge worker (not just students) who wants to understand their learning and AI dependency |

---

## 4. Version Roadmap Overview

```
V1 ──────────── V2 ──────────── V3 ──────────── V4 ──────────── V5
│               │               │               │               │
│ Chrome MV3    │ Dashboard      │ Cloud sync     │ Intelligence   │ Ecosystem
│ Popup UI      │ Planner        │ User accounts  │ layer          │ Platform
│ Classifier    │ Detox mode     │ Backend API    │ ML scoring     │ API-first
│ Score         │ Weekly report  │ Firefox        │ Institution    │ Mobile app
│ Streak        │ npm package    │ Android/iOS    │ dashboard      │ Integrations
│ Reflection    │ Jest tests     │ data export    │ Custom models  │ Marketplace
│               │ CI/CD          │ GDPR tools     │ Curriculum map │
│               │               │               │               │
└── 4-6 wks ───└── 3-4 months ──└── 4-6 months ──└── 6-12 months ─└── 12+ months
    after V1        gate            after V2 gate   after V3 gate   after V4 gate
```

### Version Gate Summary

These are the mandatory conditions before the next version begins. They are not aspirational targets — they are hard requirements. Starting a new version before its gate is passed produces wrong features built for the wrong users.

| Gate | Required Before | Conditions |
|---|---|---|
| V1 → V2 | Starting Phase 9 | Web Store published, 10+ real installs, 5+ pieces of user feedback collected, all P0 and P1 bugs resolved |
| V2 → V3 | Starting Phase 14 | `@studylens/core` published on npm, dashboard live and linked from popup, V2 stable for 4+ weeks, ≥3 users explicitly requesting cross-device sync |
| V3 → V4 | Starting V4 planning | Backend API in production for 8+ weeks, cloud sync working correctly for 50+ users, privacy audit completed by an external reviewer |
| V4 → V5 | Starting V5 planning | ML pipeline running and generating accurate insights validated by 20+ power users, institutional pilot completed with at least one real educational institution |

---

## 5. V2 — Full Feature Specification

> **Gate:** V1 published, 10+ installs, 5+ feedback items, all P0/P1 bugs fixed
> **Estimated scope:** 3–4 months of active development after V1 gate

### 5.1 `@studylens/core` npm Package

**Purpose:** Extract the four pure logic modules into a versioned, documented, independently testable npm package. This is a prerequisite for the dashboard (which imports it) and for the open-source ecosystem (which builds on it).

**Package identity:**
- Name: `@studylens/core`
- Scope: public
- Exports: `classifier`, `score`, `streak`, `reflection`, `types`
- License: MIT
- Target environments: Node.js 18+, modern browsers, extension service workers

**Modules extracted from extension:**
```
@studylens/core
├── src/
│   ├── classifier.ts    → classifySite(), extractDomain(), SITE_LISTS, isTrackableUrl()
│   ├── score.ts         → calculateDependencyScore(), formatSeconds(), getScoreColour()
│   ├── streak.ts        → calculateStreak(), streakQualifies(), formatStreak()
│   ├── reflection.ts    → shouldTriggerReflection(), createReflectionEntry(), resolveReflection()
│   └── types/index.ts   → all shared interfaces and type aliases
└── dist/
    ├── index.js         → CommonJS build (for Node.js consumers)
    ├── index.mjs        → ES Module build (for browser and extension consumers)
    └── index.d.ts       → TypeScript declarations
```

**Build outputs required:**
- CommonJS (`dist/index.js`) — for Node.js consumers and older toolchains
- ES Modules (`dist/index.mjs`) — for browser, Vite, extension consumers
- TypeScript declarations (`dist/index.d.ts`) — for all TypeScript consumers
- Source maps for both builds

**Testing requirement (V2 introduces Jest):**
- Every exported function must have ≥90% branch coverage
- Tests must run in Node.js environment — no browser environment required
- Test framework: `jest` + `ts-jest`
- No `jest-chrome` needed for core package — it has zero Chrome API dependencies

**Versioning policy:**
- `@studylens/core` follows semver strictly
- Breaking changes (removing or renaming exported functions) → major version bump → coordinated with extension update
- Extension's `package.json` pins an exact version: `"@studylens/core": "1.2.3"` not `"^1.2.3"`

**Documentation:**
- README.md at the package root with full API reference
- JSDoc on every exported function (already required by GEMINI.md — now enforced by the publish checklist)
- CHANGELOG.md maintained from the first release

---

### 5.2 Dashboard Web App

**Purpose:** A full-page analytics view opened from the extension popup. Provides depth that the 320px popup cannot.

**Technical stack:**
```
dashboard/
├── src/
│   ├── pages/
│   │   ├── Today.tsx
│   │   ├── Weekly.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── ScoreGauge.tsx
│   │   ├── CategoryBar.tsx
│   │   ├── ReflectionList.tsx
│   │   ├── WeeklyChart.tsx
│   │   ├── GoalRing.tsx
│   │   └── Navigation.tsx
│   ├── hooks/
│   │   ├── useStorage.ts       → reads from chrome.storage.local
│   │   └── useRealTimeData.ts  → polls storage on a 30-second interval for live updates
│   ├── utils/
│   │   └── csvExport.ts
│   └── App.tsx
├── index.html
├── vite.config.ts
└── package.json
```

**Runtime: bundled inside the extension, not a separate hosted site**
- `dashboard/dist/` is included in the extension package
- Opened via `chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') })`
- Reads `chrome.storage.local` directly (dashboard is part of the extension — same origin)
- No server communication in V2

**Page specifications:**

**Today page:**
- Score gauge: CSS-only radial gauge (no canvas, no chart library) — percentage arc that fills based on score
- Category bars: horizontal bars with exact time labels, colour-coded per category
- Reflection history: last 7 reflection entries with domain, duration, and yes/no answer
- "Time lost today" counter: distraction time displayed as a distinct negative metric
- Real-time updates: polls storage every 30 seconds to pick up changes from the background worker

**Weekly page:**
- 7-day stacked bar chart: one bar per day, four segments (ai, coding, study, distraction) — Chart.js v4
- Weekly averages: score, total productive time, total distraction time
- Best day callout: the day with the highest `coding + study` total and lowest AI dependency
- Worst day callout: the day with the highest dependency score
- Trend indicator: is this week better or worse than last week? (simple comparison, no ML)

**History page:**
- Paginated list: 30 records per page, newest first
- Columns: date, AI%, coding time, study time, distraction time, score label
- Filter by date range using native `<input type="date">` elements
- Export: generates a UTF-8 CSV with headers and all visible records
- CSV format:
  ```
  date,ai_seconds,coding_seconds,study_seconds,distraction_seconds,dependency_score,score_label
  2026-03-21,3600,1800,900,600,57,moderate
  ```

**Settings page:**
- Custom site form: domain input + category dropdown + "Add" button — persisted to `StorageSchema.customSites`
- Goal sliders: `coding` and `study` daily goals in minutes (15-minute increments, 0–480 minutes range)
- Reset data: confirmation dialog → clears `chrome.storage.local` entirely
- Export all data: full JSON dump of `StorageSchema`
- Version display: extension version from `manifest.json`

**Design system (V2 introduces a formal design system):**
- CSS custom properties defined in `dashboard/src/styles/tokens.css`
- Colour tokens, spacing scale, typography scale, border-radius scale
- No external CSS framework — all custom
- Dark mode: `prefers-color-scheme` media query on all CSS custom properties
- Accessible: all interactive elements must have focus indicators and ARIA labels

---

### 5.3 Study Planner

**Purpose:** Allow students to commit to daily time goals and track progress. Transforms the dashboard from a retrospective tool into a forward-looking planning tool.

**Data model additions to `StorageSchema`:**
```typescript
// Added in V2
export interface PlannerGoals {
  coding: number    // minutes per day target (default: 120)
  study: number     // minutes per day target (default: 120)
  aiCeiling: number // maximum acceptable AI minutes per day (default: 60)
                    // aiCeiling is a soft limit — shown as a warning, not enforced
}

export interface DailyPlannerStatus {
  date: string
  codingMet: boolean    // did coding meet the goal?
  studyMet: boolean     // did study meet the goal?
  aiExceeded: boolean   // did AI usage exceed the ceiling?
}
```

**StorageSchema additions:**
```typescript
goals: PlannerGoals
plannerHistory: Record<string, DailyPlannerStatus>  // keyed by ISO date
```

**Migration note:** These keys are new in V2. `initializeStorage()` must be updated to include defaults for both. Existing V1 storage records are not affected — they are additive additions only.

**UI components:**
- **Goal rings on Today page:** Three concentric rings (coding, study, AI ceiling). Fills clockwise as the day progresses. Colour: green when on track (≥80% of goal with time remaining), amber when behind (50–79%), red when far behind or AI ceiling exceeded.
- **Progress summary in popup:** Below each category bar, a thin secondary bar showing goal progress. `"Coding: 1h 12m / 2h goal (60%)"` format.
- **Weekly goal hit rate on Weekly page:** `"You hit your coding goal 5 of 7 days this week"` — simple count, no chart.

---

### 5.4 Detox Mode (Focus Sessions)

**Purpose:** Voluntary, time-limited blocking of distraction sites during self-declared focus sessions. Never automatic. Always cancellable.

**Data model additions:**
```typescript
export interface DetoxSession {
  active: boolean
  startTime: number         // Date.now() when session started
  durationMinutes: number   // chosen by user: 25, 50, 90, or custom
  endTime: number           // startTime + (durationMinutes * 60 * 1000)
  blockedCategories: SiteCategory[]  // default: ['distraction']
  completedSessions: number // count of completed sessions today (Pomodoro counter)
}
```

**Background enforcement mechanism:**
- `background.ts` checks `detoxSession.active` and `detoxSession.endTime` at the start of `handleTabChange()`
- If the incoming URL's category is in `blockedCategories` and the session is active and not expired:
  - `chrome.tabs.update(tabId, { url: chrome.runtime.getURL('src/detox/detox.html') })`
- Detox page: minimal static HTML showing countdown timer, session number, and a "Cancel Focus Mode" button
- Session expiry: checked in `alarm "tick"` handler — if `Date.now() >= endTime`, set `active: false`, clear session

**Detox page (`extension/src/detox/detox.html`):**
- New file in V2 — does not exist in V1
- Reads remaining time from `chrome.storage.local` on load, displays countdown
- Updates every second using `setInterval` (this is the popup/page context — `setInterval` is valid here)
- "Cancel" button: writes `detoxSession.active = false` to storage, redirects to the user's home page

**Controls in popup:**
- "Start focus session" button — opens a small configuration: duration selector (25/50/90/custom minutes), categories to block (default: distraction only)
- Live countdown in popup during active session
- "End early" button with confirmation

**Constraints:**
- Maximum session duration: 240 minutes (4 hours) — prevents accidental all-day blocks
- Cannot block the `ai`, `coding`, or `study` categories — only `distraction` and `uncategorized`
- Cannot be activated remotely — only the user can start a session
- Detox sessions do NOT carry over midnight — they expire at the session's `endTime` or midnight, whichever comes first

---

### 5.5 Weekly Report

**Purpose:** A Sunday-evening summary that creates a reflective moment and a shareable achievement. Drives habit formation through celebration and honest confrontation.

**Trigger:** `chrome.alarms` creates alarm `"weeklyReport"` every Sunday at 20:00 local time. The popup renders the weekly view automatically when it opens after this alarm fires.

**Report content:**
```
Week of [Monday date] — [Sunday date]

Total productive time: Xh Xm
  AI tools:     Xh Xm  (X% of productive time)
  Coding:       Xh Xm
  Study:        Xh Xm

Total time lost: Xh Xm (distraction)

Average dependency score: XX% — [healthy / moderate / high]
Best day: [weekday] — XX% dependency, Xh Xm productive
Most improved: [weekday vs weekday] — X% lower dependency

Streak: [X]-day streak
Goal hit rate: Coding X/7 days, Study X/7 days

Reflection answers this week:
  "AI solved it": X times
  "Used as reference": X times
```

**Share card:**
- A copyable text string generated from the report
- Format: `"Week of March 21: 14h study, 42% AI dependency, 7-day streak. #StudyLens"`
- Intentionally brief — designed for Twitter/X, LinkedIn, or a personal log

**Storage additions:**
```typescript
weeklyReports: WeeklyReport[]  // capped at 52 entries (one year of history)

export interface WeeklyReport {
  weekStartDate: string        // ISO date of the Monday
  weekEndDate: string          // ISO date of the Sunday
  totalAiSeconds: number
  totalCodingSeconds: number
  totalStudySeconds: number
  totalDistractionSeconds: number
  averageDependencyScore: number
  goalHitRate: { coding: number, study: number }  // 0.0 – 1.0
  reflectionYesCount: number
  reflectionNoCount: number
  generatedAt: number          // Date.now()
}
```

---

### 5.6 Unit Testing Infrastructure (V2)

**Why V2 introduces testing:**
V1 pure functions (`classifier.ts`, `score.ts`, `streak.ts`, `reflection.ts`) are already written as testable units. V2 extracts them into `@studylens/core`, which requires a proper test suite before publishing to npm. An npm package without tests is not production-grade.

**Test framework:**
- `jest` with `ts-jest` preset — runs TypeScript directly without a separate compile step
- `jest-chrome` — provides Chrome API mocks for `storage.ts` tests in the extension package
- No testing of popup rendering in V2 — UI tests are V3+

**Coverage requirements for `@studylens/core`:**
```
classifier.ts:  ≥ 95% branch coverage
score.ts:       ≥ 100% branch coverage (all score bands and divide-by-zero must be tested)
streak.ts:      ≥ 95% branch coverage (all streak state transitions must be tested)
reflection.ts:  ≥ 90% branch coverage
```

**Key test cases that must exist:**

`classifier.ts`:
```typescript
describe('classifySite', () => {
  it('returns ai for chatgpt.com')
  it('returns ai for www.chatgpt.com (strips www)')
  it('returns coding for leetcode.com/problems/specific-problem')
  it('returns uncategorized for chrome://extensions')
  it('returns uncategorized for about:blank')
  it('returns uncategorized for localhost:3000')
  it('returns uncategorized for a completely unknown domain')
  it('handles a malformed URL without throwing')
})
```

`score.ts`:
```typescript
describe('calculateDependencyScore', () => {
  it('returns score 0 and label healthy when all seconds are 0')
  it('returns score 50 and label moderate for equal ai and coding+study time')
  it('returns score 100 and label high when all productive time is AI')
  it('returns score 0 and label healthy when ai is 0 and other time exists')
  it('excludes distraction time from the denominator')
  it('rounds score to nearest integer')
})
```

`streak.ts`:
```typescript
describe('calculateStreak', () => {
  it('increments streak when lastActiveDate is yesterday and today qualifies')
  it('does not increment when lastActiveDate is already today')
  it('resets streak to 1 when gap is more than one day and today qualifies')
  it('resets streak to 0 when gap is more than one day and today does not qualify')
  it('updates longestStreak when currentStreak exceeds it')
  it('never mutates the input StreakData object')
})
```

---

### 5.7 CI/CD Pipeline (V2)

**Purpose:** Automate build, test, lint, and format checks on every commit and PR. Prevents regressions from being silently merged into the main branch.

**Platform:** GitHub Actions

**Workflow: `ci.yml` (runs on every push to main and every PR)**
```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node (Node.js 20)
      - npm ci (in both extension/ and core/)
      - npm run lint (zero errors required)
      - npm run build (zero errors required)
      - npm test (coverage thresholds enforced)

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - npm audit (fails on high or critical vulnerabilities)
      - Check manifest.json permissions have not changed
```

**Workflow: `publish-core.yml` (runs on git tag matching `core-v*`)**
```yaml
jobs:
  publish:
    steps:
      - npm ci && npm run build (in core/)
      - npm test (must pass)
      - npm publish --access public
```

**Branch protection rules (configured on GitHub):**
- `main` branch: require PR, require CI to pass, no force push, no direct commits
- All PRs require at least one passing CI run before merge

**Pin all action versions to commit SHAs** — never use floating tags (`@v3`). This is a supply chain security requirement documented in `security.md`.

---

## 6. V3 — Cloud and Platform Specification

> **Gate:** V2 stable 4+ weeks, `@studylens/core` on npm, dashboard live, ≥3 users requesting sync
> **Estimated scope:** 4–6 months after V2 gate

### 6.1 Backend Architecture

**Philosophy:** The backend is opt-in infrastructure for sync, not the primary product. V1 and V2 remain fully functional without any backend. The backend enables multi-device sync for users who want it — nothing more in V3.

**Stack decision rationale:**

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20+ (LTS) | Consistent with extension's TypeScript ecosystem |
| Framework | Express.js | Minimal, well-understood, no magic |
| Database | PostgreSQL via Supabase | Managed, built-in auth, row-level security, free tier |
| Auth | Supabase Auth | OAuth (Google) + email/password, JWT-based, token rotation built in |
| Hosting | Railway | Simple, Git-based deploys, reasonable free tier, no cold starts |
| Validation | Zod | Same library as the reference GEMINI.md UPSC project — consistent pattern |
| ORM | None — raw SQL via Supabase client | Schema is simple enough that an ORM adds complexity without benefit |
| Environment | dotenv + Zod validation at startup | Server must not start with missing environment variables |

**Backend folder structure:**
```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts          ← Zod schema for all env vars — validated at startup
│   │   └── supabase.ts     ← Supabase client singleton
│   ├── middleware/
│   │   ├── auth.ts         ← Verify Supabase JWT on protected routes
│   │   ├── rateLimit.ts    ← Rate limiting per IP and per user
│   │   ├── asyncHandler.ts ← Wrap async route handlers
│   │   └── error.ts        ← Centralised error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   ├── records/
│   │   │   ├── records.routes.ts
│   │   │   ├── records.controller.ts
│   │   │   ├── records.service.ts
│   │   │   └── records.validation.ts  ← Zod schemas
│   │   └── user/
│   │       ├── user.routes.ts
│   │       ├── user.controller.ts
│   │       └── user.service.ts
│   ├── utils/
│   │   ├── apiResponse.ts  ← sendSuccess() + sendError() — frozen response contract
│   │   └── logger.ts       ← Winston
│   └── app.ts
├── server.ts               ← env validate → db connect → listen
├── .env.example
└── package.json
```

**API response contract (frozen — extension and dashboard depend on this shape):**
```typescript
// Success
{ "success": true, "message": "string", "data": {} }

// Error
{ "success": false, "message": "string", "errors": [] }
```

This contract must never change. Adding fields inside `data` is allowed. Adding top-level keys is not.

---

### 6.2 Database Schema (PostgreSQL via Supabase)

```sql
-- Users are managed by Supabase Auth — this table extends the auth.users table
CREATE TABLE public.user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timezone    TEXT NOT NULL DEFAULT 'UTC',  -- stored for future daily reset calculations
  plan        TEXT NOT NULL DEFAULT 'free'  -- 'free' | 'pro' (V5 monetisation)
);

-- One row per user per calendar date
CREATE TABLE public.daily_records (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  ai_seconds       INTEGER NOT NULL DEFAULT 0,
  coding_seconds   INTEGER NOT NULL DEFAULT 0,
  study_seconds    INTEGER NOT NULL DEFAULT 0,
  distraction_seconds INTEGER NOT NULL DEFAULT 0,
  uncategorized_seconds INTEGER NOT NULL DEFAULT 0,
  dependency_score INTEGER,           -- cached score (0-100), recomputed on sync
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)               -- one record per user per day
);

-- Planner goals — one active row per user
CREATE TABLE public.planner_goals (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coding_minutes  INTEGER NOT NULL DEFAULT 120,
  study_minutes   INTEGER NOT NULL DEFAULT 120,
  ai_ceiling_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (performance)
CREATE INDEX idx_daily_records_user_date ON public.daily_records(user_id, date DESC);
CREATE INDEX idx_daily_records_date ON public.daily_records(date);

-- Row Level Security (RLS) — users can only read and write their own rows
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own records only"
  ON public.daily_records
  FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.planner_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own goals only"
  ON public.planner_goals
  FOR ALL
  USING (auth.uid() = user_id);
```

---

### 6.3 API Endpoints (V3)

All endpoints are versioned at `/api/v1/`. All protected endpoints require `Authorization: Bearer <supabase_jwt>` header.

```
POST   /api/v1/auth/signup
       Body: { email, password }
       Creates Supabase auth user + user_profile row
       Returns: { success, message, data: { user } }

POST   /api/v1/auth/login
       Body: { email, password }
       Returns: { success, message, data: { accessToken, expiresAt } }
       Note: refresh token is returned by Supabase SDK, stored in chrome.storage.local by extension

POST   /api/v1/records/sync           [PROTECTED]
       Body: { records: DailyRecord[] }
       Upserts records for the authenticated user — server-side deduplication by (user_id, date)
       Conflict resolution: server takes the MAX of each seconds field (more data = more accurate)
       Returns: { success, message, data: { synced: number, skipped: number } }

GET    /api/v1/records                [PROTECTED]
       Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=90
       Returns records within the date range, newest first, capped at limit (max 365)
       Returns: { success, message, data: { records: DailyRecord[], total: number } }

GET    /api/v1/records/:date          [PROTECTED]
       Returns a single record for the given date
       Returns 404 if no record exists for that date

PUT    /api/v1/goals                  [PROTECTED]
       Body: { coding_minutes, study_minutes, ai_ceiling_minutes }
       Zod validated — all values must be integers 0–480
       Returns: { success, message, data: { goals } }

GET    /api/v1/goals                  [PROTECTED]
       Returns current planner goals for the authenticated user

DELETE /api/v1/user                   [PROTECTED]
       Deletes the Supabase auth user (cascades to all tables via ON DELETE CASCADE)
       Sends confirmation email
       Returns: { success, message }
       This is the GDPR right-to-deletion endpoint — must complete within 30 days
       In practice it is immediate — PostgreSQL cascade handles it in the same transaction
```

---

### 6.4 Sync Logic in the Extension (V3)

**Sync is opt-in, explicitly initiated by the user, and clearly labelled as optional.**

**Auth storage in extension:**
```typescript
// Added to StorageSchema in V3
export interface AuthState {
  accessToken: string | null
  userId: string | null
  email: string | null
  tokenExpiresAt: number | null   // Date.now() timestamp
  syncEnabled: boolean            // user must explicitly opt in
  lastSyncedAt: number | null     // Date.now() of last successful sync
}
```

**Sync trigger points:**
1. `"dailyReset"` alarm: if `syncEnabled` and user is authenticated, POST last 7 days of records
2. Dashboard "Sync now" button: manual trigger
3. Extension startup: if authenticated, fetch server records and merge (server wins for past dates, local wins for today)

**Conflict resolution rules:**
- For any past date (not today): `max(local_seconds, server_seconds)` for each category field — the higher value represents more data and is always more accurate
- For today's date: local wins unconditionally — the server may have yesterday's sync but the extension has been tracking all day
- Never delete local records because the server doesn't have them — local is the primary source of truth

**Offline behaviour:**
- Extension works 100% offline — all core functionality uses `chrome.storage.local` only
- Sync failures are logged to console, displayed as "Sync failed — will retry" in the dashboard
- Failed sync attempts are retried on the next `"dailyReset"` alarm

---

### 6.5 Firefox Support (V3)

**Status:** Planned for V3, not V1 or V2.

**Why V3, not earlier:**
Firefox uses the `browser.*` API namespace instead of `chrome.*` for most extension APIs. The `webextension-polyfill` library (maintained by Mozilla) bridges this gap and allows a single codebase to target both. However, introducing it in V1 adds complexity before the core is stable.

**Implementation plan:**
- Add `webextension-polyfill` as a runtime dependency
- Add `@types/webextension-polyfill` as a dev dependency
- Replace all `chrome.*` calls with `browser.*` via the polyfill
- Add Firefox-specific `manifest.json` (the manifest format differs slightly — Firefox requires `browser_specific_settings`)
- Add a build target for Firefox in `package.json`: `"build:firefox": "tsc && cp manifest.firefox.json dist/manifest.json"`
- Submit to Firefox Add-ons (AMO) — free, no developer fee unlike Chrome Web Store

**API differences to handle:**
```typescript
// Chrome                           // Firefox (via polyfill → same syntax)
chrome.storage.local.get()         browser.storage.local.get()
chrome.tabs.onActivated            browser.tabs.onActivated
chrome.alarms.create()             browser.alarms.create()
```

With the polyfill, these differences are transparent. The codebase remains a single TypeScript source that compiles to both browser targets.

---

### 6.6 GDPR Compliance Tools (V3)

**Why V3:** GDPR compliance only matters when user data is stored on a server. V1 and V2 store nothing externally. V3 introduces the backend and thus triggers GDPR obligations.

**Required user-facing tools:**

| Right | Implementation | Where in UI |
|---|---|---|
| Right to access | `GET /api/v1/records` returns all records | Dashboard → Settings → "Download all my data" → JSON export |
| Right to deletion | `DELETE /api/v1/user` deletes account + all records | Dashboard → Settings → "Delete my account" → confirmation → API call |
| Right to portability | Full export in both JSON (machine-readable) and CSV (human-readable) formats | Dashboard → Settings → "Export data" |
| Right to rectification | Dashboard → History → delete individual daily records | Dashboard → History → each row has a delete button |
| Right to object | Sync can be disabled at any time without deleting the account | Dashboard → Settings → "Disable sync" toggle |

**Privacy policy requirement:**
- A privacy policy must exist at a public URL before V3 ships to the Chrome Web Store
- The policy must accurately describe what data is collected, where it is stored, who has access, and how to delete it
- The Chrome Web Store listing must link to it
- The privacy policy is not a legal document to be written by the developer alone — consult a template from resources like `privacypolicies.com` and adapt it

**Data residency:**
- Supabase allows choosing the database region — choose a region that matches your primary user base
- Default: `us-east-1` (closest to the global average for a developer tool)
- Document this choice in this file if it changes

---

## 7. V4 — Intelligence Layer

> **Gate:** Backend in production 8+ weeks, cloud sync stable for 50+ users, external privacy audit completed
> **Estimated scope:** 6–12 months after V3 gate
> **Risk level:** High — this version introduces ML and institutional features, both of which have complex failure modes

### 7.1 Heuristic Weakness Detection

**Philosophy:** Weakness detection in V4 is still heuristic-based (rule-driven), not ML-based. True ML models require more data than a solo open-source tool will have at this stage. Heuristics that are transparent, explainable, and debuggable are more appropriate.

**Definition of "weakness" in StudyLens context:**
A topic area where a student's AI dependency ratio is significantly higher than their average across all topics. The assumption: if you consistently use AI more for one topic than others, it is likely because that topic is harder for you — which makes it the most important topic to practise without AI.

**Topic tagging — URL pattern approach (no page content reading):**
```typescript
// classifier.ts extension in V4 — added to SITE_LISTS as a sub-category system
export const TOPIC_PATTERNS: Record<string, RegExp[]> = {
  'dynamic-programming': [
    /leetcode\.com\/problems\/.*(dp|dynamic|knapsack|fibonacci|coin|jump)/i,
    /codeforces\.com\/.*\/problem\/.*dp/i
  ],
  'data-structures': [
    /leetcode\.com\/problems\/.*(tree|graph|linked-list|stack|queue|heap)/i
  ],
  'system-design': [
    /leetcode\.com\/discuss.*system.*design/i,
    /github\.com\/.*system.*design/i,
    /systemdesignprimer/i
  ],
  'machine-learning': [
    /coursera\.org\/learn\/(machine|deep|neural|tensorflow|pytorch)/i,
    /fast\.ai/i,
    /kaggle\.com/i
  ]
  // expandable — contributors add patterns via PR
}
```

**Weakness flag criteria:**
```
A topic T has a weakness flag if:
  topic_ai_ratio(T) > overall_ai_ratio × 1.5
  AND topic_total_seconds(T) > 3600  (at least 1 hour spent on the topic)
  AND data covers at least 7 days

topic_ai_ratio(T) = seconds spent on AI tools while working on topic T
                   ÷ total seconds spent on topic T across all categories

overall_ai_ratio = total ai_seconds ÷ (total ai + coding + study seconds)
```

**How topic tracking works with the URL pattern approach:**
- When `background.ts` finalises a session, it calls a new function `classifyTopic(url)` from `classifier.ts`
- `classifyTopic` returns a `string | null` (the topic tag, or null if no pattern matches)
- The topic tag is stored alongside the session duration in `DailyRecord`
- No page content is read — only the URL is matched against patterns

**StorageSchema additions in V4:**
```typescript
// Added in V4
topicRecords: Record<string, TopicRecord>  // keyed by topic name

export interface TopicRecord {
  topic: string
  totalAiSeconds: number
  totalCodingSeconds: number
  totalStudySeconds: number
  sessionCount: number
  firstSeenDate: string
  lastSeenDate: string
  weaknessFlag: boolean  // computed on each sync
}
```

---

### 7.2 Institutional Dashboard (V4)

**Purpose:** A separate web application for educators, bootcamp instructors, and cohort managers to view anonymised aggregate data across their students.

**Critical privacy constraint:** The institutional dashboard NEVER exposes individual student data. Only aggregate statistics are visible to instructors. Students must explicitly opt into an institution before any of their data contributes to the aggregate.

**Data model additions:**
```typescript
// Backend only — never in extension storage
export interface Institution {
  id: string
  name: string
  code: string        // unique 6-character join code (e.g. "SL-ABC1")
  adminUserId: string
  createdAt: Date
}

export interface InstitutionMembership {
  userId: string
  institutionId: string
  joinedAt: Date
  dataSharing: 'aggregate_only'  // V4 only supports aggregate — no individual data
}
```

**Institutional dashboard pages:**
- **Cohort overview:** Average dependency score across all opted-in members, trend over the last 30 days, distribution histogram (how many students are healthy/moderate/high)
- **Topic coverage:** Which topics are members spending time on? Which topics have the highest average dependency?
- **Engagement:** Daily active users (opted-in members who have any activity that day), streak distribution
- **No individual data:** No student names, no individual scores, no way to identify a specific student's behaviour

**Student opt-in flow:**
1. Student receives a 6-character join code from their instructor
2. Student enters code in Dashboard → Settings → "Join Institution"
3. A confirmation dialog explains exactly what data will be shared (aggregate only) and how to leave
4. Student can leave at any time: Dashboard → Settings → "Leave [Institution Name]"
5. Leaving immediately removes the student from all future aggregate calculations

---

### 7.3 Curriculum Alignment (V4)

**Purpose:** Allow institutions to define a curriculum map — a list of topics with expected weekly time allocations — and show students how their actual usage compares to the curriculum.

**Example curriculum map (JSON format, uploaded by instructor):**
```json
{
  "name": "12-Week DSA Bootcamp",
  "weeks": [
    {
      "week": 1,
      "topics": ["arrays", "strings"],
      "recommended_hours": { "coding": 15, "study": 5, "ai_max": 3 }
    },
    {
      "week": 2,
      "topics": ["linked-lists", "stacks"],
      "recommended_hours": { "coding": 15, "study": 5, "ai_max": 3 }
    }
  ]
}
```

**Student view:**
- Curriculum progress bar on Today page: `"Week 3: Arrays — 8h 20m / 15h coding goal"`
- Topic completion indicator: green when the student has met the coding hours for a topic
- "You're ahead on arrays but behind on linked lists" — based on curriculum map

**This feature requires the institutional dashboard to be live first.** It is not a standalone feature.

---

### 7.4 Adaptive Score Model (V4 — Research Phase)

**Status:** Research and experimentation only in V4. Not committed to ship.

**The limitation of the current formula:**
The V1 formula `score = ai / (ai + coding + study)` treats all AI usage identically. An hour of using ChatGPT to look up documentation is weighted the same as an hour of having ChatGPT write all your code. The self-reflection prompt is the current mitigation — user-provided signals adjust the raw score.

**V4 research direction — weighted scoring:**
```
weighted_ai = sum of all AI sessions where:
  if session.solvedByAI === true:  weight = 1.0  (full AI usage)
  if session.solvedByAI === false: weight = 0.4  (reference usage)
  if session.solvedByAI === null:  weight = 0.7  (unknown — conservative estimate)

adaptedScore = weighted_ai / (weighted_ai + coding + study)
```

**Validation requirement before shipping:**
This model must be validated against user-provided ground truth before shipping. The validation approach:
1. Recruit 20+ power users who have consistent reflection history (≥30 reflection answers)
2. Show them both their V1 score and the adapted score
3. Ask: "Which score feels more accurate to your actual experience?"
4. Only ship the adapted model if ≥75% of validators prefer it

---

## 8. V5 — Ecosystem and Platform

> **Gate:** V4 stable, institutional pilot completed, ML pipeline validated
> **Estimated scope:** 12+ months after V4 gate
> **Risk level:** Very high — this version is a platform play with significant scope and organisational complexity

### 8.1 Mobile Applications

**Platforms:** Android (React Native) and iOS (React Native) — shared codebase

**Scope difference from extension:**
Mobile apps cannot hook into browser tab events. The mobile tracking model is fundamentally different:
- Users manually log study sessions (start/stop timer approach)
- AI usage is self-reported via quick-log buttons: "I just asked AI for help" → records 15 minutes to AI category
- Mobile app syncs with the backend — mobile data and desktop data merge in the unified history view
- Mobile-specific features: push notifications for streak reminders, daily check-in, weekly report notification

**Why React Native:**
- Shared codebase between iOS and Android
- `@studylens/core` can be imported directly — all calculation logic is already pure TypeScript
- Expo managed workflow for faster development
- No need for native modules in V5 scope

**Data model compatibility:**
Mobile sessions use the same `DailyRecord` interface. The `source` field must be added in V5:
```typescript
// Added in V5
export interface DailyRecord {
  // ... existing fields ...
  source: 'extension' | 'mobile' | 'manual'  // added in V5
}
```
This is a non-breaking addition to the interface. Existing extension code that writes `DailyRecord` without `source` will be backfilled as `'extension'` during the V5 migration.

---

### 8.2 Public API and Developer Ecosystem

**Purpose:** Allow third-party developers to build tools on top of StudyLens data. The ecosystem play that makes StudyLens a platform rather than a product.

**API model:** REST API with API key authentication (not Supabase JWT — a separate authentication layer for third-party developers)

**Rate limits:**
```
Free tier: 100 requests/day, 10 requests/minute
Pro tier:  10,000 requests/day, 100 requests/minute
```

**V5 public endpoints:**
```
GET  /api/v2/me/summary?period=week|month|year
     Returns aggregated summary for the authenticated user
     Response: { totalHours, dependencyScore, topCategory, streakDays }

GET  /api/v2/me/records?from=date&to=date
     Returns daily records (same as v1 but v2 includes source field)

GET  /api/v2/institutions/:code/summary   [INSTITUTION ADMIN ONLY]
     Returns anonymous aggregate for the institution
```

**Developer documentation:**
- Public docs site (not in the GitHub repo — a separate hosted site, e.g. `docs.studylens.dev`)
- OpenAPI spec (auto-generated from route definitions using `swagger-jsdoc`)
- Interactive API explorer (Swagger UI)
- Rate limit headers on all responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### 8.3 Integrations Marketplace (V5)

**Third-party integrations that should be buildable on the public API:**

| Integration | What it does | Who builds it |
|---|---|---|
| Notion widget | Embed today's StudyLens score in a Notion dashboard | Community contributor |
| GitHub README badge | `![AI Dependency](https://studylens.dev/badge/username)` | Core team |
| Discord bot | `!studylens` command shows your current week's stats | Community contributor |
| Obsidian plugin | Daily note automatically includes today's study summary | Community contributor |
| VS Code extension | Status bar shows current category + time in VS Code | Community contributor |
| Calendar integration | Export weekly summaries to Google Calendar as events | V5 core feature |

**The badge endpoint is V5 core:**
```
GET /api/v2/badge/:userId
    Returns an SVG badge with the user's weekly average dependency score
    Colour: green/amber/red based on score band
    Cached: 1 hour TTL to prevent abuse
    User must opt in to public badge in their profile settings
```

---

## 9. Technical Debt Register

Debt is tracked here rather than in GitHub issues because it requires architectural context to understand. Each item has a severity, an owner, and a target version for resolution.

| ID | Description | Severity | Target Version | Notes |
|---|---|---|---|---|
| TD-001 | `chrome.storage.local` has no transactions — concurrent writes from `tick` alarm and `handleTabChange` can cause race conditions if Chrome fires both in the same millisecond | Medium | V2 | Mitigation in V1: rolling window approach in tick. Full fix in V2: queue-based storage writes |
| TD-002 | YouTube classified as `study` regardless of what is being watched — cooking videos counted as study time | Low | V2 | V2 introduces user-correctable classification per domain |
| TD-003 | `extractDomain` called twice per tab change (once in `isTrackableUrl`, once in `classifySite`) — minor performance redundancy | Low | V2 | Refactor: single call to `extractDomain`, pass result to both functions |
| TD-004 | Popup re-reads all of `chrome.storage.local` on every open — no delta detection or caching | Low | V2 | Acceptable for V1. V2 introduces `useStorage` hook with selective reads |
| TD-005 | No error reporting or monitoring in V1 — bugs reported by users are hard to reproduce | Medium | V3 | V3 introduces opt-in error reporting using a self-hosted Sentry instance |
| TD-006 | `SITE_LISTS` in `classifier.ts` is a static array — no way to add custom sites without a code change and rebuild | Medium | V2 | V2 adds `customSites` to `StorageSchema` — merged with `SITE_LISTS` at classification time |
| TD-007 | `StorageSchema.reflectionHistory` is an unbounded array capped only by a `slice` at write time — if slice fails, array grows indefinitely | Low | V2 | Add a migration that caps the array on first V2 load |
| TD-008 | No storage schema versioning — if `StorageSchema` changes, old data silently breaks | High | V2 | V2 introduces `schemaVersion: number` field and a migration runner in `initializeStorage()` |
| TD-009 | `popup.ts` re-attaches button event listeners on every popup open — harmless in V1 but could cause double-fire bugs if listeners survive popup close | Low | V2 | Use `{ once: true }` option on event listeners or check for existing listeners |
| TD-010 | No accessibility audit on popup or dashboard — keyboard navigation and screen reader support are untested | Medium | V2 | V2 introduces a11y checklist in the pre-release process |

---

## 10. Architecture Evolution Plan

### 10.1 Storage Schema Versioning (Critical — must implement in V2)

**The problem:** `StorageSchema` will change between versions. Adding new fields is safe (they default to `undefined` and are handled by the `?? default` pattern). But if a field is renamed or removed, old data silently breaks without an error.

**The solution — schema versioning with migration runners:**

```typescript
// Added to StorageSchema in V2
export interface StorageSchema {
  schemaVersion: number  // current version: 1 (V1), 2 (V2), 3 (V3)...
  // ... rest of schema
}

// storage.ts — migration runner called in initializeStorage()
const MIGRATIONS: Record<number, (data: Partial<StorageSchema>) => Partial<StorageSchema>> = {
  1: (data) => data,  // V1 baseline — no migration needed
  2: (data) => ({     // V1 → V2 migration
    ...data,
    goals: data.goals ?? { coding: 120, study: 120, aiCeiling: 60 },
    weeklyReports: data.weeklyReports ?? [],
    customSites: data.customSites ?? [],
    detoxSession: data.detoxSession ?? null,
    schemaVersion: 2
  }),
  3: (data) => ({     // V2 → V3 migration
    ...data,
    auth: data.auth ?? { accessToken: null, userId: null, email: null, tokenExpiresAt: null, syncEnabled: false, lastSyncedAt: null },
    schemaVersion: 3
  })
}

async function runMigrations(data: Partial<StorageSchema>): Promise<StorageSchema> {
  const currentVersion = data.schemaVersion ?? 1
  const targetVersion = CURRENT_SCHEMA_VERSION
  let migrated = data
  for (let v = currentVersion; v < targetVersion; v++) {
    migrated = MIGRATIONS[v + 1](migrated)
  }
  await chrome.storage.local.set(migrated)
  return migrated as StorageSchema
}
```

**Rule:** Every `StorageSchema` change must be accompanied by a migration entry. No exceptions. The migration must be idempotent — running it twice produces the same result as running it once.

---

### 10.2 Module Dependency Graph (Must Remain Acyclic)

The dependency graph must remain a DAG (directed acyclic graph) in all versions:

```
background.ts
├── → classifier.ts
├── → storage.ts
│     └── → types/index.ts
├── → score.ts
│     └── → types/index.ts
├── → streak.ts
│     └── → types/index.ts
└── → reflection.ts
      └── → types/index.ts

popup.ts
├── → storage.ts
├── → score.ts
├── → streak.ts
└── → reflection.ts

@studylens/core (V2+)
└── re-exports: classifier, score, streak, reflection, types
```

**Invariants that must hold in all versions:**
- `types/index.ts` imports from nothing
- `classifier.ts`, `score.ts`, `streak.ts`, `reflection.ts` import only from `types/index.ts`
- `storage.ts` imports from `types/index.ts` only
- `background.ts` imports from all of the above but from nothing outside `extension/src/`
- No circular imports — enforced by ESLint `import/no-cycle` rule (added in V2)

---

### 10.3 Event System (V3 — Replacing Direct Function Calls)

**The problem:** In V3, multiple systems need to react to the same event. When a tab session finalises, `background.ts` currently calls `updateTodayRecord`, `updateStreak`, and `setPendingReflection` directly. Adding sync (V3) and topic tagging (V4) means adding more direct calls, making `background.ts` increasingly coupled to downstream concerns.

**The solution — a lightweight internal event bus:**

```typescript
// eventBus.ts — new module in V3
type EventType = 'session:finalized' | 'daily:reset' | 'reflection:answered' | 'sync:completed'

type EventPayload = {
  'session:finalized': { session: ActiveSession, durationSeconds: number }
  'daily:reset': { date: string }
  'reflection:answered': { entry: ReflectionEntry }
  'sync:completed': { recordsSynced: number }
}

const listeners = new Map<EventType, Function[]>()

export function on<T extends EventType>(event: T, handler: (payload: EventPayload[T]) => Promise<void>): void {
  const existing = listeners.get(event) ?? []
  listeners.set(event, [...existing, handler])
}

export async function emit<T extends EventType>(event: T, payload: EventPayload[T]): Promise<void> {
  const handlers = listeners.get(event) ?? []
  await Promise.all(handlers.map(h => h(payload)))
}
```

**background.ts in V3 emits events, subscribers handle their own concerns:**
```typescript
// Instead of calling every downstream function directly:
await emit('session:finalized', { session, durationSeconds })

// Subscribers registered elsewhere:
on('session:finalized', async ({ session, durationSeconds }) => updateTodayRecord(session.category, durationSeconds))
on('session:finalized', async ({ session, durationSeconds }) => updateStreak(...))
on('session:finalized', async ({ session, durationSeconds }) => checkReflection(...))
on('session:finalized', async ({ session, durationSeconds }) => syncToBackend(...))  // V3 addition
on('session:finalized', async ({ session, durationSeconds }) => tagTopic(...))       // V4 addition
```

This makes adding new behaviour a matter of registering a new subscriber, not editing `background.ts`.

---

### 10.4 Dependency Strategy

**Rules that govern adding any npm dependency:**

1. **Is it strictly necessary?** Can the feature be built with 50 lines of native TypeScript? If yes, do not add the dependency.

2. **What is the maintenance status?** Check: last commit date, number of open issues, weekly downloads, number of maintainers. A package with one maintainer and no commits in 2 years is a liability.

3. **What is the bundle size impact?** Run `npm pack` and compare the extension zip size before and after. Extension zip must remain under 5MB.

4. **Does it make network requests?** Any dependency that phones home — even for telemetry — is incompatible with the privacy promise. Check the source code, not just the documentation.

5. **Is the license compatible with MIT?** GPL-licensed dependencies force the extension to become GPL, which is incompatible with the current MIT license.

**Approved dependencies by version:**

| Package | Version | Purpose | Added In |
|---|---|---|---|
| `typescript` | dev only | Language | V1 |
| `eslint` + TS plugins | dev only | Linting | V1 |
| `prettier` | dev only | Formatting | V1 |
| `jest` + `ts-jest` | dev only | Testing | V2 |
| `jest-chrome` | dev only | Chrome API mocks | V2 |
| `react` + `react-dom` | dashboard only | Dashboard UI | V2 |
| `vite` | dashboard dev only | Dashboard build | V2 |
| `chart.js` | dashboard only | Weekly chart | V2 |
| `webextension-polyfill` | runtime | Firefox support | V3 |
| `express` | backend only | HTTP framework | V3 |
| `zod` | backend only | Validation | V3 |
| `winston` | backend only | Logging | V3 |

No dependency not on this list should be added without an entry in §18 Decisions Log.

---

## 11. Infrastructure Roadmap

### 11.1 Hosting Strategy by Version

| Version | What is hosted | Where | Cost estimate |
|---|---|---|---|
| V1–V2 | Nothing — extension is local | — | $0 |
| V3 | Backend API | Railway (free tier → $5/month Hobby) | $0–$5/month |
| V3 | PostgreSQL | Supabase (free tier → Pro $25/month) | $0–$25/month |
| V4 | Institutional dashboard | Vercel (free tier) | $0 |
| V5 | Public API, docs site, mobile backend | Railway + Supabase Pro | ~$50/month |

**Rule:** Do not pay for infrastructure before the version gate is passed. Free tiers are sufficient for all pre-gate development.

### 11.2 Domain Strategy

- `studylens.dev` — primary domain (acquire before V3 ships)
- `docs.studylens.dev` — developer documentation (V5)
- `app.studylens.dev` — web dashboard (V3 — current dashboard is bundled in extension, but a hosted version enables sharing)

**Do not acquire these domains until they are needed.** Domain renewal costs compound and the project may pivot.

### 11.3 CDN and Asset Delivery

- V1–V2: No CDN needed — all assets bundled in extension
- V3: Supabase Storage for any user-uploaded assets (curriculum maps in V4)
- V5: Cloudflare in front of the API for rate limiting and DDoS protection

---

## 12. Security and Privacy Evolution

### 12.1 Privacy Posture by Version

| Version | Data leaving the browser | Account required | Privacy audit required |
|---|---|---|---|
| V1 | None | No | No |
| V2 | None | No | No |
| V3 | Optional sync — opt-in, user data only | Optional | Yes — before V3 ships |
| V4 | Optional sync + anonymised aggregate for institutions | Optional | Yes — before institutional dashboard ships |
| V5 | Public badge endpoint — opt-in, public score only | Yes (for badge) | Yes — before V5 ships |

**The privacy audit for V3:**
Before V3 ships to the Chrome Web Store, an independent security reviewer must audit:
- The backend API for authentication flaws, injection vulnerabilities, and data leaks
- The extension's sync code for data that should not be sent but is
- The `DELETE /api/v1/user` endpoint — must actually delete all data
- Row-Level Security policies on Supabase — must be correctly configured

This does not require a commercial security firm. A competent developer friend with backend security knowledge is sufficient for V3 scope. Document who performed the audit, when, and what they found.

### 12.2 Threat Model

**V1–V2 threat model (local only):**
- Primary threat: Malicious extension update that adds data exfiltration — mitigated by open source (community can read every commit) and Chrome Web Store review
- Secondary threat: XSS via popup HTML — mitigated by strict CSP in `manifest.json`
- Tertiary threat: Dependency supply chain attack — mitigated by zero runtime dependencies in V1, minimal in V2

**V3+ threat model (backend added):**
- Authentication bypass — mitigated by Supabase Auth JWT + server-side verification on every request
- SQL injection — mitigated by using Supabase client (parameterised queries only, no raw SQL string concatenation)
- Rate limit abuse — mitigated by per-IP and per-user rate limiting
- Token theft — access tokens stored in `chrome.storage.local` (not `localStorage`, not cookies) — only accessible to the extension itself
- Data breach — minimised by storing only aggregated seconds counts, not browsing URLs — even a full database dump reveals only that a user spent X hours on AI tools

---

## 13. Performance Targets

These are the non-negotiable performance budgets. If a feature causes these to be exceeded, the feature must be optimised or scoped back before shipping.

### 13.1 Extension Performance

| Metric | V1 Target | V2 Target | V3 Target |
|---|---|---|---|
| Extension zip size | < 500KB | < 2MB | < 5MB |
| `background.ts` service worker startup time | < 50ms | < 50ms | < 100ms |
| `handleTabChange()` execution time | < 10ms | < 10ms | < 20ms |
| Popup initial render time (from click to visible) | < 200ms | < 300ms | < 400ms |
| `chrome.storage.local` read for popup | < 50ms | < 50ms | < 50ms |
| Memory footprint (background service worker when active) | < 5MB | < 10MB | < 15MB |

### 13.2 Backend Performance (V3)

| Metric | Target |
|---|---|
| `POST /api/v1/records/sync` response time (p95) | < 500ms |
| `GET /api/v1/records` response time (p95) | < 300ms |
| `DELETE /api/v1/user` response time | < 2s |
| API availability | ≥ 99.5% monthly |
| Database query time (p95) | < 100ms |

### 13.3 Dashboard Performance (V2)

| Metric | Target |
|---|---|
| Initial load time (cold, no cache) | < 1.5s |
| Time to interactive | < 2s |
| Weekly chart render time | < 100ms |
| CSV export generation (365 records) | < 500ms |

---

## 14. Open Source Strategy

### 14.1 Community Contribution Model

**V1:** Solo-maintained. PRs accepted but not solicited. One issue template for bugs.

**V2:** Actively invite contributions to the site classification list. This is the highest-impact low-barrier contribution a user can make. The CONTRIBUTING.md explains exactly how to do it in 10 minutes.

**V3:** Expand contribution model to include:
- New topic pattern rules (regex patterns for URL-based topic tagging)
- Translations (internationalisation infrastructure added in V3)
- Bug fixes with reproduction cases

**V4:** Institutional dashboard is a separate codebase that community contributors can build on. Clear interfaces, public API documentation.

**V5:** Full ecosystem — the `@studylens/core` package becomes a community-maintained project with a formal RFC (Request for Comments) process for breaking changes.

### 14.2 Governance Model

**V1–V2:** Benevolent dictator model — the solo developer has final say on everything. No formal process needed.

**V3:** If the project has ≥5 regular contributors, introduce:
- RFC template for breaking changes to `@studylens/core`
- A `CODEOWNERS` file assigning areas of the codebase to specific contributors
- A `DECISIONS.md` file (separate from this one) for recording community-facing architectural decisions

**V4+:** If the project reaches institutional usage, establish a steering committee. Document its composition, decision-making process, and term limits in `GOVERNANCE.md`.

### 14.3 Versioning and Release Process

**Current:**
- Git tags on every phase completion: `phase-1`, `phase-2`, etc.
- Chrome Web Store versions track `manifest.json` version string

**V2+:**
- Semver for `@studylens/core`: `MAJOR.MINOR.PATCH`
- Release notes in `CHANGELOG.md` using Keep a Changelog format
- GitHub Releases for every minor and major version bump
- `CHANGELOG.md` sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

---

## 15. Monetisation Strategy

**Principle:** The core product — dependency tracking, scoring, and honest self-awareness — is permanently free. We will not put the insight engine behind a paywall. Monetisation targets the operational costs of optional infrastructure (backend, sync) and premium institutional features.

### 15.1 Revenue Model (V5)

| Tier | Price | What it includes | Target user |
|---|---|---|---|
| Free | $0 | Full V1+V2 features, local only — permanent | Individual students |
| Pro | $4/month or $36/year | Cloud sync, multi-device, 2 years of history, weekly report emails | Power users who study across devices |
| Institution | $2/student/month (min 20 students) | Institutional dashboard, curriculum alignment, cohort analytics, priority support | Bootcamps, universities, coding schools |

**What is never paywalled:**
- The dependency score
- The classifier (all sites)
- The popup UI
- Self-reflection prompts
- Streak tracking
- Local data export (CSV/JSON)
- The `@studylens/core` npm package

### 15.2 Payment Infrastructure (V5)

- Payment processor: Stripe (most developer-friendly, well-documented)
- Subscription management: Stripe Billing (handles invoices, renewals, cancellations)
- Institutional billing: annual invoicing (B2B customers prefer invoices over card billing)
- Free trial: 30 days Pro for all new registrations (no credit card required)

**Rule:** Do not implement any payment infrastructure before V5 gate. Introducing billing too early creates compliance obligations (PCI-DSS, tax handling) that are disproportionate for a project at that stage.

---

## 16. Platform Expansion

### 16.1 Browser Support Timeline

| Browser | Support | Version | Notes |
|---|---|---|---|
| Chrome | Primary | V1 | Manifest V3, initial target |
| Edge | Secondary | V1 | Same Chromium engine — works without changes |
| Brave | Secondary | V1 | Same Chromium engine — works without changes |
| Arc | Secondary | V1 | Same Chromium engine — works without changes |
| Firefox | Planned | V3 | Requires `webextension-polyfill` — see §6.5 |
| Safari | Unplanned | V5+ | Safari Web Extension model differs significantly — requires native Swift wrapper |
| Opera | Low priority | V5+ | Chromium-based — similar to Edge but small market share |

### 16.2 Operating System Considerations

The extension itself is OS-agnostic (runs in the browser). The backend is Linux-only (Railway deploys Ubuntu containers). The dashboard is OS-agnostic (browser-based).

Windows-specific developer notes (relevant since the developer uses Windows/PowerShell):
- Use `rimraf` instead of `rm -rf` in npm scripts if cross-platform compatibility is needed
- File paths in `tsconfig.json` must use forward slashes — TypeScript handles the conversion
- Git line endings: set `core.autocrlf = true` in Git config to prevent CRLF issues in committed files

---

## 17. Research and Experimentation Backlog

These are ideas that are not committed to any version. They go here instead of disappearing. Before any of these is built, a proposal section must be written describing the problem, the approach, the success metric, and the rollback plan.

| ID | Idea | Status | Proposed For |
|---|---|---|---|
| R-001 | AI context detection: classify AI usage by intent (debugging help vs code generation vs research) using URL patterns and session patterns | Research | V4 |
| R-002 | Keyboard shortcut to trigger self-reflection without opening popup | Proposed | V2 |
| R-003 | "Study buddy" feature: two users share aggregate scores with each other for accountability — opt-in, anonymised | Proposed | V4 |
| R-004 | Local language model running in the extension (via Chrome's Prompt API) to provide natural-language explanations of the score | Research | V4+ |
| R-005 | Spaced repetition integration: detect that a student hasn't returned to a topic in 7+ days and surface a reminder | Proposed | V3 |
| R-006 | Dark pattern detection: if a student's distraction sessions consistently start within 5 minutes of a coding session ending, flag it as a focus issue | Research | V4 |
| R-007 | GitHub Copilot usage detection: Copilot runs in VS Code, not the browser — cannot be tracked by an extension. Research alternative approach (e.g. VS Code extension that integrates with StudyLens) | Research | V5 |
| R-008 | Pomodoro native integration: sync focus session completion with a Pomodoro timer — no external app needed | Proposed | V2 |
| R-009 | Export to Anki: convert topic weakness flags into Anki deck suggestions | Research | V4 |
| R-010 | StudyLens CLI for developers who want to log sessions from the terminal when not using a browser | Removed | — | Removed in the initial project design — wrong audience. Documented here so it is not re-proposed. |

---

## 18. Decisions Log

Every significant architectural decision is recorded here with context. Future decisions should reference this log to avoid re-litigating settled questions.

---

**D-001 — Why Manifest V3 and not V2**
Date: 2026-03-21
Decision: V3 only
Rationale: Chrome Web Store stopped accepting new Manifest V2 extensions in January 2023. All new extensions must use V3. There is no valid reason to target V2 for a new project.
Alternatives considered: None — V2 is not an option for new Web Store submissions.

---

**D-002 — Why `chrome.storage.local` and not IndexedDB**
Date: 2026-03-21
Decision: `chrome.storage.local`
Rationale: `chrome.storage.local` is accessible from both the service worker and the popup without any configuration. IndexedDB in a service worker requires careful lifecycle management and is significantly more complex to use correctly. For V1's data volume (a few KB of daily records), `chrome.storage.local` is more than sufficient.
Alternatives considered: IndexedDB (too complex for the benefit), SQLite via WASM (bundle size impact is prohibitive), localStorage (not available in service workers).
Future revision: If `chrome.storage.local` becomes a bottleneck (unlikely before V4), IndexedDB will be evaluated.

---

**D-003 — Why no ML in V1/V2/V3**
Date: 2026-03-21
Decision: Heuristic scoring only through V3
Rationale: ML models require training data, evaluation infrastructure, model serving infrastructure, and a dataset large enough to produce meaningful results. A solo open-source extension does not have access to any of these before V3. Heuristics are transparent, debuggable, and require no infrastructure. They can be explained to users in plain English.
Future revision: V4 re-evaluates ML if ≥1000 users with consistent reflection histories are available as a training signal.

---

**D-004 — Why CLI was removed**
Date: 2026-03-21
Decision: CLI removed from scope permanently
Rationale: The CLI would serve developers who want to log study sessions from the terminal. This is a different user than the target audience (students using a browser). Supporting two interaction models in V1 splits focus and doubles the maintenance burden. A VS Code extension (R-007) is a better fit for the developer use case and is deferred to V5.

---

**D-005 — Why YouTube is classified as `study` by default**
Date: 2026-03-21
Decision: YouTube → study category
Rationale: The majority of intentional YouTube usage for the target audience (CS students) is for tutorials, lectures, and course content. Classifying it as `distraction` by default would make the tool feel accusatory and incorrect for users watching legitimate educational content. The popup includes a note acknowledging this is approximate. V2 adds per-domain overrides.
Alternative considered: `uncategorized` (chosen by user) — rejected because it creates friction at setup and most users will not configure it.
Future revision: V4 topic tagging may allow distinguishing `youtube.com/watch?v=[lecture]` from `youtube.com/shorts` based on URL patterns.

---

**D-006 — Why Supabase over a self-hosted PostgreSQL**
Date: 2026-03-21
Decision: Supabase managed PostgreSQL
Rationale: Self-hosting PostgreSQL requires server provisioning, backups, updates, monitoring, and connection pooling — all of which are operational overhead that a solo developer should not absorb in V3. Supabase provides all of this plus built-in auth, row-level security, and a free tier sufficient for early V3 usage. The tradeoff is vendor dependency, which is acceptable at this stage.
Exit criteria: If Supabase raises prices significantly or discontinues the free tier, migrate to self-hosted PostgreSQL on Railway using pg + pgbouncer. The application code does not need to change — only the connection string.

---

## 19. Deprecation Schedule

Nothing is deprecated in V1. This section tracks features and APIs that will be removed in future versions.

| Item | Deprecated In | Removed In | Replacement | Migration Guide |
|---|---|---|---|---|
| Direct `chrome.storage.local` calls in any file other than `storage.ts` | V1 (never allowed) | N/A — never allowed | `storage.ts` functions | `GEMINI.md` architecture rules |
| `SITE_LISTS` hardcoded in `background.ts` | V1 (never allowed) | N/A | `classifier.ts` | `GEMINI.md` architecture rules |
| `schemaVersion` field absent from storage | V2 (migration adds it) | V3 (storage without it is treated as corrupted) | `schemaVersion: 2` | Auto-migration in `initializeStorage()` |
| Weekly report as a popup-only view | V3 | V4 | Dashboard-based report with email delivery option | Users redirected to dashboard |

---

## 20. Success Metrics

These are the measurable outcomes that define whether StudyLens is achieving its mission. They are tracked manually (no telemetry) via Chrome Web Store analytics (which are anonymous and aggregate) and GitHub metrics.

### 20.1 Metrics by Version

**V1 success:**
- 100+ Chrome Web Store installs within 30 days of publishing
- 4.0+ average rating on Chrome Web Store
- 0 critical bugs reported in first 30 days
- At least 5 GitHub stars

**V2 success:**
- 500+ total installs
- `@studylens/core` published and downloaded by at least one external developer (not the extension itself)
- At least 1 community PR merged (site classification contribution)
- Dashboard active usage: at least 20% of weekly active users open the dashboard at least once

**V3 success:**
- 1000+ total installs
- Cloud sync feature adopted by at least 20% of users who create an account
- Firefox version installed by at least 10% of total install base
- Zero data breach incidents

**V4 success:**
- At least 1 institutional pilot completed with a real educational institution (even informal — a bootcamp cohort qualifies)
- Weakness detection feature used by at least 30% of active users
- Topic tagging covers at least 80% of coding sessions (measured by what percentage of coding sessions have a non-null topic tag)

**V5 success:**
- Pro tier has at least 50 paying subscribers
- At least 1 institutional paying customer
- Public API has at least 3 community-built integrations
- Mobile app has at least 200 downloads

### 20.2 What is Explicitly Not Measured

- Daily active users — vanity metric that encourages manipulative re-engagement mechanics
- Session length — longer sessions are not inherently better
- Number of reflection prompts answered — optimising for this would lead to lowering the 30-minute threshold, which would be wrong
- Social shares — sharing is offered as a feature, never incentivised

The only metric that matters for the mission is: **are students who use StudyLens for 30+ days measurably more aware of their AI dependency, and has that awareness changed their behaviour?** This cannot be measured automatically — it requires user surveys, which will be conducted at the V3 and V4 milestones.