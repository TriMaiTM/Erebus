import { User, Check, Tag, Plus, X, Search } from 'lucide-react';
import { Popover } from '../../../components/ui/Popover';
import { cn } from '../../../lib/utils';
import { useState } from 'react'; // Nhớ import thêm useState

// --- 1. ASSIGNEE PICKER ---
interface AssigneePickerProps {
    profiles: any[];
    assigneeId: string | null;
    onChange: (id: string | null) => void;
}

export const AssigneePicker = ({ profiles, assigneeId, onChange }: AssigneePickerProps) => {
    const selectedProfile = profiles?.find(p => p.id === assigneeId);

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                    {selectedProfile ? (
                        <>
                            <img src={selectedProfile.avatar_url} className="w-5 h-5 rounded-full" />
                            <span className="text-sm text-gray-300">{selectedProfile.full_name}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 rounded-full border border-dashed border-gray-500 flex items-center justify-center">
                                <User size={12} className="text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-500 group-hover:text-gray-400">Assign to...</span>
                        </>
                    )}
                </div>
            }
            content={
                <div className="p-1">
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
                    <div className="max-h-[200px] overflow-y-auto">
                        {profiles?.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => onChange(profile.id)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
                            >
                                <img src={profile.avatar_url} className="w-5 h-5 rounded-full" />
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


// --- 2. LABEL PICKER ---
const DEFAULT_SUGGESTIONS = ['Bug', 'Feature', 'Improvement', 'Design', 'Documentation', 'Urgent', 'High Priority'];
const getLabelStyle = (label: string) => {
    const text = label.toLowerCase();
    if (text.includes('bug') || text.includes('error')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (text.includes('feature')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (text.includes('design') || text.includes('ui')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (text.includes('improve')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (text.includes('urgent') || text.includes('high')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (text.includes('doc')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

    // Mặc định (Xám)
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
};

interface LabelPickerProps {
    selectedLabels: string[];
    onChange: (newLabels: string[]) => void;
}

export const LabelPicker = ({ selectedLabels = [], onChange }: LabelPickerProps) => {
    const [search, setSearch] = useState(''); // Thêm state tìm kiếm

    // Gộp label đã chọn + gợi ý mặc định để hiển thị trong list
    // Dùng Set để loại bỏ trùng lặp
    const allLabels = Array.from(new Set([...DEFAULT_SUGGESTIONS, ...selectedLabels]));

    // Lọc theo từ khóa tìm kiếm
    const filteredLabels = allLabels.filter(l =>
        l.toLowerCase().includes(search.toLowerCase())
    );

    // Kiểm tra xem từ khóa search đã tồn tại chính xác chưa
    const isExactMatch = filteredLabels.some(l => l.toLowerCase() === search.toLowerCase());

    // Logic hiển thị nút "Create..."
    const showCreateOption = search.trim().length > 0 && !isExactMatch;

    const toggleLabel = (label: string) => {
        if (selectedLabels.includes(label)) {
            onChange(selectedLabels.filter(l => l !== label));
        } else {
            onChange([...selectedLabels, label]);
        }
        // Giữ nguyên search text để user có thể tạo tiếp hoặc chọn tiếp nếu muốn
        // Hoặc setSearch('') nếu muốn clear sau khi chọn
    };

    return (
        <Popover
            trigger={
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedLabels.length > 0 ? (
                        selectedLabels.map(label => (
                            <span key={label} className={cn("text-xs px-2 py-0.5 rounded border flex items-center gap-1", getLabelStyle(label))}>
                                {label}
                            </span>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 transition-colors cursor-pointer text-gray-500 hover:text-gray-400 border border-transparent hover:border-white/10">
                            <Tag size={14} />
                            <span className="text-sm">Add Label</span>
                        </div>
                    )}

                    {/* Nút cộng nhỏ luôn hiện để thêm tiếp */}
                    {selectedLabels.length > 0 && (
                        <div className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 cursor-pointer">
                            <Plus size={12} />
                        </div>
                    )}
                </div>
            }
            content={
                <div className="w-[220px] flex flex-col">
                    {/* Header: Search Input */}
                    <div className="flex items-center px-2 py-2 border-b border-white/10">
                        <Search size={14} className="text-gray-500 mr-2" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find or create label..."
                            className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder:text-gray-600 w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            // Chặn sự kiện để không bị đóng Popover khi gõ space
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* List Labels */}
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
                                        setSearch(''); // Clear search sau khi chọn cho gọn
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-sm text-gray-300 group"
                                >
                                    {/* Color Dot */}
                                    <div className={cn("w-2 h-2 rounded-full", getLabelStyle(label).split(' ')[0].replace('/20', ''))} />

                                    <span className="flex-1 truncate">{label}</span>

                                    {isSelected && <Check size={14} className="text-primary" />}
                                </button>
                            );
                        })}

                        {/* Create Option */}
                        {showCreateOption && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLabel(search); // Tạo label mới từ text search
                                    setSearch('');
                                }}
                                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-sm text-gray-300"
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <Plus size={12} />
                                </div>
                                <span>Create <span className="text-white font-medium">"{search}"</span></span>
                            </button>
                        )}

                        {filteredLabels.length === 0 && !showCreateOption && (
                            <div className="px-2 py-4 text-center text-xs text-gray-500">
                                No labels found.
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    );
};