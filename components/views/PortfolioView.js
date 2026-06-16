'use client';

import { useEffect, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';

function fmt(n, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function PortfolioView() {
  const { assets, portfolio, balance, liquidatePosition, setActiveTab } = useTrading();
  const allocChartRef = useRef(null);
  const allocChartInst = useRef(null);

  const holdings = Object.entries(portfolio).map(([symbol, h]) => {
    const asset = assets.find(a => a.symbol === symbol);
    const livePrice = asset ? asset.price : h.avgPrice;
    const liveValue = h.qty * livePrice;
    const costBasis = h.qty * h.avgPrice;
    const pnl = liveValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { symbol, ...h, livePrice, liveValue, costBasis, pnl, pnlPct };
  });

  const totalCost  = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalValue = holdings.reduce((s, h) => s + h.liveValue, 0);

  // Allocation Chart
  useEffect(() => {
    async function loadChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (!allocChartRef.current) return;
      allocChartInst.current?.destroy();

      if (holdings.length === 0) return;

      const palette = [
        '#00f2fe','#4facfe','#7f00ff','#00e676','#ff1744',
        '#ffd700','#ff6d00','#d500f9','#00b0ff','#76ff03',
      ];

      allocChartInst.current = new Chart(allocChartRef.current, {
        type: 'doughnut',
        data: {
          labels: holdings.map(h => h.symbol),
          datasets: [{
            data: holdings.map(h => h.liveValue.toFixed(2)),
            backgroundColor: holdings.map((_, i) => palette[i % palette.length] + '99'),
            borderColor: holdings.map((_, i) => palette[i % palette.length]),
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#94a3b8',
                font: { size: 11 },
                padding: 12,
              },
            },
            tooltip: {
              callbacks: {
                label: ctx => ` $${fmt(Number(ctx.parsed))} (${((ctx.parsed / totalValue) * 100).toFixed(1)}%)`,
              },
            },
          },
        },
      });
    }
    loadChart();
    return () => allocChartInst.current?.destroy();
  }, [portfolio, assets]);

  return (
    <section className="page-view active">
      <div className="dashboard-grid">

        {/* Allocation Pie */}
        <div className="glass-card" style={{ gridColumn: 'span 1' }}>
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-chart-pie" /> Asset Allocation</h3>
          </div>
          {holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-chart-pie" style={{ fontSize: 40, opacity: 0.2, marginBottom: 12, display: 'block' }} />
              No holdings yet. Go to Paper Trading to start.
            </div>
          ) : (
            <div style={{ height: 280, position: 'relative' }}>
              <canvas ref={allocChartRef} />
            </div>
          )}
        </div>

        {/* Holdings Table */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-briefcase" /> Holdings Analysis</h3>
            <button
              className="btn-execute buy"
              style={{ width: 'auto', padding: '6px 12px', marginTop: 0, fontSize: 11 }}
              onClick={() => setActiveTab('trading')}
            >
              Open Order Terminal
            </button>
          </div>

          {/* Summary Row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            {[
              { label: 'Holdings Cost',  value: `$${fmt(totalCost)}`,  color: '' },
              { label: 'Current Value',  value: `$${fmt(totalValue)}`, color: 'var(--neon-blue)' },
              { label: 'Available Cash', value: `$${fmt(balance.cash)}`, color: '' },
              { label: 'Total P&L',
                value: `${balance.unrealizedPnL >= 0 ? '+' : ''}$${fmt(balance.unrealizedPnL)}`,
                color: balance.unrealizedPnL >= 0 ? 'var(--bullish-green)' : 'var(--bearish-red)',
              },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color || 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Avg Cost</th>
                  <th>Live Price</th>
                  <th>Shares</th>
                  <th>Total Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                      Your portfolio is empty.
                    </td>
                  </tr>
                )}
                {holdings.map(h => (
                  <tr key={h.symbol}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="stock-logo" style={{ width: 28, height: 28, fontSize: 9 }}>
                          {h.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{h.symbol}</div>
                          <span className="badge-ex">{h.exchange}</span>
                        </div>
                      </div>
                    </td>
                     <td>{h.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(h.avgPrice)}</td>
                     <td>{h.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(h.livePrice)}</td>
                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                      {h.qty % 1 === 0 ? h.qty : h.qty.toFixed(4)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: h.pnl >= 0 ? 'var(--bullish-green)' : 'var(--bearish-red)' }}>
                         {h.pnl >= 0 ? '+' : '-'}{h.exchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(Math.abs(h.pnl))}
                      </div>
                      <div style={{ fontSize: 10, color: h.pnl >= 0 ? 'var(--bullish-green)' : 'var(--bearish-red)' }}>
                        ({h.pnl >= 0 ? '+' : ''}{fmt(h.pnlPct)}%)
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => liquidatePosition(h.symbol)}
                        style={{
                          background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)',
                          color: 'var(--bearish-red)', borderRadius: 6, padding: '6px 10px',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-heading)',
                        }}
                      >
                        SELL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
