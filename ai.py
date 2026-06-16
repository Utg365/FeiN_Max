# ================================================================
#  FEIN TRADE — AI Chatbot Engine
#  Model   : Llama 3.1 8B (via Groq — free & ultra-fast)
#  Features: Portfolio scanner, sell/hold guidance, NEPSE knowledge,
#             FEIN TRADE platform help, general finance Q&A,
#             proactive stock alerts, conversation memory
#
#  HOW TO USE:
#    1. pip install groq flask flask-cors
#    2. Get free API key → https://console.groq.com
#    3. Set env: export GROQ_API_KEY="gsk_..."
#       OR paste key directly into GROQ_API_KEY below
#    4. In your server.py add these 2 lines:
#         from fein_ai import register_fein_ai_routes
#         register_fein_ai_routes(app)
#    5. DELETE the old /api/chat route from server.py
# ================================================================

from __future__ import annotations
import os, re, json, time, math
from datetime import datetime
from typing import Optional

# ── Groq SDK (pip install groq) ─────────────────────────────
try:
    from groq import Groq
    _GROQ_OK = True
except ImportError:
    _GROQ_OK = False
    print("[FEIN AI] WARNING: 'groq' package not found. Run: pip install groq")

# ================================================================
#  CONFIGURATION — edit these
# ================================================================

# Paste your free Groq key here, OR set env variable GROQ_API_KEY
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Llama 3.1 8B model on Groq (fastest, free tier)
MODEL        = "llama-3.1-8b-instant"

# Response length in tokens (increase for longer answers)
MAX_TOKENS   = 800

# 0.0 = deterministic, 1.0 = creative. 0.65 is sharp & factual
TEMPERATURE  = 0.65

# How many past exchanges to remember per user session
MAX_HISTORY  = 10


# ================================================================
#  SYSTEM PROMPT — the AI's entire personality & knowledge base
# ================================================================

