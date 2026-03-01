import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Thêm useParams, useNavigate
import { supabase } from '../lib/supabase';
import { projectService } from '../features/projects/api/projectService';
import { Button } from '../components/ui/Button';
import { Loader2, Camera, User, Save, Trash2, AlertTriangle, X } from 'lucide-react'; // Thêm icon
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'; // Thêm useQuery, useMutation
import { ConfirmDialog } from '../components/ui/ConfirmDialog'; // Import ConfirmDialog

export const SettingsPage = () => {
    const { workspaceId } = useParams(); // Lấy workspaceId từ URL
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [email, setEmail] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Workspace State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // 1. Fetch Workspace Info (để check Owner)
    const { data: workspace } = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: () => workspaceId ? projectService.getWorkspaceDetails(workspaceId) : null,
        enabled: !!workspaceId
    });

    // 2. Load Profile & User ID
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id); // Lưu lại ID để so sánh quyền Owner
                setEmail(user.email || '');
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFullName(profile.full_name || '');
                    setAvatarUrl(profile.avatar_url || '');
                }
            }
            setLoading(false);
        };
        loadProfile();
    }, []);

    // ... (Giữ nguyên logic upload ảnh và save profile cũ của bạn) ...
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        try {
            setSaving(true);
            const file = e.target.files[0];
            const publicUrl = await projectService.uploadAvatar(file);
            setAvatarUrl(publicUrl);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await projectService.updateProfile({ full_name: fullName, avatar_url: avatarUrl });
            window.location.reload();
        } catch (error) {
            alert('Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    // 3. Logic Xóa Workspace
    const deleteMutation = useMutation({
        mutationFn: () => projectService.deleteWorkspace(workspaceId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            navigate('/'); // Xóa xong về trang chủ
        }
    });

    const handleDeleteClick = () => {
        if (!workspace || !currentUserId) return;

        // CHECK QUYỀN OWNER
        if (workspace.owner_id === currentUserId) {
            setIsDeleteDialogOpen(true);
        } else {
            setIsErrorModalOpen(true);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

    return (
        <div className="h-full flex flex-col bg-[#0F1117] text-gray-300 overflow-y-auto">
            <div className="flex-none px-8 py-8 border-b border-white/5">
                <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
                <p className="text-sm text-gray-500">Manage your profile and workspace preferences.</p>
            </div>

            <div className="p-8 max-w-2xl space-y-12">

                {/* === SECTION 1: USER PROFILE === */}
                <section>
                    <h2 className="text-lg font-semibold text-white mb-6">Profile Settings</h2>

                    {/* Avatar */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-400 mb-4">Profile Photo</label>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={avatarUrl || 'https://github.com/shadcn.png'}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
                                />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera className="text-white" size={24} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <div className="text-sm text-gray-500">
                                <p>Click image to upload.</p>
                                <p>Max size 2MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Inputs */}
                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-[#1e2029] border border-white/10 rounded-md pl-10 pr-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full bg-[#14151a] border border-white/5 rounded-md px-4 py-2 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <Button onClick={handleSave} isLoading={saving} className="flex items-center gap-2">
                            <Save size={16} /> Save Changes
                        </Button>
                    </div>
                </section>

                {/* === SECTION 2: WORKSPACE SETTINGS (Chỉ hiện khi đang ở trong Workspace) === */}
                {workspaceId && (
                    <section className="pt-8 border-t border-white/10">
                        <h2 className="text-lg font-semibold text-white mb-6">Workspace Settings</h2>

                        <div className="bg-[#1e2029] border border-white/5 rounded-xl p-6 mb-6">
                            <label className="text-sm text-gray-400">Current Workspace</label>
                            <input
                                type="text"
                                value={workspace?.name || 'Loading...'}
                                disabled
                                className="w-full mt-2 bg-[#0F1117] border border-white/10 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                            />
                        </div>

                        {/* DANGER ZONE */}
                        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
                            <h3 className="text-base font-semibold text-red-500 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} /> Danger Zone
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Deleting this workspace is permanent. All projects and tasks will be removed.
                            </p>
                            <button
                                onClick={handleDeleteClick}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete Workspace
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {/* === MODALS === */}

            {/* 1. Modal Xác nhận xóa (Cho Owner) */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
                title={`Delete ${workspace?.name}?`}
                description="Are you absolutely sure? This action cannot be undone."
                confirmText="Yes, delete it"
            />

            {/* 2. Modal Báo lỗi (Cho Member) */}
            {isErrorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-[#1e2029] border border-white/10 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 text-center">
                        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Access Denied</h3>
                        <p className="text-gray-400 mb-6 text-sm">
                            Only the <strong>Workspace Owner</strong> can delete this workspace. <br />
                        </p>
                        <button
                            onClick={() => setIsErrorModalOpen(false)}
                            className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};