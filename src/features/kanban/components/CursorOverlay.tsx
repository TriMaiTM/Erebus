import { MousePointer2 } from 'lucide-react';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#EC4899'];

const getUserColor = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash % COLORS.length)];
};

export const CursorOverlay = ({ cursors, currentUserId }: { cursors: any, currentUserId: string | null }) => {
    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {Object.entries(cursors).map(([userId, data]: [string, any]) => {
                // Không vẽ chuột của chính mình & chuột lỗi
                if (userId === currentUserId || !data || data.x == null || data.y == null) return null;

                const color = getUserColor(userId);

                return (
                    <div
                        key={userId}
                        className="absolute transition-transform duration-100 ease-linear flex items-start gap-1"
                        style={{
                            transform: `translate(${data.x}px, ${data.y}px)`,
                            left: 0,
                            top: 0
                        }}
                    >
                        <MousePointer2
                            size={16}
                            fill={color}
                            color={color}
                        />
                        <div
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-md"
                            style={{ backgroundColor: color }}
                        >
                            {data.full_name || 'Friend'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};