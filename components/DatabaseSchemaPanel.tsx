import React, { useState } from 'react';
import { machineInfoData, productionDailyData, downtimeRecords, defectRecords } from '../services/dataService';

interface DatabaseSchemaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TableName = 'Machine_Info' | 'Production_Daily' | 'Downtime_Records' | 'Defect_Records';

const tableDataMap: Record<TableName, any[]> = {
    'Machine_Info': machineInfoData,
    'Production_Daily': productionDailyData,
    'Downtime_Records': downtimeRecords,
    'Defect_Records': defectRecords,
};

// Function to get headers from the first object in an array
const getHeaders = (data: any[]): string[] => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
}

const TableViewer: React.FC<{ data: any[], tableName: TableName }> = ({ data, tableName }) => {
    const headers = getHeaders(data);
    
    // Limit displayed rows for performance
    const displayData = data.slice(0, 100);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-cyan-500 dark:text-cyan-400 mb-3">{tableName}</h3>
            {data.length > 100 && <p className="text-sm text-yellow-500 dark:text-yellow-400 mb-3">Showing first 100 of {data.length} rows.</p>}
            <div className="overflow-x-auto max-h-[60vh]">
                 <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className="p-2 font-semibold text-gray-600 dark:text-white whitespace-nowrap">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {displayData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-100 dark:hover:bg-gray-800/60">
                                {headers.map(header => (
                                    <td key={`${rowIndex}-${header}`} className="p-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {/* Simple formatting for decimal numbers */}
                                        {typeof row[header] === 'number' && row[header] > 0 && row[header] < 1 ? row[header].toFixed(4) : String(row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const DatabaseSchemaPanel: React.FC<DatabaseSchemaPanelProps> = ({ isOpen, onClose }) => {
    const [activeTable, setActiveTable] = useState<TableName>('Machine_Info');

    const tableNames = Object.keys(tableDataMap) as TableName[];

    const TabButton: React.FC<{ tableName: TableName }> = ({ tableName }) => (
        <button
          onClick={() => setActiveTable(tableName)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
            activeTable === tableName ? 'bg-cyan-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {tableName.replace(/_/g, ' ')}
        </button>
    );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schema-panel-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="schema-panel-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Database Tables
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Close panel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <nav className="p-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <div className="flex items-center gap-2">
                {tableNames.map(name => <TabButton key={name} tableName={name} />)}
            </div>
        </nav>

        <main className="p-6 overflow-y-auto flex-grow">
            {activeTable && <TableViewer data={tableDataMap[activeTable]} tableName={activeTable} />}
        </main>
      </aside>
    </>
  );
};

export default DatabaseSchemaPanel;