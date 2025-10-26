import React from 'react';

interface KpiCardProps {
  title: string;
  value: number;
  unit?: string;
  precision?: number;
  description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit = '%', precision = 1, description }) => {
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
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            {description && (
              <div className="relative group">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    {description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-px w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
        </div>
      </div>
      <p className={`text-5xl font-bold mt-2 ${valueColorClass}`}>
        {formattedValue}<span className={`text-3xl ${unitColorClass}`}>{unit}</span>
      </p>
    </div>
  );
};

export default KpiCard;