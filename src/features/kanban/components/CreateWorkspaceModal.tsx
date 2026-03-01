import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateWorkspaceModal = ({ isOpen, onClose }: Props) => {
    const [name, setName] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const createMutation = useMutation({
        mutationFn: projectService.createWorkspace,
        onSuccess: (data) => {
            // 🔥 BƯỚC QUAN TRỌNG NHẤT: Cập nhật Cache thủ công ngay lập tức
            // Giúp App "biết" là Workspace này đã tồn tại mà không cần đợi fetch lại
            queryClient.setQueryData(['my-workspaces'], (oldData: any[] | undefined) => {
                if (!oldData) return [data.workspace];
                return [...oldData, data.workspace];
            });

            // Vẫn gọi invalidate để đồng bộ nền cho chắc chắn
            queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });

            onClose();
            setName('');

            // Chuyển hướng (Lúc này Cache đã có data nên không bị đá về nữa)
            if (data.project) {
                navigate(`/workspace/${data.workspace.id}/projects/${data.project.id}/board`);
            } else {
                navigate(`/workspace/${data.workspace.id}`);
            }
        },
        onError: (error) => {
            console.error("Failed to create workspace:", error);
            alert("Failed to create workspace. Please try again.");
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e2029] border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Create New Workspace</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Design Team, Marketing..."
                            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && name) createMutation.mutate(name);
                            }}
                        />
                    </div>

                    <button
                        onClick={() => name && createMutation.mutate(name)}
                        disabled={!name || createMutation.isPending}
                        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Create Workspace'}
                    </button>
                </div>
            </div>
        </div>
    );
};