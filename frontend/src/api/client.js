import axios from 'axios';

export const TOKEN_KEY = 'todo_token';

// Where our backend lives. This changes when you put the app on a real website.
const baseURL = import.meta.env.QCLI_API_URL || 'http://localhost:3000/api';

export const api = axios.create({ baseURL, timeout: 15000 });

// Before every request, add the saved token ("show your ID card")
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});