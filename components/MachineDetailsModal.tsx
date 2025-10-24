import React, { useState, useEffect, useMemo } from 'react';
import { MachineInfo, DowntimeRecord, ProductionDaily, DefectAdjustmentLog, DataPoint } from '../types';
import SimplePieChart from './SimplePieChart';

interface MachineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineInfo: MachineInfo | null;
  productionRecord: ProductionDaily | null;
  downtimeRecords: DowntimeRecord[];
  adjustmentHistory: DefectAdjustmentLog[];
  theme?: 'light' | 'dark';
}

const OeeMetric = ({ title, value, isPrimary = false }: { title: string, value: number, isPrimary?: boolean }) => {
    const percentage = (value * 100).toFixed(1);
    let colorClass = 'text-green-400';
    if (value < 0.9) colorClass = 'text-yellow-400';
    if (value < 0.8) colorClass = 'text-red-400';

    if (isPrimary) {
        return (
            <div className="text-center">
                <p className="font-bold text-cyan-400 text-4xl md:text-5xl">{percentage}%</p>
                <p className="text-lg text-gray-400 mt-2">{title}</p>
            </div>
        );
    }
    
    return (
        <div className="text-center">
            <p className={`font-bold ${colorClass} text-2xl md:text-3xl`}>{percentage}%</p>
            <p className="text-sm text-gray-400 mt-1">{title}</p>
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

    // FIX: By explicitly typing the accumulator `acc`, we ensure `downtimeByReason` is correctly typed as Record<string, number>.
    // This resolves the issue where `value` was inferred as `unknown` in the subsequent `.map` and `.sort` operations.
    const downtimeByReason = downtimeRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.DOWNTIME_REASON] = (acc[record.DOWNTIME_REASON] || 0) + record.DOWNTIME_MIN;
      return acc;
    }, {});

    return Object.entries(downtimeByReason)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [downtimeRecords]);
  
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white animate-fade-in-up">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
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

        <main className="p-6 overflow-y-auto">
          {!machineInfo || !productionRecord ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Loading machine data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top section with machine specs */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Line ID</p><p className="font-semibold text-lg">{machineInfo.LINE_ID}</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Item Code</p><p className="font-semibold text-lg">{productionRecord.ITEM_CODE}</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Design Speed</p><p className="font-semibold text-lg">{machineInfo.DESIGN_SPEED} units/min</p></div>
                <div><p className="text-sm text-gray-500 dark:text-gray-400">Ideal Cycle Time</p><p className="font-semibold text-lg">{machineInfo.IDEAL_CYCLE_TIME} min/unit</p></div>
              </section>

              {/* OEE & KPIs */}
              <section>
                <h3 className="text-xl font-semibold mb-4">Daily Performance (Shift: {productionRecord.SHIFT})</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div className="md:col-span-1"><OeeMetric title="OEE" value={productionRecord.OEE} isPrimary /></div>
                  <div className="md:col-span-3 grid grid-cols-3 gap-4">
                      <OeeMetric title="Availability" value={productionRecord.availability ?? 0} />
                      <OeeMetric title="Performance" value={productionRecord.performance ?? 0} />
                      <OeeMetric title="Quality" value={productionRecord.quality ?? 0} />
                  </div>
                </div>
              </section>

              {/* Downtime Analysis */}
              <section>
                  <h3 className="text-xl font-semibold mb-4">Downtime Analysis</h3>
                  <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                      <SimplePieChart data={downtimeChartData} theme={theme} />
                  </div>
              </section>

              {/* Defect Adjustment History */}
              <section>
                  <h3 className="text-xl font-semibold mb-4">Defect Adjustment History</h3>
                  <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                      <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 mb-2"
                      >
                        {showHistory ? 'Hide History' : 'Show History'} ({adjustmentHistory.length} records)
                      </button>
                      {showHistory && (
                        <div className="overflow-x-auto mt-2 max-h-48">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-200 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left">Timestamp</th>
                                        <th className="p-2 text-left">Previous Value</th>
                                        <th className="p-2 text-left">New Value</th>
                                        <th className="p-2 text-left">User</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {adjustmentHistory.map(log => (
                                        <tr key={log.logId}>
                                            <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="p-2">{log.previousValue}</td>
                                            <td className="p-2 text-cyan-500 dark:text-cyan-400">{log.newValue}</td>
                                            <td className="p-2">{log.user}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                      )}
                      {adjustmentHistory.length === 0 && <p className="text-gray-500">No adjustments recorded for this machine.</p>}
                  </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MachineDetailsModal;