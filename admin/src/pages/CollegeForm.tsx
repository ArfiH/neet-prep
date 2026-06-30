import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCollege, createCollege, updateCollege } from '../lib/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];

const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Central University', 'State University'];

export default function CollegeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', state: 'Delhi', city: '', type: 'Government',
    total_seats: '0', tuition_fee_annual: '0', hostel_fee_annual: '0',
    other_charges: '0', official_website: '', contact_phone: '',
    established_year: '', accreditation: '', facilities: '', image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      getCollege(Number(id)).then(c => {
        setForm({
          name: c.name, state: c.state, city: c.city || '', type: c.type || 'Government',
          total_seats: String(c.total_seats || 0),
          tuition_fee_annual: String(Number(c.tuition_fee_annual || 0).toFixed(0)),
          hostel_fee_annual: String(Number(c.hostel_fee_annual || 0).toFixed(0)),
          other_charges: String(Number(c.other_charges || 0).toFixed(0)),
          official_website: c.official_website || '', contact_phone: c.contact_phone || '',
          established_year: c.established_year ? String(c.established_year) : '',
          accreditation: c.accreditation || '',
          facilities: Array.isArray(c.facilities) ? c.facilities.join(', ') : '',
          image_url: c.image_url || '',
        });
      }).catch(e => setError(e.message));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        ...form,
        total_seats: parseInt(form.total_seats) || 0,
        tuition_fee_annual: parseFloat(form.tuition_fee_annual) || 0,
        hostel_fee_annual: parseFloat(form.hostel_fee_annual) || 0,
        other_charges: parseFloat(form.other_charges) || 0,
        established_year: form.established_year ? parseInt(form.established_year) : null,
        facilities: form.facilities.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (isEdit && id) {
        await updateCollege(Number(id), data);
      } else {
        await createCollege(data);
      }
      navigate('/colleges');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-5)' }}>
        {isEdit ? 'Edit College' : 'New College'}
      </h2>
      {error && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 600 }}>
        <FormField label="Name" required>
          <input value={form.name} onChange={e => update('name', e.target.value)} style={inputStyle} />
        </FormField>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="State" required>
            <select value={form.state} onChange={e => update('state', e.target.value)} style={inputStyle}>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="City">
            <input value={form.city} onChange={e => update('city', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Type">
            <select value={form.type} onChange={e => update('type', e.target.value)} style={inputStyle}>
              {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Total Seats">
            <input type="number" min="0" value={form.total_seats} onChange={e => update('total_seats', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Tuition Fee (₹)">
            <input type="number" min="0" value={form.tuition_fee_annual} onChange={e => update('tuition_fee_annual', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Hostel Fee (₹)">
            <input type="number" min="0" value={form.hostel_fee_annual} onChange={e => update('hostel_fee_annual', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Other Charges (₹)">
            <input type="number" min="0" value={form.other_charges} onChange={e => update('other_charges', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Website">
            <input value={form.official_website} onChange={e => update('official_website', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Phone">
            <input value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Est. Year">
            <input type="number" min="1800" max="2100" value={form.established_year} onChange={e => update('established_year', e.target.value)} style={inputStyle} />
          </FormField>
          <FormField label="Accreditation">
            <input value={form.accreditation} onChange={e => update('accreditation', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <FormField label="Facilities (comma-separated)">
          <input value={form.facilities} onChange={e => update('facilities', e.target.value)} style={inputStyle} placeholder="Library, Hostel, Sports" />
        </FormField>
        <FormField label="Image URL">
          <input value={form.image_url} onChange={e => update('image_url', e.target.value)} style={inputStyle} />
        </FormField>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => navigate('/colleges')} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Update College' : 'Create College'}
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
