import React from 'react';
import { MachineInfo, DowntimeRecord, ProductionDaily, EnrichedErrorReport, EnrichedMaintenanceOrder, DataPoint } from '../types';
import SimplePieChart from './SimplePieChart';
import { useMemo } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface MachineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineInfo: MachineInfo | null;
  productionRecord: ProductionDaily | null;
  downtimeRecords: DowntimeRecord[];
  errorHistory: EnrichedErrorReport[];
  maintenanceHistory: EnrichedMaintenanceOrder[];
  plannedMaintenance: EnrichedMaintenanceOrder[];
  theme?: 'light' | 'dark';
}

// Reusable card component for consistent styling
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <section className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md ${className}`}>
        <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400 mb-3 border-l-4 border-cyan-500 pl-3">{title}</h3>
        <div className="pt-2">
            {children}
        </div>
    </section>
);


const SpecItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-lg text-gray-800 dark:text-white">{value}</p>
    </div>
);

const OeeMetric = ({ title, value, isPrimary = false }: { title: string, value: number, isPrimary?: boolean }) => {
    const percentage = (value * 100).toFixed(1);
    let colorClass = 'text-green-500 dark:text-green-400';
    if (value < 0.9) colorClass = 'text-yellow-500 dark:text-yellow-400';
    if (value < 0.8) colorClass = 'text-red-500 dark:text-red-400';

    if (isPrimary) {
        return (
            <div className="text-center">
                <p className={`font-bold text-4xl md:text-5xl ${colorClass}`}>{percentage}%</p>
                <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">{title}</p>
            </div>
        );
    }
    
    return (
        <div className="text-center p-2">
            <p className={`font-bold ${colorClass} text-2xl md:text-3xl`}>{percentage}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
        </div>
    );
};


const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({
  isOpen,
  onClose,
  machineInfo,
  productionRecord,
  downtimeRecords,
  errorHistory,
  maintenanceHistory,
  plannedMaintenance,
  theme,
}) => {
  const { t } = useTranslation();

  const downtimeChartData = useMemo((): DataPoint[] => {
    if (!downtimeRecords || downtimeRecords.length === 0) {
      return [];
    }
    const downtimeByReason: Record<string, number> = downtimeRecords.reduce((acc, record) => {
      acc[record.DOWNTIME_REASON] = (acc[record.DOWNTIME_REASON] || 0) + record.DOWNTIME_MIN;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(downtimeByReason)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [downtimeRecords]);

  const getStatusChip = (status: string) => {
    const styles: Record<string, string> = {
      Reported: 'bg-yellow-900 text-yellow-300', 'In Progress': 'bg-blue-900 text-blue-300',
      Fixed: 'bg-green-900 text-green-300', 'Not Machine Issue': 'bg-purple-900 text-purple-300',
      Closed: 'bg-gray-700 text-gray-400',
      Open: 'bg-yellow-900 text-yellow-300', Done: 'bg-green-900 text-green-300', Canceled: 'bg-gray-700 text-gray-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || ''}`}>{t(status.replace(/\s/g, '') as any) || status}</span>;
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white animate-fade-in-up">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
          {machineInfo ? (
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${machineInfo.STATUS === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              <h2 className="text-2xl font-bold">{machineInfo.MACHINE_NAME} ({machineInfo.MACHINE_ID})</h2>
            </div>
          ) : (
             <h2 className="text-2xl font-bold">{t('machineDetails')}</h2>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {!machineInfo || !productionRecord ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">{t('loadingMachineData')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <Card title={t('machineSpecs')}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <SpecItem label={t('lineId')} value={machineInfo.LINE_ID} />
                      <SpecItem label={t('itemCode')} value={productionRecord.ITEM_CODE} />
                      <SpecItem label={t('designSpeed')} value={`${machineInfo.DESIGN_SPEED} ${t('unitsMin')}`} />
                      <SpecItem label={t('idealCycleTime')} value={`${machineInfo.IDEAL_CYCLE_TIME} ${t('minUnit')}`} />
                  </div>
              </Card>

              <Card title={`${t('dailyPerformance')} (${t('shift')}: ${productionRecord.SHIFT})`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 border-r-0 md:border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-6 flex justify-center">
                        <OeeMetric title={t('oee')} value={productionRecord.OEE} isPrimary />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                        <OeeMetric title={t('availability')} value={productionRecord.availability ?? 0} />
                        <OeeMetric title={t('performance')} value={productionRecord.performance ?? 0} />
                        <OeeMetric title={t('quality')} value={productionRecord.quality ?? 0} />
                    </div>
                </div>
              </Card>

              <Card title={t('downtimeAnalysis')}>
                <div className="min-h-[300px]">
                    <SimplePieChart data={downtimeChartData} theme={theme} />
                </div>
              </Card>

              <Card title={t('errorHistoryTitle')}>
                {errorHistory.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto text-sm">
                        {errorHistory.map(report => (
                            <li key={report.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{t('report')} #{report.reportNo}: <span className="font-normal text-gray-600 dark:text-gray-400">{report.defect_type}</span></p>
                                    <p className="text-xs text-gray-500">{new Date(report.report_time).toLocaleString()}</p>
                                </div>
                                {getStatusChip(report.status)}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-400 text-sm">{t('noErrorHistory')}</p>}
              </Card>

              <Card title={t('maintenanceHistoryTitle')}>
                 {maintenanceHistory.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto text-sm">
                        {maintenanceHistory.map(order => (
                            <li key={order.id} className="py-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{t('order')} #{order.id}: <span className="font-normal text-gray-600 dark:text-gray-400">{order.symptom}</span></p>
                                        <p className="text-xs text-gray-500">{t('completed')}: {order.completed_at ? new Date(order.completed_at).toLocaleDateString() : 'N/A'} {t('by')} {order.assigned_to_name}</p>
                                    </div>
                                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-400">{t(order.type.toLowerCase() as any)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-400 text-sm">{t('noMaintenanceHistory')}</p>}
              </Card>

              <Card title={t('plannedMaintenanceTitle')}>
                 {plannedMaintenance.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto text-sm">
                        {plannedMaintenance.map(order => (
                            <li key={order.id} className="py-2">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{t('task')}: <span className="font-normal text-gray-600 dark:text-gray-400">{order.symptom}</span></p>
                                <p className="text-xs text-gray-500">{t('scheduledFor')}: {new Date(order.created_at).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-400 text-sm">{t('noPlannedMaintenance')}</p>}
              </Card>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MachineDetailsModal;