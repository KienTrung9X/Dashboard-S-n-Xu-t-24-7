
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
// FIX: Replaced non-existent 'DowntimeData' with 'DataPoint' which matches the expected data structure.
import { DataPoint } from '../types';

interface DowntimeParetoChartProps {
  data: DataPoint[];
}

const DowntimeParetoChart: React.FC<DowntimeParetoChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No downtime data to display.</div>;
  }
  
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const totalDowntime = sortedData.reduce((sum, item) => sum + item.value, 0);

  let cumulative = 0;
  const chartData = sortedData.map(item => {
    cumulative += item.value;
    return {
      name: item.name,
      'Time (min)': item.value,
      'Cumulative %': totalDowntime > 0 ? (cumulative / totalDowntime) * 100 : 0,
    };
  });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="name" tick={{ fill: '#d1d5db' }} />
          <YAxis yAxisId="left" label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#d1d5db' }} tick={{ fill: '#d1d5db' }} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} domain={[0, 100]} tick={{ fill: '#d1d5db' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#f9fafb' }}
            itemStyle={{ color: '#f3f4f6' }}
          />
          <Legend wrapperStyle={{ color: '#d1d5db' }} />
          <Bar yAxisId="left" dataKey="Time (min)" fill="#f97316" barSize={30} />
          <Line yAxisId="right" type="monotone" dataKey="Cumulative %" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DowntimeParetoChart;