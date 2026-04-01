import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const token = localStorage.getItem('token');
if (token) {
  API.defaults.headers.common.Authorization = `Bearer ${token}`;
}

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      delete API.defaults.headers.common.Authorization;

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const register = (formData) => API.post('/auth/register', formData);
export const login = (formData) => API.post('/auth/token', formData);

export default API; 
