import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCutoffs, createCutoff, updateCutoff, getColleges } from '../lib/api';

export default function CutoffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [colleges, setColleges] = useState<any[]>([]);
  const [form, setForm] = useState({
    college_id: '', year: new Date().getFullYear().toString(),
    general_rank: '999999', obc_rank: '999999', sc_rank: '999999', st_rank: '999999',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getColleges().then(setColleges).catch(() => {});
    if (isEdit && id) {
      getCutoffs().then(all => {
        const cutoff = all.find((c: any) => c.id === Number(id));
        if (cutoff) {
          setForm({
            college_id: String(cutoff.college_id),
            year: String(cutoff.year),
            general_rank: String(cutoff.general_rank || 999999),
            obc_rank: String(cutoff.obc_rank || 999999),
            sc_rank: String(cutoff.sc_rank || 999999),
            st_rank: String(cutoff.st_rank || 999999),
          });
        }
      }).catch(e => setError(e.message));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        college_id: parseInt(form.college_id),
        year: parseInt(form.year),
        general_rank: parseInt(form.general_rank) || 999999,
        obc_rank: parseInt(form.obc_rank) || 999999,
        sc_rank: parseInt(form.sc_rank) || 999999,
        st_rank: parseInt(form.st_rank) || 999999,
      };
      if (isEdit && id) {
        await updateCutoff(Number(id), data);
      } else {
        await createCutoff(data);
      }
      navigate('/cutoffs');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const yearOptions = [];
  for (let y = 2030; y >= 2015; y--) yearOptions.push(y);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-5)' }}>
        {isEdit ? 'Edit Cutoff' : 'New Cutoff'}
      </h2>
      {error && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 500 }}>
        <FormField label="College" required>
          <select value={form.college_id} onChange={e => update('college_id', e.target.value)} style={inputStyle}>
            <option value="">Select college...</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Year" required>
          <select value={form.year} onChange={e => update('year', e.target.value)} style={inputStyle}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="General Rank">
            <input type="number" min="0" value={form.general_rank} onChange={e => update('general_rank', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="OBC Rank">
            <input type="number" min="0" value={form.obc_rank} onChange={e => update('obc_rank', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="SC Rank">
            <input type="number" min="0" value={form.sc_rank} onChange={e => update('sc_rank', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="ST Rank">
            <input type="number" min="0" value={form.st_rank} onChange={e => update('st_rank', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => navigate('/cutoffs')} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Update Cutoff' : 'Create Cutoff'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  outline: 'none',
  color: 'var(--color-text)',
  background: 'var(--color-paper-2)',
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--color-text-2)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-5)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-accent)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
