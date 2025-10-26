

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

interface ParetoChartProps {
  data: (DataPoint & { cumulative?: number })[];
  barKey: string;
  lineKey: string;
  barColor: string;
  lineColor: string;
  theme?: 'light' | 'dark';
}

const ParetoChart: React.FC<ParetoChartProps> = ({ data, barKey, lineKey, barColor, lineColor, theme = 'light' }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available.</div>;
  }

  const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1f2937', border: '1px solid #374151' } 
    : { backgroundColor: '#ffffff', border: '1px solid #d1d5db' };
  const labelStyle = theme === 'dark' ? { color: '#f9fafb' } : { color: '#1f2937' };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" tick={{ fill: tickColor }} angle={-20} textAnchor="end" height={50} />
          <YAxis yAxisId="left" label={{ value: 'Value', angle: -90, position: 'insideLeft', fill: tickColor }} tick={{ fill: tickColor }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 100]} tick={{ fill: tickColor }} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
            itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#374151' }}
            formatter={(value: number, name: string) => (name === 'Cumulative' ? `${value.toFixed(1)}%` : value)}
          />
          <Legend wrapperStyle={{ color: tickColor }} />
          <Bar yAxisId="left" dataKey={barKey} fill={barColor} barSize={30} name="Count" />
          <Line yAxisId="right" type="monotone" dataKey={lineKey} stroke={lineColor} strokeWidth={2} dot={{ r: 4 }} name="Cumulative" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ParetoChart;