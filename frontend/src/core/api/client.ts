/**
 * Axios API Client Configuration
 * @owner: Sujal (Shared - Both review)
 * @purpose: Configure Axios for frontend-backend communication
 */

import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/auth';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and retries
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for timeout and network errors
    if (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) &&
      !originalRequest._retry &&
      ['get', 'head', 'options'].includes(originalRequest.method?.toLowerCase() || '')
    ) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      // Retry up to 3 times
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        originalRequest._retry = true;

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;

        console.log(
          `[API] ⏳ Retrying request (attempt ${originalRequest._retryCount}/3) after ${delay}ms...`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return apiClient(originalRequest);
      } else {
        console.error('[API] ❌ All retry attempts failed');
      }
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._authRetry) {
      originalRequest._authRetry = true;

      // Remove invalid token
      removeAuthToken();

      // Redirect to login — preserve admin login path so admin users land on /admin/login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/admin/login') {
        const isAdminPath = currentPath.startsWith('/admin');
        window.location.href = isAdminPath ? '/admin/login' : '/login';
      }
    }

    // Handle 403 Forbidden - Account blocked or insufficient permissions
    if (error.response?.status === 403) {
      // Show error message
      console.error('Access forbidden:', error.response.data.message);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

