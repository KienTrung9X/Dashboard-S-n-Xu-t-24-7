
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { TrendData } from './types';

interface LineConfig {
    dataKey: string;
    stroke: string;
    name: string;
}

interface TargetLineConfig {
    value: number;
    label: string;
    stroke: string;
}

interface TrendChartProps {
  data: any[];
  lines: LineConfig[];
  isPercentage?: boolean;
  targetLines?: TargetLineConfig[];
  areaLines?: string[];
  theme?: 'light' | 'dark';
}

const TrendChart: React.FC<TrendChartProps> = ({ data, lines, isPercentage = false, targetLines, areaLines, theme = 'light' }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No trend data available.</div>;
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
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: tickColor }} />
                <YAxis tick={{ fill: tickColor }} tickFormatter={isPercentage ? (val) => `${(val * 100).toFixed(0)}%` : undefined} domain={isPercentage ? [0, 1] : undefined} />
                <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={labelStyle}
                    formatter={(val: number, name: string) => {
                      if (val === null) return [null, name]; // Keep legend entry even if value is null
                      return isPercentage ? [`${(val * 100).toFixed(1)}%`, name] : [val, name];
                    }}
                />
                <Legend wrapperStyle={{ color: tickColor }} />
                {targetLines && targetLines.map(line => (
                    <ReferenceLine 
                        key={line.label}
                        y={line.value} 
                        stroke={line.stroke} 
                        strokeDasharray="4 4"
                        label={{ value: line.label, position: 'right', fill: line.stroke, fontSize: 12 }}
                    />
                ))}

                {/* Render Area fills */}
                {areaLines && areaLines.map(key => {
                    const lineConfig = lines.find(l => l.dataKey === key);
                    if (!lineConfig) return null;
                    return (
                        <defs key={`def-${key}`}>
                            <linearGradient id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={lineConfig.stroke} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={lineConfig.stroke} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                    );
                })}
                {areaLines && areaLines.map(key => {
                     const lineConfig = lines.find(l => l.dataKey === key);
                     if (!lineConfig) return null;
                     return (
                        <Area
                            key={`area-${key}`}
                            type="monotone"
                            dataKey={key}
                            stroke="none"
                            fill={`url(#color-${key})`}
                            connectNulls={false}
                        />
                     )
                })}
                
                {/* Render Lines on top of Areas */}
                {lines.map(line => (
                     <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.stroke} strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;