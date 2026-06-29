import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import * as api from '../lib/api';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];

export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Inline edit state
  const [editingName, setEditingName] = useState(false);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim() === (profile?.name || '')) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ name: editName.trim() });
      setProfile((prev: any) => ({ ...prev, name: editName.trim() }));
      setEditingName(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      api.logError('Profile.updateName', err);
      setError(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (cat: string) => {
    setSaving(true);
    try {
      await api.updateProfile({ category: cat });
      setProfile((prev: any) => ({ ...prev, category: cat }));
      setEditingCategory(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      api.logError('Profile.updateCategory', err);
      setError(err.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
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
        {saved && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-success-muted)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            Profile updated!
          </div>
        )}

        {/* User Info */}
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Name (inline editable) */}
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</span>
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 15, fontWeight: 600,
                      border: '1.5px solid var(--color-accent)', borderRadius: 'var(--radius-md)',
                      outline: 'none', color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    style={{
                      padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      background: 'var(--color-accent)', color: '#fff',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                </div>
              ) : (
                <p
                  style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginTop: 2, cursor: 'pointer' }}
                  onClick={() => { setEditName(profile?.name || ''); setEditingName(true); }}
                  title="Click to edit"
                >
                  {profile?.name || '—'}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</span>
              <p style={{ fontSize: 16, color: 'var(--color-text)', marginTop: 2 }}>{profile?.email}</p>
            </div>

            {/* Category (inline editable) */}
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</span>
              {editingCategory ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleSaveCategory(cat)}
                      disabled={saving}
                      style={{
                        padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        border: '1.5px solid var(--color-border)', fontSize: 13, fontWeight: 600,
                        background: editCategory === cat ? 'var(--color-accent)' : 'var(--color-paper-2)',
                        color: editCategory === cat ? '#fff' : 'var(--color-text-2)',
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => { handleSaveCategory(''); setEditingCategory(false); }}
                    style={{
                      padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      border: '1.5px solid var(--color-border)', fontSize: 13,
                      background: 'transparent', color: 'var(--color-text-3)',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setEditingCategory(false)}
                    style={{
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      border: 'none', fontSize: 13,
                      background: 'transparent', color: 'var(--color-danger)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p
                  style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginTop: 2, cursor: 'pointer' }}
                  onClick={() => { setEditCategory(profile?.category || ''); setEditingCategory(true); }}
                  title="Click to edit"
                >
                  {profile?.category || '—'}
                </p>
              )}
            </div>

            {/* Purchases */}
            <div>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purchases</span>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent)', marginTop: 2 }}>{profile?.purchases_count || 0} PDF{profile?.purchases_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Link to="/notifications" className="btn btn-outline" style={{ justifyContent: 'center' }}>
            Notifications
          </Link>
          <Link to="/purchased" className="btn btn-primary" style={{ justifyContent: 'center' }}>
            My Purchased PDFs
          </Link>
          <Link to="/about" className="btn btn-outline" style={{ justifyContent: 'center' }}>
            About
          </Link>
          <Link to="/help" className="btn btn-outline" style={{ justifyContent: 'center' }}>
            Help & FAQ
          </Link>
          <Link to="/privacy" className="btn btn-outline" style={{ justifyContent: 'center' }}>
            Privacy & Security
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
