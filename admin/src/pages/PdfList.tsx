import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getPdfs, deletePdf } from '../lib/api';

export default function PdfList() {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getPdfs().then(setPdfs).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deletePdf(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'subject', label: 'Subject' },
    {
      key: 'price', label: 'Price',
      render: (p: any) => p.is_free ? <span style={{ color: 'var(--color-success)' }}>FREE</span> : `₹${Number(p.price).toFixed(0)}`,
    },
    { key: 'downloads', label: 'Downloads' },
    {
      key: 'is_free', label: 'Type',
      render: (p: any) => p.is_free
        ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Free</span>
        : <span style={{ color: 'var(--color-text-2)' }}>Paid</span>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>PDFs</h2>
        <button onClick={() => navigate('/pdfs/new')} style={addBtnStyle}>+ New PDF</button>
      </div>
      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={pdfs}
          keyField="id"
          onEdit={item => navigate(`/pdfs/${item.id}/edit`)}
          onDelete={item => setDeleteId(item.id)}
          searchPlaceholder="Search PDFs..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete PDF"
        message="Are you sure? This will also delete all purchases for this PDF."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

const addBtnStyle: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-4)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
