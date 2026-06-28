import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getDeliveryRequests, updateDeliveryRequest } from '../lib/api';

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

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'pdf_title', label: 'PDF Title' },
    {
      key: 'user_name', label: 'Name',
      render: (r: any) => r.recipient_name,
    },
    { key: 'user_email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
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
            onClick={() => { setEditingRow(r.id); setSelectedStatus(r.status); }}
          >
            {r.status}
          </span>
        )
      ),
    },
    {
      key: 'created_at', label: 'Date',
      render: (r: any) => new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
    </div>
  );
}
