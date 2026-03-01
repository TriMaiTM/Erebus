import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface Props {
    members: any[];
    onSubmit: (content: string) => void;
    placeholder?: string;
    isSubmitting?: boolean;
}

export const MentionInput = ({ members, onSubmit, placeholder = "Leave a comment...", isSubmitting }: Props) => {
    const [content, setContent] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Lọc user theo từ khóa
    const filteredMembers = (members || []).filter(m =>
        m.full_name?.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const selectionStart = e.target.selectionStart;
        setContent(val);
        setCursorPosition(selectionStart);

        // Logic tìm dấu @
        const lastAt = val.lastIndexOf('@', selectionStart - 1);
        if (lastAt !== -1) {
            const textAfterAt = val.substring(lastAt + 1, selectionStart);
            if (!textAfterAt.includes(' ')) {
                setShowMentions(true);
                setMentionQuery(textAfterAt);
                return;
            }
        }
        setShowMentions(false);
    };

    const insertMention = (user: any) => {
        const lastAt = content.lastIndexOf('@', cursorPosition - 1);
        const before = content.substring(0, lastAt);
        const after = content.substring(cursorPosition);

        // Format lưu xuống DB: @[Name](ID)
        const mentionText = `@[${user.full_name}](${user.id}) `;

        const newContent = before + mentionText + after;
        setContent(newContent);
        setShowMentions(false);

        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredMembers.length > 0) insertMention(filteredMembers[0]);
            }
            if (e.key === 'Escape') setShowMentions(false);
        } else {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
            }
        }
    };

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(content);
        setContent('');
    };

    return (
        <div className="relative w-full">
            {/* Popup Mentions */}
            {showMentions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e2029] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 bg-white/5 uppercase">Suggested Members</div>
                    {filteredMembers.map(member => (
                        <button
                            key={member.id}
                            onClick={() => insertMention(member)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 text-left transition-colors border-b border-white/5 last:border-0"
                        >
                            <img src={member.avatar_url} className="w-5 h-5 rounded-full" />
                            <span className="text-sm text-gray-200">{member.full_name}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="relative">
                <textarea
                    ref={inputRef}
                    className="w-full bg-[#14151a] border border-white/10 rounded-md p-3 text-sm text-gray-200 focus:ring-1 focus:ring-primary outline-none resize-none min-h-[40px] h-[40px] focus:h-[80px] transition-all pr-10"
                    placeholder={placeholder}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    className="absolute bottom-2 right-2 p-1 text-primary hover:text-white disabled:opacity-30 transition-opacity"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};