SYSTEM_PROMPT = """You are **Fein AI**, the intelligent trading assistant built into **FEIN TRADE** — a NEPSE paper-trading simulator platform for Nepali investors and students.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR PERSONALITY & BEHAVIOR RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. When a user message arrives WITH a portfolio snapshot, ALWAYS start your reply by proactively commenting on their holdings. Example: "I can see you hold NABIL and UPPER — let me give you an update on both before answering your question."
2. When a user asks a general question (not stock-specific), still briefly mention their portfolio at the end if they have holdings.
3. You are helpful, concise, and educational. Never give junk filler text.
4. You answer ALL questions — stock trading, NEPSE rules, platform how-to, general finance, math, life advice, etc. Never refuse a question.
5. Always clarify: "This is a paper trading simulation — no real money is involved."
6. Use NPR (Nepalese Rupee) for NEPSE, $ for international stocks.
7. Never fabricate specific live prices — say you're working with the data provided.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORTFOLIO AUTO-SCAN & GUIDANCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When you receive a portfolio snapshot, apply these rules for EACH holding:

SELL SIGNAL (Loss):
- If unrealized loss > 5%  → Warn: "Consider cutting losses. NEPSE ±10% circuit means this could worsen fast."
- If unrealized loss > 10% → Urgent: "Strong sell signal. You've hit the psychological stop-loss threshold."
- If unrealized loss > 15% → Critical: "This position is bleeding capital. Paper-trade rule: exit now to protect remaining balance."

HOLD SIGNAL (Small loss or flat):
- If unrealized loss 0-5%  → "Hold but watch closely. Set a mental stop at -5% if it continues."

BUY MORE / AVERAGE DOWN:
- Only suggest this if: loss < 3% AND the sector (e.g. banking, hydropower) is fundamentally strong.

SELL SIGNAL (Profit):
- If unrealized gain > 15% → "Consider taking partial profits (50% of position). Lock in gains."
- If unrealized gain > 25% → "Strong take-profit zone. NEPSE stocks often retrace after big runs."

HOLD (Profit):
- If gain 5-15% → "Healthy gain. Trail your stop loss up to protect profits."

Always reference the SPECIFIC stock symbol and numbers from the portfolio data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FEIN TRADE PLATFORM KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard Tab:
- Shows portfolio performance chart (1W / 1M / ALL)
- Top Global Movers: gainers & losers (NEPSE + international)
- Watchlist: click + button top-right to add stocks
- Virtual Account Metrics: total trades, win rate, total profits

Markets Tab:
- Browse ALL / NEPSE / Intl Equities / Cryptocurrency / Forex
- Filter bar to search by name or symbol
- Click "Trade" button on any row to open that stock in the Paper Trading tab

Portfolio Tab:
- Asset Allocation pie chart (top left)
- Holdings table: Avg Cost, Live Price, Shares Held, Total Return
- "Open Order Terminal" button → goes to Paper Trading tab

Paper Trading Tab (most important):
- Left side: TradingView interactive candlestick chart (full technical analysis)
- Right side: Order Ticket panel
  → Search symbol in top search bar first
  → BUY / SELL toggle tabs
  → MARKET (immediate) or LIMIT (set your own price) order types
  → Quantity field + 10% / 25% / 50% / 100% quick-fill buttons
  → Stop Loss field: auto-sells if price drops here
  → Take Profit field: auto-sells when price hits target
  → Estimated Cost shows before you confirm
  → Green "EXECUTE BUY ORDER" button to place trade
- AI Prediction bar at bottom of ticket (Bullish/Bearish %)

Market News Tab:
- Live news from: Mero Lagani, Share Sansar, Artha Kendra, Bizmandu, Corporate Khabar, Nepali Paisa
- Filter: All / 🇳🇵 Nepal / 🌐 International
- Refresh button (circular arrow) for latest news
- Each card shows: title, source, sentiment (BULLISH/BEARISH/NEUTRAL), summary

AI & Tools Tab:
- Fein AI chat (this chatbot — you are here)
- Risk Management Calculator:
  → Enter: Total Cash, Max Risk per Trade (%), Entry Price, Stop Loss Price
  → Outputs: Capital at Risk, Position Size, Max Shares, Portfolio Allocation %
- Elite Trader Leaderboard: top performers ranked

Profile & Journal Tab:
- Change your display name
- Upload profile photo or choose avatar preset
- Write journal entries for trade notes
- Full Order Execution Log (timestamp, asset, action, price, qty, total)
- RESET DEMO BALANCE button → restores NPR 1,00,000 virtual cash

Account Details:
- Starting balance: NPR 1,00,000 (virtual paper money, zero real risk)
- Leverage: 1:1 cash account
- Can reset anytime via Profile & Journal tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEPSE KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exchange: Nepal Stock Exchange (NEPSE), Kathmandu. Est. 1993.
Trading days: Sunday – Thursday (Friday & Saturday = weekend in Nepal)
Trading hours: 11:00 AM – 3:00 PM NPT
Settlement: T+2 (shares/cash transfer 2 working days after trade)
Price limit: ±10% per day (circuit breaker halts trading beyond this)
Min trade unit: 1 kitta (share). Most stocks traded in multiples of 10.
Regulator: SEBON (Securities Board of Nepal)
Clearing: CDSC (CDS and Clearing Limited)
Demat accounts: MeroShare (meroshare.cdsc.com.np)
Index: NEPSE Index (composite), NEPSE Float Index

NEPSE Sectors & Key Stocks:
• Commercial Banks (≈55% market cap): NABIL, NIC Asia (NICA), Prabhu Bank (PRVU), NMB Bank (NMBBANK), Everest Bank (EBL), Kumari Bank (KBL), SBI Bank (SBI), Agriculture Dev Bank (ADBL)
• Development Banks: KSBBL, MNBBL, SADBL
• Finance Companies: ICFC, GFCL, SIFC
• Hydropower/Energy: Upper Tamakoshi (UPPER), HIDCL, Chilime (CHCL), NHPC, RURU, RIDI — government-backed, stable long-term
• Life Insurance: Nepal Life (NLIC), LICN, SLICL, GLICL
• Non-Life Insurance: SGIC, HGI, NIC
• Manufacturing: Nepal Telecom (NTC) — high dividend payer
• Microfinance: SKBBL, SWBBL, NUBL, CBBL
• Hotels: OHL, SHL, TRH
• Mutual Funds: NMB50, NIBLPF, LUITEL

IPO Process in Nepal:
1. Company files prospectus with SEBON
2. Application window opens (usually 7 days) via MeroShare
3. Allotment by lottery if oversubscribed
4. Shares listed on NEPSE after 30-60 days
5. IPO price typically at face value (NPR 100 per share)

Bonus Shares: Free shares from company retained earnings. Ex-date affects price.
Rights Shares: Existing shareholders buy new shares at discount. Must apply via MeroShare.
Book Close Date: Date company freezes shareholder register for dividend/bonus eligibility.
Dividend: Cash payment from profits. Yield = Annual DPS / Current Price × 100%.

Key Ratios:
• EPS (Earnings Per Share) = Net Profit / Total Shares
• P/E Ratio = Market Price / EPS (lower = cheaper)
• Book Value per Share = (Total Assets - Liabilities) / Shares
• P/B Ratio = Market Price / Book Value (banks: good if < 2.5)
• ROE = Net Profit / Shareholders Equity × 100% (banks: good if > 15%)
• Dividend Yield = Annual Dividend / Price × 100%

Technical Analysis Indicators:
• RSI (Relative Strength Index): >70 overbought (sell signal), <30 oversold (buy signal)
• MACD: Moving Average Convergence Divergence. Bullish when MACD crosses above signal line.
• EMA (Exponential Moving Average): 20-day, 50-day, 200-day. Price above 200 EMA = long-term bullish.
• Bollinger Bands: Price touching upper band = overbought, lower band = oversold.
• Volume: Rising price + rising volume = strong trend confirmation.
• Support: Price floor where buyers step in. Resistance: Price ceiling where sellers appear.
• Candlestick patterns: Doji (indecision), Hammer (bullish reversal), Engulfing (trend change)

Risk Management Rules (Professional):
• Never risk more than 1-2% of total capital on a single trade
• Position Size = (Capital × Risk%) / (Entry - Stop Loss)
• Use the Risk Calculator in the AI & Tools tab to compute this automatically
• Always set stop loss BEFORE entering a trade
• Win Rate × Avg Win must exceed Loss Rate × Avg Loss (positive expectancy)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Use **bold** for stock symbols, key terms, numbers
- Use bullet points for lists
- Use short paragraphs (2-3 sentences max)
- Keep total response under 350 words unless the topic genuinely needs more
- End with a practical next step the user can take on FEIN TRADE
"""


