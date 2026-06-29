import { Link } from 'react-router-dom';
import { useMediaQuery } from '../lib/useMediaQuery';

const sections = [
  {
    label: 'DATA WE COLLECT',
    items: [
      { title: 'Account Info', body: 'We collect your email address and name when you register.' },
      { title: 'Purchase Records', body: 'We store records of PDFs you purchase to grant and maintain your access.' },
    ],
  },
  {
    label: 'HOW WE USE YOUR DATA',
    items: [
      { title: 'App Functionality', body: 'Your data is used solely for authentication, purchase history, and college predictions.' },
      { title: 'No Third-Party Selling', body: 'We do not sell or share your personal data with third parties.' },
    ],
  },
  {
    label: 'PAYMENTS & SECURITY',
    items: [
      { title: 'Razorpay', body: 'Payments are processed securely by Razorpay. We never store your card or UPI details.' },
      { title: 'Password Security', body: 'Passwords are hashed using bcrypt and never stored in plain text. Access tokens expire after a short period.' },
    ],
  },
  {
    label: 'YOUR RIGHTS',
    items: [
      { title: 'Password Reset', body: 'You can reset your password at any time via the login screen.' },
      { title: 'Account Deletion', body: 'To delete your account and all data, email us at support@neetzymee.com. We\'ll process it within 7 business days.' },
    ],
  },
];

export default function Privacy() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <Link to="/profile" style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-4)' }}>
          &larr; Back to Profile
        </Link>

        <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Privacy & Security</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>Last updated: May 2026</p>

        {sections.map(section => (
          <div key={section.label} style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
              {section.label}
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <div key={item.title} style={{
                  padding: '14px 16px',
                  borderBottom: i < section.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
