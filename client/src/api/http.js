import axios from 'axios';

// Always same-origin: vercel.json (production) and vite.config.js (development)
// proxy /api to the backend. Calling the backend's own domain directly would
// make the session cookie third-party, and mobile browsers (Safari/iOS above
// all) drop those — logins would "succeed" but never stick.
const http = axios.create({
  baseURL: '/api',
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
