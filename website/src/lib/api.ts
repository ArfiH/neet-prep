const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'neet_zyme_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {};

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, { ...fetchOptions, headers });

    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (data.error === 'SESSION_INVALIDATED') {
        clearToken();
        window.dispatchEvent(new CustomEvent('session-invalidated'));
      } else {
        clearToken();
      }
      throw new Error(data.message || data.error || 'Unauthorized');
    }

    if (res.status === 403) {
      throw new Error('Forbidden');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.needs_verification) {
        throw { needs_verification: true, email: data.email, message: data.error || 'Email not verified' };
      }
      if (data.error === 'ACTIVE_SESSION_EXISTS') {
        throw { active_session_exists: true, message: data.message || data.error };
      }
      throw new Error(data.error || `Request failed (${res.status})`);
    }

    return res.json();
  } catch (err: any) {
    if (err?.needs_verification) throw err;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function googleLogin(idToken: string, forceLogin = false) {
  const body: any = { idToken };
  if (forceLogin) body.forceLogin = true;
  const data: any = await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string, forceLogin = false) {
  const body: any = { email, password };
  if (forceLogin) body.forceLogin = true;
  const data: any = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  setToken(data.token);
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const data: any = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    skipAuth: true,
  });
  return data;
}

export async function verifyEmail(token: string) {
  const data: any = await request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
    skipAuth: true,
  });
  setToken(data.token);
  return data;
}

export async function resendVerification(email: string) {
  return request<{ message: string }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function logout() {
  try { await request('/auth/logout', { method: 'POST' }); } catch {}
  clearToken();
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    skipAuth: true,
  });
}

export async function getProfile(): Promise<any> {
  return request('/auth/profile');
}

export async function updateProfile(data: { name?: string; category?: string }): Promise<any> {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// PDFs
// ---------------------------------------------------------------------------
export async function getPdfs(): Promise<any[]> {
  return request('/pdfs');
}

export async function getPdfById(id: string): Promise<any> {
  if (!id) throw new Error('PDF ID is required');
  return request(`/pdfs/${id}`);
}

export async function checkPdfPurchase(id: string): Promise<{ hasPurchased: boolean }> {
  return request(`/pdfs/${id}/check`);
}

export async function getPurchasedPdfs(): Promise<any[]> {
  return request('/pdfs/user/purchased');
}

export async function getPdfViewUrl(id: string): Promise<{ url: string; headers: Record<string, string>; is_free: boolean; title: string }> {
  return request(`/pdfs/${id}/view`);
}

export async function createRazorpayOrder(pdfId: string): Promise<{ order_id: string; amount: number; key_id: string }> {
  return request('/pdfs/create-order', {
    method: 'POST',
    body: JSON.stringify({ pdfId }),
  });
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; pdf_id: string; message: string }> {
  return request('/pdfs/verify-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Colleges
// ---------------------------------------------------------------------------
export async function getColleges(state?: string): Promise<any[]> {
  const qs = state ? `?state=${encodeURIComponent(state)}` : '';
  return request(`/colleges${qs}`);
}

export async function getCollegeById(id: string): Promise<any> {
  return request(`/colleges/${id}`);
}

export async function predictColleges(rank: number, category: string, state?: string): Promise<any[]> {
  const params = new URLSearchParams({ rank: String(rank), category });
  if (state && state !== 'All India') params.set('state', state);
  return request(`/colleges/predict?${params.toString()}`);
}

// ---------------------------------------------------------------------------
// Notifications (for profile unread count)
// ---------------------------------------------------------------------------
export async function getNotifications(): Promise<any[]> {
  return request('/notifications');
}

export async function markAllNotificationsRead(): Promise<any> {
  return request('/notifications/read-all', { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------
export async function requestDelivery(pdfId: string, data: {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}): Promise<{ id: number; message: string }> {
  return request(`/pdfs/${pdfId}/delivery`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Price formatting (mirrors mobile formatPrice)
// ---------------------------------------------------------------------------
export function formatPrice(price: number | string): string {
  const num = Number(price);
  if (isNaN(num)) {
    console.warn('Invalid price:', price);
    return '0';
  }
    if (Number.isInteger(num) && num >= 0) return num.toString();
  return num.toFixed(2);
}

// ---------------------------------------------------------------------------
// Error logging helper
// ---------------------------------------------------------------------------
export function logError(context: string, error: unknown) {
  const ts = new Date().toISOString();
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';
  console.error(`[${ts}] ${context}: ${msg}`, stack ? '\n' + stack : '');
}
