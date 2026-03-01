import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useBoardRealtime = (projectId: string) => {
    const queryClient = useQueryClient();
    // Dùng ref để giữ instance của channel, tránh tạo lại liên tục khi render
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        if (!projectId) return;

        // 1. Define unique channel name
        // Thêm timestamp để đảm bảo channel name là duy nhất mỗi lần mount (tránh conflict dev mode)
        const channelName = `board-realtime-${projectId}-${Date.now()}`;

        console.log(`🔌 Subscribing to channel: ${channelName}`);

        // 2. Create Channel
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    console.log('🔥 Realtime change received:', payload);
                    queryClient.invalidateQueries({ queryKey: ['board', projectId] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    console.log('🔥 Realtime change received:', payload);
                    queryClient.invalidateQueries({ queryKey: ['board', projectId] });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`✅ Connected to ${channelName}`);
                }
                if (status === 'TIMED_OUT') {
                    console.error(`❌ Connection Timed Out. Retrying...`);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error(`❌ Channel Error. Check connection/firewall.`);
                }
            });

        channelRef.current = channel;

        // 3. Cleanup an toàn
        return () => {
            if (channelRef.current) {
                console.log(`🔌 Unsubscribing from ${channelName}`);
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [projectId, queryClient]);
};