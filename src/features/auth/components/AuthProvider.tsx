import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setAuth, setLoading } = useAuthStore();

    useEffect(() => {
        // 1. Check session hiện tại ngay khi mở app
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session);
        });

        // 2. Lắng nghe sự thay đổi (Đăng nhập, Đăng xuất, Refresh Token)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuth(session);
        });

        return () => subscription.unsubscribe();
    }, [setAuth]);

    return <>{children}</>;
};