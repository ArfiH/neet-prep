import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import { getRecentlyViewedIds } from '../lib/recentlyViewed';
import PDFCard from '../components/PDFCard';
import HeroVideo from '../components/HeroVideo';

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

export default function Home() {
  const { isLoggedIn } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [allPdfs, setAllPdfs] = useState<PDF[]>([]);
  const [recentPdfs, setRecentPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPdfs()
      .then(pdfs => {
        setAllPdfs(pdfs);
        const ids = getRecentlyViewedIds();
        if (ids.length > 0) {
          const recents = ids
            .map(id => pdfs.find(p => String(p.id) === String(id)))
            .filter(Boolean) as PDF[];
          setRecentPdfs(recents);
        }
      })
      .catch(err => { api.logError('Home.getPdfs', err); setError('Could not load PDFs.'); })
      .finally(() => setLoading(false));
  }, []);

  const featured = allPdfs.slice(0, 8);
  const freeCount = featured.filter(p => p.is_free).length;
  const paidCount = featured.length - freeCount;

  return (
    <div>
      {/* Hero Section with video background on desktop */}
      <HeroVideo src="/assets/hero-loop.mp4" poster="/assets/hero-poster.jpg">
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, lineHeight: 1.15, color: 'var(--color-text)', marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            Ace your NEET UG with{' '}
            <span style={{ color: 'var(--color-accent)' }}>expert-crafted PDFs</span>
          </h1>
          <p style={{ fontSize: isMobile ? 15 : 17, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
            High-quality study materials, college predictor, and more — all in one place.
            Start your preparation today.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            <Link to="/pdfs" className="btn btn-primary btn-lg" style={{ width: isMobile ? '100%' : 'auto' }}>Browse PDFs</Link>
            <Link to="/colleges" className="btn btn-outline btn-lg" style={{ width: isMobile ? '100%' : 'auto' }}>Predict Colleges</Link>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-5)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Over 50+ PDFs available</span>
            <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>NEET 2026 aligned</span>
          </div>
        </div>
      </HeroVideo>

      {/* Recently Viewed */}
      {recentPdfs.length > 0 && (
        <section style={{ padding: isMobile ? 'var(--space-6) 0 0 0' : 'var(--space-8) 0 0 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: 'var(--color-text)' }}>Recently viewed</h2>
              <Link to="/pdfs" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
                View all &rarr;
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
              {recentPdfs.map(pdf => (
                <PDFCard key={pdf.id} pdf={pdf} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured PDFs */}
      <section style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-6)' }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--color-text)' }}>Featured PDFs</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 2 }}>
                {freeCount} free &bull; {paidCount} paid
              </p>
            </div>
            <Link to="/pdfs" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
              View all &rarr;
            </Link>
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
              <div className="spinner" />
            </div>
          ) : featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-3)' }}>
              No PDFs available yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-5)' }}>
              {featured.map(pdf => (
                <PDFCard key={pdf.id} pdf={pdf} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: isMobile ? 'var(--space-8) 0' : 'var(--space-12) 0', background: 'var(--color-paper-2)' }}>
        <div className="container">
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            Everything you need
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)' }}>
            {[
              { icon: '📘', title: 'Subject-wise PDFs', desc: 'Biology, Physics, Chemistry — all NEET topics covered with detailed explanations.' },
              { icon: '🎯', title: 'College Predictor', desc: 'Enter your rank and category to find the colleges you can get into.' },
              { icon: '🆓', title: 'Free PDFs', desc: 'Read free PDFs.' },
              { icon: '🔒', title: 'Secure Purchases', desc: 'Buy PDFs securely via Razorpay. Instant access after payment.' },
            ].map((feat, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ fontSize: 36, marginBottom: 'var(--space-3)' }}>{feat.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section style={{ padding: isMobile ? 'var(--space-10) 0' : 'var(--space-16) 0', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
              Ready to start preparing?
            </h2>
            <p style={{ fontSize: 16, color: 'var(--color-text-2)', marginBottom: 'var(--space-6)', maxWidth: 480, margin: '0 auto var(--space-6)' }}>
              Join thousands of NEET aspirants using NEET Zymee to ace their exam.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
          </div>
        </section>
      )}
    </div>
  );
}
