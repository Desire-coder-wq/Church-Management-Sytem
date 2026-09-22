import axios from 'axios';
import { useAuthStore } from '../stores/auth-store';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api', timeout: 20000 });
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function getError(error: unknown): string {
  if (!axios.isAxiosError(error)) return 'The request could not be processed. Reload the page and retry.';
  if (!error.response) return 'Cannot reach the server. Check your connection and make sure the backend is running.';
  const message = error.response.data?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string') return message;
  if (error.response.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.response.status === 429) return 'Too many requests. Wait one minute before trying again.';
  return `The server could not complete this request (HTTP ${error.response.status}). Please retry shortly.`;
}
