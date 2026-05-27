import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import PDFCard from '../components/PDFCard';

type PDF = {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  category: string | null;
};

const SUBJECTS = ['Biology', 'Physics', 'Chemistry'];
const FILTERS = ['all', 'free', 'paid'] as const;

export default function PDFs() {
  const { isLoggedIn } = useAuth();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      api.getPdfs(),
      isLoggedIn ? api.getPurchasedPdfs().catch(() => []) : Promise.resolve([]),
    ])
      .then(([pdfData, purchased]) => {
        setPdfs(pdfData);
        if (purchased && Array.isArray(purchased)) {
          setPurchasedIds(new Set(purchased.map((p: any) => String(p.id))));
        }
      })
      .catch(err => { api.logError('PDFs.fetch', err); setError('Failed to load PDFs.'); })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const uniqueSubjects = useMemo(
    () => [...new Set(pdfs.map(p => p.subject))].sort(),
    [pdfs]
  );

  const uniqueCategories = useMemo(
    () => [...new Set(pdfs.map(p => p.category).filter(Boolean))] as string[],
    [pdfs]
  );

  const filtered = useMemo(() => {
    let result = [...pdfs];

    if (activeSubject) result = result.filter(p => p.subject === activeSubject);
    if (activeFilter === 'free') result = result.filter(p => p.is_free);
    if (activeFilter === 'paid') result = result.filter(p => !p.is_free);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pdfs, activeSubject, activeFilter, searchQuery]);

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Browse PDFs</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
          {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} available
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search PDFs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: 'var(--space-3) var(--space-4)',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            fontSize: 14, outline: 'none', marginBottom: 'var(--space-4)',
            color: 'var(--color-text)', background: 'var(--color-paper-2)',
          }}
        />

        {/* Subject Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
          {uniqueSubjects.map(subj => (
            <button
              key={subj}
              onClick={() => setActiveSubject(activeSubject === subj ? null : subj)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)',
                background: activeSubject === subj ? 'var(--color-accent)' : 'var(--color-paper-2)',
                color: activeSubject === subj ? '#fff' : 'var(--color-text-2)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        {uniqueCategories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            {uniqueCategories.map(cat => (
              <span key={cat} style={{
                padding: '4px 12px', borderRadius: 999,
                background: 'var(--color-paper-3)', color: 'var(--color-text-2)',
                fontSize: 12, fontWeight: 500,
              }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Availability Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '7px 18px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)',
                background: activeFilter === f ? 'var(--color-accent)' : 'var(--color-paper-2)',
                color: activeFilter === f ? '#fff' : 'var(--color-text-2)',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {/* PDF Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-3)' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No PDFs found</p>
            <p style={{ fontSize: 14 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
            {filtered.map(pdf => (
              <PDFCard key={pdf.id} pdf={pdf} owned={purchasedIds.has(String(pdf.id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
