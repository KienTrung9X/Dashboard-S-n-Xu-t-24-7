

import React from 'react';
// FIX: Added 'CartesianGrid' to the import from 'recharts' to resolve the error.
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { HeatmapDataPoint } from './types';

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  theme?: 'light' | 'dark';
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, theme = 'light' }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data to display.</div>;
  }
  
  const lines = [...new Set(data.map(d => d.line))].sort();
  const shifts = ['A', 'B', 'C'];

  const getColor = (value: number) => {
    if (value >= 0.9) return '#16a34a'; // green-600
    if (value >= 0.85) return '#22c55e'; // green-500
    if (value >= 0.8) return '#84cc16'; // lime-500
    if (value >= 0.75) return '#facc15'; // yellow-400
    if (value > 0) return '#ef4444'; // red-500
    return '#4b5563'; // gray-600
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isDark = theme === 'dark';
      return (
        <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-xl border`}>
          <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-1`}>{`${data.line} - Ca ${data.shift}`}</p>
          <p className="text-cyan-400 font-bold text-lg">
            OEE: <span style={{ color: getColor(data.value) }}>{(data.value * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="shift" 
            type="category" 
            name="Shift" 
            tick={{ fill: tickColor }}
            domain={shifts}
            />
          <YAxis 
            dataKey="line" 
            type="category" 
            name="Line" 
            tick={{ fill: tickColor }} 
            domain={lines}
            reversed={true}
            />
          <ZAxis dataKey="value" range={[900, 900]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="OEE by Line/Shift" data={data} shape="square">
             {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeatmapChart;