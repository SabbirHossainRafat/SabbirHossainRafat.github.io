"""
Sabbir Hossain Rafat — Portfolio Contact Form Backend
Flask API with rate limiting, security headers, input sanitization,
optional Discord/Slack webhook notifications, and SMTP email support.
"""

import os
import re
import json
import time
import logging
import hashlib
import smtplib
from datetime import datetime, timezone
from collections import defaultdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from typing import Any, Optional
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import URLError

from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS

# ── Optional: flask-limiter ──
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False

# ── Optional: bleach for HTML sanitisation ──
try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:
    BLEACH_AVAILABLE = False

# ════════════════════════════════════════
# APP SETUP
# ════════════════════════════════════════

app = Flask(__name__)

# Load .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# CORS
allowed_origins: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
allowed_origins = [o.strip() for o in allowed_origins if o.strip()]
CORS(app, origins=allowed_origins, methods=["GET", "POST", "OPTIONS"])

# ── Rate limiter (flask-limiter if available, else manual) ──
if LIMITER_AVAILABLE:
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["200 per day", "60 per hour"],
        storage_uri="memory://",
    )
else:
    limiter = None  # type: ignore[assignment]

# ── Manual in-memory rate limit fallback ──
_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "5"))
RATE_LIMIT_WINDOW   = int(os.getenv("RATE_LIMIT_WINDOW",   "3600"))

# ════════════════════════════════════════
# LOGGING
# ════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("contact_messages.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger("sabbir.portfolio")

# ════════════════════════════════════════
# CONSTANTS & CONFIG
# ════════════════════════════════════════

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

SERVICE_NAME    = "sabbir-portfolio-api"
SERVICE_VERSION = "2.0.0"
OWNER_NAME      = "Sabbir Hossain Rafat"
OWNER_EMAIL     = os.getenv("TO_EMAIL", "sabbirrafat369@gmail.com")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL", "")
SLACK_WEBHOOK   = os.getenv("SLACK_WEBHOOK_URL", "")

# ════════════════════════════════════════
# SECURITY HEADERS
# ════════════════════════════════════════

SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": (
        "default-src 'none'; "
        "frame-ancestors 'none';"
    ),
}


@app.after_request
def apply_security_headers(response: Response) -> Response:
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response


# ════════════════════════════════════════
# HELPERS
# ════════════════════════════════════════

def sanitize(text: str, max_length: int = 2000) -> str:
    """Strip HTML/XSS, collapse whitespace, and truncate."""
    if BLEACH_AVAILABLE:
        cleaned: str = bleach.clean(str(text), tags=[], strip=True)
    else:
        # Minimal fallback: remove < > characters
        cleaned = re.sub(r"[<>]", "", str(text))
    # Collapse excessive whitespace
    cleaned = re.sub(r"\s{3,}", "  ", cleaned)
    return cleaned[:max_length].strip()


def get_client_ip() -> str:
    """Return the real client IP, respecting common proxy headers."""
    for header in ("X-Forwarded-For", "X-Real-IP", "CF-Connecting-IP"):
        ip = request.headers.get(header)
        if ip:
            return ip.split(",")[0].strip()
    return request.remote_addr or "unknown"


def ip_fingerprint(ip: str) -> str:
    """Hash the IP for privacy-safe logging."""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def check_rate_limit(ip: str) -> bool:
    """Return True if the request is allowed, False if rate-limited."""
    if LIMITER_AVAILABLE:
        return True  # flask-limiter handles it
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    hits = _rate_store[ip]
    # Purge old entries
    hits[:] = [t for t in hits if t > window_start]
    if len(hits) >= RATE_LIMIT_REQUESTS:
        return False
    hits.append(now)
    return True


def validate_contact_payload(data: dict[str, Any]) -> tuple[bool, str]:
    """Validate and return (is_valid, error_message)."""
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
# NOTIFICATION HELPERS
# ════════════════════════════════════════

def send_email_notification(name: str, email: str, message: str) -> None:
    """Send email notification via SMTP if configured."""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASS]):
        logger.debug("SMTP not configured — skipping email notification.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Portfolio] New message from {name}"
        msg["From"]    = SMTP_USER
        msg["To"]      = OWNER_EMAIL
        msg["Reply-To"]= email

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body = (
            f"New contact form submission\n"
            f"{'─' * 40}\n"
            f"Name   : {name}\n"
            f"Email  : {email}\n"
            f"Time   : {timestamp}\n\n"
            f"Message:\n{message}\n"
        )
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, OWNER_EMAIL, msg.as_string())

        logger.info("Email notification sent to %s", OWNER_EMAIL)
    except Exception as exc:
        logger.error("Email notification failed: %s", exc)


