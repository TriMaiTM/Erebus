import { useSearchParams } from 'react-router-dom';

export const useTaskFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. Đọc giá trị từ URL
    const searchQuery = searchParams.get('search') || '';
    const priorityFilter = searchParams.get('priority') || 'ALL'; // Mặc định là ALL

    // 2. Hàm set Filter (khi user gõ hoặc chọn dropdown)
    const setFilters = (updates: { search?: string; priority?: string }) => {
        const newParams = new URLSearchParams(searchParams); // Copy params cũ

        // Update Search
        if (updates.search !== undefined) {
            if (updates.search.trim()) {
                newParams.set('search', updates.search);
            } else {
                newParams.delete('search'); // Xóa nếu rỗng cho đẹp URL
            }
        }

        // Update Priority
        if (updates.priority !== undefined) {
            if (updates.priority === 'ALL') {
                newParams.delete('priority');
            } else {
                newParams.set('priority', updates.priority);
            }
        }

        setSearchParams(newParams);
    };

    return {
        searchQuery,
        priorityFilter,
        setFilters
    };
};