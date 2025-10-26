import React from 'react';
import { EnrichedMaintenanceOrder, MaintenanceKpis, SparePart, NewMaintenanceOrderData } from '../types';
import KpiCard from './KpiCard';
import Top5Table from './Top5Table';
import { AlertTriangle, PlusCircle, ArrowRightCircle, HardHat } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface MaintenanceDashboardProps {
  data: {
    records: EnrichedMaintenanceOrder[];
    kpis: MaintenanceKpis;
    schedule: {
        overdue: EnrichedMaintenanceOrder[];
        dueSoon: EnrichedMaintenanceOrder[];
    },
    spareParts: SparePart[];
    lowStockParts: SparePart[];
  },
  onOpenModal: (defaults?: Partial<NewMaintenanceOrderData>) => void;
  onNavigateToInventory: () => void;
  onNavigateToSchedule: (filter: 'overdue' | 'dueSoon' | 'all') => void;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ data, onOpenModal, onNavigateToInventory, onNavigateToSchedule }) => {
    const { t } = useTranslation();
    const { kpis, schedule, lowStockParts } = data;

    const SummaryCard: React.FC<{title: string, count: number, description: string, color: string, onClick: () => void}> = ({title, count, description, color, onClick}) => (
        <div 
            className={`bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-700/50 border-l-4 ${color}`}
            onClick={onClick}
        >
            <h3 className="font-semibold text-gray-200">{title}</h3>
            <p className="text-4xl font-bold mt-2">{count}</p>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
    );

    return (
        <div className="space-y-6">
             {lowStockParts.length > 0 && (
                <section className="animate-pulse-bg dark:animate-pulse-bg rounded-lg p-4 border border-orange-400 dark:border-orange-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                                <AlertTriangle size={20} /> {t('lowStockAlerts')}
                            </h2>
                            <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-orange-700 dark:text-orange-300">
                                {lowStockParts.map(part => (
                                    <li key={part.id}>
                                        <strong>{part.part_code}:</strong> {part.qty_on_hand} {t('leftMin')} {part.reorder_point})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <button 
                            onClick={onNavigateToInventory}
                            className="bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-colors text-sm"
                        >
                            {t('goToInventory')}
                            <ArrowRightCircle size={16} />
                        </button>
                    </div>
                </section>
            )}

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold text-cyan-400 border-l-4 border-cyan-400 pl-3">{t('maintKpis')}</h2>
                    <button 
                        onClick={() => onOpenModal()}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                    >
                        <PlusCircle size={16} />
                        {t('createNewOrder')}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title={t('mtbf')} value={kpis.mtbf} unit=" hours" precision={1} description="Mean Time Between Failures"/>
                    <KpiCard title={t('mttr')} value={kpis.mttr} unit=" min" precision={1} description="Mean Time To Repair"/>
                    <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-2">{t('top5Mttr')}</h3>
                        <Top5Table headers={[t('machineId'), t('avgRepairTime')]} data={kpis.topMttrMachines.map(d => ({ col1: d.name, col2: d.value.toFixed(1) }))} />
                    </div>
                </div>
            </section>
            
            <section>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('pmSchedule')}</h2>
                    <button onClick={() => onNavigateToSchedule('all')} className="text-sm text-cyan-400 hover:underline flex items-center gap-2">
                        {t('viewFullSchedule')} <ArrowRightCircle size={16}/>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard 
                        title={t('overdue')} 
                        count={schedule.overdue.length} 
                        description="PM tasks need immediate attention" 
                        color="border-red-500"
                        onClick={() => onNavigateToSchedule('overdue')}
                    />
                    <SummaryCard 
                        title={t('dueSoon')} 
                        count={schedule.dueSoon.length} 
                        description="PM tasks due within 14 days" 
                        color="border-yellow-500"
                        onClick={() => onNavigateToSchedule('dueSoon')}
                    />
                    <div className="bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                        <h3 className="font-semibold text-gray-200">Open Work Orders</h3>
                        <p className="text-4xl font-bold mt-2">{data.records.filter(r => r.status === 'Open' || r.status === 'InProgress').length}</p>
                        <p className="text-xs text-gray-400 mt-1">Includes PM, CM, and Breakdown</p>
                    </div>
                </div>
            </section>
            
        </div>
    );
};

export default MaintenanceDashboard;