def send_discord_notification(name: str, email: str, message: str) -> None:
    """Post a Discord webhook notification if configured."""
    if not DISCORD_WEBHOOK:
        return
    try:
        timestamp = datetime.now(timezone.utc).isoformat()
        payload = json.dumps({
            "embeds": [{
                "title": "📬 New Portfolio Contact",
                "color": 6736234,  # #667eea
                "fields": [
                    {"name": "Name",    "value": name,    "inline": True},
                    {"name": "Email",   "value": email,   "inline": True},
                    {"name": "Message", "value": message[:1000], "inline": False},
                ],
                "footer": {"text": f"{SERVICE_NAME} v{SERVICE_VERSION}"},
                "timestamp": timestamp,
            }]
        }).encode("utf-8")

        req = Request(
            DISCORD_WEBHOOK,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=8):
            pass
        logger.info("Discord notification sent.")
    except (URLError, Exception) as exc:
        logger.error("Discord notification failed: %s", exc)


def send_slack_notification(name: str, email: str, message: str) -> None:
    """Post a Slack webhook notification if configured."""
    if not SLACK_WEBHOOK:
        return
    try:
        text = (
            f"*New Portfolio Contact* 📬\n"
            f">*Name:* {name}\n"
            f">*Email:* {email}\n"
            f">*Message:* {message[:800]}"
        )
        payload = json.dumps({"text": text}).encode("utf-8")
        req = Request(
            SLACK_WEBHOOK,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=8):
            pass
        logger.info("Slack notification sent.")
    except (URLError, Exception) as exc:
        logger.error("Slack notification failed: %s", exc)


# ════════════════════════════════════════
# ROUTES
# ════════════════════════════════════════

@app.route("/health", methods=["GET"])
def health() -> Response:
    """Health check endpoint."""
    return jsonify({
        "status":    "ok",
        "service":   SERVICE_NAME,
        "version":   SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.route("/contact", methods=["POST"])
def contact() -> Response:
    """
    Handle contact form submissions.

    Expects JSON: { "name": str, "email": str, "message": str }
    Rate-limited to RATE_LIMIT_REQUESTS per RATE_LIMIT_WINDOW seconds per IP.
    """
    client_ip = get_client_ip()

    # Manual rate limit (used when flask-limiter is not installed)
    if not LIMITER_AVAILABLE and not check_rate_limit(client_ip):
        logger.warning("Rate limit exceeded for IP fingerprint: %s", ip_fingerprint(client_ip))
        return jsonify({
            "error": (
                f"Too many requests. You may send up to {RATE_LIMIT_REQUESTS} "
                f"messages per hour. Please wait before trying again."
            )
        }), 429

    # Flask-limiter decorator equivalent when available
    if LIMITER_AVAILABLE and limiter is not None:
        # Decorated at function level below; this path is fine
        pass

    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json."}), 415

    data: Optional[dict[str, Any]] = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or empty JSON payload."}), 400

    # Sanitise
    clean = {
        "name":    sanitize(data.get("name",    ""), 120),
        "email":   sanitize(data.get("email",   ""), 254),
        "message": sanitize(data.get("message", ""), 1000),
    }

    # Validate
    valid, err = validate_contact_payload(clean)
    if not valid:
        return jsonify({"error": err}), 422

    # Structured log (IP fingerprinted for privacy)
    logger.info(
        "Contact submission | ip_fp=%s | name=%s | email=%s | msg_len=%d",
        ip_fingerprint(client_ip),
        clean["name"],
        clean["email"],
        len(clean["message"]),
    )

    # Notifications (non-blocking best-effort)
    send_email_notification(clean["name"], clean["email"], clean["message"])
    send_discord_notification(clean["name"], clean["email"], clean["message"])
    send_slack_notification(clean["name"], clean["email"], clean["message"])

    return jsonify({
        "success": True,
        "message": "Your message has been received. Sabbir will get back to you soon!",
    }), 200


# Apply flask-limiter to contact route if available
if LIMITER_AVAILABLE and limiter is not None:
    contact = limiter.limit(
        f"{RATE_LIMIT_REQUESTS} per {RATE_LIMIT_WINDOW} seconds"
    )(contact)


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
        "error": (
            f"Too many requests. You may send up to {RATE_LIMIT_REQUESTS} "
            f"messages per hour. Please wait before trying again."
        )
    }), 429


@app.errorhandler(500)
def internal_error(e: Exception) -> Response:
    logger.exception("Unhandled server error: %s", e)
    return jsonify({"error": "Internal server error. Please try again later."}), 500


# ════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════

if __name__ == "__main__":
    port  = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "production") == "development"

    logger.info(
        "Starting %s v%s on port %d (debug=%s)",
        SERVICE_NAME, SERVICE_VERSION, port, debug,
    )
    app.run(host="0.0.0.0", port=port, debug=debug)