import React from 'react';

interface KpiProgressProps {
  label: string;
  actual: number;
  target: number;
  formatAs: 'number' | 'percent';
}

const KpiProgress: React.FC<KpiProgressProps> = ({ label, actual, target, formatAs }) => {
  const progress = target > 0 ? (actual / target) * 100 : 0;
  const isExceeded = progress > 100;
  const isBelowTarget = progress < 90;

  let progressBarColor = 'bg-cyan-500';
  if (isExceeded) progressBarColor = 'bg-green-500';
  if (isBelowTarget) progressBarColor = 'bg-red-500';
  
  const formatValue = (value: number) => {
    if (formatAs === 'percent') {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Target: {formatValue(target)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="w-28 text-right">
            <span className={`font-bold text-lg ${isBelowTarget ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                {formatValue(actual)}
            </span>
        </div>
      </div>
    </div>
  );
};

export default KpiProgress;
