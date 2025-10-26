import React, { useState, useMemo } from 'react';
import { EnrichedMaintenanceSchedule } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Wrench } from 'lucide-react';

interface MaintenanceScheduleProps {
  schedule: EnrichedMaintenanceSchedule[];
  onCreateWorkOrder: (scheduleItem: EnrichedMaintenanceSchedule) => void;
}

type SortKey = keyof EnrichedMaintenanceSchedule;
type SortDirection = 'ascending' | 'descending';

const MaintenanceScheduleView: React.FC<MaintenanceScheduleProps> = ({ schedule, onCreateWorkOrder }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Overdue' | 'Due soon' | 'On schedule'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'next_pm_date', direction: 'ascending' });

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    const filteredAndSortedSchedule = useMemo(() => {
        const filtered = schedule.filter(item =>
            (searchTerm === '' || item.MACHINE_ID.toLowerCase().includes(searchTerm.toLowerCase()) || item.MACHINE_NAME.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (statusFilter === 'all' || item.status === statusFilter)
        );

        return filtered.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            let comparison = 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [schedule, searchTerm, statusFilter, sortConfig]);

    const getStatusChip = (status: 'On schedule' | 'Due soon' | 'Overdue') => {
        const styles: Record<string, string> = {
            'Overdue': 'bg-red-900 text-red-300',
            'Due soon': 'bg-yellow-900 text-yellow-300',
            'On schedule': 'bg-green-900 text-green-300',
        };
        const translationKey = status.replace(/\s/g, '') as 'Overdue' | 'Duesoon' | 'Onschedule';
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{t(translationKey as any) || status}</span>;
    };

    const headers: { key: SortKey; label: string }[] = [
        { key: 'MACHINE_ID', label: t('machine') },
        { key: 'pm_type', label: t('pmType') },
        { key: 'last_pm_date', label: t('lastPmDate') },
        { key: 'next_pm_date', label: t('nextPmDate') },
        { key: 'cycle_days', label: t('cycle') },
        { key: 'status', label: t('status') },
    ];

    return (
        <section>
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('pmSchedule')}</h2>
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                 <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder={t('searchMachineLine')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                     <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="all">{t('all')} {t('status')}</option>
                        <option value="Overdue">{t('overdue')}</option>
                        <option value="Due soon">{t('dueSoon')}</option>
                        <option value="On schedule">{t('onSchedule')}</option>
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                {headers.map(header => (
                                     <th key={header.key} className="p-3 text-left">
                                        <button onClick={() => requestSort(header.key)} className="group flex items-center gap-2">
                                            {header.label}
                                            <span className="text-cyan-400">{getSortIcon(header.key)}</span>
                                        </button>
                                    </th>
                                ))}
                                <th className="p-3 text-left">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredAndSortedSchedule.map(item => (
                                <tr key={item.id} className="hover:bg-gray-700/50">
                                    <td className="p-3">
                                        <div className="font-semibold">{item.MACHINE_ID}</div>
                                        <div className="text-xs text-gray-400">{item.MACHINE_NAME}</div>
                                    </td>
                                    <td className="p-3 font-mono">{item.pm_type}</td>
                                    <td className="p-3">{item.last_pm_date}</td>
                                    <td className="p-3 font-semibold">{item.next_pm_date}</td>
                                    <td className="p-3">{item.cycle_days} {t('days')}</td>
                                    <td className="p-3">{getStatusChip(item.status)}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => onCreateWorkOrder(item)}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-1.5 px-3 rounded-md flex items-center gap-2"
                                        >
                                            <Wrench size={14} />
                                            {t('createWorkOrder')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredAndSortedSchedule.length === 0 && (
                        <div className="text-center p-8 text-gray-500">{t('noRecordsMatchFilter')}</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MaintenanceScheduleView;
