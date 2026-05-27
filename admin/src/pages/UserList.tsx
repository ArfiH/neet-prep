import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import { getUsers, updateUserRole } from '../lib/api';

export default function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${user.email} to ${newRole}?`)) return;
    try {
      await updateUserRole(user.id, newRole);
      load();
    } catch (e: any) {
      setError(e.message);
    }
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
      key: 'email_verified', label: 'Verified',
      render: (u: any) => u.email_verified
        ? <span style={{ color: 'var(--color-success)' }}>✓</span>
        : <span style={{ color: 'var(--color-danger)' }}>✗</span>,
    },
    {
      key: 'created_at', label: 'Joined',
      render: (u: any) => new Date(u.created_at).toLocaleDateString(),
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
          onEdit={handleToggleRole}
          searchPlaceholder="Search users..."
        />
      )}
    </div>
  );
}
