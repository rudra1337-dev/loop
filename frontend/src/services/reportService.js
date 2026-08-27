import api from './api';

export const generateReport = (periodStart, periodEnd) =>
  api.post('/reports/generate', { periodStart, periodEnd });

export const getReports = (params) => api.get('/reports', { params });

export const getReport = (id) => api.get(`/reports/${id}`);