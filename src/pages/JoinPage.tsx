import { useEffect, useRef } from 'react'; // Nhớ import useRef
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../features/projects/api/projectService';
import { Loader2 } from 'lucide-react';

export const JoinPage = () => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 🔥 1. Tạo một cái biến để đánh dấu
    const hasJoinedRef = useRef(false);

    const joinMutation = useMutation({
        mutationFn: (id: string) => projectService.joinWorkspace(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            navigate('/');
        },
        onError: (error: any) => {
            // 🔥 2. Nếu lỗi là "đã tồn tại" (duplicate) thì coi như thành công
            if (error.code === '23505' || error.message?.includes('Already a member')) {
                navigate('/');
                return;
            }
            console.error(error);
            alert('Failed to join workspace. Please try again.');
            navigate('/');
        }
    });

    useEffect(() => {
        // 🔥 3. Kiểm tra khóa trước khi chạy
        if (workspaceId && !hasJoinedRef.current) {
            hasJoinedRef.current = true; // Khóa lại ngay lập tức
            joinMutation.mutate(workspaceId);
        }
    }, [workspaceId]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0F1117] text-white">
            <Loader2 size={48} className="animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold">Joining Workspace...</h2>
            <p className="text-gray-500 mt-2">Please wait a moment</p>
        </div>
    );
};