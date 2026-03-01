import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
    Search,
    Layout,
    Moon,
    Sun,
    LogOut,
    KanbanSquare,
    FolderKanban,
    CheckCircle2,
    Laptop,
    CircleDot
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { projectService } from '../../features/projects/api/projectService';
import { useQuery } from '@tanstack/react-query';

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // 1. Fetch dữ liệu tìm kiếm (Projects & Tasks)
    const { data } = useQuery({
        queryKey: ['global-search'],
        queryFn: projectService.searchGlobal
    });

    const projects = data?.projects || [];
    const tasks = data?.tasks || [];

    // 2. Lắng nghe phím tắt Ctrl+K / Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Helper: Chạy lệnh và đóng menu
    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    // Helper: Xử lý đổi Theme
    const setTheme = (theme: 'dark' | 'light' | 'system') => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }
        // Lưu vào localStorage nếu muốn nhớ setting
        localStorage.setItem('theme', theme);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            // CSS classes cho menu căn giữa, backdrop blur
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl z-[9999] overflow-hidden p-0 animate-in fade-in zoom-in-95 duration-200"
        >
            {/* Header Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <Search size={18} className="text-gray-500" />
                <Command.Input
                    placeholder="Type to search..."
                    className="flex-1 bg-transparent text-gray-200 placeholder:text-gray-600 outline-none text-base font-sans"
                />
                <div className="flex gap-1">
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-gray-400">
                        ESC
                    </kbd>
                </div>
            </div>

            {/* List Results */}
            <Command.List className="max-h-[350px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                <Command.Empty className="py-8 text-center text-sm text-gray-500">
                    No results found.
                </Command.Empty>

                {/* --- NHÓM 1: TRANG CHÍNH --- */}
                <Command.Group heading="Navigation" className="text-[10px] font-bold text-gray-500 px-2 py-1.5 mb-1 uppercase tracking-wider">
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/'))}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all"
                    >
                        <Layout size={16} />
                        <span>Dashboard</span>
                    </Command.Item>
                    <Command.Item
                        onSelect={() => runCommand(() => navigate('/issues'))}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all"
                    >
                        <KanbanSquare size={16} />
                        <span>My Issues</span>
                    </Command.Item>
                </Command.Group>

                {/* --- NHÓM 2: PROJECTS (Lấy từ DB) --- */}
                {projects.length > 0 && (
                    <Command.Group heading="Projects" className="text-[10px] font-bold text-gray-500 px-2 py-1.5 mb-1 mt-2 uppercase tracking-wider">
                        {projects.map((p: any) => (
                            <Command.Item
                                key={p.id}
                                value={p.name} // Value dùng để filter khi gõ
                                onSelect={() => runCommand(() => navigate(`/workspace/${p.workspace_id}/board?project=${p.id}`))}
                                // Lưu ý: Sửa lại đường dẫn trên cho khớp với route board của bạn
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all"
                            >
                                <FolderKanban size={16} className="text-blue-400" />
                                <span>{p.name}</span>
                                <span className="ml-auto text-xs text-gray-600 font-mono">{p.key}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {/* --- NHÓM 3: TASKS (Lấy từ DB) --- */}
                {tasks.length > 0 && (
                    <Command.Group heading="Recent Issues" className="text-[10px] font-bold text-gray-500 px-2 py-1.5 mb-1 mt-2 uppercase tracking-wider">
                        {tasks.map((t: any) => (
                            <Command.Item
                                key={t.id}
                                value={`${t.project?.key}-${t.position} ${t.title}`} // Filter cả Key lẫn Title
                                onSelect={() => runCommand(() => navigate(`/workspace/default/board?taskId=${t.id}`))}
                                // Lưu ý: Cần logic lấy workspaceId đúng nếu app có nhiều workspace
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all"
                            >
                                <CircleDot size={16} className="text-orange-400" />
                                <span className="truncate">{t.title}</span>
                                <span className="ml-auto text-xs text-gray-500 font-mono flex-shrink-0">
                                    {t.project?.key}-{t.position}
                                </span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                )}

                {/* --- NHÓM 4: THEME & SYSTEM --- */}
                <Command.Group heading="Theme & System" className="text-[10px] font-bold text-gray-500 px-2 py-1.5 mb-1 mt-2 uppercase tracking-wider">
                    <Command.Item onSelect={() => runCommand(() => setTheme('dark'))} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all">
                        <Moon size={16} /> Switch to Dark Mode
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => setTheme('light'))} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all">
                        <Sun size={16} /> Switch to Light Mode
                    </Command.Item>
                    <Command.Item onSelect={() => runCommand(() => setTheme('system'))} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 rounded-md cursor-pointer aria-selected:bg-primary/20 aria-selected:text-white transition-all">
                        <Laptop size={16} /> Use System Theme
                    </Command.Item>

                    <div className="h-px bg-white/5 my-2 mx-2" />

                    <Command.Item
                        onSelect={() => runCommand(handleLogout)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-md cursor-pointer aria-selected:bg-red-500/10 aria-selected:text-red-400 transition-all"
                    >
                        <LogOut size={16} /> Log Out
                    </Command.Item>
                </Command.Group>
            </Command.List>

            {/* Footer hints */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20 text-[10px] text-gray-500">
                <div className="flex gap-2">
                    <span>Use <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to navigate</span>
                    <span><kbd className="font-sans">↵</kbd> to select</span>
                </div>
                <span>Linear Clone v1.0</span>
            </div>
        </Command.Dialog>
    );
};