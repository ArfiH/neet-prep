const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getToken(): string | null {
  return sessionStorage.getItem('admin_token');
}

export function getUrlToken(): string | null {
  return new URLSearchParams(window.location.search).get('token');
}

function setToken(token: string) {
  sessionStorage.setItem('admin_token', token);
}

function clearToken() {
  sessionStorage.removeItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/admin${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (getUrlToken()) {
      window.location.href = window.location.pathname;
    }
    throw new Error('Unauthorized');
  }

  if (res.status === 403) throw new Error('Forbidden');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return res.json();
}

// Auth
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, forceLogin: true }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  if (data.user?.role !== 'admin') throw new Error('Admin access required');
  setToken(data.token);
  return data;
}

export async function loginWithToken(token: string) {
  setToken(token);
  // Verify by calling dashboard
  await request('/dashboard');
}

export function getStoredToken(): string | null {
  return getToken();
}

export function logout() {
  clearToken();
}

// Dashboard
export const getDashboard = () => request<{
  pdfCount: number; collegeCount: number; userCount: number; purchaseCount: number;
}>('/dashboard');

// PDFs
export const getPdfs = () => request<any[]>('/pdfs');
export const getPdf = (id: number) => request<any>(`/pdfs/${id}`);
export const createPdf = (data: any) => request<any>('/pdfs', { method: 'POST', body: JSON.stringify(data) });
export const updatePdf = (id: number, data: any) => request<any>(`/pdfs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePdf = (id: number) => request<any>(`/pdfs/${id}`, { method: 'DELETE' });

// Colleges
export const getColleges = (state?: string) => request<any[]>(`/colleges${state ? `?state=${encodeURIComponent(state)}` : ''}`);
export const getCollege = (id: number) => request<any>(`/colleges/${id}`);
export const createCollege = (data: any) => request<any>('/colleges', { method: 'POST', body: JSON.stringify(data) });
export const updateCollege = (id: number, data: any) => request<any>(`/colleges/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCollege = (id: number) => request<any>(`/colleges/${id}`, { method: 'DELETE' });

// Cutoffs
export const getCutoffs = (collegeId?: number) => request<any[]>(`/cutoffs${collegeId ? `?college_id=${collegeId}` : ''}`);
export const createCutoff = (data: any) => request<any>('/cutoffs', { method: 'POST', body: JSON.stringify(data) });
export const updateCutoff = (id: number, data: any) => request<any>(`/cutoffs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCutoff = (id: number) => request<any>(`/cutoffs/${id}`, { method: 'DELETE' });

// Users
export const getUsers = () => request<any[]>('/users');
export const updateUserRole = (id: number, role: string) => request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
export const banUser = (id: number) => request<any>(`/users/${id}/ban`, { method: 'PUT' });
export const unbanUser = (id: number) => request<any>(`/users/${id}/unban`, { method: 'PUT' });
export const getUserPurchases = (id: number) => request<any[]>(`/users/${id}/purchases`);
export const grantPdfAccess = (userId: number, pdfId: number) =>
  request<any>(`/users/${userId}/purchases`, { method: 'POST', body: JSON.stringify({ pdf_id: pdfId }) });
export const revokePdfAccess = (userId: number, pdfId: number) =>
  request<any>(`/users/${userId}/purchases/${pdfId}`, { method: 'DELETE' });
