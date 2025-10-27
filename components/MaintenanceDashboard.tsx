import React, { useState } from 'react';
import { EnrichedMaintenanceOrder, MaintenanceKpis, SparePart, NewMaintenanceOrderData, MachineMaintenanceStats, DowntimeCauseStats } from '../types';
import KpiCard from './KpiCard';
import { AlertTriangle, PlusCircle, ArrowRightCircle, HardHat, ShoppingCart, Wrench, Calendar, Clock, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import SimpleBarChart from '../services/SimpleBarChart';
import TrendChart from '../TrendChart';

interface MaintenanceDashboardProps {
  data: {
    kpis: MaintenanceKpis;
    schedule: {
        overdue: EnrichedMaintenanceOrder[];
        dueSoon: EnrichedMaintenanceOrder[];
    },
    lowStockParts: SparePart[];
    machineStats: MachineMaintenanceStats[];
    downtimeAnalysis: DowntimeCauseStats[];
    trend: { date: string, mtbf?: number, mttr?: number }[];
  },
  onOpenModal: (defaults?: Partial<NewMaintenanceOrderData>) => void;
  onNavigateToInventory: () => void;
  onNavigateToSchedule: (filter: 'overdue' | 'dueSoon' | 'all') => void;
  onCreatePo: (part: SparePart) => void;
  theme: 'light' | 'dark';
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{title}</h2>
        {children}
    </section>
);

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ data, onOpenModal, onNavigateToInventory, onNavigateToSchedule, onCreatePo, theme }) => {
    const { t } = useTranslation();
    const { kpis, schedule, lowStockParts, machineStats, downtimeAnalysis, trend } = data;

    const LowStockTable: React.FC = () => {
        const [expandedPartId, setExpandedPartId] = useState<number | null>(null);

        const handleToggleExpand = (partId: number) => {
            setExpandedPartId(currentId => (currentId === partId ? null : partId));
        };

        return (
            <section className="animate-pulse-bg dark:animate-pulse-bg rounded-lg p-4 border border-orange-400 dark:border-orange-800">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                        <AlertTriangle size={20} /> {t('lowStockAlerts')}
                    </h2>
                    <button 
                        onClick={onNavigateToInventory}
                        className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-colors text-sm"
                    >
                        {t('goToInventory')}
                        <ArrowRightCircle size={16} />
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-orange-900 dark:text-orange-200">
                            <tr>
                                <th className="p-2 w-10"></th>
                                <th className="p-2">{t('partCode')}</th>
                                <th className="p-2">{t('name')}</th>
                                <th className="p-2">{t('stock')}</th>
                                <th className="p-2">{t('minStock')}</th>
                                <th className="p-2">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-orange-800 dark:text-orange-300">
                            {lowStockParts.map(part => {
                                const isExpanded = expandedPartId === part.id;
                                return (
                                <React.Fragment key={part.id}>
                                    <tr onClick={() => handleToggleExpand(part.id)} className="cursor-pointer border-t border-orange-300/30 dark:border-orange-700/50 hover:bg-orange-900/20">
                                        <td className="p-2 text-center text-orange-400">
                                            <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </td>
                                        <td className="p-2 font-mono">{part.part_code}</td>
                                        <td className="p-2">{part.name}</td>
                                        <td className="p-2 font-bold">{part.available}</td>
                                        <td className="p-2">{part.reorder_point}</td>
                                        <td className="p-2">
                                            <button onClick={(e) => { e.stopPropagation(); onCreatePo(part); }} className="bg-orange-500/80 hover:bg-orange-600 text-white font-semibold py-1 px-2 rounded-md flex items-center gap-1 text-xs">
                                                <ShoppingCart size={12}/> {t('createPO')}
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-orange-900/10 dark:bg-orange-900/20">
                                            <td colSpan={6} className="p-0">
                                                <div className="p-4 flex flex-col sm:flex-row gap-4 animate-fade-in-up">
                                                    <img 
                                                        src={part.image_url || `https://via.placeholder.com/150/4f5b66/FFFFFF?Text=No+Image`} 
                                                        alt={part.name} 
                                                        className="w-full sm:w-32 h-32 rounded-md object-cover self-center sm:self-start flex-shrink-0 border-2 border-orange-400/30" 
                                                    />
                                                    <div className="space-y-3 text-sm flex-grow">
                                                        <div>
                                                            <h4 className="font-semibold text-orange-700 dark:text-orange-200">{t('wearTearStandard')}</h4>
                                                            <p className="text-orange-800 dark:text-orange-300 whitespace-pre-line">{part.wear_tear_standard || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-orange-700 dark:text-orange-200">{t('replacementStandard')}</h4>
                                                            <p className="text-orange-800 dark:text-orange-300 whitespace-pre-line">{part.replacement_standard || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    }

    const MachineStatsTable: React.FC = () => {
        const statusConfig = {
            Alert: {className: 'bg-red-500/20 border-red-500', text: 'text-red-400', label: t('alert')},
            Warning: {className: 'bg-yellow-500/20 border-yellow-500', text: 'text-yellow-400', label: t('warning')},
            Normal: {className: 'bg-green-500/20 border-green-500', text: 'text-green-400', label: t('normal')},
        };
        return (
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="text-left text-gray-400">
                             <tr>
                                {['machine', 'status', 'mtbf (h)', 'mttr (min)', 'totalBreakdowns', 'totalDowntime_short'].map(key => (
                                    <th key={key} className="p-2">{t(key as any)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {machineStats.map(stat => (
                                <tr key={stat.machineId} className="hover:bg-gray-700/50">
                                    <td className="p-2 font-bold">{stat.machineId}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[stat.status].className} ${statusConfig[stat.status].text}`}>
                                            {statusConfig[stat.status].label}
                                        </span>
                                    </td>
                                    <td className="p-2">{stat.mtbf.toFixed(1)}</td>
                                    <td className="p-2">{stat.mttr.toFixed(1)}</td>
                                    <td className="p-2">{stat.breakdownCount}</td>
                                    <td className="p-2">{stat.totalDowntime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const DowntimeAnalysisTable: React.FC = () => (
         <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                     <thead className="text-left text-gray-400">
                        <tr>
                            {['cause', 'count', 'totalTime', 'mainImpact'].map(key => (
                                <th key={key} className="p-2">{t(key as any)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {downtimeAnalysis.map(item => (
                            <tr key={item.reason} className="hover:bg-gray-700/50">
                                <td className="p-2 font-bold">{item.reason}</td>
                                <td className="p-2">{item.count}</td>
                                <td className="p-2">{item.totalMinutes.toFixed(0)}</td>
                                <td className="p-2">{item.mainMachineImpact}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const PmTaskList: React.FC<{title: string, tasks: EnrichedMaintenanceOrder[], color: string, onClick: () => void}> = ({ title, tasks, color, onClick }) => (
        <div onClick={onClick} className={`bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${color} cursor-pointer hover:bg-gray-700/50 transition-colors`}>
            <h3 className="font-semibold text-gray-200 mb-2">{title} ({tasks.length})</h3>
            {tasks.length > 0 ? (
                <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
                    {tasks.map(task => (
                        <li key={task.id} className="p-2 bg-gray-700/50 rounded-md">
                            <p className="font-bold">{task.MACHINE_ID}: <span className="font-normal">{task.symptom}</span></p>
                            <p className="text-xs text-gray-400">{t('scheduledFor')}: {new Date(task.created_at).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-gray-500">{t('noUpcomingTasks')}</p>}
        </div>
    );


    return (
        <div className="space-y-8">
             {lowStockParts.length > 0 && <LowStockTable />}

            <Section title={t('maintKpis')}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <KpiCard title={t('mtbf')} value={kpis.mtbf} unit=" hours" precision={1} description="Mean Time Between Failures"/>
                    <KpiCard title={t('mttr')} value={kpis.mttr} unit=" min" precision={1} description="Mean Time To Repair"/>
                    <KpiCard title={t('breakdownCount')} value={kpis.breakdownCount} unit="" precision={0} description="Total breakdowns in the period"/>
                </div>
            </Section>

            <Section title={t('mttrTrend')}>
                 <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                    <TrendChart
                        data={trend}
                        lines={[
                            { dataKey: 'mtbf', stroke: '#22d3ee', name: 'MTBF (h)' },
                            { dataKey: 'mttr', stroke: '#f97316', name: 'MTTR (min)' },
                        ]}
                        theme={theme}
                    />
                 </div>
            </Section>

            <Section title={t('maintenanceKpisByMachine')}>
                <MachineStatsTable />
            </Section>

            <Section title={t('downtimeCauseAnalysis')}>
                <DowntimeAnalysisTable />
            </Section>
            
            <Section title={t('pmTasks')}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PmTaskList title={t('overdue')} tasks={schedule.overdue} color="border-red-500" onClick={() => onNavigateToSchedule('overdue')} />
                    <PmTaskList title={t('dueSoon')} tasks={schedule.dueSoon} color="border-yellow-500" onClick={() => onNavigateToSchedule('dueSoon')} />
                 </div>
            </Section>
            
        </div>
    );
};

export default MaintenanceDashboard;