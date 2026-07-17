import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Uses EXPO_PUBLIC_API_URL env variable for production builds.
// Set this in .env before building the APK.
const API_BASE_URL = (process.env as any).EXPO_PUBLIC_API_URL || 'http://localhost:3000';


export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically inject Tenant Code and Bearer Auth Token
api.interceptors.request.use(
  (config) => {
    const { tenantCode, token } = useAuthStore.getState();

    if (tenantCode) {
      config.headers['x-tenant-code'] = tenantCode;
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
