import api, { utcHeader } from '../api/api-client';

// AuthService class for authentication logic
class AuthService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
    this.apiPrefix = '/api/auth';
  }

  

  // Safely parse JWT token
  parseJWT(token) {
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
  getHeaders(includeAuth = false) {
    const headers = {
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
  async makeRequest(url, options = {}) {
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
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    const { email, password } = credentials;
    console.log('email', email);
    console.log('password', password);
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const response = await api.post('/public/user/login', {
        email: email,
        password: password
      }, {
        headers: { ...utcHeader }
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error.response?.data || error;
    }
  }

  // Register user
  async register(userData) {
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
      user: response.user,
      token: response.token,
      refreshToken: response.refreshToken,
    };
  }

  // Logout user
  async logout() {
    try {
      await this.makeRequest(`${this.baseURL}${this.apiPrefix}/logout`, {
        method: 'POST',
        includeAuth: true,
      });
    } catch (error) {
      // Even if logout fails on server, we should clear local data
      console.warn('Logout request failed:', error);
    }
  }

  // Refresh access token
  async refreshToken() {
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
      token: response.token,
      refreshToken: response.refreshToken,
    };
  }

  // Get current user profile
  async getCurrentUser() {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/me`, {
      method: 'GET',
      includeAuth: true,
    });

    return response.user;
  }

  // Update user profile
  async updateProfile(userData) {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/profile`, {
      method: 'PUT',
      includeAuth: true,
      body: JSON.stringify(userData),
    });

    return response.user;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/change-password`, {
      method: 'POST',
      includeAuth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    return response;
  }

  // Forgot password
  async forgotPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const response = await api.post('/api/user/forgot-password', {
        email: email
      }, {
        headers: { ...utcHeader }
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error during forgot password:', error);
      throw error.response?.data || error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    try {
      const response = await api.post('/public/user/reset-password', {
        token: token,
        newPassword: newPassword
      }, {
        headers: { ...utcHeader }
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error during reset password:', error);
      throw error.response?.data || error;
    }
  }

  // Verify email
  async verifyEmail(token) {
    if (!token) {
      throw new Error('Verification token is required');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    return response;
  }

  // Resend verification email
  async resendVerificationEmail() {
    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/resend-verification`, {
      method: 'POST',
      includeAuth: true,
    });

    return response;
  }

  // Delete account
  async deleteAccount(password) {
    if (!password) {
      throw new Error('Password is required to delete account');
    }

    const response = await this.makeRequest(`${this.baseURL}${this.apiPrefix}/delete-account`, {
      method: 'DELETE',
      includeAuth: true,
      body: JSON.stringify({ password }),
    });

    return response;
  }

  // Check if user is authenticated (has valid token)
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;

    const payload = this.parseJWT(token);
    if (!payload) {
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
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // Get stored refresh token
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  // Get stored user
  getUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  // Get stored accounts
  getAccounts() {
    if (typeof window === 'undefined') return null;
    
    try {
      const accountsStr = localStorage.getItem('accounts');
      return accountsStr ? JSON.parse(accountsStr) : null;
    } catch (error) {
      console.error('Error parsing accounts from localStorage:', error);
      return null;
    }
  }

  // Clear all auth data
  clearAuthData() {
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
