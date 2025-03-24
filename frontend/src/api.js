import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Existing interceptors (keep the entire existing interceptor code)
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

// Add benefits-specific methods to the api object
api.benefits = {
  /**
   * Fetch available benefits for the current user
   * @returns {Promise} Promise resolving to available benefits
   */
  getAvailableBenefits: () => api.get('/benefits/'),

  /**
   * Use a specific benefit
   * @param {number} benefitId - The ID of the benefit to use
   * @returns {Promise} Promise resolving to the usage result
   */
  useBenefit: (benefitId) => api.post('/benefits/usage/', { benefit_id: benefitId }),

  /**
   * Get user's benefit usage history
   * @returns {Promise} Promise resolving to benefit usage records
   */
  getBenefitUsageHistory: () => api.get('/benefits/usage/'),

  /**
   * Cancel a specific benefit usage
   * @param {number} usageId - The ID of the benefit usage to cancel
   * @returns {Promise} Promise resolving to the cancellation result
   */
  cancelBenefitUsage: (usageId) => api.delete(`/benefits/usage/${usageId}/`)
};

// Existing token refresh interceptor remains the same
// (keep the entire existing response interceptor code)

export default api;