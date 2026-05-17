"""
Sabbir Hossain Rafat — Portfolio Contact Form Backend
Flask API with rate limiting, input sanitization, and email support.
"""

import os
import re
import json
import logging
from datetime import datetime
from collections import defaultdict
from functools import wraps

from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import bleach

# ── App Setup ──
app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "*").split(","))

# ── Rate Limiting ──
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("contact_messages.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# ── Helpers ──
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def sanitize(text: str, max_len: int = 2000) -> str:
    """Strip HTML/XSS and truncate."""
    cleaned = bleach.clean(text, tags=[], strip=True)
    return cleaned[:max_len].strip()


def validate_contact(data: dict) -> tuple[bool, str]:
    """Returns (valid, error_message)."""
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not name or len(name) < 2:
        return False, "Name must be at least 2 characters."
    if not email or not EMAIL_RE.match(email):
        return False, "Invalid email address."
    if not message or len(message) < 10:
        return False, "Message must be at least 10 characters."
    if len(message) > 1000:
        return False, "Message exceeds 1000 characters."
    return True, ""


# ── Routes ──
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "sabbir-portfolio-api",
    })


@app.route("/contact", methods=["POST"])
@limiter.limit("5 per hour")
def contact():
    """Handle contact form submissions."""
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Sanitize inputs
    clean_data = {
        "name": sanitize(data.get("name", ""), 120),
        "email": sanitize(data.get("email", ""), 254),
        "message": sanitize(data.get("message", ""), 1000),
    }

    # Validate
    valid, error = validate_contact(clean_data)
    if not valid:
        return jsonify({"error": error}), 422

    # Log the message
    logger.info(
        "New contact message | Name: %s | Email: %s | Message: %.80s...",
        clean_data["name"],
        clean_data["email"],
        clean_data["message"],
    )

    # Optionally send email (requires SMTP env vars)
    _try_send_email(clean_data)

    return jsonify({
        "success": True,
        "message": "Your message has been received. I'll get back to you soon!",
    }), 200


def _try_send_email(data: dict) -> None:
    """Send notification email if SMTP is configured."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    to_email = os.getenv("TO_EMAIL", "sabbirrafat369@gmail.com")

    if not all([smtp_host, smtp_user, smtp_pass]):
        logger.debug("SMTP not configured — skipping email notification.")
        return

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Portfolio] New message from {data['name']}"
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Reply-To"] = data["email"]

        body = f"""
New portfolio contact message:

Name:    {data['name']}
Email:   {data['email']}
Time:    {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

Message:
{data['message']}
        """.strip()

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        logger.info("Email notification sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send email: %s", exc)


# ── Error Handlers ──
@app.errorhandler(429)
def rate_limit_handler(e):
    return jsonify({
        "error": "Too many requests. Please wait before sending another message.",
        "retry_after": str(e.description),
    }), 429


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    logger.info("Starting portfolio API on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)