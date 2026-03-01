import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { dashboardService } from '../api/dashboardService';
import {
    CheckCircle2,
    Circle,
    TrendingUp,
    Zap,
} from 'lucide-react';

// Import Component mới
import { SprintChart } from '../components/SprintChart';
import { TaskCalendar } from '../components/TaskCalendar';

export const DashboardPage = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState('');

    // Lấy thông tin user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
                setUserName(data.user.user_metadata.full_name || 'Captain');
            }
        });
    }, []);

    // 1. Fetch Stats
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats', userId],
        queryFn: () => userId ? dashboardService.getStats(userId) : null,
        enabled: !!userId,
    });

    // 2. Fetch Recent Tasks
    const { data: recentTasks } = useQuery({
        queryKey: ['recent-tasks'],
        queryFn: dashboardService.getRecentTasks,
    });

    // 3. Fetch Calendar Data (Mới)
    const { data: calendarTasks } = useQuery({
        queryKey: ['calendar-tasks', userId],
        queryFn: () => userId ? dashboardService.getCalendarTasks(userId) : null,
        enabled: !!userId,
    });

    // Greeting theo giờ
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto text-gray-300">

            {/* Header & Greeting */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {getGreeting()}, {userName}.
                </h1>
                <p className="text-gray-500">Here's what's happening in your workspace today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Assigned */}
                <div className="bg-[#1e2029] border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Circle size={80} />
                    </div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Assigned to you
                    </h3>
                    <p className="text-4xl font-bold text-white">{stats?.totalAssigned || 0}</p>
                    <p className="mt-4 text-xs text-blue-400">Total active tasks</p>
                </div>

                {/* Card 2: In Progress */}
                <div className="bg-[#1e2029] border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={80} />
                    </div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        In Progress
                    </h3>
                    <p className="text-4xl font-bold text-yellow-500">{stats?.inProgress || 0}</p>
                    <p className="mt-4 text-xs text-yellow-500/80">Focus on these</p>
                </div>

                {/* Card 3: Completed */}
                <div className="bg-[#1e2029] border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 size={80} />
                    </div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Completed
                    </h3>
                    <p className="text-4xl font-bold text-green-500">{stats?.completed || 0}</p>
                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-green-500">Keep it up!</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid (Chart + Calendar + Recent) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Recent Activity & Sprint Chart */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Sprint Chart Section */}
                    <div className="bg-[#1e2029] border border-white/5 p-6 rounded-xl">
                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-primary" />
                            Sprint Progress
                        </h3>
                        {/* Component Biểu đồ */}
                        <SprintChart stats={stats} />
                    </div>

                    {/* Recent Activity List */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Recent Activity
                        </h3>
                        <div className="bg-[#14151a] border border-white/5 rounded-lg overflow-hidden">
                            {recentTasks?.map((task: any) => (
                                <div key={task.id} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg">
                                        {task.project?.icon || '📦'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate">{task.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {task.project?.name} • Updated by {task.assignee?.full_name || 'Someone'}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-600 font-mono whitespace-nowrap">
                                        {new Date(task.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                            {recentTasks?.length === 0 && (
                                <div className="p-6 text-center text-sm text-gray-500">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Calendar Widget */}
                <div className="bg-[#1e2029] border border-white/5 p-6 rounded-xl h-fit">
                    {/* Component Lịch */}
                    <TaskCalendar tasks={calendarTasks || []} />
                </div>

            </div>

        </div>
    );
};