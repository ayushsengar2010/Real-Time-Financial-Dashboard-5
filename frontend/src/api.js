import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const HISTORICAL_CACHE_TTL_MS = Number(process.env.REACT_APP_HISTORICAL_CACHE_TTL_MS || 10 * 60 * 1000);

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

const historicalCache = new Map();
const historicalInflight = new Map();

const historicalKey = (symbol, days) => `${String(symbol || '').toUpperCase()}::${days}`;

export const getHistoricalData = async (symbol, days = 30, options = {}) => {
  const key = historicalKey(symbol, days);
  const now = Date.now();
  const ttlMs = Number(options.ttlMs ?? HISTORICAL_CACHE_TTL_MS);
  const forceRefresh = Boolean(options.forceRefresh);

  if (!forceRefresh) {
    const cached = historicalCache.get(key);
    if (cached && now - cached.fetchedAt < ttlMs) {
      return cached.data;
    }
  }

  const inflight = historicalInflight.get(key);
  if (inflight) return inflight;

  const request = API.get(`/market/data/${String(symbol || '').toUpperCase()}/historical`, { params: { days } })
    .then((res) => {
      const data = res.data || {};
      historicalCache.set(key, { data, fetchedAt: Date.now() });
      return data;
    })
    .finally(() => {
      historicalInflight.delete(key);
    });

  historicalInflight.set(key, request);
  return request;
};

export default API; 
