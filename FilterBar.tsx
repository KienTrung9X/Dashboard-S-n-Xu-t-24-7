
import React, { useState, useMemo } from 'react';

type Shift = 'all' | 'A' | 'B' | 'C';
type DateSelectionMode = 'single' | 'range';
type MachineStatus = 'all' | 'active' | 'inactive';

interface FilterBarProps {
  startDate: string;
  endDate: string;
  selectedArea: string;
  selectedShift: Shift;
  dateSelectionMode: DateSelectionMode;
  selectedStatus: MachineStatus;
  availableAreas: string[];
  oeeThreshold: number;
  onFilterChange: (filters: { 
    startDate: string; 
    endDate: string; 
    area: string; 
    shift: Shift; 
    mode: DateSelectionMode;
    status: MachineStatus;
  }) => void;
  onClearFilters: () => void;
  onThresholdChange: (value: number) => void;
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
  onFilterChange,
  onClearFilters,
  onThresholdChange,
}) => {
  const [areaSearch, setAreaSearch] = useState('');

  const filteredAreas = useMemo(() => {
    const lowercasedSearch = areaSearch.toLowerCase();
    const filtered = availableAreas.filter(area => 
      area.toLowerCase().includes(lowercasedSearch)
    );
    
    // Ensure the currently selected area is always visible in the list
    if (selectedArea && !filtered.includes(selectedArea)) {
      return [selectedArea, ...filtered].sort();
    }
    
    return filtered.sort();
  }, [areaSearch, availableAreas, selectedArea]);

  const handleModeChange = (mode: DateSelectionMode) => {
    onFilterChange({
      startDate,
      endDate: mode === 'single' ? startDate : endDate,
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
  
  const ModeButton: React.FC<{ mode: DateSelectionMode, children: React.ReactNode }> = ({ mode, children }) => (
      <button
          role="radio"
          aria-checked={dateSelectionMode === mode}
          onClick={() => handleModeChange(mode)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-cyan-500 ${
              dateSelectionMode === mode ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
      >
          {children}
      </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row flex-wrap items-center gap-4">
      {/* Date Mode Toggle */}
       <div className="flex items-center gap-2">
        <label id="date-mode-label" className="font-medium text-gray-700 dark:text-gray-300">Date Mode:</label>
        <div
            role="radiogroup"
            aria-labelledby="date-mode-label"
            className="flex items-center bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg"
        >
            <ModeButton mode="single">Single Day</ModeButton>
            <ModeButton mode="range">Date Range</ModeButton>
        </div>
      </div>


      {/* Date Inputs */}
      <div className="flex items-center gap-2">
        <label htmlFor="start-date-filter" className="font-medium text-gray-700 dark:text-gray-300">{dateSelectionMode === 'range' ? 'Start:' : 'Date:'}</label>
        <input
          type="date"
          id="start-date-filter"
          value={startDate}
          onChange={(e) => handleDateChange(e, true)}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
        />
      </div>
      {dateSelectionMode === 'range' && (
        <div className="flex items-center gap-2 animate-fade-in-up">
          <label htmlFor="end-date-filter" className="font-medium text-gray-700 dark:text-gray-300">End:</label>
          <input
            type="date"
            id="end-date-filter"
            value={endDate}
            min={startDate}
            onChange={(e) => handleDateChange(e, false)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800"
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
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
        </div>
      </div>
      
      {/* Shift Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="shift-filter" className={`font-medium ${dateSelectionMode === 'range' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>Ca:</label>
        <select
          id="shift-filter"
          value={selectedShift}
          onChange={handleShiftChange}
          disabled={dateSelectionMode === 'range'}
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

      {/* OEE Threshold Input */}
      <div className="flex items-center gap-2 sm:ml-auto">
        <label htmlFor="oee-threshold" className="font-medium text-gray-700 dark:text-gray-300">OEE Threshold:</label>
        <div className="relative">
            <input
                type="number"
                id="oee-threshold"
                value={oeeThreshold}
                onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                    onThresholdChange(Math.max(0, Math.min(100, val)));
                }}
                className="w-24 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                min="0"
                max="100"
                title="Set OEE alert threshold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <div>
         <button
            onClick={onClearFilters}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
            title="Reset all filters to default"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
            </svg>
            Clear Filters
        </button>
      </div>

    </div>
  );
};

export default FilterBar;
