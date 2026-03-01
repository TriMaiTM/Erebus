import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Check, Tag, Plus, X, Search,
    AlertCircle, Signal, CheckCircle2,
    Circle, FolderKanban, ArrowRight, Calendar, Trash2
} from 'lucide-react';

import { Popover } from '../../../components/ui/Popover';
import { cn } from '../../../lib/utils';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';

// ==========================================
// 1. ASSIGNEE PICKER (Code của bạn)
// ==========================================
interface AssigneePickerProps {
    profiles: any[];
    assigneeId: string | null;
    onChange: (id: string | null) => void;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    try {
        const date = new Date(dateString);
        // Check nếu ngày không hợp lệ (Invalid Date)
        if (isNaN(date.getTime())) return 'Just now';

        // Format: 14:30 - 15/02/2026
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return 'Invalid Date';
    }
};

export const AssigneePicker = ({ profiles, assigneeId, onChange }: AssigneePickerProps) => {
    const selectedProfile = profiles?.find(p => p.id === assigneeId);

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10 w-full">
                    {selectedProfile ? (
                        <>
                            <img src={selectedProfile.avatar_url} className="w-5 h-5 rounded-full" alt="Avatar" />
                            <span className="text-sm text-gray-300 truncate">{selectedProfile.full_name}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 rounded-full border border-dashed border-gray-500 flex items-center justify-center flex-shrink-0">
                                <User size={12} className="text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 group-hover:text-gray-400">Assign to...</span>
                        </>
                    )}
                </div>
            }
            content={
                <div className="p-1 w-[220px]">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">Change Assignee</div>

                    {/* Option: No Assignee */}
                    <button
                        onClick={() => onChange(null)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <span>No assignee</span>
                        {!assigneeId && <Check size={14} className="ml-auto text-primary" />}
                    </button>

                    <div className="h-px bg-white/10 my-1" />

                    {/* List Users */}
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {profiles?.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => onChange(profile.id)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
                            >
                                <img src={profile.avatar_url} className="w-5 h-5 rounded-full" alt={profile.full_name} />
                                <span className="truncate">{profile.full_name}</span>
                                {assigneeId === profile.id && <Check size={14} className="ml-auto text-primary" />}
                            </button>
                        ))}
                    </div>
                </div>
            }
        />
    );
};

// ==========================================
// 2. LABEL PICKER (Code của bạn + Nâng cấp style)
// ==========================================
const DEFAULT_SUGGESTIONS = ['Bug', 'Feature', 'Improvement', 'Design', 'Documentation', 'Urgent', 'High Priority'];

const getLabelStyle = (label: string) => {
    const text = label.toLowerCase();
    if (text.includes('bug') || text.includes('error')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (text.includes('feature')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (text.includes('design') || text.includes('ui')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (text.includes('improve')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (text.includes('urgent') || text.includes('high')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (text.includes('doc')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
};

interface LabelPickerProps {
    selectedLabels: string[];
    onChange: (newLabels: string[]) => void;
}

export const LabelPicker = ({ selectedLabels = [], onChange }: LabelPickerProps) => {
    const [search, setSearch] = useState('');

    const allLabels = Array.from(new Set([...DEFAULT_SUGGESTIONS, ...selectedLabels]));
    const filteredLabels = allLabels.filter(l => l.toLowerCase().includes(search.toLowerCase()));
    const isExactMatch = filteredLabels.some(l => l.toLowerCase() === search.toLowerCase());
    const showCreateOption = search.trim().length > 0 && !isExactMatch;

    const toggleLabel = (label: string) => {
        if (selectedLabels.includes(label)) {
            onChange(selectedLabels.filter(l => l !== label));
        } else {
            onChange([...selectedLabels, label]);
        }
    };

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-gray-500 hover:text-gray-400 border border-transparent hover:border-white/10">
                        <Tag size={14} />
                        <span className="text-sm">Add Label</span>
                    </div>
                </div>
            }
            content={
                <div className="w-[220px] flex flex-col">
                    <div className="flex items-center px-2 py-2 border-b border-white/10">
                        <Search size={14} className="text-gray-500 mr-2" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find or create label..."
                            className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        <div className="text-[10px] font-semibold text-gray-500 px-2 py-1 uppercase">Labels</div>

                        {filteredLabels.map(label => {
                            const isSelected = selectedLabels.includes(label);
                            return (
                                <button
                                    key={label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLabel(label);
                                        setSearch('');
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-sm text-gray-300 group"
                                >
                                    <div className={cn("w-2 h-2 rounded-full", getLabelStyle(label).split(' ')[0].replace('/20', ''))} />
                                    <span className="flex-1 truncate">{label}</span>
                                    {isSelected && <Check size={14} className="text-primary" />}
                                </button>
                            );
                        })}

                        {showCreateOption && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLabel(search);
                                    setSearch('');
                                }}
                                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-sm text-gray-300"
                            >
                                <div className="w-4 h-4 flex items-center justify-center"><Plus size={12} /></div>
                                <span>Create <span className="text-white font-medium">"{search}"</span></span>
                            </button>
                        )}
                        {filteredLabels.length === 0 && !showCreateOption && (
                            <div className="px-2 py-4 text-center text-xs text-gray-500">No labels found.</div>
                        )}
                    </div>
                </div>
            }
        />
    );
};

// ==========================================
// 3. PRIORITY PICKER (Custom Style)
// ==========================================
const PRIORITY_OPTIONS = [
    { value: 'URGENT', label: 'Urgent', icon: AlertCircle, color: 'text-red-500' },
    { value: 'HIGH', label: 'High', icon: Signal, color: 'text-orange-500' },
    { value: 'MEDIUM', label: 'Medium', icon: Signal, color: 'text-yellow-500' },
    { value: 'LOW', label: 'Low', icon: Signal, color: 'text-gray-400' },
];

const PriorityPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const selected = PRIORITY_OPTIONS.find(o => o.value === value) || PRIORITY_OPTIONS[3];
    const Icon = selected.icon;

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group w-full">
                    <Icon size={14} className={selected.color} />
                    <span className="text-sm text-gray-300">{selected.label}</span>
                </div>
            }
            content={
                <div className="p-1 w-[160px]">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">Priority</div>
                    {PRIORITY_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onChange(option.value)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
                        >
                            <option.icon size={14} className={option.color} />
                            <span>{option.label}</span>
                            {value === option.value && <Check size={14} className="ml-auto text-primary" />}
                        </button>
                    ))}
                </div>
            }
        />
    );
};

