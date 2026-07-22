import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    globalRole: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    role: string;
  } | null;
  login: (data: { token: string; user: any; tenant: any }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      login: (data) =>
        set({
          token: data.token,
          user: data.user,
          tenant: data.tenant,
        }),
      logout: () => set({ token: null, user: null, tenant: null }),
    }),
    {
      name: 'auth-storage', // tersimpan di localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
