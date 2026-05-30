"""
Sabbir Hossain Rafat — Portfolio Backend v3.1
Flask API: contact, Gemini AI chat with circuit breaker, real command
execution, whoami/hostname/system-info, version endpoints, stats,
analytics, GitHub proxy, rate limiting, RotatingFileHandler, CSRF token,
honeypot protection, security headers.

Multi-worker rate limiting note:
When running gunicorn with multiple workers (--workers N), each worker
has independent in-memory rate limit counters. To share rate limits
across workers in production, use Redis:

    from flask_limiter.util import get_remote_address
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        storage_uri="redis://localhost:6379",   # <-- Redis URI
    )

Add redis==5.0.8 to requirements.txt and ensure a Redis instance is running.
"""

import os
import re
import json
import time
import hashlib
import hmac
import logging
import logging.handlers
import smtplib
import subprocess
import threading
from datetime import datetime, timezone
from collections import defaultdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any
from urllib.request import urlopen, Request as URLRequest
from urllib.error import URLError

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False

try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:
    BLEACH_AVAILABLE = False

try:
    import requests as http_requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ════════════════════════════════════════
# APP SETUP
# ════════════════════════════════════════

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(32).hex())

CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
]
CORS(app, origins=CORS_ORIGINS, methods=["GET", "POST", "OPTIONS"], supports_credentials=False)

RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "5"))
RATE_LIMIT_WINDOW   = int(os.getenv("RATE_LIMIT_WINDOW",   "3600"))

if LIMITER_AVAILABLE:
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds"],
        storage_uri="memory://",  # Change to redis:// for multi-worker production
    )

_rate_store: dict[str, list[float]] = defaultdict(list)

# ════════════════════════════════════════
# LOGGING — RotatingFileHandler (max 10 MB, 5 backups)
# ════════════════════════════════════════

logger = logging.getLogger("sabbir.portfolio")
logger.setLevel(logging.INFO)

_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
))
logger.addHandler(_stream_handler)

_file_handler = logging.handlers.RotatingFileHandler(
    "portfolio.log",
    maxBytes=10 * 1024 * 1024,  # 10 MB
    backupCount=5,
    encoding="utf-8",
)
_file_handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
))
logger.addHandler(_file_handler)

# ════════════════════════════════════════
# CONFIG
# ════════════════════════════════════════

SERVICE  = "sabbir-portfolio-api"
VERSION  = "3.1.0"
OWNER    = "Sabbir Hossain Rafat"
TO_EMAIL = os.getenv("TO_EMAIL", "sabbirrafat369@gmail.com")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL", "")
SLACK_WEBHOOK   = os.getenv("SLACK_WEBHOOK_URL", "")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GITHUB_TOKEN   = os.getenv("GITHUB_TOKEN", "")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

# Per-session conversation history (in-memory)
_chat_history: dict[str, list[dict]] = defaultdict(list)

# Per-session CWD for terminal execution
_session_cwd: dict[str, str] = defaultdict(lambda: "/tmp")

# Webhook error rate limiting (max 3 per minute) to prevent log flooding
_webhook_errors: dict[str, list[float]] = defaultdict(list)
_WEBHOOK_ERROR_LIMIT = 3
_WEBHOOK_ERROR_WINDOW = 60

# ════════════════════════════════════════
# GEMINI CIRCUIT BREAKER
# ════════════════════════════════════════

_gemini_failures    = 0
_gemini_disabled_until = 0.0
_GEMINI_CB_THRESHOLD = 3
_GEMINI_CB_COOLDOWN  = 60.0  # seconds
_gemini_lock = threading.Lock()

def gemini_circuit_open() -> bool:
    with _gemini_lock:
        global _gemini_failures, _gemini_disabled_until
        if _gemini_failures >= _GEMINI_CB_THRESHOLD:
            if time.monotonic() < _gemini_disabled_until:
                return True
            # Cooldown elapsed — reset
            _gemini_failures = 0
            _gemini_disabled_until = 0.0
    return False