# ================================================================
#  CONVERSATION MEMORY (server-side, keyed by session/user id)
# ================================================================

_memory: dict[str, list[dict]] = {}  # session_id → message list


def _get_history(session_id: str) -> list[dict]:
    return _memory.get(session_id, [])


def _add_to_history(session_id: str, role: str, content: str):
    msgs = _memory.setdefault(session_id, [])
    msgs.append({"role": role, "content": content})
    # Keep only the last MAX_HISTORY pairs
    if len(msgs) > MAX_HISTORY * 2:
        _memory[session_id] = msgs[-(MAX_HISTORY * 2):]


def clear_session(session_id: str):
    _memory.pop(session_id, None)


# ================================================================
#  PORTFOLIO SCANNER — analyses holdings and produces alerts
# ================================================================

def scan_portfolio(holdings: list[dict]) -> list[dict]:
    """
    Analyses each holding and returns a list of alert dicts.

    Each holding dict should have:
        symbol      : str   — e.g. "NABIL"
        quantity    : float — shares held
        avg_cost    : float — average buy price (NPR)
        current_price: float — live price (NPR)

    Returns list of dicts:
        symbol, quantity, avg_cost, current_price,
        pnl_pct, pnl_amount, signal, message, urgency
    """
    alerts = []

    for h in holdings:
        symbol    = (h.get("symbol") or h.get("sym") or "?").upper()
        qty       = float(h.get("quantity") or h.get("qty") or 0)
        avg_cost  = float(h.get("avg_cost") or h.get("avgCost") or h.get("averageCost") or 0)
        cur_price = float(h.get("current_price") or h.get("currentPrice") or h.get("livePrice") or 0)

        if qty <= 0 or avg_cost <= 0 or cur_price <= 0:
            continue

        pnl_amount = (cur_price - avg_cost) * qty
        pnl_pct    = ((cur_price - avg_cost) / avg_cost) * 100
        total_val  = cur_price * qty

        # ── Determine signal ──────────────────────────────
        if pnl_pct <= -15:
            signal  = "CRITICAL_SELL"
            urgency = "CRITICAL"
            message = (
                f"⛔ **{symbol}** is down **{pnl_pct:.1f}%** "
                f"(loss: NPR {abs(pnl_amount):,.0f}). "
                f"This is a critical loss. In paper trading, the discipline rule is: exit now. "
                f"NEPSE's ±10% circuit means this could drop another full limit before recovering."
            )
        elif pnl_pct <= -10:
            signal  = "STRONG_SELL"
            urgency = "HIGH"
            message = (
                f"🔴 **{symbol}** is down **{pnl_pct:.1f}%** "
                f"(loss: NPR {abs(pnl_amount):,.0f}). "
                f"You've hit the psychological stop-loss threshold. "
                f"Consider exiting to prevent further capital erosion."
            )
        elif pnl_pct <= -5:
            signal  = "SELL_CONSIDER"
            urgency = "MEDIUM"
            message = (
                f"🟠 **{symbol}** is down **{pnl_pct:.1f}%** "
                f"(loss: NPR {abs(pnl_amount):,.0f}). "
                f"This is approaching your stop-loss zone. "
                f"Evaluate if the sector fundamentals still justify holding."
            )
        elif pnl_pct < 0:
            signal  = "HOLD_WATCH"
            urgency = "LOW"
            message = (
                f"🟡 **{symbol}** is down a small **{pnl_pct:.1f}%** "
                f"(loss: NPR {abs(pnl_amount):,.0f}). "
                f"Still within normal fluctuation. Hold but set a mental stop at -5%."
            )
        elif pnl_pct >= 25:
            signal  = "TAKE_PROFIT"
            urgency = "MEDIUM"
            message = (
                f"💰 **{symbol}** is up **{pnl_pct:.1f}%** "
                f"(profit: NPR {pnl_amount:,.0f}). "
                f"Excellent gain! Consider selling at least 50% of your position to lock in profits. "
                f"NEPSE stocks often retrace after large runs."
            )
        elif pnl_pct >= 15:
            signal  = "PARTIAL_PROFIT"
            urgency = "LOW"
            message = (
                f"📈 **{symbol}** is up **{pnl_pct:.1f}%** "
                f"(profit: NPR {pnl_amount:,.0f}). "
                f"Strong gain. Consider taking partial profits or trailing your stop loss upward."
            )
        elif pnl_pct >= 5:
            signal  = "HOLD_PROFIT"
            urgency = "INFO"
            message = (
                f"✅ **{symbol}** is up **{pnl_pct:.1f}%** "
                f"(profit: NPR {pnl_amount:,.0f}). "
                f"Healthy gain. Trail your stop loss up to at least breakeven to protect profits."
            )
        else:
            signal  = "HOLD_FLAT"
            urgency = "INFO"
            message = (
                f"➡️ **{symbol}** is nearly flat at **+{pnl_pct:.1f}%** "
                f"(NPR {pnl_amount:,.0f}). "
                f"No action needed. Monitor volume and news for direction."
            )

        alerts.append({
            "symbol":        symbol,
            "quantity":      qty,
            "avg_cost":      avg_cost,
            "current_price": cur_price,
            "total_value":   round(total_val, 2),
            "pnl_pct":       round(pnl_pct, 2),
            "pnl_amount":    round(pnl_amount, 2),
            "signal":        signal,
            "urgency":       urgency,
            "message":       message,
        })

    # Sort: most urgent first (CRITICAL → HIGH → MEDIUM → LOW → INFO)
    urgency_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    alerts.sort(key=lambda a: urgency_rank.get(a["urgency"], 9))

    return alerts


