import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// The session cookie expired (or was revoked) mid-use: send the person back
// to log in instead of leaving every button silently failing.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    const isProtectedPage = /^\/(admin|student)(\/|$)/.test(window.location.pathname);
    if (error.response?.status === 401 && !isAuthCall && isProtectedPage) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default http;