def record_gemini_failure() -> None:
    with _gemini_lock:
        global _gemini_failures, _gemini_disabled_until
        _gemini_failures += 1
        if _gemini_failures >= _GEMINI_CB_THRESHOLD:
            _gemini_disabled_until = time.monotonic() + _GEMINI_CB_COOLDOWN
            logger.warning(
                "Gemini circuit breaker OPEN — disabling for %.0fs (failures=%d)",
                _GEMINI_CB_COOLDOWN, _gemini_failures
            )

def record_gemini_success() -> None:
    with _gemini_lock:
        global _gemini_failures, _gemini_disabled_until
        _gemini_failures = 0
        _gemini_disabled_until = 0.0

# ════════════════════════════════════════
# SECURITY HEADERS
# ════════════════════════════════════════

SECURITY_HEADERS = {
    "X-Frame-Options":           "DENY",
    "X-Content-Type-Options":    "nosniff",
    "X-XSS-Protection":          "1; mode=block",
    "Referrer-Policy":           "strict-origin-when-cross-origin",
    "Permissions-Policy":        "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy":   "default-src 'none'; frame-ancestors 'none';",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
}

@app.after_request
def apply_security_headers(response: Response) -> Response:
    for k, v in SECURITY_HEADERS.items():
        response.headers[k] = v
    return response

# ════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════

def get_client_ip() -> str:
    for header in ("CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"):
        val = request.headers.get(header)
        if val:
            return val.split(",")[0].strip()
    return request.remote_addr or "unknown"

def ip_fingerprint(ip: str) -> str:
    return hashlib.sha256(ip.encode()).hexdigest()[:16]

def check_rate_limit_manual(ip: str) -> bool:
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW
    hits = _rate_store[ip]
    hits[:] = [t for t in hits if t > window_start]
    if len(hits) >= RATE_LIMIT_REQUESTS:
        return False
    hits.append(now)
    return True

def sanitize(text: str, max_len: int = 2000) -> str:
    if BLEACH_AVAILABLE:
        cleaned: str = bleach.clean(str(text), tags=[], strip=True)
    else:
        cleaned = re.sub(r"[<>&\"']", "", str(text))
    cleaned = re.sub(r"\s{3,}", "  ", cleaned)
    return cleaned[:max_len].strip()

def validate_contact_payload(data: dict[str, Any]) -> tuple[bool, str]:
    name    = data.get("name", "")
    email   = data.get("email", "")
    message = data.get("message", "")
    if not isinstance(name, str) or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters."
    if not isinstance(email, str) or not EMAIL_RE.match(email.strip()):
        return False, "Invalid email address. Use format: name@domain.com"
    if not isinstance(message, str) or len(message.strip()) < 10:
        return False, "Message must be at least 10 characters."
    if len(message) > 1000:
        return False, "Message exceeds 1000 characters."
    return True, ""

def generate_form_token() -> str:
    ts  = str(int(time.time()))
    secret = (app.secret_key if isinstance(app.secret_key, str) else app.secret_key.hex()).encode()
    sig = hmac.new(secret, ts.encode(), "sha256").hexdigest()[:16]
    return f"{ts}.{sig}"

def validate_form_token(token: str) -> bool:
    if not token or "." not in token:
        return False
    try:
        ts_str, sig = token.split(".", 1)
        ts = int(ts_str)
        if time.time() - ts > 3600:
            return False
        secret = (app.secret_key if isinstance(app.secret_key, str) else app.secret_key.hex()).encode()
        expected = hmac.new(secret, ts_str.encode(), "sha256").hexdigest()[:16]
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False

def webhook_error_allowed(key: str) -> bool:
    """Rate-limit webhook error logging to prevent log flooding."""
    now = time.monotonic()
    window_start = now - _WEBHOOK_ERROR_WINDOW
    hits = _webhook_errors[key]
    hits[:] = [t for t in hits if t > window_start]
    if len(hits) >= _WEBHOOK_ERROR_LIMIT:
        return False
    hits.append(now)
    return True

# ════════════════════════════════════════
# GEMINI AI
# ════════════════════════════════════════

