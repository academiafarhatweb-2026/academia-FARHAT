import http from './http';
import { createResource } from './resource';

export const instrumentsApi = createResource('/instruments');
export const teachersApi = createResource('/teachers');
export const plansApi = createResource('/plans');
export const classesApi = createResource('/classes');

export const studentsApi = {
  ...createResource('/students'),
  hardRemove: async (id) => (await http.delete(`/students/${id}/permanent`)).data,
};
