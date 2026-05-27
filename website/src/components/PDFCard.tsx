import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/api';

type PDF = {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  category: string | null;
};

const SUBJECT_COLORS: Record<string, { bg: string; glyph: string; letter: string }> = {
  Biology: { bg: '#f0faf0', glyph: '#2ea86e', letter: 'B' },
  Physics: { bg: '#f0f4ff', glyph: '#4a7dff', letter: 'P' },
  Chemistry: { bg: '#fef8e7', glyph: '#d4a017', letter: 'C' },
  Botany: { bg: '#f0faf0', glyph: '#2ea86e', letter: 'Z' },
  Zoology: { bg: '#fef0f0', glyph: '#e05a5a', letter: 'A' },
  PYQ: { bg: '#f5f0ff', glyph: '#8b5cf6', letter: 'PY' },
};

function getSubjectStyle(subject: string) {
  return SUBJECT_COLORS[subject] || { bg: '#f0faf0', glyph: '#2ea86e', letter: subject.charAt(0) };
}

const GRADE_COLORS = ['#2ea86e', '#4a7dff', '#d4a017', '#e05a5a', '#8b5cf6', '#e67e22'];

export default function PDFCard({ pdf, owned = false }: { pdf: PDF; owned?: boolean }) {
  const style = getSubjectStyle(pdf.subject);
  const borderColor = GRADE_COLORS[Math.floor(Math.random() * GRADE_COLORS.length)];

  const priceTag = pdf.is_free
    ? <span className="pill pill-free">FREE</span>
    : owned
      ? <span className="pill pill-owne">OWNED</span>
      : <span className="pill pill-paid">₹{formatPrice(pdf.price)}</span>;

  return (
    <Link to={`/pdfs/${pdf.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Color bar header with glyph */}
        <div style={{ background: `linear-gradient(135deg, ${style.bg}, ${style.bg}88)`, padding: 'var(--space-4) var(--space-5)', position: 'relative', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: style.glyph,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: 'var(--font-mono)',
            marginBottom: 'var(--space-2)',
          }}>
            {style.letter}
          </div>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 'inherit', pointerEvents: 'none', borderLeft: `4px solid ${borderColor}` }} />
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {pdf.subject}{pdf.category ? ` · ${pdf.category}` : ''}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--color-text)', margin: 0 }}>
            {pdf.title}
          </h3>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 'auto' }}>
            {pdf.pages_count} pages
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-1)' }}>
            {priceTag}
          </div>
        </div>
      </div>
    </Link>
  );
}
