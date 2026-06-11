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
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number | undefined>();
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1a1a1a' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1a1a1a' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 16, marginBottom: 'var(--space-4)' }}>{error}</p>
          <Link to="/pdfs" className="btn btn-outline">Back to PDFs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a1a', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{
          flex: 1, overflow: 'auto', position: 'relative',
        }}
      >
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          padding: isMobile ? '8px var(--space-3)' : '10px var(--space-5)',
          background: 'rgba(26, 26, 26, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Link to={`/pdfs/${id}`} style={{ color: '#999', fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>&larr; Back</Link>
          <span style={{ color: '#ccc', fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {numPages > 0 && (
            <span style={{ color: '#555', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {numPages}p
            </span>
          )}
          <div style={{
            display: 'flex', gap: 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8, padding: 2, alignItems: 'center',
          }}>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              style={{
                background: 'none', border: 'none', color: '#ccc', cursor: 'pointer',
                borderRadius: 6, padding: '4px 9px', fontSize: 17, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            title="Zoom out">−</button>
            <span style={{ color: '#999', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '0 5px', minWidth: 36, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.1))}
              style={{
                background: 'none', border: 'none', color: '#ccc', cursor: 'pointer',
                borderRadius: 6, padding: '4px 9px', fontSize: 17, lineHeight: 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            title="Zoom in">+</button>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: isMobile ? 'var(--space-2)' : 'var(--space-4)',
          userSelect: 'none',
        }}>
          <style>{`
            @media print { .pdf-viewer-wrapper { display: none !important; } }
            .pdf-viewer-wrapper { text-align: center; }
            .pdf-viewer-wrapper .react-pdf__Page__canvas { display: block; margin: 0 auto; border-radius: 2px; box-shadow: 0 2px 16px rgba(0,0,0,0.3); }
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
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i} style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                  <Page
                    pageNumber={i + 1}
                    width={containerWidth || undefined}
                    scale={zoom}
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
                      fontSize: isMobile ? 22 : 40,
                      fontWeight: 'bold',
                      color: 'rgba(0, 0, 0, 0.15)',
                      transform: 'rotate(-45deg)',
                      whiteSpace: 'nowrap',
                    }}>
                      {watermarkText}
                    </span>
                  </div>
                </div>
              ))}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
