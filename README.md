# StudyLens

> Know how much you actually study. Know how much you rely on AI.

StudyLens is a free, open-source Chrome extension that tracks where you spend time while studying, classifies it into four honest categories, and calculates an AI dependency score — privately, with no account and no data leaving your browser.

---

## The Problem

Students today open ChatGPT, get an answer, copy it, and move on — and genuinely believe they studied. They have no data to prove otherwise, so the habit continues invisibly. StudyLens shows you the truth about your own behaviour.

---

## What It Does

Every time you switch tabs, StudyLens silently records how long you were there and classifies it:

| Category | Examples |
|---|---|
| AI tools | ChatGPT, Claude, Gemini, Copilot, Perplexity |
| Coding practice | LeetCode, GitHub, Stack Overflow, CodePen |
| Study | Coursera, Udemy, Khan Academy, YouTube |
| Distraction | Instagram, Netflix, Reddit, Twitter |

Click the extension icon at any time to see:
- Time spent in each category today
- Your **AI dependency score** — what percentage of your productive time was AI-assisted
- Your **study streak** — consecutive days of real practice
- A **self-reflection prompt** if you spent 30+ minutes on an AI tool

The self-reflection prompt asks: *"Did AI solve the problem for you, or were you using it as a reference?"* Your yes/no answer makes the score more honest over time.

---

## Privacy

**No data ever leaves your browser.**

- No account required to use any feature
- No analytics, telemetry, or error reporting
- No network requests of any kind
- All data stored locally in `chrome.storage.local`
- Only reads the domain of your active tab — never page content, titles, or search queries

---

## Install

### Chrome Web Store *(coming soon)*
Search for "StudyLens" in the Chrome Web Store. Works on Chrome, Edge, Brave, and Arc.

### Development install
See [docs/INSTALL.md](docs/INSTALL.md) for step-by-step instructions to run from source.

---

## Roadmap

| Version | Status | What it adds |
|---|---|---|
| **V1 — MVP** | In development | Time tracking, AI classifier, dependency score, popup UI, streak counter |
| **V2 — Planner** | Planned | Full dashboard, study planner, detox mode, weekly reports, `@studylens/core` npm package |
| **V3 — Cloud** | Future | Optional cross-device sync, user profiles, backend API, topic tagging |

---

## Contributing

The most valuable contribution right now is adding more site classifications.
See [CONTRIBUTING.md](CONTRIBUTING.md) for how to do it in under 5 minutes.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.