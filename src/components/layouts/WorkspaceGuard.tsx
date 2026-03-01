// src/components/layout/WorkspaceGuard.tsx

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../features/projects/api/projectService';
import { Loader2 } from 'lucide-react';
import { OnboardingSetup } from '../../features/onboarding/components/OnboardingSetup';

// 1. Thêm interface props để nhận children
interface WorkspaceGuardProps {
    children: React.ReactNode;
}

// 2. Nhận children từ props
export const WorkspaceGuard = ({ children }: WorkspaceGuardProps) => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const { data: workspaces, isLoading } = useQuery({
        queryKey: ['my-workspaces'],
        queryFn: projectService.getMyWorkspaces,
        retry: 1
    });

    useEffect(() => {
        if (isLoading || !workspaces) return;

        const isValidWorkspace = workspaces.some((w: any) => w.id === workspaceId);

        if (!isValidWorkspace) {
            if (workspaces.length > 0) {
                navigate(`/workspace/${workspaces[0].id}`, { replace: true });
            } else {
                // Xử lý nếu không có workspace nào
            }
        }
    }, [workspaceId, workspaces, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-[#0F1117] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-gray-500 text-sm">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (workspaces?.length === 0) {
        return <OnboardingSetup />;
    }

    // 3. 🔥 QUAN TRỌNG: Return children thay vì Outlet
    // Điều này giúp hiển thị DashboardLayout (Sidebar) được bọc bên trong
    return <>{children}</>;
};  