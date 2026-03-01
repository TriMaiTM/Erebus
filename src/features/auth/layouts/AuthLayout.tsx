import { ReactNode } from 'react';

export const AuthLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-white p-4">
            {/* Một chút hiệu ứng gradient mờ ở góc để tạo chiều sâu cho Erebus */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[350px] space-y-8">
                {children}
            </div>
        </div>
    );
};