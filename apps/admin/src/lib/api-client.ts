import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, logout, setAuth } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken },
          );
          const { user, accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
          setAuth(user, newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
