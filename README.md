# 🛡️ Phishing Guard for Gmail

A real, working Chrome Extension (Manifest V3) that analyzes Gmail emails **in real time, entirely inside your browser** — no backend, no accounts, no cloud database. Built with TypeScript, React, Vite, and Tailwind CSS.

---

## 1. Folder Structure

```
gmail-phishing-detector/
├── public/
│   ├── manifest.json          # Chrome Extension Manifest V3
│   └── icons/                 # 16 / 48 / 128 px extension icons
├── src/
│   ├── components/            # Reusable React components (popup UI)
│   │   ├── StatusBadge.tsx
│   │   ├── RiskMeter.tsx
│   │   ├── IndicatorList.tsx
│   │   └── HistoryList.tsx
│   ├── content/                # Injected into mail.google.com
│   │   ├── index.ts            # MutationObserver + orchestration
│   │   └── banner.ts           # In-page warning banner renderer
│   ├── background/
│   │   └── index.ts            # MV3 service worker (storage + notifications)
│   ├── popup/
│   │   ├── App.tsx             # Popup root component
│   │   └── main.tsx            # React DOM entry point
│   ├── services/
│   │   ├── phishingDetector.ts # Core scoring engine (framework-free)
│   │   └── storageService.ts   # chrome.storage.local wrapper
│   ├── utils/
│   │   ├── gmailParser.ts      # DOM scraping for Gmail
│   │   ├── urlAnalyzer.ts      # Per-link URL red-flag checks
│   │   └── constants.ts        # Keyword lists, weights, thresholds
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   └── assets/
│       └── index.css           # Tailwind entry point
├── popup.html                  # Popup HTML entry
├── vite.popup.config.ts        # Builds popup.html (ES modules, hashed assets)
├── vite.content.config.ts      # Builds content.js (single IIFE bundle)
├── vite.background.config.ts   # Builds background.js (ES module service worker)
├── scripts/copy-static.js      # Copies manifest.json + icons into dist/
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

Why three separate Vite configs instead of one? Chrome extensions have three different execution contexts with different bundling requirements:
- **Content scripts** must be a single classic script (no ES module code-splitting) → built as IIFE.
- **The MV3 service worker** supports `"type": "module"`, so it's built as a single ES module.
- **The popup** is a normal web page and can use standard hashed/code-split Vite output.

Running all three (`npm run build`) produces one unified `dist/` folder that is a complete, loadable extension.

---

## 2. Installation Instructions

### Step 1 — Build the extension
```bash
npm install
npm run build
```
This produces a `dist/` folder containing `manifest.json`, `background.js`, `content.js`, `popup.html`, `assets/`, and `icons/`.

### Step 2 — Load it into Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Pin the "Phishing Guard for Gmail" icon to your toolbar (optional)

### Step 3 — Use it
1. Go to `https://mail.google.com` and open (or refresh) your inbox
2. Open any email — a colored warning banner appears at the top of the message within about half a second
3. Click the toolbar icon to see the risk score, indicator count, suspicious link count, and your last 20 scanned emails
4. If an email scores in the "Phishing" range, Chrome will also show a system notification

No sign-in, no server, no external requests — everything happens with `chrome.storage.local` and in-page DOM parsing.

---

## 3. How the Phishing Detection Algorithm Works

The engine (`src/services/phishingDetector.ts`) is a **weighted rule-based scorer** — deliberately simple, explainable, and fully local (no ML model, no network calls, so nothing to leak and nothing to keep updated remotely).

### Step-by-step pipeline
1. **Extraction** (`gmailParser.ts`): reads the sender name/email, subject, plain-text body, and every `https?://` hyperlink from Gmail's currently-open message DOM.
2. **Keyword scanning** (`constants.ts` + `phishingDetector.ts`): the subject + body text is scanned (case-insensitive) against three phrase tables, each contributing points when matched:
   - **General suspicious phrases** — "verify account", "click here", "password expired", "login immediately", "bank verification", etc. (5–14 pts each)
   - **Credential/PII requests** — passwords, OTP, CVV, card numbers, bank/routing numbers, SSNs (18–20 pts each, weighted highest since these are the clearest scam intent signals)
   - **Threatening/urgency language** — "legal action", "account will be terminated", "arrest", "lawsuit" (8–14 pts each)
