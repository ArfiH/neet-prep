import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getColleges, deleteCollege } from '../lib/api';
import { Upload } from 'lucide-react';

export default function CollegeList() {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getColleges().then(setColleges).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCollege(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'type', label: 'Type' },
    {
      key: 'total_seats', label: 'Seats',
      render: (c: any) => c.total_seats?.toLocaleString() || '—',
    },
  ];

  return (
    <div>
      <div className="flex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Colleges</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/colleges/import')} style={importBtnStyle}><Upload size={14} /> Import CSV</button>
          <button onClick={() => navigate('/colleges/new')} style={addBtnStyle}>+ New College</button>
        </div>
      </div>
      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={colleges}
          keyField="id"
          onEdit={item => navigate(`/colleges/${item.id}/edit`)}
          onDelete={item => setDeleteId(item.id)}
          searchPlaceholder="Search colleges..."
        />
      )}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete College"
        message="Are you sure? This will also delete all cutoffs for this college."
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

const importBtnStyle: React.CSSProperties = {
  ...addBtnStyle,
  background: 'var(--color-paper-2)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
