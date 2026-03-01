import { supabase } from '../../../lib/supabase';

export const workspaceService = {
    // 1. Lấy danh sách workspace của user
    getWorkspaces: async () => {
        const { data, error } = await supabase
            .from('members')
            .select('workspace:workspaces(*)') // Join bảng workspaces
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
        // Map data để trả về mảng workspace gọn gàng
        return data.map((item: any) => item.workspace);
    },

    // 2. Tạo workspace mới
    createWorkspace: async (name: string, userId: string) => {
        // A. Insert Workspace
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({ name, owner_id: userId })
            .select()
            .single();

        if (wsError) throw wsError;

        // B. Insert Member (Owner)
        const { error: memberError } = await supabase
            .from('members')
            .insert({
                workspace_id: workspace.id,
                user_id: userId,
                role: 'OWNER'
            });

        if (memberError) {
            // Nếu lỗi add member thì nên xóa workspace vừa tạo (Manual Rollback)
            // Nhưng để đơn giản ở phase này ta tạm throw error
            throw memberError;
        }

        return workspace;
    }
};