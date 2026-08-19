import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'merchant' | 'user';
  storeId?: string;
  setupStatus?: string;
  setupWizardPage?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  storeId: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setStoreId: (storeId: string) => void;
  setUserName: (name: string) => void;
  setSetupProgress: (page: number) => void;
  setSetupComplete: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      storeId: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },
      setStoreId: (storeId) => set({ storeId }),
      setUserName: (name) => set((s) => ({ user: s.user ? { ...s.user, name } : s.user })),
      setSetupProgress: (page) =>
        set((s) => ({ user: s.user ? { ...s.user, setupStatus: 'INPROGRESS', setupWizardPage: page } : s.user })),
      setSetupComplete: () =>
        set((s) => ({ user: s.user ? { ...s.user, setupStatus: 'COMPLETED', setupWizardPage: 5 } : s.user })),
      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, storeId: null });
      },
    }),
    {
      name: 'auth-store-v3',
      version: 3,
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        storeId: s.storeId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) localStorage.setItem('accessToken', state.accessToken);
        if (state?.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
      },
    }
  )
);
