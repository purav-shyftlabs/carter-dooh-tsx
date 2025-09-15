import api from '../api/api-client';

// AuthService class for authentication logic
class AuthService {
  private baseURL: string;
  private apiPrefix: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
    this.apiPrefix = '/api';
  }



  // Safely parse JWT token
  parseJWT(token: string): Record<string, unknown> | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return null;
      }

      // Decode the payload (second part of JWT)
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload;
    } catch (error) {
      console.error('JWT parsing error:', error);
      return null;
    }
  }

  // Get headers with optional authorization
  getHeaders(includeAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Make API request with error handling
  async makeRequest(
    url: string,
    options: { method?: string; headers?: Record<string, string>; body?: BodyInit | null; includeAuth?: boolean } = {},
  ): Promise<unknown> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(options.includeAuth),
          ...options.headers,
        },
      });

      // Handle different response statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials: { email: string; password: string }): Promise<{ token?: string; refreshToken?: string; user?: unknown } | unknown> {
    const { email, password } = credentials;
    console.log('email', email);
    console.log('password', password);
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });
      // wait for 1 second
      await new Promise(resolve => setTimeout(resolve, 500));
      return response.data as { token?: string; refreshToken?: string; user?: unknown } | unknown;
    } catch (error) {
      console.error('Error during login:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Login using access token
  async accessTokenLogin(accessToken: string): Promise<{ token?: string; refreshToken?: string; user?: unknown } | unknown> {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    try {
      const response = await api.post('/api/user/access-token-login', { accessToken });
      return response.data as { token?: string; refreshToken?: string; user?: unknown } | unknown;
    } catch (error) {
      console.error('Error during access token login:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Register user
  async register(userData: { email: string; password: string; firstName: string; lastName: string;[key: string]: unknown }): Promise<{ user: unknown; token: string; refreshToken: string }> {
    const { email, password, firstName, lastName, ...otherData } = userData;

    if (!email || !password || !firstName || !lastName) {
      throw new Error('Email, password, first name, and last name are required');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/register`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        ...otherData,
      }),
    });

    return {
      user: (response as Record<string, unknown>).user as unknown,
      token: (response as Record<string, unknown>).token as string,
      refreshToken: (response as Record<string, unknown>).refreshToken as string,
    };
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/api/user/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local data
      console.warn('Logout request failed:', error);
    }
  }

  // Refresh access token
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot refresh token on server side');
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    return {
      token: (response as Record<string, unknown>).token as string,
      refreshToken: (response as Record<string, unknown>).refreshToken as string,
    };
  }

  // Get current user profile
  async getCurrentUser(): Promise<unknown> {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/me`, {
      method: 'GET',
      includeAuth: true,
    });

    return (response as Record<string, unknown>).user;
  }

  // Fetch current user via axios client using JWT (preferred)
  async getMe(): Promise<unknown> {
    try {
      const response = await api.get('/users/me');
      // API contract provided returns { success, message, data, timestamp }
      const data = (response?.data && typeof response.data === 'object') ? (response.data as Record<string, unknown>) : {};
      return (data as { data?: unknown }).data ?? null;
    } catch (error) {
      console.error('Error fetching current user (/users/me):', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Switch account and return new token
  async switchAccount(accountId: string | number): Promise<string> {
    try {
      const response = await api.post('/auth/switch-account', { accountId });
      const envelope = (response?.data && typeof response.data === 'object') ? (response.data as Record<string, unknown>) : {};
      const token = (envelope as { token?: string }).token || (envelope as { data?: { token?: string } }).data?.token || '';
      if (!token) {
        throw new Error('No token returned from switch-account');
      }
      return token;
    } catch (error) {
      console.error('Error switching account:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Update user profile
  async updateProfile(userData: Record<string, unknown>): Promise<unknown> {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/profile`, {
      method: 'PUT',
      includeAuth: true,
      body: JSON.stringify(userData),
    });

    return (response as Record<string, unknown>).user;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/change-password`, {
      method: 'POST',
      includeAuth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return response as unknown;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<unknown> {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const response = await api.post('/api/user/forgot-password', {
        email: email
      });
      console.log(response.data);
      return response.data as unknown;
    } catch (error) {
      console.error('Error during forgot password:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<unknown> {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    try {
      const response = await api.post('/api/user/reset-password', {
        token: token,
        newPassword: newPassword
      });
      console.log(response.data);
      return response.data as unknown;
    } catch (error) {
      console.error('Error during reset password:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Validate reset password token
  async validateResetPasswordToken(token: string): Promise<{ valid: boolean } | unknown> {
    if (!token) {
      throw new Error('Token is required');
    }
    try {
      const response = await api.get('/api/user/validate-reset-password-token', {
        params: { token }      });
      return response.data as { valid: boolean } | unknown;
    } catch (error) {
      console.error('Error during token validation:', error);
      const axiosErr = error as { response?: { data?: unknown } };
      throw axiosErr.response?.data || error;
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<unknown> {
    if (!token) {
      throw new Error('Verification token is required');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    return response as unknown;
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<unknown> {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/resend-verification`, {
      method: 'POST',
      includeAuth: true,
    });

    return response as unknown;
  }

  // Delete account
  async deleteAccount(password: string): Promise<unknown> {
    if (!password) {
      throw new Error('Password is required to delete account');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/delete-account`, {
      method: 'DELETE',
      includeAuth: true,
      body: JSON.stringify({ password }),
    });

    return response as unknown;
  }

  // Check if user is authenticated (has valid token)
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.parseJWT(token) as { exp?: number } | null;
    if (!payload || typeof payload.exp !== 'number') {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('accounts');
      return false;
    }

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  // Get stored user
  getUser(): unknown {
    if (typeof window === 'undefined') return null;

    try {
      const userStr = localStorage.getItem('user');
      return userStr ? (JSON.parse(userStr) as unknown) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  // Get stored accounts
  getAccounts(): unknown {
    if (typeof window === 'undefined') return null;

    try {
      const accountsStr = localStorage.getItem('accounts');
      return accountsStr ? (JSON.parse(accountsStr) as unknown) : null;
    } catch (error) {
      console.error('Error parsing accounts from localStorage:', error);
      return null;
    }
  }

  // Clear all auth data
  clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('accounts');
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
