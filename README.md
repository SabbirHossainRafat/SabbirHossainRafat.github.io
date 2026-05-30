# Sabbir Hossain Rafat — Portfolio v3.1

**AI Product Engineer & Full-Stack Architect**

A premium dark-first single-page portfolio featuring Ubuntu terminal simulator, Gemini AI chatbot with rule-based fallback, particle system, GitHub live feed, tech radar, PWA support, and a Flask backend with security hardening.

---

## File Structure

```
portfolio/
├── index.html          Complete HTML — all sections and modals
├── style.css           CSS — dark/light themes, Ubuntu terminal, responsive
├── script.js           Production JavaScript — all interactions
├── script.ts           TypeScript source (strict mode)
├── package.json        Node dependencies and scripts
├── vite.config.js      Vite build with API_BASE and BUILD_DATE injection
├── tsconfig.json       TypeScript strict compiler config
├── manifest.json       PWA manifest
├── sw.js               Service worker — offline caching
├── offline.html        Offline fallback page
├── app.py              Flask backend — contact, chat, exec, stats, GitHub proxy
├── requirements.txt    Python dependencies
├── .env                Environment variables (not committed — see below)
├── .gitignore          Excludes .env, node_modules, dist, __pycache__
├── favicon.svg         SVG favicon
└── icons/
    ├── icon-192.png    PWA icon 192×192
    └── icon-512.png    PWA icon 512×512
```

---

## Quick Start — Local Development

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000 — proxies /api → localhost:5000
npm run type-check   # TypeScript validation
npm run build        # Production build → dist/
npm run preview      # Preview at http://localhost:4000
```

### Backend

```bash
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

python app.py               # development — http://localhost:5000
```

---

## Environment Variables

Create a `.env` file in the project root. This file must never be committed to version control.

```env
# Flask
FLASK_ENV=development
PORT=5000
FLASK_SECRET_KEY=generate-a-random-64-char-string-here

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,https://sabbirrafat.dev

# Rate limiting
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=3600

# Gemini AI (get your free key at https://aistudio.google.com)
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
GEMINI_MODEL=gemini-1.5-flash

# GitHub API token (optional — increases rate limit from 60 to 5000 req/hr)
GITHUB_TOKEN=your-github-personal-access-token

# Email notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
TO_EMAIL=sabbirrafat369@gmail.com

# Discord webhook (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN

# Slack webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### Getting a Free Gemini API Key

1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** in the left sidebar
4. Click **Create API Key**
5. Select a Google Cloud project (or create a new one)
6. Copy the generated API key
7. Paste it into `.env` as `GEMINI_API_KEY=<your-key>`
8. Set `GEMINI_MODEL=gemini-1.5-flash` (free tier, fast responses)

The API key is only used server-side in `app.py`. It is never sent to the browser or included in any frontend file.

---

## Production Deployment

### Setting VITE_API_URL Before Building

When deploying the frontend to a static host (GitHub Pages, Netlify, Vercel) and the backend to a separate server (Render, Railway, Fly.io), you must tell the frontend where the backend lives:

```bash
# Set the backend URL before building
export VITE_API_URL=https://sabbir-portfolio-api.onrender.com
npm run build
# The dist/ folder now uses your backend URL for all /api calls
```

The `vite.config.js` injects this as `__API_BASE__` at build time and also sets `__BUILD_DATE__` to the current date, which automatically updates the "Last updated" display in the footer on every new build.

### Deploying Backend to Render

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your repository
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 60 app:app`
5. Add all environment variables from your `.env` under the **Environment** tab
6. Deploy

**Important — Rate Limiting and Workers:** The default `--workers 1` is correct for the in-memory rate limiter. With multiple workers, each worker has its own memory and rate limit counters are not shared, allowing users to bypass limits by being routed to different workers. For multi-worker production deployments, switch to Redis:

```python
# In app.py, replace the Limiter initialization with:
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri="redis://localhost:6379",  # or your Redis URL
)
```

Install `redis` and add `redis==5.0.8` to requirements.txt.

### Deploying Frontend to GitHub Pages

```bash
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "VITE_API_URL=https://your-backend.onrender.com npm run build && gh-pages -d dist"

