import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  designation?: string;
  department?: string;
}

interface AuthState {
  tenantCode: string | null;
  token: string | null;
  user: UserProfile | null;
  setTenantCode: (code: string) => void;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  tenantCode: null,
  token: null,
  user: null,
  setTenantCode: (code) => set({ tenantCode: code }),
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));
