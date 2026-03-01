import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { projectService } from '../features/projects/api/projectService';
import { TaskRow } from '../features/kanban/components/TaskRow';
import { IssueDetail } from '../features/kanban/components/IssueDetail';
import { Loader2 } from 'lucide-react';

export const MyIssuesPage = () => {
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Lấy User ID hiện tại
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch user session 1 lần
    useState(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });
    });

    // Fetch Tasks
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['my-tasks', userId],
        queryFn: () => userId ? projectService.getMyTasks(userId) : Promise.resolve([]),
        enabled: !!userId, // Chỉ chạy khi đã có userId
    });

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0F1117] text-gray-300">
            {/* Header */}
            <div className="flex-none px-8 py-6 border-b border-white/5">
                <h1 className="text-2xl font-bold text-white mb-1">My Issues</h1>
                <p className="text-sm text-gray-500">Tasks assigned to you across all projects</p>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto">
                {tasks?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <p>No issues assigned to you.</p>
                        <p className="text-sm">You're all caught up! 🎉</p>
                    </div>
                ) : (
                    <div>
                        {/* Table Header (Optional) */}
                        <div className="flex items-center gap-4 py-2 px-4 border-b border-white/5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="w-5" /> {/* Checkbox spacer */}
                            <span className="w-16">ID</span>
                            <span className="flex-1">Title</span>
                            <span className="hidden sm:block w-[120px]">Project</span>
                            <span className="w-5"></span> {/* Priority spacer */}
                            <span className="w-20 text-right">Created</span>
                        </div>

                        {/* Render Rows */}
                        {tasks?.map((task: any) => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                onClick={() => setSelectedTask(task)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SlideOver Detail (Tái sử dụng lại component xịn xò cũ) */}
            {selectedTask && (
                <IssueDetail
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                />
            )}
        </div>
    );
};