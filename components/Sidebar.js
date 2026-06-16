'use client';

import { useTrading } from '../context/TradingContext';
import Image from 'next/image';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: 'fa-solid fa-columns',    label: 'Dashboard' },
  { id: 'markets',    icon: 'fa-solid fa-chart-pie',  label: 'Markets' },
  { id: 'portfolio',  icon: 'fa-solid fa-wallet',     label: 'Portfolio' },
  { id: 'trading',    icon: 'fa-solid fa-terminal',   label: 'Paper Trading' },
  { id: 'news',       icon: 'fa-solid fa-newspaper',  label: 'Market News' },
  { id: 'ai-tools',   icon: 'fa-solid fa-robot',      label: 'AI & Tools' },
  { id: 'settings',   icon: 'fa-solid fa-sliders',    label: 'Profile & Journal' },
];

export default function Sidebar() {
  const { user, activeTab, setActiveTab } = useTrading();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo-container">
        <div className="logo-icon">
          <Image src="/FN_Logo.png" alt="FEIN TRADE" 
          width={70}         // Matches your base CSS width
          height={50}        // Matches your base CSS height
          priority             // <-- Separate prop
          onError=
            {
              (e) => {    // <-- Separate prop
                e.target.style.display = 'none'; 
                }
            } 
          />
        </div>
        <div className="logo-text">FEIN TRADE</div>
      </div>

      {/* Navigation */}
      <ul className="nav-menu">
        {NAV_ITEMS.map(item => (
          <li key={item.id}>
            <button
              className={`nav-item${activeTab === item.id ? ' active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* User Mini Profile */}
      <div className="sidebar-user" onClick={() => setActiveTab('settings')}>
        <div className="avatar-wrapper">
          <img
            src={user.avatar}
            alt="Avatar"
            className="avatar"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80'; }}
          />
          <div className="online-badge" />
        </div>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-rank">
            <i className="fa-solid fa-medal" /> Elite Rank
          </span>
        </div>
      </div>
    </aside>
  );
}
