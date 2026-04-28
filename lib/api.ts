import AsyncStorage from '@react-native-async-storage/async-storage';

// Physical device - use your PC's IP address
const API_BASE_URL = 'http://172.21.188.45:3000/api';

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth methods
  async register(email: string, password: string, name?: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.token = data.token;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
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

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile', { method: 'GET' });
  }

  async updateProfile(data: { name?: string; neet_rank?: number; category?: string }) {
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
}

export const api = new ApiClient();