'use client';

import { useState, useRef, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';

export default function TopBar() {
  const {
    assets, balance, user,
    setActiveTab, selectAsset,
    volumeMuted, toggleMute,
    logout, triggerNotification,
  } = useTrading();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const dropdownRef = useRef(null);

  const pnl = balance.unrealizedPnL;
  const pnlPct = balance.unrealizedPnLPct;
  const pnlClass = pnl >= 0 ? 'profit' : 'loss';
  const pnlSign = pnl >= 0 ? '+' : '';

  function fmt(n, decimals = 2) {
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function handleSearch(e) {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    const filtered = assets.filter(a =>
      a.symbol.toLowerCase().includes(lower) || a.name.toLowerCase().includes(lower)
    ).slice(0, 8);
    setResults(filtered);
  }

  function pickAsset(asset) {
    selectAsset(asset.symbol);
    setActiveTab('trading');
    setSearchQuery('');
    setResults([]);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setResults([]);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="top-bar">
      {/* Search */}
      <div className="search-container" ref={dropdownRef}>
        <i className="fa-solid fa-search search-icon" />
        <input
          type="text"
          id="symbolSearchInput"
          className="search-input"
          placeholder="Search Stocks, Crypto, Forex..."
          value={searchQuery}
          onChange={handleSearch}
          autoComplete="off"
        />
        {results.length > 0 && (
          <div className="autocomplete-dropdown">
            {results.map(a => (
              <div key={a.symbol} className="autocomplete-item" onClick={() => pickAsset(a)}>
                <span className="autocomplete-symbol">{a.symbol}</span>
                <span className="autocomplete-name">{a.name}</span>
                <span className="autocomplete-exchange">{a.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="portfolio-quick-stats">
        <div className="live-indicator">
          <span className="live-pulse" />
          <span className="live-label">LIVE FEED</span>
        </div>

        <div className="quick-stat">
          <span className="quick-stat-label">Net Liquidation</span>
          <span className="quick-stat-value neon-glow">${fmt(balance.netLiq)}</span>
        </div>

        <div className="quick-stat">
          <span className="quick-stat-label">Unrealized P&L</span>
          <span className={`quick-stat-value ${pnlClass}`}>
            {pnlSign}${fmt(pnl)} ({pnlSign}{fmt(pnlPct)}%)
          </span>
        </div>

        <div className="quick-stat">
          <span className="quick-stat-label">Available Cash</span>
          <span className="quick-stat-value">${fmt(balance.cash)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="top-bar-actions">
        <button
          className="icon-btn"
          onClick={toggleMute}
          title={volumeMuted ? 'Unmute' : 'Mute'}
          aria-label="Toggle sound"
        >
          <i className={`fa-solid ${volumeMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
        </button>

        <button
          className="icon-btn"
          onClick={() => triggerNotification('Terminal connected. All systems operational.', 'success')}
          title="Notifications"
          aria-label="Notifications"
        >
          <i className="fa-solid fa-bell" />
          <span className="btn-badge">1</span>
        </button>

        {user.isLoggedIn ? (
          <button className="icon-btn" onClick={logout} title="Logout" aria-label="Logout">
            <i className="fa-solid fa-sign-out-alt" />
          </button>
        ) : (
          <button className="icon-btn" onClick={() => setActiveTab('login')} title="Login" aria-label="Login">
            <i className="fa-solid fa-right-to-bracket" />
          </button>
        )}
      </div>
    </header>
  );
}
