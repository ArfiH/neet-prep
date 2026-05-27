import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Delete', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'oklch(0% 0 0 / 40%)',
      }}
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-paper)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          width: 380,
          maxWidth: '90vw',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text)' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 'var(--space-6)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-paper)',
              color: 'var(--color-text-2)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
