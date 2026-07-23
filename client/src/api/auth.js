import http from './http';

export const authApi = {
  login: async (email, password) => (await http.post('/auth/login', { email, password })).data,
  studentLogin: async (email) => (await http.post('/auth/student-login', { email })).data,
  logout: async () => (await http.post('/auth/logout')).data,
  me: async () => (await http.get('/auth/me')).data,
};
