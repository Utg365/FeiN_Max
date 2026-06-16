# ================================================================
#  FEIN TRADE — AI Chatbot Engine (Enhanced RAG & Analysis Brain)
#  Model   : Llama 3.1 8B (via Groq — free & ultra-fast)
#  Features: Supabase stock market cache lookup, technical analysis,
#             technical indicators (SMA, RSI, MACD, Bollinger Bands),
#             portfolio scanner, conversational memory, casual assistant
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

# ── Supabase Stock Repository ────────────────────────────────
try:
    from app.repositories.stock_repository import StockRepository
    _repo = StockRepository()
except Exception as e:
    _repo = None
    print(f"[FEIN AI] WARNING: Could not load StockRepository: {e}")

# ================================================================
#  CONFIGURATION
# ================================================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MODEL        = "llama-3.1-8b-instant"
MAX_TOKENS   = 1000
TEMPERATURE  = 0.7  # Increased slightly for more natural/casual conversations
MAX_HISTORY  = 10


# ================================================================
#  SYSTEM PROMPT (ChatGPT / Gemini Personality + FEIN TRADE Context)
# ================================================================

SYSTEM_PROMPT = """You are **Fein AI**, a highly capable, friendly, and elite AI financial assistant integrated into **FEIN TRADE** — a paper-trading simulator platform for Nepali stock market (NEPSE) investors.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR PERSONALITY & CONVERSATIONAL STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. You talk in a **casual, engaging, and friendly way** — just like ChatGPT, Gemini, or Claude. You can chat about anything, make jokes, give educational finance lessons, or simply follow casual conversational flow.
2. You answer **ALL types of queries** (programming, math, general knowledge, financial advice, or platform help). Never refuse to answer. If a query is casual, respond casually.
3. Be helpful, concise, and professional. Avoid lengthy, dry, or generic introductions. 
4. Always clarify when talking about simulated trading: "Remember, FEIN TRADE is a paper trading simulation — no real money is involved."
5. Use NPR (Nepalese Rupee) for NEPSE assets, and $ for international assets.
6. When the user asks you about stocks and live database context is provided, speak with high confidence using the calculated technical parameters, and explain technical indicators (like RSI, SMA, MACD, and Bollinger Bands) in an easy-to-understand way.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PORTFOLIO SCANNER RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user's portfolio snapshot is provided, check if there are holdings.
- If they have unrealized losses > 10%, warn them about risk management and stop-loss limits.
- If they have unrealized gains > 15%, suggest taking partial profits (e.g. 50% position).
- Address their portfolio holdings at the start of your message in a helpful, friendly tone, then move on to answer their query.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEPSE QUICK KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Exchange: Nepal Stock Exchange (NEPSE). Trading hours: Sun-Thu, 11:00 AM - 3:00 PM NPT.
- Price limit: ±10% per day (circuit breakers). Demat system: MeroShare.
- Sectors include Commercial Banks (NABIL, NICA, EBL, etc.), Hydropower (UPPER, CHCL, etc.), Insurance, and Manufacturing.
"""


# ================================================================
#  CONVERSATION MEMORY (session_id → messages)
# ================================================================

_memory: dict[str, list[dict]] = {}

def _get_history(session_id: str) -> list[dict]:
    return _memory.get(session_id, [])

def _add_to_history(session_id: str, role: str, content: str):
    msgs = _memory.setdefault(session_id, [])
    msgs.append({"role": role, "content": content})
    if len(msgs) > MAX_HISTORY * 2:
        _memory[session_id] = msgs[-(MAX_HISTORY * 2):]

def clear_session(session_id: str):
    _memory.pop(session_id, None)


# ================================================================
#  PURE-PYTHON TECHNICAL INDICATORS (No Pandas/Numpy Dependencies)
# ================================================================

def calculate_sma(prices: list[float], period: int) -> list[float]:
    if not prices:
        return []
    if len(prices) < period:
        return [sum(prices) / len(prices)] * len(prices)
    smas = []
    for i in range(len(prices)):
        if i < period - 1:
            smas.append(sum(prices[:i+1]) / (i + 1))
        else:
            smas.append(sum(prices[i - period + 1 : i + 1]) / period)
    return smas


