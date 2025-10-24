import React, { useState, useMemo } from 'react';
import { ProductionDaily } from '../types';

interface ProductionLogTableProps {
  data: ProductionDaily[];
  onMachineSelect: (machineId: string) => void;
  onUpdateDefect: (prodId: number, newQty: number) => void;
  oeeThreshold: number;
}

const FilterInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; label: string }> = ({ value, onChange, placeholder, label }) => (
    <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        min="0"
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
    />
);


const ProductionLogTable: React.FC<ProductionLogTableProps> = ({ data, onMachineSelect, onUpdateDefect, oeeThreshold }) => {
  const [editingPopover, setEditingPopover] = useState<{
    prodId: number;
    originalQty: number;
    top: number;
    left: number;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [minDefects, setMinDefects] = useState('');
  const [maxDefects, setMaxDefects] = useState('');
  const [minDowntime, setMinDowntime] = useState('');
  const [maxDowntime, setMaxDowntime] = useState('');

  const handleDoubleClick = (log: ProductionDaily, event: React.MouseEvent) => {
    setEditingPopover({
      prodId: log.Prod_ID,
      originalQty: log.DEFECT_QTY,
      top: event.clientY,
      left: event.clientX,
    });
    setEditValue(String(log.DEFECT_QTY));
  };

  const handleCancelEdit = () => {
    setEditingPopover(null);
    setEditValue('');
  };

  const handleConfirmEdit = () => {
    if (!editingPopover) return;
    const { prodId, originalQty } = editingPopover;
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

  const handleClearFilters = () => {
      setSearchTerm('');
      setSelectedShift('all');
      setMinDefects('');
      setMaxDefects('');
      setMinDowntime('');
      setMaxDowntime('');
  };

  const filteredData = useMemo(() => {
    const minDefectsNum = minDefects !== '' ? parseInt(minDefects, 10) : -Infinity;
    const maxDefectsNum = maxDefects !== '' ? parseInt(maxDefects, 10) : Infinity;
    const minDowntimeNum = minDowntime !== '' ? parseInt(minDowntime, 10) : -Infinity;
    const maxDowntimeNum = maxDowntime !== '' ? parseInt(maxDowntime, 10) : Infinity;
    
    return data.filter(log => {
      const searchMatch = !searchTerm ||
        log.MACHINE_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.LINE_ID.toLowerCase().includes(searchTerm.toLowerCase());

      const shiftMatch = selectedShift === 'all' || log.SHIFT === selectedShift;
      
      const defectMatch = (isNaN(minDefectsNum) || log.DEFECT_QTY >= minDefectsNum) && 
                          (isNaN(maxDefectsNum) || log.DEFECT_QTY <= maxDefectsNum);

      const downtimeMatch = (isNaN(minDowntimeNum) || log.DOWNTIME_MIN >= minDowntimeNum) && 
                            (isNaN(maxDowntimeNum) || log.DOWNTIME_MIN <= maxDowntimeNum);

      return searchMatch && shiftMatch && defectMatch && downtimeMatch;
    });
  }, [data, searchTerm, selectedShift, minDefects, maxDefects, minDowntime, maxDowntime]);


  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Machine/Line</label>
            <input
              id="search-input"
              type="text"
              placeholder="Filter by ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="shift-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
            <select
              id="shift-select"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as 'all' | 'A' | 'B' | 'C')}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defects Range</label>
             <div className="flex items-center gap-2">
                <FilterInput value={minDefects} onChange={(e) => setMinDefects(e.target.value)} placeholder="Min" label="Min Defects" />
                <span className="text-gray-500">-</span>
                <FilterInput value={maxDefects} onChange={(e) => setMaxDefects(e.target.value)} placeholder="Max" label="Max Defects" />
             </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Downtime Range</label>
             <div className="flex items-center gap-2">
                <FilterInput value={minDowntime} onChange={(e) => setMinDowntime(e.target.value)} placeholder="Min" label="Min Downtime" />
                <span className="text-gray-500">-</span>
                <FilterInput value={maxDowntime} onChange={(e) => setMaxDowntime(e.target.value)} placeholder="Max" label="Max Downtime" />
             </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleClearFilters}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
                Clear All Filters
            </button>
        </div>
      </div>
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
            {filteredData.map((log) => {
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
                  className="whitespace-nowrap px-3 py-4 text-sm text-red-500 dark:text-red-400 cursor-pointer"
                  onDoubleClick={(e) => handleDoubleClick(log, e)}
                  title="Double-click to edit"
                >
                  {log.DEFECT_QTY.toLocaleString()}
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
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No records match your search criteria.
          </div>
        )}
      </div>

      {editingPopover && (
          <div className="fixed inset-0 z-40" onClick={handleCancelEdit}>
              <div
                  className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-600 p-4 space-y-3 animate-fade-in-up"
                  style={{
                      top: `${editingPopover.top + 10}px`,
                      left: `${editingPopover.left}px`,
                      transform: 'translateX(-50%)',
                      zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()}
              >
                  <h4 className="font-semibold text-gray-800 dark:text-white">Update Defects</h4>
                  <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                      className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={handleCancelEdit} className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-1 px-3 rounded-md transition-colors">Cancel</button>
                      <button onClick={handleConfirmEdit} className="text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-1 px-3 rounded-md transition-colors">Confirm</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProductionLogTable;