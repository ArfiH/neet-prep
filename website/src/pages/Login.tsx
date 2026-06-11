import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';

declare global {
  interface Window { google?: any; }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConflict, setShowConflict] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const pendingGoogleToken = useRef<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    let attempts = 0;

    function tryInit() {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setGoogleLoading(true);
            setError('');
            try {
              await loginWithGoogle(response.credential);
              navigate(from, { replace: true });
            } catch (err: any) {
              if (err?.active_session_exists) {
                pendingGoogleToken.current = response.credential;
                setShowConflict(true);
                return;
              }
              setError(err.message || 'Google sign-in failed');
            } finally {
              setGoogleLoading(false);
            }
          },
          cancel_on_tap_outside: false,
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: googleBtnRef.current.offsetWidth || 340,
          });
        }
      } else {
        attempts++;
        if (attempts < 30) setTimeout(tryInit, 300);
      }
    }

    tryInit();
    return () => { cancelled = true; };
  }, [navigate, from, loginWithGoogle]);

  async function handleLogin(force = false) {
    setLoading(true);
    setError('');

    try {
      await login(email, password, force);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.active_session_exists) {
        setShowConflict(true);
        return;
      }
      if (err?.needs_verification) {
        navigate('/verify-email', { state: { email: err.email } });
        return;
      }
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleConflictContinue() {
    setShowConflict(false);
    if (pendingGoogleToken.current) {
      const idToken = pendingGoogleToken.current;
      pendingGoogleToken.current = null;
      setGoogleLoading(true);
      setError('');
      try {
        await loginWithGoogle(idToken, true);
        navigate(from, { replace: true });
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed');
      } finally {
        setGoogleLoading(false);
      }
    } else {
      handleLogin(true);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLogin(false);
  };

  const isBusy = loading || googleLoading;

  return (
    <div style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>Sign in to your NEET Zyme account</p>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', opacity: isBusy ? 0.6 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', margin: 'var(--space-5) 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>
              {googleLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <div className="spinner" style={{ width: 20, height: 20 }} />
                </div>
              ) : (
                <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
              )}
            </>
          )}

          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 14, color: 'var(--color-text-2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>

      {/* Active Session Conflict Dialog */}
      {showConflict && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 'var(--space-4)',
          }}
          onClick={() => setShowConflict(false)}
        >
          <div
            style={{
              background: 'var(--color-paper)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)', maxWidth: 400, width: '100%',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: 'var(--color-warning-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-4)',
            }}>
              <span style={{ fontSize: 24 }}>⚠</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              Active Session Detected
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
              You are already logged in on another device. Continuing will sign out from the other device.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConflict(false)}
                className="btn btn-outline"
                style={{ padding: '10px 24px', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConflictContinue}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: 14 }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
