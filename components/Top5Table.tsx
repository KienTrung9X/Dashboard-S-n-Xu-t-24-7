import React from 'react';

interface Top5TableProps {
  headers: string[];
  data: { col1: string; col2: string | number; col3?: string | number; col4?: string | number }[];
}

const Top5Table: React.FC<Top5TableProps> = ({ headers, data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available.</div>;
  }
  
  return (
    <div className="overflow-x-auto h-full">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="py-2 px-3 text-left text-xs font-semibold text-gray-500 dark:text-white uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="whitespace-nowrap py-3 px-3 text-sm font-medium text-gray-900 dark:text-white">{row.col1}</td>
              <td className="whitespace-nowrap py-3 px-3 text-sm text-gray-500 dark:text-gray-300">{row.col2}</td>
              {row.col3 && <td className="whitespace-nowrap py-3 px-3 text-sm text-gray-500 dark:text-gray-300">{row.col3}</td>}
              {row.col4 && <td className="whitespace-nowrap py-3 px-3 text-sm text-gray-500 dark:text-gray-300">{row.col4}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Top5Table;