import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../api/projectService';
import { ChevronsUpDown, Check, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CreateWorkspaceModal } from '../../kanban/components/CreateWorkspaceModal';

export const WorkspaceSwitcher = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false); // State quản lý modal
    const menuRef = useRef<HTMLDivElement>(null);

    const { data: workspaces } = useQuery({
        queryKey: ['my-workspaces'],
        queryFn: projectService.getMyWorkspaces,
    });

    const currentWorkspace = workspaces?.find(w => w.id === workspaceId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = (id: string) => {
        setIsOpen(false);
        navigate(`/workspace/${id}`);
    };

    return (
        <div className="relative px-3 py-2" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {currentWorkspace?.name?.[0] || 'W'}
                    </div>
                    <span className="text-sm font-semibold text-white truncate">
                        {currentWorkspace?.name || 'Select Workspace'}
                    </span>
                </div>
                <ChevronsUpDown size={14} className="text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-[#1e2029] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
                    <div className="p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        My Workspaces
                    </div>
                    {workspaces?.map((ws: any) => (
                        <button
                            key={ws.id}
                            onClick={() => handleSwitch(ws.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                        >
                            <Building2 size={14} className="text-gray-500" />
                            <span className="flex-1 truncate">{ws.name}</span>
                            {ws.id === workspaceId && <Check size={14} className="text-primary" />}
                        </button>
                    ))}

                    <div className="border-t border-white/5 mt-1 pt-1">
                        <button
                            // 🔥 THÊM SỰ KIỆN Ở ĐÂY
                            onClick={() => setIsCreateOpen(true)}
                            className="w-full px-3 py-2 text-xs text-gray-500 hover:text-white text-left"
                        >
                            + Create Workspace
                        </button>
                    </div>
                </div>
            )}

            {/* 🔥 RENDER MODAL Ở ĐÂY */}
            <CreateWorkspaceModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </div>
    );
};