/**
 * X-29 Auth Store (stores/useAuthStore.ts)
 * Dedicated Zustand store for session state.
 */

import { create } from 'zustand';
import type { AuthUser, AuthStatus } from '@/types/auth';
import { AuthService } from '@/services/authService';

interface AuthStoreState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  status: 'idle',
  error: null,
  setUser: (user) =>
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
      error: null
    }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: 'error' }),
  logout: async () => {
    try {
      await AuthService.signOut();
      set({ user: null, status: 'unauthenticated', error: null });
    } catch (e) {
      console.error('Logout error:', e);
      set({ error: (e as Error).message });
    }
  }
}));

export default useAuthStore;
