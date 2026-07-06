import { useEffect, useState } from 'react';
import { FileText, Building2, Users, ShoppingCart, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatsCard from '../components/StatsCard';
import { getDashboard } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<{
    pdfCount: number; collegeCount: number; userCount: number; purchaseCount: number; monthlyPurchases: number;
    monthlyPurchaseData: { month: string; count: number }[];
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard().then(setStats).catch(e => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;
  if (!stats) return <div style={{ color: 'var(--color-text-3)' }}>Loading...</div>;

  const chartData = stats.monthlyPurchaseData?.length
    ? stats.monthlyPurchaseData.map(d => ({ month: d.month.slice(2), count: d.count }))
    : [];

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>Overview</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
      }}>
        <StatsCard label="PDFs" value={stats.pdfCount} icon={<FileText size={24} />} />
        <StatsCard label="Colleges" value={stats.collegeCount} icon={<Building2 size={24} />} />
        <StatsCard label="Users" value={stats.userCount} icon={<Users size={24} />} />
        <StatsCard label="Total Purchases" value={stats.purchaseCount} icon={<ShoppingCart size={24} />} />
        <StatsCard label="This Month" value={stats.monthlyPurchases} icon={<Calendar size={24} />} color="#0891B2" />
      </div>

      <div style={{
        background: 'var(--color-paper)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5) var(--space-6)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
          Monthly Purchases (12 months)
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-3)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
                labelFormatter={(label) => `Month: 20${label}`}
                formatter={(value: number) => [value, 'Purchases']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0891B2"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0891B2' }}
                activeDot={{ r: 5, fill: '#0891B2' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-3)', fontSize: 13 }}>
            No purchase data yet
          </div>
        )}
      </div>
    </div>
  );
}