GEMINI_SYSTEM_PROMPT = """You are an AI assistant for Sabbir Hossain Rafat's portfolio website.
ONLY answer questions about Sabbir Hossain Rafat. For anything else reply exactly:
"I'm Sabbir's AI assistant and I only have information about Sabbir Hossain Rafat. Please ask about his skills, projects, education, certifications, or how to contact him."

PROFILE:
Name: Sabbir Hossain Rafat
Role: AI Product Engineer & Full-Stack Architect
Location: Dhaka, Bangladesh (UTC+6)
Status: Open to core engineering roles — full-time, contract, freelance

EDUCATION:
BSc Software Engineering at Daffodil International University, started 2024.

CERTIFICATIONS:
CEH — Certified Ethical Hacker from Arena Web Security.

SKILLS:
TypeScript 95%, JavaScript 92%, Python 80%, Node.js 88%, C 65%
Astro v6 90%, Tailwind v4 93%, React 86%, Next.js 78%, HTML5/CSS3 96%
Supabase 83%, PostgreSQL 76%, OpenRouter 85%, Gemini API 88%
Stripe 82%, bKash/NAGAD 78%, SSLCOMMERZ 75%
Docker 71%, Linux 86%, Git/GitHub 91%
Security: CEH (Arena Web Security), API Security, OWASP, Penetration Testing

PROJECTS (6):
1. Studia — Academic management: schedule tracking, GPA, assignments. Tech: JavaScript, HTML5
2. AuthPage — 3D auth component with TOTP, secure sessions. Tech: React, TypeScript, Security
3. Security Scanner — Automated OWASP Top-10 vulnerability tool. Tech: Python
4. Vanish Pen — Auto-fading canvas drawing, pressure simulation. Tech: JavaScript, Canvas
5. Artmoji — Text-to-dot-art parser with customizable density. Tech: JavaScript
6. Mystical Dragon — 3D WebGL interactive dragon with physics and particles. Tech: JavaScript, TypeScript, Three.js

CONTACT:
Email: sabbirrafat369@gmail.com
GitHub: github.com/SabbirHossainRafat
LinkedIn: linkedin.com/in/sabbirhossainrafat
Twitter/X: @sabbir_rafat
Resume: https://docs.google.com/document/d/1s2c_ilaTXWodISMNfIhg0M_QlBbPbESNaf1xoDqWr64/edit?usp=sharing

PHILOSOPHY: "Software is not just code — it's a living system. Great engineering means writing for the machine today and the engineer tomorrow."

RULES:
- Only answer about Sabbir Hossain Rafat
- Be concise — use short paragraphs or bullet points
- Be professional and helpful
- If user writes in Bengali/Bangla, respond in Bengali
- For security certification questions, always mention it is from Arena Web Security
"""

def call_gemini(message: str, history: list[dict]) -> str | None:
    """Call Gemini API with circuit breaker. Returns text or None on failure."""
    if not GEMINI_API_KEY or not GEMINI_API_KEY.strip():
        return None
    if gemini_circuit_open():
        logger.debug("Gemini circuit breaker open — skipping API call")
        return None
    if not REQUESTS_AVAILABLE:
        logger.warning("requests library not installed — falling back to local AI")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    contents = []
    for h in history[-5:]:
        role = "user" if h["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h["content"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "system_instruction": {"parts": [{"text": GEMINI_SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 512, "topP": 0.8},
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ],
    }

    result: dict = {}
    err: Exception | None = None

    def _call() -> None:
        nonlocal result, err
        try:
            resp = http_requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                result = resp.json()
            else:
                err = Exception(f"Gemini HTTP {resp.status_code}")
        except Exception as e:
            err = e

    t = threading.Thread(target=_call, daemon=True)
    t.start()
    t.join(timeout=10)

    if t.is_alive():
        record_gemini_failure()
        logger.warning("Gemini API timed out after 10s")
        return None

    if err:
        record_gemini_failure()
        logger.warning("Gemini API error: %s", err)
        return None

    try:
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        record_gemini_success()
        return text.strip()
    except (KeyError, IndexError, TypeError) as exc:
        record_gemini_failure()
        logger.warning("Gemini response parse error: %s", exc)
        return None

# ════════════════════════════════════════
# LOCAL AI FALLBACK
# ════════════════════════════════════════

