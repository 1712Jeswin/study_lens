# security.md — Security and Privacy Rules

> Every rule in this document is non-negotiable.
> If the agent or a future contributor proposes anything that conflicts with a rule, the rule wins.
> StudyLens makes one public promise: "No data leaves your browser in V1 and V2."
> This document describes how that promise is kept technically.

---

## 1. The Core Privacy Promise

Every user who installs StudyLens must be able to trust this completely:

> **"No data about your browsing ever leaves your browser — in V1 and V2."**

This means:
- No analytics pings
- No error reporting services
- No "call home" on install
- No external API calls of any kind in V1 and V2
- No server, no account, no registration required

This is both a promise and a technical requirement enforced in code and in the Chrome Web Store privacy declarations.

---

## 2. What the Extension Can and Cannot Access

### ALLOWED — reads ONLY:
- `tab.url` — the URL of the currently active tab (to extract hostname for classification)
- `tab.id` — the numeric tab identifier (to detect tab switches)
- `tab.status` — to know when a page has finished loading (`'complete'`)
- `windowId` — to detect browser focus or blur events

### STRICTLY FORBIDDEN — the extension must NEVER read:
- Page content, DOM structure, or HTML of any website
- Page titles (`tab.title`)
- Favicons (`tab.favIconUrl`)
- Cookies from any website
- Form inputs or submitted data of any kind
- Browsing history
- Bookmarks
- Passwords or autofill data
- Network request content or headers (no `webRequest` usage)
- Screenshots or visual captures of any tab
- Any data injected into web pages via content scripts

---

## 3. What is Stored and What is Not

### Stored in `chrome.storage.local` (V1 and V2):
- Aggregated time in seconds per category per day: `{ ai: 3600, coding: 1800 }`
- The hostname of sites visited (e.g. `"chatgpt.com"`) — for reflection entries only
- Streak count and last active date string
- Self-reflection answers (yes/no only, with domain and duration — no URL path)
- User-set planner goals (in V2): minutes per category per day
- Extension install timestamp

### NEVER stored — under any circumstances:
- Full URL paths (only the hostname is ever stored)
- Page titles
- Search queries typed into any site
- Content of any webpage
- Usernames, emails, or account info from visited sites
- IP addresses
- Any personally identifying information beyond what the user explicitly enters (V3 only)

### Domain extraction rule (enforced in `classifier.ts`):
```typescript
// CORRECT — only the hostname
const domain = new URL(url).hostname.replace(/^www\./, '')
// Result: "chatgpt.com"

// WRONG — never store this
const fullPath = url
// "https://chatgpt.com/c/specific-conversation-id-abc123-that-identifies-the-user"
```

---

## 4. Permissions — What Is Allowed and Why

### V1 permissions (exact — do not expand without justification):
```json
{
  "permissions": ["tabs", "storage", "alarms"],
  "host_permissions": []
}
```

| Permission | Why it is needed | What it does NOT grant |
|---|---|---|
| `tabs` | Read `tab.url` and `tab.id` to classify the active site | Read page content, history, cookies |
| `storage` | Read/write `chrome.storage.local` for all local data | Access other extensions' storage |
| `alarms` | Schedule the 1-minute tick and midnight reset | Access any web resource |

### Permissions that must NEVER be added without a GitHub issue explaining the exact use case:

| Permission | Why it's dangerous |
|---|---|
| `<all_urls>` or any host permission | Grants access to intercept or read any website — not needed |
| `history` | Full access to browsing history — far more than classification needs |
| `cookies` | Full cookie access — never needed |
| `webRequest` / `webRequestBlocking` | Intercepts all network traffic — massive privacy risk |
| `bookmarks` | Unnecessary access |
| `downloads` | Unnecessary access |
| `geolocation` | Location data — never needed |
| `notifications` | Push notifications — popup is sufficient for V1 and V2 |
| `scripting` | Inject code into web pages — opens XSS-class risks |
| `management` | Manage other extensions — not needed |

### V3 permission additions (only with documented justification):
- `identity` — required for optional Google OAuth in cloud sync. Must be documented in a GitHub issue before implementation.

---

## 5. Content Security Policy

