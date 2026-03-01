import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Loader2 } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/login');
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-white">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    // Nếu đã login thì render nội dung bên trong (Dashboard)
    return user ? <>{children}</> : null;
};