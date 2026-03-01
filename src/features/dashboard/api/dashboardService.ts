import { supabase } from '../../../lib/supabase';

export const dashboardService = {
    // 1. Lấy thống kê (Đã tối ưu: Chỉ gọi 1 lệnh DB thay vì 3 lệnh)
    getStats: async (userId: string) => {
        // Lấy tất cả task được assign cho user kèm thông tin cột (trạng thái)
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('id, columns!inner(title)')
            .eq('assignee_id', userId);

        if (error) throw error;

        // Tính toán thủ công ở phía Client (nhanh hơn gọi nhiều lệnh DB)
        const totalAssigned = tasks?.length || 0;
        const completed = tasks?.filter((t: any) => t.columns?.title === 'Done').length || 0;
        const inProgress = tasks?.filter((t: any) => t.columns?.title === 'In Progress').length || 0;

        // Những cái còn lại coi như là Todo / Backlog
        const todo = totalAssigned - completed - inProgress;

        return {
            totalAssigned,
            inProgress,
            completed,
            todo // Trả thêm trường này để vẽ biểu đồ tròn (PieChart)
        };
    },

    // 2. Lấy các task hoạt động gần đây
    getRecentTasks: async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                id, 
                title, 
                priority, 
                updated_at,
                project:projects(id, name, icon),
                assignee:profiles!assignee_id(full_name)
            `)
            .order('updated_at', { ascending: false })
            .limit(5);

        if (error) throw error;
        return data;
    },

    // 3. (MỚI) Lấy task có deadline trong tháng này để hiện lên lịch
    getCalendarTasks: async (userId: string) => {
        // Tính ngày đầu tháng và cuối tháng hiện tại
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                id,
                title,
                due_date,
                priority,
                project:projects(id, key, name)
            `)
            .eq('assignee_id', userId)
            // Lọc những task có due_date nằm trong khoảng tháng này
            .gte('due_date', startOfMonth.toISOString())
            .lt('due_date', endOfMonth.toISOString())
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    }
};