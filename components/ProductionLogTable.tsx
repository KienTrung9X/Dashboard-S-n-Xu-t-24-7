import React, { useState } from 'react';
import { ProductionDaily } from '../types';

interface ProductionLogTableProps {
  data: ProductionDaily[];
  onMachineSelect: (machineId: string) => void;
  onUpdateDefect: (prodId: number, newQty: number) => void;
  oeeThreshold: number;
}

const ProductionLogTable: React.FC<ProductionLogTableProps> = ({ data, onMachineSelect, onUpdateDefect, oeeThreshold }) => {
  const [editingCell, setEditingCell] = useState<{ prodId: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDoubleClick = (log: ProductionDaily) => {
    if (editingCell?.prodId === log.Prod_ID) return;
    setEditingCell({ prodId: log.Prod_ID });
    setEditValue(String(log.DEFECT_QTY));
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleConfirmEdit = (prodId: number, originalQty: number) => {
    const newQty = parseInt(editValue, 10);
    // Validate: must be a non-negative number
    if (isNaN(newQty) || newQty < 0) {
      handleCancelEdit();
      return;
    }
    // Only trigger update if value has changed
    if (newQty !== originalQty) {
      onUpdateDefect(prodId, newQty);
    }
    handleCancelEdit();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Machine ID</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Line</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Shift</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Output</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Defects</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Downtime (min)</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Availability</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Performance</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Quality</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">OEE</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {data.map((log) => {
            const isBelowThreshold = log.OEE < (oeeThreshold / 100);
            return (
            <tr key={log.Prod_ID} className={`transition-colors duration-150 ${isBelowThreshold ? 'bg-yellow-100/50 dark:bg-yellow-900/20 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/40' : 'even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60'}`}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                <button
                  onClick={() => onMachineSelect(log.MACHINE_ID)}
                  className="flex items-center hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full mr-3 ${log.STATUS === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}
                    title={log.STATUS === 'active' ? 'Active' : 'Inactive'}
                  ></span>
                  {log.MACHINE_ID}
                </button>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{log.LINE_ID}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{log.SHIFT}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{log.ACT_PRO_QTY.toLocaleString()}</td>
              <td 
                className="whitespace-nowrap px-3 py-4 text-sm text-red-500 dark:text-red-400"
                onDoubleClick={() => handleDoubleClick(log)}
                title="Double-click to edit"
              >
                 {editingCell?.prodId === log.Prod_ID ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmEdit(log.Prod_ID, log.DEFECT_QTY);
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                            onBlur={() => handleConfirmEdit(log.Prod_ID, log.DEFECT_QTY)}
                            className="w-20 bg-gray-200 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 rounded px-1 py-0.5 text-gray-900 dark:text-white"
                        />
                    </div>
                ) : (
                    log.DEFECT_QTY.toLocaleString()
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{log.DOWNTIME_MIN.toLocaleString()}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{(log.availability ?? 0).toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 1})}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{(log.performance ?? 0).toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 1})}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{(log.quality ?? 0).toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 1})}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold">
                <span className={isBelowThreshold ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}>
                  {(log.OEE * 100).toFixed(1)}%
                </span>
                {isBelowThreshold && (
                // FIX: Replaced the 'title' prop on the SVG element with a nested <title> element to comply with React's SVG props and fix the type error.
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <title>{`Below ${oeeThreshold}% OEE threshold`}</title>
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
              </td>
            </tr>
            )})}
        </tbody>
      </table>
    </div>
  );
};

export default ProductionLogTable;