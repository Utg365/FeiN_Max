# ============================================================
#  FEIN TRADE — Backend Server
#  Auth: SQLite + bcrypt-style hashing + JWT session tokens
#  DB:   fein_trade.db  (auto-created on first run)
# ============================================================

import os
import re
import math
import random
import sqlite3
import feedparser
import hashlib
import hmac
import base64
import json
import time
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, g
from flask_cors import CORS

# ── App setup ───────────────────────────────────────────────
app = Flask(__name__, static_folder=".")
CORS(app, supports_credentials=True)

# Secret key for JWT signing — change this to a long random string in production!
JWT_SECRET  = os.environ.get("FEIN_JWT_SECRET", "fein_trade_super_secret_key_change_me_in_prod_2024")
JWT_EXPIRY_HOURS = 72          # token valid for 3 days
DB_PATH     = os.path.join(os.path.dirname(__file__), "fein_trade.db")

# ── Database helpers ─────────────────────────────────────────
def get_db():
    """Return a thread-local SQLite connection."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row          # rows behave like dicts
        g.db.execute("PRAGMA journal_mode=WAL")  # better concurrency
    return g.db

@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Create tables if they don't exist yet."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                dob         TEXT    NOT NULL,
                password_hash TEXT  NOT NULL,
                avatar      TEXT    DEFAULT '',
                created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                last_login  TEXT
            );

            CREATE TABLE IF NOT EXISTS trading_state (
                user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                state_json  TEXT    NOT NULL DEFAULT '{}',
                updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        """)
        conn.commit()
    print(f"[DB] Initialized → {DB_PATH}")

# ── Password hashing (PBKDF2-HMAC-SHA256, no external deps) ──
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk   = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000)
    return base64.b64encode(salt + dk).decode()

def verify_password(stored_hash: str, candidate: str) -> bool:
    try:
        raw  = base64.b64decode(stored_hash.encode())
        salt = raw[:16]
        dk   = raw[16:]
        candidate_dk = hashlib.pbkdf2_hmac("sha256", candidate.encode(), salt, 260_000)
        return hmac.compare_digest(dk, candidate_dk)
    except Exception:
        return False

# ── Minimal JWT (no external library required) ────────────────
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def create_token(user_id: int, username: str) -> str:
    header  = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({
        "sub": user_id,
        "usr": username,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_HOURS * 3600
    }).encode())
    sig = _b64url(hmac.new(
        JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
    ).digest())
    return f"{header}.{payload}.{sig}"

def decode_token(token: str) -> dict | None:
    try:
        header, payload, sig = token.split(".")
        expected_sig = _b64url(hmac.new(
            JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256
        ).digest())
        if not hmac.compare_digest(sig, expected_sig):
            return None
        data = json.loads(_b64url_decode(payload))
        if data["exp"] < time.time():
            return None
        return data
    except Exception:
        return None

