import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal'; // Tận dụng Modal cũ
import { Button } from '../../../components/ui/Button'; // Tận dụng Button cũ

interface CreateColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
    isLoading?: boolean;
}

export const CreateColumnModal = ({ isOpen, onClose, onSubmit, isLoading }: CreateColumnModalProps) => {
    const [title, setTitle] = useState('');

    // Reset form mỗi khi mở modal
    useEffect(() => {
        if (isOpen) setTitle('');
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSubmit(title);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Section">
            <form onSubmit={handleSubmit} className="pt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                        Section Name
                    </label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g. QA, Backlog, Ready for Review..."
                        className="w-full bg-[#1e2029] border border-white/10 rounded-md px-3 py-2 text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!title.trim() || isLoading}
                        isLoading={isLoading}
                    >
                        Create Section
                    </Button>
                </div>
            </form>
        </Modal>
    );
};