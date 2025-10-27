

import React from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { BoxplotDataPoint } from '../types';

interface BoxplotChartProps {
    data: BoxplotDataPoint[];
    theme?: 'light' | 'dark';
}

// Custom shape component for rendering the entire box-and-whisker plot
const Box = (props: any) => {
    const { x, payload, yAxis, width } = props;
    if (!yAxis || !payload) return null;

    // Calculate pixel coordinates from data values using the yAxis scale
    const minYCoord = yAxis.scale(payload.min);
    const q1Coord = yAxis.scale(payload.q1);
    const medianCoord = yAxis.scale(payload.median);
    const q3Coord = yAxis.scale(payload.q3);
    const maxYCoord = yAxis.scale(payload.max);

    const cx = x + width / 2;

    return (
        <g>
            {/* Box (Q1 to Q3) */}
            <rect x={x} y={q3Coord} width={width} height={q1Coord - q3Coord} fill="#06b6d4" stroke="#0891b2" strokeWidth={1} />
            
            {/* Whiskers */}
            <line x1={cx} y1={maxYCoord} x2={cx} y2={q3Coord} stroke="#0891b2" strokeWidth={2} />
            <line x1={cx} y1={q1Coord} x2={cx} y2={minYCoord} stroke="#0891b2" strokeWidth={2} />

            {/* Top and Bottom T-bars of whiskers */}
            <line x1={cx - 5} y1={maxYCoord} x2={cx + 5} y2={maxYCoord} stroke="#0891b2" strokeWidth={2} />
            <line x1={cx - 5} y1={minYCoord} x2={cx + 5} y2={minYCoord} stroke="#0891b2" strokeWidth={2} />

            {/* Median Line */}
            <line x1={x} y1={medianCoord} x2={x + width} y2={medianCoord} stroke="#ffffff" strokeWidth={2} />
        </g>
    );
};

const BoxplotChart: React.FC<BoxplotChartProps> = ({ data, theme = 'light' }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No data to display.</div>;
    }

    // Determine Y-axis domain to ensure whiskers are fully visible
    const yMin = Math.min(...data.map(d => d.min));
    const yMax = Math.max(...data.map(d => d.max));
    const yPadding = (yMax - yMin) * 0.1; // 10% padding
    
    const tickColor = theme === 'dark' ? '#d1d5db' : '#6b7280';
    const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';


    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: tickColor }} />
                    <YAxis 
                        tick={{ fill: tickColor }} 
                        domain={[yMin - yPadding, yMax + yPadding]} 
                        allowDataOverflow={true} 
                        tickFormatter={(val) => val.toLocaleString()}
                    />
                    <Tooltip
                        cursor={{fill: 'rgba(6, 182, 212, 0.1)'}}
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                        labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
                        formatter={(value, name, props) => [null, null]} // Disable default formatter
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const isDark = theme === 'dark';
                                return (
                                    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
                                        <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold mb-2`}>{`${label}`}</p>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Max: <span className="font-medium text-cyan-400">{data.max.toLocaleString()}</span></p>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Q3: <span className="font-medium text-cyan-400">{data.q3.toLocaleString()}</span></p>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Median: <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{data.median.toLocaleString()}</span></p>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Q1: <span className="font-medium text-cyan-400">{data.q1.toLocaleString()}</span></p>
                                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Min: <span className="font-medium text-cyan-400">{data.min.toLocaleString()}</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    {/* A transparent bar to provide the positions for our custom shape. 
                        Its height is irrelevant as the shape calculates its own dimensions.
                        We set its dataKey to a value within our domain to ensure it renders. */}
                    <Bar dataKey="max" fill="transparent" isAnimationActive={false} shape={<Box />} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BoxplotChart;