// ==========================================
// 4. STATUS PICKER (Custom Style)
// ==========================================
const StatusPicker = ({ value, columns, onChange }: { value: string, columns: any[], onChange: (val: string) => void }) => {
    const selectedColumn = columns?.find(c => c.id === value);

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group w-full">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-500 group-hover:border-gray-400 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full group-hover:bg-gray-400" />
                    </div>
                    <span className="text-sm text-gray-300 truncate max-w-[140px]">
                        {selectedColumn ? selectedColumn.title : 'Select Status...'}
                    </span>
                </div>
            }
            content={
                <div className="p-1 w-[200px]">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">Move to</div>
                    {columns && columns.length > 0 ? (
                        columns.map((col) => (
                            <button
                                key={col.id}
                                onClick={() => onChange(col.id)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
                            >
                                {col.id === value ? <CheckCircle2 size={14} className="text-blue-500" /> : <Circle size={14} className="text-gray-600" />}
                                <span className="truncate">{col.title}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 italic">No columns found</div>
                    )}
                </div>
            }
        />
    );
};

// ==========================================
// 5. MAIN COMPONENT (TaskProperties)
// ==========================================
interface TaskPropertiesProps {
    task: any;
    columns: any[];
    profiles: any[];
    onUpdate: (field: string, value: any) => void;
    onDelete: () => void;
}

export const TaskProperties = ({ task, columns, profiles, onUpdate, onDelete }: TaskPropertiesProps) => {
    const navigate = useNavigate();

    // Fix lỗi Invalid Date
    const createdDate = formatDate(task?.created_at);

    return (
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-[#0F1117] border-l border-white/5 h-full">

            {/* Header: Created Date */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <span className="text-xs font-mono text-gray-500">
                    Created on {createdDate}
                </span>
                <span className="text-xs text-gray-600 font-mono">
                    #{task?.position || '0'}
                </span>
            </div>

            <div className="px-5 py-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">

                {/* --- STATUS --- */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h4>
                    <div className="-ml-3">
                        <StatusPicker
                            value={task.column_id}
                            columns={columns}
                            onChange={(val) => onUpdate('column_id', val)}
                        />
                    </div>
                </div>

                {/* --- PRIORITY --- */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</h4>
                    <div className="-ml-3">
                        <PriorityPicker
                            value={task.priority}
                            onChange={(val) => onUpdate('priority', val)}
                        />
                    </div>
                </div>

                {/* --- ASSIGNEE --- */}
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</h4>
                    <div className="-ml-3">
                        <AssigneePicker
                            profiles={profiles || []}
                            assigneeId={task.assignee_id}
                            onChange={(val) => onUpdate('assignee_id', val)}
                        />
                    </div>
                </div>

                {/* --- LABELS --- */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</h4>
                        <LabelPicker
                            selectedLabels={task.labels || []}
                            onChange={(val) => onUpdate('labels', val)}
                        />
                    </div>

                    {/* Hiển thị Labels đã chọn */}
                    <div className="flex flex-wrap gap-2">
                        {task.labels && task.labels.map((label: string) => (
                            <span key={label} className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] border", getLabelStyle(label))}>
                                {label}
                                <button
                                    onClick={() => onUpdate('labels', task.labels.filter((l: any) => l !== label))}
                                    className="ml-1 hover:text-white opacity-60 hover:opacity-100"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* --- DATES --- */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Start Date</h4>
                        <CustomDatePicker
                            date={task.start_date}
                            onChange={(newDate) => onUpdate('start_date', newDate)}
                        />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Due Date</h4>
                        <CustomDatePicker
                            date={task.due_date}
                            onChange={(newDate) => onUpdate('due_date', newDate)}
                        />
                    </div>
                </div>

                {/* --- PROJECT --- */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</h4>
                    <button
                        onClick={() => {
                            if (task.project) {
                                navigate(`/workspace/${task.project.workspace_id}/board?project=${task.project.id}`);
                            }
                        }}
                        className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 p-2 rounded border border-white/5 w-full hover:bg-white/10 hover:text-white transition-all text-left group"
                    >
                        <FolderKanban size={14} className="group-hover:text-primary transition-colors" />
                        <span className="truncate flex-1">{task.project?.name || 'Unknown Project'}</span>
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>

            {/* Footer Delete */}
            <div className="p-5 border-t border-white/5 bg-[#0F1117]">
                <button
                    className="flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full py-2.5 rounded-md border border-transparent hover:border-red-500/20 font-medium"
                    onClick={onDelete}
                >
                    <Trash2 size={14} /> Delete Issue
                </button>
            </div>
        </div>
    );
};