# ================================================================
#  CONTEXT BUILDER — builds the dynamic snapshot injected into
#  every prompt so Llama knows the user's real portfolio state
# ================================================================

def _build_context(portfolio: Optional[dict], alerts: list[dict]) -> str:
    lines = [f"[Context: {datetime.now().strftime('%A %d %b %Y, %I:%M %p NPT')}]"]

    if portfolio:
        cash      = float(portfolio.get("cash", 0))
        net_liq   = float(portfolio.get("netLiquidation", cash))
        pnl       = float(portfolio.get("unrealizedPnL", 0))
        win_rate  = float(portfolio.get("winRate", 0))
        tot_trades= int(portfolio.get("totalTrades", 0))

        lines.append(
            f"[User Portfolio Snapshot]"
            f"\n  Cash Available : NPR {cash:,.2f}"
            f"\n  Net Liquidation: NPR {net_liq:,.2f}"
            f"\n  Unrealized P&L : NPR {pnl:+,.2f}"
            f"\n  Total Trades   : {tot_trades}"
            f"\n  Win Rate       : {win_rate:.1f}%"
        )

    if alerts:
        lines.append("[Portfolio Scanner Results — address EACH of these in your reply]")
        for a in alerts:
            lines.append(
                f"  • {a['symbol']}: qty={a['quantity']}, avg_buy=NPR {a['avg_cost']:.2f}, "
                f"now=NPR {a['current_price']:.2f}, P&L={a['pnl_pct']:+.1f}% "
                f"(NPR {a['pnl_amount']:+,.0f}) → Signal: {a['signal']}"
            )
    elif portfolio and portfolio.get("holdings"):
        lines.append("[No holdings with price data to scan]")
    else:
        lines.append("[No portfolio data provided — answer the question directly]")

    return "\n".join(lines)


