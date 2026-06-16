'use client';

import { useState, useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';

const LEADERBOARD = [
  { rank: 1, name: 'AlphaTrade_X',   roi: '+284.3%', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&q=80' },
  { rank: 2, name: 'QuantumNepse',   roi: '+201.8%', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=50&q=80' },
  { rank: 3, name: 'CryptoElite_99', roi: '+187.2%', avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=50&q=80' },
  { rank: 4, name: 'ForexMaestro',   roi: '+142.5%', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=50&q=80' },
  { rank: 5, name: 'SharpeRatio_Pro',roi: '+131.0%', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=50&q=80' },
];

function RiskCalculator({ balance }) {
  const [calcBalance, setCalcBalance]   = useState(String(Math.round(balance.cash)));
  const [calcRisk,    setCalcRisk]      = useState('2');
  const [calcEntry,   setCalcEntry]     = useState('150');
  const [calcStop,    setCalcStop]      = useState('142.5');

  const capital  = parseFloat(calcBalance)  || 0;
  const riskPct  = parseFloat(calcRisk)     || 0;
  const entry    = parseFloat(calcEntry)    || 0;
  const stop     = parseFloat(calcStop)     || 0;

  const capitalAtRisk   = (capital * riskPct) / 100;
  const riskPerShare    = Math.abs(entry - stop);
  const positionSize    = riskPerShare > 0 ? capitalAtRisk / riskPerShare * entry : 0;
  const maxQty          = riskPerShare > 0 && entry > 0 ? capitalAtRisk / riskPerShare : 0;
  const allocation      = capital > 0 ? (positionSize / capital) * 100 : 0;

  function fmt(n, dec = 2) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  return (
    <div className="glass-card">
      <div className="card-header">
        <h3 className="card-title"><i className="fa-solid fa-calculator" /> Risk Management Calculator</h3>
      </div>
      <div className="calc-grid">
        {[
          { id: 'calcBalance', label: 'Total Cash ($)',         value: calcBalance, setter: setCalcBalance },
          { id: 'calcRisk',    label: 'Max Risk per Trade (%)', value: calcRisk,    setter: setCalcRisk },
          { id: 'calcEntry',   label: 'Entry Price ($)',         value: calcEntry,   setter: setCalcEntry },
          { id: 'calcStop',    label: 'Stop Loss Price ($)',     value: calcStop,    setter: setCalcStop },
        ].map(field => (
          <div key={field.id} className="input-grp">
            <label htmlFor={field.id}>{field.label}</label>
            <div className="input-with-suffix">
              <input
                type="number"
                id={field.id}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                style={{ paddingRight: 14 }}
              />
            </div>
          </div>
        ))}

        <div className="calc-result-box">
          {[
            { label: 'Absolute Capital at Risk:', id: 'resCapitalRisk', value: `$${fmt(capitalAtRisk)}` },
            { label: 'Calculated Position Size:', id: 'resPositionSize', value: `$${fmt(positionSize)}` },
            { label: 'Max Buy Quantity:',         id: 'resQuantity',    value: `${fmt(maxQty, 1)} SHARES` },
            { label: 'Portfolio Allocation:',     id: 'resAllocation',  value: `${fmt(allocation, 1)}%` },
          ].map(r => (
            <div key={r.id} className="calc-res-row">
              <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
              <span className="calc-res-val" id={r.id}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIToolsView() {
  const { balance, portfolio, assets, transactions, triggerNotification } = useTrading();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I\'m Fein AI, your elite trading advisor. Ask me for technical analysis, strategy guides, stock comparisons, or risk planning.\n\nTry: "Analyze Tesla chart" or "Explain trailing stop loss".',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      // Map the portfolio object to the structure expected by ai.py
      const holdingsList = Object.keys(portfolio).map(symbol => {
        const holding = portfolio[symbol];
        const asset = assets.find(a => a.symbol === symbol);
        return {
          symbol: symbol,
          quantity: holding.qty,
          avg_cost: holding.avgPrice,
          current_price: asset ? asset.price : 0
        };
      });

      const token = localStorage.getItem('fein_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          portfolio: {
            cash: balance.cash,
            netLiquidation: balance.netLiq,
            unrealizedPnL: balance.unrealizedPnL,
            totalTrades: transactions.length,
            winRate: 65.0, // Default win rate estimation
            holdings: holdingsList
          }
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Sorry, no response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function clearChat() {
    setMessages([{
      role: 'assistant',
      text: 'Chat cleared. How can I assist your trading strategy today?',
    }]);

    try {
      const token = localStorage.getItem('fein_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers
      });
    } catch (err) {
      console.error('Failed to clear chat memory on server:', err);
    }
  }

  return (
    <section className="page-view active">
      <div className="dashboard-grid">

        {/* AI Chatbot */}
        <div className="glass-card ai-chatbot">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-brain" /> Fein AI Investment Assistant</h3>
            <button
              className="icon-btn"
              style={{ width: 28, height: 28, fontSize: 12 }}
              onClick={clearChat}
              title="Clear chat"
            >
              <i className="fa-solid fa-trash-can" />
            </button>
          </div>

          <div className="chat-history" id="chatHistory" ref={chatHistoryRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-bubble ${m.role}`}
                {...(m.role === 'assistant'
                  ? { dangerouslySetInnerHTML: { __html: m.text } }
                  : {
                      children: m.text.split('\n').map((line, j) => (
                        <span key={j}>
                          {line}
                          {j < m.text.split('\n').length - 1 && <br />}
                        </span>
                      ))
                    }
                )}
              />
            ))}
            {loading && (
              <div className="chat-bubble assistant">
                <i className="fa-solid fa-circle-notch spinner" style={{ marginRight: 8 }} />
                Thinking…
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              id="chatMsgInput"
              className="chat-msg-input"
              placeholder="Ask Fein AI about any asset or financial formula..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="btn-send" onClick={sendMessage} disabled={loading}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>

        {/* Right column: Calculator + Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <RiskCalculator balance={balance} />

          {/* Leaderboard */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-trophy" /> Elite Trader Leaderboard</h3>
            </div>
            <div className="leaderboard-list" id="leaderboardList">
              {LEADERBOARD.map(l => (
                <div key={l.rank} className="leader-item">
                  <div className="leader-rank-grp">
                    <div className={`leader-rank${l.rank <= 3 ? ` rank-${l.rank}` : ''}`}>{l.rank}</div>
                    <img
                      src={l.avatar}
                      alt={l.name}
                      className="leader-avatar"
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'var(--bullish-green)',
                  }}>
                    {l.roi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
