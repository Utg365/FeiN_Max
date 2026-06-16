'use client';

import { useState, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';

const TABS = ['ALL','NEPSE','STOCKS','CRYPTO','FOREX'];

function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(2);
  return n.toFixed(4);
}

export default function MarketsView() {
  const { assets, selectAsset, setActiveTab } = useTrading();
  const [activeMarket, setActiveMarket] = useState('ALL');
  const [filterText, setFilterText] = useState('');

  const filtered = useMemo(() => {
    let list = assets;
    if (activeMarket !== 'ALL') {
      list = list.filter(a => a.category === activeMarket || a.exchange === activeMarket);
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(a =>
        a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assets, activeMarket, filterText]);

  function handleTrade(symbol) {
    selectAsset(symbol);
    setActiveTab('trading');
  }

  return (
    <section className="page-view active">
      <div className="glass-card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3 className="card-title"><i className="fa-solid fa-globe" /> Global Market Explorer</h3>
          <div className="market-nav" style={{ border: 'none', padding: 0, flexWrap: 'wrap' }} id="marketsAssetTabs">
            {TABS.map(tab => (
              <div
                key={tab}
                className={`market-tab${activeMarket === tab ? ' active' : ''}`}
                onClick={() => setActiveMarket(tab)}
              >
                {tab === 'ALL' ? 'All Markets'
                  : tab === 'NEPSE' ? 'NEPSE'
                  : tab === 'STOCKS' ? 'Intl Equities'
                  : tab === 'CRYPTO' ? 'Cryptocurrency'
                  : 'Forex'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            id="marketFilterInput"
            className="search-input"
            style={{ width: '100%', borderRadius: 10, paddingLeft: 16 }}
            placeholder="Filter assets by name or symbol..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Exchange</th>
                <th>Last Price</th>
                <th>Change (24h)</th>
                <th>Volatility</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="marketsTableBody">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                    No assets found.
                  </td>
                </tr>
              )}
              {filtered.map(asset => {
                const isUp = asset.change >= 0;
                const volPct = Math.min(Math.abs(asset.volatility || 1) * 5, 100);
                return (
                  <tr key={asset.symbol}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="stock-logo" style={{ width: 30, height: 30, fontSize: 10 }}>
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{asset.symbol}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-ex">{asset.exchange}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                        {asset.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(asset.price)}
                      </span>
                    </td>
                    <td>
                      <span className={isUp ? 'text-profit' : 'text-loss'}>
                        <i className={`fa-solid ${isUp ? 'fa-caret-up' : 'fa-caret-down'}`} />{' '}
                        {isUp ? '+' : ''}{asset.change.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <div style={{ minWidth: 80 }}>
                        <div className="vol-bar-track">
                          <div className="vol-bar-fill" style={{ width: `${volPct}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {asset.volatility?.toFixed(1) || '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleTrade(asset.symbol)}
                        style={{
                          background: 'rgba(0,242,254,0.1)',
                          border: '1px solid rgba(0,242,254,0.25)',
                          color: 'var(--neon-blue)',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-heading)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,242,254,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,242,254,0.1)'}
                      >
                        TRADE
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
