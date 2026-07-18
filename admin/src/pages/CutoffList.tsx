import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { getCutoffs, deleteCutoff, bulkDeleteCutoffs, getCategories } from '../lib/api';
import { Upload, Trash2 } from 'lucide-react';

export default function CutoffList() {
  const navigate = useNavigate();
  const [cutoffs, setCutoffs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getCutoffs(), getCategories()])
      .then(([c, cats]) => { setCutoffs(c); setCategories(cats); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteCutoffs([...selectedIds] as number[]);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
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

  const getValue = (cutoff: any, catId: number) => {
    const v = (cutoff.values || []).find((x: any) => x.category_id === catId);
    return v ? renderRank(v.rank, v.marks) : '—';
  };

  const baseColumns = [
    { key: 'college_name', label: 'College' },
    { key: 'year', label: 'Year' },
  ];

  const categoryColumns = categories.map(cat => ({
    key: `cat_${cat.id}`,
    label: cat.name,
    render: (c: any) => getValue(c, cat.id),
  }));

  const columns = [...baseColumns, ...categoryColumns];

  return (
    <div>
      <div className="flex-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Cutoffs</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.size > 0 && (
            <button onClick={() => setBulkDeleteOpen(true)} style={bulkDeleteBtnStyle}>
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </button>
          )}
          <button onClick={() => navigate('/cutoffs/import')} style={importBtnStyle}><Upload size={14} /> Import CSV</button>
          <button onClick={() => navigate('/cutoffs/new')} style={addBtnStyle}>+ New Cutoff</button>
        </div>
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
          onSelectChange={setSelectedIds}
          selectedValues={selectedIds}
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
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} Cutoffs`}
        message={`Are you sure you want to delete ${selectedIds.size} cutoff entr${selectedIds.size === 1 ? 'y' : 'ies'}?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
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

const bulkDeleteBtnStyle: React.CSSProperties = {
  ...addBtnStyle,
  background: 'var(--color-danger)',
  color: '#fff',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
