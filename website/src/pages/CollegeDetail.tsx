import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../lib/api';
import { useMediaQuery } from '../lib/useMediaQuery';

type College = {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
  total_seats: number;
  tuition_fee_annual: number;
  hostel_fee_annual: number;
  other_charges: number;
  official_website: string;
  established_year: number;
  accreditation: string;
  facilities: string[];
  image_url: string;
  cutoffs: Array<{
    id: number;
    year: number;
    general_rank: number;
    obc_rank: number;
    sc_rank: number;
    st_rank: number;
  }>;
};

export default function CollegeDetail() {
  const { id } = useParams<{ id: string }>();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getCollegeById(id)
      .then(data => setCollege(data))
      .catch(err => { api.logError('CollegeDetail.fetch', err); setError('College not found.'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !college) {
    return (
      <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error || 'College not found'}</h2>
          <Link to="/colleges" className="btn btn-outline">Back to Colleges</Link>
        </div>
      </div>
    );
  }

  const fees = (college.tuition_fee_annual || 0) + (college.hostel_fee_annual || 0) + (college.other_charges || 0);

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>
          <Link to="/colleges" style={{ color: 'var(--color-text-3)' }}>Colleges</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--color-text-2)' }}>{college.name}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Header */}
          <div className="card">
              <div style={{ display: 'flex', gap: isMobile ? 'var(--space-3)' : 'var(--space-5)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {college.image_url && (
                  <img
                    src={college.image_url}
                    alt={college.name}
                    style={{ width: isMobile ? 72 : 100, height: isMobile ? 72 : 100, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div style={{ flex: 1, minWidth: isMobile ? '100%' : 0 }}>
                  <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{college.name}</h1>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-3)' }}>
                  {college.city ? `${college.city}, ` : ''}{college.state}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span className="pill" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>{college.type}</span>
                  {college.accreditation && (
                    <span className="pill" style={{ background: 'var(--color-paper-3)', color: 'var(--color-text-2)' }}>{college.accreditation}</span>
                  )}
                  {college.established_year && (
                    <span className="pill" style={{ background: 'var(--color-paper-3)', color: 'var(--color-text-2)' }}>Est. {college.established_year}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>{college.total_seats?.toLocaleString() || '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Total Seats</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{fees > 0 ? `₹${api.formatPrice(fees)}` : '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Annual Fees</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)' }}>{college.cutoffs?.length || 0}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Cutoff Years</div>
            </div>
          </div>

          {/* Fee Breakdown */}
          {college.tuition_fee_annual > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-3)' }}>Fee Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-2)' }}>Tuition Fee (Annual)</span>
                  <span style={{ fontWeight: 600 }}>₹{api.formatPrice(college.tuition_fee_annual)}</span>
                </div>
                {college.hostel_fee_annual > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Hostel Fee (Annual)</span>
                    <span style={{ fontWeight: 600 }}>₹{api.formatPrice(college.hostel_fee_annual)}</span>
                  </div>
                )}
                {college.other_charges > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-2)' }}>Other Charges</span>
                    <span style={{ fontWeight: 600 }}>₹{api.formatPrice(college.other_charges)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-1)', paddingTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  {/* <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>₹{api.formatPrice(fees)}</span> */}
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>₹{fees.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Facilities */}
          {college.facilities?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-3)' }}>Facilities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {college.facilities.map((f, i) => (
                  <span key={i} className="pill" style={{ background: 'var(--color-paper-3)', color: 'var(--color-text-2)' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Website */}
          {college.official_website && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)' }}>Website</h3>
              <a href={college.official_website.startsWith('http') ? college.official_website : `https://${college.official_website}`}
                 target="_blank" rel="noopener noreferrer"
                 style={{ fontSize: 14, color: 'var(--color-accent)' }}>
                {college.official_website}
              </a>
            </div>
          )}

          {/* Cutoffs Table */}
          {college.cutoffs?.length > 0 && (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Cutoff Ranks</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '10px var(--space-4)', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 600 }}>Year</th>
                      <th style={{ padding: '10px var(--space-4)', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 600 }}>General</th>
                      <th style={{ padding: '10px var(--space-4)', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 600 }}>OBC</th>
                      <th style={{ padding: '10px var(--space-4)', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 600 }}>SC</th>
                      <th style={{ padding: '10px var(--space-4)', textAlign: 'left', color: 'var(--color-text-3)', fontWeight: 600 }}>ST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {college.cutoffs.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px var(--space-4)', fontWeight: 600 }}>{c.year}</td>
                        <td style={{ padding: '10px var(--space-4)', color: 'var(--color-text-2)' }}>{c.general_rank === 999999 ? '—' : c.general_rank.toLocaleString()}</td>
                        <td style={{ padding: '10px var(--space-4)', color: 'var(--color-text-2)' }}>{c.obc_rank === 999999 ? '—' : c.obc_rank.toLocaleString()}</td>
                        <td style={{ padding: '10px var(--space-4)', color: 'var(--color-text-2)' }}>{c.sc_rank === 999999 ? '—' : c.sc_rank.toLocaleString()}</td>
                        <td style={{ padding: '10px var(--space-4)', color: 'var(--color-text-2)' }}>{c.st_rank === 999999 ? '—' : c.st_rank.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
