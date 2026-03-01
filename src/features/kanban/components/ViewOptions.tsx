import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
    viewMode: 'board' | 'list';
    setViewMode: (mode: 'board' | 'list') => void;
}

export const ViewOptions = ({ viewMode, setViewMode }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside để đóng menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
            >
                <SlidersHorizontal size={14} />
                <span>Display</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1e2029] border border-white/10 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 mb-1">Layout</div>

                    <button
                        onClick={() => { setViewMode('board'); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${viewMode === 'board' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <LayoutGrid size={16} />
                        <span>Board</span>
                        {viewMode === 'board' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>

                    <button
                        onClick={() => { setViewMode('list'); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <List size={16} />
                        <span>List</span>
                        {viewMode === 'list' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                </div>
            )}
        </div>
    );
};