# ================================================================
#  PROACTIVE OPENER — generated when portfolio has holdings
#  so the AI immediately addresses their stocks
# ================================================================

def _proactive_opener(alerts: list[dict]) -> str:
    """Builds the user-side prefix that triggers proactive analysis."""
    if not alerts:
        return ""

    symbols = [a["symbol"] for a in alerts]
    urgent  = [a for a in alerts if a["urgency"] in ("CRITICAL", "HIGH")]

    if urgent:
        urgent_syms = [a["symbol"] for a in urgent]
        return (
            f"[SYSTEM: User has holdings. Urgent issues detected with: {', '.join(urgent_syms)}. "
            f"Start your reply by immediately addressing these urgent positions FIRST, "
            f"then answer the user's actual question. Be direct and specific with numbers.] "
        )
    else:
        return (
            f"[SYSTEM: User has holdings in: {', '.join(symbols)}. "
            f"Briefly acknowledge their portfolio at the start, then answer the question.] "
        )


# ================================================================
#  MARKDOWN → HTML  (for display in the FEIN TRADE chat bubbles)
# ================================================================

def _md_to_html(text: str) -> str:
    """Converts Llama's Markdown to HTML for the frontend chat UI."""
    lines  = text.split("\n")
    out    = []
    in_ul  = False
    in_ol  = False

    for line in lines:
        s = line.strip()
        if not s:
            if in_ul: out.append("</ul>"); in_ul = False
            if in_ol: out.append("</ol>"); in_ol = False
            continue

        # Ordered list
        m = re.match(r"^\d+\.\s+(.+)", s)
        if m:
            if in_ul: out.append("</ul>"); in_ul = False
            if not in_ol: out.append("<ol>"); in_ol = True
            out.append(f"<li>{_inline(m.group(1))}</li>"); continue

        # Unordered list
        m = re.match(r"^[-*•]\s+(.+)", s)
        if m:
            if in_ol: out.append("</ol>"); in_ol = False
            if not in_ul: out.append("<ul>"); in_ul = True
            out.append(f"<li>{_inline(m.group(1))}</li>"); continue

        if in_ul: out.append("</ul>"); in_ul = False
        if in_ol: out.append("</ol>"); in_ol = False

        # Headings
        for hm, tag in [(re.match(r"^###\s+(.+)", s), "strong"),
                         (re.match(r"^##\s+(.+)",  s), "strong"),
                         (re.match(r"^#\s+(.+)",   s), "strong")]:
            if hm:
                out.append(f"<{tag}>{_inline(hm.group(1))}</{tag}>"); break
        else:
            out.append(f"<p>{_inline(s)}</p>")

    if in_ul: out.append("</ul>")
    if in_ol: out.append("</ol>")
    return "\n".join(out)


def _inline(t: str) -> str:
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\*(.+?)\*",     r"<em>\1</em>",         t)
    t = re.sub(r"`([^`]+)`",     r"<code>\1</code>",      t)
    return t


# ================================================================
#  CORE CHAT FUNCTION — the main entry point
# ================================================================

