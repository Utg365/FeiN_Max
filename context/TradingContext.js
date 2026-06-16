'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { assetDatabase } from '../lib/assets';

const TradingContext = createContext();

const API = ''; // Replaced with relative path in Next.js to route to internal API

const DEFAULT_STATE = {
  user: {
    name: 'Guest Trader',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
    isLoggedIn: false,
    email: '',
    dob: '',
    created_at: '',
  },
  balance: {
    initial: 100000.00,
    cash: 100000.00,
    netLiq: 100000.00,
    unrealizedPnL: 0.00,
    unrealizedPnLPct: 0.00,
  },
  portfolio: {}, // { SYMBOL: { qty, avgPrice, exchange, category } }
  watchlist: ['AAPL', 'BTCUSD', 'TSLA', 'EURUSD'],
  transactions: [], // [ { timestamp, symbol, action, price, qty, total } ]
  journal: [], // [ { timestamp, text } ]
  activeSymbol: 'AAPL',
  activeExchange: 'NASDAQ',
  activeCategory: 'STOCKS',
  activeOrderSide: 'BUY',
  activeOrderType: 'MARKET',
  volumeMuted: false,
  dashboardPeriod: '1W',
  activeTab: 'dashboard',
};

// Web Audio API Sound Synthesizer
function playSound(type, muted) {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'buy') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'sell') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(493.88, ctx.currentTime + 0.1); // B4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'notification') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880.00, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.warn('Audio synthesis block failed:', e);
  }
}

