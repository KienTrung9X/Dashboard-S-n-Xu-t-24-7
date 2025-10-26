import React, { useState, useMemo } from 'react';
import { ProductionDaily, EnrichedDefectRecord, DefectType } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ProductionLogTableProps {
  data: ProductionDaily[];
  onMachineSelect: (machineId: string) => void;
  oeeThreshold: number;
  allDefectTypes: DefectType[];
  allDefectRecords: EnrichedDefectRecord[];
}

type SortKey = keyof ProductionDaily | 'OEE'; // 'OEE' is explicitly included for clarity
type SortDirection = 'ascending' | 'descending';

// Popover component defined within the same file to avoid creating new files
interface DefectDetailsPopoverProps {
    defects: EnrichedDefectRecord[];
    top: number;
    left: number;
    onClose: () => void;
    onNavigate: (date: string, machineId: string, shift: 'A' | 'B' | 'C') => void;
    t: (key: any) => string;
}

const DefectDetailsPopover: React.FC<DefectDetailsPopoverProps> = ({ defects, top, left, onClose, onNavigate, t }) => {
    const handleNavigate = () => {
        if (defects.length > 0) {
            const firstDefect = defects[0];
            onNavigate(firstDefect.work_date, firstDefect.MACHINE_ID, firstDefect.SHIFT);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-40" onClick={onClose}>
            <div
                className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-600 p-0 flex flex-col w-96 max-h-96 animate-fade-in-up"
                style={{
                    top: `${top + 10}px`,
                    left: `${left}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-3 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{t('defectDetailsPopoverTitle')}</h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </header>
                <main className="p-3 overflow-y-auto space-y-3">
                    {defects.map(defect => (
                        <div key={defect.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                            <p className="font-bold">{defect.defect_type_name}: <span className="text-red-500 dark:text-red-400">{defect.quantity} pcs</span></p>
                            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">{t('cause')}:</span> {defect.cause_category}</p>
                             {defect.note && <p className="text-gray-600 dark:text-gray-300 mt-1"><span className="font-semibold">{t('notes')}:</span> {defect.note}</p>}
                             {defect.image_urls && defect.image_urls.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('attachedImages')}</p>
                                    <div className="flex gap-2">
                                        {defect.image_urls.map((url, index) => (
                                            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative group">
                                                <img src={url} alt={`Defect ${index + 1}`} className="h-12 w-12 rounded object-cover border border-gray-300 dark:border-gray-600" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ImageIcon size={16} className="text-white" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </main>
                <footer className="flex-shrink-0 p-3 border-t dark:border-gray-700 flex justify-end sticky bottom-0 bg-white dark:bg-gray-800">
                     <button onClick={handleNavigate} className="text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center gap-2">
                        <ExternalLink size={14} />
                        {t('viewInFullLog')}
                    </button>
                </footer>
            </div>
        </div>
    );
};


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


const ProductionLogTable: React.FC<ProductionLogTableProps> = ({ data, onMachineSelect, oeeThreshold, allDefectTypes, allDefectRecords }) => {
  const { t } = useTranslation();
  const [detailsPopover, setDetailsPopover] = useState<{
    defects: EnrichedDefectRecord[];
    top: number;
    left: number;
  } | null>(null);
  
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


  const handleDefectCellDoubleClick = (log: ProductionDaily, event: React.MouseEvent) => {
    const defectsForLog = allDefectRecords.filter(
      d => d.work_date === log.COMP_DAY && d.MACHINE_ID === log.MACHINE_ID && d.SHIFT === log.SHIFT
    );
  
    if (defectsForLog.length > 0) {
      setDetailsPopover({
        defects: defectsForLog,
        top: event.clientY,
        left: event.clientX,
      });
    }
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

  // Helper to generate a unique key for each log row
  const getLogKey = (log: { COMP_DAY: string; MACHINE_ID: string; SHIFT: 'A' | 'B' | 'C' }) => {
    return `log-row-${log.COMP_DAY}-${log.MACHINE_ID}-${log.SHIFT}`;
  };
  
  const handleScrollToLogEntry = (date: string, machineId: string, shift: 'A' | 'B' | 'C') => {
    const key = getLogKey({ COMP_DAY: date, MACHINE_ID: machineId, SHIFT: shift });
    const element = document.getElementById(key);

    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Apply a temporary highlight animation
        element.classList.add('animate-highlight');
        setTimeout(() => {
            // Check if element still exists before removing class
            if (document.getElementById(key)) {
                element.classList.remove('animate-highlight');
            }
        }, 1500); // Must match animation duration
    }
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

    const logsWithSelectedDefect = new Set(
      allDefectRecords
        .filter(d => d.defect_type_name === selectedDefectType)
        .map(d => `${d.work_date}|${d.MACHINE_ID}|${d.SHIFT}`)
    );

    return preliminaryFilteredData.filter(log => {
      const logKey = `${log.COMP_DAY}|${log.MACHINE_ID}|${log.SHIFT}`;
      return logsWithSelectedDefect.has(logKey);
    });

  }, [data, searchTerm, selectedShift, minDefects, maxDefects, minDowntime, maxDowntime, selectedDefectType, allDefectRecords]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
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
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('searchMachineLine')}</label>
            <input
              id="search-input"
              type="text"
              placeholder={t('filterById')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="shift-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shift')}</label>
            <select
              id="shift-select"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as 'all' | 'A' | 'B' | 'C')}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">{t('allShifts')}</option>
              <option value="A">{t('shiftA')}</option>
              <option value="B">{t('shiftB')}</option>
              <option value="C">{t('shiftC')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="defect-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('defectType')}</label>
            <select
              id="defect-type-select"
              value={selectedDefectType}
              onChange={(e) => setSelectedDefectType(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">{t('allDefectTypes')}</option>
              {allDefectTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('defectsRange')}</label>
             <div className="flex items-center gap-2">
                <FilterInput value={minDefects} onChange={(e) => setMinDefects(e.target.value)} placeholder={t('min')} label="Min Defects" />
                <span className="text-gray-500">-</span>
                <FilterInput value={maxDefects} onChange={(e) => setMaxDefects(e.target.value)} placeholder={t('max')} label="Max Defects" />
             </div>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('downtimeRange')}</label>
             <div className="flex items-center gap-2">
                <FilterInput value={minDowntime} onChange={(e) => setMinDowntime(e.target.value)} placeholder={t('min')} label="Min Downtime" />
                <span className="text-gray-500">-</span>
                <FilterInput value={maxDowntime} onChange={(e) => setMaxDowntime(e.target.value)} placeholder={t('max')} label="Max Downtime" />
             </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleClearFilters}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
                {t('clearAllFilters')}
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"><button onClick={() => requestSort('MACHINE_ID')} className={headerButtonClass}>{t('machineId')} {getSortIcon('MACHINE_ID')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('LINE_ID')} className={headerButtonClass}>{t('line')} {getSortIcon('LINE_ID')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('SHIFT')} className={headerButtonClass}>{t('shift')} {getSortIcon('SHIFT')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('ACT_PRO_QTY')} className={headerButtonClass}>{t('output')} {getSortIcon('ACT_PRO_QTY')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DEFECT_QTY')} className={headerButtonClass}>{t('defects')} {getSortIcon('DEFECT_QTY')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DOWNTIME_MIN')} className={headerButtonClass}>{t('downtimeMin')} {getSortIcon('DOWNTIME_MIN')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('availability')} className={headerButtonClass}>{t('availability')} {getSortIcon('availability')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('performance')} className={headerButtonClass}>{t('performance')} {getSortIcon('performance')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('quality')} className={headerButtonClass}>{t('quality')} {getSortIcon('quality')}</button></th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('OEE')} className={headerButtonClass}>{t('oee')} {getSortIcon('OEE')}</button></th>
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
              <tr 
                key={log.Prod_ID} 
                id={getLogKey(log)}
                className={`transition-colors duration-150 ${rowClass}`}
              >
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
                  onDoubleClick={(e) => handleDefectCellDoubleClick(log, e)}
                  title="Double-click for details"
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
            {t('noRecordsMatch')}
          </div>
        )}
      </div>

      {detailsPopover && (
          <DefectDetailsPopover
              defects={detailsPopover.defects}
              top={detailsPopover.top}
              left={detailsPopover.left}
              onClose={() => setDetailsPopover(null)}
              onNavigate={handleScrollToLogEntry}
              t={t}
          />
      )}
    </div>
  );
};

export default ProductionLogTable;