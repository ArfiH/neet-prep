import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/useMediaQuery';
import { addRecentlyViewed } from '../lib/recentlyViewed';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  is_deliverable: boolean;
  pages_count: number;
  file_url: string;
  details: string[];
  category: string | null;
  class: string | null;
  downloads: number;
};

export default function PDFDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchased, setPurchased] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    recipient_name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [sendingDelivery, setSendingDelivery] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getPdfById(id)
      .then(data => { setPdf(data); addRecentlyViewed(id); })
      .catch(err => { api.logError('PDFDetail.fetch', err); setError('PDF not found.'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isLoggedIn) return;
    api.checkPdfPurchase(id)
      .then(({ hasPurchased }) => setPurchased(hasPurchased))
      .catch(() => {});
  }, [id, isLoggedIn]);

  // Load Razorpay script
  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => { api.logError('loadRazorpay', new Error('Failed to load Razorpay SDK')); resolve(false); };
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (!pdf) return;
    if (pdf.is_free || purchased) {
      navigate(`/pdfs/${pdf.id}/view`);
      return;
    }

    if (!isLoggedIn) {
      navigate('/login', { state: { from: `/pdfs/${id}` } });
      return;
    }

    setPaying(true);
    setPayError('');

    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setPayError('Payment system failed to load. Please refresh and try again.'); return; }

      const order = await api.createRazorpayOrder(pdf.id);
      const options = {
        key: order.key_id,
        amount: Math.round(pdf.price * 100),
        currency: 'INR',
        name: 'NEET Zymee',
        description: pdf.title,
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            const result = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (result.success) {
              setPurchased(true);
              navigate(`/pdfs/${pdf.id}/view`);
            }
          } catch (err: any) {
            api.logError('PDFDetail.verifyPayment', err);
            setPayError(err.message || 'Payment verification failed. Please contact support.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        theme: { color: '#2ea86e' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        api.logError('PDFDetail.payment.failed', response.error);
        setPayError(response.error?.description || 'Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      api.logError('PDFDetail.handlePurchase', err);
      setPayError(err.message || 'Failed to start payment.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>{error || 'PDF not found'}</h2>
          <Link to="/pdfs" className="btn btn-outline">Back to PDFs</Link>
        </div>
      </div>
    );
  }

  const subjectColor = (() => {
    const colors: Record<string, string> = { Biology: '#2ea86e', Physics: '#4a7dff', Chemistry: '#d4a017' };
    return colors[pdf.subject] || '#2ea86e';
  })();

  const priceDisplay = pdf.is_free
    ? <span className="pill pill-free" style={{ fontSize: 16, padding: '6px 16px' }}>FREE</span>
    : purchased
      ? <span className="pill pill-owne" style={{ fontSize: 16, padding: '6px 16px' }}>OWNED</span>
      : <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent)' }}>₹{api.formatPrice(pdf.price)}</span>;

  return (
    <div style={{ padding: 'var(--space-8) 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 'var(--space-5)' }}>
          <Link to="/pdfs" style={{ color: 'var(--color-text-3)' }}>PDFs</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--color-text-2)' }}>{pdf.subject}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Hero */}
          <div className="card" style={{
            padding: isMobile ? 'var(--space-5)' : 'var(--space-8)', borderLeft: `4px solid ${subjectColor}`,
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: subjectColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{pdf.subject}</span>
              {pdf['class'] && (
                <>
                  <span style={{ color: 'var(--color-text-3)' }}>&middot;</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{pdf['class']}</span>
                </>
              )}
              {pdf.category && (
                <>
                  <span style={{ color: 'var(--color-text-3)' }}>&middot;</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{pdf.category}</span>
                </>
              )}
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, lineHeight: 1.3, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
              {pdf.title}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              {pdf.description || 'Comprehensive study material aligned with the latest NEET syllabus.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <span className="pill" style={{ background: 'var(--color-paper-3)', color: 'var(--color-text-2)' }}>
                {pdf.pages_count} pages
              </span>
              {pdf.details?.map((d, i) => (
                <span key={i} className="pill" style={{ background: 'var(--color-paper-3)', color: 'var(--color-text-2)' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Price and CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
              {priceDisplay}
              <button
                onClick={handlePurchase}
                disabled={paying}
                className={`btn ${pdf.is_free || purchased ? 'btn-primary' : 'btn-primary'}`}
                style={{ padding: '12px 32px', fontSize: 16, opacity: paying ? 0.6 : 1, width: isMobile ? '100%' : 'auto' }}
              >
                {paying ? (
                  <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Processing...</>
                ) : pdf.is_free ? (
                  'Read for Free'
                ) : purchased ? (
                  'Read PDF'
                ) : (
                  `Buy Now — ₹${api.formatPrice(pdf.price)}`
                )}
              </button>
            </div>
            {payError && (
              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                {payError}
              </div>
            )}

            {/* Deliver Book */}
            {pdf.is_deliverable && !deliverySuccess && (
              <button
                onClick={() => { setShowDeliveryForm(true); setDeliveryError(''); }}
                className="btn btn-outline"
                style={{ marginTop: 'var(--space-4)', width: '100%', justifyContent: 'center' }}
              >
                <Package size={16} /> Get Physical Copy
              </button>
            )}
            {deliverySuccess && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-success-muted)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                ✓ Delivery request submitted! We will ship the book to your address.
              </div>
            )}
          </div>

          {/* Description */}
          {pdf.description && (
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 'var(--space-3)' }}>About this PDF</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.7 }}>{pdf.description}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 'var(--space-5)', fontSize: 13, color: 'var(--color-text-3)' }}>
            <span>{pdf.pages_count} pages</span>
            <span>{pdf.downloads || 0} downloads</span>
          </div>
        </div>
      </div>

      {/* Delivery Form Modal */}
      {showDeliveryForm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: 'var(--space-4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowDeliveryForm(false)}
        >
          <div
            style={{
              background: 'var(--color-paper)', borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)', maxWidth: 480, width: '100%',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20,
                background: 'var(--color-accent-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package size={18} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Request Physical Copy</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.5, marginBottom: 'var(--space-5)' }}>
              Fill in the delivery details and we'll ship the book to your address.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setDeliveryError('');
              setSendingDelivery(true);
              try {
                await api.requestDelivery(id!, deliveryForm);
                setDeliverySuccess(true);
                setShowDeliveryForm(false);
                setDeliveryForm({ recipient_name: '', phone: '', address: '', city: '', state: '', pincode: '' });
              } catch (err: any) {
                setDeliveryError(err.message || 'Failed to submit delivery request.');
              }
              setSendingDelivery(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                  Recipient Name <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  value={deliveryForm.recipient_name}
                  onChange={e => setDeliveryForm(f => ({ ...f, recipient_name: e.target.value }))}
                  placeholder="Full name"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    fontSize: 14, outline: 'none',
                    color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                  Phone Number <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={deliveryForm.phone}
                  onChange={e => setDeliveryForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    fontSize: 14, outline: 'none',
                    color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                  Address <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  value={deliveryForm.address}
                  onChange={e => setDeliveryForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street, area, landmark, building..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 72,
                    color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    fontFamily: 'inherit',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                    City <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    value={deliveryForm.city}
                    onChange={e => setDeliveryForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City"
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      fontSize: 14, outline: 'none',
                      color: 'var(--color-text)', background: 'var(--color-paper-2)',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                    State <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    value={deliveryForm.state}
                    onChange={e => setDeliveryForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="State"
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                      fontSize: 14, outline: 'none',
                      color: 'var(--color-text)', background: 'var(--color-paper-2)',
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                  Pincode <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  value={deliveryForm.pincode}
                  onChange={e => setDeliveryForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="6-digit pincode"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                    fontSize: 14, outline: 'none',
                    color: 'var(--color-text)', background: 'var(--color-paper-2)',
                    transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-focus)'; e.target.style.boxShadow = '0 0 0 3px oklch(55% 0.2 240 / 15%)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {deliveryError && (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-muted)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                  {deliveryError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                <button type="button" onClick={() => setShowDeliveryForm(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px 24px', fontSize: 14 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingDelivery || !deliveryForm.recipient_name.trim() || deliveryForm.phone.length < 10 || !deliveryForm.address.trim() || !deliveryForm.city.trim() || !deliveryForm.state.trim() || deliveryForm.pincode.length !== 6}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px 24px', fontSize: 14, opacity: (sendingDelivery || !deliveryForm.recipient_name.trim() || deliveryForm.phone.length < 10 || !deliveryForm.address.trim() || !deliveryForm.city.trim() || !deliveryForm.state.trim() || deliveryForm.pincode.length !== 6) ? 0.6 : 1 }}
                >
                  {sendingDelivery ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

