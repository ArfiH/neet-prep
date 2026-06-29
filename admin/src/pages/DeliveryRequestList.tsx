import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getDeliveryRequests, updateDeliveryRequest, sendUserNotification, deleteDeliveryRequest } from '../lib/api';

const STATUS_OPTIONS = ['pending', 'shipped', 'delivered', 'cancelled'] as const;

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending: { color: '#d97706', background: '#fef3c7', fontWeight: 600 },
  shipped: { color: '#2563eb', background: '#dbeafe', fontWeight: 600 },
  delivered: { color: '#16a34a', background: '#dcfce7', fontWeight: 600 },
  cancelled: { color: '#dc2626', background: '#fee2e2', fontWeight: 600 },
};

export default function DeliveryRequestList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [confirmCancel, setConfirmCancel] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [notifyRowId, setNotifyRowId] = useState<number | null>(null);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);

  const load = () => {
    setLoading(true);
    getDeliveryRequests().then(setRequests).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (id: number, status: string) => {
    if (status === 'cancelled') {
      setConfirmCancel({ id, status });
      return;
    }
    try {
      await updateDeliveryRequest(id, status);
      setEditingRow(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmCancelAction = async () => {
    if (!confirmCancel) return;
    try {
      await updateDeliveryRequest(confirmCancel.id, 'cancelled');
      setConfirmCancel(null);
      setEditingRow(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDeliveryRequest(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSendNotify = async (userId: number) => {
    if (!notifyTitle.trim()) return;
    setSendingNotify(true);
    try {
      await sendUserNotification(userId, notifyTitle.trim(), notifyBody.trim());
      setNotifyRowId(null);
      setNotifyTitle('');
      setNotifyBody('');
    } catch (e: any) {
      setError(e.message);
    }
    setSendingNotify(false);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'pdf_title', label: 'PDF Title' },
    {
      key: 'user_name', label: 'Name',
      render: (r: any) => r.recipient_name,
    },
    { key: 'user_email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'address', label: 'Address',
      render: (r: any) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, maxWidth: 280 }}>
          <span title={r.address} style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: 'default', fontSize: 12,
          }}>
            {r.address}
          </span>
          <button
            onClick={e => {
              navigator.clipboard.writeText(r.address);
              const btn = e.currentTarget;
              btn.textContent = 'Copied!';
              Object.assign(btn.style, { color: 'var(--color-accent)', borderColor: 'var(--color-accent)' });
              setTimeout(() => {
                btn.textContent = 'Copy';
                Object.assign(btn.style, { color: '', borderColor: '' });
              }, 1500);
            }}
            style={{
              fontSize: 10, padding: '1px 5px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-3)', cursor: 'pointer', whiteSpace: 'nowrap',
              flexShrink: 0, lineHeight: 1.4,
            }}
          >
            Copy
          </button>
        </span>
      ),
    },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    {
      key: 'status', label: 'Status',
      render: (r: any) => (
        editingRow === r.id ? (
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              handleStatusChange(r.id, e.target.value);
            }}
            style={{
              fontSize: 12, padding: '2px 4px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', background: 'var(--color-paper-3)',
              color: 'var(--color-text)',
            }}
            autoFocus
          >
            <option value="">—</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
            ))}
          </select>
        ) : (
          <span
            style={{
              cursor: 'pointer', ...(STATUS_STYLES[r.status] || {}),
              textTransform: 'capitalize', fontSize: 12, padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
            onClick={() => { setEditingRow(r.id); setSelectedStatus(r.status); setNotifyRowId(null); }}
          >
            {r.status}
          </span>
        )
      ),
    },
    {
      key: 'notify', label: 'Notify',
      render: (r: any) => (
        notifyRowId === r.id ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
            <input
              value={notifyTitle}
              onChange={e => setNotifyTitle(e.target.value)}
              placeholder="Title (e.g. Delivery Update)"
              style={{
                fontSize: 12, padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', background: 'var(--color-paper-3)',
                color: 'var(--color-text)', width: '100%',
              }}
            />
            <input
              value={notifyBody}
              onChange={e => setNotifyBody(e.target.value)}
              placeholder="Message (e.g. Expected delivery: 5 Apr)"
              style={{
                fontSize: 12, padding: '4px 6px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)', background: 'var(--color-paper-3)',
                color: 'var(--color-text)', width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => handleSendNotify(r.user_id)}
                disabled={sendingNotify || !notifyTitle.trim()}
                style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  border: 'none', background: 'var(--color-accent)', color: '#fff',
                  fontWeight: 600, cursor: sendingNotify ? 'default' : 'pointer',
                  opacity: sendingNotify || !notifyTitle.trim() ? 0.6 : 1,
                }}
              >
                {sendingNotify ? '...' : 'Send'}
              </button>
              <button
                onClick={() => { setNotifyRowId(null); setNotifyTitle(''); setNotifyBody(''); }}
                style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)', background: 'transparent',
                  color: 'var(--color-text-2)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setNotifyRowId(r.id); setNotifyTitle(''); setNotifyBody(''); setEditingRow(null); }}
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-accent)', background: 'var(--color-accent-muted)',
              color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Notify
          </button>
        )
      ),
    },
    {
      key: 'created_at', label: 'Date',
      render: (r: any) => new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions', label: '',
      render: (r: any) => (
        (r.status === 'delivered' || r.status === 'cancelled') ? (
          <button
            onClick={() => setConfirmDelete(r)}
            style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-danger)', background: 'transparent',
              color: 'var(--color-danger)', cursor: 'pointer',
              whiteSpace: 'nowrap', fontWeight: 600,
            }}
          >
            Delete
          </button>
        ) : null
      ),
    },
  ];

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Delivery Requests</h2>
        <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
          Total: {requests.length}
        </span>
      </div>
      <div style={{ marginBottom: 'var(--space-4)', fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.5 }}>
        Click a status badge to change it. <strong style={{ color: 'var(--color-danger)' }}>Cancelling</strong> will show a confirmation — process refund manually.
      </div>
      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ color: 'var(--color-text-3)', fontSize: 13 }}>No delivery requests yet.</div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          keyField="id"
          searchPlaceholder="Search by name, email, city, or PDF..."
        />
      )}
      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Delivery"
        message="Are you sure you want to cancel this delivery request? The user's payment will NOT be automatically refunded. Please process any applicable refund manually."
        variant="danger"
        onConfirm={confirmCancelAction}
        onCancel={() => setConfirmCancel(null)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Delivery Request"
        message={`Permanently delete this delivery request (${confirmDelete?.recipient_name}, ${confirmDelete?.pdf_title})? This cannot be undone.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
