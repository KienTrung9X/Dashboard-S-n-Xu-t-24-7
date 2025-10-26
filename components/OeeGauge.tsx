import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '../i18n/LanguageContext';

interface OeeGaugeProps {
  value: number;
  availability: number;
  performance: number;
  quality: number;
  theme: 'light' | 'dark';
  oeeThreshold: number;
}

// Custom Tooltip for OEE Breakdown
const CustomTooltip = ({ active, payload, theme, t, oeeThreshold }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isDark = theme === 'dark';
        return (
            <div className={`p-3 rounded-lg shadow-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('oeeBreakdown')}</p>
                <ul className="space-y-1 text-sm">
                    <li className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('availability')}: <span className="font-bold text-cyan-400">{(data.availability * 100).toFixed(1)}%</span></li>
                    <li className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('performance')}: <span className="font-bold text-cyan-400">{(data.performance * 100).toFixed(1)}%</span></li>
                    <li className={isDark ? 'text-gray-300' : 'text-gray-600'}>{t('quality')}: <span className="font-bold text-cyan-400">{(data.quality * 100).toFixed(1)}%</span></li>
                </ul>
            </div>
        );
    }
    return null;
};


const OeeGauge: React.FC<OeeGaugeProps> = ({ value, availability, performance, quality, theme, oeeThreshold }) => {
  const { t } = useTranslation();
  const percentage = Math.round(value * 100);
  const thresholdDecimal = oeeThreshold / 100;
  
  let color = '#22c55e'; // green-500 for world-class (>=90%)
  if (value < 0.9) color = '#facc15'; // yellow-400 for acceptable
  if (value < thresholdDecimal) color = '#ef4444'; // red-500 for below threshold

  const data = [{ 
    name: 'OEE', 
    value: percentage, 
    fill: color,
    availability: availability,
    performance: performance,
    quality: quality,
   }];
  const backgroundFill = theme === 'dark' ? '#374151' : '#e5e7eb'; // gray-700 or gray-200

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col items-center justify-center">
      <div className="w-full flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('oeeGaugeTitle')}</h2>
        <div className="relative group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full mb-2 -right-4 w-60 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                <p className="font-bold mb-1">Color Legend:</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li><span className="font-semibold text-green-400">Green:</span> {t('worldClass')} ( &ge; 90%)</li>
                    <li><span className="font-semibold text-yellow-400">Yellow:</span> {t('acceptable')} ( &lt; 90%)</li>
                    <li><span className="font-semibold text-red-400">Red:</span> {t('belowThreshold', {threshold: oeeThreshold})}</li>
                </ul>
                <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
        </div>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={20}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: backgroundFill }}
              dataKey="value"
              cornerRadius={10}
            />
            <Tooltip content={<CustomTooltip theme={theme} t={t} oeeThreshold={oeeThreshold} />} cursor={{fill: 'transparent'}} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-bold"
              style={{ fill: color, fontSize: '2.25rem' }}
            >
              {`${percentage}%`}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OeeGauge;