export function TradingProvider({ children }) {
  // Global Assets State
  const [assets, setAssets] = useState(assetDatabase);
  
  // UI notifications list
  const [notifications, setNotifications] = useState([]);
  
  // App states
  const [user, setUser] = useState(DEFAULT_STATE.user);
  const [balance, setBalance] = useState(DEFAULT_STATE.balance);
  const [portfolio, setPortfolio] = useState(DEFAULT_STATE.portfolio);
  const [watchlist, setWatchlist] = useState(DEFAULT_STATE.watchlist);
  const [transactions, setTransactions] = useState(DEFAULT_STATE.transactions);
  const [journal, setJournal] = useState(DEFAULT_STATE.journal);
  
  // Active states
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_STATE.activeSymbol);
  const [activeExchange, setActiveExchange] = useState(DEFAULT_STATE.activeExchange);
  const [activeCategory, setActiveCategory] = useState(DEFAULT_STATE.activeCategory);
  const [activeOrderSide, setActiveOrderSide] = useState(DEFAULT_STATE.activeOrderSide);
  const [activeOrderType, setActiveOrderType] = useState(DEFAULT_STATE.activeOrderType);
  const [volumeMuted, setVolumeMuted] = useState(DEFAULT_STATE.volumeMuted);
  const [dashboardPeriod, setDashboardPeriod] = useState(DEFAULT_STATE.dashboardPeriod);
  const [activeTab, setActiveTab] = useState(DEFAULT_STATE.activeTab);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Trigger Notification helper
  const triggerNotification = useCallback((message, type = 'info') => {
    playSound('notification', volumeMuted);
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, [volumeMuted]);

  // Audio helper
  const playSoundEffect = useCallback((type) => {
    playSound(type, volumeMuted);
  }, [volumeMuted]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setVolumeMuted(prev => !prev);
  }, []);

  // Sync state helper (Debounced sync with database / localStorage)
  const syncState = useCallback(async (stateData) => {
    const token = localStorage.getItem('fein_token');
    
    if (token && stateData.user.isLoggedIn) {
      try {
        await fetch(`${API}/api/state`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            balance: stateData.balance,
            portfolio: stateData.portfolio,
            watchlist: stateData.watchlist,
            transactions: stateData.transactions,
            journal: stateData.journal,
            activeSymbol: stateData.activeSymbol,
            activeExchange: stateData.activeExchange,
            activeCategory: stateData.activeCategory
          })
        });
      } catch (err) {
        console.error('State sync failed:', err);
      }
    } else {
      // Offline / Guest fallback
      localStorage.setItem('feintrade_trading_state', JSON.stringify({
        balance: stateData.balance,
        portfolio: stateData.portfolio,
        watchlist: stateData.watchlist,
        transactions: stateData.transactions,
        journal: stateData.journal,
        activeSymbol: stateData.activeSymbol,
        activeExchange: stateData.activeExchange,
        activeCategory: stateData.activeCategory
      }));
    }
  }, []);

  // Collect current full state to pass to sync
  const getFullState = useCallback(() => {
    return {
      user,
      balance,
      portfolio,
      watchlist,
      transactions,
      journal,
      activeSymbol,
      activeExchange,
      activeCategory
    };
  }, [user, balance, portfolio, watchlist, transactions, journal, activeSymbol, activeExchange, activeCategory]);

  // Trigger sync on state updates
  useEffect(() => {
    if (isAuthLoading) return;
    const fullState = getFullState();
    const timer = setTimeout(() => {
      syncState(fullState);
    }, 1000); // Debounce database saves
    return () => clearTimeout(timer);
  }, [balance, portfolio, watchlist, transactions, journal, activeSymbol, activeExchange, activeCategory, syncState, getFullState, isAuthLoading]);

  // Load state from backend / localStorage
  const loadState = useCallback(async (userProfile) => {
    const token = localStorage.getItem('fein_token');
    let loadedState = null;
    
    if (token && userProfile && userProfile.isLoggedIn) {
      try {
        const res = await fetch(`${API}/api/state`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.balance) {
            loadedState = data;
          }
        }
      } catch (err) {
        console.warn('Backend load state failed, loading localStorage:', err);
      }
    }
    
    if (!loadedState) {
      // LocalStorage fallback
      const saved = localStorage.getItem('feintrade_trading_state');
      if (saved) {
        try {
          loadedState = JSON.parse(saved);
        } catch (e) {
          console.error('Local storage parsing failed:', e);
        }
      }
    }
    
    if (loadedState) {
      if (loadedState.balance) setBalance(loadedState.balance);
      if (loadedState.portfolio) setPortfolio(loadedState.portfolio);
      if (loadedState.watchlist) setWatchlist(loadedState.watchlist);
      if (loadedState.transactions) setTransactions(loadedState.transactions);
      if (loadedState.journal) setJournal(loadedState.journal);
      if (loadedState.activeSymbol) {
        setActiveSymbol(loadedState.activeSymbol);
        const asset = assetDatabase.find(a => a.symbol === loadedState.activeSymbol);
        if (asset) {
          setActiveExchange(asset.exchange);
          setActiveCategory(asset.category);
        }
      }
    } else {
      // Reset to defaults
      setBalance(DEFAULT_STATE.balance);
      setPortfolio(DEFAULT_STATE.portfolio);
      setWatchlist(DEFAULT_STATE.watchlist);
      setTransactions(DEFAULT_STATE.transactions);
      setJournal(DEFAULT_STATE.journal);
    }
  }, []);

  // Validate session on mount
  const checkSession = useCallback(async () => {
    setIsAuthLoading(true);
    const token = localStorage.getItem('fein_token');
    if (!token) {
      setIsAuthLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const freshUser = await res.json();
        const userObj = {
          name: freshUser.username,
          avatar: freshUser.avatar || DEFAULT_STATE.user.avatar,
          isLoggedIn: true,
          email: freshUser.email,
          dob: freshUser.dob,
          created_at: freshUser.created_at,
        };
        setUser(userObj);
        await loadState(userObj);
        triggerNotification(`Terminal connected. Welcome back, ${freshUser.username}!`, 'success');
      } else {
        // Token invalid or expired
        localStorage.removeItem('fein_token');
        localStorage.removeItem('fein_user');
      }
    } catch (err) {
      console.warn('Network error checking session:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, [loadState, triggerNotification]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Auth Operations
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      localStorage.setItem('fein_token', data.token);
      localStorage.setItem('fein_user', JSON.stringify(data.user));
      const userObj = {
        name: data.user.username,
        avatar: data.user.avatar || DEFAULT_STATE.user.avatar,
        isLoggedIn: true,
        email: data.user.email,
        dob: data.user.dob,
        created_at: data.user.created_at
      };
      setUser(userObj);
      await loadState(userObj);
      triggerNotification(`Access granted. Terminal online, ${userObj.name}!`, 'success');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Cannot reach authentication server.' };
    }
  }, [loadState, triggerNotification]);

  const signup = useCallback(async (username, email, dob, password) => {
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, dob, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed.' };
      }
      localStorage.setItem('fein_token', data.token);
      localStorage.setItem('fein_user', JSON.stringify(data.user));
      const userObj = {
        name: data.user.username,
        avatar: DEFAULT_STATE.user.avatar,
        isLoggedIn: true,
        email: data.user.email,
        dob: data.user.dob,
        created_at: data.user.created_at
      };
      setUser(userObj);
      await loadState(userObj);
      triggerNotification('Welcome to Fein Trade! Account registered.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Cannot reach authentication server.' };
    }
  }, [loadState, triggerNotification]);

  const logout = useCallback(() => {
    localStorage.removeItem('fein_token');
    localStorage.removeItem('fein_user');
    setUser(DEFAULT_STATE.user);
    setBalance(DEFAULT_STATE.balance);
    setPortfolio(DEFAULT_STATE.portfolio);
    setTransactions([]);
    setJournal([]);
    setActiveTab('dashboard');
    triggerNotification('Logged out from security terminal.', 'info');
  }, [triggerNotification]);

  const updateProfile = useCallback(async (name, avatar) => {
    const token = localStorage.getItem('fein_token');
    if (!token) {
      // Local guest profile update
      setUser(prev => {
        const next = { ...prev };
        if (name) next.name = name;
        if (avatar) next.avatar = avatar;
        return next;
      });
      triggerNotification('Profile settings updated locally.', 'success');
      return { success: true };
    }

    try {
      const res = await fetch(`${API}/api/auth/update_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: name, avatar })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      setUser(prev => {
        const next = { ...prev };
        if (name) next.name = name;
        if (avatar) next.avatar = avatar;
        return next;
      });
      triggerNotification('Profile updated successfully.', 'success');
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Internal update failed.' };
    }
  }, [triggerNotification]);

  // Asset Selection
  const selectAsset = useCallback((symbol) => {
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) return;
    setActiveSymbol(symbol);
    setActiveExchange(asset.exchange);
    setActiveCategory(asset.category);
  }, [assets]);

  // Watchlist Actions
  const addWatchlistSymbol = useCallback((symbol) => {
    const cleanSym = symbol.trim().toUpperCase();
    const asset = assets.find(a => a.symbol === cleanSym);
    
    if (!asset) {
      triggerNotification(`Asset key "${cleanSym}" not recognized in active terminal directory.`, 'error');
      return;
    }
    if (watchlist.includes(cleanSym)) {
      triggerNotification(`${cleanSym} is already inside watchlist.`, 'info');
      return;
    }
    
    setWatchlist(prev => [...prev, cleanSym]);
    triggerNotification(`Added ${cleanSym} to watchlists.`, 'success');
  }, [assets, watchlist, triggerNotification]);

  const removeWatchlistSymbol = useCallback((symbol) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    triggerNotification(`Removed ${symbol} from watchlist.`, 'info');
  }, [triggerNotification]);

  // Sizing Cost Estimations
  const getEstimatedCost = useCallback((qty, limitPrice) => {
    const asset = assets.find(a => a.symbol === activeSymbol);
    if (!asset) return 0;
    const price = activeOrderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || 0;
    return (parseFloat(qty) || 0) * price;
  }, [assets, activeSymbol, activeOrderType]);

  // Sizing Max Shares Buyable
  const getMaxBuyShares = useCallback((pct, limitPrice) => {
    const asset = assets.find(a => a.symbol === activeSymbol);
    if (!asset) return 0;
    const price = activeOrderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || 0;
    if (price <= 0) return 0;
    const targetCapital = balance.cash * (pct / 100);
    return Math.floor(targetCapital / price);
  }, [assets, activeSymbol, activeOrderType, balance.cash]);

  // Trade executions
  const executeOrder = useCallback((qty, limitPrice) => {
    const asset = assets.find(a => a.symbol === activeSymbol);
    if (!asset) return;
    
    const quantity = parseFloat(qty) || 0;
    if (quantity <= 0) {
      triggerNotification('Quantity must be greater than zero.', 'error');
      return;
    }

    const price = activeOrderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || 0;
    const totalCost = quantity * price;

    if (activeOrderSide === 'BUY') {
      if (totalCost > balance.cash) {
        triggerNotification('Insufficient cash reserves in virtual account.', 'error');
        return;
      }

      setBalance(prev => ({
        ...prev,
        cash: parseFloat((prev.cash - totalCost).toFixed(2)),
      }));

      setPortfolio(prev => {
        const next = { ...prev };
        if (!next[activeSymbol]) {
          next[activeSymbol] = {
            qty: 0,
            avgPrice: 0,
            exchange: asset.exchange,
            category: asset.category,
          };
        }
        const holding = { ...next[activeSymbol] };
        const totalPreviousCost = holding.qty * holding.avgPrice;
        const totalNewCost = totalPreviousCost + totalCost;
        holding.qty += quantity;
        holding.avgPrice = totalNewCost / holding.qty;
        next[activeSymbol] = holding;
        return next;
      });

      setTransactions(prev => [
        {
          timestamp: new Date().toLocaleString(),
          symbol: activeSymbol,
          action: 'BUY',
          price,
          qty: quantity,
          total: totalCost,
        },
        ...prev,
      ]);

      playSoundEffect('buy');
      triggerNotification(`Order filled: Bought ${quantity} ${activeSymbol} at $${price.toFixed(2)}`, 'success');
    } else {
      // SELL position
      const holding = portfolio[activeSymbol];
      if (!holding || holding.qty < quantity) {
        triggerNotification(`Insufficient shares held. Active position size: ${holding ? holding.qty : 0} shares.`, 'error');
        return;
      }

      setBalance(prev => ({
        ...prev,
        cash: parseFloat((prev.cash + totalCost).toFixed(2)),
      }));

      setPortfolio(prev => {
        const next = { ...prev };
        const holding = { ...next[activeSymbol] };
        holding.qty -= quantity;
        if (holding.qty <= 0) {
          delete next[activeSymbol];
        } else {
          next[activeSymbol] = holding;
        }
        return next;
      });

      setTransactions(prev => [
        {
          timestamp: new Date().toLocaleString(),
          symbol: activeSymbol,
          action: 'SELL',
          price,
          qty: quantity,
          total: totalCost,
        },
        ...prev,
      ]);

      playSoundEffect('sell');
      triggerNotification(`Order filled: Sold ${quantity} ${activeSymbol} at $${price.toFixed(2)}`, 'success');
    }
  }, [assets, activeSymbol, activeOrderType, activeOrderSide, balance.cash, portfolio, triggerNotification, playSoundEffect]);

  // Liquidate a position from portfolio
  const liquidatePosition = useCallback((symbol) => {
    const holding = portfolio[symbol];
    if (!holding) return;

    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) return;

    // Prefills trading ticket side & values, switches tab
    selectAsset(symbol);
    setActiveOrderSide('SELL');
    setActiveTab('trading');
    triggerNotification(`Prefilled trade ticket to liquidate your position in ${symbol}.`, 'info');
  }, [portfolio, assets, selectAsset, triggerNotification]);

  // Reset Balance to 100k
  const resetBalance = useCallback(() => {
    setBalance(DEFAULT_STATE.balance);
    setPortfolio({});
    setTransactions([]);
    setJournal([]);
    triggerNotification('Virtual capital reset to $100,000.00.', 'info');
  }, [triggerNotification]);

  // Journal log additions
  const addJournalEntry = useCallback((text) => {
    if (!text.trim()) return;
    setJournal(prev => [
      {
        timestamp: new Date().toLocaleString(),
        text: text.trim(),
      },
      ...prev,
    ]);
    triggerNotification('Journal entry logged successfully.', 'success');
  }, [triggerNotification]);

  // Clear Logs
  const clearLogs = useCallback(() => {
    if (confirm('Are you sure you want to clear your trade execution history logs?')) {
      setTransactions([]);
      setJournal([]);
      triggerNotification('Transaction history and journals cleared.', 'info');
    }
  }, [triggerNotification]);

  // Simulated live fluctuations (skipping real NEPSE stocks)
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prevAssets =>
        prevAssets.map(asset => {
          if (asset.exchange === 'NEPSE') {
            return asset; // Skip real NEPSE stocks; they update from API
          }
          // Mutate price by a small random factor bounded by its volatility
          const maxChange = asset.volatility * 0.01; // max 1% of volatility per tick
          const priceChangePercent = (Math.random() * 2 - 1) * maxChange;
          const nextPrice = asset.price * (1 + priceChangePercent);
          const formattedPrice = asset.price > 10 ? parseFloat(nextPrice.toFixed(2)) : parseFloat(nextPrice.toFixed(4));
          const nextChange = asset.change + (priceChangePercent * 10);
          
          return {
            ...asset,
            price: formattedPrice,
            change: parseFloat(nextChange.toFixed(2)),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch and sync real NEPSE prices from FastAPI backend proxy dynamically based on market status
  useEffect(() => {
    let timerId = null;

    async function syncNepsePrices() {
      try {
        const res = await fetch('/api/nepse/live');
        if (!res.ok) {
          throw new Error('Proxy returned unsuccessful status');
        }
        const liveNepse = await res.json();
        if (!Array.isArray(liveNepse)) return;

        setAssets(prevAssets => {
          // Filter out old NEPSE stocks to replace them with fresh live ones
          const nonNepse = prevAssets.filter(a => a.exchange !== 'NEPSE');
          
          // Map backend items to frontend asset structure
          const backendNepse = liveNepse.map(item => ({
            symbol: item.symbol,
            name: item.name,
            exchange: 'NEPSE',
            category: 'STOCKS',
            price: item.price,
            change: item.change,
            volatility: item.volatility || 0.20,
            volume: item.volume,
            high: item.high,
            low: item.low,
            open: item.open,
            previousClose: item.previousClose
          }));

          return [...nonNepse, ...backendNepse];
        });
      } catch (err) {
        console.warn('Could not sync real NEPSE prices:', err.message);
      }
    }

    async function checkMarketStatusAndSchedule() {
      // Always sync prices on the initial run
      await syncNepsePrices();
      
      try {
        const res = await fetch('/api/nepse/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const statusData = await res.json();
        
        if (statusData.isOpen === 'OPEN') {
          console.log('NEPSE Market is OPEN. Scheduling live price sync every 5 minutes.');
          // Schedule next check/sync in 5 minutes (300,000 ms)
          timerId = setTimeout(checkMarketStatusAndSchedule, 5 * 60 * 1000);
        } else {
          console.log('NEPSE Market is CLOSED. Disabling active live price polling. Re-checking status in 30 minutes.');
          // Check status again in 30 minutes to see if market has opened (1,800,000 ms)
          timerId = setTimeout(checkMarketStatusAndSchedule, 30 * 60 * 1000);
        }
      } catch (err) {
        console.warn('Could not fetch market status:', err.message);
        // Fallback: retry in 5 minutes
        timerId = setTimeout(checkMarketStatusAndSchedule, 5 * 60 * 1000);
      }
    }

    checkMarketStatusAndSchedule();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);


  // Update Net Worth and Unrealized P&L whenever Asset prices or Portfolio changes
  useEffect(() => {
    let holdingsValue = 0;
    let costBasisValue = 0;

    Object.keys(portfolio).forEach(symbol => {
      const holding = portfolio[symbol];
      const asset = assets.find(a => a.symbol === symbol);
      if (asset) {
        holdingsValue += holding.qty * asset.price;
        costBasisValue += holding.qty * holding.avgPrice;
      }
    });

    const netLiq = balance.cash + holdingsValue;
    const unrealizedPnL = holdingsValue - costBasisValue;
    const unrealizedPnLPct = costBasisValue > 0 ? (unrealizedPnL / costBasisValue) * 100 : 0.00;

    setBalance(prev => ({
      ...prev,
      netLiq: parseFloat(netLiq.toFixed(2)),
      unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
      unrealizedPnLPct: parseFloat(unrealizedPnLPct.toFixed(2)),
    }));
  }, [assets, portfolio, balance.cash]);

  // Provide Context API
  return (
    <TradingContext.Provider
      value={{
        assets,
        notifications,
        user,
        balance,
        portfolio,
        watchlist,
        transactions,
        journal,
        activeSymbol,
        activeExchange,
        activeCategory,
        activeOrderSide,
        activeOrderType,
        volumeMuted,
        dashboardPeriod,
        activeTab,
        isAuthLoading,
        
        triggerNotification,
        playSoundEffect,
        toggleMute,
        login,
        signup,
        logout,
        updateProfile,
        selectAsset,
        addWatchlistSymbol,
        removeWatchlistSymbol,
        getEstimatedCost,
        getMaxBuyShares,
        executeOrder,
        liquidatePosition,
        resetBalance,
        addJournalEntry,
        clearLogs,
        setDashboardPeriod,
        setActiveOrderSide,
        setActiveOrderType,
        setActiveTab,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
