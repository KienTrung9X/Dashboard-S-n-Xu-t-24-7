

import React from 'react';
import { MachineInfo, DowntimeRecord, ProductionDaily, DefectAdjustmentLog, DataPoint } from '../types';
import SimplePieChart from './SimplePieChart';
import { useMemo, useState, useEffect } from 'react';

interface MachineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineInfo: MachineInfo | null;
  productionRecord: ProductionDaily | null;
  downtimeRecords: DowntimeRecord[];
  adjustmentHistory: DefectAdjustmentLog[];
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
  adjustmentHistory,
  theme,
}) => {
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowHistory(false);
    }
  }, [isOpen]);

  const downtimeChartData = useMemo((): DataPoint[] => {
    if (!downtimeRecords || downtimeRecords.length === 0) {
      return [];
    }

    // FIX: Explicitly typing `downtimeByReason` ensures that `Object.entries` correctly infers
    // the value as a number, resolving downstream type errors in `map` and `sort`.
    const downtimeByReason: Record<string, number> = downtimeRecords.reduce((acc, record) => {
      acc[record.DOWNTIME_REASON] = (acc[record.DOWNTIME_REASON] || 0) + record.DOWNTIME_MIN;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(downtimeByReason)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [downtimeRecords]);

  const sortedDowntime = useMemo(() => {
    return [...downtimeRecords].sort((a, b) => {
        const dateComparison = b.COMP_DAY.localeCompare(a.COMP_DAY);
        if (dateComparison !== 0) return dateComparison;
        return b.START_TIME.localeCompare(a.START_TIME);
    }).slice(0, 10);
  }, [downtimeRecords]);

  const calculateDuration = (start: string, end: string, compDay: string): number => {
    if (!start || !end || !start.includes(':') || !end.includes(':')) {
        return 0; // Return 0 if times are invalid
    }
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        return 0; // Return 0 if parsing fails
    }

    const startDate = new Date(`${compDay}T${start}:00`);
    let endDate = new Date(`${compDay}T${end}:00`);
    
    // Handle overnight downtime
    if (endDate.getTime() <= startDate.getTime()) {
        endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / 60000); // convert ms to minutes
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
             <h2 className="text-2xl font-bold">Machine Details</h2>
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
              <p className="text-gray-400">Loading machine data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <Card title="Machine Specifications">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <SpecItem label="Line ID" value={machineInfo.LINE_ID} />
                      <SpecItem label="Item Code" value={productionRecord.ITEM_CODE} />
                      <SpecItem label="Design Speed" value={`${machineInfo.DESIGN_SPEED} units/min`} />
                      <SpecItem label="Ideal Cycle Time" value={`${machineInfo.IDEAL_CYCLE_TIME} min/unit`} />
                  </div>
              </Card>

              <Card title={`Daily Performance (Shift: ${productionRecord.SHIFT})`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 border-r-0 md:border-r border-gray-200 dark:border-gray-700 pr-0 md:pr-6 flex justify-center">
                        <OeeMetric title="OEE" value={productionRecord.OEE} isPrimary />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                        <OeeMetric title="Availability" value={productionRecord.availability ?? 0} />
                        <OeeMetric title="Performance" value={productionRecord.performance ?? 0} />
                        <OeeMetric title="Quality" value={productionRecord.quality ?? 0} />
                    </div>
                </div>
              </Card>

              <Card title="Downtime Analysis">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div className="min-h-[300px]">
                        <SimplePieChart data={downtimeChartData} theme={theme} />
                    </div>
                    <div className="overflow-y-auto max-h-72 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-4">
                      <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Recent Downtime Events
                          {downtimeRecords.length > 10 && <span className="text-xs font-normal text-gray-400"> (showing 10 of {downtimeRecords.length})</span>}
                      </h4>
                      {sortedDowntime.length > 0 ? (
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                              <th className="p-2 text-left font-semibold">Date</th>
                              <th className="p-2 text-left font-semibold">Reason</th>
                              <th className="p-2 text-left font-semibold">Start Time</th>
                              <th className="p-2 text-left font-semibold">End Time</th>
                              <th className="p-2 text-right font-semibold">Total Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedDowntime.map(log => {
                              const duration = calculateDuration(log.START_TIME, log.END_TIME, log.COMP_DAY);
                              return (
                                <tr key={log.Downtime_ID}>
                                  <td className="p-2 whitespace-nowrap">{log.COMP_DAY}</td>
                                  <td className="p-2">{log.DOWNTIME_REASON}</td>
                                  <td className="p-2">{log.START_TIME}</td>
                                  <td className="p-2">{log.END_TIME}</td>
                                  <td className="p-2 text-right whitespace-nowrap">{duration} min</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No downtime events recorded.
                        </div>
                      )}
                    </div>
                  </div>
              </Card>

              <Card title="Defect Adjustment History">
                <div>
                    <button 
                      onClick={() => setShowHistory(!showHistory)} 
                      className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm font-medium mb-2"
                    >
                      {showHistory ? 'Hide History' : 'Show History'} ({adjustmentHistory.length} records)
                    </button>
                    {showHistory && (
                      <div className="overflow-x-auto mt-2 max-h-48 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <table className="min-w-full text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-700/50">
                                  <tr>
                                      <th className="p-2 text-left font-semibold">Timestamp</th>
                                      <th className="p-2 text-left font-semibold">Previous Value</th>
                                      <th className="p-2 text-left font-semibold">New Value</th>
                                      <th className="p-2 text-left font-semibold">User</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {adjustmentHistory.map(log => (
                                      <tr key={log.logId}>
                                          <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                          <td className="p-2">{log.previousValue}</td>
                                          <td className="p-2 text-cyan-500 dark:text-cyan-400 font-semibold">{log.newValue}</td>
                                          <td className="p-2">{log.user}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                    )}
                    {adjustmentHistory.length === 0 && !showHistory && <p className="text-gray-500 text-sm">No adjustments recorded for this machine.</p>}
                 </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MachineDetailsModal;