def calculate_ema(prices: list[float], period: int) -> list[float]:
    if not prices:
        return []
    multiplier = 2 / (period + 1)
    emas = [prices[0]]
    for i in range(1, len(prices)):
        emas.append((prices[i] - emas[-1]) * multiplier + emas[-1])
    return emas


def calculate_bollinger_bands(prices: list[float], period: int = 20) -> tuple[list[float], list[float], list[float]]:
    if not prices:
        return [], [], []
    smas = calculate_sma(prices, period)
    upper_bands = []
    lower_bands = []
    for i in range(len(prices)):
        window = prices[max(0, i - period + 1) : i + 1]
        mean = smas[i]
        variance = sum((x - mean) ** 2 for x in window) / len(window)
        std_dev = math.sqrt(variance) if variance > 0 else 0
        upper_bands.append(mean + 2 * std_dev)
        lower_bands.append(mean - 2 * std_dev)
    return upper_bands, smas, lower_bands


def calculate_rsi(prices: list[float], period: int = 14) -> list[float]:
    if len(prices) <= period:
        return [50.0] * len(prices)

    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0.0 for d in deltas]
    losses = [-d if d < 0 else 0.0 for d in deltas]

    rsi = [50.0]  # first placeholder

    # Initial average gain/loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for _ in range(period):
        rsi.append(50.0)

    for i in range(period, len(prices) - 1):
        gain = gains[i]
        loss = losses[i]
        # Wilder's smoothing
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

        if avg_loss == 0:
            rs = 100.0
        else:
            rs = avg_gain / avg_loss

        rsi.append(100.0 - (100.0 / (1.0 + rs)))

    return rsi


def calculate_macd(prices: list[float]) -> tuple[list[float], list[float], list[float]]:
    if len(prices) < 26:
        return [0.0] * len(prices), [0.0] * len(prices), [0.0] * len(prices)
    ema12 = calculate_ema(prices, 12)
    ema26 = calculate_ema(prices, 26)
    macd_line = [e12 - e26 for e12, e26 in zip(ema12, ema26)]
    signal_line = calculate_ema(macd_line, 9)
    histogram = [m - s for m, s in zip(macd_line, signal_line)]
    return macd_line, signal_line, histogram


# ================================================================
#  SYMBOL EXTRACTION & SUPABASE RAG PIPELINE
# ================================================================

def extract_symbols(message: str) -> list[str]:
    """Finds words that look like NEPSE stock symbols (e.g. NABIL, NICA)."""
    # Look for 3-10 uppercase alphabetic characters
    candidates = re.findall(r"\b[A-Z]{3,10}\b", message)
    # Exclude common non-stock abbreviations
    stop_words = {"NPR", "USD", "BTC", "ETH", "USA", "API", "RAG", "LLM", "SMA", "EMA", "RSI", "MACD", "NPT", "NEX", "SEC"}
    symbols = list(set(sym for sym in candidates if sym not in stop_words))
    return symbols


