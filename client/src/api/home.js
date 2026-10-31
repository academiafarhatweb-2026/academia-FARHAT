import http from './http';

export const homeApi = {
  // /home is edge-cached for a minute; `fresh` bypasses that (the admin editor
  // must always see what's really saved).
  get: async ({ fresh = false } = {}) =>
    (await http.get('/home', fresh ? { params: { t: Date.now() } } : undefined)).data,
  update: async (data) => (await http.put('/home', data)).data,
};
