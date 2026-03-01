import { useEffect, type Fragment, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const SlideOver = ({ isOpen, onClose, children }: SlideOverProps) => {
    // Đóng khi bấm ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Panel trượt từ phải sang */}
            <div className="absolute inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                <div className={cn(
                    "pointer-events-auto w-screen max-w-7xl transform transition-transform duration-300 ease-in-out bg-[#14151a] border-l border-white/10 shadow-2xl h-full flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    {/* Header / Close Button */}
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            onClick={onClose}
                            className="rounded-md text-gray-400 hover:text-white focus:outline-none"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="h-full overflow-y-auto p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};