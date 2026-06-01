import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
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

const SUBJECTS = ['Biology', 'Physics', 'Chemistry'];
const FILTERS = ['all', 'free', 'paid'] as const;

export default function PDFs() {
  const { isLoggedIn } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(['subject', 'category', 'class', 'availability'])
  );
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  const hasActiveFilters = activeSubject !== null || activeCategory !== null || activeClass !== null || activeFilter !== 'all' || searchQuery.trim() !== '';

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
  const uniqueClasses = useMemo(
    () => [...new Set(pdfs.map(p => p['class']).filter(Boolean))] as string[],
    [pdfs]
  );

  const filtered = useMemo(() => {
    let result = [...pdfs];

    if (activeSubject) result = result.filter(p => p.subject === activeSubject);
    if (activeCategory) result = result.filter(p => p.category === activeCategory);
    if (activeClass) result = result.filter(p => p['class'] === activeClass);
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
  }, [pdfs, activeSubject, activeCategory, activeClass, activeFilter, searchQuery]);

  const sectionBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-border)',
    background: isActive ? 'var(--color-accent)' : 'var(--color-paper-2)',
    color: isActive ? '#fff' : 'var(--color-text-2)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  });

  const chipBtnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 999,
    border: '1.5px solid var(--color-border)',
    background: isActive ? 'var(--color-accent)' : 'var(--color-paper-2)',
    color: isActive ? '#fff' : 'var(--color-text-2)',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  });

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const sectionArrowStyle: React.CSSProperties = {
    fontSize: 10,
    lineHeight: 1,
    transition: 'transform var(--transition-fast)',
  };

  function toggleSection(section: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function clearFilters() {
    setActiveSubject(null);
    setActiveCategory(null);
    setActiveClass(null);
    setActiveFilter('all');
    setSearchQuery('');
  }

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container">
        {/* Header */}
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Browse PDFs</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <p style={{ fontSize: 15, color: 'var(--color-text-2)' }}>
            {filtered.length} of {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
          </p>
          <span className="pill pill-free">{filtered.filter(p => p.is_free).length} FREE</span>
          <span className="pill pill-paid">{filtered.filter(p => !p.is_free).length} PAID</span>
        </div>

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

        {/* Subject Section */}
        <button onClick={() => toggleSection('subject')} style={sectionHeaderStyle}>
          <span style={sectionArrowStyle}>{expandedSections.has('subject') ? '▾' : '▸'}</span>
          Subject
        </button>
        {expandedSections.has('subject') && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            {uniqueSubjects.map(subj => (
              <button
                key={subj}
                onClick={() => setActiveSubject(activeSubject === subj ? null : subj)}
                style={sectionBtnStyle(activeSubject === subj)}
              >
                {subj}
              </button>
            ))}
          </div>
        )}

        {/* Category Section */}
        {uniqueCategories.length > 0 && (
          <>
            <button onClick={() => toggleSection('category')} style={sectionHeaderStyle}>
              <span style={sectionArrowStyle}>{expandedSections.has('category') ? '▾' : '▸'}</span>
              Category
            </button>
            {expandedSections.has('category') && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    style={chipBtnStyle(activeCategory === cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Class Section */}
        {uniqueClasses.length > 0 && (
          <>
            <button onClick={() => toggleSection('class')} style={sectionHeaderStyle}>
              <span style={sectionArrowStyle}>{expandedSections.has('class') ? '▾' : '▸'}</span>
              Class
            </button>
            {expandedSections.has('class') && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                {uniqueClasses.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setActiveClass(activeClass === cls ? null : cls)}
                    style={sectionBtnStyle(activeClass === cls)}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Availability Section */}
        <button onClick={() => toggleSection('availability')} style={sectionHeaderStyle}>
          <span style={sectionArrowStyle}>{expandedSections.has('availability') ? '▾' : '▸'}</span>
          Availability
        </button>
        {expandedSections.has('availability') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-4)' }}>
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={chipBtnStyle(activeFilter === f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: 'var(--color-accent)',
              padding: 0, marginBottom: 'var(--space-4)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.03em',
            }}
          >
            Clear all filters
          </button>
        )}

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
