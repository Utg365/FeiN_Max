'use client';

import { useTrading } from '../context/TradingContext';

const TICKER_SYMBOLS = [
  'AAPL','TSLA','MSFT','GOOGL','AMZN','NVDA','META',
  'BTCUSD','ETHUSD','BNBUSD',
  'EURUSD','GBPUSD',
  'NEPSE','NABIL','NICA',
];

export default function TickerBanner() {
  const { assets, selectAsset, setActiveTab } = useTrading();

  const tickerAssets = assets.filter(a => TICKER_SYMBOLS.includes(a.symbol)).slice(0, 15);
  // Duplicate for seamless loop
  const doubled = [...tickerAssets, ...tickerAssets];

  function fmt(n, price) {
    if (price > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price > 1) return n.toFixed(2);
    return n.toFixed(4);
  }

  function handleClick(symbol) {
    selectAsset(symbol);
    setActiveTab('trading');
  }

  return (
    <div className="ticker-banner">
      <div className="ticker-track">
        {doubled.map((asset, idx) => (
          <span
            key={`${asset.symbol}-${idx}`}
            className="ticker-item"
            onClick={() => handleClick(asset.symbol)}
            title={`${asset.name} — Click to trade`}
          >
            <span className="ticker-symbol">{asset.symbol}</span>
            <span className="ticker-price">{fmt(asset.price, asset.price)}</span>
            <span className={`ticker-change ${asset.change >= 0 ? 'up' : 'down'}`}>
              <i className={`fa-solid ${asset.change >= 0 ? 'fa-caret-up' : 'fa-caret-down'}`} />
              {Math.abs(asset.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