def classify_intent(msg: str) -> str:
    m = msg.lower()
    if re.search(r"who are you|your name|about sabbir|introduce|tell me about yourself", m): return "identity"
    if re.search(r"rag|retrieval augmented|vector|embedding|langchain|langgraph|agent|orchestrat", m): return "ai_advanced"
    if re.search(r"\bai\b|llm|language model|gemini|openrouter|machine learning|artificial intel", m): return "ai"
    if re.search(r"security scanner|owasp|vulnerability|pentest|ethical hack|ceh|injection|xss|csrf", m): return "security_deep"
    if re.search(r"studia|authpage|vanish pen|artmoji|mystical dragon|projects|shipped|built|made", m): return "projects"
    if re.search(r"typescript|javascript|python|node\.?js|react|next\.?js|astro|tailwind|supabase|postgres|docker|linux|git", m): return "skills_tech"
    if re.search(r"skill|tech|stack|know|proficiency|expertise|good at|use|framework|tool|language", m): return "skills"
    if re.search(r"stripe|bkash|nagad|sslcommerz|payment|fintech|gateway", m): return "fintech"
    if re.search(r"education|university|degree|daffodil|student|study|course|academic", m): return "education"
    if re.search(r"certification|ceh|ec-council|certified|credential|certificate|arena", m): return "certification"
    if re.search(r"available|open to work|hiring|job|role|position|opportunity|freelance|contract|recruit|remote", m): return "availability"
    if re.search(r"contact|email|linkedin|github|twitter|social|reach|find|message|connect", m): return "contact"
    if re.search(r"resume|cv|download|document", m): return "resume"
    if re.search(r"salary|rate|charge|cost|price|budget", m): return "rate"
    if re.search(r"hello|hi\b|hey\b|good morning|good evening|how are you", m): return "greeting"
    if re.search(r"thank|thanks|appreciate|great|nice|awesome|cool|perfect", m): return "gratitude"
    if re.search(r"philosophy|approach|mindset|values|believe|principle", m): return "philosophy"
    if re.search(r"location|where|country|city|timezone|based|live|dhaka|bangladesh", m): return "location"
    if re.search(r"[\u0980-\u09FF]", msg): return "bengali"
    return "general"

LOCAL_RESPONSES: dict[str, str] = {
    "identity":      "I'm **Sabbir Hossain Rafat** — an AI Product Engineer & Full-Stack Architect based in Dhaka, Bangladesh. I study Software Engineering at Daffodil International University (started 2024) and I'm actively seeking core engineering roles.",
    "ai":            "Sabbir's AI engineering: **Gemini API** and **OpenRouter** for production AI systems — RAG pipelines with Supabase pgvector, LLM orchestration, and full-stack AI products.",
    "ai_advanced":   "Sabbir uses **Supabase pgvector** for vector storage, **Gemini API** for embeddings, and is exploring **LangGraph** for multi-agent orchestration.",
    "skills":        "**Top skills:** TypeScript (95%), HTML5/CSS3 (96%), Tailwind v4 (93%), Gemini API (88%), Node.js (88%), React (86%), Astro v6 (90%), Git/GitHub (91%).",
    "skills_tech":   "Sabbir's technology stack includes TypeScript (95%), JavaScript (92%), Python (80%), React (86%), Astro v6 (90%), Tailwind v4 (93%), Supabase (83%), Gemini API (88%).",
    "security_deep": "Sabbir holds **CEH — Certified Ethical Hacker** from **Arena Web Security**. Covers network scanning, system hacking, SQLi, XSS, CSRF, cryptography, and social engineering.",
    "projects":      "**6 shipped projects:**\n1. Studia — Academic management (JavaScript, HTML5)\n2. AuthPage — 3D React auth with TOTP\n3. Security Scanner — Python OWASP tool\n4. Vanish Pen — Auto-fading canvas\n5. Artmoji — Text-to-dot-art\n6. Mystical Dragon — 3D WebGL Three.js\n\ngithub.com/SabbirHossainRafat",
    "education":     "**BSc Software Engineering** at **Daffodil International University**, Dhaka — started 2024. Covers algorithms, AI/ML, web engineering, and cyber security.",
    "certification": "**CEH — Certified Ethical Hacker** from **Arena Web Security**. Network security, system hacking, web app hacking, cryptography, and social engineering.",
    "availability":  "Yes! Sabbir is **actively available** for full-time engineering roles, contract projects, and remote-first teams globally.\n\nContact: **sabbirrafat369@gmail.com**",
    "contact":       "📧 sabbirrafat369@gmail.com\n🐙 github.com/SabbirHossainRafat\n💼 linkedin.com/in/sabbirhossainrafat\n🐦 @sabbir_rafat",
    "resume":        "Resume: https://docs.google.com/document/d/1s2c_ilaTXWodISMNfIhg0M_QlBbPbESNaf1xoDqWr64/edit?usp=sharing",
    "fintech":       "**Stripe** (82%), **bKash/NAGAD** (78%), **SSLCOMMERZ** (75%) — production payment integrations for global and South Asian markets.",
    "philosophy":    '"Software is not just code — it\'s a living system. Great engineering means writing for the machine today and the engineer tomorrow."',
    "location":      "**Dhaka, Bangladesh** (UTC+6). Available for remote globally. Best contact hours: 09:00–22:00 BDT.",
    "rate":          "Contact **sabbirrafat369@gmail.com** or LinkedIn for compensation discussions.",
    "greeting":      "Hi! 👋 I'm Sabbir's AI. Ask about his skills, projects, certifications, or how to contact him!",
    "gratitude":     "You're welcome! Feel free to ask anything else about Sabbir.",
    "bengali":       "আমি Sabbir Hossain Rafat-এর AI সহকারী। তার দক্ষতা, প্রজেক্ট, শিক্ষা, সার্টিফিকেশন এবং যোগাযোগের তথ্য সম্পর্কে জিজ্ঞেস করুন।",
    "general":       "I'm Sabbir's AI. Ask about his skills, projects, education, CEH certification (Arena Web Security), or how to contact him.",
}

