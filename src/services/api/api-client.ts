import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Network error state management
let hasNetworkError = false;
let networkErrorTimestamp = 0;
const NETWORK_ERROR_COOLDOWN = 30000; // 30 seconds cooldown

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// UTC header utility

// Request interceptor to add UTC headers and JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check for network error cooldown
    if (hasNetworkError) {
      const now = Date.now();
      if (now - networkErrorTimestamp < NETWORK_ERROR_COOLDOWN) {
        return Promise.reject(new Error('Network error detected. Please check your connection and try again.'));
      } else {
        // Reset network error state after cooldown
        hasNetworkError = false;
        networkErrorTimestamp = 0;
      }
    }

    // Add UTC headers to all requests
    config.headers = ({
      ...(config.headers || {}),
    } as unknown) as InternalAxiosRequestConfig['headers'];

    // Add JWT token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = ({
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        } as unknown) as InternalAxiosRequestConfig['headers'];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Reset network error state on successful response
    if (hasNetworkError) {
      hasNetworkError = false;
      networkErrorTimestamp = 0;
    }
    return response;
  },
  (error) => {
    // Check for network errors
    const isNetworkError = !error.response && (
      error.code === 'NETWORK_ERROR' || 
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') || 
      error.message?.includes('fetch') ||
      error.message?.includes('timeout')
    );

    if (isNetworkError) {
      hasNetworkError = true;
      networkErrorTimestamp = Date.now();
      console.warn('Network error detected, blocking further requests for 30 seconds');
    }

    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Utility function to manually reset network error state
export const resetNetworkErrorState = () => {
  hasNetworkError = false;
  networkErrorTimestamp = 0;
};

// Utility function to check if network is in error state
export const isNetworkInErrorState = () => {
  if (!hasNetworkError) return false;
  const now = Date.now();
  return now - networkErrorTimestamp < NETWORK_ERROR_COOLDOWN;
};

export default api;