def chat(
    message:      str,
    session_id:   str            = "default",
    portfolio:    Optional[dict] = None,
) -> dict:
    """
    Send a message to Fein AI and get a reply.

    Parameters
    ----------
    message    : The user's question or statement
    session_id : Unique ID for this user/session (for memory)
    portfolio  : Dict with user's trading state. Expected keys:
                   cash            (float)  — available cash
                   netLiquidation  (float)  — total account value
                   unrealizedPnL   (float)  — total unrealized P&L
                   totalTrades     (int)
                   winRate         (float)
                   holdings        (list)   — list of holding dicts:
                     each: { symbol, quantity, avg_cost, current_price }

    Returns
    -------
    dict with keys:
        reply       : str   — HTML-formatted response
        alerts      : list  — portfolio scan results
        model       : str   — model name used
        tokens_used : int
        error       : bool
        error_msg   : str (if error)
    """

    # ── Pre-flight checks ───────────────────────────────────
    if not _GROQ_OK:
        return _err("groq package not installed. Run: pip install groq")

    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_GROQ_API_KEY_HERE":
        return _err(
            "Groq API key not set. "
            "Get your FREE key at https://console.groq.com "
            "then set GROQ_API_KEY in fein_ai.py or as env variable."
        )

    if not message or not message.strip():
        return _err("Empty message received.")

    # ── Scan portfolio ──────────────────────────────────────
    alerts   = []
    holdings = (portfolio or {}).get("holdings", [])
    if holdings:
        alerts = scan_portfolio(holdings)

    # ── Build dynamic context ───────────────────────────────
    context  = _build_context(portfolio, alerts)
    opener   = _proactive_opener(alerts)

    # Full system prompt = base prompt + live context
    full_system = SYSTEM_PROMPT + "\n\n" + context

    # ── Assemble messages ───────────────────────────────────
    history  = _get_history(session_id)
    user_msg = (opener + message.strip()) if opener else message.strip()

    messages = (
        [{"role": "system", "content": full_system}]
        + history
        + [{"role": "user", "content": user_msg}]
    )

    # ── Call Groq / Llama 3.1 8B ───────────────────────────
    try:
        client = Groq(api_key=GROQ_API_KEY)
        resp   = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            top_p=0.9,
        )
        raw    = resp.choices[0].message.content.strip()
        tokens = resp.usage.total_tokens

    except Exception as e:
        err = str(e)
        if "401" in err or "invalid_api_key" in err.lower():
            return _err("Invalid API key. Check console.groq.com for your key.")
        if "429" in err or "rate_limit" in err.lower():
            return _err("Rate limit reached. Wait a few seconds and retry.")
        if "connection" in err.lower():
            return _err("Network error. Check your internet connection.")
        return _err(f"Groq API error: {err[:200]}")

    # ── Save to memory ──────────────────────────────────────
    _add_to_history(session_id, "user",      message.strip())
    _add_to_history(session_id, "assistant", raw)

    # ── Return ──────────────────────────────────────────────
    return {
        "reply":       _md_to_html(raw),
        "reply_plain": raw,
        "alerts":      alerts,
        "model":       MODEL,
        "tokens_used": tokens,
        "error":       False,
        "error_msg":   "",
    }


def _err(msg: str) -> dict:
    return {
        "reply":       f"<strong>[Fein AI Error]</strong><br>{msg}",
        "reply_plain": f"[Fein AI Error] {msg}",
        "alerts":      [],
        "model":       MODEL,
        "tokens_used": 0,
        "error":       True,
        "error_msg":   msg,
    }


# ================================================================
#  FLASK ROUTE REGISTRATION
#  Call register_fein_ai_routes(app) in your server.py
# ================================================================