# ── Auth middleware decorator ─────────────────────────────────
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            return jsonify({"error": "Missing token"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        g.current_user_id = payload["sub"]
        g.current_username = payload["usr"]
        return f(*args, **kwargs)
    return decorated

# ── Validation helpers ────────────────────────────────────────
GMAIL_RE    = re.compile(r"^[a-zA-Z0-9._%+\-]+@gmail\.com$", re.IGNORECASE)
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,24}$")

def is_valid_gmail(email: str) -> bool:
    return bool(GMAIL_RE.match(email.strip()))

def is_valid_username(username: str) -> bool:
    return bool(USERNAME_RE.match(username.strip()))

def is_old_enough(dob_str: str, min_age: int = 16) -> bool:
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d")
        cutoff = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        cutoff = cutoff.replace(year=cutoff.year - min_age)
        return dob <= cutoff
    except ValueError:
        return False

# ════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ════════════════════════════════════════════════════════════

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data     = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    dob      = (data.get("dob")      or "").strip()
    password = (data.get("password") or "")

    # ── Validate ──────────────────────────────────────────────
    if not is_valid_username(username):
        return jsonify({"error": "Username must be 3–24 characters (letters, numbers, underscores)."}), 400

    if not is_valid_gmail(email):
        return jsonify({"error": "Only @gmail.com addresses are accepted."}), 400

    if not dob or not is_old_enough(dob):
        return jsonify({"error": "You must be at least 16 years old to register."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    db = get_db()

    # ── Check duplicates ──────────────────────────────────────
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return jsonify({"error": "An account with this Gmail already exists."}), 409

    if db.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone():
        return jsonify({"error": "This username is already taken."}), 409

    # ── Insert user ───────────────────────────────────────────
    pw_hash = hash_password(password)
    cur = db.execute(
        "INSERT INTO users (username, email, dob, password_hash) VALUES (?, ?, ?, ?)",
        (username, email, dob, pw_hash)
    )
    user_id = cur.lastrowid

    # Create an empty trading state row for this user
    db.execute(
        "INSERT INTO trading_state (user_id, state_json) VALUES (?, ?)",
        (user_id, json.dumps({}))
    )
    db.commit()

    token = create_token(user_id, username)
    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id":       user_id,
            "username": username,
            "email":    email,
            "dob":      dob,
            "created_at": datetime.utcnow().isoformat()
        }
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data     = request.get_json(force=True) or {}
    email    = (data.get("email")    or "").strip().lower()
    password = (data.get("password") or "")

    if not is_valid_gmail(email):
        return jsonify({"error": "Only @gmail.com addresses are accepted."}), 400

    db   = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()

    if not user or not verify_password(user["password_hash"], password):
        return jsonify({"error": "Incorrect email or password."}), 401

    # Update last_login timestamp
    db.execute(
        "UPDATE users SET last_login = datetime('now') WHERE id = ?", (user["id"],)
    )
    db.commit()

    token = create_token(user["id"], user["username"])
    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "id":         user["id"],
            "username":   user["username"],
            "email":      user["email"],
            "dob":        user["dob"],
            "avatar":     user["avatar"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_me():
    """Return the currently logged-in user's profile."""
    db   = get_db()
    user = db.execute(
        "SELECT id, username, email, dob, avatar, created_at, last_login FROM users WHERE id = ?",
        (g.current_user_id,)
    ).fetchone()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(dict(user)), 200


@app.route("/api/auth/update_profile", methods=["PUT"])
@require_auth
def update_profile():
    """Allow the user to change their username or avatar."""
    data     = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    avatar   = (data.get("avatar")   or "").strip()

    db = get_db()
    updates, params = [], []

    if username:
        if not is_valid_username(username):
            return jsonify({"error": "Invalid username format."}), 400
        clash = db.execute(
            "SELECT 1 FROM users WHERE username = ? AND id != ?",
            (username, g.current_user_id)
        ).fetchone()
        if clash:
            return jsonify({"error": "Username already taken."}), 409
        updates.append("username = ?")
        params.append(username)

    if avatar:
        updates.append("avatar = ?")
        params.append(avatar)

    if not updates:
        return jsonify({"error": "Nothing to update."}), 400

    params.append(g.current_user_id)
    db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
    db.commit()
    return jsonify({"message": "Profile updated."}), 200


# ════════════════════════════════════════════════════════════
#  TRADING STATE ROUTES  (portfolio, cash, journal, etc.)
# ════════════════════════════════════════════════════════════

@app.route("/api/state", methods=["GET"])
@require_auth
def get_state():
    """Load a user's trading state from the database."""
    db  = get_db()
    row = db.execute(
        "SELECT state_json FROM trading_state WHERE user_id = ?",
        (g.current_user_id,)
    ).fetchone()
    if not row:
        return jsonify({}), 200
    try:
        return jsonify(json.loads(row["state_json"])), 200
    except Exception:
        return jsonify({}), 200


@app.route("/api/state", methods=["POST"])
@require_auth
def save_state():
    """Persist the user's full trading state to the database."""
    payload = request.get_json(force=True) or {}
    db = get_db()

    # Upsert: insert or replace
    db.execute("""
        INSERT INTO trading_state (user_id, state_json, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
            state_json = excluded.state_json,
            updated_at = excluded.updated_at
    """, (g.current_user_id, json.dumps(payload)))
    db.commit()
    return jsonify({"message": "State saved."}), 200


# ════════════════════════════════════════════════════════════
#  EXISTING MARKET DATA ROUTES (unchanged)
# ════════════════════════════════════════════════════════════

# ── News cache (refreshed every 5 minutes) ───────────────────
_news_cache      = []
_news_cache_time = 0

NEPAL_SOURCES = [
    {"id": "mero-lagani",      "name": "Mero Lagani",      "url": "https://merolagani.com/rss.aspx",     "cat": "NEPAL"},
    {"id": "share-sansar",     "name": "Share Sansar",     "url": "https://www.sharesansar.com/rss",      "cat": "NEPAL"},
    {"id": "artha-kendra",     "name": "Artha Kendra",     "url": "https://arthakendra.com/feed",         "cat": "NEPAL"},
    {"id": "artha-sansar",     "name": "Artha Sansar",     "url": "https://arthasansar.com/feed",         "cat": "NEPAL"},
    {"id": "nepse-bajar",      "name": "Nepse Bajar",      "url": "https://nepsebajar.com/feed",          "cat": "NEPAL"},
    {"id": "bizmandu",         "name": "Bizmandu",         "url": "https://bizmandu.com/feed",            "cat": "NEPAL"},
    {"id": "corporate-khabar", "name": "Corporate Khabar", "url": "https://corporatekhabar.com/feed",     "cat": "NEPAL"},
    {"id": "nepali-paisa",     "name": "Nepali Paisa",     "url": "https://nepalipaisa.com/feed",         "cat": "NEPAL"},
]

INTL_FALLBACK = [
    {"title": "NYSE and NASDAQ see heavy institutional volume ahead of consumer spending data",
     "source": "Wall Street Journal", "sentiment": "BULLISH", "score": "82%", "category": "INTL",
     "summary": "Major investment houses are loading long equities ahead of consumer spending reports.",
     "url": "https://www.wsj.com/markets"},
    {"title": "Federal Reserve Chairman hints at possible rate cuts in Q3",
     "source": "Bloomberg Markets",   "sentiment": "BULLISH", "score": "76%", "category": "INTL",
     "summary": "Inflation is cooling faster than forecast, sparking talk of rate reductions.",
     "url": "https://www.bloomberg.com/markets"},
    {"title": "Crypto liquidation cascade briefly drops Bitcoin to $65,500",
     "source": "CoinDesk",           "sentiment": "BEARISH", "score": "68%", "category": "INTL",
     "summary": "Leveraged margin accounts experienced heavy liquidations before buyers stepped in.",
     "url": "https://www.coindesk.com/markets"},
    {"title": "Euro slides to 3-month lows following ECB inflation downgrades",
     "source": "Reuters Business",   "sentiment": "BEARISH", "score": "75%", "category": "INTL",
     "summary": "ECB officials cited weakening consumer spending as reason for potential easing.",
     "url": "https://www.reuters.com/markets"},
]

def _clean(text: str) -> str:
    from bs4 import BeautifulSoup
    return BeautifulSoup(text or "", "html.parser").get_text().strip()

def _time_ago(pub_str: str) -> str:
    """Convert RSS published string to human-friendly relative time."""
    from email.utils import parsedate_to_datetime
    try:
        dt  = parsedate_to_datetime(pub_str)
        diff = datetime.now(dt.tzinfo) - dt
        s    = int(diff.total_seconds())
        if s < 60:    return "just now"
        if s < 3600:  return f"{s//60} min ago"
        if s < 86400: return f"{s//3600} hr ago"
        return f"{s//86400} days ago"
    except Exception:
        return pub_str[:16] if pub_str else ""

def _sentiment(title: str, summary: str) -> tuple[str, str]:
    """Simple keyword-based sentiment tagger."""
    text  = (title + " " + summary).lower()
    bull  = ["gain", "rise", "rally", "bullish", "surge", "high", "growth", "profit", "positive", "recover", "up", "increase"]
    bear  = ["fall", "drop", "decline", "bearish", "crash", "loss", "low", "risk", "negative", "down", "decrease", "liquidat"]
    bs    = sum(1 for w in bull if w in text)
    be    = sum(1 for w in bear if w in text)
    if bs > be:   return "BULLISH", f"{min(95, 55 + bs*8)}%"
    if be > bs:   return "BEARISH", f"{min(95, 55 + be*8)}%"
    return "NEUTRAL", "N/A"

def _fetch_nepal_news() -> list:
    try:
        import feedparser
    except ImportError:
        return []

    articles = []
    for src in NEPAL_SOURCES:
        try:
            feed = feedparser.parse(src["url"])
            for entry in feed.entries[:5]:
                title   = _clean(entry.get("title", ""))
                summary = _clean(entry.get("summary", ""))[:200]
                url     = entry.get("link", None)
                pub     = entry.get("published", "")
                if not title: continue
                sent, score = _sentiment(title, summary)
                articles.append({
                    "title":     title,
                    "summary":   summary + ("..." if len(summary) == 200 else ""),
                    "source":    src["name"],
                    "url":       url,
                    "time":      _time_ago(pub),
                    "sentiment": sent,
                    "score":     score,
                    "category":  "NEPAL"
                })
        except Exception:
            pass
    return articles


@app.route("/api/news", methods=["GET"])
def get_market_news():
    global _news_cache, _news_cache_time
    now = time.time()

    # Refresh cache every 5 minutes
    if now - _news_cache_time > 300 or not _news_cache:
        nepal   = _fetch_nepal_news()
        intl    = [{**a, "time": f"{random.randint(5,55)} min ago"} for a in INTL_FALLBACK]
        _news_cache      = nepal + intl
        _news_cache_time = now

    return jsonify(_news_cache)


@app.route("/api/refresh", methods=["POST"])
def manual_refresh():
    global _news_cache, _news_cache_time
    _news_cache_time = 0  # Force re-fetch on next /api/news call
    return jsonify({"status": "cache cleared"})


@app.route("/api/predictions/<symbol>", methods=["GET"])
def get_prediction_trajectory(symbol):
    symbol = symbol.upper()
    random.seed(hash(symbol))

    base_price = random.uniform(50.0, 500.0)
    if "USD" in symbol:
        base_price = random.uniform(100.0, 65000.0) if ("BTC" in symbol or "ETH" in symbol) else random.uniform(0.5, 2.0)

    current_time = datetime.now()
    historical, forecast = [], []

    for i in range(10, 0, -1):
        dt    = current_time - timedelta(days=i)
        trend = math.sin(i * 0.4) * (base_price * 0.05)
        noise = random.uniform(-base_price * 0.01, base_price * 0.01)
        historical.append({"date": dt.strftime("%Y-%m-%d"), "price": round(base_price + trend + noise, 4)})

    last_price    = historical[-1]["price"]
    ml_confidence = random.randint(70, 95)
    direction     = "BULLISH" if random.random() > 0.4 else "BEARISH"
    coef          = 0.025 if direction == "BULLISH" else -0.02

    for i in range(1, 6):
        dt  = current_time + timedelta(days=i)
        val = last_price * (1 + (coef * i) + random.uniform(-0.01, 0.01))
        forecast.append({
            "date":             dt.strftime("%Y-%m-%d"),
            "price":            round(val, 4),
            "confidence_upper": round(val * 1.05, 4),
            "confidence_lower": round(val * 0.95, 4)
        })

    return jsonify({
        "symbol": symbol, "indicator": direction,
        "confidence": f"{ml_confidence}%",
        "historical": historical, "forecast": forecast
    })


@app.route("/api/chat", methods=["POST"])
def post_chat_query():
    data  = request.get_json(force=True) or {}
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"reply": "Fein Core received empty terminal payload. Please specify a financial query."})

    upper = query.upper()
    if "TSLA" in upper or "TESLA" in upper:
        reply = ("<strong>[Fein Server Analysis - TSLA]</strong><br>"
                 "Tesla exhibits highly volatile MACD waves. Immediate supports have formed near $180, "
                 "whereas resistance bands are firmly cap-staged at $188. Technical parameters suggest accumulating "
                 "long shares on breakouts past $184 with strict stops set below $178.")
    elif "AAPL" in upper or "APPLE" in upper:
        reply = ("<strong>[Fein Server Analysis - AAPL]</strong><br>"
                 "Apple consolidates tightly around its 50-day EMA support ($174.50). Orderbook depth indicates "
                 "institutional accumulation patterns. Breakout structures above $176.50 confirm targets toward "
                 "historical resistance levels near $182. Risk profile remains highly favorable.")
    elif "BTC" in upper or "BITCOIN" in upper:
        reply = ("<strong>[Fein Server Analysis - BTCUSD]</strong><br>"
                 "Bitcoin holds crucial long-term supports at the $66,800 cluster. Volume profiles are thin, "
                 "confirming consolidation ahead of major breakout expansions. Close above $68,200 sets targets "
                 "toward fresh local highs at $71,500. Maintain defensive risk allocations.")
    else:
        reply = ("<strong>[Fein Quantitative Assistant]</strong><br>"
                 "Your query has been indexed. General technical market conditions indicate constructive accumulation "
                 "for top equities, while crypto markets are digesting recent high-leverage expansions. For detailed risk "
                 "mitigation, we highly recommend utilizing the built-in position sizing calculator on your terminal!")

    return jsonify({"reply": reply})


# ════════════════════════════════════════════════════════════
#  STATIC FILE SERVING
# ════════════════════════════════════════════════════════════

@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

@app.route("/style.css")
def serve_css():
    return send_from_directory(".", "style.css")

@app.route("/script.js")
def serve_js():
    return send_from_directory(".", "script.js")

@app.route("/logo.svg")
def serve_logo():
    return send_from_directory(".", "logo.svg")


# ════════════════════════════════════════════════════════════
#  STARTUP
# ════════════════════════════════════════════════════════════

if __name__ == "__main__":
    init_db()
    print("=" * 62)
    print("   FEIN TRADE SERVER  —  http://127.0.0.1:5000")
    print("   Database: fein_trade.db  (SQLite, auto-created)")
    print("   Auth:     JWT (72h expiry) + PBKDF2-SHA256 passwords")
    print("=" * 62)
    app.run(host="127.0.0.1", port=5000, debug=True)
