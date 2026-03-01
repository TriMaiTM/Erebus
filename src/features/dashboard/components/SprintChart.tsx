import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#eab308', '#22c55e']; // Blue (Todo), Yellow (In Progress), Green (Done)

export const SprintChart = ({ stats }: { stats: any }) => {
    if (!stats) return null;

    const data = [
        { name: 'To Do', value: stats.todo || 0 },
        { name: 'In Progress', value: stats.inProgress || 0 },
        { name: 'Done', value: stats.completed || 0 },
    ];

    // Nếu chưa có task nào
    if (data.every(d => d.value === 0)) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No tasks data available
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e2029', borderColor: '#374151', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};