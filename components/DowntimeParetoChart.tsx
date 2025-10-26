

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DataPoint } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface DowntimeParetoChartProps {
  data: DataPoint[];
  theme?: 'light' | 'dark';
}

const DowntimeParetoChart: React.FC<DowntimeParetoChartProps> = ({ data, theme = 'dark' }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No downtime data to display.</div>;
  }
  
  const sortedOriginalData = [...data].sort((a, b) => b.value - a.value);

  let processedDataForBars: DataPoint[];
  if (sortedOriginalData.length > 5) {
      const top5 = sortedOriginalData.slice(0, 5);
      const othersValue = sortedOriginalData.slice(5).reduce((sum, item) => sum + item.value, 0);
      processedDataForBars = [...top5];
      if (othersValue > 0) {
        processedDataForBars.push({ name: t('others'), value: othersValue });
      }
  } else {
      processedDataForBars = sortedOriginalData;
  }
  
  const totalDowntime = sortedOriginalData.reduce((sum, item) => sum + item.value, 0);

  let cumulativeValue = 0;
  const chartData = processedDataForBars.map(item => {
    cumulativeValue += item.value;
    return {
      name: item.name,
      'Time (min)': item.value,
      'Cumulative %': totalDowntime > 0 ? (cumulativeValue / totalDowntime) * 100 : 0,
    };
  });

  const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1f2937', border: '1px solid #374151' } 
    : { backgroundColor: '#ffffff', border: '1px solid #d1d5db' };
  const labelStyle = theme === 'dark' ? { color: '#f9fafb' } : { color: '#1f2937' };
  const itemStyle = theme === 'dark' ? { color: '#f3f4f6' } : {};

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fill: tickColor }} />
          <YAxis yAxisId="left" label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: tickColor }} tick={{ fill: tickColor }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 100]} tick={{ fill: tickColor }} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
            itemStyle={itemStyle}
          />
          <Legend wrapperStyle={{ color: tickColor }} />
          <Bar yAxisId="left" dataKey="Time (min)" fill="#f97316" barSize={30} />
          <Line yAxisId="right" type="monotone" dataKey="Cumulative %" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DowntimeParetoChart;