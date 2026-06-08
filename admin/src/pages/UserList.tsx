import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getUsers, updateUserRole, banUser, unbanUser } from '../lib/api';

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleRole = (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmAction({
      title: 'Change Role',
      message: `Change ${user.email} to ${newRole}?`,
      onConfirm: async () => {
        try {
          await updateUserRole(user.id, newRole);
          load();
        } catch (e: any) {
          setError(e.message);
        }
        setConfirmAction(null);
      },
    });
  };

  const handleBan = (user: any) => {
    setConfirmAction({
      title: 'Ban User',
      message: `Are you sure you want to ban ${user.email}? They will be unable to use the app.`,
      onConfirm: async () => {
        try {
          await banUser(user.id);
          load();
        } catch (e: any) {
          setError(e.message);
        }
        setConfirmAction(null);
      },
    });
  };

  const handleUnban = (user: any) => {
    setConfirmAction({
      title: 'Unban User',
      message: `Restore access for ${user.email}?`,
      onConfirm: async () => {
        try {
          await unbanUser(user.id);
          load();
        } catch (e: any) {
          setError(e.message);
        }
        setConfirmAction(null);
      },
    });
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name', render: (u: any) => u.name || '—' },
    {
      key: 'role', label: 'Role',
      render: (u: any) => (
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: u.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-2)',
          background: u.role === 'admin' ? 'var(--color-accent-muted)' : 'var(--color-paper-3)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
        }}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'is_banned', label: 'Status',
      render: (u: any) => u.is_banned
        ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-danger)', background: 'var(--color-danger-muted)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>Banned</span>
        : <span style={{ fontSize: 12, color: 'var(--color-success)' }}>Active</span>,
    },
    {
      key: 'email_verified', label: 'Verified',
      render: (u: any) => u.email_verified
        ? <span style={{ color: 'var(--color-success)' }}>✓</span>
        : <span style={{ color: 'var(--color-danger)' }}>✗</span>,
    },
    {
      key: 'created_at', label: 'Joined',
      render: (u: any) => new Date(u.created_at).toLocaleDateString(),
    },
    {
      key: '_actions', label: '',
      render: (u: any) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleToggleRole(u)}
            style={btnStyle}
            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
          >
            Toggle Role
          </button>
          <button
            onClick={() => navigate(`/users/${u.id}/purchases`)}
            style={btnStyle}
            title="Manage PDF access"
          >
            PDFs
          </button>
          {u.is_banned ? (
            <button
              onClick={() => handleUnban(u)}
              style={{ ...btnStyle, color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              title="Unban this user"
            >
              Unban
            </button>
          ) : (
            u.role !== 'admin' && (
              <button
                onClick={() => handleBan(u)}
                style={{ ...btnStyle, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                title="Ban this user"
              >
                Ban
              </button>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-4)' }}>Users</h2>
      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          searchPlaceholder="Search users..."
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Confirm"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: 'var(--color-text-2)',
  whiteSpace: 'nowrap',
};
