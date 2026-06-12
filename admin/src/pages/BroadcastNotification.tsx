import { useState } from 'react';
import { Bell, Send, CheckCircle, AlertCircle, Megaphone } from 'lucide-react';
import { broadcastNotification } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BroadcastNotification() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const data = await broadcastNotification(title.trim(), body.trim());
      setResult({ ok: true, msg: data.message });
      setTitle('');
      setBody('');
    } catch (err: any) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  };

  const canSend = title.trim().length > 0;

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--color-accent-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Megaphone size={18} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>
            Broadcast Notification
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 1 }}>
            Send a notification to all active app users
          </p>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-2)', marginBottom: 16, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            Notification Details
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Title <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New PDF Available: Physics Module 5"
                maxLength={255}
                style={{
                  ...inputBase,
                  paddingLeft: 36,
                  borderColor: result?.ok ? 'var(--color-success)' : undefined,
                }}
              />
              <Bell
                size={15}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-3)', pointerEvents: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4, textAlign: 'right' }}>
              {title.length}/255
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>Message</label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Describe what's new — this will appear as the notification body text on users' devices..."
                rows={4}
                style={{
                  ...inputBase,
                  padding: '10px 12px',
                  minHeight: 100,
                  resize: 'vertical',
                  lineHeight: 1.6,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-2)', marginBottom: 16, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            Preview
          </div>

          <div style={{
            maxWidth: 340, margin: '0 auto',
            background: 'var(--color-paper)',
            borderRadius: 14,
            boxShadow: '0 2px 12px oklch(0% 0 0 / 8%), 0 0 0 1px oklch(0% 0 0 / 4%)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px',
              background: 'var(--color-paper-2)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--color-text-3)', fontWeight: 500, letterSpacing: '0.5px' }}>
                NEET Zymee
              </div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--color-accent-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Megaphone size={16} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 2, lineHeight: 1.3 }}>
                  {title || 'Notification Title'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.5 }}>
                  {body || 'Your notification message will appear here...'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 6 }}>
                  just now
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!canSend || sending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 24px',
              border: 'none',
              borderRadius: 10,
              background: canSend && !sending ? 'var(--color-accent)' : 'var(--color-border)',
              color: canSend && !sending ? '#fff' : 'var(--color-text-3)',
              fontSize: 14, fontWeight: 600,
              cursor: canSend && !sending ? 'pointer' : 'default',
              transition: 'background 0.15s, transform 0.1s',
              boxShadow: canSend && !sending ? '0 2px 8px oklch(58% 0.18 155 / 25%)' : 'none',
            }}
            onMouseEnter={e => { if (canSend && !sending) e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
            onMouseLeave={e => { if (canSend && !sending) e.currentTarget.style.background = 'var(--color-accent)'; }}
            onMouseDown={e => { if (canSend && !sending) e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { if (canSend && !sending) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {sending ? (
              <>
                <div style={{
                  width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Send to All Users
              </>
            )}
          </button>
        </div>

        {result && (
          <div style={{
            marginTop: 16,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13, fontWeight: 500,
            background: result.ok ? 'var(--color-success-muted)' : 'var(--color-danger-muted)',
            color: result.ok ? 'var(--color-success)' : 'var(--color-danger)',
            border: `1px solid ${result.ok ? 'var(--color-success)' : 'var(--color-danger)'}`,
          }}>
            {result.ok ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
            <span>{result.msg}</span>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Send notification?"
        message={`"${title.trim()}" will be sent to all active users.`}
        confirmLabel="Send"
        variant="primary"
        onConfirm={handleSend}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--color-paper)',
  borderRadius: 14,
  padding: '20px 24px',
  border: '1px solid var(--color-border)',
  boxShadow: 'var(--shadow-sm)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 6,
};

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 10,
  fontSize: 13.5,
  outline: 'none',
  color: 'var(--color-text)',
  background: 'var(--color-paper-2)',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
