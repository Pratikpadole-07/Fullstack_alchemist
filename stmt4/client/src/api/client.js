import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    window.localStorage.setItem('tb_token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    window.localStorage.removeItem('tb_token');
  }
}

export function loadStoredToken() {
  const t = window.localStorage.getItem('tb_token');
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  return t;
}

export default api;
