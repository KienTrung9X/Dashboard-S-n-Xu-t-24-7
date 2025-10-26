import React, { useState, useMemo } from 'react';
import { ProductionDaily } from '../types';
import { defectRecords } from '../services/dataService';

interface ProductionLogTableProps {
  data: ProductionDaily[];
  onMachineSelect: (machineId: string) => void;
  onUpdateDefect: (prodId: number, newQty: number) => void;
  oeeThreshold: number;
  uniqueDefectTypes: string[];
}

type SortKey = keyof ProductionDaily | 'OEE'; // 'OEE' is explicitly included for clarity
type SortDirection = 'ascending' | 'descending';


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


const ProductionLogTable: React.FC<ProductionLogTableProps> = ({ data, onMachineSelect, onUpdateDefect, oeeThreshold, uniqueDefectTypes }) => {
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
  const [selectedDefectType, setSelectedDefectType] = useState<'all' | string>('all');
  const [minDefects, setMinDefects] = useState('');
  const [maxDefects, setMaxDefects] = useState('');
  const [minDowntime, setMinDowntime] = useState('');
  const [maxDowntime, setMaxDowntime] = useState('');

  // Sorting state - default to OEE descending
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'OEE', direction: 'descending' });


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
      setSelectedDefectType('all');
      setMinDefects('');
      setMaxDefects('');
      setMinDowntime('');
      setMaxDowntime('');
  };
  
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    const minDefectsNum = minDefects !== '' ? parseInt(minDefects, 10) : -Infinity;
    const maxDefectsNum = maxDefects !== '' ? parseInt(maxDefects, 10) : Infinity;
    const minDowntimeNum = minDowntime !== '' ? parseInt(minDowntime, 10) : -Infinity;
    const maxDowntimeNum = maxDowntime !== '' ? parseInt(maxDowntime, 10) : Infinity;
    
    const preliminaryFilteredData = data.filter(log => {
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

    if (selectedDefectType === 'all') {
      return preliminaryFilteredData;
    }

    // Create a set of keys for production logs that have the selected defect type for efficient lookup
    const logsWithSelectedDefect = new Set(
      defectRecords
        .filter(d => d.DEFECT_TYPE === selectedDefectType)
        .map(d => `${d.COMP_DAY}|${d.MACHINE_ID}|${d.SHIFT}`)
    );

    return preliminaryFilteredData.filter(log => {
      const logKey = `${log.COMP_DAY}|${log.MACHINE_ID}|${log.SHIFT}`;
      return logsWithSelectedDefect.has(logKey);
    });

  }, [data, searchTerm, selectedShift, minDefects, maxDefects, minDowntime, maxDowntime, selectedDefectType]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        // Handle calculated OEE separately from the object key `OEE`
        const key = sortConfig.key;
        let aValue: any;
        let bValue: any;

        if (key === 'OEE') {
            aValue = (a.availability ?? 0) * (a.performance ?? 0) * (a.quality ?? 0);
            bValue = (b.availability ?? 0) * (b.performance ?? 0) * (b.quality ?? 0);
        } else {
            aValue = a[key as keyof ProductionDaily];
            bValue = b[key as keyof ProductionDaily];
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
        return <span className="text-gray-400 dark:text-gray-500 transition-opacity opacity-20 group-hover:opacity-100">↕</span>;
    }
    if (sortConfig.direction === 'ascending') {
        return <span className="text-cyan-500">▲</span>;
    }
    return <span className="text-cyan-500">▼</span>;
  };

  const headerButtonClass = "group inline-flex items-center gap-1.5 focus:outline-none";

  return (
    <div>
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
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
            <label htmlFor="defect-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defect Type</label>
            <select
              id="defect-type-select"
              value={selectedDefectType}
              onChange={(e) => setSelectedDefectType(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Defect Types</option>
              {uniqueDefectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
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
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"><button onClick={() => requestSort('MACHINE_ID')} className={headerButtonClass}>Machine ID {getSortIcon('MACHINE_ID')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('LINE_ID')} className={headerButtonClass}>Line {getSortIcon('LINE_ID')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('SHIFT')} className={headerButtonClass}>Shift {getSortIcon('SHIFT')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('ACT_PRO_QTY')} className={headerButtonClass}>Output {getSortIcon('ACT_PRO_QTY')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DEFECT_QTY')} className={headerButtonClass}>Defects {getSortIcon('DEFECT_QTY')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DOWNTIME_MIN')} className={headerButtonClass}>Downtime (min) {getSortIcon('DOWNTIME_MIN')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('availability')} className={headerButtonClass}>Availability {getSortIcon('availability')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('performance')} className={headerButtonClass}>Performance {getSortIcon('performance')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('quality')} className={headerButtonClass}>Quality {getSortIcon('quality')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('OEE')} className={headerButtonClass}>OEE {getSortIcon('OEE')}</button></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {sortedData.map((log) => {
              const oee = (log.availability ?? 0) * (log.performance ?? 0) * (log.quality ?? 0);

              let rowClass = 'even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60';
              let oeeTextClass = '';

              if (oee >= 0.8) {
                oeeTextClass = 'text-green-500 dark:text-green-400';
              } else if (oee >= 0.7) {
                rowClass = 'bg-yellow-100/50 dark:bg-yellow-900/20 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/40';
                oeeTextClass = 'text-yellow-500 dark:text-yellow-400';
              } else {
                rowClass = 'bg-red-100/50 dark:bg-red-900/20 hover:bg-red-100/70 dark:hover:bg-red-900/40';
                oeeTextClass = 'text-red-500 dark:text-red-400';
              }

              return (
              <tr key={log.Prod_ID} className={`transition-colors duration-150 ${rowClass}`}>
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
                  <span className={oeeTextClass}>
                    {(oee * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
              )})}
          </tbody>
        </table>
        {sortedData.length === 0 && (
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