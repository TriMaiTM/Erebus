import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { throttle } from 'lodash';

export const useCursors = (boardId: string | undefined, user: any) => {
    const [cursors, setCursors] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const channelRef = useRef<any>(null);
    const userRef = useRef(user);

    // Luôn giữ user mới nhất để hàm gửi chuột không bị lỗi null
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        if (!boardId || !user) return;

        // 🔥 LOG DEBUG: Xem mình đang vào phòng nào
        console.log(`🔌 Connecting to Realtime Room: board-${boardId}`);

        const channel = supabase.channel(`board-${boardId}`, {
            config: {
                presence: {
                    key: user.id, // Dùng User ID làm key định danh
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                console.log('👥 Presence Sync:', newState); // Xem danh sách trả về có ai

                const onlineUsers: any[] = [];
                Object.keys(newState).forEach((key) => {
                    newState[key].forEach((session: any) => {
                        if (session) onlineUsers.push(session);
                    });
                });

                // Loại bỏ duplicate user (nếu 1 người mở nhiều tab)
                const uniqueUsers = onlineUsers.filter((u, index, self) =>
                    index === self.findIndex((t) => t.id === u.id)
                );

                setUsers(uniqueUsers);
            })
            .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
                // Cập nhật vị trí chuột
                setCursors((prev: any) => ({
                    ...prev,
                    [payload.userId]: payload
                }));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Realtime!');
                    // Báo danh
                    await channel.track({
                        id: user.id,
                        full_name: user.full_name || user.email?.split('@')[0],
                        avatar_url: user.avatar_url,
                        online_at: new Date().toISOString(),
                    });
                } else {
                    console.log('❌ Realtime Status:', status);
                }
            });

        return () => {
            console.log('🔌 Disconnecting...');
            supabase.removeChannel(channel);
        };
    }, [boardId, user?.id]); // 🔥 Quan trọng: Chỉ reconnect khi ID đổi (tránh user object đổi ref làm reconnect liên tục)

    const moveCursor = useRef(
        throttle(async (x: number, y: number) => {
            if (channelRef.current && userRef.current) {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'cursor-move',
                    payload: {
                        userId: userRef.current.id,
                        full_name: userRef.current.full_name,
                        avatar_url: userRef.current.avatar_url,
                        x,
                        y,
                    },
                });
            }
        }, 30)
    ).current;

    return { cursors, users, moveCursor };
};