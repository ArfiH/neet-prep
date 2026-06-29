import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { formatPrice } from '../lib/api';

type PDF = {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  category: string | null;
  class: string | null;
  cover_image_url?: string;
};

const SUBJECT_COLORS: Record<string, string> = {
  Biology: '#2ea86e',
  Physics: '#4a7dff',
  Chemistry: '#d4a017',
  Botany: '#2ea86e',
  Zoology: '#e05a5a',
  PYQ: '#8b5cf6',
};

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || '#2ea86e';
}

export default function PDFCard({ pdf, owned = false }: { pdf: PDF; owned?: boolean }) {
  const color = getSubjectColor(pdf.subject);
  const [imgError, setImgError] = useState(false);
  const showCover = pdf.cover_image_url && !imgError;

  return (
    <Link to={`/pdfs/${pdf.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Cover image or 4px accent bar */}
        {showCover ? (
          <img
            src={pdf.cover_image_url}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: 120, objectFit: 'cover',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              background: color,
            }}
          />
        ) : (
          <div style={{ height: 4, background: color }} />
        )}

        {/* Content */}
        <div style={{ padding: 'var(--space-4) var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
            {pdf.subject}{pdf['class'] ? ` · ${pdf['class']}` : ''}{pdf.category ? ` · ${pdf.category}` : ''}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--color-text)', margin: 0 }}>
            {pdf.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--color-text-3)' }}>
              <FileText size={14} /> {pdf.pages_count} pages
            </div>
            {pdf.is_free ? (
              <span className="pill pill-free" style={{ padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>FREE</span>
            ) : owned ? (
              <span className="pill pill-owne" style={{ padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>OWNED</span>
            ) : (
              <span className="pill pill-paid" style={{ padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>₹{formatPrice(pdf.price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
