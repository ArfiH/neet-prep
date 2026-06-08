import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import * as api from '../lib/api';

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getProfile()
      .then(data => setProfile(data))
      .catch(err => { api.logError('Profile.fetch', err); setError('Could not load profile.'); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>Profile</h1>

        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {/* User Info */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</span>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginTop: 2 }}>{profile?.name || '—'}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</span>
              <p style={{ fontSize: 16, color: 'var(--color-text)', marginTop: 2 }}>{profile?.email}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purchases</span>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent)', marginTop: 2 }}>{profile?.purchases_count || 0} PDF{profile?.purchases_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Link to="/purchased" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            My Purchased PDFs
          </Link>
          {isAdmin && (
            <a
              href={`/admin?token=${localStorage.getItem('neet_zyme_token')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ justifyContent: 'center' }}
            >
              Admin Panel
            </a>
          )}
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '12px', fontSize: 14 }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