def register_fein_ai_routes(app):
    """
    Registers 3 routes onto your existing Flask app:
      POST /api/chat          — main chat endpoint
      POST /api/chat/clear    — clear conversation memory
      GET  /api/chat/history  — retrieve session history
      POST /api/portfolio/scan— standalone portfolio scan (no chat)

    Usage in server.py:
    ─────────────────────
      from fein_ai import register_fein_ai_routes
      register_fein_ai_routes(app)
      # Then DELETE the old /api/chat route
    """
    try:
        from flask import request, jsonify
    except ImportError:
        print("[FEIN AI] Flask not installed. Run: pip install flask")
        return

    # ── Try to import g for JWT session ────────────────────
    try:
        from flask import g as flask_g
        _has_g = True
    except Exception:
        _has_g = False

    def _session_id():
        """Returns user_id from JWT (if auth middleware ran) else IP."""
        if _has_g:
            uid = getattr(flask_g, "current_user_id", None)
            if uid:
                return str(uid)
        return request.remote_addr or "anon"

    # ── /api/chat ───────────────────────────────────────────
    @app.route("/api/chat", methods=["POST"])
    def fein_chat_endpoint():
        """
        Main AI chat endpoint.

        Request body (JSON):
        {
            "query": "How do I place a limit order?",
            "portfolio": {
                "cash": 75000,
                "netLiquidation": 92000,
                "unrealizedPnL": 3200,
                "totalTrades": 12,
                "winRate": 66.7,
                "holdings": [
                    {
                        "symbol": "NABIL",
                        "quantity": 50,
                        "avg_cost": 1380.00,
                        "current_price": 1310.00
                    },
                    {
                        "symbol": "UPPER",
                        "quantity": 100,
                        "avg_cost": 295.00,
                        "current_price": 340.00
                    }
                ]
            }
        }

        Response (JSON):
        {
            "reply": "<p>HTML formatted response...</p>",
            "alerts": [...],
            "model": "llama-3.1-8b-instant",
            "tokens_used": 312,
            "error": false
        }
        """
        data      = request.get_json(force=True) or {}
        message   = (data.get("query") or data.get("message") or "").strip()
        portfolio = data.get("portfolio", None)

        if not message:
            return jsonify({"reply": "Please type a message for Fein AI.", "error": False}), 200

        result = chat(
            message    = message,
            session_id = _session_id(),
            portfolio  = portfolio,
        )
        return jsonify(result), 200

    # ── /api/chat/clear ─────────────────────────────────────
    @app.route("/api/chat/clear", methods=["POST"])
    def fein_chat_clear():
        """Clears conversation memory for the current user session."""
        clear_session(_session_id())
        return jsonify({"message": "Chat memory cleared.", "error": False}), 200

    # ── /api/chat/history ───────────────────────────────────
    @app.route("/api/chat/history", methods=["GET"])
    def fein_chat_history():
        """Returns the current session's conversation history."""
        history = _get_history(_session_id())
        public  = [m for m in history if m["role"] in ("user", "assistant")]
        return jsonify({"history": public, "count": len(public) // 2}), 200

    # ── /api/portfolio/scan ─────────────────────────────────
    @app.route("/api/portfolio/scan", methods=["POST"])
    def fein_portfolio_scan():
        """
        Standalone portfolio scanner — returns alerts without a chat reply.

        Request body:
        {
            "holdings": [
                { "symbol": "NABIL", "quantity": 50, "avg_cost": 1380, "current_price": 1310 }
            ]
        }
        """
        data     = request.get_json(force=True) or {}
        holdings = data.get("holdings", [])
        if not holdings:
            return jsonify({"alerts": [], "message": "No holdings provided."}), 200
        alerts = scan_portfolio(holdings)
        return jsonify({"alerts": alerts, "count": len(alerts)}), 200

    print("[FEIN AI] Routes registered:")
    print("          POST /api/chat")
    print("          POST /api/chat/clear")
    print("          GET  /api/chat/history")
    print("          POST /api/portfolio/scan")


# ================================================================
#  COMMAND-LINE TESTER
#  Run directly to test without the web server:
#    python3 fein_ai.py
# ================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  FEIN TRADE — Llama 3.1 8B Chat Test Console")
    print("  Commands: 'quit' to exit | 'clear' to reset memory")
    print("            'scan' to run portfolio scan demo")
    print("=" * 60)

    # Demo portfolio — simulates a real user's account
DEMO_PORTFOLIO = {
    "cash": 100000.00,
    "netLiquidation": 100000.00,
    "unrealizedPnL": 0.0,
    "totalTrades": 0,
    "winRate": 0.0,
    "holdings": []
}

while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("quit", "exit"):
            print("Goodbye!")
            break

        if user_input.lower() == "clear":
            clear_session("cli_test")
            print("[Memory cleared]")
            continue

        if user_input.lower() == "scan":
            print("\n[Running portfolio scan...]\n")
            alerts = scan_portfolio(DEMO_PORTFOLIO["holdings"])
            for a in alerts:
                plain = re.sub(r"<[^>]+>", "", a["message"])
                plain = plain.replace("**", "")
                print(f"  [{a['urgency']:8s}] {plain}")
            continue

        result = chat(
            message    = user_input,
            session_id = "cli_test",
            portfolio  = DEMO_PORTFOLIO,
        )

        # Strip HTML tags for clean terminal output
        plain = re.sub(r"<[^>]+>", "", result["reply_plain"])
        print(f"\nFein AI:\n{plain}")

        if not result["error"]:
            print(f"\n  ─ {result['model']} · {result['tokens_used']} tokens ─")

        if result["alerts"]:
            urgent = [a for a in result["alerts"] if a["urgency"] in ("CRITICAL", "HIGH")]
            if urgent:
                print(f"  ⚠ {len(urgent)} urgent portfolio alert(s) detected")
