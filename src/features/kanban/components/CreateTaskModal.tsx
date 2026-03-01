import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { projectService } from '../../projects/api/projectService';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    columnId: string | null; // Cột nào đang được chọn để thêm task
}

export const CreateTaskModal = ({ isOpen, onClose, columnId }: CreateTaskModalProps) => {
    const { projectId } = useParams();
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

    const queryClient = useQueryClient();

    // Reset form khi mở modal
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setPriority('MEDIUM');
        }
    }, [isOpen]);

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!projectId || !columnId) throw new Error('Missing ID');
            return await projectService.createTask(projectId, columnId, title, priority);
        },
        onSuccess: () => {
            // Invalidate để Board load lại data mới
            queryClient.invalidateQueries({ queryKey: ['board', projectId] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        mutate();
    };

    return (
        <Modal title="New Issue" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <div>
                    <input
                        autoFocus
                        type="text"
                        className="w-full bg-transparent text-xl font-medium text-white placeholder:text-gray-600 outline-none border-none p-0 focus:ring-0"
                        placeholder="Issue title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Priority Selection (Đơn giản hóa bằng Select box) */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Priority:</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="bg-[#1e2029] border border-white/10 text-sm text-white rounded px-2 py-1 outline-none focus:border-primary"
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" isLoading={isPending}>Create Issue</Button>
                </div>
            </form>
        </Modal>
    );
};