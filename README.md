# AI ColdMailer

Chrome extension for job outreach: save your resume once, paste a job description, generate a tailored cold email, and send it through Gmail with your resume attached.

## For users — install from Chrome Web Store

> **Coming soon:** Install link will appear here after publishing.

1. Install from the Chrome Web Store (one click)
2. Open the extension → **Settings**
3. Get a free API key at [openrouter.ai/keys](https://openrouter.ai/keys) and paste it in
4. Click **Connect Gmail**
5. Upload your resume in the **Resume** tab
6. Start composing in the **Compose** tab

No coding, no cloning, no editing config files.

## For publishers — build & ship

See **[PUBLISHING.md](PUBLISHING.md)** for the full Chrome Web Store guide.

Quick version:

```bash
cp .env.example .env          # add your Gmail OAuth client ID (one-time)
npm install
npm run package               # → release/ai-coldmailer.zip
```

Upload the zip to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time developer fee). Chrome hosts the extension forever — no server costs.

**You** configure OAuth and publish. **Users** just install and use.

## Features

- **Resume** — Upload one PDF; text extracted and stored locally
- **Compose** — Paste HR email + job description (or grab from current page)
- **Generate** — OpenRouter free models draft tailored emails
- **Preview** — Edit before sending
- **Send** — Gmail with resume attached
- **History** — Log of sent applications

## Local development

```bash
npm install
npm run dev        # hot reload — load dist/ as unpacked extension
npm run build      # production build
```

For Gmail in dev, copy `.env.example` → `.env` and add your OAuth client ID.

## Privacy

See [docs/PRIVACY.md](docs/PRIVACY.md). Host this file publicly for the Chrome Web Store listing (GitHub Pages works free).

## Tech stack

- React 19 + TypeScript, Chrome Manifest V3
- `chrome.storage.local` — all user data stays on device
- OpenRouter (`openrouter/free`) — free AI models
- Gmail API — send from user's account

## License

MIT
