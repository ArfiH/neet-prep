import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';
import PDFCard from '../components/PDFCard';

type PDF = {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  category: string | null;
  class: string | null;
};

export default function Purchased() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPurchasedPdfs()
      .then(data => setPdfs(data || []))
      .catch(err => { api.logError('Purchased.fetch', err); setError('Could not load purchased PDFs.'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>My Purchased PDFs</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
          {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} purchased
        </p>

        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <div className="spinner" />
          </div>
        ) : pdfs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>No purchased PDFs yet</p>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-4)' }}>
              Browse PDFs and purchase the ones you need.
            </p>
            <Link to="/pdfs" className="btn btn-primary">Browse PDFs</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
            {pdfs.map(pdf => (
              <PDFCard key={pdf.id} pdf={pdf} owned={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
