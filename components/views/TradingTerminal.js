'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTrading } from '../../context/TradingContext';

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Chart type configs ─────────────────────────────────────────────────────
const CHART_TYPES = [
  { key: 'candlestick', label: '🕯 Candle' },
  { key: 'bar',         label: '▤ Bar'    },
  { key: 'line',        label: '╱ Line'   },
  { key: 'area',        label: '◭ Area'   },
];

// ── Lightweight Charts theme ───────────────────────────────────────────────
const CHART_OPTIONS = {
  layout: {
    background: { color: 'transparent' },
    textColor: '#64748b',
    fontSize: 11,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.03)' },
    horzLines: { color: 'rgba(255,255,255,0.04)' },
  },
  crosshair: {
    mode: 1, // CrosshairMode.Magnet
    vertLine: { color: 'rgba(0,242,254,0.4)', labelBackgroundColor: '#0a0d1e' },
    horzLine: { color: 'rgba(0,242,254,0.4)', labelBackgroundColor: '#0a0d1e' },
  },
  rightPriceScale: {
    borderColor: 'rgba(0,242,254,0.1)',
    textColor: '#64748b',
  },
  timeScale: {
    borderColor: 'rgba(0,242,254,0.1)',
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 5,
  },
  handleScroll: true,
  handleScale: true,
};

