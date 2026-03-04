import { useState } from 'react';
import {
    Filter, ChevronRight, ArrowLeft, Check,
    CircleDashed, User, Signal, CalendarCheck, CalendarDays, ChevronDown
} from 'lucide-react';
import { Popover } from '../../../components/ui/Popover'; // Dùng Popover xịn của bạn
import { cn } from '../../../lib/utils';

// Khai báo kiểu dữ liệu cho Filter
export type FilterState = {
    status: string[];
    assignee: string[];
    priority: string[];
    // Với Date, tạm thời dùng string đánh dấu như: 'overdue', 'today', 'has_date'...
    dueDate: string[];
};

interface TaskFilterMenuProps {
    columns: any[];
    profiles: any[];
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const PRIORITY_OPTIONS = [
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
];

export const TaskFilterMenu = ({ columns, profiles, filters, setFilters }: TaskFilterMenuProps) => {
    // State quản lý xem đang ở menu nào ('main' hoặc các menu con)
    const [activeView, setActiveView] = useState<'main' | 'status' | 'assignee' | 'priority' | 'dueDate' | 'completedDate'>('main');

    // Hàm đếm tổng số filter đang active để hiện badge (ví dụ: Filter 2)
    const activeCount = filters.status.length + filters.assignee.length + filters.priority.length + filters.dueDate.length;

    // Hàm toggle một giá trị trong mảng filter
    const toggleFilter = (key: keyof FilterState, value: string) => {
        setFilters(prev => {
            const current = prev[key];
            if (current.includes(value)) {
                return { ...prev, [key]: current.filter(v => v !== value) };
            }
            return { ...prev, [key]: [...current, value] };
        });
    };

    // --- RENDER MENU CHÍNH ---
    const renderMainMenu = () => (
        <div className="p-1 w-[220px]">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">Filter by</div>

            <MenuButton icon={<CircleDashed size={14} />} label="Status" count={filters.status.length} onClick={() => setActiveView('status')} />
            <MenuButton icon={<User size={14} />} label="Assignee" count={filters.assignee.length} onClick={() => setActiveView('assignee')} />
            <MenuButton icon={<Signal size={14} />} label="Priority" count={filters.priority.length} onClick={() => setActiveView('priority')} />

            <div className="h-px bg-white/10 my-1 mx-2" />

            <MenuButton icon={<CalendarDays size={14} />} label="Due Date" count={filters.dueDate.length} onClick={() => setActiveView('dueDate')} />
            {/* Tạm thời block menu Completed Date để làm sau nếu cần logic date phức tạp */}
            <MenuButton icon={<CalendarCheck size={14} />} label="Completed Date" count={0} onClick={() => { }} disabled />

            {/* Nút Clear All nếu có filter */}
            {activeCount > 0 && (
                <>
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <button
                        onClick={() => setFilters({ status: [], assignee: [], priority: [], dueDate: [] })}
                        className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-400 hover:text-white"
                    >
                        Clear all filters
                    </button>
                </>
            )}
        </div>
    );

    // --- RENDER MENU STATUS ---
    const renderStatusMenu = () => (
        <div className="p-1 w-[220px]">
            <BackButton title="Status" onClick={() => setActiveView('main')} />
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                {columns.map(col => (
                    <OptionItem
                        key={col.id}
                        label={col.title}
                        isSelected={filters.status.includes(col.id)}
                        onClick={() => toggleFilter('status', col.id)}
                    />
                ))}
            </div>
        </div>
    );

    // --- RENDER MENU ASSIGNEE ---
    const renderAssigneeMenu = () => (
        <div className="p-1 w-[220px]">
            <BackButton title="Assignee" onClick={() => setActiveView('main')} />
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                <OptionItem label="Unassigned" isSelected={filters.assignee.includes('unassigned')} onClick={() => toggleFilter('assignee', 'unassigned')} />
                <div className="h-px bg-white/10 my-1 mx-2" />
                {profiles.map(p => (
                    <OptionItem
                        key={p.id}
                        label={p.full_name}
                        isSelected={filters.assignee.includes(p.id)}
                        onClick={() => toggleFilter('assignee', p.id)}
                    />
                ))}
            </div>
        </div>
    );

    // --- RENDER MENU PRIORITY ---
    const renderPriorityMenu = () => (
        <div className="p-1 w-[220px]">
            <BackButton title="Priority" onClick={() => setActiveView('main')} />
            {PRIORITY_OPTIONS.map(opt => (
                <OptionItem
                    key={opt.value}
                    label={opt.label}
                    isSelected={filters.priority.includes(opt.value)}
                    onClick={() => toggleFilter('priority', opt.value)}
                />
            ))}
        </div>
    );

    // --- RENDER MENU DUE DATE (Cơ bản) ---
    const renderDueDateMenu = () => (
        <div className="p-1 w-[220px]">
            <BackButton title="Due Date" onClick={() => setActiveView('main')} />
            <OptionItem label="Has due date" isSelected={filters.dueDate.includes('has_date')} onClick={() => toggleFilter('dueDate', 'has_date')} />
            <OptionItem label="Overdue" isSelected={filters.dueDate.includes('overdue')} onClick={() => toggleFilter('dueDate', 'overdue')} />
        </div>
    );

    // Dynamic Render
    const renderContent = () => {
        switch (activeView) {
            case 'status': return renderStatusMenu();
            case 'assignee': return renderAssigneeMenu();
            case 'priority': return renderPriorityMenu();
            case 'dueDate': return renderDueDateMenu();
            default: return renderMainMenu();
        }
    };

    return (
        <Popover
            align="left"
            trigger={
                <button
                    onClickCapture={() => setActiveView('main')}
                    className={cn(
                        // 🔥 Copy y hệt class của nút Display: px-3 py-1.5, text-xs, bo góc, border
                        "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",

                        // 🔥 Phân tách trạng thái Active (có filter) và Inactive (không có filter)
                        activeCount > 0
                            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20" // Khi đang bật filter
                            : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10" // Giống hệt Display
                    )}
                >
                    <Filter size={14} className={activeCount > 0 ? "text-primary" : "text-gray-400"} />
                    <span>Filter</span>

                    {/* Badge đếm số lượng filter (chỉ hiện khi có filter) */}
                    {activeCount > 0 && (
                        <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white bg-primary rounded-full ml-1">
                            {activeCount}
                        </span>
                    )}
                </button>
            }
            content={renderContent()}
        />
    );
};

// --- CÁC COMPONENT UI NHỎ ---

const MenuButton = ({ icon, label, count, onClick, disabled }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed group"
    >
        <div className="flex items-center gap-2">
            <span className="text-gray-500 group-hover:text-gray-400">{icon}</span>
            <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
            {count > 0 && <span className="text-xs text-primary font-medium">{count}</span>}
            <ChevronRight size={14} className="text-gray-600" />
        </div>
    </button>
);

const BackButton = ({ title, onClick }: { title: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded hover:bg-white/5 text-sm font-semibold text-gray-300">
        <ArrowLeft size={14} className="text-gray-500" />
        {title}
    </button>
);

const OptionItem = ({ label, isSelected, onClick }: { label: string, isSelected: boolean, onClick: () => void }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-white/5 text-sm text-gray-300"
    >
        <span className="truncate pr-4">{label}</span>
        {/* Fake Checkbox Linear Style */}
        <div className={cn("flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
            isSelected ? "bg-primary border-primary text-white" : "border-gray-600"
        )}>
            {isSelected && <Check size={12} strokeWidth={3} />}
        </div>
    </button>
);