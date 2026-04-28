// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

let isRedirecting = false;

// ✅ Handle 401 safely (NO LOOP)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      if (typeof window !== 'undefined' && !isRedirecting) {
        const currentPath = window.location.pathname;

        // 🚨 Robust check: don't redirect if we are already on or going to the login page
        if (!currentPath.startsWith('/login')) {
          isRedirecting = true;
          console.warn('[API] 401 Unauthorized. Redirecting to login.');

          // Clear session data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');

          // ✅ Replace location to avoid back-button loops
          window.location.replace('/login');
          
          // Guard for 5 seconds to let the page refresh
          setTimeout(() => { isRedirecting = false; }, 5000);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;