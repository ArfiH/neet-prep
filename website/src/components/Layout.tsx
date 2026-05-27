import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/pdfs', label: 'PDFs' },
  { to: '/colleges', label: 'Colleges' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}>NZ</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text)' }}>NEET Zyme</span>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: 'flex', gap: 4, marginLeft: 'var(--space-8)' }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: location.pathname === link.to ? 'var(--color-accent)' : 'var(--color-text-2)',
                  textDecoration: 'none',
                  background: location.pathname === link.to ? 'var(--color-accent-muted)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {isLoggedIn ? (
              <>
                <span style={{ fontSize: 14, color: 'var(--color-text-2)' }}>
                  {user?.name || user?.email}
                </span>
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
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>NEET Zyme</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', maxWidth: 300 }}>
              Your NEET UG preparation companion.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            <Link to="/pdfs" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>PDFs</Link>
            <Link to="/colleges" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>Colleges</Link>
            <a href="https://neetzymee.com" style={{ fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none' }}>Back to App</a>
          </div>
        </div>
        <div className="container" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            &copy; {new Date().getFullYear()} NEET Zyme. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
