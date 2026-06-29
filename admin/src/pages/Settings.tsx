import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../lib/api';

interface Settings {
  ad_on_free_read: string;
  ad_on_free_download: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({ ad_on_free_read: '1', ad_on_free_download: '1' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then((s: Record<string, string>) => setSettings({
        ad_on_free_read: s.ad_on_free_read || '1',
        ad_on_free_download: s.ad_on_free_download || '1',
      }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof Settings) => {
    const next = { ...settings, [key]: settings[key] === '1' ? '0' : '1' };
    setSettings(next);
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateSettings({ [key]: next[key] });
      setSaved(true);
    } catch (e: any) {
      setSettings(settings);
      setError(e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Loading…</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-5)' }}>
        Settings
      </h2>
      {error && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>{error}</div>
      )}
      {saved && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', background: '#DCFCE7', color: '#16A34A', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 'var(--space-4)' }}>Settings saved</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 500 }}>
        <ToggleRow
          label="Ads on free PDF reading"
          description="Show an interstitial ad before users can read a free PDF"
          checked={settings.ad_on_free_read === '1'}
          disabled={saving}
          onChange={() => toggle('ad_on_free_read')}
        />
        <ToggleRow
          label="Ads on free PDF download"
          description="Show an interstitial ad before users can download a free PDF"
          checked={settings.ad_on_free_download === '1'}
          disabled={saving}
          onChange={() => toggle('ad_on_free_download')}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-4)',
      background: 'var(--color-paper-2)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{description}</div>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: checked ? 'var(--color-accent)' : 'var(--color-border)',
          position: 'relative',
          transition: 'background var(--transition-fast)',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 25 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left var(--transition-fast)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}
