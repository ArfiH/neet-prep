import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color?: string;
}

export default function StatsCard({ label, value, icon, color }: StatsCardProps) {
  return (
    <div style={{
      background: 'var(--color-paper)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5) var(--space-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-2)',
      }}>
        <span style={{
          fontSize: 24,
          color: color || 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
        }}>{icon}</span>
        <span style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--color-text)',
        }}>{value.toLocaleString()}</span>
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--color-text-2)',
        fontWeight: 500,
      }}>{label}</div>
    </div>
  );
}
