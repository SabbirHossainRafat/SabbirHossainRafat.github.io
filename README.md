# Sabbir Hossain Rafat — Portfolio

**AI Product Engineer & Full-Stack Architect**

A modern, dark-mode-first single-page portfolio with glassmorphism, gradient accents, smooth animations, and a Flask contact-form backend.

---

## Project Structure

```
portfolio/
├── index.html          # All HTML structure
├── style.css           # All CSS styles (compiled from style.scss)
├── script.ts           # TypeScript source
├── script.js           # Compiled JS (used directly by index.html)
├── package.json
├── vite.config.js
├── tsconfig.json
├── .env.example
├── .gitignore
└── backend/
    ├── app.py          # Flask contact API
    └── requirements.txt
```

---

## Running Locally

### Frontend

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server proxies `/api/*` → `http://localhost:5000` automatically.

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
cp ../.env.example ../.env

# Start Flask (http://localhost:5000)
python app.py
```

---

## Deploying to Render

### Backend (Web Service)

1. Push to GitHub.
2. In Render → **New Web Service** → connect your repo.
3. Set **Root Directory**: `backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `gunicorn app:app`
6. Add environment variables from `.env.example`.

### Frontend (Static Site)

1. In Render → **New Static Site** → connect your repo.
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your backend Render URL (e.g. `https://sabbir-api.onrender.com`)

Update `vite.config.js` proxy target to use `VITE_API_URL` for production.

---

## Deploying to GitHub Pages (Frontend Only)

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

npm run deploy
```

Set GitHub Pages source to `gh-pages` branch.

> Note: GitHub Pages hosts static files only — the contact form backend will not run there. Either deploy the backend separately (Render/Railway) or use a form service like Formspree.

---

## Customization

| What | Where |
|------|-------|
| Profile photo | `index.html` — `<img src="...">` in hero section |
| Resume PDF | Replace the `alert` in `script.js` with `window.open('your-pdf-url')` |
| Projects | Edit project cards in `index.html` |
| Colors / fonts | CSS variables at top of `style.css` |
| Typing phrases | `phrases` array in `script.js` |
| Contact email | `TO_EMAIL` in `.env` |

---

## Tech Stack

- **Frontend**: Vanilla TypeScript, CSS (no frameworks)
- **Fonts**: Plus Jakarta Sans, Space Grotesk, JetBrains Mono
- **Build**: Vite 5
- **Backend**: Python 3 / Flask, flask-limiter, bleach (XSS sanitization)
- **Email**: smtplib (optional SMTP config)

---

© 2025 Sabbir Hossain Rafat