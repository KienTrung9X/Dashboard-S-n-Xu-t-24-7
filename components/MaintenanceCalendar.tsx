import React from 'react';
import { EnrichedMaintenanceOrder } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface MaintenanceCalendarProps {
  year: number;
  month: number; // 0-indexed (0 for January)
  overduePms: EnrichedMaintenanceOrder[];
  dueSoonPms: EnrichedMaintenanceOrder[];
  onDayClick: (date: Date) => void;
}

const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({ year, month, overduePms, dueSoonPms, onDayClick }) => {
    const { t, language } = useTranslation();
    const today = new Date('2025-10-30'); // Mock current date for consistent demo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const monthName = new Date(year, month).toLocaleString(locale, { month: 'long' });

    const pmsByDate: Record<string, { machine: string; status: 'overdue' | 'due' }[]> = {};

    overduePms.forEach(pm => {
        const dateKey = new Date(pm.created_at).toISOString().slice(0, 10);
        if (!pmsByDate[dateKey]) pmsByDate[dateKey] = [];
        pmsByDate[dateKey].push({ machine: pm.MACHINE_ID, status: 'overdue' });
    });
     dueSoonPms.forEach(pm => {
        const dateKey = new Date(pm.created_at).toISOString().slice(0, 10);
        if (!pmsByDate[dateKey]) pmsByDate[dateKey] = [];
        pmsByDate[dateKey].push({ machine: pm.MACHINE_ID, status: 'due' });
    });

    const calendarCells = [];
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="border-r border-b border-gray-700"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toISOString().slice(0, 10);
        const isToday = date.toDateString() === today.toDateString();
        const dailyPms = pmsByDate[dateKey] || [];

        calendarCells.push(
            <div
                key={day}
                className={`relative p-2 border-r border-b border-gray-700 min-h-[100px] group transition-colors duration-200 cursor-pointer hover:bg-gray-700/50 ${isToday ? 'bg-cyan-900/50' : ''}`}
                onClick={() => onDayClick(date)}
            >
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <time dateTime={dateKey} className={`font-semibold ${isToday ? 'text-cyan-300' : 'text-white'}`}>{day}</time>
                <div className="mt-1 space-y-1">
                    {dailyPms.map((pm, index) => (
                        <div key={index} className={`px-1.5 py-0.5 text-xs rounded-md pointer-events-none ${pm.status === 'overdue' ? 'bg-red-500/80 text-white' : 'bg-yellow-500/80 text-black'} `}>
                            {pm.machine}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    const weekDays = [...Array(7).keys()].map(i => new Date(2024, 0, i+1).toLocaleString(locale, { weekday: 'short' }));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{monthName} {year}</h3>
                 <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>{t('overdue')}</span>
                    {/* FIX: Changed 'due' to 'dueSoon' to match the existing translation key. */}
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>{t('dueSoon')}</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-900/50 border border-cyan-400"></div>{t('today')}</span>
                </div>
            </div>
            <div className="grid grid-cols-7 text-xs text-center font-semibold text-gray-400">
                {weekDays.map(day => <div key={day} className="py-2 border-b border-gray-700">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 border-l border-t border-gray-700">
                {calendarCells}
            </div>
        </div>
    );
};

export default MaintenanceCalendar;