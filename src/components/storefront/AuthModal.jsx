import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signIn,
    signUp
  } = useContext(ShopContext);

  if (!isAuthModalOpen) return null;

  // Tab State: 'signin' or 'signup'
  const [activeTab, setActiveTab] = useState('signin');

  // Input fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form states when modal opens or active tab switches
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  }, [activeTab, isAuthModalOpen]);

  const handleClose = () => {
    setIsAuthModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Email validation helper
    const isEmailValid = (em) => /\S+@\S+\.\S+/.test(em);

    if (activeTab === 'signin') {
      // Sign In Logic
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please enter both email and password.');
        return;
      }
      if (!isEmailValid(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      const res = await signIn(email, password);
      if (res.success) {
        setSuccessMsg('Signed in successfully! Welcome back.');
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // Sign Up Logic
      if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        setErrorMsg('Please fill out all fields.');
        return;
      }
      if (!isEmailValid(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      const res = signUp(name, email, password);
      if (res.success) {
        setSuccessMsg('Account created successfully! Welcome.');
        setTimeout(() => {
          handleClose();
        }, 800);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={handleClose} style={{ zIndex: 200 }}>
      <div
        className="admin-modal anim-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', overflow: 'visible' }}
      >
        {/* Header Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--clr-border)', position: 'relative' }}>
          <button
            style={{
              flex: 1,
              padding: '1.25rem 0',
              fontWeight: 700,
              fontSize: '1rem',
              color: activeTab === 'signin' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              background: activeTab === 'signin' ? 'var(--clr-bg-card)' : 'var(--clr-bg-app)',
              borderBottom: activeTab === 'signin' ? '2px solid var(--clr-primary)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button
            style={{
              flex: 1,
              padding: '1.25rem 0',
              fontWeight: 700,
              fontSize: '1rem',
              color: activeTab === 'signup' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              background: activeTab === 'signup' ? 'var(--clr-bg-card)' : 'var(--clr-bg-app)',
              borderBottom: activeTab === 'signup' ? '2px solid var(--clr-primary)' : 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>

          {/* Close Modal X button */}
          <button
            className="theme-switch"
            onClick={handleClose}
            style={{
              position: 'absolute',
              right: '-14px',
              top: '-14px',
              width: '32px',
              height: '32px',
              background: 'var(--clr-bg-card)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} style={{ padding: '2rem 1.5rem' }}>
          
          {/* Status Alert Panels */}
          {errorMsg && (
            <div
              className="badge badge-danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                lineHeight: 1.4,
                textTransform: 'none'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              className="badge badge-success"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                width: '100%',
                lineHeight: 1.4,
                textTransform: 'none'
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {successMsg}
            </div>
          )}

          {/* Tab 2 Sign Up - Full Name input */}
          {activeTab === 'signup' && (
            <div className="form-group anim-fade-in">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  type="text"
                  id="auth-name"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
              <input
                type="email"
                id="auth-email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="johndoe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
              <input
                type="password"
                id="auth-password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Tab 2 Sign Up - Confirm Password input */}
          {activeTab === 'signup' && (
            <div className="form-group anim-fade-in">
              <label className="form-label" htmlFor="auth-confirm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  type="password"
                  id="auth-confirm"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Tab 1 Sign In - Test Accounts Help link */}
          {activeTab === 'signin' && (
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: '1.25rem', padding: '0.5rem', background: 'var(--clr-bg-app)', borderRadius: 'var(--radius-xs)', border: '1px dashed var(--clr-border)' }}>
              💡 Test API Account: <strong>customer1@gmail.com</strong> / Password: <strong>12345</strong>
            </div>
          )}

          {/* Submit Actions */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
            {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }} />
            <span style={{ padding: '0 0.75rem', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }} />
          </div>

          {/* Google Login button */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--clr-border)'
            }}
            onClick={() => {
              window.location.href = "https://cho-tot-production.up.railway.app/auth/google/login";
            }}
          >
            {/* Standard Google logo vector graphics */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Quick tab swapper label */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
            {activeTab === 'signin' ? (
              <>
                New customer?{' '}
                <button
                  type="button"
                  style={{ color: 'var(--clr-primary)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('signup')}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  style={{ color: 'var(--clr-primary)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
