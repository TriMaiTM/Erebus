import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useBoardRealtime } from '../hooks/useBoardRealtime';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { CreateColumnModal } from '../components/CreateColumnModal';
import { MoreHorizontal, Pencil, Trash2, X } from 'lucide-react'; // Đã bỏ bớt icon thừa
import { EditProjectModal } from '../../projects/components/EditProjectModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { useCursors } from '../hooks/useCursors';
import { CursorOverlay } from '../components/CursorOverlay';
import { UserAvatars } from '../components/UserAvatars';
// 🔥 1. Import mới
import { ViewOptions } from '../components/ViewOptions';
import { ListView } from '../components/ListView';

import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    pointerWithin
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';

import { projectService } from '../../projects/api/projectService';
import { BoardColumn } from '../components/BoardColumn';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Loader2, Plus } from 'lucide-react';
import { IssueDetail } from '../components/IssueDetail';
import { supabase } from '../../../lib/supabase';

export const BoardView = () => {
    const { projectId } = useParams();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const taskIdFromUrl = searchParams.get('taskId');

    const navigate = useNavigate();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // State cho Menu & Modals
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // 🔥 2. State quản lý chế độ hiển thị (Board / List)
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

    // --- STATE ---
    const [columns, setColumns] = useState<any[]>([]);

    // State cho Drag & Drop Overlay
    const [activeTask, setActiveTask] = useState<any>(null);
    const [activeColumn, setActiveColumn] = useState<any>(null);

    // State cho Modals
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
    const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

    // State cho Issue Detail (Modal Task)
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [user, setUser] = useState<any>(null);


    // --- API ---
    const { data: serverData, isLoading } = useQuery({
        queryKey: ['board', projectId],
        queryFn: () => projectService.getBoardData(projectId!),
        enabled: !!projectId,
    });

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectId ? projectService.getProjectDetails(projectId) : null,
        enabled: !!projectId
    });

    // Hàm xử lý xóa
    const deleteMutation = useMutation({
        mutationFn: () => projectService.deleteProject(projectId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            navigate(`/workspace/${project?.workspace_id}`);
        }
    });

    const handleDeleteClick = () => {
        setIsMenuOpen(false); // Đóng menu
        if (project?.owner_id === currentUserId) {
            setIsDeleteOpen(true);
        } else {
            setIsErrorModalOpen(true);
        }
    };

    const { searchQuery, priorityFilter } = useTaskFilters();

    useBoardRealtime(projectId!);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    }, []);

    useEffect(() => {
        if (serverData) {
            setColumns(serverData);
        }
    }, [serverData]);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setCurrentUser({
                    id: user.id,
                    ...profile,
                    email: user.email
                });
            }
        };
        loadUser();
    }, []);

    useEffect(() => {
        if (taskIdFromUrl && columns.length > 0) {
            let foundTask = null;
            for (const col of columns) {
                const task = col.tasks?.find((t: any) => t.id === taskIdFromUrl);
                if (task) { foundTask = task; break; }
            }
            if (foundTask) setSelectedTask(foundTask);
        }
    }, [taskIdFromUrl, columns]);

    useEffect(() => {
        if (selectedTask && columns.length > 0) {
            let updatedTask = null;
            for (const col of columns) {
                const t = col.tasks?.find((x: any) => x.id === selectedTask.id);
                if (t) { updatedTask = t; break; }
            }
            if (updatedTask && JSON.stringify(updatedTask) !== JSON.stringify(selectedTask)) {
                setSelectedTask(updatedTask);
            }
        }
    }, [columns, selectedTask]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const { cursors, users, moveCursor } = useCursors(projectId, currentUser);

    const handleMouseMove = (e: React.MouseEvent) => {
        moveCursor(e.clientX, e.clientY);
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
        setSearchParams({});
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // --- MUTATIONS ---
    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, columnId }: { taskId: string, columnId: string }) => {
            const simplePosition = Date.now().toString();
            return projectService.updateTaskPosition(taskId, columnId, simplePosition);
        },
        onError: (err) => {
            console.error("Lỗi lưu task:", err);
            queryClient.invalidateQueries({ queryKey: ['board', projectId] });
        }
    });

    const reorderColumnsMutation = useMutation({
        mutationFn: (updates: any[]) => projectService.reorderColumns(updates),
    });

    const createColumnMutation = useMutation({
        mutationFn: (title: string) => projectService.createColumn(projectId!, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', projectId] });
            setIsCreateColumnModalOpen(false);
        }
    });

    // --- FILTER LOGIC ---
    const filteredColumns = columns.map((col) => ({
        ...col,
        tasks: col.tasks?.filter((task: any) => {
            if (!task) return false;
            const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = !priorityFilter || priorityFilter === 'ALL' || task.priority === priorityFilter;
            return matchesSearch && matchesPriority;
        }) || [],
    }));


    // --- DRAG HANDLERS ---
    const onDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const type = active.data.current?.type;

        if (type === 'Column') {
            setActiveColumn(active.data.current?.column);
            return;
        }

        if (type === 'Task') {
            setActiveTask(active.data.current?.task);
            return;
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
        if (active.data.current?.type !== 'Task') return;

        const activeId = active.id;
        const overId = over.id;

        const findColumn = (id: string) => {
            const col = columns.find(c => c.id === id);
            if (col) return col;
            return columns.find(c => c.tasks?.some((t: any) => t.id === id));
        };

        const activeColumn = findColumn(String(activeId));
        const overColumn = findColumn(String(overId));

        if (!activeColumn || !overColumn || activeColumn === overColumn) return;

        setColumns((prev) => {
            const activeTasks = activeColumn.tasks || [];
            const overTasks = overColumn.tasks || [];
            const activeIndex = activeTasks.findIndex((t: any) => t.id === activeId);
            const overIndex = overTasks.findIndex((t: any) => t.id === overId);

            let newIndex;
            if (overId === overColumn.id) {
                newIndex = overTasks.length + 1;
            } else {
                const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overTasks.length + 1;
            }

            return prev.map((c) => {
                if (c.id === activeColumn.id) {
                    return { ...c, tasks: activeTasks.filter((t: any) => t.id !== activeId) };
                }
                if (c.id === overColumn.id) {
                    const newTasks = [...overTasks];
                    if (activeTasks[activeIndex]) {
                        newTasks.splice(newIndex, 0, activeTasks[activeIndex]);
                    }
                    return { ...c, tasks: newTasks };
                }
                return c;
            });
        });
    };

    const calculateNewPosition = (tasks: any[], newIndex: number) => {
        if (tasks.length === 0) return 'm';
        if (newIndex === 0) {
            const firstPos = tasks[0].position || 'm';
            return String.fromCharCode(firstPos.charCodeAt(0) - 1) + 'z';
        }
        if (newIndex === tasks.length) {
            const lastPos = tasks[tasks.length - 1].position || 'm';
            return lastPos + 'z';
        }
        const prevPos = tasks[newIndex - 1].position || 'a';
        // Logic tính toán đơn giản
        return prevPos + 'n';
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveTask(null);
        setActiveColumn(null);

        if (!over) return;

        // CASE 1: KÉO CỘT
        if (active.data.current?.type === 'Column') {
            if (active.id !== over.id) {
                const oldIndex = columns.findIndex((c: any) => c.id === active.id);
                const newIndex = columns.findIndex((c: any) => c.id === over.id);
                const newColumns = arrayMove(columns, oldIndex, newIndex);
                setColumns(newColumns);
                const updates = newColumns.map((col: any, index: number) => ({
                    id: col.id,
                    project_id: col.project_id,
                    title: col.title,
                    position: index
                }));
                reorderColumnsMutation.mutate(updates);
            }
            return;
        }

        // CASE 2: KÉO TASK
        const activeId = active.id as string;
        const activeColumn = columns.find(c => c.tasks?.some((t: any) => t.id === activeId));
        if (!activeColumn) return;

        const taskIndex = activeColumn.tasks.findIndex((t: any) => t.id === activeId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _newPosition = calculateNewPosition(
            activeColumn.tasks.filter((t: any) => t.id !== activeId),
            taskIndex
        );

        updateTaskMutation.mutate({
            taskId: activeId,
            columnId: activeColumn.id,
        });
    };

    const handleOpenCreateTask = (columnId: string) => {
        setActiveColumnId(columnId);
        setIsTaskModalOpen(true);
    };

    if (isLoading && columns.length === 0) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0F1117]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="h-full flex flex-col overflow-hidden relative" onMouseMove={handleMouseMove}>
                <CursorOverlay cursors={cursors} currentUserId={user?.id} />

                {/* HEADER */}
                <div className="flex-none h-14 border-b border-white/5 bg-[#0F1117] flex items-center px-6 justify-between z-20">
                    <div className="flex items-center gap-4">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Projects</span>
                            <span>/</span>
                            <div className="flex items-center gap-2 group relative">
                                <span className="text-white font-medium">{project?.name || 'Loading...'}</span>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-[#1e2029] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                            <button
                                                onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }}
                                                className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 text-left"
                                            >
                                                <Pencil size={14} /> Rename & Key
                                            </button>
                                            <div className="h-px bg-white/5 my-1" />
                                            <button
                                                onClick={handleDeleteClick}
                                                className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-left"
                                            >
                                                <Trash2 size={14} /> Delete Project
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 🔥 3. Nút chuyển đổi View */}
                        <ViewOptions viewMode={viewMode} setViewMode={setViewMode} />
                        <UserAvatars users={users} />
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                {/* 🔥 4. Render điều kiện: Board hoặc List */}
                <div className="flex-1 overflow-hidden bg-[#0F1117]">
                    {viewMode === 'board' ? (
                        // === BOARD VIEW ===
                        // Lưu ý: class overflow-x-auto chỉ áp dụng cho Board View
                        <div className="flex h-full overflow-x-auto overflow-y-hidden gap-6 px-6 pb-4 pt-6 min-w-fit">
                            <SortableContext
                                items={filteredColumns.map(c => c.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {filteredColumns.map((col) => (
                                    <BoardColumn
                                        key={col.id}
                                        column={col}
                                        tasks={col.tasks}
                                        onAddTask={handleOpenCreateTask}
                                        onTaskClick={(task) => setSelectedTask(task)}
                                    />
                                ))}
                            </SortableContext>

                            <div className="w-[300px] flex-shrink-0">
                                <button
                                    onClick={() => setIsCreateColumnModalOpen(true)}
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-300 w-full py-3 px-4 rounded-lg hover:bg-white/5 border border-dashed border-white/10 transition-colors group"
                                >
                                    <span className="bg-white/10 p-1 rounded group-hover:bg-white/20 transition-colors">
                                        <Plus size={16} />
                                    </span>
                                    <span className="font-medium">Add Section</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // === LIST VIEW ===
                        <ListView
                            columns={filteredColumns}
                            onTaskClick={(task) => setSelectedTask(task)}
                        />
                    )}
                </div>

                {/* MODALS */}
                <CreateColumnModal
                    isOpen={isCreateColumnModalOpen}
                    onClose={() => setIsCreateColumnModalOpen(false)}
                    onSubmit={(title) => createColumnMutation.mutate(title)}
                    isLoading={createColumnMutation.isPending}
                />

                <CreateTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    columnId={activeColumnId}
                />

                {selectedTask && (
                    <IssueDetail
                        isOpen={!!selectedTask}
                        onClose={handleCloseModal}
                        task={selectedTask}
                    />
                )}

                {project && (
                    <EditProjectModal
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        project={project}
                    />
                )}

                <ConfirmDialog
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={() => deleteMutation.mutate()}
                    isLoading={deleteMutation.isPending}
                    title={`Delete ${project?.name}?`}
                    description="All tasks in this project will be deleted permanently."
                    confirmText="Yes, delete project"
                />

                {isErrorModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-sm bg-[#1e2029] border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
                            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <X size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
                            <p className="text-gray-400 mb-6 text-sm">
                                Only the <strong>Project Owner</strong> can delete this project.
                            </p>
                            <button
                                onClick={() => setIsErrorModalOpen(false)}
                                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {createPortal(
                    <DragOverlay>
                        {activeTask ? (
                            <TaskCard task={activeTask} />
                        ) : activeColumn ? (
                            <BoardColumn
                                column={activeColumn}
                                tasks={activeColumn.tasks || []}
                                isOverlay
                            />
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}
            </div>
        </DndContext>
    );
};