"""
Sabbir Hossain Rafat — Portfolio Backend v3.0
Flask API: contact form, rate limiting, security headers,
webhook notifications, health check, structured logging.
"""

import os
import re
import json
import time
import hashlib
import logging
import smtplib
from datetime import datetime, timezone
from collections import defaultdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any
from urllib.request import urlopen, Request
from urllib.error import URLError

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# ── Optional dependencies with graceful fallback ──
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
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ════════════════════════════════════════
# APP SETUP
# ════════════════════════════════════════

app = Flask(__name__)

CORS_ORIGINS: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
CORS(app, origins=CORS_ORIGINS, methods=["GET", "POST", "OPTIONS"], supports_credentials=False)

RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "5"))
RATE_LIMIT_WINDOW   = int(os.getenv("RATE_LIMIT_WINDOW",   "3600"))

if LIMITER_AVAILABLE:
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds"],
        storage_uri="memory://",
    )

# Manual fallback rate store
_rate_store: dict[str, list[float]] = defaultdict(list)

# ════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("portfolio_contact.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("sabbir.portfolio")

# ════════════════════════════════════════
# CONFIG
# ════════════════════════════════════════

SERVICE   = "sabbir-portfolio-api"
VERSION   = "3.0.0"
OWNER     = "Sabbir Hossain Rafat"
TO_EMAIL  = os.getenv("TO_EMAIL",  "sabbirrafat369@gmail.com")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL", "")
SLACK_WEBHOOK   = os.getenv("SLACK_WEBHOOK_URL", "")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

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


def validate_payload(data: dict[str, Any]) -> tuple[bool, str]:
    name    = data.get("name", "")
    email   = data.get("email", "")
    message = data.get("message", "")
    if not isinstance(name, str) or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters."
    if not isinstance(email, str) or not EMAIL_RE.match(email.strip()):
        return False, "Invalid email address."
    if not isinstance(message, str) or len(message.strip()) < 10:
        return False, "Message must be at least 10 characters."
    if len(message) > 1000:
        return False, "Message exceeds 1000 characters."
    return True, ""


# ════════════════════════════════════════
# NOTIFICATIONS
# ════════════════════════════════════════

def send_email(name: str, email: str, message: str) -> None:
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.debug("SMTP not configured — skipping email.")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"]  = f"[Portfolio] New message from {name}"
        msg["From"]     = SMTP_USER
        msg["To"]       = TO_EMAIL
        msg["Reply-To"] = email
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body = f"New portfolio contact\n{'─'*40}\nName:    {name}\nEmail:   {email}\nTime:    {ts}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
            s.ehlo(); s.starttls(); s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, TO_EMAIL, msg.as_string())
        logger.info("Email notification sent to %s", TO_EMAIL)
    except Exception as exc:
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
                    {"name": "Name",    "value": name,            "inline": True},
                    {"name": "Email",   "value": email,           "inline": True},
                    {"name": "Message", "value": message[:1000],  "inline": False},
                ],
                "footer": {"text": f"{SERVICE} v{VERSION}"},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }]
        }).encode("utf-8")
        req = Request(DISCORD_WEBHOOK, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=8):
            pass
        logger.info("Discord notification sent.")
    except (URLError, Exception) as exc:
        logger.error("Discord failed: %s", exc)


def send_slack(name: str, email: str, message: str) -> None:
    if not SLACK_WEBHOOK:
        return
    try:
        text = f"*New Portfolio Contact* 📬\n>*Name:* {name}\n>*Email:* {email}\n>*Message:* {message[:800]}"
        payload = json.dumps({"text": text}).encode("utf-8")
        req = Request(SLACK_WEBHOOK, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=8):
            pass
        logger.info("Slack notification sent.")
    except (URLError, Exception) as exc:
        logger.error("Slack failed: %s", exc)


# ════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health() -> Response:
    return jsonify({
        "status":    "ok",
        "service":   SERVICE,
        "version":   VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "owner":     OWNER,
    })


@app.route("/contact", methods=["POST"])
def contact() -> Response:
    client_ip = get_client_ip()

    # Manual rate limit when flask-limiter not installed
    if not LIMITER_AVAILABLE:
        if not check_rate_limit_manual(client_ip):
            logger.warning("Rate limit exceeded — ip_fp=%s", ip_fingerprint(client_ip))
            return jsonify({
                "error": f"Too many requests. You may send {RATE_LIMIT_REQUESTS} messages per hour. Please wait."
            }), 429

    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 415

    data: dict[str, Any] | None = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or empty JSON payload."}), 400

    clean = {
        "name":    sanitize(data.get("name",    ""), 120),
        "email":   sanitize(data.get("email",   ""), 254),
        "message": sanitize(data.get("message", ""), 1000),
    }

    valid, err = validate_payload(clean)
    if not valid:
        return jsonify({"error": err}), 422

    logger.info(
        "Contact | ip_fp=%s | name=%s | email=%s | msg_len=%d",
        ip_fingerprint(client_ip),
        clean["name"],
        clean["email"],
        len(clean["message"]),
    )

    send_email(clean["name"],   clean["email"], clean["message"])
    send_discord(clean["name"], clean["email"], clean["message"])
    send_slack(clean["name"],   clean["email"], clean["message"])

    return jsonify({
        "success": True,
        "message": "Your message has been received. Sabbir will get back to you soon!",
    }), 200


# Apply flask-limiter to contact route when available
if LIMITER_AVAILABLE:
    contact = limiter.limit(f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds")(contact)


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
        "error": f"Too many requests. You may send {RATE_LIMIT_REQUESTS} messages per hour. Please wait."
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
    logger.info("Starting %s v%s on port %d (debug=%s)", SERVICE, VERSION, port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)