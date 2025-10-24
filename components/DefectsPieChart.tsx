
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
// FIX: Replaced non-existent 'DefectData' with 'DataPoint' to match the expected data structure.
import { DataPoint } from '../types';

interface DefectsPieChartProps {
  data: DataPoint[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

const DefectsPieChart: React.FC<DefectsPieChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-full text-gray-500">No defect data to display.</div>;
    }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            // FIX: Cast data to a type with an index signature to resolve recharts type issue.
            data={data as {[key: string]: any}[]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            labelLine={false}
            // FIX: Add explicit types to label props to prevent arithmetic errors on unknown types.
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number, cy: number, midAngle: number, innerRadius: number, outerRadius: number, percent: number }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
             contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
             labelStyle={{ color: '#f9fafb' }}
          />
          <Legend wrapperStyle={{ color: '#d1d5db', paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DefectsPieChart;