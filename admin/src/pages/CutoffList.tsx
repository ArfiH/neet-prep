import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCutoffs, deleteCutoff } from '../lib/api';

export default function CutoffList() {
  const navigate = useNavigate();
  const [cutoffs, setCutoffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getCutoffs().then(setCutoffs).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCutoff(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  const renderRank = (rank: number, marks: number | null) => {
    if (rank === 999999) return '—';
    const parts = [rank.toLocaleString()];
    if (marks != null) parts.push(`(${marks})`);
    return parts.join(' ');
  };

  const columns = [
    { key: 'college_name', label: 'College' },
    { key: 'year', label: 'Year' },
    {
      key: 'general_rank', label: 'General',
      render: (c: any) => renderRank(c.general_rank, c.general_marks),
    },
    {
      key: 'obc_rank', label: 'OBC',
      render: (c: any) => renderRank(c.obc_rank, c.obc_marks),
    },
    {
      key: 'sc_rank', label: 'SC',
      render: (c: any) => renderRank(c.sc_rank, c.sc_marks),
    },
    {
      key: 'st_rank', label: 'ST',
      render: (c: any) => renderRank(c.st_rank, c.st_marks),
    },
  ];

  return (
    <div>
      <div className="flex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Cutoffs</h2>
        <button onClick={() => navigate('/cutoffs/new')} style={addBtnStyle}>+ New Cutoff</button>
      </div>
      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={cutoffs}
          keyField="id"
          onEdit={item => navigate(`/cutoffs/${item.id}/edit`)}
          onDelete={item => setDeleteId(item.id)}
          searchPlaceholder="Search cutoffs..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Cutoff"
        message="Are you sure you want to delete this cutoff entry?"
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
