'use client';

import { useTrading } from '../context/TradingContext';
import AuthOverlay from '../components/AuthOverlay';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TickerBanner from '../components/TickerBanner';
import NotificationContainer from '../components/NotificationContainer';

// Lazy-like imports — all views
import DashboardView       from '../components/views/DashboardView';
import MarketsView         from '../components/views/MarketsView';
import PortfolioView       from '../components/views/PortfolioView';
import TradingTerminal     from '../components/views/TradingTerminal';
import NewsHub             from '../components/views/NewsHub';
import AIToolsView         from '../components/views/AIToolsView';
import ProfileJournalView  from '../components/views/ProfileJournalView';

export default function HomePage() {
  const { user, isAuthLoading, activeTab } = useTrading();

  if (isAuthLoading) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-main)',
        flexDirection: 'column', gap: 20,
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
          borderRadius: 12,
          boxShadow: '0 0 20px rgba(0,242,254,0.5)',
          animation: 'spin 1.2s linear infinite',
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-heading)' }}>
          Connecting to FEIN TRADE Terminal…
        </p>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <>
      {/* Show Auth overlay if not logged in */}
      {!user.isLoggedIn && <AuthOverlay />}

      {/* Main App Shell */}
      <div className="app-container">
        <Sidebar />

        <main className="main-content">
          <TopBar />
          <TickerBanner />

          {/* Render only the active view — others are unmounted to save memory */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'markets'   && <MarketsView />}
          {activeTab === 'portfolio' && <PortfolioView />}
          {activeTab === 'trading'   && <TradingTerminal />}
          {activeTab === 'news'      && <NewsHub />}
          {activeTab === 'ai-tools'  && <AIToolsView />}
          {activeTab === 'settings'  && <ProfileJournalView />}
        </main>
      </div>

      <NotificationContainer />
    </>
  );
}
