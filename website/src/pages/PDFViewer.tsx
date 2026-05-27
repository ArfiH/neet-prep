import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../lib/auth';
import * as api from '../lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PDFViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [viewData, setViewData] = useState<{ url: string; headers: Record<string, string>; is_free: boolean; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getPdfViewUrl(id)
      .then(data => setViewData(data))
      .catch(err => { api.logError('PDFViewer.fetchUrl', err); setError('Failed to load PDF.'); })
      .finally(() => setLoading(false));
  }, [id]);

  const pdfFile = viewData
    ? { url: viewData.url, httpHeaders: Object.keys(viewData.headers).length > 0 ? viewData.headers : undefined }
    : null;

  const watermarkText = user?.email || 'NEET ZYME';

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
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

  if (error || !viewData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 16, marginBottom: 'var(--space-4)' }}>{error || 'PDF unavailable'}</p>
          <Link to="/pdfs" className="btn btn-outline">Back to PDFs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a1a', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-5)', background: '#222',
        borderBottom: '1px solid #333',
      }}>
        <Link to={`/pdfs/${id}`} style={{ color: '#999', fontSize: 14 }}>&larr; Back</Link>
        <span style={{ color: '#ccc', fontSize: 14, fontWeight: 600, flex: 1, textAlign: 'center' }}>
          {viewData.title}
        </span>
        {numPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18 }}
            >&minus;</button>
            <span style={{ color: '#999', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              {currentPage} / {numPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 18 }}
            >+</button>
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

      {/* PDF Container */}
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        style={{
          flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 'var(--space-4)', position: 'relative', userSelect: 'none', WebkitUserDrag: 'none',
        }}
      >
        <style>{`
          @media print {
            .pdf-viewer-wrapper { display: none !important; }
          }
          .pdf-viewer-wrapper .react-pdf__Page__canvas { display: block; margin: 0 auto; }
        `}</style>

        <div className="pdf-viewer-wrapper" style={{ position: 'relative', maxWidth: '100%' }}>
          <Document
            file={pdfFile}
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
              {/* Watermark overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', userSelect: 'none',
                overflow: 'hidden',
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 600,
                  color: 'rgba(255, 0, 0, 0.12)',
                  transform: 'rotate(-45deg)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                }}>
                  {watermarkText}
                </span>
              </div>
              {/* Anti-capture transparent overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                pointerEvents: 'none', userSelect: 'none',
                WebkitUserDrag: 'none',
              }} />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
