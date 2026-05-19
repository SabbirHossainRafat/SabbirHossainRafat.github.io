# Sabbir Hossain Rafat — Portfolio v2.0

**AI Product Engineer & Full-Stack Architect**

A premium, dark-first single-page portfolio with particle system backgrounds, an interactive terminal, AI chat assistant, PWA support, and a Flask contact-form backend.

---

## File Overview

```
portfolio/
├── index.html          # Complete HTML — all sections, modals, overlays
├── style.css           # Full CSS — dark/light themes, animations, responsive
├── script.js           # Production JavaScript — all interactions
├── script.ts           # TypeScript source (strict mode)
├── package.json        # Node dependencies and scripts
├── vite.config.js      # Vite build configuration with /api proxy
├── tsconfig.json       # TypeScript strict compiler config
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── app.py              # Flask backend — contact API
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

---

## Quick Start — Local Development

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10

### Frontend

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:3000
npm run dev

# Type-check TypeScript
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server automatically proxies `/api/*` → `http://localhost:5000`.

### Backend

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your values

# Run development server at http://localhost:5000
python app.py

# Run with gunicorn (production)
gunicorn --bind 0.0.0.0:5000 --workers 4 app:app
```

---

## Environment Variables

Create a `.env` file in the project root:

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
| Repository | Your GitHub repo |
| Root Directory | `.` (project root) |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn --bind 0.0.0.0:$PORT --workers 4 app:app` |
| Environment | Add all variables from `.env` |

### Frontend — Static Site

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment | `VITE_API_URL=https://your-backend.onrender.com` |

Update `vite.config.js` proxy target to use `process.env.VITE_API_URL` for production builds, or set the API base URL in `script.js` when deploying frontend and backend to different origins.

---

## Deploying to GitHub Pages (Frontend Only)

```bash
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

Set GitHub Pages source branch to `gh-pages`.

> **Note:** GitHub Pages serves only static files. For the contact form to work, deploy the backend separately (Render, Railway, Fly.io) and update the fetch URL in `script.js` from `/api/contact` to your full backend URL.

---

## Deploying to Fly.io (Backend)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login

# Launch the app (run from project root)
fly launch --name sabbir-portfolio-api

# Set secrets
fly secrets set SMTP_HOST=smtp.gmail.com SMTP_USER=... SMTP_PASS=...

# Deploy
fly deploy
```

---

## Backend API Reference

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "sabbir-portfolio-api",
  "version": "2.0.0",
  "timestamp": "2025-01-01T00:00:00+00:00"
}
```

### `POST /contact`

Submit a contact form message.

**Request body:**
```json
{
  "name": "Jane Recruiter",
  "email": "jane@company.com",
  "message": "Hi Sabbir, I'd love to discuss a role with you."
}
```

**Success response (200):**
```json
{
  "success": true,
  "message": "Your message has been received. Sabbir will get back to you soon!"
}
```

**Error responses:**

| Status | Reason |
|---|---|
| 400 | Missing or malformed JSON |
| 415 | Content-Type is not application/json |
| 422 | Validation failed (name, email, or message invalid) |
| 429 | Rate limit exceeded (5 per hour per IP) |
| 500 | Internal server error |

---

## Features

### Visual & Motion
- Particle system canvas that reacts to cursor position
- Custom dual-layer cursor (dot + ring) with lag effect
- Three ambient gradient orbs with parallax scroll
- Subtle film grain overlay
- Scroll-triggered reveal animations with staggered delays
- 3D tilt effect on about cards
- 3D avatar parallax that responds to mouse position
- Orbit rings and animated nodes around profile photo
- Animated counter stats

### Navigation & UX
- Sticky navbar with backdrop blur on scroll
- Active section highlighting in nav
- Smooth scroll with custom cubic-bezier easing on all anchors
- Mobile menu slides in from right with overlay backdrop
- Reading progress bar at top of viewport

### Terminal Simulator
- Accessible via nav icon button or `/` keyboard shortcut
- Commands: `help`, `about`, `skills`, `projects`, `contact`, `education`, `certifications`, `socials`, `clear`, `exit`, `whoami`, `date`, `ls`
- Command history navigation with `↑` / `↓`
- Tab completion for all commands
- ASCII art welcome screen

### AI Chat Assistant
- Floating button (bottom-right) or `C` keyboard shortcut
- Rule-based knowledge base covering all portfolio content
- Simulated typing indicator with staggered dots
- Quick-reply suggestion chips
- Intent matching for skills, projects, AI, security, education, contact, availability

### Skills System
- Hover any skill pill for a positioned tooltip showing proficiency bar, percentage, and description

### Project Filtering
- Filter by: All, JavaScript, TypeScript, React, Python, Security
- Filtered-out cards collapse smoothly; matching cards re-enter with stagger

### Contact Form
- Real-time inline validation on blur and re-validation on input
- Character counter on message textarea (0 / 1000)
- Visitor timezone detection with optimal contact hours hint
- Loading → success → reset state on submit button
- Graceful fallback to demo success when backend is unreachable

### PWA
- `manifest.json` for installability
- Service worker (`sw.js`) caches shell assets for offline access

### Keyboard Shortcuts
- `T` — Toggle theme
- `H` — Open help / shortcuts panel
- `G` — Scroll to top
- `/` — Open terminal
- `C` — Open AI chat
- `ESC` — Close any open panel

### Backend Security
- Security headers on every response: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
- IP-based rate limiting (5 requests / hour per IP, configurable)
- Input sanitisation via bleach (strips HTML/XSS)
- Privacy-safe logging (IP hashed with SHA-256 before logging)
- Optional Discord and Slack webhook notifications on new submissions
- Optional SMTP email notifications

---

## Customisation

| What | Where |
|---|---|
| Profile photo | `index.html` — `<img class="hero-photo" src="...">` |
| Resume PDF | `script.js` — `resumeBtn` click handler; set `a.href` to your PDF path |
| Typing phrases | `script.js` — `const phrases = [...]` array |
| AI knowledge base | `script.js` — `const KB = { ... }` object |
| Terminal commands | `script.js` — `const TERM_COMMANDS = { ... }` object |
| Brand colours | `style.css` — `:root { --primary, --cyan, --purple, --grad }` |
| Stat counters | `index.html` — `data-target` attributes on `.counter` elements |
| Social links | `index.html` — all `<a>` elements in channels and mobile menu footer |

---

## Personal Information

| Field | Value |
|---|---|
| Name | Sabbir Hossain Rafat |
| Title | AI Product Engineer & Full-Stack Architect |
| University | Daffodil International University |
| Email | sabbirrafat369@gmail.com |
| GitHub | github.com/SabbirHossainRafat |
| LinkedIn | linkedin.com/in/sabbirhossainrafat |
| Twitter/X | x.com/sabbir_rafat |
| Certification | CEH (Certified Ethical Hacker) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla TypeScript, CSS custom properties |
| Fonts | Space Grotesk · Plus Jakarta Sans · JetBrains Mono |
| Build | Vite 5 + esbuild |
| Backend | Python 3 · Flask 3 |
| Rate Limiting | flask-limiter (memory backend) |
| Sanitisation | bleach |
| Notifications | smtplib · Discord Webhooks · Slack Webhooks |
| Deployment | Render · GitHub Pages · Fly.io |

---

© 2025 Sabbir Hossain Rafat