`manifest.json` must include this CSP and it must never be weakened:

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none';"
}
```

This means:
- No inline `<script>` tags anywhere in any HTML file — they are silently blocked
- No `eval()` execution anywhere
- No scripts loaded from external URLs (CDNs, etc.)
- No `<object>` or `<embed>` elements

### Consequences of removing or weakening the CSP:
If CSP is removed and the extension is ever compromised (e.g. via a supply chain attack on a dependency), an attacker could inject arbitrary JavaScript into the extension's popup and read `chrome.storage.local`. The CSP is a hard safety boundary.

---

## 6. Third-Party Code Policy

### V1 — Zero runtime dependencies
No npm runtime packages. Dev dependencies only (TypeScript, ESLint, Prettier). If the agent suggests `npm install some-utility-library --save`, reject it and ask for a native TypeScript implementation. The extension binary must contain only code you can read and understand.

### V2 — Dashboard exceptions only (separate web app, not the extension)
The React dashboard (a separate page, not the extension popup or service worker) may use:
- `react`, `react-dom`, `vite` — standard React tooling
- `chart.js` — charting library for the weekly view only
- `@studylens/core` — your own package

Must NOT use:
- Any analytics package (no Segment, Mixpanel, Plausible, Google Analytics)
- Any error monitoring service (no Sentry, LogRocket, Bugsnag) — not even opt-in in V2
- Any package that makes network requests to third-party servers

### V3 — New library rules
Any new library must be:
- Open source (MIT or Apache 2.0)
- Not collecting telemetry itself
- Making network requests only to the StudyLens backend

---

## 7. Open Source Security (GitHub)

Since the repository is public:

- **No secrets in any committed file.** Never commit API keys, JWTs, database credentials, or any secret. Use `.gitignore` and environment variables.
- **No `.env` files committed.** Commit only `.env.example` with placeholder strings.
- **Dependency audit before every release.** Run `npm audit` in the `extension/` directory. Fix all high and critical vulnerabilities before submitting a new Web Store version.
- **Review `package.json` after every `npm install`.** Check that no unexpected packages were added.

---

## 8. Authentication Security (V3 Only)

When V3 introduces optional user accounts:

- Use Supabase Auth — do not implement custom authentication
- Access tokens: stored in `chrome.storage.local` ONLY — never in `localStorage`, never in cookies accessible to web pages
- Token expiry: follow Supabase defaults
- Logout: delete tokens from `chrome.storage.local` AND invalidate server-side
- All API requests: HTTPS only — never HTTP
- All server-side decisions: verified server-side from the JWT — never trust client-provided user IDs

---

## 9. User Data Rights (V3)

When cloud sync is introduced, users must be able to:

| Right | How it is implemented |
|---|---|
| Access all data | `GET /api/v1/records` returns every stored record |
| Delete all data | `DELETE /api/v1/data` removes all records, revokes tokens, sends confirmation |
| Export data | Dashboard Settings → Export → downloads JSON or CSV of all records |
| Correct data | Users can delete individual daily records from the History page |

The delete endpoint must complete within 30 days (GDPR Article 17 requirement) and must not require contacting support — it must be self-service in the dashboard.

---

## 10. Pre-Release Security Checklist

Run this before submitting any update to the Chrome Web Store:

```
□ manifest.json permissions are unchanged or change is documented in a GitHub issue
□ host_permissions is still empty (V1 and V2)
□ CSP is still present and unchanged
□ npm audit in extension/ → no high or critical vulnerabilities
□ No full URL paths stored in chrome.storage.local
  (spot check: DevTools → Extension Storage → confirm values are hostnames only)
□ No external fetch() or HTTP calls in background.ts
  grep -rn "fetch\|XMLHttpRequest\|axios" extension/src/background.ts → no results
□ No fetch() or HTTP calls anywhere in the extension source in V1/V2
  grep -rn "fetch\|XMLHttpRequest" extension/src/ → no results
□ No eval() or new Function() calls
  grep -rn "eval(\|new Function(" extension/src/ → no results
□ No inline scripts in popup.html
  grep -n "<script" extension/src/popup/popup.html → only the module script tag, no inline code
□ Chrome Web Store privacy declarations match actual behaviour:
  "Does not collect or transmit user data" must remain selected for V1 and V2
□ README privacy statement is accurate and up to date
□ CONTRIBUTING.md mentions the privacy rules for contributors
```