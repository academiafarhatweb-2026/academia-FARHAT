import http from './http';

export async function uploadFiles(fileList) {
  const formData = new FormData();
  Array.from(fileList).forEach((file) => formData.append('files', file));

  // Content-Type is left unset on purpose: the browser needs to generate the
  // multipart boundary itself, otherwise the server can't parse the upload.
  const { data } = await http.post('/uploads', formData);
  return data.urls;
}