// ── NEPSE Chart component ──────────────────────────────────────────────────
function NepseChart({ symbol, livePrice }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const mainSeriesRef   = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [chartType, setChartType]   = useState('candlestick');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [rawData, setRawData]       = useState([]);
  const [stats, setStats]           = useState(null);

  // Indicators state
  const [showSMA20, setShowSMA20]   = useState(false);
  const [showSMA50, setShowSMA50]   = useState(false);
  const [showBB, setShowBB]         = useState(false);
  const [hoverData, setHoverData]   = useState(null);

  // Helper formats
  function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Indicator mathematical helpers
  function computeSMAValues(closes, period) {
    const values = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        values.push(null);
      } else {
        const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        values.push(sum / period);
      }
    }
    return values;
  }

  function computeBBValues(closes, period = 20) {
    const upper = [];
    const middle = [];
    const lower = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
        continue;
      }
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + 2 * stdDev);
      middle.push(mean);
      lower.push(mean - 2 * stdDev);
    }
    return { upper, middle, lower };
  }

  // Memoize data with indicators for quick lookup
  const dataWithIndicators = useMemo(() => {
    if (rawData.length === 0) return [];
    const closes = rawData.map(r => r.close || r.ltp || 0);
    const sma20Values = computeSMAValues(closes, 20);
    const sma50Values = computeSMAValues(closes, 50);
    const bbValues = computeBBValues(closes, 20);

    return rawData.map((r, i) => ({
      ...r,
      sma20: sma20Values[i],
      sma50: sma50Values[i],
      bbUpper: bbValues.upper[i],
      bbBasis: bbValues.middle[i],
      bbLower: bbValues.lower[i],
    }));
  }, [rawData]);

  // Fetch historical data from Supabase (via backend proxy)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/nepse/history/${symbol}`);
        if (cancelled) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        if (Array.isArray(json) && json.length > 0) {
          setRawData(json);
          const last = json[json.length - 1];
          const prev = json[json.length - 2];
          const latestStats = {
            ltp:    last.ltp   ?? last.close ?? 0,
            open:   last.open  ?? 0,
            high:   last.high  ?? 0,
            low:    last.low   ?? 0,
            volume: last.volume ?? 0,
            change: prev ? ((last.close - prev.close) / prev.close) * 100 : 0,
          };
          setStats(latestStats);
          setHoverData({
            open: latestStats.open,
            high: latestStats.high,
            low: latestStats.low,
            close: latestStats.ltp,
            volume: latestStats.volume,
            change: latestStats.change,
            date: last.date,
          });
        } else {
          // Fallback: generate plausible mock candles
          const base = livePrice || 350;
          const mocked = [];
          const now = new Date();
          for (let i = 60; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const day = d.getDay();
            if (day === 5 || day === 6) continue; // skip Fri/Sat (NEPSE off)
            const drift  = (Math.random() - 0.48) * base * 0.012;
            const open   = parseFloat((base + drift).toFixed(2));
            const close  = parseFloat((open + (Math.random() - 0.48) * open * 0.02).toFixed(2));
            const high   = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.01)).toFixed(2));
            const low    = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.01)).toFixed(2));
            mocked.push({
              date:   d.toISOString().split('T')[0],
              open, high, low, close,
              ltp:    close,
              volume: Math.floor(Math.random() * 50000 + 5000),
            });
          }
          setRawData(mocked);
          setStats(null);
          if (mocked.length > 0) {
            const last = mocked[mocked.length - 1];
            setHoverData({
              open: last.open,
              high: last.high,
              low: last.low,
              close: last.close,
              volume: last.volume,
              change: 0,
              date: last.date,
            });
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [symbol, livePrice]);

  // Build / rebuild chart when data, chartType, or indicators change
  useEffect(() => {
    if (!containerRef.current || dataWithIndicators.length === 0) return;

    let destroyed = false;

    async function buildChart() {
      const { createChart, CandlestickSeries, BarSeries, LineSeries, AreaSeries, HistogramSeries, LineStyle } =
        await import('lightweight-charts');
      if (destroyed) return;

      // Destroy previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      // Create fresh chart
      const chart = createChart(containerRef.current, {
        ...CHART_OPTIONS,
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.Dotted },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: LineStyle.Dotted },
        },
        watermark: {
          visible: true,
          fontSize: 64,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 'bold',
          color: 'rgba(0, 242, 254, 0.035)',
          text: symbol.toUpperCase(),
          horzAlign: 'center',
          vertAlign: 'center',
        },
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      chartRef.current = chart;

      // ── Price series ─────────────────────────────────────────────────────
      let priceSeries;

      if (chartType === 'candlestick') {
        priceSeries = chart.addSeries(CandlestickSeries, {
          upColor:          '#00e676',
          downColor:        '#ff1744',
          borderUpColor:    '#00e676',
          borderDownColor:  '#ff1744',
          wickUpColor:      'rgba(0,230,118,0.7)',
          wickDownColor:    'rgba(255,23,68,0.7)',
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });
        const candleData = dataWithIndicators.map(r => ({
          time:  r.date,
          open:  r.open  || r.ltp || 0,
          high:  r.high  || r.ltp || 0,
          low:   r.low   || r.ltp || 0,
          close: r.close || r.ltp || 0,
        }));
        priceSeries.setData(candleData);

      } else if (chartType === 'bar') {
        priceSeries = chart.addSeries(BarSeries, {
          upColor:   '#00e676',
          downColor: '#ff1744',
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });
        priceSeries.setData(dataWithIndicators.map(r => ({
          time:  r.date,
          open:  r.open  || r.ltp || 0,
          high:  r.high  || r.ltp || 0,
          low:   r.low   || r.ltp || 0,
          close: r.close || r.ltp || 0,
        })));

      } else if (chartType === 'line') {
        priceSeries = chart.addSeries(LineSeries, {
          color:     '#00f2fe',
          lineWidth: 2,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });
        priceSeries.setData(dataWithIndicators.map(r => ({
          time:  r.date,
          value: r.close || r.ltp || 0,
        })));

      } else { // area
        priceSeries = chart.addSeries(AreaSeries, {
          lineColor:    '#00f2fe',
          topColor:     'rgba(0,242,254,0.25)',
          bottomColor:  'rgba(0,242,254,0.0)',
          lineWidth: 2,
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });
        priceSeries.setData(dataWithIndicators.map(r => ({
          time:  r.date,
          value: r.close || r.ltp || 0,
        })));
      }

      mainSeriesRef.current = priceSeries;

      // ── SMA 20 Overlay ──────────────────────────────────────────────────
      if (showSMA20) {
        const sma20Data = dataWithIndicators
          .filter(r => r.sma20 !== null)
          .map(r => ({ time: r.date, value: r.sma20 }));
        if (sma20Data.length > 0) {
          const sma20Series = chart.addSeries(LineSeries, {
            color: '#2196f3',
            lineWidth: 1.5,
            title: 'SMA 20',
          });
          sma20Series.setData(sma20Data);
        }
      }

      // ── SMA 50 Overlay ──────────────────────────────────────────────────
      if (showSMA50) {
        const sma50Data = dataWithIndicators
          .filter(r => r.sma50 !== null)
          .map(r => ({ time: r.date, value: r.sma50 }));
        if (sma50Data.length > 0) {
          const sma50Series = chart.addSeries(LineSeries, {
            color: '#ffb74d',
            lineWidth: 1.5,
            title: 'SMA 50',
          });
          sma50Series.setData(sma50Data);
        }
      }

      // ── Bollinger Bands Overlay ─────────────────────────────────────────
      if (showBB) {
        const bbUpperData = dataWithIndicators
          .filter(r => r.bbUpper !== null)
          .map(r => ({ time: r.date, value: r.bbUpper }));
        const bbBasisData = dataWithIndicators
          .filter(r => r.bbBasis !== null)
          .map(r => ({ time: r.date, value: r.bbBasis }));
        const bbLowerData = dataWithIndicators
          .filter(r => r.bbLower !== null)
          .map(r => ({ time: r.date, value: r.bbLower }));

        if (bbBasisData.length > 0) {
          const upperSeries = chart.addSeries(LineSeries, {
            color: 'rgba(233, 30, 99, 0.45)',
            lineWidth: 1,
            title: 'BB Upper',
          });
          const middleSeries = chart.addSeries(LineSeries, {
            color: 'rgba(255, 255, 255, 0.25)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: 'BB Basis',
          });
          const lowerSeries = chart.addSeries(LineSeries, {
            color: 'rgba(233, 30, 99, 0.45)',
            lineWidth: 1,
            title: 'BB Lower',
          });
          upperSeries.setData(bbUpperData);
          middleSeries.setData(bbBasisData);
          lowerSeries.setData(bbLowerData);
        }
      }

      // ── Volume series (always shown as histogram below) ──────────────────
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color:          'rgba(0,242,254,0.18)',
        priceFormat:    { type: 'volume' },
        priceScaleId:   'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.80, bottom: 0 },
        borderVisible: false,
      });
      priceSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.05, bottom: 0.22 },
      });

      volumeSeries.setData(dataWithIndicators.map(r => {
        const isUp = (r.close || 0) >= (r.open || 0);
        return {
          time:  r.date,
          value: r.volume || 0,
          color: isUp ? 'rgba(0,230,118,0.25)' : 'rgba(255,23,68,0.25)',
        };
      }));
      volumeSeriesRef.current = volumeSeries;

      // Subscribe to Crosshair hover info to update Legend
      chart.subscribeCrosshairMove(param => {
        if (destroyed) return;
        if (param.time) {
          const dataPoint = dataWithIndicators.find(r => r.date === param.time);
          if (dataPoint) {
            const idx = dataWithIndicators.indexOf(dataPoint);
            const prev = idx > 0 ? dataWithIndicators[idx - 1] : null;
            setHoverData({
              open: dataPoint.open || dataPoint.ltp || 0,
              high: dataPoint.high || dataPoint.ltp || 0,
              low: dataPoint.low || dataPoint.ltp || 0,
              close: dataPoint.close || dataPoint.ltp || 0,
              volume: dataPoint.volume || 0,
              change: prev ? ((dataPoint.close - prev.close) / prev.close) * 100 : 0,
              sma20: dataPoint.sma20,
              sma50: dataPoint.sma50,
              bbUpper: dataPoint.bbUpper,
              bbBasis: dataPoint.bbBasis,
              bbLower: dataPoint.bbLower,
              date: dataPoint.date
            });
          }
        } else {
          // Fallback to latest statistics
          if (dataWithIndicators.length > 0) {
            const last = dataWithIndicators[dataWithIndicators.length - 1];
            const prev = dataWithIndicators[dataWithIndicators.length - 2];
            setHoverData({
              open: last.open || last.close || 0,
              high: last.high || last.close || 0,
              low: last.low || last.close || 0,
              close: last.close || 0,
              volume: last.volume || 0,
              change: prev ? ((last.close - prev.close) / prev.close) * 100 : 0,
              sma20: last.sma20,
              sma50: last.sma50,
              bbUpper: last.bbUpper,
              bbBasis: last.bbBasis,
              bbLower: last.bbLower,
              date: last.date
            });
          }
        }
      });

      // Show recent 150 bars to make candlesticks readable
      const totalCandles = dataWithIndicators.length;
      if (totalCandles > 150) {
        chart.timeScale().setVisibleLogicalRange({
          from: totalCandles - 150,
          to: totalCandles + 5,
        });
      } else {
        chart.timeScale().fitContent();
      }

      // Responsive resize
      const ro = new ResizeObserver(() => {
        if (destroyed) return;
        chart.applyOptions({
          width:  containerRef.current?.clientWidth  || 0,
          height: containerRef.current?.clientHeight || 0,
        });
      });
      if (containerRef.current) ro.observe(containerRef.current);

      return () => { ro.disconnect(); };
    }

    const cleanup = buildChart();
    return () => {
      destroyed = true;
      cleanup?.then?.(fn => fn?.());
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch (_) {}
        chartRef.current = null;
      }
    };
  }, [dataWithIndicators, chartType, showSMA20, showSMA50, showBB]);

  const activeStats = hoverData || stats;
  const isUp = (activeStats?.change ?? 0) >= 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Toolbar ── */}
      <div className="nepse-chart-toolbar">
        {/* Symbol + live stats */}
        <div className="nepse-chart-info">
          <span className="nepse-chart-symbol">{symbol}</span>
          {activeStats && (
            <>
              <span className="nepse-stat">O <b>{fmt(activeStats.open)}</b></span>
              <span className="nepse-stat">H <b style={{ color: '#00e676' }}>{fmt(activeStats.high)}</b></span>
              <span className="nepse-stat">L <b style={{ color: '#ff1744' }}>{fmt(activeStats.low)}</b></span>
              <span className="nepse-stat">C <b style={{ color: '#00f2fe' }}>{fmt(activeStats.close || activeStats.ltp)}</b></span>
              <span className="nepse-stat">
                Vol <b>{activeStats.volume >= 1000 ? `${(activeStats.volume / 1000).toFixed(1)}K` : activeStats.volume}</b>
              </span>
              <span className={`nepse-change-badge ${isUp ? 'up' : 'down'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(activeStats.change).toFixed(2)}%
              </span>
            </>
          )}
          {!activeStats && !loading && (
            <span className="nepse-stat" style={{ color: '#64748b', fontSize: 10 }}>
              ⚠ No data in DB — showing simulated candles
            </span>
          )}
        </div>

        {/* Indicators Selector & Chart type switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Indicators toggles */}
          <div className="nepse-chart-types" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 12 }}>
            <button
              className={`chart-type-btn ${showSMA20 ? 'active' : ''}`}
              onClick={() => setShowSMA20(p => !p)}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              SMA 20
            </button>
            <button
              className={`chart-type-btn ${showSMA50 ? 'active' : ''}`}
              onClick={() => setShowSMA50(p => !p)}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              SMA 50
            </button>
            <button
              className={`chart-type-btn ${showBB ? 'active' : ''}`}
              onClick={() => setShowBB(p => !p)}
              style={{ fontSize: 11, padding: '3px 8px' }}
            >
              Bands
            </button>
          </div>

          {/* Chart type switcher */}
          <div className="nepse-chart-types">
            {CHART_TYPES.map(t => (
              <button
                key={t.key}
                className={`chart-type-btn ${chartType === t.key ? 'active' : ''}`}
                onClick={() => setChartType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chart canvas ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
        {loading && (
          <div className="chart-loading" style={{ zIndex: 20 }}>
            <div className="chart-spinner" />
            <span>Loading historical data…</span>
          </div>
        )}
        {error && !loading && (
          <div className="chart-loading" style={{ zIndex: 20 }}>
            <span style={{ color: '#ff1744' }}>⚠ {error}</span>
          </div>
        )}
        
        {/* Dynamic Indicator Legend Overlay (TradingView style) */}
        {!loading && !error && (showSMA20 || showSMA50 || showBB) && (
          <div className="chart-indicators-legend" style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            pointerEvents: 'none',
            fontSize: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontFamily: 'monospace',
            backgroundColor: 'rgba(6, 8, 20, 0.65)',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {showSMA20 && (
              <span style={{ color: '#2196f3' }}>
                SMA 20: {activeStats?.sma20 ? activeStats.sma20.toFixed(2) : '—'}
              </span>
            )}
            {showSMA50 && (
              <span style={{ color: '#ffb74d' }}>
                SMA 50: {activeStats?.sma50 ? activeStats.sma50.toFixed(2) : '—'}
              </span>
            )}
            {showBB && (
              <span style={{ color: 'rgba(233, 30, 99, 0.85)' }}>
                BB(20, 2): {activeStats?.bbUpper ? `${activeStats.bbUpper.toFixed(2)} | ${activeStats.bbBasis.toFixed(2)} | ${activeStats.bbLower.toFixed(2)}` : '—'}
              </span>
            )}
          </div>
        )}

        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

// ── Main TradingTerminal ───────────────────────────────────────────────────
export default function TradingTerminal() {
  const {
    assets, balance, portfolio,
    activeSymbol, activeExchange, activeOrderSide, activeOrderType,
    setActiveOrderSide, setActiveOrderType,
    executeOrder, getEstimatedCost, getMaxBuyShares,
  } = useTrading();

  const [qty, setQty]               = useState('10');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss]     = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [prediction, setPrediction] = useState({ direction: 'Neutral', pct: 50 });

  const tvContainerRef = useRef(null);
  const tvWidgetRef    = useRef(null);

  const currentAsset = assets.find(a => a.symbol === activeSymbol);
  const livePrice    = currentAsset?.price ?? 0;

  // Load TradingView widget (non-NEPSE exchanges)
  useEffect(() => {
    if (activeExchange === 'NEPSE') return;
    if (!tvContainerRef.current) return;
    tvContainerRef.current.innerHTML = '';

    const tvSymbol = activeExchange === 'NSE'
        ? `NSE:${activeSymbol}`
        : activeExchange === 'CRYPTO'
          ? `BINANCE:${activeSymbol.replace('USD', 'USDT')}`
          : activeExchange === 'FOREX'
            ? `FX_IDC:${activeSymbol.replace('USD', '')}`
            : `NASDAQ:${activeSymbol}`;

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.width  = '100%';
    container.style.height = '100%';

    const widget = document.createElement('div');
    widget.id = 'tv_chart_widget';
    widget.style.width  = '100%';
    widget.style.height = '100%';
    container.appendChild(widget);

    const script = document.createElement('script');
    script.type   = 'text/javascript';
    script.src    = 'https://s3.tradingview.com/tv.js';
    script.async  = true;
    script.onload = () => {
      if (typeof TradingView === 'undefined') return;
      tvWidgetRef.current = new TradingView.widget({
        width:  '100%',
        height: '100%',
        symbol: tvSymbol,
        interval: 'D',
        timezone: 'Asia/Katmandu',
        theme:  'dark',
        style:  '1',
        locale: 'en',
        toolbar_bg:        '#060814',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tv_chart_widget',
        hide_side_toolbar: false,
      });
    };

    tvContainerRef.current.appendChild(container);
    tvContainerRef.current.appendChild(script);

    return () => {
      if (tvWidgetRef.current && tvWidgetRef.current.remove) {
        try { tvWidgetRef.current.remove(); } catch (_) {}
      }
    };
  }, [activeSymbol, activeExchange]);

  // Fetch AI prediction
  useEffect(() => {
    async function fetchPrediction() {
      try {
        const res = await fetch(`/api/predictions/${activeSymbol}`);
        if (res.ok) {
          const data = await res.json();
          setPrediction(data);
        }
      } catch (_) {}
    }
    fetchPrediction();
  }, [activeSymbol]);

  const estimatedCost = getEstimatedCost(qty, limitPrice);
  const holding       = portfolio[activeSymbol];

  function handleQtyPercent(pct) {
    const shares = getMaxBuyShares(pct, limitPrice);
    setQty(String(shares));
  }

  function handleExecute() {
    executeOrder(qty, limitPrice);
  }

  const isBuy = activeOrderSide === 'BUY';

  return (
    <section className="page-view active">
      <div className="trading-layout">

        {/* ── Chart Panel ── */}
        <div className="tv-chart-box glass-card" style={{ padding: 0, position: 'relative', overflow: 'hidden' }}>
          {activeExchange === 'NEPSE' ? (
            <div style={{ width: '100%', height: '100%', padding: '12px 16px 16px' }}>
              <NepseChart symbol={activeSymbol} livePrice={livePrice} />
            </div>
          ) : (
            <div ref={tvContainerRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {/* ── Order Ticket ── */}
        <div className="glass-card order-ticket">
          <div className="card-header">
            <h3 className="card-title" id="orderTicketSymbol">
              <i className="fa-solid fa-receipt" /> Trade Ticket: {activeSymbol}
            </h3>
            <span className="badge-ex" id="orderTicketExchange">{activeExchange}</span>
          </div>

          {/* Live Price */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: 'var(--neon-blue)', textShadow: '0 0 10px rgba(0,242,254,0.4)' }}>
              {activeExchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(livePrice)}
            </span>
          </div>

          {/* Buy / Sell Tabs */}
          <div className="order-tabs">
            <div id="btnTabBuy"  className={`order-tab buy${isBuy ? ' active' : ''}`}  onClick={() => setActiveOrderSide('BUY')}>BUY</div>
            <div id="btnTabSell" className={`order-tab sell${!isBuy ? ' active' : ''}`} onClick={() => setActiveOrderSide('SELL')}>SELL</div>
          </div>

          {/* Market / Limit */}
          <div className="order-type-select">
            <div id="btnTypeMarket" className={`order-type-btn${activeOrderType === 'MARKET' ? ' active' : ''}`} onClick={() => setActiveOrderType('MARKET')}>MARKET</div>
            <div id="btnTypeLimit"  className={`order-type-btn${activeOrderType === 'LIMIT'  ? ' active' : ''}`} onClick={() => setActiveOrderType('LIMIT')}>LIMIT</div>
          </div>

          {/* Quantity */}
          <div className="input-grp">
            <label htmlFor="orderQtyInput">Quantity</label>
            <div className="input-with-suffix">
              <input
                type="number" id="orderQtyInput" min="0" step="any"
                value={qty} onChange={e => setQty(e.target.value)}
              />
              <span className="input-suffix">SHARES</span>
            </div>
            <div className="percent-slider">
              {[10, 25, 50, 100].map(p => (
                <div key={p} className="percent-pill" onClick={() => handleQtyPercent(p)}>{p}%</div>
              ))}
            </div>
          </div>

          {/* Limit Price */}
          {activeOrderType === 'LIMIT' && (
            <div className="input-grp" id="limitPriceGroup">
              <label htmlFor="orderPriceInput">Limit Price ({activeExchange === 'NEPSE' ? 'Rs.' : '$'})</label>
              <div className="input-with-suffix">
                <input
                  type="number" id="orderPriceInput" step="0.01"
                  value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                  placeholder={livePrice.toFixed(2)}
                />
              </div>
            </div>
          )}

          {/* Stop / TP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-grp">
              <label htmlFor="orderStopLoss">Stop Loss ({activeExchange === 'NEPSE' ? 'Rs.' : '$'})</label>
              <div className="input-with-suffix">
                <input type="number" id="orderStopLoss" placeholder="None" step="0.01" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
              </div>
            </div>
            <div className="input-grp">
              <label htmlFor="orderTakeProfit">Take Profit ({activeExchange === 'NEPSE' ? 'Rs.' : '$'})</label>
              <div className="input-with-suffix">
                <input type="number" id="orderTakeProfit" placeholder="None" step="0.01" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="estimated-cost">
            <span style={{ color: 'var(--text-secondary)' }}>Estimated Cost</span>
            <span id="lblEstimatedCost" style={{ fontWeight: 700, color: 'var(--neon-blue)', fontFamily: 'var(--font-heading)' }}>
              {activeExchange === 'NEPSE' ? 'Rs. ' : '$'}{fmt(estimatedCost)}
            </span>
          </div>
          <div className="estimated-cost" style={{ border: 'none', paddingTop: 0, marginTop: 0 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Available Cash</span>
            <span id="lblAvailableCashTicket" style={{ fontWeight: 700 }}>${fmt(balance.cash)}</span>
          </div>
          {holding && (
            <div className="estimated-cost" style={{ border: 'none', paddingTop: 0, marginTop: 0 }}>
              <span style={{ color: 'var(--text-secondary)' }}>You Hold</span>
              <span style={{ fontWeight: 700, color: 'var(--neon-blue)' }}>
                {holding.qty % 1 === 0 ? holding.qty : holding.qty.toFixed(4)} shares
              </span>
            </div>
          )}

          {/* Execute Button */}
          <button id="btnSubmitOrder" className={`btn-execute ${isBuy ? 'buy' : 'sell'}`} onClick={handleExecute}>
            <i className="fa-solid fa-bolt" />
            EXECUTE {activeOrderSide} ORDER
          </button>

          {/* AI Prediction */}
          <div className="prediction-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-secondary)' }}>AI ML Direction Signal</span>
              <span
                id="predictPercentageText"
                style={{
                  fontWeight: 700,
                  color: prediction.pct >= 55
                    ? 'var(--bullish-green)'
                    : prediction.pct <= 45
                      ? 'var(--bearish-red)'
                      : 'var(--text-secondary)',
                }}
              >
                {prediction.direction} ({prediction.pct}%)
              </span>
            </div>
            <div className="predict-meter">
              <div id="predictFillBar" className="predict-fill" style={{ width: `${prediction.pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
