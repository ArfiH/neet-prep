import { useEffect, useState, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Check } from 'lucide-react';
import { getPdf, createPdf, updatePdf, uploadPdfWithProgress } from '../lib/api';

const SUBJECTS = ['Biology', 'Physics', 'Chemistry', 'Practice'];
const CATEGORIES = ['', 'Notes', 'Short notes', 'Formulae', 'Questions', 'PYQs', 'NCERT Highlights', 'Book'];

export default function PdfForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', subject: 'Biology', author: '',
    price: '0', is_free: true, is_deliverable: false, cover_image_url: '', file_url: '',
    pages_count: '0', tags: '', details: '', class: '', category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(-1); // -1 = idle, 0-99 uploading, 100 = done
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && id) {
      getPdf(Number(id)).then(pdf => {
        setForm({
          title: pdf.title,
          description: pdf.description || '',
          subject: pdf.subject,
          author: pdf.author || '',
          price: String(Number(pdf.price).toFixed(0)),
          is_free: pdf.is_free,
          is_deliverable: pdf.is_deliverable,
          cover_image_url: pdf.cover_image_url || '',
          file_url: pdf.file_url || '',
          pages_count: String(pdf.pages_count || 0),
          tags: Array.isArray(pdf.tags) ? pdf.tags.join(', ') : '',
          details: Array.isArray(pdf.details) ? pdf.details.join('\n') : '',
          class: pdf.class || '',
          category: pdf.category || '',
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
        price: form.is_free ? 0 : parseFloat(form.price) || 0,
        pages_count: parseInt(form.pages_count) || 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        details: form.details.split('\n').map(t => t.trim()).filter(Boolean),
        category: form.category,
      };
      if (isEdit && id) {
        await updatePdf(Number(id), data);
      } else {
        await createPdf(data);
      }
      navigate('/pdfs');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleUpload = async () => {
    if (!selectedFile) return;
    console.log('[Upload] User initiated upload for:', selectedFile.name);
    setUploadProgress(0);
    setError('');
    setUploadSuccess(false);
    try {
      const result = await uploadPdfWithProgress(selectedFile, (pct) => setUploadProgress(pct));
      update('file_url', result.file_url);
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      console.error('[Upload] Failed:', e.message);
      setError(e.message);
      setUploadProgress(-1);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-5)' }}>
        {isEdit ? 'Edit PDF' : 'New PDF'}
      </h2>
      {error && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 600 }}>
        <FormField label="Title" required>
          <input value={form.title} onChange={e => update('title', e.target.value)} style={inputStyle} placeholder="PDF title" />
        </FormField>
        <FormField label="Description">
          <textarea value={form.description} onChange={e => update('description', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Description" />
        </FormField>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Subject" required>
            <select value={form.subject} onChange={e => update('subject', e.target.value)} style={inputStyle}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Class">
            <select value={form.class} onChange={e => update('class', e.target.value)} style={inputStyle}>
              <option value="">None</option>
              <option value="11">11th</option>
              <option value="12">12th</option>
            </select>
          </FormField>
          <FormField label="Category">
            <select value={form.category} onChange={e => update('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || 'None'}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <FormField label="Price (₹)">
            <input type="number" min="0" value={form.price} onChange={e => update('price', e.target.value)} disabled={form.is_free} style={{ ...inputStyle, opacity: form.is_free ? 0.5 : 1 }} />
          </FormField>
          <FormField label="Pages">
            <input type="number" min="0" value={form.pages_count} onChange={e => update('pages_count', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
        <FormField label="Free PDF">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_free} onChange={e => update('is_free', e.target.checked)} style={{ width: 16, height: 16 }} />
            Mark as free
          </label>
        </FormField>
        <FormField label="Physical Delivery">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_deliverable} onChange={e => update('is_deliverable', e.target.checked)} style={{ width: 16, height: 16 }} />
            Can be delivered (physical copy available)
          </label>
        </FormField>
        <FormField label="Upload PDF">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => {
                  setSelectedFile(e.target.files?.[0] || null);
                  setUploadProgress(-1);
                  setUploadSuccess(false);
                }}
                style={{ flex: 1, fontSize: 13, color: 'var(--color-text)' }}
                disabled={uploadProgress >= 0 && uploadProgress < 100}
              />
              {uploadProgress === -1 || uploadProgress === 100 ? (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: 'var(--space-1) var(--space-3)',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    background: selectedFile ? 'var(--color-accent)' : 'var(--color-border)',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: selectedFile ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {uploadSuccess ? <Check size={14} /> : <Upload size={14} />}
                  {uploadSuccess ? 'Uploaded' : 'Upload'}
                </button>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
                  {uploadProgress}%
                </span>
              )}
            </div>
            {uploadProgress >= 0 && uploadProgress < 100 && (
              <div style={{
                marginTop: 'var(--space-1)',
                height: 6,
                borderRadius: 3,
                background: 'var(--color-paper-3)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            )}
            {uploadSuccess && (
              <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 'var(--space-1)' }}>
                ✓ File uploaded — URL filled below
              </div>
            )}
          </div>
        </FormField>
        <FormField label="File URL">
          <input value={form.file_url} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed', background: 'var(--color-paper-3)' }} placeholder="Auto-filled on upload" />
        </FormField>
        <FormField label="Cover Image URL">
          <input value={form.cover_image_url} onChange={e => update('cover_image_url', e.target.value)} style={inputStyle} placeholder="https://..." />
        </FormField>
        <FormField label="Tags (comma-separated)">
          <input value={form.tags} onChange={e => update('tags', e.target.value)} style={inputStyle} placeholder="NEET, Biology, Revision" />
        </FormField>
        <FormField label="Details (one per line)">
          <textarea value={form.details} onChange={e => update('details', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Chapter-wise breakdown&#10;10 years PYQs&#10;80+ diagrams" />
        </FormField>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => navigate('/pdfs')} style={cancelBtnStyle}>Cancel</button>
          <button type="submit" disabled={loading} style={{ ...submitBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Update PDF' : 'Create PDF'}
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
