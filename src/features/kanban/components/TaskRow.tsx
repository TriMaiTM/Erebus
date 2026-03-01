import {
    CheckCircle2,
    AlertCircle,
    SignalHigh,
    Clock
} from 'lucide-react';

interface TaskRowProps {
    task: any;
    onClick: () => void;
}

export const TaskRow = ({ task, onClick }: TaskRowProps) => {

    // Helper render icon priority (Tái sử dụng logic)
    const renderPriorityIcon = (p: string) => {
        if (p === 'URGENT') return <AlertCircle size={16} className="text-red-500" />;
        if (p === 'HIGH') return <SignalHigh size={16} className="text-orange-500" />;
        if (p === 'MEDIUM') return <SignalHigh size={16} className="text-yellow-500" />;
        return <SignalHigh size={16} className="text-gray-600" />;
    };

    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-4 py-3 px-4 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
        >
            {/* 1. Status Checkbox (Giả) */}
            <div className="flex-shrink-0 text-gray-600 group-hover:text-gray-400">
                <CheckCircle2 size={18} />
            </div>

            {/* 2. Identifier */}
            <span className="flex-shrink-0 text-xs text-gray-500 font-mono w-16">
                TASK-{task.position}
            </span>

            {/* 3. Title (Main) */}
            <span className="flex-1 text-sm text-gray-300 font-medium truncate group-hover:text-white">
                {task.title}
            </span>

            {/* 4. Project Label (Badge) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-gray-400">
                <span>{task.project?.icon || '📦'}</span>
                <span className="truncate max-w-[100px]">{task.project?.name}</span>
            </div>

            {/* 5. Priority */}
            <div className="flex-shrink-0" title={`Priority: ${task.priority}`}>
                {renderPriorityIcon(task.priority)}
            </div>

            {/* 6. Date (Optional) */}
            <span className="flex-shrink-0 text-xs text-gray-600 w-20 text-right">
                {new Date(task.created_at).toLocaleDateString()}
            </span>
        </div>
    );
};