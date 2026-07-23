import http from './http';

export const paymentsApi = {
  create: async ({ enrollmentId, classesCount, amount }) =>
    (await http.post('/payments', { enrollmentId, classesCount, amount })).data,
  list: async () => (await http.get('/payments')).data,
  listByEnrollment: async (enrollmentId) =>
    (await http.get(`/payments/enrollment/${enrollmentId}`)).data,
  update: async (id, data) => (await http.put(`/payments/${id}`, data)).data,
  remove: async (id) => (await http.delete(`/payments/${id}`)).data,
};
