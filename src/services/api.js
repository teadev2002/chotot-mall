import { getCookie } from '../utils/cookie';

export const apiFetch = async (url, options = {}) => {
  const token = getCookie('accessToken');

  const headers = {
    'accept': '*/*',
    ...options.headers
  };

  // Chỉ thêm Content-Type nếu không phải FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  return fetch(url, config);
};
