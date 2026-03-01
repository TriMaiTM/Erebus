import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { workspaceService } from '../api/workspaceService';
import { Button } from '../../../components/ui/Button';
import { AuthLayout } from '../../auth/layouts/AuthLayout'; // Tận dụng lại layout cũ

export const CreateWorkspacePage = () => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !user) return;

        setIsLoading(true);
        try {
            const newWorkspace = await workspaceService.createWorkspace(name, user.id);
            // Tạo xong thì chuyển hướng vào bên trong workspace đó
            navigate(`/workspace/${newWorkspace.id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-semibold text-white">Create your workspace</h1>
                <p className="text-gray-400">Give your digital HQ a name.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Workspace Name
                    </label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Acme Corp, Engineering Team..."
                        className="w-full bg-surface border border-border rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={name.length < 3} // Validate đơn giản
                >
                    Create Workspace
                </Button>
            </form>
        </AuthLayout>
    );
};