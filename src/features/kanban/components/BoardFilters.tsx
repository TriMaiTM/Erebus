import { Search, X } from 'lucide-react';
import { useTaskFilters } from '../hooks/useTaskFilters';

export const BoardFilters = () => {
    const { searchQuery, priorityFilter, setFilters } = useTaskFilters();

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    className="w-full bg-[#1e2029] border border-white/10 rounded-md py-2 pl-10 pr-8 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    value={searchQuery}
                    onChange={(e) => setFilters({ search: e.target.value })}
                />
                {/* Nút Clear Search (chỉ hiện khi có text) */}
                {searchQuery && (
                    <button
                        onClick={() => setFilters({ search: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Priority:</span>
                <select
                    className="bg-[#1e2029] border border-white/10 text-gray-200 text-sm rounded-md px-3 py-2 outline-none focus:border-primary cursor-pointer hover:bg-white/5 transition-colors
                [&>option]:bg-[#1e2029] [&>option]:text-gray-300"
                    value={priorityFilter}
                    onChange={(e) => setFilters({ priority: e.target.value })}
                >
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                </select>
            </div>
        </div>
    );
};