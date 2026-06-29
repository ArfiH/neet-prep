import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useMediaQuery } from '../lib/useMediaQuery';
import * as api from '../lib/api';

type Notification = {
  id: number;
  title: string;
  body: string;
  is_read: number;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNotifications()
      .then(setNotifications)
      .catch(err => { console.error('Notifications.fetch', err); setError('Could not load notifications.'); })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8) 0' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>Notifications</h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: 'var(--color-accent)',
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}><Bell size={28} /></div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>No notifications yet</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>You'll see updates about purchases and activity here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: 'var(--space-4)',
                  cursor: 'pointer',
                  borderLeft: n.is_read ? '1px solid var(--color-border)' : '3px solid var(--color-accent)',
                }}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: n.is_read ? 500 : 700, color: 'var(--color-text)' }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 4, lineHeight: 1.4 }}>{n.body}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>
                      {timeAgo(n.created_at)}
                    </span>
                    {n.is_read === 0 && (
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--color-accent)' }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
          <Link to="/profile" style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
            &larr; Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
