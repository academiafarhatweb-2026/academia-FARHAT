import http from './http';
import { createResource } from './resource';

export const productsApi = {
  ...createResource('/products'),
  adjustStock: async (id, delta) => (await http.patch(`/products/${id}/stock`, { delta })).data,
  reorder: async (ids) => (await http.put('/products/reorder', { ids })).data,
  // Category names to suggest while typing (free text, no fixed list).
  categorySuggestions: async () => (await http.get('/products/categories')).data,
};

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type left unset so the browser adds the multipart boundary.
  const { data } = await http.post('/uploads/product-image', formData);
  return data.url;
}
