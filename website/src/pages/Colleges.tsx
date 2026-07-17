import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import * as api from '../lib/api';
import { useMediaQuery } from '../lib/useMediaQuery';

const CATEGORIES = ['General', 'OBC', 'SC', 'ST'];
const COLLEGE_TYPES = ['All', 'Government', 'Private', 'Deemed', 'Central University', 'State University'];
const STATES = [
  'All India', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Puducherry',
];

type Prediction = {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
  cutoff_rank: number;
  probability: number;
  rank_diff: number;
};

function probColor(p: number): string {
  if (p >= 0.9) return 'var(--color-success)';
  if (p >= 0.6) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function probLabel(p: number): string {
  if (p >= 0.9) return 'High';
  if (p >= 0.6) return 'Medium';
  return 'Low';
}

type SortKey = 'probability' | 'cutoff_rank' | 'name';

export default function Colleges() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('General');
  const [state, setState] = useState('All India');
  const [collegeType, setCollegeType] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Prediction[]>([]);
  const [predicted, setPredicted] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('probability');

  // College search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.searchColleges(searchQuery);
        setSearchResults(data || []);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredStates = STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'probability') return b.probability - a.probability;
    if (sortBy === 'cutoff_rank') return a.cutoff_rank - b.cutoff_rank;
    return a.name.localeCompare(b.name);
  });

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'probability', label: 'Chance' },
    { key: 'cutoff_rank', label: 'Cutoff' },
    { key: 'name', label: 'Name' },
  ];

  const handlePredict = async () => {
    const rankNum = parseInt(rank);
    if (!rank || isNaN(rankNum) || rankNum <= 0) return;

    setLoading(true);
    setError('');
    setPredicted(false);

    try {
      const data = await api.predictColleges(rankNum, category, state, collegeType);
      setResults(data || []);
    } catch (err: any) {
      api.logError('Colleges.predict', err);
      setError(err.message || 'Failed to get predictions.');
    } finally {
      setLoading(false);
      setPredicted(true);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>College Predictor</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', marginBottom: 'var(--space-6)' }}>
          Find colleges based on your NEET rank and category.
        </p>

        {/* College Search */}
        <div ref={searchRef} style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            padding: '10px 16px',
            border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'var(--color-paper-2)',
          }}>
            <Search size={18} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search for a college by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15,
                background: 'transparent', color: 'var(--color-text)',
              }}
            />
            {searchLoading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
            {searchQuery && !searchLoading && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-3)', fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                &#10005;
              </button>
            )}
          </div>
          {showSearchDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--color-paper)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', marginTop: 4, boxShadow: 'var(--shadow-lg)',
              maxHeight: 320, overflow: 'auto',
            }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: 'var(--space-5)', textAlign: 'center', fontSize: 14, color: 'var(--color-text-3)' }}>
                  No colleges found
                </div>
              ) : (
                searchResults.map(college => (
                  <button
                    key={college.id}
                    onClick={() => { navigate(`/colleges/${college.id}`); setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '12px 16px',
                      background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: 14, color: 'var(--color-text)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: 600 }}>{college.name}</span>
                    {college.city && (
                      <>
                        <span style={{ color: 'var(--color-text-3)', margin: '0 4px' }}>&middot;</span>
                        <span style={{ color: 'var(--color-text-2)', fontSize: 13 }}>{college.city}, {college.state}</span>
                      </>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
            {/* Rank */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>NEET Rank</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 15000"
                value={rank}
                onChange={e => setRank(e.target.value)}
                style={{
                  width: '100%', padding: 'var(--space-3) var(--space-4)',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 16, fontWeight: 700, outline: 'none',
                  color: 'var(--color-text)', background: 'var(--color-paper-2)',
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Category</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      flex: isMobile ? '0 1 auto' : 1, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--color-border)',
                      background: category === cat ? 'var(--color-accent)' : 'var(--color-paper-2)',
                      color: category === cat ? '#fff' : 'var(--color-text-2)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', minWidth: 60,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* State */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>State Preference</label>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowStateDropdown(!showStateDropdown)}
                style={{
                  width: '100%', padding: 'var(--space-3) var(--space-4)',
                  border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontSize: 15, textAlign: 'left', cursor: 'pointer',
                  background: 'var(--color-paper-2)', color: 'var(--color-text)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                {state}
                <span style={{ transform: showStateDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>&#9660;</span>
              </button>
              {showStateDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'var(--color-paper)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', marginTop: 4, boxShadow: 'var(--shadow-lg)',
                  maxHeight: 260, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={e => setStateSearch(e.target.value)}
                    style={{
                      padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--color-border)',
                      fontSize: 13, outline: 'none', background: 'transparent', color: 'var(--color-text)',
                    }}
                  />
                  <div style={{ overflow: 'auto', flex: 1 }}>
                    {filteredStates.map(s => (
                      <button
                        key={s}
                        onClick={() => { setState(s); setShowStateDropdown(false); setStateSearch(''); }}
                        style={{
                          display: 'block', width: '100%', padding: '10px 14px',
                          background: state === s ? 'var(--color-accent-muted)' : 'transparent',
                          border: 'none', textAlign: 'left', cursor: 'pointer',
                          fontSize: 14, color: 'var(--color-text)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* College Type */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>College Type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COLLEGE_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setCollegeType(t)}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-border)',
                    background: collegeType === t ? 'var(--color-accent)' : 'var(--color-paper-2)',
                    color: collegeType === t ? '#fff' : 'var(--color-text-2)',
                    fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Predict Button */}
          <button
            onClick={handlePredict}
            disabled={!rank || loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', opacity: !rank || loading ? 0.6 : 1 }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: '#fff' }} /> Predicting...</>
            ) : (
              'Predict My Colleges'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {/* Results */}
        {predicted && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
                {sortedResults.length} College{sortedResults.length !== 1 ? 's' : ''} Found
              </h2>
              {sortedResults.length > 0 && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>Sort:</span>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSortBy(opt.key)}
                      style={{
                        padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: '1px solid var(--color-border)', borderRadius: 999,
                        background: sortBy === opt.key ? 'var(--color-accent)' : 'var(--color-paper-2)',
                        color: sortBy === opt.key ? '#fff' : 'var(--color-text-2)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {sortedResults.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>No colleges found</p>
                <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>Try selecting "All India" or a different category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {sortedResults.map((college) => (
                  <Link
                    key={college.id}
                    to={`/colleges/${college.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                          {college.name}
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginBottom: 'var(--space-2)' }}>
                          {college.city ? `${college.city}, ` : ''}{college.state}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, color: probColor(college.probability),
                            background: `${probColor(college.probability)}18`,
                            padding: '3px 10px', borderRadius: 999,
                          }}>
                            {probLabel(college.probability)} Chance
                          </span>
                          {college.cutoff_rank && college.cutoff_rank !== 999999 ? (
                            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                              Cutoff: {college.cutoff_rank.toLocaleString()}
                            </span>
                          ) : null}
                          {college.cutoff_rank && college.cutoff_rank !== 999999 ? (
                            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                              {college.rank_diff >= 0
                                ? `+${college.rank_diff.toLocaleString()} margin`
                                : `${Math.abs(college.rank_diff).toLocaleString()} above cutoff`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span style={{ color: 'var(--color-text-3)', fontSize: 18 }}>&rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
