import { useEffect, useState, useRef } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    getCategories().then(setCategories).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (showAddDialog && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddDialog]);

  const handleCreate = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    try {
      await createCategory({ name: addName.trim() });
      setAddName('');
      setShowAddDialog(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    try {
      await updateCategory(id, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCategory(deleteId);
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Categories</h2>
        <button onClick={() => { setAddName(''); setShowAddDialog(true); }} style={addBtnStyle}>+ New Category</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>
      ) : categories.length === 0 ? (
        <div style={{ color: 'var(--color-text-3)', padding: 'var(--space-4)', textAlign: 'center' }}>No categories yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-paper)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {editingId === cat.id ? (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1 }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      flex: 1, maxWidth: 250,
                      padding: '4px 8px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13, outline: 'none',
                      color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    }}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(cat.id); if (e.key === 'Escape') { setEditingId(null); setEditName(''); } }}
                  />
                  <button onClick={() => handleUpdate(cat.id)} style={smallBtnStyle}>Save</button>
                  <button onClick={() => { setEditingId(null); setEditName(''); }} style={{ ...smallBtnStyle, color: 'var(--color-text-3)' }}>Cancel</button>
                </div>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{cat.name}</span>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} style={smallBtnStyle}>Edit</button>
                  <button onClick={() => setDeleteId(cat.id)} style={{ ...smallBtnStyle, color: 'var(--color-danger)' }}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      {showAddDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }} onClick={() => setShowAddDialog(false)}>
          <div style={{
            background: 'var(--color-paper)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            minWidth: 340,
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 var(--space-4) 0', color: 'var(--color-text)' }}>New Category</h3>
            <input
              ref={addInputRef}
              type="text"
              placeholder="Category name..."
              value={addName}
              onChange={e => setAddName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowAddDialog(false); }}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13, outline: 'none',
                color: 'var(--color-text)', background: 'var(--color-paper-2)',
                marginBottom: 'var(--space-4)',
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddDialog(false)}
                style={{
                  padding: 'var(--space-2) var(--space-5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--color-text-2)',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleCreate}
                disabled={adding || !addName.trim()}
                style={{
                  padding: 'var(--space-2) var(--space-5)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: addName.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                  color: addName.trim() ? '#fff' : 'var(--color-text-3)',
                  fontSize: 13, fontWeight: 600,
                  cursor: addName.trim() ? 'pointer' : 'default',
                }}
              >{adding ? 'Adding...' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Category"
        message="Are you sure? This will also delete all cutoff values for this category."
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

const smallBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  color: 'var(--color-text-2)',
};
