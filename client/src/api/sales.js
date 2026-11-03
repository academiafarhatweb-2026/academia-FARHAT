import http from './http';

export const salesApi = {
  // { from, to } as "YYYY-MM-DD", both inclusive
  list: async (params) => (await http.get('/sales', { params })).data,
  // Resolves to { sale, product } — the product with its stock already reduced
  create: async (data) => (await http.post('/sales', data)).data,
  // Moves any change in quantity in or out of stock; resolves to the sale
  update: async (id, data) => (await http.put(`/sales/${id}`, data)).data,
  // Undoes the sale and returns its units to stock
  remove: async (id) => (await http.delete(`/sales/${id}`)).data,
};