def local_ai_response(msg: str) -> str:
    return LOCAL_RESPONSES.get(classify_intent(msg), LOCAL_RESPONSES["general"])

# ════════════════════════════════════════
# TERMINAL EXECUTION
# ════════════════════════════════════════

ALLOWED_COMMANDS = {"ls", "pwd", "cat", "echo", "mkdir", "rm", "cp", "mv", "cd"}

BLOCKED_PATTERNS = [
    r"rm\s+-rf", r"\bsudo\b", r"\bcurl\b", r"\bwget\b", r"python\s+-c",
    r";", r"&&", r"\|\|", r"\|", r"`", r"\$\(", r">\s*/", r"<\(",
    r"\beval\b", r"\bexec\b", r"\bchmod\b", r"\bchown\b", r"\bpasswd\b",
    r"\bsu\b", r"\/etc", r"\/proc", r"\/sys", r"\/root",
]

def is_command_safe(cmd: str) -> tuple[bool, str]:
    parts = cmd.strip().split()
    if not parts:
        return False, "Empty command."
    base = parts[0].lower()
    if base not in ALLOWED_COMMANDS:
        return False, f"Command '{base}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_COMMANDS))}"
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, cmd, re.IGNORECASE):
            return False, "Command contains disallowed characters or patterns."
    if base in ("mkdir", "rm", "cp", "mv"):
        for arg in parts[1:]:
            if arg.startswith("/") and not arg.startswith("/tmp"):
                return False, "Write operations are restricted to /tmp."
    if base == "cat":
        for arg in parts[1:]:
            if arg.startswith("/") and not arg.startswith("/tmp"):
                return False, "Reading files outside /tmp is not permitted."
    return True, ""

def execute_command(cmd: str, cwd: str) -> tuple[str, str]:
    parts = cmd.strip().split()
    if not parts:
        return "", cwd
    base = parts[0].lower()
    if base == "cd":
        if len(parts) < 2 or parts[1] in ("~", ""):
            return "", "/tmp"
        target = parts[1]
        if target == "..":
            new_cwd = os.path.dirname(cwd) if cwd != "/" else "/"
            return "", new_cwd or "/tmp"
        new_path = os.path.join(cwd, target) if not target.startswith("/") else target
        new_path = os.path.normpath(new_path)
        if os.path.isdir(new_path):
            return "", new_path
        return f"cd: {target}: No such file or directory", cwd
    try:
        result = subprocess.run(
            parts, capture_output=True, text=True, timeout=5, cwd=cwd
        )
        output = result.stdout + result.stderr
        if len(output) > 1_048_576:
            output = output[:1_048_576] + "\n[Output truncated at 1MB]"
        return output.strip(), cwd
    except subprocess.TimeoutExpired:
        return "Command timed out after 5 seconds.", cwd
    except FileNotFoundError:
        return f"{base}: command not found", cwd
    except PermissionError:
        return f"{base}: Permission denied", cwd
    except Exception as exc:
        return f"Error: {exc}", cwd

