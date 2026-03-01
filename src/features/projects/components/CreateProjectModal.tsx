import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { projectService } from '../api/projectService';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export const CreateProjectModal = ({ isOpen, onClose, workspaceId }: CreateProjectModalProps) => {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');

    // 1. Setup QueryClient để tương tác với Cache
    const queryClient = useQueryClient();

    // 2. Setup Mutation
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!workspaceId) throw new Error('No workspace ID');
            return await projectService.createProject(workspaceId, name, key);
        },
        onSuccess: () => {
            // 3. Magic happens here: Báo cho React Query biết data 'projects' đã cũ rồi
            // React Query sẽ tự động fetch lại API getProjects ngầm
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });

            // Reset form & đóng modal
            setName('');
            setKey('');
            onClose();
        },
        onError: (error) => {
            alert('Failed to create project: ' + error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !key) return;
        mutate();
    };

    // Tự động generate Key khi nhập Name (UX xịn)
    // Ví dụ: Nhập "Mobile App" -> Key tự nhảy "MOB"
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (!key) { // Chỉ auto nếu user chưa tự nhập key
            const generatedKey = newName
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 3);
            setKey(generatedKey);
        }
    };

    return (
        <Modal title="Create New Project" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                    <input
                        autoFocus
                        type="text"
                        className="w-full bg-[#1e2029] border border-white/10 rounded-md px-3 py-2 text-white focus:border-primary outline-none"
                        placeholder="e.g. Website Redesign"
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Key (Prefix)</label>
                    <input
                        type="text"
                        className="w-full bg-[#1e2029] border border-white/10 rounded-md px-3 py-2 text-white uppercase focus:border-primary outline-none"
                        placeholder="e.g. WEB"
                        maxLength={5}
                        value={key}
                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for issue IDs (e.g. WEB-123)</p>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isPending}>Create Project</Button>
                </div>
            </form>
        </Modal>
    );
};