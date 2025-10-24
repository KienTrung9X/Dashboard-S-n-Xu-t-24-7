
import React from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  unit?: string;
  precision?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit = '%', precision = 1 }) => {
  const isPercentage = unit === '%';
  const displayValue = isPercentage ? value * 100 : value;
  const formattedValue = displayValue.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
  });

  let valueColorClass = 'text-cyan-500 dark:text-cyan-400';
  let unitColorClass = 'text-gray-400 dark:text-gray-500';

  if (isPercentage) {
    valueColorClass = 'text-green-500 dark:text-green-400';
    if (value < 0.9) valueColorClass = 'text-yellow-500 dark:text-yellow-400';
    if (value < 0.8) valueColorClass = 'text-red-500 dark:text-red-400';
  } else if (title.toLowerCase().includes('phế phẩm')) {
    valueColorClass = 'text-red-500 dark:text-red-400';
  } else if (title.toLowerCase().includes('dừng máy')) {
    valueColorClass = 'text-yellow-500 dark:text-yellow-400';
  }


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-5xl font-bold mt-2 ${valueColorClass}`}>
        {formattedValue}<span className={`text-3xl ${unitColorClass}`}>{unit}</span>
      </p>
    </div>
  );
};

export default KpiCard;