import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { SlideOver } from '../../../components/ui/SlideOver';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import { projectService } from '../../projects/api/projectService';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { AssigneePicker, LabelPicker } from './TaskProperties';
import { SubtaskList } from './SubtaskList';
import { ActivityFeed } from './ActivityFeed'; // <--- 1. Import Component Mới
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { Sparkles, Wand2, FileText, Loader2, FolderKanban } from 'lucide-react';
import { TaskProperties } from './TaskProperties';

import {
    Clock,
    AlertCircle,
    CheckCircle2,
    SignalHigh,
    HelpCircle,
    Trash2,
    X,
    Copy,
    Link,
    GitBranch
} from 'lucide-react';

interface IssueDetailProps {
    isOpen: boolean;
    onClose: () => void;
    task: any;
}

export const IssueDetail = ({ isOpen, onClose, task }: IssueDetailProps) => {
    const queryClient = useQueryClient();

    // --- LOCAL STATE ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    // ❌ Đã xóa commentText state
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [labels, setLabels] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
    const [showAIMenu, setShowAIMenu] = useState(false);

    const { data: boardData } = useQuery({
        queryKey: ['board-columns', task?.project_id],
        queryFn: () => projectService.getBoardData(task?.project_id),
        enabled: !!task?.project_id // Chỉ fetch khi có project_id
    });

    // --- QUERIES ---
    const { data: profiles } = useQuery({
        queryKey: ['profiles'],
        queryFn: projectService.getProfiles,
    });

    // ❌ Đã xóa query 'comments' ở đây (ActivityFeed tự lo việc này)

    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setAssigneeId(task.assignee_id);
            setLabels(task.labels || []);
            setIsDirty(false);
        }
    }, [task]);

    // --- MUTATIONS ---
    const updateTaskMutation = useMutation({
        mutationFn: async (updates: any) => {
            const { error } = await supabase.from('tasks').update(updates).eq('id', task.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // Refresh cả Dashboard
            queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] }); // Refresh cả Lịch
            setIsDirty(false);
        }
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value ? new Date(e.target.value).toISOString() : null;
        // 👇 SỬA Ở ĐÂY LUÔN
        updateTaskMutation.mutate({ due_date: dateValue });
    };

    const handleAIGenerate = async (mode: 'fix' | 'expand') => {
        if (!description && !title) return; // Dùng title nếu des trống

        setIsGenerating(true);
        setShowAIMenu(false);
        try {
            // Lấy text hiện tại (ưu tiên description, nếu không có thì lấy title để AI chém)
            const inputText = description || title;
            const newText = await projectService.generateAIContent(inputText, mode);
            const formattedText = newText
                .split("\n")
                .map(line => line.trim() === "" ? "<br/>" : `<p>${line}</p>`)
                .join("");

            // Cập nhật lại Description
            setDescription(formattedText);
            setIsDirty(true); // Đánh dấu là đã sửa để nút Save sáng lên (hoặc auto save)
        } catch (error) {
            console.error("AI Error:", error);
            alert("AI is busy, try again!");
        } finally {
            setIsGenerating(false);
        }
    };

    // Hàm xử lý khi bấm nút
    const handleAutoSubtasks = async () => {
        setIsGeneratingSubtasks(true);
        try {
            // 1. Gọi AI để lấy danh sách tên subtasks
            const suggestions = await projectService.generateSubtasksAI(title, description);

            // 2. Tạo song song các subtask vào Database
            if (suggestions.length > 0) {
                // Dùng Promise.all để tạo nhanh hơn
                await Promise.all(suggestions.map((subTitle: string) =>
                    projectService.createSubtask(issueId, subTitle)
                ));

                // 3. Refresh lại danh sách subtasks
                queryClient.invalidateQueries({ queryKey: ['subtasks', issueId] });
            }
        } catch (error) {
            console.error("Lỗi tạo subtask:", error);
            alert("AI đang bận, thử lại sau nhé!");
        } finally {
            setIsGeneratingSubtasks(false);
        }
    };

    // 🔥 2. NÂNG CẤP HÀM UPDATE ĐỂ GHI LOG
    const handleInstantUpdate = async (field: string, value: any) => {
        // Cập nhật UI ngay lập tức
        if (field === 'assignee_id') {
            setAssigneeId(value);
            projectService.createNotification(value, 'ASSIGN', 'assigned you to issue', task.id);
        }
        if (field === 'labels') setLabels(value);

        // Gọi API update task
        updateTaskMutation.mutate({ [field]: value });

        // Logic Ghi Log Activity
        let logType = '';
        let logContent = '';

        if (field === 'assignee_id') {
            logType = 'ASSIGNEE';
            logContent = value ? 'changed assignee' : 'removed assignee';
        } else if (field === 'labels') {
            logType = 'LABEL';
            logContent = 'updated labels';
        } else if (field === 'priority') {
            logType = 'PRIORITY';
            logContent = `changed priority to ${value}`;
        }
        // Lưu ý: Status (Column) thường xử lý ở DragDrop, nhưng nếu có dropdown status ở đây thì thêm case STATUS

        if (logType) {
            await projectService.logActivity(task.id, logType, logContent);
            // Refresh lại ActivityFeed để hiện log vừa ghi
            queryClient.invalidateQueries({ queryKey: ['activities', task.id] });
        }
    };

    const handleSaveDescription = () => {
        if (!isDirty) return;
        updateTaskMutation.mutate({ title, description });
    };

    // ❌ Đã xóa addCommentMutation (ActivityFeed tự lo)

    const deleteTaskMutation = useMutation({
        mutationFn: async () => { await projectService.deleteTask(task.id); },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['board'] });
        },
    });

    const renderPriorityIcon = (p: string) => {
        if (p === 'URGENT') return <AlertCircle size={16} className="text-red-500" />;
        if (p === 'HIGH') return <SignalHigh size={16} className="text-orange-500" />;
        return <SignalHigh size={16} className="text-gray-500" />;
    };

    return (
        <SlideOver isOpen={isOpen} onClose={onClose}>
            <div className="flex h-full -mx-6 -my-6">

                {/* === CỘT TRÁI (MAIN CONTENT) === */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto border-r border-white/5 bg-[#0F1117]">

                    {/* Header Controls */}
                    <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 sticky top-0 bg-[#0F1117] z-10">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <span>{task?.project_id ? 'PROJ' : 'TASK'}</span>
                            <span className="text-gray-700">/</span>
                            <span>#{task?.position || '0'}</span>
                        </div>
                        <p className="text-xs text-gray-600 italic">
                            * Changes are saved automatically when you click outside.
                        </p>
                    </div>

                    <div className="p-8 pb-32">
                        {/* Title */}
                        <input
                            type="text"
                            className="w-full bg-transparent text-3xl font-bold text-white placeholder:text-gray-700 outline-none border-none p-0 focus:ring-0 mb-8 leading-tight"
                            placeholder="Issue Title"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                            onBlur={handleSaveDescription}
                        />

                        {/* Description */}
                        {/* Description Section */}
                        <div className="mb-12 group relative">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Description</h3>

                                {/* 🔥 NÚT AI Ở ĐÂY */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAIMenu(!showAIMenu)}
                                        disabled={isGenerating}
                                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        <span>{isGenerating ? 'Generating...' : 'AI Assist'}</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showAIMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowAIMenu(false)} />
                                            <div className="absolute right-0 top-full mt-1 w-60 bg-[#1e2029] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in zoom-in-95">
                                                <button
                                                    onClick={() => handleAIGenerate('fix')}
                                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                >
                                                    <Wand2 size={12} className="text-blue-400" />Điều chỉnh ngữ pháp với AI-Erebus™
                                                </button>
                                                <button
                                                    onClick={() => handleAIGenerate('expand')}
                                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                >
                                                    <FileText size={12} className="text-green-400" />Mở rộng với AI-Erebus™
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-[100px] -ml-4 px-4 py-2 rounded-md transition-colors hover:bg-white/[0.02]">
                                <RichTextEditor
                                    value={description}
                                    onChange={(html) => { setDescription(html); setIsDirty(true); }}
                                    onBlur={handleSaveDescription}
                                    placeholder="Add description..."
                                />
                            </div>
                        </div>

                        {/* Subtasks */}
                        <div className="mb-10">
                            {/* 🔥 Truyền thêm title và description */}
                            <SubtaskList
                                taskId={task.id}
                                title={task.title}
                                description={description || task.description || ''} // Ưu tiên state description đang sửa
                            />
                        </div>

                        <div className="h-px bg-white/5 w-full mb-8" />

                        {/* 🔥 3. THAY THẾ TOÀN BỘ PHẦN COMMENT CŨ BẰNG ACTIVITY FEED */}
                        <div className="pb-20">
                            <ActivityFeed
                                taskId={task.id}
                                members={profiles || []}
                            />
                        </div>
                    </div>
                </div>

                {/* === CỘT PHẢI (SIDEBAR) === */}
                <div className="w-[300px] flex-shrink-0 flex flex-col bg-[#0F1117] border-l border-white/5 h-full">


                    <TaskProperties
                        task={task}
                        columns={boardData || []} // Truyền columns vào đây
                        profiles={profiles || []}
                        onUpdate={handleInstantUpdate}
                        onDelete={() => setIsDeleteDialogOpen(true)}
                    />
                </div>

                <ConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={() => deleteTaskMutation.mutate()}
                    isLoading={deleteTaskMutation.isPending}
                    title="Delete Issue?"
                    description="This action cannot be undone."
                    confirmText="Delete"
                />
            </div>
        </SlideOver>
    );
};