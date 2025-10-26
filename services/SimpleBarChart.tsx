import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { DataPoint } from '../types';

interface SimpleBarChartProps {
  data: DataPoint[];
  xAxisKey: string;
  barKey: string;
  fillColor: string | ((value: number) => string);
  isPercentage?: boolean;
  theme?: 'light' | 'dark';
  onBarClick?: (payload: any) => void;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, xAxisKey, barKey, fillColor, isPercentage = false, theme = 'light', onBarClick }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available.</div>;
  }
  
  const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1f2937', border: '1px solid #374151' } 
    : { backgroundColor: '#ffffff', border: '1px solid #d1d5db' };
  const labelStyle = theme === 'dark' ? { color: '#f9fafb' } : { color: '#1f2937' };

  const isFillColorFn = typeof fillColor === 'function';

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          onClick={(chartData) => {
              if (chartData && chartData.activePayload && chartData.activePayload.length > 0 && onBarClick) {
                  onBarClick(chartData.activePayload[0].payload);
              }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey={xAxisKey} tick={{ fill: tickColor }} />
          <YAxis tick={{ fill: tickColor }} tickFormatter={isPercentage ? (val) => `${(val * 100).toFixed(0)}%` : undefined}/>
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={labelStyle}
            formatter={isPercentage ? (val: number) => [`${(val * 100).toFixed(1)}%`, 'Value'] : undefined}
          />
          <Bar dataKey={barKey} fill={isFillColorFn ? undefined : fillColor} cursor={onBarClick ? "pointer" : "default"}>
             {isFillColorFn && data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(fillColor as (value: number) => string)(entry[barKey as keyof DataPoint] as number)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimpleBarChart;
