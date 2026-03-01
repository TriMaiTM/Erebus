import { supabase } from '../../../lib/supabase';

export const projectService = {
    // Lấy tất cả project trong workspace
    getProjects: async (workspaceId: string) => {
        console.log("🔥 ID GỬI ĐI:", workspaceId, "| ID TRONG DB CẦN TÌM: 6cf14b42-9c94-446a-85f3-7c7bb24a436f");
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: true }); // Project cũ lên đầu

        if (error) throw error;
        return data;
    },

    // Tạo project mới (Tự động tạo luôn 3 cột mặc định)
    createProject: async (workspaceId: string, name: string, key: string) => {
        // 1. Lấy thông tin user hiện tại
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        // 2. Tạo Project (Thêm owner_id vào)
        const { data: project, error } = await supabase
            .from('projects')
            .insert({
                workspace_id: workspaceId,
                name,
                key,
                owner_id: user.id // <--- 🔥 QUAN TRỌNG: Thêm dòng này
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Tạo Default Columns (Giữ nguyên logic cũ)
        const columns = [
            { project_id: project.id, title: 'To Do', position: 1 },
            { project_id: project.id, title: 'In Progress', position: 2 },
            { project_id: project.id, title: 'Done', position: 3 },
        ];

        const { error: colError } = await supabase.from('columns').insert(columns);
        if (colError) console.error('Error creating default columns:', colError);

        return project;
    },

    getBoardData: async (projectId: string) => {
        // Lấy Columns và join luôn với Tasks
        const { data, error } = await supabase
            .from('columns')
            .select(`
        *,
        tasks (
          id, title, priority, position, assignee_id, description, column_id, project_id, start_date, due_date, created_at, labels, assignee:profiles!assignee_id (id, full_name, avatar_url), project:projects (
                        id,
                        name,
                        workspace_id
                    )
        )
      `)
            .eq('project_id', projectId)
            .order('position', { ascending: true }) // Sắp xếp cột
            .order('position', { foreignTable: 'tasks', ascending: true });

        if (error) throw error;

        // Sắp xếp Tasks trong từng cột theo LexoRank (string sort)
        // Supabase nested sort hơi phức tạp nên sort ở JS cho nhanh và an toàn
        return data.map(col => ({
            ...col,
            tasks: col.tasks?.sort((a: any, b: any) =>
                (a.position || '').localeCompare(b.position || '')
            ) || []
        }));
    },

    createTask: async (
        projectId: string,
        columnId: string,
        title: string,
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
    ) => {
        // Lấy user hiện tại để gán assignee (tạm thời gán cho chính mình)
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                column_id: columnId,
                title,
                priority,
                assignee_id: user?.id, // Auto assign cho người tạo
                position: 'z', // Tạm thời để cuối cùng
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateTaskPosition: async (taskId: string, columnId: string, newPosition: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({
                column_id: columnId,
                position: newPosition
            })
            .eq('id', taskId);

        if (error) throw error;
    },

    deleteTask: async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    },

    getProfiles: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data;
    },

    getMyTasks: async (userId: string) => {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        project:projects ( id, name, icon ),
        assignee:profiles!assignee_id ( id, full_name, avatar_url )
      `)
            .eq('assignee_id', userId)
            .order('created_at', { ascending: false }); // Mới nhất lên đầu

        if (error) throw error;
        return data;
    },

    inviteByEmail: async (email: string) => {
        // Delay 1s cho giống thật
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: `Invite sent to ${email}` };
    },

    // Update Profile
    updateProfile: async (updates: { full_name?: string; avatar_url?: string }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;
    },

    // Upload Avatar
    uploadAvatar: async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Lấy Public URL
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    },

    getSubtasks: async (taskId: string) => {
        const { data, error } = await supabase
            .from('subtasks')
            .select('*')
            .eq('task_id', taskId)
            .order('position', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Tạo Subtask
    createSubtask: async (taskId: string, title: string) => {
        const { data, error } = await supabase
            .from('subtasks')
            .insert({ task_id: taskId, title })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Toggle Complete
    toggleSubtask: async (subtaskId: string, isCompleted: boolean) => {
        const { error } = await supabase
            .from('subtasks')
            .update({ is_completed: isCompleted })
            .eq('id', subtaskId);
        if (error) throw error;
    },

    // Xóa Subtask
    deleteSubtask: async (subtaskId: string) => {
        const { error } = await supabase
            .from('subtasks')
            .delete()
            .eq('id', subtaskId);
        if (error) throw error;
    },

    getActivities: async (taskId: string) => {
        const { data, error } = await supabase
            .from('activities')
            .select(`
        *,
        user:profiles!user_id ( full_name, avatar_url )
      `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    // 2. Ghi Activity Log
    logActivity: async (taskId: string, type: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('activities').insert({
            task_id: taskId,
            user_id: user.id,
            type,
            content
        });
        if (type === 'ASSIGNEE') {
            // Logic này hơi phức tạp xíu vì cần biết ID người mới được assign.
            // Cách đơn giản nhất: Frontend truyền thêm receiverId vào logActivity hoặc tách hàm assign riêng.
            // Để đơn giản, ta sẽ tạm bỏ qua noti Assign ở bước này hoặc xử lý ở Frontend.
        }
    },

    getComments: async (taskId: string) => {
        const { data, error } = await supabase
            .from('comments')
            // Join 2 bảng: profiles (người comment) và comment_reactions (các icon thả tim)
            .select(`
                *,
                user:profiles(*),
                reactions:comment_reactions(*)
            `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // 2. Tạo comment mới
    createComment: async (taskId: string, content: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        // A. Tạo Comment vào DB
        const { data: comment, error } = await supabase
            .from('comments')
            .insert({
                task_id: taskId,
                user_id: user.id,
                content
            })
            .select()
            .single();

        if (error) throw error;

        // B. Lấy thông tin Task (để lấy tiêu đề task và assignee cũ)
        const { data: task } = await supabase
            .from('tasks')
            .select('assignee_id, title')
            .eq('id', taskId)
            .single();

        if (!task) return comment;

        // --- C. LOGIC XỬ LÝ NOTIFICATION ---
        const notifiedUserIds = new Set<string>(); // Dùng Set để tránh spam 1 người nhiều lần

        // 1. Xử lý @Mention (Ưu tiên cao nhất)
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUserId = match[2]; // Lấy UUID trong dấu ngoặc tròn ()

            if (mentionedUserId && mentionedUserId !== user.id) {
                await projectService.createNotification(
                    mentionedUserId,
                    'MENTION', // Type là MENTION để phân biệt
                    `mentioned you in issue`, // Nội dung thông báo
                    taskId
                );
                notifiedUserIds.add(mentionedUserId); // Đánh dấu là đã báo
            }
        }

        // 2. Xử lý báo cho Assignee (Nếu họ chưa được báo ở bước Mention)
        // (Nếu Assignee khác người comment VÀ Assignee chưa bị tag ở trên)
        if (
            task.assignee_id &&
            task.assignee_id !== user.id &&
            !notifiedUserIds.has(task.assignee_id)
        ) {
            await projectService.createNotification(
                task.assignee_id,
                'COMMENT',
                `commented on issue ${task.title}`,
                taskId
            );
        }

        return comment;
    },

    createColumn: async (projectId: string, title: string) => {
        // Lấy số lượng cột hiện tại để tính position (để cột mới nằm cuối)
        const { count } = await supabase
            .from('columns')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        const { data, error } = await supabase
            .from('columns')
            .insert({
                project_id: projectId,
                title: title,
                position: (count || 0) + 1
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 2. Cập nhật cột (Đổi tên)
    updateColumn: async (columnId: string, title: string) => {
        const { error } = await supabase
            .from('columns')
            .update({ title })
            .eq('id', columnId);
        if (error) throw error;
    },

    // 3. Xóa cột
    deleteColumn: async (columnId: string) => {
        // Kiểm tra xem cột có task không (để an toàn)
        const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('column_id', columnId);

        if (count && count > 0) {
            throw new Error('Cannot delete column with tasks. Please move tasks first.');
        }

        const { error } = await supabase
            .from('columns')
            .delete()
            .eq('id', columnId);

        if (error) throw error;
    },

    reorderColumns: async (updates: { id: string; position: number }[]) => {
        // Upsert: Cập nhật nhiều dòng cùng lúc dựa trên ID
        const { error } = await supabase
            .from('columns')
            .upsert(updates, { onConflict: 'id' });

        if (error) throw error;
    },

    getNotifications: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('notifications')
            .select(`
        *,
        actor:profiles!actor_id (full_name, avatar_url),
        task:tasks (id, title, project:projects(id, key))
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 2. Đánh dấu đã đọc
    markNotificationAsRead: async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
        if (error) throw error;
    },

    // 3. Hàm nội bộ để bắn thông báo (dùng cho các hàm khác gọi)
    createNotification: async (receiverId: string, type: string, content: string, taskId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id === receiverId) return; // Không tự thông báo cho chính mình

        await supabase.from('notifications').insert({
            user_id: receiverId,
            actor_id: user.id,
            task_id: taskId,
            type,
            content
        });
    },

    getUnreadNotificationCount: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true }) // head: true nghĩa là chỉ lấy số lượng, không lấy data
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    inviteMember: async (workspaceId: string, email: string) => {
        // 1. Tìm user id dựa trên email trong bảng profiles
        const { data: user, error: findError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (findError || !user) throw new Error('User not found. Please ask them to sign up first.');

        // 2. Check xem đã là member chưa
        const { data: existing } = await supabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .single();

        if (existing) throw new Error('User is already a member of this workspace.');

        // 3. Insert vào workspace_members
        const { error: insertError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: user.id,
                role: 'MEMBER'
            });

        if (insertError) throw insertError;
    },

    getMyWorkspaces: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        // Query này join 2 bảng để lấy info workspace dựa trên bảng thành viên
        const { data, error } = await supabase
            .from('workspaces')
            .select(`
        id, name, owner_id,
        workspace_members!inner(user_id) 
      `)
            .eq('workspace_members.user_id', user.id);
        // !inner là kỹ thuật để filter theo bảng join

        if (error) throw error;
        return data;
    },

    updateTask: async (taskId: string, updates: any) => {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getWorkspaceMembers: async (workspaceId: string) => {
        const { data, error } = await supabase
            .from('workspace_members')
            .select(`
                id,           
                role,
                user:profiles!inner (
                    id,
                    full_name,
                    email,
                    avatar_url
                )
            `)
            .eq('workspace_id', workspaceId); // Lọc theo Workspace ID hiện tại

        if (error) throw error;

        // Flatten dữ liệu để Frontend dễ hiển thị
        return data.map((item: any) => ({
            id: item.user.id,              // User ID (để link tới profile)
            membership_id: item.id,        // ID trong bảng member (để xóa/kick)
            full_name: item.user.full_name,
            email: item.user.email,
            avatar_url: item.user.avatar_url,
            role: item.role,               // Role thực tế trong workspace (ADMIN/MEMBER)
            status: 'Active'               // Tạm thời hardcode, sau này làm status online/offline sau
        }));
    },

    joinWorkspace: async (workspaceId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Please login first');

        // 1. Check xem đã là thành viên chưa (để tránh lỗi trùng)
        const { data: existing } = await supabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return { message: 'Already a member' };
        }

        // 2. Nếu chưa thì Insert vào
        const { error } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: user.id,
                role: 'MEMBER' // Mặc định là Member thường
            });

        if (error) throw error;
        return { success: true };
    },

    createWorkspace: async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        // --- 🔥 LOGIC XỬ LÝ TRÙNG TÊN ---
        let finalName = name;

        // 1. Lấy tất cả workspace của user này mà tên có chứa từ khóa
        // Dùng ilike để không phân biệt hoa thường (Valorant == valorant)
        const { data: existingWorkspaces } = await supabase
            .from('workspaces')
            .select('name')
            .eq('owner_id', user.id)
            .ilike('name', `${name}%`); // Lấy các tên bắt đầu bằng "name..."

        // 2. Tính toán tên mới
        if (existingWorkspaces && existingWorkspaces.length > 0) {
            const names = existingWorkspaces.map(w => w.name);

            // Nếu tên gốc đã tồn tại, bắt đầu tìm số thích hợp
            if (names.includes(finalName)) {
                let count = 1;
                while (names.includes(`${name}-${count}`)) {
                    count++;
                }
                finalName = `${name}-${count}`;
            }
        }
        // ---------------------------------

        // A. Tạo Workspace với tên đã xử lý (finalName)
        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({ name: finalName, owner_id: user.id })
            .select()
            .single();

        if (wsError) throw wsError;

        // B. Tự thêm mình làm Admin
        await supabase.from('workspace_members').insert({
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'ADMIN'
        });

        // C. Tạo Project Demo mặc định
        const { data: project } = await supabase.from('projects').insert({
            workspace_id: workspace.id,
            name: 'First Project',
            key: 'PRJ',
            owner_id: user.id
        }).select().single();

        // D. Tạo cột mặc định
        if (project) {
            await supabase.from('columns').insert([
                { project_id: project.id, title: 'To Do', position: 1 },
                { project_id: project.id, title: 'In Progress', position: 2 },
                { project_id: project.id, title: 'Done', position: 3 },
            ]);
        }

        return { workspace, project };
    },

    // 2. Xóa Workspace (Chỉ gọi API, DB sẽ chặn nếu không phải owner)
    deleteWorkspace: async (workspaceId: string) => {
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', workspaceId);

        if (error) throw error;
    },

    // Helper: Lấy thông tin chi tiết Workspace hiện tại (để check owner_id)
    getWorkspaceDetails: async (workspaceId: string) => {
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .single();
        if (error) throw error;
        return data;
    },

    updateProject: async (projectId: string, updates: { name?: string; key?: string }) => {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteProject: async (projectId: string) => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    },

    // Helper: Lấy chi tiết Project (để check quyền owner)
    getProjectDetails: async (projectId: string) => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        if (error) throw error;
        return data;
    },

    getReactions: async (commentId: string) => {
        const { data } = await supabase
            .from('comment_reactions')
            .select('*')
            .eq('comment_id', commentId);
        return data || [];
    },

    // Bật/Tắt reaction
    toggleReaction: async (commentId: string, userId: string, emoji: string) => {
        // 1. Tìm xem user này đã thả reaction nào vào comment này chưa (bất kể emoji gì)
        const { data: existing, error } = await supabase
            .from('comment_reactions')
            .select('*') // Lấy hết để biết ID và Emoji cũ
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle(); // 🔥 QUAN TRỌNG: Dùng maybeSingle để không bị lỗi 406 nếu chưa có

        if (error && error.code !== 'PGRST116') throw error; // Bỏ qua lỗi không tìm thấy

        if (existing) {
            // Trường hợp A: Đã thả rồi
            if (existing.emoji === emoji) {
                // Nếu click lại đúng emoji đó -> XÓA (Unlike)
                await supabase.from('comment_reactions').delete().eq('id', existing.id);
            } else {
                // Nếu click emoji khác -> UPDATE (Đổi từ 👍 sang ❤️)
                await supabase.from('comment_reactions').update({ emoji }).eq('id', existing.id);
            }
        } else {
            // Trường hợp B: Chưa thả bao giờ -> THÊM MỚI
            await supabase.from('comment_reactions').insert({
                comment_id: commentId,
                user_id: userId,
                emoji
            });
        }
    },

    searchGlobal: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { projects: [], tasks: [] };

        // 1. Lấy Projects (của user tham gia)
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name, key, workspace_id')
            .order('created_at', { ascending: false });

        // 2. Lấy Tasks (Tasks user được assign hoặc task mới nhất trong hệ thống)
        // Ở đây mình lấy 20 task mới nhất để demo tìm kiếm
        const { data: tasks } = await supabase
            .from('tasks')
            .select(`
                id, 
                title, 
                position,
                project:projects (id, key)
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        return {
            projects: projects || [],
            tasks: tasks || []
        };
    },

    generateAIContent: async (text: string, mode: 'fix' | 'expand') => {
        const { data, error } = await supabase.functions.invoke('ai-description', {
            body: { text, mode }
        });

        if (error) throw error;
        return data.result;
    },

    generateSubtasksAI: async (taskTitle: string, taskDescription: string) => {
        // Gửi cả Title và Description để AI hiểu ngữ cảnh tốt hơn
        const context = `Task: ${taskTitle}\nDescription: ${taskDescription}`;

        const { data, error } = await supabase.functions.invoke('ai-description', {
            body: { text: context, mode: 'subtasks' }
        });

        if (error) throw error;

        try {
            // Parse chuỗi JSON trả về thành Mảng thật
            const subtasksArray = JSON.parse(data.result);
            if (Array.isArray(subtasksArray)) {
                return subtasksArray;
            }
            return [];
        } catch (e) {
            console.error("AI trả về không đúng định dạng JSON:", data.result);
            return [];
        }
    }
};