import http from './http';

export const settlementsApi = {
  generate: async ({ teacherId, periodMonth, periodYear }) =>
    (await http.post('/settlements/generate', { teacherId, periodMonth, periodYear })).data,
  list: async (params) => (await http.get('/settlements', { params })).data,
  getOne: async (id) => (await http.get(`/settlements/${id}`)).data,
  update: async (id, data) => (await http.put(`/settlements/${id}`, data)).data,
};
