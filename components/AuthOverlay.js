'use client';

import { useState, useRef } from 'react';
import { useTrading } from '../context/TradingContext';

export default function AuthOverlay() {
  const { login, signup } = useTrading();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupErrors, setSignupErrors] = useState({});
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwStrength, setPwStrength] = useState(0); // 0-3

  const pwStrengthClass = ['', 'weak', 'fair', 'strong'][pwStrength] || '';
  const pwStrengthWidth = `${(pwStrength / 3) * 100}%`;

  function calcPwStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  function validateLogin() {
    const errs = {};
    if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) errs.email = 'Valid email required.';
    if (!loginPassword || loginPassword.length < 6) errs.password = 'Password required.';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateSignup() {
    const errs = {};
    if (!signupUsername || signupUsername.length < 3) errs.username = 'Username must be 3–24 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(signupUsername)) errs.username = 'Only letters, numbers, underscore.';
    if (!signupEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) errs.email = 'Valid email required.';
    if (!signupDob) {
      errs.dob = 'Date of birth required.';
    } else {
      const age = (Date.now() - new Date(signupDob).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 16) errs.dob = 'Must be at least 16 years old.';
    }
    if (!signupPassword || signupPassword.length < 8) errs.password = 'Minimum 8 characters.';
    if (signupPassword !== signupConfirm) errs.confirm = 'Passwords do not match.';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validateLogin()) return;
    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    setLoading(false);
    if (!result.success) setServerError(result.error || 'Login failed.');
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validateSignup()) return;
    setLoading(true);
    const result = await signup(signupUsername, signupEmail, signupDob, signupPassword);
    setLoading(false);
    if (!result.success) setServerError(result.error || 'Sign up failed.');
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setServerError('');
    setLoginErrors({});
    setSignupErrors({});
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="logo-icon">
            <img src="/logo.svg" alt="FEIN TRADE" onError={e => { e.target.style.display='none'; }} />
          </div>
          <h2>FEIN TRADE</h2>
          <p>
            {mode === 'login'
              ? 'Login to access your premium institutional trading terminal'
              : 'Create your free account to start paper trading'}
          </p>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} noValidate autoComplete="off">
            <div className="input-grp" style={{ marginBottom: 16 }}>
              <label htmlFor="loginEmail">Email Address</label>
              <div className="input-with-suffix">
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  style={{ paddingRight: 14 }}
                />
              </div>
              <span className="field-error">{loginErrors.email || ''}</span>
            </div>

            <div className="input-grp" style={{ marginBottom: 20 }}>
              <label htmlFor="loginPassword">Password</label>
              <div className="input-with-suffix" style={{ position: 'relative' }}>
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  id="loginPassword"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
                <i
                  className={`fa-solid ${showLoginPw ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                  onClick={() => setShowLoginPw(v => !v)}
                />
              </div>
              <span className="field-error">{loginErrors.password || ''}</span>
            </div>

            {serverError && <div className="auth-server-error">{serverError}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-circle-notch spinner" /> Verifying…</>
                : <><i className="fa-solid fa-right-to-bracket" /> LOG IN</>}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} noValidate autoComplete="off">
            <div className="input-grp" style={{ marginBottom: 14 }}>
              <label htmlFor="signupUsername">
                Username <span className="label-hint">3–24 chars, letters / numbers / _</span>
              </label>
              <div className="input-with-suffix">
                <input
                  type="text"
                  id="signupUsername"
                  placeholder="elite_trader"
                  maxLength={24}
                  value={signupUsername}
                  onChange={e => setSignupUsername(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                {signupUsername.length >= 3 && !signupErrors.username && (
                  <i className="fa-solid fa-circle-check field-icon-ok" />
                )}
              </div>
              <span className="field-error">{signupErrors.username || ''}</span>
            </div>

            <div className="input-grp" style={{ marginBottom: 14 }}>
              <label htmlFor="signupEmail">Email Address</label>
              <div className="input-with-suffix">
                <input
                  type="email"
                  id="signupEmail"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                {signupEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail) && (
                  <i className="fa-solid fa-circle-check field-icon-ok" />
                )}
              </div>
              <span className="field-error">{signupErrors.email || ''}</span>
            </div>

            <div className="input-grp" style={{ marginBottom: 14 }}>
              <label htmlFor="signupDob">
                Date of Birth <span className="label-hint">Must be 16+</span>
              </label>
              <div className="input-with-suffix">
                <input
                  type="date"
                  id="signupDob"
                  value={signupDob}
                  onChange={e => setSignupDob(e.target.value)}
                  style={{ paddingRight: 14, colorScheme: 'dark' }}
                />
              </div>
              <span className="field-error">{signupErrors.dob || ''}</span>
            </div>

            <div className="input-grp" style={{ marginBottom: 14 }}>
              <label htmlFor="signupPassword">
                Password <span className="label-hint">Min 8 characters</span>
              </label>
              <div className="input-with-suffix" style={{ position: 'relative' }}>
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  id="signupPassword"
                  placeholder="••••••••"
                  maxLength={64}
                  value={signupPassword}
                  onChange={e => {
                    setSignupPassword(e.target.value);
                    setPwStrength(calcPwStrength(e.target.value));
                  }}
                />
                <i
                  className={`fa-solid ${showSignupPw ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                  onClick={() => setShowSignupPw(v => !v)}
                />
              </div>
              {signupPassword && (
                <div className="pw-strength-track">
                  <div className={`pw-strength-bar ${pwStrengthClass}`} style={{ width: pwStrengthWidth }} />
                </div>
              )}
              <span className="field-error">{signupErrors.password || ''}</span>
            </div>

            <div className="input-grp" style={{ marginBottom: 18 }}>
              <label htmlFor="signupConfirm">Confirm Password</label>
              <div className="input-with-suffix" style={{ position: 'relative' }}>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  id="signupConfirm"
                  placeholder="••••••••"
                  maxLength={64}
                  value={signupConfirm}
                  onChange={e => setSignupConfirm(e.target.value)}
                />
                <i
                  className={`fa-solid ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                  onClick={() => setShowConfirmPw(v => !v)}
                />
                {signupConfirm && signupConfirm === signupPassword && (
                  <i className="fa-solid fa-circle-check field-icon-ok" style={{ right: 36 }} />
                )}
              </div>
              <span className="field-error">{signupErrors.confirm || ''}</span>
            </div>

            {serverError && <div className="auth-server-error">{serverError}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-circle-notch spinner" /> Creating…</>
                : <><i className="fa-solid fa-user-plus" /> CREATE ACCOUNT</>}
            </button>
          </form>
        )}

        {/* Toggle */}
        <div className="auth-toggle">
          {mode === 'login'
            ? <>Don&apos;t have an account? <span className="auth-toggle-link" onClick={toggleMode}>Sign Up Now</span></>
            : <>Already have an account? <span className="auth-toggle-link" onClick={toggleMode}>Log In</span></>
          }
        </div>

      </div>
    </div>
  );
}
