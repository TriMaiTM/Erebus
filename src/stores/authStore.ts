import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    setAuth: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isLoading: true, // Mặc định là true để check session khi mới vào app
    setAuth: (session) => set({ session, user: session?.user ?? null, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ session: null, user: null, isLoading: false }),
}));