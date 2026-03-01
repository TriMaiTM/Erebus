import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 1. Import React Query
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Check, Copy, Mail, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { projectService } from '../../projects/api/projectService'; // 2. Import Service

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string; // 3. Thêm prop workspaceId
}

export const InviteModal = ({ isOpen, onClose, workspaceId }: InviteModalProps) => {
    const [email, setEmail] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const queryClient = useQueryClient();

    // Link mời (Hiện tại vẫn là giả lập vì chưa làm hệ thống public link join)
    // Nhưng phần mời qua Email bên dưới sẽ là thật
    const inviteLink = `${window.location.origin}/join/${workspaceId}`;

    // --- MUTATION MỜI THÀNH VIÊN ---
    const inviteMutation = useMutation({
        mutationFn: (emailToInvite: string) => projectService.inviteMember(workspaceId, emailToInvite),
        onSuccess: () => {
            alert(`Invite sent successfully to ${email}`);
            setEmail('');
            queryClient.invalidateQueries({ queryKey: ['members', workspaceId] }); // Refresh list member nếu đang xem
            onClose();
        },
        onError: (error: any) => {
            // Hiển thị lỗi từ server (VD: User not found, Already member...)
            alert(error.message || "Failed to send invite");
        }
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSendInvite = () => {
        if (!email.trim()) return;
        inviteMutation.mutate(email.trim());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Invite people to Erebus">
            <div className="space-y-6 pt-4">

                {/* Phần nhập Email */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Email address</label>
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            type="email"
                            className="flex-1 bg-[#1e2029] border border-white/10 rounded-md px-3 py-2 text-white focus:ring-1 focus:ring-primary outline-none placeholder:text-gray-600"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                        />
                        <Button
                            onClick={handleSendInvite}
                            disabled={!email || inviteMutation.isPending}
                            isLoading={inviteMutation.isPending}
                        >
                            Send Invite
                        </Button>
                    </div>
                    {/* Hiển thị lỗi nếu có ngay dưới input */}
                    {inviteMutation.isError && (
                        <div className="flex items-center gap-2 text-red-400 text-xs mt-1">
                            <AlertCircle size={12} />
                            <span>{(inviteMutation.error as any)?.message}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#14151a] px-2 text-gray-500">Or copy link</span>
                    </div>
                </div>

                {/* Copy Link Section */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-md border border-white/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                            <LinkIcon size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-200 truncate">Anyone with the link</span>
                            <span className="text-xs text-gray-500 truncate">{inviteLink}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="ml-2 p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                        title="Copy to clipboard"
                    >
                        {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                    New members will be added to this workspace immediately.
                </div>
            </div>
        </Modal>
    );
};