import { useEffect, useState } from 'react';
import { getPayments, Payment, PaymentStatus } from '../lib/api';

const STATUS_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
];

const PER_PAGE_OPTIONS = [10, 20, 50];

function statusColor(status: PaymentStatus) {
  switch (status) {
    case 'completed': return 'var(--color-success)';
    case 'failed': return 'var(--color-danger)';
    case 'pending': return 'var(--color-warning)';
  }
}

function statusBg(status: PaymentStatus) {
  switch (status) {
    case 'completed': return 'var(--color-success-muted)';
    case 'failed': return 'var(--color-danger-muted)';
    case 'pending': return 'var(--color-warning-muted)';
  }
}

function formatAmount(amount: number | string | null) {
  if (amount === null || amount === undefined) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return '₹' + (Number.isInteger(num) ? num.toFixed(0) : num.toFixed(2));
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getPayments(page, perPage, statusFilter || undefined)
      .then(res => {
        setPayments(res.payments);
        setTotal(res.total);
        setPage(res.page);
        setPerPage(res.perPage);
        setTotalPages(res.totalPages);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, perPage, statusFilter]);

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPerPage(Number(e.target.value));
    setPage(1);
  };

  const monoStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: 12,
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--color-text-2)',
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-4)' }}>Payments</h2>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.label}
            onClick={() => handleStatusChange(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--color-border)',
              background: statusFilter === opt.value ? 'var(--color-accent)' : 'var(--color-paper-2)',
              color: statusFilter === opt.value ? '#fff' : 'var(--color-text-2)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--color-paper)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-paper-2)' }}>
                {['ID', 'User', 'PDF', 'Amount', 'Order ID', 'Payment ID', 'Status', 'Date'].map(label => (
                  <th key={label} style={{
                    padding: 'var(--space-2) var(--space-3)',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--color-text-2)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-3)',
                  }}>
                    Loading...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    color: 'var(--color-text-3)',
                  }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-paper-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-3)', fontSize: 12 }}>{p.id}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text)' }}>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{p.user_email}</div>
                      {p.user_name && <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{p.user_name}</div>}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text)' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{p.pdf_title}</div>
                      {p.pdf_subject && <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{p.pdf_subject}</div>}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatAmount(p.amount)}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <div style={monoStyle} title={p.razorpay_order_id || ''}>{p.razorpay_order_id || '—'}</div>
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <div style={monoStyle} title={p.razorpay_payment_id || ''}>{p.razorpay_payment_id || '—'}</div>
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: statusColor(p.status),
                        background: statusBg(p.status),
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(p.purchased_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, color: 'var(--color-text-2)' }}>
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={handlePerPageChange}
              style={{
                padding: '4px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                background: 'var(--color-paper-2)',
                color: 'var(--color-text)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {PER_PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
            Page {page} of {totalPages} (Total: {total})
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-paper-2)',
                color: page <= 1 ? 'var(--color-text-3)' : 'var(--color-text)',
                fontWeight: 500,
                fontSize: 12,
                cursor: page <= 1 ? 'default' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-paper-2)',
                color: page >= totalPages ? 'var(--color-text-3)' : 'var(--color-text)',
                fontWeight: 500,
                fontSize: 12,
                cursor: page >= totalPages ? 'default' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
