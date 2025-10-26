import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { TrendData } from '../types';

interface DefectTrendChartProps {
  data: TrendData[];
  theme?: 'light' | 'dark';
}

const DefectTrendChart: React.FC<DefectTrendChartProps> = ({ data, theme = 'light' }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No defect trend data available.</div>;
    }

    const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
    const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
    const tooltipStyle = theme === 'dark' 
      ? { backgroundColor: '#1f2937', border: '1px solid #374151' } 
      : { backgroundColor: '#ffffff', border: '1px solid #d1d5db' };
    const labelStyle = theme === 'dark' ? { color: '#f9fafb' } : { color: '#1f2937' };
    const defectColor = '#ef4444'; // red-500

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorDefect" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={defectColor} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={defectColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fill: tickColor }} />
                    <YAxis tick={{ fill: tickColor }} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={labelStyle}
                        formatter={(val: number) => [val.toLocaleString(), 'Total Defects']}
                    />
                    <Legend wrapperStyle={{ color: tickColor }} />
                    <Area
                        type="monotone"
                        dataKey="totalDefects"
                        stroke="none"
                        fill="url(#colorDefect)"
                    />
                    <Line 
                        type="monotone" 
                        dataKey="totalDefects" 
                        name="Total Defects" 
                        stroke={defectColor} 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        connectNulls={false} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DefectTrendChart;
