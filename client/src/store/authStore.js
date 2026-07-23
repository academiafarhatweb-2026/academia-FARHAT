import { create } from 'zustand';
import { authApi } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: null,
  status: 'idle', // idle | loading | ready

  fetchMe: async () => {
    set({ status: 'loading' });
    try {
      const { user } = await authApi.me();
      set({ user, status: 'ready' });
    } catch {
      set({ user: null, status: 'ready' });
    }
  },

  login: async (email, password) => {
    const { user } = await authApi.login(email, password);
    set({ user, status: 'ready' });
    return user;
  },

  loginStudent: async (email) => {
    const { user } = await authApi.studentLogin(email);
    set({ user, status: 'ready' });
    return user;
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, status: 'ready' });
  },
}));
