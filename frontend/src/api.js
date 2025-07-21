import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

export const register = (formData) => API.post('/auth/register', formData);
export const login = (formData) => API.post('/auth/token', formData);

export default API; 