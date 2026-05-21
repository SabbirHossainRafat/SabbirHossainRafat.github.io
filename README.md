# Sabbir Hossain Rafat — Portfolio v3.0

**AI Product Engineer & Full-Stack Architect**

A premium dark-first single-page portfolio with Ubuntu terminal simulator, intelligent AI chatbot, particle backgrounds, GitHub live feed, tech radar, PWA support, and a Flask contact backend.

---

## Files

```
portfolio/
├── index.html          HTML — all sections, modals, overlays
├── style.css           CSS — dark/light themes, Ubuntu terminal, responsive
├── script.js           JavaScript — all interactions (production)
├── script.ts           TypeScript source (strict mode)
├── package.json        Node dependencies and scripts
├── vite.config.js      Vite build + /api proxy config
├── tsconfig.json       TypeScript strict compiler config
├── manifest.json       PWA manifest
├── sw.js               Service worker — offline caching
├── app.py              Flask backend — contact API
├── requirements.txt    Python dependencies
└── README.md           This file
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000
npm run type-check   # TypeScript validation
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

The dev server proxies `/api/*` → `http://localhost:5000`.

### Backend

```bash
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # create and fill .env

python app.py               # development
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app   # production
```

---

## Environment Variables

Create `.env` in the project root:

```env
# Flask
FLASK_ENV=development
PORT=5000

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,https://sabbirrafat.dev

# Rate limiting
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=3600

# Email notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
TO_EMAIL=sabbirrafat369@gmail.com

# Discord webhook (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK

# Slack webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WEBHOOK
```

---

## Deploying to Render

### Backend — Web Service

| Setting | Value |
|---|---|
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn --bind 0.0.0.0:$PORT --workers 4 app:app` |
| Environment | Add all variables from `.env` |

### Frontend — Static Site

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

---

## Deploying to GitHub Pages (frontend only)

```bash
npm install -D gh-pages
# Add to package.json: "deploy": "npm run build && gh-pages -d dist"
npm run deploy
```

> **Note:** GitHub Pages is static only. Deploy the backend to Render or Fly.io separately, then update the fetch URL in `script.js` from `/api/contact` to your full backend URL.

---

## Backend API Reference

### `GET /health`

```json
{
  "status": "ok",
  "service": "sabbir-portfolio-api",
  "version": "3.0.0",
  "timestamp": "2025-05-20T12:00:00+00:00",
  "owner": "Sabbir Hossain Rafat"
}
```

### `POST /contact`

**Request:**
```json
{ "name": "Jane Smith", "email": "jane@company.com", "message": "Hello Sabbir…" }
```

**Success (200):**
```json
{ "success": true, "message": "Your message has been received." }
```

**Error codes:** 400 (bad JSON), 415 (wrong Content-Type), 422 (validation failed), 429 (rate limited), 500 (server error)

**Rate limit:** 5 requests per hour per IP (configurable via env)

---

## Features Implemented

### Visual & Motion
- Particle system canvas reacting to cursor position
- Custom dual-layer cursor (dot + ring) with lag effect
- Three ambient gradient orbs with parallax on scroll
- Film grain overlay texture
- Scroll-triggered reveal animations with staggered delays
- 3D tilt effect on profile/about cards
- 3D avatar parallax responding to mouse movement
- Orbit rings and animated nodes around profile photo
- Animated counter stats (projects, technologies, years)
- Reading progress bar at viewport top
- Dark mode auto-scheduler (dark 19:00–07:00, light otherwise)

### Ubuntu Terminal
- Correct Ubuntu prompt: `sabbir@ubuntu:~$`
- Ubuntu Mono / JetBrains Mono font stack
- Ubuntu purple `#300a24` background, `#d3d7cf` text
- Full Ubuntu ANSI colour classes
- Commands: `help`, `about`, `skills`, `projects`, `contact`, `education`, `certifications`, `experience`, `ls`, `cd`, `cat`, `pwd`, `whoami`, `uname -a`, `date`, `echo`, `node`, `python3`, `git`, `sudo`, `clear`, `exit`
- Command history (↑↓), tab completion, virtual filesystem

### AI Chatbot (Sabbir-specific KB)
- Neural network icon — dots and connections SVG
- Intent recognition across 20+ categories
- Real data: all 6 projects, 25+ skills with proficiency %, CEH certification, education, contact, resume link, philosophy
- Proficiency percentages: TypeScript 95%, Tailwind v4 93%, HTML5/CSS3 96%, Gemini API 88%, Node.js 88%, React 86%, Supabase 83%, OpenRouter 85%, Git/GitHub 91%, Linux 86%
- Markdown rendering in bubbles (bold, italic, line breaks)
- Typing indicator with variable delay based on response length
- Quick-reply chips

### GitHub Integration
- Live public event feed (PushEvent, CreateEvent, WatchEvent, ForkEvent, PullRequestEvent)
- Stats: public repos, followers, total stars, account age
- Graceful fallback on API unavailability

### Projects
- 6 real projects: Studia, AuthPage, Security Scanner, Vanish Pen, Artmoji, Mystical Dragon
- Filter by: All, JavaScript, TypeScript, React, Python, Security
- Staggered filter animation
- Social share buttons (copies preview text to clipboard)
- Reading time estimates per project

### Tech Radar
- 4 rings: Adopt, Trial, Assess, Hold
- Real technology placements reflecting actual usage

### Contact
- Real-time inline field validation (blur + re-validation)
- Character counter (0/1000)
- Timezone detection with optimal contact hours hint
- Submit states: idle → loading → success → reset

### Keyboard Shortcuts
- `T` — Toggle theme, `H` — Help panel, `G` — Scroll top
- `/` — Open terminal, `C` — Open AI chat, `ESC` — Close panels

### PWA
- `manifest.json` — installable, multiple icon sizes, theme colours
- `sw.js` — cache-first for shell assets, network-first for API

### Backend Security
- Security headers: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, HSTS, Permissions-Policy
- Rate limiting: 5/hr per IP (flask-limiter or manual fallback)
- Input sanitisation: bleach (HTML stripping) with regex fallback
- Privacy logging: IP hashed with SHA-256 before any log line
- Discord + Slack + SMTP notifications on new submissions
- `/health` endpoint with JSON status

### Accessibility & Standards
- Schema.org JSON-LD structured data
- Open Graph and Twitter Card meta tags
- PWA manifest with theme colours
- ARIA labels on all interactive elements
- Focus-visible outlines
- Print stylesheet (hides chrome, formats content for PDF)
- Reduced-motion media query respected

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
| Certification | CEH — EC-Council |
| Resume | docs.google.com/document/d/1BxiMVss0yztFe7uCR6lZMfWtMO_dnNEM5iH6loCjHZo |
| Location | Dhaka, Bangladesh (UTC+6) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla TypeScript, CSS custom properties |
| Fonts | Space Grotesk · Plus Jakarta Sans · Ubuntu Mono · JetBrains Mono |
| Build | Vite 5 + esbuild |
| Backend | Python 3 · Flask 3 |
| Rate Limiting | flask-limiter (memory) with manual fallback |
| Sanitisation | bleach with regex fallback |
| Notifications | smtplib · Discord Webhooks · Slack Webhooks |
| Deployment | Render · GitHub Pages · Fly.io |

---

© 2025 Sabbir Hossain Rafat