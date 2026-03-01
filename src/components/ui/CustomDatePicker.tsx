import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface CustomDatePickerProps {
    date: string | null;
    onChange: (date: string | null) => void;
}

export const CustomDatePicker = ({ date, onChange }: CustomDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside để đóng lịch
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    const handleSelectDate = (day: Date) => {
        // Chuyển về dạng ISO string để lưu DB
        // set giờ về 12h trưa để tránh bị lệch múi giờ khi convert
        const selected = new Date(day);
        selected.setHours(12, 0, 0, 0);
        onChange(selected.toISOString());
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Nút hiển thị */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-2 text-gray-300">
                    <CalendarIcon size={16} className="text-gray-500" />
                    <span>
                        {date
                            ? format(new Date(date), 'MMM d, yyyy')
                            : <span className="text-gray-500 italic">No date</span>
                        }
                    </span>
                </div>

                {/* Nút xóa ngày */}
                {date && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </div>
                )}
            </div>

            {/* Popup Lịch Custom */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl z-50 w-[280px] animate-in zoom-in-95 duration-200">

                    {/* Header: Tháng + Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Grid Thứ */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
                            <div key={index} className="text-xs font-medium text-gray-500 py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Grid Ngày */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            const isSelected = date && isSameDay(new Date(date), day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectDate(day)}
                                    className={`
                                        h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors
                                        ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}
                                        ${isSelected ? 'bg-primary text-white font-bold' : 'hover:bg-white/10'}
                                        ${isToday(day) && !isSelected ? 'border border-primary text-primary' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};