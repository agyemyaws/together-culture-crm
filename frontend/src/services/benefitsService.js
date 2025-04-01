import api from '../api';

export const benefitsService = {
  // User-facing benefit functions
  getBenefitsDashboard: async () => {
    const response = await api.get('/api/benefits/dashboard/');
    return response.data;
  },

  activateBenefit: async (benefitId) => {
    const response = await api.post(`/api/benefits/dashboard/${benefitId}/activate/`);
    return response.data;
  },

  // Admin benefit management functions
  getAllBenefits: async () => {
    const response = await api.get('/api/benefits/admin/');
    return response.data;
  },

  createBenefit: async (benefitData) => {
    const response = await api.post('/api/benefits/admin/', benefitData);
    return response.data;
  },

  updateBenefit: async (benefitId, benefitData) => {
    const response = await api.put(`/api/benefits/admin/${benefitId}/`, benefitData);
    return response.data;
  },

  deleteBenefit: async (benefitId) => {
    const response = await api.delete(`/api/benefits/admin/${benefitId}/`);
    return response.data;
  },

  // Benefit usage statistics and tracking
  getBenefitUsageStats: async () => {
    const response = await api.get('/api/benefits/admin/usage_stats/');
    return response.data;
  },

  getBenefitUsageHistory: async (benefitId, userId = null) => {
    let url = `/api/benefits/admin/${benefitId}/usage-history/`;
    if (userId) {
      url += `?user_id=${userId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  logBenefitUsage: async (benefitId, userId, notes = '') => {
    const response = await api.post(`/api/benefits/admin/${benefitId}/log-usage/`, {
      user_id: userId,
      notes
    });
    return response.data;
  },

  // User benefit usage history
  getUserBenefitUsage: async (userId) => {
    const response = await api.get(`/api/benefits/usage/user/${userId}/`);
    return response.data;
  }
};

export default benefitsService; 