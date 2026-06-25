# AI ColdMailer

Chrome extension for job outreach: upload your resume once, paste a job description, generate a tailored cold email with AI, review it, and **send with one click** — resume attached automatically.

**No backend server.** Your resume, API keys, and history stay in your browser. Nothing goes out until you hit Send.

---

## Prerequisites

Before you start, make sure you have:

| Requirement | Notes |
|-------------|-------|
| **Git** | To clone this repo |
| **Node.js 18+** | For `npm install`, `npm run dev`, and building |
| **Google Chrome** | Extension runs in Chrome |
| **Groq account** (free) | [console.groq.com](https://console.groq.com) — powers AI generation |
| **Gmail account** | Your email inbox — one-time connect in Settings so you can send with one click |
| **Google Cloud account** (free) | Required to enable Gmail API + OAuth for sending |
| **Resume PDF** | Text-based PDF, under 5 MB |

---

## Setup (start to finish)

Follow these steps in order after cloning. Total time: ~15–20 minutes the first time.

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/AI-ColdMailer.git
cd AI-ColdMailer
npm install
```

### Step 2 — Start dev server and load in Chrome

Run the dev server (rebuilds `dist/` automatically when you change code):

```bash
npm run dev
```

Keep this terminal running. In a new terminal or after the first build finishes, load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder inside this project
5. Copy the **ID** shown under the extension name (e.g. `pbdeeppdmoabmoplgmohpggcnhglpfpf`)

Gmail will **not** work yet — that's expected. You need Google Cloud + `.env` first.

> **Stable extension ID (recommended):** Without a fixed key in `manifest.json`, the ID can change if you remove and re-add the extension. For a permanent ID, see [PUBLISHING.md](PUBLISHING.md). Your OAuth client must always match the same extension ID.

### Step 3 — Set up Google Cloud (Gmail API + OAuth)

Gmail sending requires you to create your own Google Cloud project. This is a one-time setup.

#### 3a. Create a project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Project dropdown → **New project** → name it (e.g. `AI ColdMailer`) → **Create**
3. Select that project in the top bar

#### 3b. Enable the Gmail API

1. **APIs & Services** → **Library**
2. Search **Gmail API** → open it → **Enable**

#### 3c. Configure OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
3. Fill required fields (app name, support email, developer contact)
4. **Scopes** → **Add or remove scopes** → add:
   - `https://www.googleapis.com/auth/gmail.send` (*Send email on your behalf*)
5. Save through the summary

While the app is in **Testing** mode (default), only listed test users can connect:

6. **Audience** → **Test users** → **Add users** → add the Gmail address(es) you will send from

| Publishing status | Who can use Connect Gmail |
|-------------------|---------------------------|
| **Testing** (default) | Only emails in **Test users** (up to 100) |
| **Production** | Any Google user (may require Google verification) |

For personal use, stay in **Testing** and add your own Gmail.

#### 3d. Create OAuth credentials

1. **APIs & Services** → **Credentials**
2. **Create credentials** → **OAuth client ID**
3. Application type: **Chrome Extension** (not Web application)
4. **Item ID:** paste the extension ID from Step 2
5. **Create** → copy the **Client ID** (`….apps.googleusercontent.com`)

### Step 4 — Create `.env` (not included in git)

The repo does **not** ship a `.env` file — it is gitignored so secrets stay local. You create it yourself:

```bash
cp .env.example .env
```

Open `.env` and paste your Client ID from Step 3d:

```env
VITE_GMAIL_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

Only `VITE_GMAIL_CLIENT_ID` is required. The Groq API key goes in the extension UI (Step 6), not in `.env`.

If `npm run dev` is still running from Step 2, it will rebuild automatically when you save `.env`. Otherwise run:

```bash
npm run dev
```

Then go to `chrome://extensions` → click the **refresh** icon on AI ColdMailer (needed after OAuth client ID changes).

If `.env` is missing or empty, Settings will show *"Gmail is not available in this build."*

### Step 5 — Connect Gmail in the extension

1. Click the AI ColdMailer icon in Chrome → **Settings** tab
2. Click **Connect Gmail**
3. Sign in with a Google account that is a **Test user** (from Step 3c)
4. Approve the permission — the extension only requests **send** access, not inbox read

| Scope | Meaning |
|-------|---------|
| `gmail.send` | Send email on your behalf when you click **Send via Gmail** |

You should see **Connected**. To switch accounts: **Disconnect** → **Connect Gmail** again.

### Step 6 — Configure Settings

Still in **Settings**:

1. Enter **Your name** — appears in the email sign-off (`Best regards, [your name]`)
2. Get a free Groq key at [console.groq.com/keys](https://console.groq.com/keys) and paste it (starts with `gsk_`)
3. Click **Save Settings**

Uses **Llama 3.3 70B** — ~1,000 free requests/day on Groq's free tier.

### Step 7 — Upload your resume

1. Open the **Resume** tab
2. Click **Upload Resume (PDF)**
3. Choose a text-based PDF (under 5 MB)

Stored locally in Chrome — one resume at a time. Use **Replace Resume** when you update it.

### Step 8 — You're ready

Setup is complete. Pin the extension from Chrome's puzzle menu for quick access.

Leave `npm run dev` running in a terminal while you work — code changes rebuild `dist/` automatically; click refresh on the extension card in `chrome://extensions` to pick them up.

**Setup checklist**

- [ ] `npm install`
- [ ] `npm run dev` running
- [ ] Extension loaded from `dist/` in Chrome
- [ ] Gmail API enabled in Google Cloud
- [ ] OAuth consent screen + `gmail.send` scope
- [ ] Your Gmail added as a **Test user**
- [ ] Chrome Extension OAuth client with correct extension **Item ID**
- [ ] `.env` created from `.env.example` with `VITE_GMAIL_CLIENT_ID`
- [ ] Dev server rebuilt after `.env` + extension refreshed in Chrome
- [ ] Your name + Groq API key saved in Settings
- [ ] Gmail **Connected** in Settings
- [ ] Resume uploaded

---

## Daily use — send a cold email

### 1. Compose

Open **Compose**:

- **HR Email** — e.g. `recruiter@company.com`
- **Job Description** — paste text, or click **Use Current Page** on an open job posting

### 2. Generate

Click **Generate Email**. The AI drafts subject + body from your resume and the job description.

You can close the popup while it generates — reopen when you see ✓ on the extension icon.

### 3. Review

Edit **Subject**, **To**, and **Body** in the preview. Nothing sends until you confirm.

### 4. Send

Click **Send via Gmail** — one click, resume attached, done. The email goes out from your inbox and appears in Sent.

Past sends are logged in **History**.

---

## Tabs

| Tab | Purpose |
|-----|---------|
| **Compose** | Job details → generate → preview → send |
| **Resume** | Upload or replace PDF |
| **History** | Past applications |
| **Settings** | Your name, Groq API key, Gmail connection |

---

## Development commands

| Command | When to use |
|---------|-------------|
| `npm run dev` | **Day-to-day development** — watches files, rebuilds `dist/` on save (use this) |
| `npm run build` | One-off production build (e.g. before packaging) |
| `npm run package` | Build + zip for Chrome Web Store → `release/ai-coldmailer.zip` |

**Typical workflow:** run `npm run dev` in a terminal, load `dist/` once in Chrome, then refresh the extension in `chrome://extensions` after changes. You only need `npm run build` if you are not using the dev server.

---

## Privacy

Data stays on your device except:

- **Groq** — resume text + job description when you generate
- **Gmail** — email + attachment when you send

No analytics, no backend, no account with us. See [docs/PRIVACY.md](docs/PRIVACY.md).

---

## Tech stack

React 19 · TypeScript · Chrome Manifest V3 · Groq API · Gmail API · `chrome.storage.local`

