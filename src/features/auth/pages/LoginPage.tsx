import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { AuthLayout } from '../layouts/AuthLayout';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Đường dẫn quay lại app sau khi user nhấn vào link trong email
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) {
            console.error('Error sending magic link:', error.message);
        } else {
            console.log('Magic link sent to:', email);
            alert('Check your email for the login link!');
        }
        setLoading(false);
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center text-center space-y-2">
                {/* Logo giả lập cho Erebus: Một hình tròn đen viền trắng đơn giản */}
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    <div className="w-6 h-6 bg-black rounded-full" />
                </div>

                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome to Erebus
                </h1>
                <p className="text-sm text-gray-400">
                    The next generation of issue tracking.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <input
                        type="email"
                        placeholder="name@company.com"
                        required
                        className="w-full bg-[#111111] border border-[#222222] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all placeholder:text-gray-600"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={loading}
                    variant="primary"
                >
                    Send Magic Link
                </Button>
            </form>

            <p className="text-center text-xs text-gray-500 px-8">
                By clicking continue, you agree to our Terms of Service and Privacy Policy.
            </p>
        </AuthLayout>
    );
};