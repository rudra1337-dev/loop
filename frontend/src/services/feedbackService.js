import api from './api';

export const getFeedbacks = (params) => api.get('/feedback', { params });
export const getStats = () => api.get('/feedback/stats');
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