3. **Sender analysis**:
   - **Brand impersonation check** — if the display name mentions a commonly-spoofed brand (PayPal, Amazon, Apple, banks, etc.) but the sending domain doesn't match that brand's real domain → **+22 pts**
   - **Free-webmail mismatch** — if the sender name implies an official department ("Support Team", "Billing", "Security") but the domain is a free provider like `gmail.com`/`outlook.com` → **+15 pts**
4. **Urgency heuristic** — 3+ exclamation marks or 3+ ALL-CAPS words across subject/body → **+8 pts**
5. **URL analysis** (`urlAnalyzer.ts`) — every link is checked for:
   - HTTP instead of HTTPS
   - Raw IP address as the host (e.g. `http://192.168.1.5/...`)
   - Known URL shortener domains (bit.ly, tinyurl.com, etc.)
   - Unusually long URLs (>75 chars, often used to obscure the real destination)
   - Suspicious path/query words (`login`, `verify`, `secure`, `account`, ...)
   Each suspicious link adds points, capped at +30 total regardless of link count.
6. **Aggregation** — all triggered indicator weights are summed and clamped to **0–100**.
7. **Bucketing**:
   | Score | Status |
   |---|---|
   | 0–30 | ✅ Safe |
   | 31–60 | ⚠️ Suspicious |
   | 61–100 | ❌ Phishing |

Every triggered rule is returned as a human-readable `Indicator` (e.g. `Requests sensitive information: "otp code"`), which is exactly what's shown in the in-page banner and the popup — so the score is always explainable, never a black box.

### Why rule-based instead of an ML model?
This keeps the extension:
- **100% local** — no model weights to download, no inference server, no data ever leaves the browser
- **Instant** — scoring a typical email takes well under a millisecond
- **Transparent** — every point in the score maps to a specific, auditable reason, which matters a lot for a security tool people need to trust
- **Easy to tune** — all weights/keywords live in one file (`constants.ts`)

---

## 4. Features Implemented

- ✅ Automatic detection of Gmail opening a new email (MutationObserver + hashchange listener, debounced)
- ✅ Sender / subject / body / link extraction
- ✅ Keyword, credential-request, threatening-language, and urgency detection
- ✅ Sender domain / brand-impersonation / free-webmail-mismatch checks
- ✅ Per-URL analysis (HTTP, IP address, shortener, length, suspicious words)
- ✅ 0–100 weighted risk score with Safe / Suspicious / Phishing bucketing
- ✅ In-Gmail warning banner injected above the open email
- ✅ Popup with current status, risk score, suspicious link count, indicator count, and last scan time
- ✅ **Bonus:** Dark mode toggle in the popup (persisted via `chrome.storage.local`)
- ✅ **Bonus:** Chrome notification when an email is classified as Phishing
- ✅ **Bonus:** Local history of the last 20 scanned emails, viewable and clearable from the popup

---

## 5. Future Improvements

- **SPF/DKIM/DMARC awareness**: Gmail exposes some authentication signals in the "show original" view; parsing those would strengthen sender-spoofing detection beyond string heuristics.
- **Attachment analysis**: flag risky attachment types (`.exe`, `.scr`, macro-enabled Office docs) when Gmail exposes attachment metadata in the DOM.
- **User-configurable rules**: an options page to let users add/remove keywords or adjust weights for their own risk tolerance.
- **Multi-language keyword sets**: current phrase tables are English-only; phishing emails in other languages would need translated/localized phrase tables.
- **Homoglyph/typosquat detection**: detect look-alike domains using character-similarity distance (e.g. `paypa1.com`, `rnicrosoft.com`) rather than only exact brand-name string matching.
- **Automated tests**: add a Vitest suite around `phishingDetector.ts` and `urlAnalyzer.ts` (both are framework-free and easy to unit test) to guard against regressions as keyword lists grow.
- **Resilience to Gmail markup changes**: Gmail's class names are not a public API and can change; a small "selector health check" that warns in the popup if extraction stops working would improve reliability.

---

## 6. Privacy

This extension requests only `storage`, `notifications`, and host access to `mail.google.com`. It makes **zero network requests** — all parsing, scoring, and storage happen locally in your browser via `chrome.storage.local`. Uninstalling the extension deletes all stored history immediately.