# ════════════════════════════════════════
# NOTIFICATIONS
# ════════════════════════════════════════

def send_email(name: str, email: str, message: str) -> None:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"]  = f"[Portfolio] New message from {name}"
        msg["From"]     = SMTP_USER
        msg["To"]       = TO_EMAIL
        msg["Reply-To"] = email
        ts   = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body = f"New portfolio contact\n{'─'*40}\nName:    {name}\nEmail:   {email}\nTime:    {ts}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.ehlo(); s.starttls(); s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, TO_EMAIL, msg.as_string())
        logger.info("Email notification sent to %s", TO_EMAIL)
    except Exception as exc:
        if webhook_error_allowed("smtp"):
            logger.error("Email failed: %s", exc)

def send_discord(name: str, email: str, message: str) -> None:
    if not DISCORD_WEBHOOK:
        return
    try:
        payload = json.dumps({
            "embeds": [{
                "title": "📬 New Portfolio Contact",
                "color": 6736234,
                "fields": [
                    {"name": "Name",    "value": name,           "inline": True},
                    {"name": "Email",   "value": email,          "inline": True},
                    {"name": "Message", "value": message[:1000], "inline": False},
                ],
                "footer":    {"text": f"{SERVICE} v{VERSION}"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }]
        }).encode("utf-8")
        req = URLRequest(DISCORD_WEBHOOK, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=8):
            pass
        logger.info("Discord notification sent.")
    except (URLError, Exception) as exc:
        if webhook_error_allowed("discord"):
            logger.error("Discord failed: %s", exc)

def send_slack(name: str, email: str, message: str) -> None:
    if not SLACK_WEBHOOK:
        return
    try:
        text    = f"*New Portfolio Contact* 📬\n>*Name:* {name}\n>*Email:* {email}\n>*Message:* {message[:800]}"
        payload = json.dumps({"text": text}).encode("utf-8")
        req = URLRequest(SLACK_WEBHOOK, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=8):
            pass
        logger.info("Slack notification sent.")
    except (URLError, Exception) as exc:
        if webhook_error_allowed("slack"):
            logger.error("Slack failed: %s", exc)

# ════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health() -> Response:
    return jsonify({
        "status":            "ok",
        "service":           SERVICE,
        "version":           VERSION,
        "timestamp":         datetime.now(timezone.utc).isoformat(),
        "owner":             OWNER,
        "gemini_configured": bool(GEMINI_API_KEY),
        "gemini_circuit":    "open" if gemini_circuit_open() else "closed",
    })


@app.route("/form-token", methods=["GET"])
def form_token() -> Response:
    return jsonify({"token": generate_form_token()})


@app.route("/contact", methods=["POST"])
def contact() -> Response:
    client_ip = get_client_ip()

    if not LIMITER_AVAILABLE:
        if not check_rate_limit_manual(client_ip):
            logger.warning("Rate limit exceeded — ip_fp=%s", ip_fingerprint(client_ip))
            return jsonify({
                "error": f"Too many requests. You may send {RATE_LIMIT_REQUESTS} messages per {RATE_LIMIT_WINDOW}s window. Please wait."
            }), 429

    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 415

    data: dict[str, Any] | None = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or empty JSON payload."}), 400

    # Honeypot — bots fill these, humans don't
    if data.get("website") or data.get("phone_number") or data.get("hp_field"):
        logger.info("Honeypot triggered — ip_fp=%s", ip_fingerprint(client_ip))
        # Return success silently so bots think submission worked
        return jsonify({"success": True, "message": "Your message has been received."}), 200

    # CSRF-like token validation
    token = str(data.get("_token", ""))
    if not validate_form_token(token):
        logger.warning("Invalid form token — ip_fp=%s", ip_fingerprint(client_ip))
        return jsonify({"error": "Invalid or expired form token. Please refresh the page."}), 403

    clean = {
        "name":    sanitize(data.get("name",    ""), 120),
        "email":   sanitize(data.get("email",   ""), 254),
        "message": sanitize(data.get("message", ""), 1000),
    }
    valid, err = validate_contact_payload(clean)
    if not valid:
        return jsonify({"error": err}), 422

    logger.info(
        "Contact | ip_fp=%s | name=%s | email=%s | msg_len=%d",
        ip_fingerprint(client_ip), clean["name"], clean["email"], len(clean["message"])
    )
    send_email(clean["name"],   clean["email"], clean["message"])
    send_discord(clean["name"], clean["email"], clean["message"])
    send_slack(clean["name"],   clean["email"], clean["message"])

    return jsonify({"success": True, "message": "Your message has been received. Sabbir will get back to you soon!"}), 200


if LIMITER_AVAILABLE:
    contact = limiter.limit(f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds")(contact)


@app.route("/chat", methods=["POST"])
def chat() -> Response:
    """Gemini AI chat with circuit breaker and local fallback."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 415

    data: dict[str, Any] | None = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid payload."}), 400

    # CSRF header check for cross-origin protection
    origin = request.headers.get("Origin", "")
    referer = request.headers.get("Referer", "")
    if origin and not any(allowed in origin for allowed in (CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["localhost"])):
        if not referer:
            return jsonify({"error": "CSRF check failed."}), 403

    message    = sanitize(str(data.get("message", "")), 1000)
    session_id = data.get("session_id", get_client_ip())

    if not message:
        return jsonify({"error": "Message is required."}), 422

    history = _chat_history[session_id]
    gemini_response = call_gemini(message, history)

    if gemini_response:
        response_text = gemini_response
        source        = "gemini"
    else:
        response_text = local_ai_response(message)
        source        = "fallback"

    history.append({"role": "user",      "content": message})
    history.append({"role": "assistant", "content": response_text})
    if len(history) > 10:
        history[:] = history[-10:]

    logger.info("Chat | source=%s | session=%s", source, str(session_id)[:8])
    return jsonify({"response": response_text, "source": source}), 200


@app.route("/exec", methods=["POST"])
def exec_command() -> Response:
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 415
    data: dict[str, Any] | None = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid payload."}), 400

    cmd        = sanitize(str(data.get("command", "")), 500)
    session_id = data.get("session_id", get_client_ip())

    if not cmd:
        return jsonify({"output": "", "cwd": _session_cwd[session_id]}), 200

    safe, reason = is_command_safe(cmd)
    if not safe:
        return jsonify({"output": f"Permission denied: {reason}", "cwd": _session_cwd[session_id], "error": True}), 200

    cwd = _session_cwd[session_id]
    if not os.path.isdir(cwd):
        cwd = "/tmp"
        _session_cwd[session_id] = cwd

    output, new_cwd = execute_command(cmd, cwd)
    _session_cwd[session_id] = new_cwd
    return jsonify({"output": output, "cwd": new_cwd}), 200


@app.route("/whoami", methods=["GET"])
def whoami() -> Response:
    try:
        result = subprocess.run(["whoami"], capture_output=True, text=True, timeout=5)
        username = result.stdout.strip() or "sabbir"
    except Exception:
        username = "sabbir"
    return jsonify({"username": username})


@app.route("/hostname", methods=["GET"])
def hostname() -> Response:
    try:
        result = subprocess.run(["hostname"], capture_output=True, text=True, timeout=5)
        name = result.stdout.strip() or "ubuntu"
    except Exception:
        name = "ubuntu"
    return jsonify({"hostname": name})


@app.route("/system-info", methods=["GET"])
def system_info() -> Response:
    try:
        result = subprocess.run(["uname", "-a"], capture_output=True, text=True, timeout=5)
        uname = result.stdout.strip() or "Linux ubuntu 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"
    except Exception:
        uname = "Linux ubuntu 6.8.0-40-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"
    return jsonify({"uname": uname})


@app.route("/version/node", methods=["GET"])
def version_node() -> Response:
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
        version = result.stdout.strip() or "node: not installed"
    except FileNotFoundError:
        version = "node: not installed"
    except Exception:
        version = "node: version unavailable"
    return jsonify({"version": version})


@app.route("/version/python", methods=["GET"])
def version_python() -> Response:
    try:
        result = subprocess.run(["python3", "--version"], capture_output=True, text=True, timeout=5)
        version = (result.stdout or result.stderr).strip() or "Python: version unavailable"
    except Exception:
        version = "Python: version unavailable"
    return jsonify({"version": version})


@app.route("/version/git", methods=["GET"])
def version_git() -> Response:
    try:
        result = subprocess.run(["git", "--version"], capture_output=True, text=True, timeout=5)
        version = result.stdout.strip() or "git: not installed"
    except FileNotFoundError:
        version = "git: not installed"
    except Exception:
        version = "git: version unavailable"
    return jsonify({"version": version})


@app.route("/stats", methods=["GET"])
def stats() -> Response:
    if not PSUTIL_AVAILABLE:
        # Warning message instead of silent zeros
        return jsonify({
            "cpu_percent":      0,
            "memory_used_mb":   0,
            "memory_total_mb":  0,
            "memory_percent":   0,
            "error": "psutil is not installed. Run: pip install psutil",
        }), 200
    try:
        cpu = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        return jsonify({
            "cpu_percent":     round(cpu, 1),
            "memory_used_mb":  round(mem.used  / 1_048_576, 1),
            "memory_total_mb": round(mem.total / 1_048_576, 1),
            "memory_percent":  round(mem.percent, 1),
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/analytics", methods=["POST"])
def analytics() -> Response:
    data = request.get_json(silent=True) or {}
    logger.info("Analytics | event=%s | data=%s", data.get("event","unknown"), json.dumps(data)[:200])
    return jsonify({"ok": True}), 200


@app.route("/api/github", methods=["GET"])
def github_proxy() -> Response:
    path = request.args.get("path", "")
    if not path or not re.match(r"^[a-zA-Z0-9/_\-\.?=&]+$", path):
        return jsonify({"error": "Invalid path."}), 400

    url = f"https://api.github.com/{path.lstrip('/')}"
    headers: dict[str, str] = {
        "Accept":     "application/vnd.github.v3+json",
        "User-Agent": SERVICE,
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    try:
        if REQUESTS_AVAILABLE:
            resp = http_requests.get(url, headers=headers, timeout=8)
            return jsonify(resp.json()), resp.status_code
        else:
            req = URLRequest(url, headers=headers)
            with urlopen(req, timeout=8) as r:
                body = json.loads(r.read().decode())
                return jsonify(body), r.status
    except Exception as exc:
        logger.error("GitHub proxy error: %s", exc)
        return jsonify({"error": str(exc)}), 503

# ════════════════════════════════════════
# ERROR HANDLERS
# ════════════════════════════════════════

@app.errorhandler(400)
def bad_request(e: Exception) -> Response:
    return jsonify({"error": "Bad request."}), 400

@app.errorhandler(404)
def not_found(e: Exception) -> Response:
    return jsonify({"error": "Endpoint not found."}), 404

@app.errorhandler(405)
def method_not_allowed(e: Exception) -> Response:
    return jsonify({"error": "Method not allowed."}), 405

@app.errorhandler(429)
def rate_limited(e: Exception) -> Response:
    return jsonify({
        "error": f"Too many requests. You may send {RATE_LIMIT_REQUESTS} messages per {RATE_LIMIT_WINDOW}s. Please wait."
    }), 429

@app.errorhandler(500)
def server_error(e: Exception) -> Response:
    logger.exception("Unhandled error: %s", e)
    return jsonify({"error": "Internal server error. Please try again later."}), 500

# ════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════

if __name__ == "__main__":
    port  = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    logger.info(
        "Starting %s v%s on port %d (debug=%s, gemini=%s, psutil=%s)",
        SERVICE, VERSION, port, debug, bool(GEMINI_API_KEY), PSUTIL_AVAILABLE
    )
    app.run(host="0.0.0.0", port=port, debug=debug)