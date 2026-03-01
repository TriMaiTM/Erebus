import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../features/projects/api/projectService';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';
import { WorkspaceSwitcher } from '../../features/projects/components/WorkspaceSwitcher';
import {
    LayoutDashboard,
    CheckCircle2,
    Settings,
    Plus,
    Hash,
    Users,
    Loader2,
    Bell // Import thêm icon Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar = () => {
    const { workspaceId } = useParams();
    const location = useLocation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // State lưu thông tin user hiện tại
    const [currentUser, setCurrentUser] = useState<any>(null);

    // 1. Fetch User Profile
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setCurrentUser(profile || {
                    full_name: user.user_metadata.full_name || user.email,
                    avatar_url: user.user_metadata.avatar_url
                });
            }
        };
        fetchUser();
    }, []);

    // 2. 🔥 FETCH SỐ LƯỢNG NOTIFICATION CHƯA ĐỌC (Polling 5s)
    const { data: unreadCount } = useQuery({
        queryKey: ['unread-count'],
        queryFn: projectService.getUnreadNotificationCount,
        refetchInterval: 5000, // Tự động refresh mỗi 5 giây
    });

    // 3. Cấu hình Navigation Items (Thêm Inbox)
    const navItems = [
        {
            name: 'Dashboard',
            icon: LayoutDashboard,
            href: `/workspace/${workspaceId}`
        },
        // 👇 MỤC INBOX MỚI
        {
            name: 'Inbox',
            icon: Bell,
            href: `/workspace/${workspaceId}/inbox`,
            badge: unreadCount // Truyền số lượng vào để render badge
        },
        {
            name: 'My Issues',
            icon: CheckCircle2,
            href: `/workspace/${workspaceId}/my-issues`
        },
        {
            name: 'Team Members',
            icon: Users,
            href: `/workspace/${workspaceId}/members`
        },
        {
            name: 'Settings',
            icon: Settings,
            href: `/workspace/${workspaceId}/settings`
        },
    ];

    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: () => projectService.getProjects(workspaceId!),
        enabled: !!workspaceId,
    });

    return (
        <aside className="w-[240px] h-screen bg-[#14151a] border-r border-white/5 flex flex-col fixed left-0 top-0 z-[100]">

            {/* HEADER: User Profile */}
            <div className="h-16 flex-none flex items-center px-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                {currentUser ? (
                    <>
                        <img
                            src={currentUser.avatar_url || 'https://github.com/shadcn.png'}
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full border border-white/10 mr-3 object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                                {currentUser.full_name || 'User'}
                            </span>
                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                            <div className="h-2 w-12 bg-white/10 rounded animate-pulse" />
                        </div>
                    </div>
                )}
            </div>
            <div className="h-16 flex-none flex flex-col justify-center border-b border-white/5">
                <WorkspaceSwitcher />
            </div>

            {/* New Issue Button */}
            <div className="flex-none px-3 py-4">
                <button className="flex items-center gap-2 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md px-3 py-1.5 text-sm font-medium transition-all group">
                    <div className="bg-primary text-white rounded p-0.5 group-hover:scale-110 transition-transform">
                        <Plus size={14} />
                    </div>
                    <span>New Issue</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-hide">
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] font-semibold text-white transition-all group relative",
                                    isActive
                                        ? "bg-white/5 text-white font-medium"
                                        : "text-white hover:text-white hover:bg-white/5"
                                )}
                            >
                                {/* Icon Wrapper có Badge Dot */}
                                <div className="relative">
                                    <item.icon size={16} className={cn("transition-colors", isActive ? "text-primary" : "group-hover:text-gray-100")} />

                                    {/* 🔥 LOGIC CHẤM ĐỎ (PING) */}
                                    {item.name === 'Inbox' && item.badge && item.badge > 0 ? (
                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-[#14151a]"></span>
                                        </span>
                                    ) : null}
                                </div>

                                <span className="flex-1">{item.name}</span>

                                {/* 🔥 LOGIC SỐ LƯỢNG (BADGE COUNT) */}
                                {item.name === 'Inbox' && item.badge && item.badge > 0 ? (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        );
                    })}
                </div>

                {/* Projects List */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Your Projects
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-0.5">
                        {isLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Loading...
                            </div>
                        ) : (
                            projects?.map((proj: any) => {
                                const isActive = location.pathname.includes(`/projects/${proj.id}`);
                                return (
                                    <Link
                                        key={proj.id}
                                        to={`/workspace/${workspaceId}/projects/${proj.id}`}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all",
                                            isActive
                                                ? "bg-white/5 text-gray-100"
                                                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="flex-shrink-0">{proj.icon || <Hash size={14} />}</span>
                                        <span className="truncate">{proj.name}</span>
                                    </Link>
                                );
                            })
                        )}
                        {projects?.length === 0 && (
                            <div
                                className="px-3 py-2 text-xs text-gray-600 italic hover:text-gray-400 cursor-pointer"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                + Create your first project
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="flex-none p-4 border-t border-white/5 mt-auto bg-[#14151a] text-[10px] text-gray-600 text-center">
                Erebus v1.0
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                workspaceId={workspaceId!}
            />
        </aside>
    );
};