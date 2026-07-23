import http from './http';

// Thin wrapper matching the server's generic CRUD routes (list/getOne/create/update/remove).
export function createResource(basePath) {
  return {
    list: async (params) => (await http.get(basePath, { params })).data,
    getOne: async (id) => (await http.get(`${basePath}/${id}`)).data,
    create: async (data) => (await http.post(basePath, data)).data,
    update: async (id, data) => (await http.put(`${basePath}/${id}`, data)).data,
    remove: async (id) => (await http.delete(`${basePath}/${id}`)).data,
  };
}
