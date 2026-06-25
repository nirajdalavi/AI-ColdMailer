# Publishing to Chrome Web Store

This guide is for **you (the publisher)** — not your users. End users install from the Chrome Web Store with one click. They never clone the repo, edit `manifest.json`, or run `npm build`.

## How hosting works (no server needed)

| What | Where it lives | Cost |
|------|----------------|------|
| Extension code | Chrome Web Store CDN | **Free** (after $5 one-time dev fee) |
| Resume, history, API key | User's browser (`chrome.storage.local`) | Free |
| Email generation | OpenRouter (user's free API key) | Free |
| Gmail send | Google's Gmail API (user's account) | Free |

You do **not** need AWS, Vercel, or any backend. The extension runs entirely in the user's browser.

## One-time publisher setup

### 1. Register as a Chrome Web Store developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the **one-time $5 registration fee**
3. This account publishes and updates the extension forever

### 2. Get a stable extension ID

Google OAuth requires a fixed extension ID. Generate a key pair:

```bash
# macOS/Linux — creates key.pem
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem
openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
```

Copy the base64 output into `manifest.json`:

```json
"key": "YOUR_BASE64_PUBLIC_KEY_HERE"
```

Rebuild and load unpacked once — your extension ID on `chrome://extensions` will stay the same forever (dev + store).

### 3. Configure Gmail OAuth (publisher only)

1. [Google Cloud Console](https://console.cloud.google.com/) → new project
2. Enable **Gmail API**
3. **OAuth consent screen** → External → add scope `gmail.send`
4. **Credentials** → Create OAuth client ID → **Chrome Extension**
5. **Item ID** = your extension ID from `chrome://extensions`
6. Copy the Client ID into `.env`:

```bash
cp .env.example .env
# Edit .env:
VITE_GMAIL_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

Users click **Connect Gmail** in the extension — they never touch this.

### 4. Host a privacy policy (free)

Chrome Web Store requires a public privacy policy URL. Free options:

- **GitHub Pages** — enable Pages on this repo, use `docs/PRIVACY.md`
- **Notion** public page
- Any static host (Cloudflare Pages, etc.)

Use `docs/PRIVACY.md` in this repo as your policy text.

### 5. Build the store package

```bash
npm install
npm run package
```

This creates `release/ai-coldmailer.zip` — upload this to the Developer Dashboard.

### 6. Submit to Chrome Web Store

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item**
2. Upload `release/ai-coldmailer.zip`
3. Fill in listing:
   - **Name:** AI ColdMailer
   - **Description:** Generate tailored job outreach emails and send via Gmail
   - **Category:** Productivity
   - **Icon:** `public/icons/icon128.png`
   - **Screenshots:** capture the popup UI (1280×800 or 640×400)
   - **Privacy policy URL:** your hosted `PRIVACY.md` link
4. **Privacy practices** — declare:
   - Uses `chrome.storage.local` (resume, settings, history)
   - Calls OpenRouter API (user-provided key)
   - Calls Gmail API (user's account)
5. Submit for review (usually 1–3 business days)

### 7. Share with users

After approval, users install from your store link:

```
https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID
```

**User onboarding (30 seconds):**

1. Install from Chrome Web Store
2. Open extension → **Settings**
3. Paste free [OpenRouter API key](https://openrouter.ai/keys)
4. Click **Connect Gmail**
5. Upload resume → start composing

No repo. No manifest. No terminal.

## Updating the extension

1. Bump `version` in `manifest.json`
2. `npm run package`
3. Upload new zip in Developer Dashboard → **Package** → **Upload new package**

Existing users get auto-updates through Chrome.

## What users still configure (by design)

| Item | Why |
|------|-----|
| OpenRouter API key | Free per-user key; avoids you paying for everyone's AI usage |
| Gmail connect | Sends from *their* Gmail account with *their* resume |

These are in-app settings, not code changes. If you later want zero user API keys, you'd need a paid backend proxy — not recommended for MVP.

## Checklist

- [ ] Chrome Web Store developer account ($5)
- [ ] Stable extension `key` in manifest
- [ ] Gmail OAuth client ID in `.env`
- [ ] Privacy policy hosted publicly
- [ ] `npm run package` → upload zip
- [ ] Store listing + screenshots submitted
- [ ] Share store link with users
