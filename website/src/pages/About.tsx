import { Link } from 'react-router-dom';
import { useMediaQuery } from '../lib/useMediaQuery';

export default function About() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const info = [
    { label: 'App Name', value: 'NEET Zymee' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Contact', value: 'support@neetzymee.com' },
    { label: 'Website', value: 'neetzymee.com' },
  ];

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/profile" style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' }}>
          &larr; Back to Profile
        </Link>

        {/* Logo area */}
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-3)',
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>NZ</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>NEET Zymee</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Your NEET preparation companion</p>
        </div>

        {/* Info rows */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
          {info.map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 16px',
              borderBottom: i < info.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.6, textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          NEET Zymee helps NEET aspirants access high-quality study material, predict college admissions based on rank, and track their preparation journey.
        </p>

        <p style={{ fontSize: 11, color: 'var(--color-text-3)', textAlign: 'center' }}>
          &copy; {new Date().getFullYear()} NEET Zymee. All rights reserved.
        </p>
      </div>
    </div>
  );
}
