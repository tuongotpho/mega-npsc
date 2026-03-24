import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../shared/components/Icons.tsx';

interface CalendarViewProps {
    reportDates: Set<string>; // Using a Set for efficient O(1) lookups
    selectedDate: string | null;
    onDateSelect: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reportDates, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 for Monday, 6 for Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null); // Padding for days before the 1st
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    // Helper to format date as DD/MM/YYYY string
    const formatDateString = (day: number) => {
        const d = String(day).padStart(2, '0');
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const y = currentDate.getFullYear();
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="w-full max-w-xs mx-auto">
            <div className="flex items-center justify-between mb-3">
                <button onClick={goToPreviousMonth} className="p-1.5 rounded-full hover:bg-gray-100">
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <h4 className="font-semibold text-gray-800 text-center">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </h4>
                <button onClick={goToNextMonth} className="p-1.5 rounded-full hover:bg-gray-100">
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {daysOfWeek.map(day => (
                    <div key={day} className="font-bold text-gray-500 py-1">{day}</div>
                ))}
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`pad-${index}`}></div>;
                    }
                    
                    const dateStr = formatDateString(day);
                    const hasReport = reportDates.has(dateStr);
                    const isSelected = selectedDate === dateStr;

                    let dayClasses = "w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200";

                    if (isSelected) {
                        dayClasses += " bg-primary text-white font-bold ring-2 ring-offset-1 ring-primary";
                    } else if (hasReport) {
                        dayClasses += " bg-red-100 text-red-700 font-semibold cursor-pointer hover:bg-red-200";
                    } else {
                        dayClasses += " text-gray-700";
                    }

                    return (
                        <div key={day} className="py-1 flex justify-center">
                            <button
                                onClick={() => hasReport && onDateSelect(dateStr)}
                                className={dayClasses}
                                disabled={!hasReport}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;