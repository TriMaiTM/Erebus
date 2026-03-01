import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';

// Helper để map màu priority
const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'URGENT': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

// 1. Cập nhật Interface Task để thêm assignee
interface Task {
    id: string;
    title: string;
    priority: string;
    assignee?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface TaskCardProps {
    task: Task;
    onClick?: (task: Task) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-[#1e2029] p-3 rounded-md border border-white/10 h-[100px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => {
                onClick?.(task);
            }}
            className="group relative bg-[#1e2029] p-3 rounded-md border border-white/5 hover:border-white/10 shadow-sm transition-all cursor-grab active:cursor-grabbing hover:translate-y-[-2px]"
        >
            <h4 className="text-sm font-medium text-gray-200 mb-3 line-clamp-2">
                {task.title}
            </h4>

            {/* Footer: Priority & Assignee */}
            <div className="flex items-center justify-between mt-3">
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase",
                    getPriorityColor(task.priority)
                )}>
                    {task.priority || 'LOW'}
                </span>

                {/* Avatar User */}
                {task.assignee ? (
                    <img
                        src={task.assignee.avatar_url || 'https://github.com/shadcn.png'}
                        alt={task.assignee.full_name || 'User'}
                        className="w-5 h-5 rounded-full border border-[#1e2029] object-cover"
                        title={task.assignee.full_name || 'User'}
                    />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                        <span className="text-[10px] text-gray-500">?</span>
                    </div>
                )}
            </div>

            {/* Hover Action */}
            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                <MoreHorizontal size={14} />
            </button>
        </div>
    );
};