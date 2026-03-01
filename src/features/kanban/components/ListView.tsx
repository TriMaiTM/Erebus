import {
    AlertCircle,
    CheckCircle2,
    Circle,
    HelpCircle,
    MoreHorizontal,
    Signal,
    SignalHigh,
    SignalLow,
    SignalMedium
} from 'lucide-react';

// Helper icon priority (Có thể tách ra file utils dùng chung sau này)
const getPriorityIcon = (priority: string) => {
    switch (priority) {
        case 'URGENT': return <AlertCircle size={14} className="text-red-500" />;
        case 'HIGH': return <SignalHigh size={14} className="text-orange-500" />;
        case 'MEDIUM': return <SignalMedium size={14} className="text-yellow-500" />;
        case 'LOW': return <SignalLow size={14} className="text-blue-500" />;
        default: return <Signal size={14} className="text-gray-600" />;
    }
};

// Helper icon status
const getStatusIcon = (title: string) => {
    const t = title.toUpperCase();
    if (t.includes('TODO')) return <Circle size={16} className="text-gray-400" />;
    if (t.includes('PROGRESS')) return <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin-slow" />; // Spinner giả lập
    if (t.includes('DONE')) return <CheckCircle2 size={16} className="text-indigo-500" />;
    if (t.includes('CANCEL')) return <AlertCircle size={16} className="text-red-500" />;
    return <HelpCircle size={16} className="text-gray-400" />;
};

interface Props {
    columns: any[];
    onTaskClick: (task: any) => void;
}

export const ListView = ({ columns, onTaskClick }: Props) => {
    return (
        <div className="flex flex-col h-full overflow-y-auto px-8 py-4 pb-20">
            {columns.map((column) => (
                <div key={column.id} className="mb-8">
                    {/* Header Nhóm (Status) */}
                    <div className="flex items-center gap-3 mb-2 group">
                        <div className="p-1 rounded bg-white/5 text-gray-400 group-hover:text-white transition-colors">
                            {getStatusIcon(column.title)}
                        </div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {column.title}
                            <span className="text-gray-500 font-normal text-xs ml-1">{column.tasks?.length || 0}</span>
                        </h3>
                        <div className="h-px flex-1 bg-white/5 ml-2 group-hover:bg-white/10 transition-colors" />
                        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 transition-all">
                            <MoreHorizontal size={14} />
                        </button>
                    </div>

                    {/* Danh sách Task */}
                    <div className="space-y-[1px]"> {/* Khoảng cách siêu nhỏ giữa các row */}
                        {column.tasks?.length === 0 ? (
                            <div className="text-xs text-gray-600 italic py-2 pl-9">No tasks</div>
                        ) : (
                            column.tasks?.map((task: any) => (
                                <div
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="group flex items-center gap-4 py-2 px-3 hover:bg-[#1e2029] rounded-md cursor-pointer border border-transparent hover:border-white/5 transition-all"
                                >
                                    {/* 1. ID Task */}
                                    <span className="text-xs font-mono text-gray-500 w-16 flex-shrink-0">
                                        {task.key || `ID-${task.id.slice(0, 4)}`}
                                    </span>

                                    {/* 2. Status Checkbox (Giả lập) */}
                                    <div className="flex-shrink-0 text-gray-500 hover:text-white transition-colors">
                                        {getStatusIcon(column.title)}
                                    </div>

                                    {/* 3. Title */}
                                    <span className="text-sm text-gray-300 font-medium flex-1 truncate group-hover:text-white">
                                        {task.title}
                                    </span>

                                    {/* 4. Meta Info (Priority, Assignee, Date) */}
                                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Priority */}
                                        {task.priority && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                                {getPriorityIcon(task.priority)}
                                                <span className="text-[10px] uppercase font-semibold text-gray-400">{task.priority}</span>
                                            </div>
                                        )}

                                        {/* Assignee Avatar */}
                                        {task.assignee ? (
                                            <img
                                                src={task.assignee.avatar_url || `https://ui-avatars.com/api/?name=${task.assignee.full_name}`}
                                                className="w-5 h-5 rounded-full border border-white/10"
                                                title={task.assignee.full_name}
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border border-dashed border-gray-600 flex items-center justify-center">
                                                <span className="text-[8px] text-gray-500">?</span>
                                            </div>
                                        )}

                                        {/* Date (Giả lập) */}
                                        <span className="text-xs text-gray-600">Feb 13</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};