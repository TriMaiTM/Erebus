import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

export const TaskCalendar = ({ tasks }: { tasks: any[] }) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className="w-full">
            {/* Header Tháng */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-white font-semibold">{format(today, 'MMMM yyyy')}</h3>
            </div>

            {/* Grid Lịch */}
            <div className="grid grid-cols-7 gap-1">
                {/* Thứ trong tuần */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div
                        key={index} // 👈 Dùng index làm key thay vì day
                        className="text-xs font-medium text-gray-500 py-1"
                    >
                        {day}
                    </div>
                ))}

                {/* Các ngày */}
                {days.map((day, dayIdx) => {
                    // Tìm task trong ngày này
                    const dayTasks = tasks?.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));
                    const hasTasks = dayTasks && dayTasks.length > 0;

                    return (
                        <div
                            key={day.toString()}
                            className={`
                                min-h-[40px] p-1 rounded-md flex flex-col items-center justify-start gap-1 border border-transparent
                                ${!isSameMonth(day, monthStart) ? 'text-gray-700' : 'text-gray-300'}
                                ${isToday(day) ? 'bg-primary/20 text-primary font-bold border-primary/30' : 'hover:bg-white/5'}
                            `}
                        >
                            <span className="text-xs">{format(day, 'd')}</span>

                            {/* Dấu chấm báo hiệu có task */}
                            {hasTasks && (
                                <div className="flex gap-0.5">
                                    {dayTasks.slice(0, 3).map((task: any, i: number) => (
                                        <div
                                            key={i}
                                            className={`w-1 h-1 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500' :
                                                task.priority === 'HIGH' ? 'bg-orange-400' : 'bg-blue-400'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* List task sắp tới */}
            <div className="mt-4 border-t border-white/5 pt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Upcoming Deadlines</p>
                <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                    {tasks?.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between text-xs text-gray-400 bg-white/5 p-2 rounded">
                            <span className="truncate max-w-[120px]">{task.title}</span>
                            <span className={task.priority === 'URGENT' ? 'text-red-400' : ''}>
                                {format(new Date(task.due_date), 'MMM d')}
                            </span>
                        </div>
                    ))}
                    {(!tasks || tasks.length === 0) && <p className="text-xs text-gray-600 italic">No upcoming deadlines.</p>}
                </div>
            </div>
        </div>
    );
};