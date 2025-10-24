
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StackedBarDataPoint } from '../types';

interface StackedBarChartProps {
    data: StackedBarDataPoint[];
    keys: string[];
    theme?: 'light' | 'dark';
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, keys, theme = 'light' }) => {
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
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: -10, bottom: 5, }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: tickColor }} />
                    <YAxis tick={{ fill: tickColor }} />
                    <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={labelStyle}
                    />
                    <Legend wrapperStyle={{ color: tickColor, fontSize: '12px' }} />
                    {keys.map((key, index) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StackedBarChart;