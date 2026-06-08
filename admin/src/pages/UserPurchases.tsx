import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getUsers, getPdfs, getUserPurchases, grantPdfAccess, revokePdfAccess } from '../lib/api';

export default function UserPurchases() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [allPdfs, setAllPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showGrant, setShowGrant] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState('');
  const [granting, setGranting] = useState(false);

  const [confirmRevoke, setConfirmRevoke] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getUsers().then(users => {
        const found = users.find((u: any) => String(u.id) === String(id));
        if (!found) throw new Error('User not found');
        setUser(found);
      }),
      getUserPurchases(Number(id)).then(setPurchases),
      getPdfs().then(setAllPdfs),
    ]).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleGrant = async () => {
    if (!selectedPdfId || !id) return;
    setGranting(true);
    try {
      await grantPdfAccess(Number(id), Number(selectedPdfId));
      setSuccess('Access granted successfully');
      const updated = await getUserPurchases(Number(id));
      setPurchases(updated);
      setShowGrant(false);
      setSelectedPdfId('');
    } catch (e: any) {
      setError(e.message);
    }
    setGranting(false);
  };

  const handleRevoke = async (purchase: any) => {
    if (!id) return;
    try {
      await revokePdfAccess(Number(id), purchase.pdf_id);
      setSuccess('Access revoked');
      const updated = await getUserPurchases(Number(id));
      setPurchases(updated);
    } catch (e: any) {
      setError(e.message);
    }
    setConfirmRevoke(null);
  };

  const purchasesColumns = [
    { key: 'id', label: 'ID' },
    { key: 'pdf_title', label: 'PDF Title' },
    { key: 'pdf_subject', label: 'Subject' },
    {
      key: 'amount', label: 'Amount',
      render: (p: any) => p.amount > 0 ? `₹${Number(p.amount).toFixed(0)}` : 'Free (granted)',
    },
    {
      key: 'status', label: 'Status',
      render: (p: any) => (
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: p.status === 'completed' ? 'var(--color-success)' : 'var(--color-text-3)',
        }}>
          {p.status}
        </span>
      ),
    },
    {
      key: 'purchased_at', label: 'Granted',
      render: (p: any) => new Date(p.purchased_at).toLocaleDateString(),
    },
    {
      key: '_actions', label: '',
      render: (p: any) => (
        <button
          onClick={() => setConfirmRevoke(p)}
          style={{
            background: 'none',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            color: 'var(--color-danger)',
            whiteSpace: 'nowrap',
          }}
        >
          Revoke
        </button>
      ),
    },
  ];

  const availablePdfs = allPdfs.filter(
    pdf => !purchases.some(
      (p: any) => String(p.pdf_id) === String(pdf.id) && p.status === 'completed'
    )
  );

  if (loading) return <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <Link to="/users" style={{ color: 'var(--color-text-3)', fontSize: 14 }}>&larr; Back to Users</Link>
      </div>

      {user && (
        <div style={{
          background: 'var(--color-paper)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)' }}>{user.name || 'Unnamed User'}</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)' }}>{user.email}</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 'var(--space-1)' }}>
            Role: {user.role} &middot; ID: {user.id}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-danger-muted)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          marginBottom: 'var(--space-4)',
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontWeight: 600 }}
          >✕</button>
        </div>
      )}

      {success && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-success-muted)',
          color: 'var(--color-success)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          marginBottom: 'var(--space-4)',
        }}>
          {success}
          <button
            onClick={() => setSuccess('')}
            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', fontWeight: 600 }}
          >✕</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>PDF Access ({purchases.length})</h3>
        <button
          onClick={() => setShowGrant(true)}
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Grant Access
        </button>
      </div>

      <DataTable
        columns={purchasesColumns}
        data={purchases}
        keyField="id"
        searchPlaceholder="Search purchases..."
      />

      {/* Grant Access Modal */}
      {showGrant && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }} onClick={() => !granting && setShowGrant(false)}>
          <div style={{
            background: 'var(--color-paper)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            width: 400,
            maxWidth: '90vw',
            boxShadow: 'var(--shadow-lg)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-4)' }}>Grant PDF Access</h3>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', marginBottom: 'var(--space-2)' }}>
              Select PDF
            </label>
            <select
              value={selectedPdfId}
              onChange={e => setSelectedPdfId(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                background: 'var(--color-paper-2)',
                color: 'var(--color-text)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <option value="">-- Select a PDF --</option>
              {availablePdfs.map((pdf: any) => (
                <option key={pdf.id} value={pdf.id}>
                  {pdf.title} ({pdf.subject})
                </option>
              ))}
            </select>

            {availablePdfs.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-4)' }}>
                User already has access to all PDFs.
              </p>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowGrant(false); setSelectedPdfId(''); }}
                disabled={granting}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--color-text-2)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGrant}
                disabled={!selectedPdfId || granting}
                style={{
                  background: 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: selectedPdfId && !granting ? 'pointer' : 'not-allowed',
                  opacity: selectedPdfId && !granting ? 1 : 0.5,
                }}
              >
                {granting ? 'Granting...' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRevoke && (
        <ConfirmDialog
          open
          title="Revoke Access"
          message={`Remove access to "${confirmRevoke.pdf_title}" for ${user?.email}? This cannot be undone.`}
          confirmLabel="Revoke"
          onConfirm={() => handleRevoke(confirmRevoke)}
          onCancel={() => setConfirmRevoke(null)}
        />
      )}
    </div>
  );
}
