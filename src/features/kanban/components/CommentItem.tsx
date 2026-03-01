import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../projects/api/projectService';
import { SmilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabase';

const POPULAR_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

export const CommentItem = ({ comment }: { comment: any }) => {
    const queryClient = useQueryClient();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Lấy ID user hiện tại để biết mình đã like chưa
    useState(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
    });

    // Gom nhóm reaction: { "👍": [uid1, uid2], "❤️": [uid1] }
    const reactionsGrouped = comment.reactions?.reduce((acc: any, reaction: any) => {
        if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
        acc[reaction.emoji].push(reaction.user_id);
        return acc;
    }, {}) || {};

    const toggleMutation = useMutation({
        mutationFn: (emoji: string) => {
            if (!currentUserId) return Promise.resolve();
            return projectService.toggleReaction(comment.id, currentUserId, emoji);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            setShowEmojiPicker(false);
        }
    });

    // Hàm render nội dung có chứa @Mention màu xanh
    const renderContent = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/g);
        return parts.map((part, index) => {
            const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
            if (match) {
                return (
                    <span key={index} className="text-primary font-bold hover:underline cursor-pointer bg-primary/10 px-1 rounded">
                        @{match[1]}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="flex gap-3 group">
            <div className="flex-shrink-0 mt-0.5">
                <img
                    src={comment.user?.avatar_url || `https://ui-avatars.com/api/?name=${comment.user?.full_name}`}
                    className="w-8 h-8 rounded-full object-cover border border-[#0F1117] ring-2 ring-[#0F1117]"
                />
            </div>
            <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-200">{comment.user?.full_name}</span>
                    <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                </div>

                {/* Content */}
                <div className="text-sm text-gray-300 bg-white/5 px-3 py-2 rounded-md border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {renderContent(comment.content)}
                </div>

                {/* Reactions Area */}
                <div className="flex items-center gap-2 mt-2">
                    {/* Các nút reaction đã có */}
                    {Object.entries(reactionsGrouped).map(([emoji, userIds]: [string, any]) => {
                        const isMeReacted = userIds.includes(currentUserId);
                        return (
                            <button
                                key={emoji}
                                onClick={() => toggleMutation.mutate(emoji)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${isMeReacted
                                    ? 'bg-primary/20 border-primary/50 text-primary ring-1 ring-primary/30' // 🔥 Đã like: Sáng màu
                                    : 'bg-[#1e2029] border-white/10 text-gray-400 hover:bg-white/5' //
                                    }`}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{userIds.length}</span>
                            </button>
                        );
                    })}

                    {/* Nút thêm reaction */}
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-white rounded bg-[#1e2029] border border-white/5 hover:border-white/20"
                        >
                            <SmilePlus size={14} />
                        </button>

                        {/* Popup Picker */}
                        {showEmojiPicker && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                <div className="absolute top-full left-0 mt-1 bg-[#1e2029] border border-white/10 rounded-lg shadow-xl z-50 p-1.5 flex gap-1 animate-in zoom-in-95">
                                    {POPULAR_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => toggleMutation.mutate(emoji)}
                                            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-base transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};