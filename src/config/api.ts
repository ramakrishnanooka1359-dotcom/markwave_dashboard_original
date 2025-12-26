export const API_CONFIG = {
  getBaseUrl: () => {
    const corsUrl = 'https://cors-couipk45fa-el.a.run.app';
    const productionUrl = 'https://markwave-live-apis-couipk45fa-el.a.run.app';
    const baseUrl = `${corsUrl}/${productionUrl}`;
    return baseUrl;
  }
};

export const API_ENDPOINTS = {
  getUsers: () => `${API_CONFIG.getBaseUrl()}/users/customers`,
  getReferrals: () => `${API_CONFIG.getBaseUrl()}/users/referrals`,
  createUser: () => `${API_CONFIG.getBaseUrl()}/users/`,
  getUserDetails: (mobile: string) => `${API_CONFIG.getBaseUrl()}/users/${mobile}`,
  verifyUser: () => `${API_CONFIG.getBaseUrl()}/users/verify`,
  updateUser: (mobile: string) => `${API_CONFIG.getBaseUrl()}/users/${mobile}`,
  getProducts: () => `${API_CONFIG.getBaseUrl()}/products`,
  health: () => `${API_CONFIG.getBaseUrl()}/health`,
  getPendingUnits: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/pending`,
  approveUnit: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/approve`,
  rejectUnit: () => `${API_CONFIG.getBaseUrl()}/purchases/admin/units/reject`,
};
