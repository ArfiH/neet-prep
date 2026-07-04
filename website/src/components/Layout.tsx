import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import * as api from '../lib/api';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/pdfs', label: 'PDFs' },
  { to: '/colleges', label: 'Colleges' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    api.getNotifications()
      .then(notifs => setUnreadCount(notifs.filter((n: any) => !n.is_read).length))
      .catch(() => {});
  }, [isLoggedIn, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <header style={{
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60 }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}>NZ</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>NEET Zymee</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="desktop-only" style={{ display: 'flex', gap: 4, marginLeft: 'var(--space-8)' }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive(link.to) ? 'var(--color-accent)' : 'var(--color-text-2)',
                  textDecoration: 'none',
                  background: isActive(link.to) ? 'var(--color-accent-muted)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Desktop auth buttons */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isLoggedIn ? (
              <>
                <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
                  {user?.name || user?.email}
                </span>
                <Link
                  to="/notifications"
                  style={{ position: 'relative', padding: 8, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 16, height: 16, borderRadius: 8,
                      background: 'var(--color-danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: '#fff',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
                  Profile
                </Link>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13 }}>
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            className="nav-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile nav panel */}
        <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={isActive(link.to) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
          {isLoggedIn ? (
            <>
              <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-3)' }}>
                {user?.name || user?.email}
              </div>
              <Link to="/notifications" onClick={() => setMobileOpen(false)}>
                Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
              <button onClick={() => { setMobileOpen(false); handleLogout(); }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--color-paper-2)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-8) 0',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#fff' }}>NZ</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>NEET Zymee</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', maxWidth: 300 }}>
              Your NEET UG preparation companion.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
            <Link to="/about" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>About</Link>
            <Link to="/help" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>Help</Link>
            <Link to="/privacy" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/pdfs" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>PDFs</Link>
            <Link to="/colleges" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>Colleges</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            &copy; {new Date().getFullYear()} NEET Zymee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
