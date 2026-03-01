import { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';

interface BoardColumnProps {
    column: any;
    tasks: any[];
    onAddTask?: (colId: string) => void;
    onTaskClick?: (task: any) => void;
    isOverlay?: boolean;
}

export const BoardColumn = ({ column, tasks, onAddTask, onTaskClick, isOverlay }: BoardColumnProps) => {
    const queryClient = useQueryClient();

    // --- LOCAL STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);
    const [showMenu, setShowMenu] = useState(false);

    // --- DND KIT ---
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: column.id,
        data: { type: 'Column', column },
        disabled: isEditing || isOverlay
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    // --- MUTATIONS ---
    const updateColumnMutation = useMutation({
        mutationFn: (newTitle: string) => projectService.updateColumn(column.id, newTitle),
        onSuccess: () => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['board'] });
        }
    });

    const deleteColumnMutation = useMutation({
        mutationFn: () => projectService.deleteColumn(column.id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
        onError: (err: any) => alert(err.message)
    });

    const handleTitleSubmit = () => {
        if (editTitle.trim() && editTitle !== column.title) {
            updateColumnMutation.mutate(editTitle);
        } else {
            setIsEditing(false);
            setEditTitle(column.title);
        }
    };

    // 🔥 RENDER KHI ĐANG KÉO (PLACEHOLDER)
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                // ✨ Fix 1: Thêm h-full để placeholder cao bằng cột thật
                className="w-[300px] h-full flex-shrink-0 flex flex-col opacity-40 border-2 border-dashed border-white/20 rounded-lg bg-white/5"
            >
                <div className="opacity-0 pointer-events-none flex flex-col gap-3 h-full p-2">
                    <div className="h-8 flex items-center justify-between">
                        <span className="font-bold">{column.title}</span>
                        <span>{tasks.length}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 🔥 RENDER CHÍNH
    return (
        <div
            ref={setNodeRef}
            style={style}
            // ✨ Fix 2: Thêm h-full để cột luôn cao chạm đáy container cha
            className="w-[300px] h-full flex-shrink-0 flex flex-col group/column rounded-lg"
        >

            {/* --- HEADER --- */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between mb-3 px-1 h-8 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded transition-colors flex-shrink-0"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            autoFocus
                            className="bg-[#0F1117] text-sm font-bold text-white border border-primary/50 rounded px-1 py-0.5 outline-none w-full"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider truncate">
                                {column.title}
                            </h3>
                            <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                                {tasks.length}
                            </span>
                        </>
                    )}
                </div>

                <div className="relative ml-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`p-1 text-gray-500 hover:text-white rounded transition-opacity ${showMenu ? 'opacity-100 text-white' : 'opacity-0 group-hover/column:opacity-100'}`}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-[#1e2029] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden py-1 flex flex-col">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 w-full text-left"
                                >
                                    <Pencil size={12} /> Rename
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this section?')) {
                                            deleteColumnMutation.mutate();
                                        }
                                        setShowMenu(false);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 w-full text-left"
                                >
                                    <Trash2 size={12} /> Delete Section
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- BODY --- */}
            {/* ✨ Fix 3: Thêm overflow-y-auto và min-h-0 để scroll nội bộ trong cột */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto bg-white/0 rounded-md pb-2 pr-1 custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                </SortableContext>

                {onAddTask && (
                    <button
                        onClick={() => onAddTask(column.id)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-300 hover:bg-white/5 rounded-md border border-transparent hover:border-dashed hover:border-white/10 transition-all text-sm group flex-shrink-0 mt-1"
                    >
                        <Plus size={14} />
                        <span>New Task</span>
                    </button>
                )}
            </div>
        </div>
    );
};