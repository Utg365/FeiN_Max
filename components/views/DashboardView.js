'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StockListItem({ asset, onClick }) {
  const isUp = asset.change >= 0;
  return (
    <div className="list-item" onClick={() => onClick(asset.symbol)}>
      <div className="stock-info">
        <div className="stock-logo">{asset.symbol.slice(0, 3)}</div>
        <div className="stock-name-grp">
          <span className="stock-symbol">{asset.symbol}</span>
          <span className="stock-name">{asset.name}</span>
        </div>
      </div>
      <div className="stock-stats">
        <span className="stock-price">{asset.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(asset.price)}</span>
        <span className={`stock-change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const {
    assets, watchlist, balance, portfolio, transactions,
    selectAsset, setActiveTab, addWatchlistSymbol, removeWatchlistSymbol,
    dashboardPeriod, setDashboardPeriod,
  } = useTrading();

  const perfChartRef = useRef(null);
  const perfChartInstance = useRef(null);

  // Filter assets by exchange
  const globalAssets = useMemo(() => assets.filter(a => a.exchange !== 'NEPSE'), [assets]);
  const nepseAssets = useMemo(() => assets.filter(a => a.exchange === 'NEPSE'), [assets]);

  // Top Gainers / Losers from global assets list
  const globalSorted = useMemo(() =>
    [...globalAssets].sort((a, b) => b.change - a.change), [globalAssets]);
  const topGainers = globalSorted.filter(a => a.change > 0).slice(0, 5);
  const topLosers  = [...globalSorted].reverse().filter(a => a.change < 0).slice(0, 5);

  // NEPSE movers
  const nepseSorted = useMemo(() =>
    [...nepseAssets].sort((a, b) => b.change - a.change), [nepseAssets]);
  const nepseGainers = nepseSorted.filter(a => a.change > 0).slice(0, 5);
  const nepseLosers  = [...nepseSorted].reverse().filter(a => a.change < 0).slice(0, 5);
  const nepseVolume  = useMemo(() =>
    [...nepseAssets].sort((a, b) => b.volume - a.volume).slice(0, 5), [nepseAssets]);

  // Watchlist enriched
  const watchlistAssets = watchlist.map(sym => assets.find(a => a.symbol === sym)).filter(Boolean);

  // Stats
  const totalTrades = transactions.length;
  const wins = transactions.filter((t, i, arr) => {
    if (t.action !== 'SELL') return false;
    const buyTx = arr.find(b => b.symbol === t.symbol && b.action === 'BUY');
    return buyTx && t.price > buyTx.price;
  }).length;
  const sellCount = transactions.filter(t => t.action === 'SELL').length;
  const winRate = sellCount > 0 ? ((wins / sellCount) * 100).toFixed(1) : '0.0';
  const totalProfits = transactions
    .filter(t => t.action === 'SELL')
    .reduce((acc, t) => acc + t.total, 0);

  // Build a simple performance line based on transaction history
  useEffect(() => {
    async function loadChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (!perfChartRef.current) return;

      if (perfChartInstance.current) {
        perfChartInstance.current.destroy();
      }

      // Build equity curve from transactions
      let equity = balance.initial || 100000;
      const points = [{ x: 'Start', y: equity }];
      const filtered = [...transactions].reverse();
      filtered.forEach(t => {
        if (t.action === 'BUY') equity -= t.total;
        else equity += t.total;
        points.push({ x: t.timestamp.split(',')[0], y: parseFloat(equity.toFixed(2)) });
      });
      points.push({ x: 'Now', y: balance.netLiq });

      const labels = points.map(p => p.x);
      const data   = points.map(p => p.y);
      const isProfit = data[data.length - 1] >= data[0];

      perfChartInstance.current = new Chart(perfChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Net Liquidation ($)',
            data,
            borderColor: isProfit ? '#00e676' : '#ff1744',
            backgroundColor: isProfit
              ? 'rgba(0,230,118,0.08)'
              : 'rgba(255,23,68,0.08)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.4,
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.03)' },
            },
            y: {
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: v => `$${(v / 1000).toFixed(0)}k`,
              },
              grid: { color: 'rgba(255,255,255,0.05)' },
            },
          },
        },
      });
    }
    loadChart();
    return () => { perfChartInstance.current?.destroy(); };
  }, [transactions, balance.netLiq, balance.initial, dashboardPeriod]);

  function handleAssetClick(symbol) {
    selectAsset(symbol);
    setActiveTab('trading');
  }

  function promptAddWatchlist() {
    const sym = window.prompt('Enter asset symbol (e.g. TSLA, BTCUSD):');
    if (sym) addWatchlistSymbol(sym.trim().toUpperCase());
  }

  return (
    <section className="page-view active">
      <div className="dashboard-grid">

        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Performance Chart */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-chart-line" /> Performance Analytics
              </h3>
              <div className="market-nav" style={{ border: 'none', padding: 0, gap: 6 }}>
                {['1W','1M','ALL'].map(p => (
                  <div
                    key={p}
                    className={`market-tab${dashboardPeriod === p ? ' active' : ''}`}
                    onClick={() => setDashboardPeriod(p)}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container-large">
              <canvas ref={perfChartRef} />
            </div>
          </div>

          {/* Top Movers */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-fire" /> Top Global Movers</h3>
              <span className="badge-ex">NYSE / NASDAQ / CRYPTO</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--bullish-green)', marginBottom: 12, fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-chevron-up" /> Top Gainers
                </h4>
                <div className="list-wrapper">
                  {topGainers.map(a => (
                    <StockListItem key={a.symbol} asset={a} onClick={handleAssetClick} />
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--bearish-red)', marginBottom: 12, fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-chevron-down" /> Top Losers
                </h4>
                <div className="list-wrapper">
                  {topLosers.map(a => (
                    <StockListItem key={a.symbol} asset={a} onClick={handleAssetClick} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NEPSE Market Movers */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-chart-line" /> NEPSE Market Movers</h3>
              <span className="badge-ex">NEPSE Stocks</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--bullish-green)', marginBottom: 12, fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-chevron-up" /> Top Gainers
                </h4>
                <div className="list-wrapper">
                  {nepseGainers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '10px 0' }}>No gainers today</p>
                  ) : (
                    nepseGainers.map(a => (
                      <StockListItem key={a.symbol} asset={a} onClick={handleAssetClick} />
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--bearish-red)', marginBottom: 12, fontWeight: 700 }}>
                  <i className="fa-solid fa-circle-chevron-down" /> Top Losers
                </h4>
                <div className="list-wrapper">
                  {nepseLosers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '10px 0' }}>No losers today</p>
                  ) : (
                    nepseLosers.map(a => (
                      <StockListItem key={a.symbol} asset={a} onClick={handleAssetClick} />
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, color: 'var(--neon-blue)', marginBottom: 12, fontWeight: 700 }}>
                  <i className="fa-solid fa-cubes" /> Top Volume
                </h4>
                <div className="list-wrapper">
                  {nepseVolume.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '10px 0' }}>No volume data</p>
                  ) : (
                    nepseVolume.map(a => (
                      <StockListItem key={a.symbol} asset={a} onClick={handleAssetClick} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Watchlist */}
          <div className="glass-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-eye" /> Watchlist</h3>
              <button
                className="icon-btn"
                style={{ width: 28, height: 28, fontSize: 12 }}
                onClick={promptAddWatchlist}
                title="Add symbol"
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>
            <div className="list-wrapper">
              {watchlistAssets.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Watchlist is empty. Add symbols to track.
                </p>
              )}
              {watchlistAssets.map(a => (
                <div key={a.symbol} className="list-item" onClick={() => handleAssetClick(a.symbol)}>
                  <div className="stock-info">
                    <div className="stock-logo">{a.symbol.slice(0, 3)}</div>
                    <div className="stock-name-grp">
                      <span className="stock-symbol">{a.symbol}</span>
                      <span className="stock-name">{a.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="stock-stats">
                      <span className="stock-price">{a.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(a.price)}</span>
                      <span className={`stock-change ${a.change >= 0 ? 'up' : 'down'}`}>
                        {a.change >= 0 ? '+' : ''}{a.change.toFixed(2)}%
                      </span>
                    </div>
                    <button
                      style={{
                        background: 'none', border: 'none', color: 'var(--bearish-red)',
                        cursor: 'pointer', fontSize: 12, padding: 4, flexShrink: 0,
                      }}
                      onClick={e => { e.stopPropagation(); removeWatchlistSymbol(a.symbol); }}
                      title="Remove from watchlist"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Metrics */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-circle-info" /> Virtual Account Metrics</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Trading Leverage', value: '1:1 (Cash Account)', color: '' },
                { label: 'Total Trades Executed', value: totalTrades, color: 'var(--neon-blue)' },
                { label: 'Win Rate', value: `${winRate}%`, color: 'var(--bullish-green)' },
                { label: 'Total Profits Generated', value: `$${fmt(totalProfits)}`, color: 'var(--bullish-green)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color || 'var(--text-primary)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