npm run deploy
```

Set the GitHub Pages source to the `gh-pages` branch.

### Deploying Frontend to Netlify

1. Connect your GitHub repo to Netlify
2. Set **Build command:** `npm run build`
3. Set **Publish directory:** `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Deploying to Fly.io (Backend)

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
fly launch --name sabbir-portfolio-api
fly secrets set GEMINI_API_KEY=your-key SMTP_PASS=your-pass
fly deploy
```

---

## Backend API Reference

### `GET /health`

```json
{
  "status": "ok",
  "service": "sabbir-portfolio-api",
  "version": "3.1.0",
  "timestamp": "2025-05-20T12:00:00+00:00",
  "owner": "Sabbir Hossain Rafat",
  "gemini_configured": true
}
```

### `GET /form-token`

Returns a short-lived CSRF-like token for contact form submissions.

```json
{ "token": "1716201600.a3f2b91c" }
```

### `POST /contact`

```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "message": "Hi Sabbir, I'd like to discuss a role.",
  "_token": "1716201600.a3f2b91c",
  "website": "",
  "phone_number": ""
}
```

The `website` and `phone_number` fields are honeypots — real users never see or fill them. Bots that fill them are silently dropped.

**Responses:** 200 success, 400 bad JSON, 403 invalid token, 415 wrong Content-Type, 422 validation failed, 429 rate limited, 500 server error.

### `POST /chat`

```json
{ "message": "What are your top skills?", "session_id": "unique-session-id" }
```

Tries Gemini API first (10s timeout), falls back to local rule-based AI on any failure. The API key is never exposed in responses.

```json
{ "response": "Sabbir's strongest skills are...", "source": "gemini" }
```

`source` is either `"gemini"` or `"fallback"`.

### `POST /exec`

Executes a terminal command server-side with strict security controls.

```json
{ "command": "ls -la", "session_id": "unique-session-id" }
```

Allowed commands: `ls`, `pwd`, `cat`, `echo`, `mkdir`, `rm`, `cp`, `mv`. All other commands return an error. File writes restricted to `/tmp`.

### `GET /stats`

Returns live CPU and memory stats via psutil.

```json
{
  "cpu_percent": 12.5,
  "memory_used_mb": 892.3,
  "memory_total_mb": 8192.0,
  "memory_percent": 10.9
}
```

### `GET /github?path=users/SabbirHossainRafat`

Proxies GitHub API requests server-side. If `GITHUB_TOKEN` is set, includes it in the Authorization header (5000 req/hr limit). Without token, falls back to unauthenticated (60 req/hr).

---

## Gemini Integration Testing Checklist

- [ ] With `GEMINI_API_KEY` set to a valid key: chatbot responses show `✦ Gemini AI` badge
- [ ] With `GEMINI_API_KEY` empty or unset: chatbot uses local fallback, shows `◈ Local AI` badge
- [ ] With an invalid API key: Gemini returns 401/403, fallback activates automatically
- [ ] With network offline or Gemini unreachable: 10s timeout triggers, fallback activates
- [ ] Bengali question (e.g. "আপনার দক্ষতা কি?"): receives Bengali response from both Gemini and fallback
- [ ] Follow-up question referencing earlier answer: Gemini uses last 5 messages as history context
- [ ] Open browser DevTools → Network tab: no request to `generativelanguage.googleapis.com` from browser (API key stays server-side)
- [ ] Kill the backend while chatting: frontend falls back to local AI immediately, never shows empty state
- [ ] Ask about CEH certification: response mentions "Arena Web Security" as the issuer

---

## Security Features

| Feature | Implementation |
|---|---|
| Honeypot spam protection | Hidden `website` and `phone_number` fields; bots silently dropped |
| CSRF-like form token | Timestamp + HMAC signature, validated on backend, 1hr window |
| IP rate limiting | 5 requests/hour per IP (flask-limiter or manual fallback) |
| Input sanitisation | bleach HTML stripping with regex fallback |
| Privacy logging | IP hashed with SHA-256 before writing to any log |
| Security headers | X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP, HSTS, Referrer-Policy, Permissions-Policy |
| Gemini key isolation | API key only in server `.env`, never in frontend code or responses |
| Command execution sandbox | Strict allowlist: ls, pwd, cat, echo, mkdir, rm, cp, mv only; writes to /tmp only; 5s timeout |

---

## PWA Features

- Installable via browser "Add to Home Screen"
- Service worker caches shell assets (HTML, CSS, JS) for offline access
- Cache-first strategy for fonts and static assets
- Network-first for navigation requests with offline.html fallback
- Background sync tag `contact-form-sync` registered
- Push notification support scaffolded
- Multiple icon sizes: 16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512px

---

## Google Docs Resume

Ensure the resume is publicly accessible without requiring login:

1. Open the Google Doc
2. Click **Share** (top right)
3. Change access to **Anyone with the link**
4. Set permission to **Viewer**
5. Click **Done**

The resume link used: `https://docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo/edit?usp=sharing`

---

## Further Optimisation Notes

**Image optimisation:** The hero photo loads from Google Drive. For faster load times, download it, convert to WebP at display dimensions (260×260px), upload to a CDN, and update the `src` in `index.html`.

**Below-fold lazy loading:** Sections below the hero can be lazily rendered using IntersectionObserver with dynamic imports once content is extracted into separate modules. The current single-page HTML is acceptable for a portfolio but this would reduce initial DOM size on low-powered devices.

**Redis rate limiting:** Required for production with multiple gunicorn workers. See the Deploying Backend section above.

**PWA icons and screenshots:** The current icons are programmatically generated placeholders. For app store listings and high-quality PWA presentation, replace with designed icons at all sizes and add screenshots at the paths referenced in `manifest.json`.

---

## Personal Information

| Field | Value |
|---|---|
| Name | Sabbir Hossain Rafat |
| Title | AI Product Engineer & Full-Stack Architect |
| Email | sabbirrafat369@gmail.com |
| GitHub | github.com/SabbirHossainRafat |
| LinkedIn | linkedin.com/in/sabbirhossainrafat |
| Twitter/X | @sabbir_rafat |
| University | Daffodil International University |
| Certification | CEH — Arena Web Security |
| Resume | docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo |
| Location | Dhaka, Bangladesh (UTC+6) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla TypeScript, CSS custom properties |
| Fonts | Space Grotesk · Plus Jakarta Sans · Ubuntu Mono · JetBrains Mono |
| Build | Vite 5 + esbuild, build-time API_BASE and BUILD_DATE injection |
| Backend | Python 3 · Flask 3 |
| AI | Google Gemini API (gemini-1.5-flash) with local rule-based fallback |
| Rate Limiting | flask-limiter (memory) with manual fallback |
| Sanitisation | bleach with regex fallback |
| Stats | psutil for CPU/RAM |
| Notifications | smtplib · Discord Webhooks · Slack Webhooks |
| Deployment | Render · GitHub Pages · Netlify · Fly.io |

---

© 2026 Sabbir Hossain Rafat