import http from './http';
import { createResource } from './resource';

const base = createResource('/enrollments');

export const enrollmentsApi = {
  ...base,
  listMine: async () => (await http.get('/enrollments/me')).data,
  hardRemove: async (id) => (await http.delete(`/enrollments/${id}/permanent`)).data,
};
