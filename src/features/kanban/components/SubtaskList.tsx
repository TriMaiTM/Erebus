import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { Plus, Trash2, CheckSquare, Square, Sparkles, Loader2 } from 'lucide-react'; // Thêm icon
import { cn } from '../../../lib/utils';

interface SubtaskListProps {
    taskId: string;
    title: string;       // 🔥 Thêm: Cần title để AI hiểu
    description: string; // 🔥 Thêm: Cần description để AI hiểu
}

export const SubtaskList = ({ taskId, title, description }: SubtaskListProps) => {
    const queryClient = useQueryClient();
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isGenerating, setIsGenerating] = useState(false); // 🔥 State loading AI

    // Fetch Subtasks
    const { data: subtasks } = useQuery({
        queryKey: ['subtasks', taskId],
        queryFn: () => projectService.getSubtasks(taskId),
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: (title: string) => projectService.createSubtask(taskId, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
            setNewItemTitle('');
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            projectService.toggleSubtask(id, completed),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => projectService.deleteSubtask(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    });

    // 🔥 HÀM GỌI AI
    const handleAutoSubtasks = async () => {
        setIsGenerating(true);
        try {
            // 1. Gọi AI
            const suggestions = await projectService.generateSubtasksAI(title, description || title);

            // 2. Tạo subtasks song song
            if (suggestions.length > 0) {
                await Promise.all(suggestions.map((subTitle: string) =>
                    projectService.createSubtask(taskId, subTitle)
                ));
                // 3. Refresh lại list
                queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
            }
        } catch (error) {
            console.error("Lỗi AI Subtask:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Tính toán Progress
    const total = subtasks?.length || 0;
    const completed = subtasks?.filter((t: any) => t.is_completed).length || 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="space-y-3">
            {/* Header + Nút AI */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subtasks</h3>
                    {total > 0 && (
                        <span className="text-xs text-gray-500 font-mono bg-white/5 px-1.5 rounded">{completed}/{total}</span>
                    )}
                </div>

                {/* 🔥 NÚT AI Ở ĐÂY */}
                <button
                    onClick={handleAutoSubtasks}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>{isGenerating ? 'Thinking...' : 'AI Generate'}</span>
                </button>
            </div>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="h-1.5 w-full bg-[#1e2029] rounded-full overflow-hidden mb-4 border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* List Items */}
            <div className="space-y-1">
                {subtasks?.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-3 py-1.5 px-2 -mx-2 hover:bg-white/5 rounded-md transition-colors">
                        <button
                            onClick={() => toggleMutation.mutate({ id: item.id, completed: !item.is_completed })}
                            className={cn(
                                "flex-shrink-0 transition-colors",
                                item.is_completed ? "text-primary" : "text-gray-500 hover:text-gray-400"
                            )}
                        >
                            {item.is_completed ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>

                        <span className={cn(
                            "flex-1 text-sm transition-all select-none cursor-pointer",
                            item.is_completed ? "text-gray-600 line-through decoration-gray-700" : "text-gray-300"
                        )} onClick={() => toggleMutation.mutate({ id: item.id, completed: !item.is_completed })}>
                            {item.title}
                        </span>

                        <button
                            onClick={() => deleteMutation.mutate(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 p-1 transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add New Input */}
            <div className="flex items-center gap-3 px-2 py-1.5 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                <Plus size={16} className="text-gray-500" />
                <input
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 focus:ring-0 p-0"
                    placeholder="Add a subtask..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemTitle.trim()) {
                            addMutation.mutate(newItemTitle);
                        }
                    }}
                />
            </div>
        </div>
    );
};