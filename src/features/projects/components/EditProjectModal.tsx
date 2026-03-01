import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { Loader2, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: any; // Project cần sửa
}

export const EditProjectModal = ({ isOpen, onClose, project }: Props) => {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const queryClient = useQueryClient();

    // Load dữ liệu cũ lên form
    useEffect(() => {
        if (project) {
            setName(project.name);
            setKey(project.key);
        }
    }, [project]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            return projectService.updateProject(project.id, { name, key });
        },
        onSuccess: () => {
            // Refresh lại list project ở Sidebar
            queryClient.invalidateQueries({ queryKey: ['projects', project.workspace_id] });
            // Refresh lại thông tin project hiện tại
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            onClose();
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1e2029] border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Project Settings</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Key (Prefix)</label>
                        <input
                            type="text"
                            value={key}
                            maxLength={5}
                            onChange={(e) => setKey(e.target.value.toUpperCase())}
                            className="w-full bg-[#0F1117] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors uppercase"
                        />
                        <p className="text-xs text-gray-600 mt-1">Used for task IDs (e.g. {key || 'PRJ'}-123)</p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending || !name}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};