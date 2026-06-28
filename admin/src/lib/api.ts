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

export function uploadPdfWithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ file_url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    console.log(`[Upload] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
        if (pct % 25 === 0) console.log(`[Upload] ${pct}% — ${(e.loaded / 1024 / 1024).toFixed(2)} of ${(e.total / 1024 / 1024).toFixed(2)} MB`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        console.log('[Upload] Success — file URL:', data.file_url);
        resolve(data);
      } else {
        let msg = 'Upload failed';
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch { }
        console.error('[Upload] Server error:', msg);
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      console.error('[Upload] Network error — request failed');
      reject(new Error('Upload failed — network error'));
    };

    xhr.onabort = () => {
      console.warn('[Upload] Aborted by user');
      reject(new Error('Upload cancelled'));
    };

    xhr.open('POST', `${API_BASE}/admin/pdfs/upload`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

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

// Notifications
export const broadcastNotification = (title: string, body: string) =>
  request<{ message: string }>('/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify({ title, body }),
  });

// Delivery Requests
export const getDeliveryRequests = () => request<any[]>('/delivery-requests');
export const updateDeliveryRequest = (id: number, status: string) =>
  request<any>(`/delivery-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
