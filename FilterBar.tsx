import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from './i18n/LanguageContext';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

type Shift = 'all' | 'A' | 'B' | 'C';
type DateSelectionMode = 'single' | 'range' | 'last7' | 'lastWeek' | 'last30';
type MachineStatus = 'all' | 'active' | 'inactive';

const ThresholdInput: React.FC<{
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, id, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}:</label>
        <div className="relative">
            <input
                type="number"
                id={id}
                value={value}
                onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    onChange(Math.max(0, Math.min(100, val)));
                }}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
                max="100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
        </div>
    </div>
);

const FilterField: React.FC<{
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, children, className = '' }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    {children}
  </div>
);

interface FilterBarProps {
  startDate: string;
  endDate: string;
  selectedArea: string;
  selectedShift: Shift;
  dateSelectionMode: DateSelectionMode;
  selectedStatus: MachineStatus;
  availableAreas: string[];
  oeeThreshold: number;
  availabilityThreshold: number;
  performanceThreshold: number;
  qualityThreshold: number;
  onFilterChange: (filters: { 
    startDate: string; 
    endDate: string; 
    area: string; 
    shift: Shift; 
    mode: DateSelectionMode;
    status: MachineStatus;
  }) => void;
  onClearFilters: () => void;
  onOeeThresholdChange: (value: number) => void;
  onAvailabilityThresholdChange: (value: number) => void;
  onPerformanceThresholdChange: (value: number) => void;
  onQualityThresholdChange: (value: number) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  startDate,
  endDate,
  selectedArea,
  selectedShift,
  dateSelectionMode,
  selectedStatus,
  availableAreas,
  oeeThreshold,
  availabilityThreshold,
  performanceThreshold,
  qualityThreshold,
  onFilterChange,
  onClearFilters,
  onOeeThresholdChange,
  onAvailabilityThresholdChange,
  onPerformanceThresholdChange,
  onQualityThresholdChange,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isThresholdsExpanded, setIsThresholdsExpanded] = useState(false);
  const lastCustomRangeRef = useRef<{ start: string; end: string }>({ start: startDate, end: endDate });
  const lastSingleDateRef = useRef<string>(startDate);
  const formInputClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500";


  useEffect(() => {
    if (dateSelectionMode === 'range') {
      lastCustomRangeRef.current = { start: startDate, end: endDate };
    } else if (dateSelectionMode === 'single') {
      lastSingleDateRef.current = startDate;
    }
  }, [startDate, endDate, dateSelectionMode]);
  
  const handleModeChange = (newMode: DateSelectionMode) => {
    const today = new Date('2025-10-26'); // Mock date for consistency
    let newStartDate = startDate;
    let newEndDate = endDate;

    switch (newMode) {
        case 'single':
            newStartDate = lastSingleDateRef.current;
            newEndDate = lastSingleDateRef.current;
            break;
        case 'range':
            newStartDate = lastCustomRangeRef.current.start;
            newEndDate = lastCustomRangeRef.current.end;
            break;
        case 'last7':
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 6);
            newStartDate = sevenDaysAgo.toISOString().slice(0, 10);
            newEndDate = today.toISOString().slice(0, 10);
            break;
        case 'last30':
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 29);
            newStartDate = thirtyDaysAgo.toISOString().slice(0, 10);
            newEndDate = today.toISOString().slice(0, 10);
            break;
    }
    
    onFilterChange({
        startDate: newStartDate,
        endDate: newEndDate,
        area: selectedArea,
        shift: selectedShift,
        mode: newMode,
        status: selectedStatus,
    });
  };

  const handleFilterPropChange = (prop: string, value: string) => {
      onFilterChange({
          startDate,
          endDate,
          area: selectedArea,
          shift: selectedShift,
          mode: dateSelectionMode,
          status: selectedStatus,
          [prop]: value
      });
  };

  const handleDateChange = (dateType: 'startDate' | 'endDate', value: string) => {
      if (dateSelectionMode === 'single') {
          onFilterChange({ ...getFilters(), startDate: value, endDate: value });
      } else {
          onFilterChange({ ...getFilters(), [dateType]: value });
      }
  };

  const getFilters = () => ({ startDate, endDate, area: selectedArea, shift: selectedShift, mode: dateSelectionMode, status: selectedStatus });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 animate-fade-in-up">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-cyan-500" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('filtersTitle')}</h2>
        </div>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <FilterField label="Date Mode" htmlFor="date-mode-select">
              <select id="date-mode-select" value={dateSelectionMode} onChange={(e) => handleModeChange(e.target.value as DateSelectionMode)} className={formInputClass}>
                <option value="single">Single Day</option>
                <option value="range">Date Range</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
              </select>
            </FilterField>
            
            <FilterField label={dateSelectionMode === 'range' ? "Start Date" : "Date"} htmlFor="start-date-input">
                <input type="date" id="start-date-input" value={startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} className={formInputClass} />
            </FilterField>
            
            {dateSelectionMode === 'range' && (
                <FilterField label="End Date" htmlFor="end-date-input">
                    <input type="date" id="end-date-input" value={endDate} onChange={(e) => handleDateChange('endDate', e.target.value)} className={formInputClass} />
                </FilterField>
            )}

            <FilterField label="Area" htmlFor="area-select" className={dateSelectionMode !== 'range' ? 'lg:col-start-3' : ''}>
              <select id="area-select" value={selectedArea} onChange={(e) => handleFilterPropChange('area', e.target.value)} className={formInputClass}>
                <option value="all">All Areas</option>
                {availableAreas.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </FilterField>

            <FilterField label="Shift" htmlFor="shift-select">
              <select id="shift-select" value={selectedShift} onChange={(e) => handleFilterPropChange('shift', e.target.value)} className={formInputClass}>
                <option value="all">All Shifts</option>
                <option value="A">Shift A</option>
                <option value="B">Shift B</option>
                <option value="C">Shift C</option>
              </select>
            </FilterField>

            <FilterField label={t('machineStatus')} htmlFor="status-select">
              <select id="status-select" value={selectedStatus} onChange={(e) => handleFilterPropChange('status', e.target.value as MachineStatus)} className={formInputClass}>
                <option value="all">{t('allStatuses')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </FilterField>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setIsThresholdsExpanded(!isThresholdsExpanded)}
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              {isThresholdsExpanded ? 'Hide' : 'Show'} KPI Thresholds {isThresholdsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
             <button onClick={onClearFilters} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline">Clear Filters</button>
          </div>
          {isThresholdsExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                  <ThresholdInput label="OEE" id="oee-threshold" value={oeeThreshold} onChange={onOeeThresholdChange} />
                  <ThresholdInput label="Availability" id="availability-threshold" value={availabilityThreshold} onChange={onAvailabilityThresholdChange} />
                  <ThresholdInput label="Performance" id="performance-threshold" value={performanceThreshold} onChange={onPerformanceThresholdChange} />
                  <ThresholdInput label="Quality" id="quality-threshold" value={qualityThreshold} onChange={onQualityThresholdChange} />
              </div>
          )}
        </div>
      )}
    </div>
  );
};

// FIX: Add default export for FilterBar component to make it available for import.
export default FilterBar;