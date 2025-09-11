import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// UTC header utility
export const utcHeader: Record<string, number> = {
  utcoffset: new Date().getTimezoneOffset(),
};

// Request interceptor to add UTC headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add UTC headers to all requests
    config.headers = ({
      ...(config.headers || {}),
      ...utcHeader,
    } as unknown) as InternalAxiosRequestConfig['headers'];
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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

export default api;
