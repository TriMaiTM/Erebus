import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { Bell, MessageSquare, UserPlus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';


export const Inbox = () => {
    const navigate = useNavigate();
    const { workspaceId } = useParams();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: projectService.getNotifications,
    });

    const readMutation = useMutation({
        mutationFn: projectService.markNotificationAsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    });

    const handleItemClick = (noti: any) => {
        // Mark as read
        if (!noti.is_read) readMutation.mutate(noti.id);

        // Kiểm tra kỹ dữ liệu trước khi nhảy
        const task = noti.task;
        const project = task?.project;

        // 1. Kiểm tra xem có đủ dữ liệu không
        if (!task || !project || !project.id) {
            console.error("❌ Thiếu thông tin Project ID hoặc Task ID", noti);
            alert("Cannot navigate: Missing Project data. Please try refreshing the page.");
            return;
        }

        // 2. Kiểm tra workspaceId (đề phòng biến này bị rỗng)
        if (!workspaceId) {
            console.error("❌ Không tìm thấy Workspace ID");
            return;
        }

        // 3. Nếu đủ hết thì mới nhảy
        const targetUrl = `/workspace/${workspaceId}/projects/${project.id}/board?taskId=${task.id}`;
        console.log("🚀 Navigating to:", targetUrl); // Check log xem link chuẩn chưa

        navigate(targetUrl);
    };

    if (isLoading) return <div className="p-8 text-gray-500">Loading inbox...</div>;

    return (
        <div className="h-full flex flex-col bg-[#0F1117] max-w-3xl mx-auto border-x border-white/5">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bell size={20} /> Inbox
                </h1>
                <span className="text-xs text-gray-500">
                    {notifications?.filter((n: any) => !n.is_read).length} unread
                </span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {notifications?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications?.map((noti: any) => (
                            <div
                                key={noti.id}
                                onClick={() => handleItemClick(noti)}
                                className={`p-4 flex gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${!noti.is_read ? 'bg-blue-500/[0.05]' : ''}`}
                            >
                                <div className="mt-1">
                                    {noti.type === 'COMMENT' ? <MessageSquare size={16} className="text-blue-400" /> : <UserPlus size={16} className="text-green-400" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-sm text-gray-300">
                                            <span className="font-semibold text-white">{noti.actor?.full_name}</span>
                                            <span className="mx-1 text-gray-500">{noti.content}</span>
                                            <span className="font-medium text-gray-200">{noti.task?.title}</span>
                                        </div>
                                        <span className="text-xs text-gray-600 whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(noti.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                        {noti.task?.project?.key}-{noti.task?.id?.slice(0, 4)}
                                    </div>
                                </div>
                                {!noti.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};