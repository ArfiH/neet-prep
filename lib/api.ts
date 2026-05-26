import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Server returned ${response.status} — expected JSON, got ${contentType}`);
    }

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || 'Request failed') as any;
      if (data.needs_verification) err.needs_verification = true;
      if (data.email) err.email = data.email;
      throw err;
    }

    return data;
  }

  // Auth methods
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ message: string; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    return data;
  }

  async googleLogin(idToken: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    this.token = data.token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    return data;
  }

  async logout() {
    this.token = null;
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ token: string; user: any }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile', { method: 'GET' });
  }

  async updateProfile(data: { name?: string; category?: string }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  async getStoredUser(): Promise<any> {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // PDF methods
  async getPdfs() {
    return this.request<any[]>('/pdfs', { method: 'GET' });
  }

  async getPdfById(id: string) {
    return this.request<any>(`/pdfs/${id}`, { method: 'GET' });
  }

  async checkPdfPurchase(pdfId: string) {
    return this.request<{ hasPurchased: boolean }>(`/pdfs/${pdfId}/check`, {
      method: 'GET',
    });
  }

  async getPurchasedPdfs() {
    return this.request<any[]>('/pdfs/user/purchased', { method: 'GET' });
  }

  async getPdfViewUrl(id: string) {
    return this.request<{ url: string; headers: Record<string, string>; is_free: boolean; title: string }>(`/pdfs/${id}/view`, { method: 'GET' });
  }

  async createRazorpayOrder(pdfId: string) {
    return this.request<{ order_id: string; amount: number; key_id: string }>('/pdfs/create-order', {
      method: 'POST',
      body: JSON.stringify({ pdfId }),
    });
  }

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return this.request<{ success: boolean; pdf_id: string; message: string }>('/pdfs/verify-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // College methods
  async getColleges(state?: string, type?: string) {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (type) params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/colleges${query}`, { method: 'GET' });
  }

  async getCollegeById(id: string) {
    return this.request<any>(`/colleges/${id}`, { method: 'GET' });
  }

  async predictColleges(rank: number, category: string, state: string) {
    const params = new URLSearchParams({
      rank: rank.toString(),
      category,
      state,
    });
    return this.request<any[]>(`/colleges/predict?${params}`, { method: 'GET' });
  }

  // Notification methods
  async getNotifications() {
    return this.request<any[]>('/notifications', { method: 'GET' });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/read-all', { method: 'POST' });
  }

  async markNotificationRead(id: number) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' });
  }
}

export const api = new ApiClient();