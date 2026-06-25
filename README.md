# AI ColdMailer

Chrome extension for job outreach: save your resume once, paste a job description, generate a tailored cold email with OpenRouter (free models), and send it through Gmail with your resume attached.

## Features (MVP)

- **Resume** — Upload one PDF; text is extracted and stored locally (base64)
- **Compose** — Paste HR email + job description (or grab text from the current page)
- **Generate** — OpenRouter free models draft a tailored subject + body from your resume and the job post
- **Preview** — Edit subject/body before sending
- **Send** — Gmail API with OAuth; resume attached as PDF
- **History** — Local log of sent applications

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

For development with hot reload:

```bash
npm run dev
```

Then load the `dist/` folder (dev mode) or rebuild after changes.

### 3. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

### 4. Configure OpenRouter

1. Create a free account at [openrouter.ai](https://openrouter.ai/)
2. Generate an API key at [openrouter.ai/keys](https://openrouter.ai/keys) (no credit card required)
3. Open the extension popup → **Settings**
4. Paste your OpenRouter API key and click **Save API Key**

Email generation uses the `openrouter/free` router, which picks from OpenRouter's free models automatically. Free tier limits apply (~50 requests/day).

### 5. Configure Gmail OAuth

Gmail sending uses `chrome.identity` with a Google OAuth client.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Gmail API**
3. Configure the **OAuth consent screen** (External is fine for personal use)
4. Create an OAuth 2.0 Client ID:
   - Application type: **Chrome Extension**
   - Item ID: your extension ID from `chrome://extensions` (after loading unpacked)
5. Copy the Client ID into `manifest.json`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"]
}
```

6. Rebuild (`npm run build`) and reload the extension in Chrome
7. In the extension **Settings** tab, click **Connect Gmail**

#### Stable extension ID (optional)

To keep the same extension ID across rebuilds, add a `key` field to `manifest.json`. Generate a key pair or use Chrome’s packing flow. See [Chrome extension identity docs](https://developer.chrome.com/docs/extensions/reference/manifest/key).

## Workflow

1. Copy the recruiter/HR email from a job posting
2. Copy the job description (or open the posting and click **Use Current Page**)
3. Open the extension → **Compose**
4. Paste HR email and job description
5. Click **Generate Email**
6. Review and edit the draft
7. Click **Send via Gmail**

## Project structure

```
src/
├── App.tsx                 # Popup shell + tab navigation
├── components/
│   ├── ComposeTab.tsx      # Main outreach workflow
│   ├── ResumeTab.tsx       # PDF upload + text extraction
│   ├── HistoryTab.tsx      # Sent application log
│   └── SettingsTab.tsx     # API key + Gmail connect
├── lib/
│   ├── storage.ts          # chrome.storage.local helpers
│   ├── pdf.ts              # PDF text extraction (pdf.js)
│   ├── openrouter.ts       # Email generation (OpenRouter free models)
│   └── gmail.ts            # Message passing to background
├── background/
│   └── service-worker.ts   # Gmail OAuth + send + page scrape
└── content/
    └── content-script.ts   # Placeholder (scraping via scripting API)
```

## Storage

All data stays in `chrome.storage.local`:

| Key        | Contents                                      |
|------------|-----------------------------------------------|
| `resume`   | PDF base64, extracted text, filename, date    |
| `settings` | OpenRouter API key, Gmail connection flag         |
| `history`  | Array of sent application records             |

Resume PDFs are stored as base64 (MVP). Chrome local storage is ~10 MB per extension — fine for a single resume.

## Tech stack

- React 19 + TypeScript
- Chrome Manifest V3
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) for extension bundling
- [pdf.js](https://mozilla.github.io/pdf.js/) for resume parsing
- [OpenRouter](https://openrouter.ai/) Chat Completions API (`openrouter/free` — no per-token cost)
- Gmail API (`gmail.send` scope)

## License

MIT
