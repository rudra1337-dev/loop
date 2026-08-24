import api from './api';

export const getFeedbacks = (params) => api.get('/feedback', { params });
export const getStats = (params) => api.get('/feedback/stats', { params });
export const getTrends = (params) => api.get('/feedback/trends', { params });
export const ingestSingle = (data) => api.post('/feedback/ingest/single', data);

export const ingestCSV = (file, defaultChannel) => {
  const formData = new FormData();
  formData.append('file', file);
  if (defaultChannel) {
    formData.append('defaultChannel', defaultChannel);
  }
  return api.post('/feedback/ingest/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteFeedback = (id) => api.delete(`/feedback/${id}`);

export const ingestChannel = (channel) => api.post('/feedback/ingest/channel', { channel });

export const getThemes = () => api.get('/feedback/themes');

export const updateFeedbackStatus = (id, status) => api.patch(`/feedback/${id}/status`, { status });

export const reclassifyFeedbacks = (feedbackIds) => api.post('/feedback/reclassify', { feedbackIds });

export const askFeedback = (question) => api.post('/feedback/ask', { question });