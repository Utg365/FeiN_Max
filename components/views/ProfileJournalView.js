'use client';

import { useState, useRef } from 'react';
import { useTrading } from '../../context/TradingContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
];

function fmt(n, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function ProfileJournalView() {
  const {
    user, balance, transactions, journal,
    updateProfile, resetBalance, addJournalEntry, clearLogs,
  } = useTrading();

  const [displayName, setDisplayName] = useState(user.name);
  const [journalText, setJournalText] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [activeAvatar, setActiveAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSaveProfile() {
    setSaving(true);
    await updateProfile(displayName, activeAvatar);
    setSaving(false);
  }

  function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setAvatarPreview(ev.target.result);
      setActiveAvatar(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function setPresetAvatar(src) {
    setAvatarPreview(src);
    setActiveAvatar(src);
  }

  function handleAddJournal() {
    if (!journalText.trim()) return;
    addJournalEntry(journalText);
    setJournalText('');
  }

  // Derived stats
  const totalTrades  = transactions.length;
  const sellTxs      = transactions.filter(t => t.action === 'SELL');
  const winCount     = sellTxs.filter(t => {
    const buyTx = transactions.find(b => b.symbol === t.symbol && b.action === 'BUY');
    return buyTx && t.price > buyTx.price;
  }).length;
  const winRate = sellTxs.length > 0 ? ((winCount / sellTxs.length) * 100).toFixed(1) : '0.0';
  const netPnL  = balance.netLiq - (balance.initial || 100000);

  return (
    <section className="page-view active">
      <div className="profile-card-layout">

        {/* Column 1: Profile Settings */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-user-gear" /> Trading Profile</h3>
          </div>

          {/* Avatar */}
          <img
            id="profileCardAvatar"
            src={avatarPreview}
            alt="Avatar"
            className="profile-avatar-large"
            onError={e => { e.target.src = PRESET_AVATARS[0]; }}
          />

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h4 id="profileCardName" style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</h4>
            <p style={{ fontSize: 11, color: 'var(--neon-blue)', textTransform: 'uppercase' }}>
              Institutional License Tier
            </p>
            {user.email && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{user.email}</p>
            )}
          </div>

          {/* Display Name */}
          <div className="input-grp mb-16">
            <label>Display Name</label>
            <div className="input-with-suffix">
              <input
                type="text"
                id="profileNameInput"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                style={{ paddingRight: 14 }}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="input-grp mb-16">
            <label>Profile Photo</label>
            <div className="avatar-upload-row">
              <img
                id="profilePhotoPreview"
                src={avatarPreview}
                alt="Profile"
                className="avatar-upload-preview"
                onError={e => { e.target.src = PRESET_AVATARS[0]; }}
              />
              <div className="avatar-upload-actions">
                <button className="btn-upload-photo" onClick={() => fileInputRef.current?.click()}>
                  <i className="fa-solid fa-camera" /> Upload Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
                <span className="avatar-upload-hint">JPG, PNG or GIF · Max 5MB</span>
              </div>
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="input-grp mb-16">
            <label>Quick Presets</label>
            <div className="avatar-selection">
              {PRESET_AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preset ${i + 1}`}
                  className={`avatar-option${activeAvatar === src ? ' active' : ''}`}
                  onClick={() => setPresetAvatar(src)}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <button className="auth-btn" onClick={handleSaveProfile} disabled={saving}>
            {saving
              ? <><i className="fa-solid fa-circle-notch spinner" /> Saving…</>
              : <><i className="fa-solid fa-floppy-disk" /> Save Profile</>}
          </button>

          {/* Account Stats */}
          <div className="profile-sidebar-stats">
            {[
              { label: 'Trading Status',     value: 'ACTIVE SECURE',     color: 'var(--bullish-green)' },
              { label: 'Account Type',        value: 'CASH TERM',          color: '' },
              { label: 'Default Currency',    value: 'USD ($)',            color: '' },
              { label: 'Total Trades',        value: totalTrades,          color: 'var(--neon-blue)' },
              { label: 'Win Rate',            value: `${winRate}%`,        color: 'var(--bullish-green)' },
              { label: 'Net P&L',
                value: `${netPnL >= 0 ? '+' : ''}$${fmt(netPnL)}`,
                color: netPnL >= 0 ? 'var(--bullish-green)' : 'var(--bearish-red)',
              },
            ].map(r => (
              <div key={r.label} className="profile-stat-row">
                <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                <span className="profile-stat-val" style={{ color: r.color || 'var(--text-primary)' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Reset Balance */}
          <button
            className="btn-execute sell"
            style={{ marginTop: 20, fontSize: 12, padding: 10 }}
            onClick={() => { if (window.confirm('Reset your virtual balance to $100,000? This clears all trades.')) resetBalance(); }}
          >
            <i className="fa-solid fa-arrow-rotate-right" /> RESET DEMO BALANCE ($100,000)
          </button>
        </div>

        {/* Column 2: Journal & Transaction Log */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-book-open" /> Trader Journal & Transaction Log</h3>
            <button
              className="icon-btn"
              style={{ width: 'auto', height: 'auto', borderRadius: 6, padding: '6px 12px', fontSize: 11 }}
              onClick={clearLogs}
              title="Clear all logs"
            >
              <i className="fa-solid fa-trash-can" /> Clear Log
            </button>
          </div>

          {/* Journal Entry Input */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, marginBottom: 10 }}>
              <i className="fa-solid fa-pencil" /> Write a Journal Entry
            </h4>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                id="journalEntryInput"
                className="chat-msg-input"
                placeholder="Logged my trade, logic: AAPL breakout from consolidation..."
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddJournal(); }}
              />
              <button className="btn-send" style={{ width: 100, fontSize: 12 }} onClick={handleAddJournal}>
                ADD LOG
              </button>
            </div>
          </div>

          {/* Journal Entries */}
          <h4 style={{ fontSize: 13, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
            Journal Entries
          </h4>
          <div id="journalList" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 200, overflowY: 'auto', marginBottom: 24 }}>
            {journal.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                No journal entries yet.
              </p>
            )}
            {journal.map((entry, i) => (
              <div key={i} style={{
                background: 'rgba(0,242,254,0.03)',
                border: '1px solid rgba(0,242,254,0.08)',
                borderRadius: 8,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <i className="fa-solid fa-clock" style={{ marginRight: 5 }} />{entry.timestamp}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{entry.text}</div>
              </div>
            ))}
          </div>

          {/* Transaction Log */}
          <h4 style={{ fontSize: 13, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
            Full Order Execution Log
          </h4>
          <div className="table-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Symbol</th>
                  <th>Action</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                      No trades executed yet.
                    </td>
                  </tr>
                )}
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.timestamp}</td>
                    <td style={{ fontWeight: 700 }}>{t.symbol}</td>
                    <td>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                        background: t.action === 'BUY' ? 'rgba(0,230,118,0.15)' : 'rgba(255,23,68,0.15)',
                        color: t.action === 'BUY' ? 'var(--bullish-green)' : 'var(--bearish-red)',
                      }}>
                        {t.action}
                      </span>
                    </td>
                    <td>${fmt(t.price)}</td>
                    <td>{t.qty}</td>
                    <td style={{ fontWeight: 700, color: t.action === 'BUY' ? 'var(--bearish-red)' : 'var(--bullish-green)' }}>
                      {t.action === 'BUY' ? '-' : '+'}${fmt(t.total)}
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
