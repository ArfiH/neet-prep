import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '../lib/useMediaQuery';

const faqs = [
  {
    q: 'How do I access a free PDF?',
    a: 'Click any PDF marked FREE and press "Read for Free". Free PDFs are available instantly without any payment.',
  },
  {
    q: 'How do I purchase a paid PDF?',
    a: 'Open the PDF you want, then press "Buy Now". You\'ll be taken to a secure Razorpay checkout. After payment, the PDF is permanently added to your library.',
  },
  {
    q: 'Where can I find my purchased PDFs?',
    a: 'Go to Profile → My Purchased PDFs. All your purchases are listed there and available to read anytime.',
  },
  {
    q: 'Can I read PDFs on my mobile?',
    a: 'Yes! Download the NEET Zymee app from the Play Store. Your purchases sync across devices.',
  },
  {
    q: 'How does the College Predictor work?',
    a: 'Enter your NEET rank and category in the College Predictor tab. The tool compares your rank against historical cutoffs to estimate your admission chances.',
  },
  {
    q: 'I paid but can\'t access the PDF. What do I do?',
    a: 'First, refresh the page. If the issue persists, contact us at support@neetzymee.com with your payment ID and we\'ll resolve it promptly.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, click "Forgot password". Enter your email and we\'ll send a reset link.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. Payments are handled entirely by Razorpay. We never see or store your card or UPI details.',
  },
];

export default function Help() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/profile" style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' }}>
          &larr; Back to Profile
        </Link>

        <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Help & FAQ</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>Click a question to expand the answer.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} style={{
                border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: isOpen ? 'var(--color-accent-muted)' : 'var(--color-paper)',
              }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    border: 'none', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', gap: 12,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textAlign: 'left', flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                  <span style={{
                    fontSize: 14, color: 'var(--color-text-3)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s', flexShrink: 0,
                  }}>
                    &#9660;
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 14px', fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center', marginTop: 'var(--space-6)', lineHeight: 1.6 }}>
          Still need help? Email us at<br />
          <a href="mailto:support@neetzymee.com" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
            support@neetzymee.com
          </a>
        </p>
      </div>
    </div>
  );
}
