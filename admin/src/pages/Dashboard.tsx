import { useEffect, useState } from 'react';
import StatsCard from '../components/StatsCard';
import { getDashboard } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<{ pdfCount: number; collegeCount: number; userCount: number; purchaseCount: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard().then(setStats).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;
  if (!stats) return <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>Overview</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        <StatsCard label="PDFs" value={stats.pdfCount} icon="▤" />
        <StatsCard label="Colleges" value={stats.collegeCount} icon="◇" />
        <StatsCard label="Users" value={stats.userCount} icon="◎" />
        <StatsCard label="Purchases" value={stats.purchaseCount} icon="◈" />
      </div>
    </div>
  );
}
