import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { importColleges } from '../lib/api';
import { Upload, FileText, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function CollegeImport() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imported: number; errors: { row: string; reason: string }[] } | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) { setError('Please select a .csv file'); return; }
    setFile(f);
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
      const rows = lines.map(l => l.split(',').map(v => v.replace(/^"|"$/g, '').trim()));
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await importColleges(file);
      setResult({ imported: res.imported, errors: res.errors || [] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)' }}>
        <button onClick={() => navigate('/colleges')} style={backBtnStyle}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Import Colleges from CSV</h2>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 'var(--space-4)', fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          Upload a CSV file with college data. Required columns: <strong>name</strong>, <strong>state</strong>.
          Optional columns: city, type, total_seats, tuition_fee_annual, hostel_fee_annual, other_charges,
          official_website, contact_phone, established_year, accreditation, image_url.
          <br /><br />
          Existing colleges (same name + state) are skipped automatically.
        </div>

        {!result && (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
              padding: 40, textAlign: 'center', cursor: 'pointer',
              background: file ? 'var(--color-paper-2)' : 'transparent',
              marginBottom: 'var(--space-4)',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <FileText size={32} style={{ color: 'var(--color-accent)', marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: 'var(--color-text-3)', marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-2)' }}>Click to select CSV file</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>or drag and drop</div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>{error}</div>
        )}

        {preview.length > 1 && !result && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 'var(--space-2)' }}>Preview (first {preview.length - 1} rows)</div>
            <div style={{ overflowX: 'auto', fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-paper-2)' }}>
                    {preview[0]?.map((h, i) => <th key={i} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1).map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {row.map((cell, ci) => <td key={ci} style={{ padding: '6px 10px', color: 'var(--color-text-2)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!result && file && (
          <button onClick={handleImport} disabled={loading} style={{ ...importBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Importing...' : 'Import Colleges'}
          </button>
        )}

        {result && (
          <div>
            <div style={{
              padding: 'var(--space-4)',
              background: result.imported > 0 ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {result.imported > 0 ? <CheckCircle size={20} color="var(--color-success)" /> : <XCircle size={20} color="var(--color-warning)" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Imported {result.imported} college{result.imported !== 1 ? 's' : ''}</div>
                {result.errors.length > 0 && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{result.errors.length} issue{result.errors.length !== 1 ? 's' : ''}</div>}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 'var(--space-2)' }}>Issues</div>
                <div style={{ fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-paper-2)' }}>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Row</th>
                        <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '6px 10px', color: 'var(--color-text-2)' }}>{e.row}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--color-danger)' }}>{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setFile(null); setPreview([]); setResult(null); }} style={secondaryBtnStyle}>Import Another</button>
              <button onClick={() => navigate('/colleges')} style={primaryBtnStyle}>View Colleges</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: 'var(--color-paper-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--color-text-2)',
};

const importBtnStyle: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-5)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-5)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: 'var(--color-paper-2)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-2) var(--space-5)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
