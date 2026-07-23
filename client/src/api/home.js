import http from './http';

export const homeApi = {
  get: async () => (await http.get('/home')).data,
  update: async (data) => (await http.put('/home', data)).data,
};
