import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Loader2, Rocket } from 'lucide-react';

export const OnboardingSetup = () => {
    const [projectName, setProjectName] = useState('');
    const queryClient = useQueryClient();

    const setupMutation = useMutation({
        mutationFn: async (name: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // 1. Tạo Workspace (Lấy tên theo tên User hoặc Project luôn)
            const workspaceName = `${user.user_metadata.full_name || 'My'}'s Workspace`;

            const { data: workspace, error: wsError } = await supabase
                .from('workspaces')
                .insert({ name: workspaceName, owner_id: user.id })
                .select()
                .single();

            if (wsError) throw wsError;

            // 2. Gán User vào Workspace đó (Làm Admin)
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({ workspace_id: workspace.id, user_id: user.id, role: 'ADMIN' });

            if (memberError) throw memberError;

            // 3. Tạo Project đầu tiên
            const { data: project, error: projError } = await supabase
                .from('projects')
                .insert({
                    workspace_id: workspace.id,
                    name: name, // Tên user nhập
                    key: name.substring(0, 3).toUpperCase(),
                    owner_id: user.id,
                })
                .select()
                .single();

            if (projError) throw projError;

            // 4. Tạo Cột mặc định cho Project đó
            await supabase.from('columns').insert([
                { project_id: project.id, title: 'To Do', position: 1 },
                { project_id: project.id, title: 'In Progress', position: 2 },
                { project_id: project.id, title: 'Done', position: 3 },
            ]);

            return { workspace, project };
        },
        onSuccess: (data) => {
            // QUAN TRỌNG: Làm sạch Cache để App biết là đã có Workspace
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });

            // Reload cứng trang để Router tính toán lại đường dẫn
            window.location.href = `/workspace/${data.workspace.id}/projects/${data.project.id}/board`;
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F1117] text-white p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
                        <Rocket size={40} />
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold mb-3">Welcome to Erebus! 🚀</h1>
                    <p className="text-gray-400">
                        Let's set up your first project to get started.
                    </p>
                </div>

                <div className="bg-[#1e2029] p-2 rounded-xl border border-white/5 shadow-2xl">
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name (e.g. Website Redesign)"
                        className="w-full bg-transparent px-4 py-4 outline-none text-white placeholder:text-gray-600 text-center font-medium"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && projectName && setupMutation.mutate(projectName)}
                    />
                </div>

                <button
                    onClick={() => setupMutation.mutate(projectName)}
                    disabled={!projectName.trim() || setupMutation.isPending}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {setupMutation.isPending ? (
                        <>
                            <Loader2 className="animate-spin" /> Setting up...
                        </>
                    ) : (
                        'Create Project & Start'
                    )}
                </button>
            </div>
        </div>
    );
};