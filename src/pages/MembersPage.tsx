import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../features/projects/api/projectService';
import { InviteModal } from '../features/members/components/InviteModal';
import {
    Search,
    MoreHorizontal,
    Shield,
    User as UserIcon,
} from 'lucide-react';

export const MembersPage = () => {
    const { workspaceId } = useParams();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // 🔥 SỬA: Fetch Members của Workspace (thay vì getProfiles toàn bộ)
    const { data: members, isLoading } = useQuery({
        queryKey: ['workspace-members', workspaceId], // Key phụ thuộc vào workspaceId
        queryFn: () => workspaceId ? projectService.getWorkspaceMembers(workspaceId) : [],
        enabled: !!workspaceId, // Chỉ chạy khi có ID
    });

    // Filter logic
    const filteredMembers = members?.filter((m: any) =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-[#0F1117] text-gray-300">
            {/* Header */}
            <div className="flex-none px-8 py-8 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Team Members</h1>
                    <p className="text-sm text-gray-500">Manage who has access to this workspace.</p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Invite People
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex-none px-8 py-4 flex items-center gap-4">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full bg-[#1e2029] border border-white/10 rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-200 outline-none focus:border-white/20 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="flex-1 overflow-y-auto px-8 pb-8">
                <div className="border border-white/5 rounded-lg overflow-hidden bg-[#1e2029]/30">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-3 w-[40%]">Name</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredMembers?.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No members found.</td></tr>
                            ) : filteredMembers?.map((member: any) => (
                                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=random`}
                                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                                            />
                                            <div>
                                                <div className="font-medium text-white">{member.full_name || 'Unnamed'}</div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {/* Hiển thị Role thực tế */}
                                            {member.role === 'ADMIN' || member.role === 'OWNER' ? (
                                                <>
                                                    <Shield size={14} className="text-blue-400" />
                                                    <span className="text-gray-300 font-medium">{member.role}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UserIcon size={14} className="text-gray-500" />
                                                    <span className="text-gray-400">{member.role || 'MEMBER'}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                workspaceId={workspaceId!}
            />
        </div>
    );
};