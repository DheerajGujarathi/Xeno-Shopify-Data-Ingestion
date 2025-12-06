import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

export const shopifyAPI = {
  updateConfig: (data) => api.post('/shopify/config', data),
  syncAll: () => api.post('/shopify/sync/all'),
  syncCustomers: () => api.post('/shopify/sync/customers'),
  syncProducts: () => api.post('/shopify/sync/products'),
  syncOrders: () => api.post('/shopify/sync/orders'),
  getLogs: () => api.get('/shopify/sync/logs'),
};

export const insightsAPI = {
  getOverview: () => api.get('/insights/overview'),
  getOrdersByDate: (params) => api.get('/insights/orders-by-date', { params }),
  getTopCustomers: (params) => api.get('/insights/top-customers', { params }),
  getRevenueTrend: (params) => api.get('/insights/revenue-trend', { params }),
  getProductPerformance: (params) => api.get('/insights/product-performance', { params }),
  getRecentOrders: (params) => api.get('/insights/recent-orders', { params }),
  getCustomerGrowth: (params) => api.get('/insights/customer-growth', { params }),
};

export default api;
