import React, { useState, useMemo } from 'react';

type Shift = 'all' | 'A' | 'B' | 'C';
type DateSelectionMode = 'single' | 'range' | 'last7' | 'last30';
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
  const [areaSearch, setAreaSearch] = useState('');

  const filteredAreas = useMemo(() => {
    const lowercasedSearch = areaSearch.toLowerCase();
    
    // Separate 'all' from other areas
    const otherAreas = availableAreas.filter(area => area !== 'all');

    // Filter the other areas
    let filtered = otherAreas.filter(area =>
        area.toLowerCase().includes(lowercasedSearch)
    );

    // Ensure the currently selected area is always visible if it's not 'all'
    if (selectedArea !== 'all' && !filtered.includes(selectedArea)) {
        const selectedAreaFromSource = availableAreas.find(a => a === selectedArea);
        if (selectedAreaFromSource) {
            filtered.push(selectedAreaFromSource);
        }
    }
    
    // Sort the filtered list
    filtered.sort();
    
    // Always prepend the 'all' option
    return ['all', ...filtered];
  }, [areaSearch, availableAreas, selectedArea]);

  const handleModeChange = (mode: DateSelectionMode) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    let newStartDate = startDate;
    let newEndDate = endDate;

    switch (mode) {
        case 'single':
            newStartDate = todayStr;
            newEndDate = todayStr;
            break;
        case 'last7': {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 6);
            newStartDate = sevenDaysAgo.toISOString().slice(0, 10);
            newEndDate = todayStr;
            break;
        }
        case 'last30': {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 29);
            newStartDate = thirtyDaysAgo.toISOString().slice(0, 10);
            newEndDate = todayStr;
            break;
        }
        case 'range':
            // Keep the current custom range, no date change needed
            break;
    }

    onFilterChange({
      startDate: newStartDate,
      endDate: newEndDate,
      area: selectedArea,
      shift: selectedShift,
      mode: mode,
      status: selectedStatus,
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, isStartDate: boolean) => {
    const newDate = e.target.value;
    if (isStartDate) {
      onFilterChange({ 
        startDate: newDate, 
        endDate: dateSelectionMode === 'single' ? newDate : (newDate > endDate ? newDate : endDate),
        area: selectedArea, 
        shift: selectedShift,
        mode: dateSelectionMode,
        status: selectedStatus,
      });
    } else {
       onFilterChange({ 
        startDate: startDate, 
        endDate: newDate,
        area: selectedArea, 
        shift: selectedShift,
        mode: dateSelectionMode,
        status: selectedStatus,
      });
    }
  };
    
  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ startDate, endDate, area: e.target.value, shift: selectedShift, mode: dateSelectionMode, status: selectedStatus });
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ startDate, endDate, area: selectedArea, shift: e.target.value as Shift, mode: dateSelectionMode, status: selectedStatus });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ startDate, endDate, area: selectedArea, shift: selectedShift, mode: dateSelectionMode, status: e.target.value as MachineStatus });
  };
  
  const areDatesDisabled = dateSelectionMode === 'last7' || dateSelectionMode === 'last30';
  const isShiftDisabled = dateSelectionMode !== 'single';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col gap-4">
      {/* Top row for primary filters */}
      <div className="flex flex-col md:flex-row flex-wrap items-center gap-4">
        {/* Date Mode Dropdown */}
        <div className="flex items-center gap-2">
            <label htmlFor="date-mode-select" className="font-medium text-gray-700 dark:text-gray-300">Date Filter:</label>
            <select
                id="date-mode-select"
                value={dateSelectionMode}
                onChange={(e) => handleModeChange(e.target.value as DateSelectionMode)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
            >
                <option value="single">Single Day</option>
                <option value="range">Custom Range</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
            </select>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          <label htmlFor="start-date-filter" className="font-medium text-gray-700 dark:text-gray-300">{dateSelectionMode !== 'single' ? 'Start:' : 'Date:'}</label>
          <input
            type="date"
            id="start-date-filter"
            value={startDate}
            onChange={(e) => handleDateChange(e, true)}
            disabled={areDatesDisabled}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
        {dateSelectionMode !== 'single' && (
          <div className="flex items-center gap-2 animate-fade-in-up">
            <label htmlFor="end-date-filter" className="font-medium text-gray-700 dark:text-gray-300">End:</label>
            <input
              type="date"
              id="end-date-filter"
              value={endDate}
              min={startDate}
              onChange={(e) => handleDateChange(e, false)}
              disabled={areDatesDisabled}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Area Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="area-filter" className="font-medium text-gray-700 dark:text-gray-300">Khu Vực:</label>
          <div className="flex flex-col gap-1">
              <input
                  type="text"
                  placeholder="Search area..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-controls="area-filter"
              />
              <select
                id="area-filter"
                value={selectedArea}
                onChange={handleAreaChange}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
              >
                {filteredAreas.map(area => (
                  <option key={area} value={area}>
                    {area === 'all' ? 'Tất cả Khu vực (All Areas)' : area}
                  </option>
                ))}
              </select>
          </div>
        </div>
        
        {/* Shift Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="shift-filter" className={`font-medium ${isShiftDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>Ca:</label>
          <select
            id="shift-filter"
            value={selectedShift}
            onChange={handleShiftChange}
            disabled={isShiftDisabled}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 disabled:bg-gray-200/50 dark:disabled:bg-gray-700/50 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="all">Cả Ngày</option>
            <option value="A">Ca A (06:00 - 14:00)</option>
            <option value="B">Ca B (14:00 - 22:00)</option>
            <option value="C">Ca C (22:00 - 06:00)</option>
          </select>
        </div>
        
        {/* Machine Status Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="font-medium text-gray-700 dark:text-gray-300">Status:</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={handleStatusChange}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      {/* Bottom row for secondary settings and actions */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
        <details className="flex-grow p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <summary className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            Target Thresholds
          </summary>
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <ThresholdInput label="OEE" id="oee-threshold" value={oeeThreshold} onChange={onOeeThresholdChange} />
            <ThresholdInput label="Availability" id="availability-threshold" value={availabilityThreshold} onChange={onAvailabilityThresholdChange} />
            <ThresholdInput label="Performance" id="performance-threshold" value={performanceThreshold} onChange={onPerformanceThresholdChange} />
            <ThresholdInput label="Quality" id="quality-threshold" value={qualityThreshold} onChange={onQualityThresholdChange} />
          </div>
        </details>
        
        <div className="self-end">
          <button
              onClick={onClearFilters}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
              title="Reset all filters and thresholds to default"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
              </svg>
              Clear Filters
          </button>
        </div>
      </div>

    </div>
  );
};

export default FilterBar;