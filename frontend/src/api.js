import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if:
    // 1. It's a 401 error (unauthorized)
    // 2. We haven't already tried refreshing for this request
    // 3. We have a refresh token available
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      localStorage.getItem(REFRESH_TOKEN)
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        if (response.data.access) {
          const newToken = response.data.access;
          
          // Update tokens
          localStorage.setItem(ACCESS_TOKEN, newToken);
          
          // Update the header for the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Also update the default header for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the original request
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token is invalid, clear tokens and redirect to login
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        
        // Only redirect if we're in a browser environment
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;