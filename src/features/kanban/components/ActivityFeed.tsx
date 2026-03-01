import { useState, useEffect } from 'react'; // Thêm useEffect
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { User, GitCommit, Tag, Circle, ArrowRightLeft, MessageSquare, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MentionInput } from './MentionInput';
import { CommentItem } from './CommentItem';
import { supabase } from '../../../lib/supabase'; // Import supabase

interface ActivityFeedProps {
    taskId: string;
    members: any[];
}

export const ActivityFeed = ({ taskId, members }: ActivityFeedProps) => {
    const queryClient = useQueryClient();

    // 🔥 1. Thêm State để lưu User hiện tại (để lấy avatar)
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Lấy profile từ bảng profiles để có avatar xịn
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setCurrentUser(profile || user);
            }
        };
        loadUser();
    }, []);

    const { data: comments } = useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => projectService.getComments(taskId),
    });

    const { data: activities } = useQuery({
        queryKey: ['activities', taskId],
        queryFn: () => projectService.getActivities(taskId),
    });

    // ... (Giữ nguyên logic sort activities và comments) ...
    const sortedActivities = (activities || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const sortedComments = (comments || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const sendMutation = useMutation({
        mutationFn: (content: string) => projectService.createComment(taskId, content), // Sửa lại projectService cho đúng tham số nếu cần
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
        }
    });

    const getActivityIcon = (type: string) => {
        // ... giữ nguyên ...
        switch (type) {
            case 'STATUS': return <Circle size={14} className="text-gray-500" />;
            case 'PRIORITY': return <ArrowRightLeft size={14} className="text-orange-500" />;
            case 'LABEL': return <Tag size={14} className="text-blue-500" />;
            case 'ASSIGNEE': return <User size={14} className="text-gray-500" />;
            default: return <GitCommit size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Activity
            </h3>

            {/* System Logs (Giữ nguyên) */}
            {sortedActivities.length > 0 && (
                <div className="mb-8 pl-2 border-l border-white/5 ml-2">
                    <div className="space-y-3">
                        {sortedActivities.map((item: any) => (
                            <div key={item.id} className="flex gap-3 items-center group">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                    {getActivityIcon(item.type)}
                                </div>
                                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
                                    <span className="font-medium text-gray-400">{item.user?.full_name}</span>
                                    <span>{item.content}</span>
                                    <span className="text-gray-700 mx-1">•</span>
                                    <span className="text-gray-600">{formatDistanceToNow(new Date(item.created_at))} ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-px bg-white/5 w-full mb-8" />

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
                    Comment
                </h3>

                {sortedComments.length === 0 ? (
                    <div className="text-sm text-gray-600 italic px-2">No comments yet.</div>
                ) : (
                    <div className="space-y-6">
                        {sortedComments.map((comment: any) => (
                            // Component này sẽ lo việc parse @[Name](id) thành màu xanh
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-white/5 bg-[#0F1117] sticky bottom-0">

                {/* 🔥 2. Hiển thị Avatar thật thay vì chữ ME */}
                <div className="flex-shrink-0">
                    {currentUser ? (
                        <img
                            src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.full_name}`}
                            className="w-8 h-8 rounded-full border border-white/10 object-cover"
                            alt="Me"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
                    )}
                </div>

                <MentionInput
                    members={members}
                    onSubmit={(content) => sendMutation.mutate(content)}
                    isSubmitting={sendMutation.isPending}
                />
            </div>
        </div>
    );
};