import React, { useMemo } from 'react';
import { OeeTarget, DashboardData } from '../types';
import SimpleBarChart from '../services/SimpleBarChart';
import KpiProgress from './KpiProgress';
import { useTranslation } from '../i18n/LanguageContext';

interface BenchmarkDashboardProps {
  data: DashboardData;
  theme: 'light' | 'dark';
}

const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({ data, theme }) => {
  const { t } = useTranslation();
  const { oeeByLine, targets } = data.benchmarking;
  const { productionByLine } = data.summary;

  const benchmarkData = useMemo(() => {
    // Filter for line-level targets for this component
    const lineTargets = targets.filter(t => t.level === 'Line' && t.line_id);

    return lineTargets.map(target => {
      const actualOee = oeeByLine.find(o => o.name === target.line_id)?.value || 0;
      const actualOutput = productionByLine.find(p => p.name === target.line_id)?.value || 0;
      
      const lineDefects = data.allDefectRecords
        .filter(d => d.MACHINE_ID.startsWith(`M0${target.line_id!.charAt(0)}`)) // Simple mapping from line to machine for demo
        .reduce((sum, d) => sum + d.quantity, 0);
      
      const totalProductionForLine = actualOutput + lineDefects;
      const actualDefectRate = totalProductionForLine > 0 ? lineDefects / totalProductionForLine : 0;

      return {
        lineId: target.line_id,
        targetOee: target.target_oee,
        actualOee,
        targetOutput: target.target_output,
        actualOutput,
        targetDefectRate: target.target_defect_rate,
        actualDefectRate,
      };
    });
  }, [oeeByLine, targets, productionByLine, data.allDefectRecords]);
  
  const getBarColor = (value: number) => {
    if (value >= 0.85) return '#22c55e';
    if (value >= 0.70) return '#facc15';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeBenchmarkTitle')}</h2>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <SimpleBarChart data={oeeByLine.sort((a,b) => b.value - a.value)} xAxisKey="name" barKey="value" fillColor={getBarColor} isPercentage theme={theme} />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('targetVsActualTitle')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {benchmarkData.map(d => (
                <div key={d.lineId} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
                    <h3 className="text-xl font-bold">{t('line')} {d.lineId}</h3>
                    <KpiProgress label={t('oee')} actual={d.actualOee} target={d.targetOee} formatAs="percent" />
                    <KpiProgress label={t('output')} actual={d.actualOutput} target={d.targetOutput} formatAs="number" />
                    <KpiProgress label={t('defectRate')} actual={d.actualDefectRate} target={d.targetDefectRate} formatAs="percent" />
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default BenchmarkDashboard;
