import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCutoffs, createCutoff, updateCutoff, getColleges, getCategories } from '../lib/api';

export default function CutoffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [colleges, setColleges] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collegeId, setCollegeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [values, setValues] = useState<Record<number, { rank: string; marks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getColleges().then(setColleges).catch(() => {});
    getCategories().then(cats => {
      setCategories(cats);
      if (!isEdit || !id) {
        const init: Record<number, { rank: string; marks: string }> = {};
        for (const c of cats) {
          init[c.id] = { rank: '999999', marks: '' };
        }
        setValues(init);
        return;
      }
      getCutoffs().then(all => {
        const cutoff = all.find((c: any) => c.id === Number(id));
        if (cutoff) {
          setCollegeId(String(cutoff.college_id));
          setYear(String(cutoff.year));
          const vals: Record<number, { rank: string; marks: string }> = {};
          for (const c of cats) {
            const found = (cutoff.values || []).find((v: any) => v.category_id === c.id);
            vals[c.id] = {
              rank: found ? String(found.rank) : '999999',
              marks: found && found.marks != null ? String(found.marks) : '',
            };
          }
          setValues(vals);
        }
      }).catch(e => setError(e.message));
    }).catch(() => {});
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const vals = categories.map(c => ({
        category_id: c.id,
        rank: parseInt(values[c.id]?.rank) || 999999,
        marks: values[c.id]?.marks ? parseInt(values[c.id].marks) : null,
      }));
      const data = {
        college_id: parseInt(collegeId),
        year: parseInt(year),
        values: vals,
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

  const setVal = (catId: number, field: 'rank' | 'marks', val: string) => {
    setValues(prev => ({ ...prev, [catId]: { ...prev[catId], [field]: val } }));
  };

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
          <select value={collegeId} onChange={e => setCollegeId(e.target.value)} style={inputStyle}>
            <option value="">Select college...</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Year" required>
          <select value={year} onChange={e => setYear(e.target.value)} style={inputStyle}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </FormField>
        {categories.map(cat => (
          <div key={cat.id} className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label={`${cat.name} Rank`}>
              <input type="number" min="0" value={values[cat.id]?.rank || '999999'} onChange={e => setVal(cat.id, 'rank', e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label={`${cat.name} Marks`}>
              <input type="number" min="0" max="720" value={values[cat.id]?.marks || ''} onChange={e => setVal(cat.id, 'marks', e.target.value)} style={inputStyle} placeholder="Optional" />
            </FormField>
          </div>
        ))}
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
