import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PDFViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  const watermarkText = user?.email;

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('neet_zyme_token');
    fetch(`${API_BASE}/pdfs/${id}/watermarked`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (res.status === 403) throw new Error('Please purchase this PDF to view it');
        if (res.status === 404) throw new Error('PDF not found');
        if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);
        const contentDisp = res.headers.get('content-disposition') || '';
        const match = contentDisp.match(/filename="?(.+?)"?$/);
        if (match) setTitle(match[1].replace(/\.pdf$/i, ''));
        return res.arrayBuffer();
      })
      .then(buffer => { setPdfBytes(buffer); setLoading(false); })
      .catch(err => {
        api.logError('PDFViewer', err);
        setError(err.message || 'Failed to load the PDF.');
        setLoading(false);
      });
  }, [id]);

  const pdfSource = useMemo(
    () => pdfBytes ? { data: pdfBytes } : null,
    [pdfBytes]
  );

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    api.logError('PDFViewer.Document', err);
    setError('This PDF could not be loaded. It may be corrupted or unavailable.');
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 16, marginBottom: 'var(--space-4)' }}>{error}</p>
          <Link to="/pdfs" className="btn btn-outline">Back to PDFs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a1a', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-5)', background: '#222',
        borderBottom: '1px solid #333',
      }}>
        <Link to={`/pdfs/${id}`} style={{ color: '#999', fontSize: 14 }}>&larr; Back</Link>
        <span style={{ color: '#ccc', fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'center' }}>
          {title}
        </span>
        {numPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18 }}
            >&lt;</button>
            <span style={{ color: '#999', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18 }}
            >&gt;</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
          title="Zoom out">A-</button>
          <span style={{ color: '#999', fontSize: 12, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.1))}
            style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }}
          title="Zoom in">A+</button>
        </div>
      </div>

      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{
          flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-4)', position: 'relative', userSelect: 'none',
        }}
      >
        <style>{`
          @media print { .pdf-viewer-wrapper { display: none !important; } }
          .pdf-viewer-wrapper .react-pdf__Page__canvas { display: block; margin: 0 auto; }
        `}</style>

        <div className="pdf-viewer-wrapper" style={{ position: 'relative', maxWidth: '100%' }}>
          <Document
            file={pdfSource}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            }
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                <span style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 40,
                  fontWeight: 'bold',
                  color: 'rgba(255, 0, 0, 0.15)',
                  transform: 'rotate(-45deg)',
                  whiteSpace: 'nowrap',
                }}>
                  {watermarkText}
                </span>
              </div>
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
