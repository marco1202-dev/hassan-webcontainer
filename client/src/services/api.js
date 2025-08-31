import axios from 'axios';
import config, { getApiUrl } from '../config/config';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden:', error.response.data);
    }
    
    if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const apiService = {
  // GET request
  get: (endpoint, config = {}) => api.get(endpoint, config),
  
  // POST request
  post: (endpoint, data = {}, config = {}) => api.post(endpoint, data, config),
  
  // PUT request
  put: (endpoint, data = {}, config = {}) => api.put(endpoint, data, config),
  
  // DELETE request
  delete: (endpoint, config = {}) => api.delete(endpoint, config),
  
  // File upload with progress
  upload: (endpoint, formData, onProgress, config = {}) => {
    return api.post(endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  
  // Download file
  download: (endpoint, config = {}) => {
    return api.get(endpoint, {
      ...config,
      responseType: 'blob',
    });
  },
};

// Export the configured axios instance
export default api;