def get_supabase_stock_context(symbols: list[str]) -> str:
    """Queries Supabase database and computes indicators to build dynamic RAG context."""
    if not _repo or not symbols:
        return ""

    context_blocks = []

    for sym in symbols:
        try:
            # Query the last 50 closing records for indicator calculations
            records = _repo.get_historical_data(sym.upper(), limit=50)
            if not records:
                continue

            latest = records[-1]
            closes = [r["close"] for r in records]
            
            # Compute indicators
            smas20 = calculate_sma(closes, 20)
            smas50 = calculate_sma(closes, 50)
            upper_bb, middle_bb, lower_bb = calculate_bollinger_bands(closes, 20)
            rsis = calculate_rsi(closes, 14)
            macd, signal, hist = calculate_macd(closes)

            latest_close = latest["close"]
            prev_close = closes[-2] if len(closes) > 1 else latest_close
            change_val = latest_close - prev_close
            change_pct = (change_val / prev_close * 100) if prev_close > 0 else 0.0

            # Formulate indicator statements
            latest_rsi = rsis[-1]
            rsi_desc = "Oversold" if latest_rsi < 30 else ("Overbought" if latest_rsi > 70 else "Neutral")

            latest_sma20 = smas20[-1]
            sma20_desc = "Above (Bullish)" if latest_close > latest_sma20 else "Below (Bearish)"

            latest_sma50 = smas50[-1]
            sma50_desc = "Above (Bullish)" if latest_close > latest_sma50 else "Below (Bearish)"

            latest_macd = macd[-1]
            latest_sig = signal[-1]
            macd_desc = "Bullish Crossover" if latest_macd > latest_sig else "Bearish Cross"

            block = (
                f"[Supabase Database Cash-Cache for {sym.upper()}]\n"
                f"  • Profile: Sector={latest.get('sector') or 'unknown'}, Exchange=NEPSE\n"
                f"  • Price Statistics (as of {latest['date']}):\n"
                f"      Close: NPR {latest_close:,.2f} | Open: NPR {latest['open']:,.2f} | "
                f"High: NPR {latest['high']:,.2f} | Low: NPR {latest['low']:,.2f}\n"
                f"      24h Change: {change_pct:+.2f}% (Volume: {latest['volume']:,}, Turnover: NPR {latest['turnover']:,.2f})\n"
                f"  • Technical Indicator Calculations (Last 50 days):\n"
                f"      - 20-day SMA: NPR {latest_sma20:,.2f} (Price is {sma20_desc} 20 SMA)\n"
                f"      - 50-day SMA: NPR {latest_sma50:,.2f} (Price is {sma50_desc} 50 SMA)\n"
                f"      - Bollinger Bands: Upper=NPR {upper_bb[-1]:,.2f}, Middle=NPR {middle_bb[-1]:,.2f}, Lower=NPR {lower_bb[-1]:,.2f}\n"
                f"      - 14-period RSI: {latest_rsi:.1f} ({rsi_desc})\n"
                f"      - MACD Wave: MACD Line={latest_macd:.2f}, Signal Line={latest_sig:.2f} ({macd_desc})"
            )
            context_blocks.append(block)
        except Exception as ex:
            print(f"[FEIN AI] Error building RAG context for {sym}: {ex}")

    if context_blocks:
        return "\n\n" + "\n\n".join(context_blocks)
    return ""


# ================================================================
#  PORTFOLIO SCANNER
# ================================================================

def scan_portfolio(holdings: list[dict]) -> list[dict]:
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

    urgency_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    alerts.sort(key=lambda a: urgency_rank.get(a["urgency"], 9))
    return alerts


# ================================================================
#  CONTEXT BUILDER
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
        lines.append("[No portfolio holdings context available]")

    return "\n".join(lines)


def _proactive_opener(alerts: list[dict]) -> str:
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
#  MARKDOWN → HTML
# ================================================================

def _md_to_html(text: str) -> str:
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
#  CORE CHAT FUNCTION (Main Entry Point)
# ================================================================

def chat(
    message:      str,
    session_id:   str            = "default",
    portfolio:    Optional[dict] = None,
) -> dict:
    """
    Send a message to Fein AI and get a reply (with dynamic RAG analysis).
    """

    # ── Pre-flight checks ───────────────────────────────────
    if not _GROQ_OK:
        return _err("groq package not installed. Run: pip install groq")

    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_GROQ_API_KEY_HERE":
        return _err("Groq API key not set. Get your FREE key at https://console.groq.com.")

    if not message or not message.strip():
        return _err("Empty message received.")

    # ── Scan portfolio ──────────────────────────────────────
    alerts   = []
    holdings = (portfolio or {}).get("holdings", [])
    if holdings:
        alerts = scan_portfolio(holdings)

    # ── Build dynamic context (portfolio snapshot) ──────────
    portfolio_context = _build_context(portfolio, alerts)
    opener            = _proactive_opener(alerts)

    # ── RAG System (extract stock symbols from query & fetch technical details) ──
    extracted_symbols = extract_symbols(message)
    database_rag_context = get_supabase_stock_context(extracted_symbols)

    # Full system prompt = base prompt + portfolio context + database cache context
    full_system = SYSTEM_PROMPT + "\n\n" + portfolio_context
    if database_rag_context:
        full_system += "\n\n" + database_rag_context

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
