import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { logout } from '../lib/api';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/pdfs', label: 'PDFs' },
  { to: '/colleges', label: 'Colleges' },
  { to: '/cutoffs', label: 'Cutoffs' },
  { to: '/users', label: 'Users' },
  { to: '/notifications/broadcast', label: 'Broadcast' },
];

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandText}>NEET Zymee</span>
          <span style={styles.brandBadge}>admin</span>
        </div>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.spacer} />
        <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
      </aside>
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Admin Panel</h1>
        </header>
        <div style={styles.content}><Outlet /></div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    width: 220,
    background: 'var(--color-paper)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-4)',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) 0 var(--space-4)',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--space-4)',
  },
  brandText: { fontWeight: 700, fontSize: 16, color: 'var(--color-text)' },
  brandBadge: {
    fontSize: 10,
    fontWeight: 600,
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    padding: '2px 6px',
    borderRadius: 'var(--radius-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 2 },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-2)',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  },
  navLinkActive: {
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    fontWeight: 600,
  },
  spacer: { flex: 1 },
  logoutBtn: {
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-2) var(--space-3)',
    color: 'var(--color-text-2)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 'var(--space-2)',
    transition: 'border-color var(--transition-fast)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: {
    padding: 'var(--space-5) var(--space-6)',
    background: 'var(--color-paper)',
    borderBottom: '1px solid var(--color-border)',
  },
  pageTitle: { fontSize: 18, fontWeight: 600, color: 'var(--color-text)' },
  content: { flex: 1, overflow: 'auto', padding: 'var(--space-6)' },
};
