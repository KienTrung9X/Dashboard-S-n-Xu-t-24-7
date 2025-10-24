import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDashboardData, getInitialFilterData, getMachineInfo, addDefectData, updateDefectQuantity, getDefectAdjustmentHistory, defectRecords, downtimeRecords as allDowntimeRecords } from '../services/dataService';
import { DashboardData, DefectAdjustmentLog, NewProductionData } from '../types';
import FilterBar from '../FilterBar';
import KpiCard from './KpiCard';
import OeeGauge from './OeeGauge';
import ProductionLogTable from './ProductionLogTable';
import MachineDetailsModal from './MachineDetailsModal';
import SimpleBarChart from '../services/SimpleBarChart';
import TrendChart from '../TrendChart';
import ParetoChart from './ParetoChart';
import Top5Table from './Top5Table';
import StackedBarChart from './StackedBarChart';
import SimplePieChart from './SimplePieChart';
import BoxplotChart from './BoxplotChart';
import HeatmapChart from '../HeatmapChart';
import DataEntryModal from './DataEntryModal';
import DatabaseSchemaPanel from './DatabaseSchemaPanel';
import HamburgerMenu from './HamburgerMenu';
import HelpModal from './HelpModal';


const initialFilterData = getInitialFilterData();

// Helper to load filters from localStorage
const getInitialFilters = () => {
    try {
        const saved = localStorage.getItem('manufacturingDashboardFilters');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to parse filters from localStorage", e);
    }
    return null;
};


type Tab = 'overview' | 'performance' | 'quality' | 'downtime';
type Shift = 'all' | 'A' | 'B' | 'C';
type DateSelectionMode = 'single' | 'range';
type NotificationType = 'success' | 'error' | 'info';
type Theme = 'light' | 'dark';
type MachineStatus = 'all' | 'active' | 'inactive';

const App: React.FC = () => {
  const initialFilters = useMemo(() => getInitialFilters(), []);

  const [startDate, setStartDate] = useState<string>(initialFilters?.startDate || initialFilterData.defaultDate);
  const [endDate, setEndDate] = useState<string>(initialFilters?.endDate || initialFilterData.defaultDate);
  const [dateSelectionMode, setDateSelectionMode] = useState<DateSelectionMode>(initialFilters?.dateSelectionMode || 'single');
  const [selectedArea, setSelectedArea] = useState<string>(initialFilters?.selectedArea || initialFilterData.defaultArea);
  const [selectedShift, setSelectedShift] = useState<Shift>(initialFilters?.selectedShift || 'all');
  const [selectedStatus, setSelectedStatus] = useState<MachineStatus>(initialFilters?.selectedStatus || 'all');
  const [data, setData] = useState<DashboardData | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [oeeThreshold, setOeeThreshold] = useState<number>(initialFilters?.oeeThreshold ?? 80);
  const [underperformingMachines, setUnderperformingMachines] = useState<string[]>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as Theme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isDataEntryModalOpen, setIsDataEntryModalOpen] = useState(false);
  const [isSchemaPanelOpen, setIsSchemaPanelOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const [pendingUpdate, setPendingUpdate] = useState<{ prodId: number; newQty: number } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const uniqueDefectTypes = useMemo(() => {
    return [...new Set(defectRecords.map(d => d.DEFECT_TYPE))].sort();
  }, []);
  
  const showNotification = (message: string, type: NotificationType, duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification(null);
    }, duration);
  };

  const refreshData = async () => {
    if (abortRef.current) {
        abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(null);
    try {
        const dashboardData = await getDashboardData(
            startDate,
            endDate,
            selectedArea,
            selectedShift,
            selectedStatus,
            { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setData(dashboardData);
    } catch (e: any) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch dashboard data:", e);
        const message = e?.name === 'AbortError' 
            ? 'Request was cancelled.' 
            : (typeof e?.message === 'string' ? e.message : "An unknown error occurred. Please try again.");
        setLoadError(message);
        setData(null);
    } finally {
        if (!controller.signal.aborted) {
            setIsLoading(false);
        }
    }
  };

  useEffect(() => {
    refreshData();
    return () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
    };
  }, [startDate, endDate, selectedArea, selectedShift, dateSelectionMode, selectedStatus]);

  // Effect to persist filters to localStorage
  useEffect(() => {
    try {
      const filtersToSave = {
        startDate,
        endDate,
        dateSelectionMode,
        selectedArea,
        selectedShift,
        selectedStatus,
        oeeThreshold,
      };
      localStorage.setItem('manufacturingDashboardFilters', JSON.stringify(filtersToSave));
    } catch (e) {
      console.error("Failed to save filters to localStorage", e);
    }
  }, [startDate, endDate, dateSelectionMode, selectedArea, selectedShift, selectedStatus, oeeThreshold]);

  // Effect to calculate underperforming machines
  useEffect(() => {
    if (data?.productionLog) {
      const lowOeeMachines = data.productionLog
        .filter(log => log.OEE < (oeeThreshold / 100))
        .map(log => log.MACHINE_ID);
      setUnderperformingMachines(lowOeeMachines);
      // Automatically show the alert if there are underperforming machines
      if(lowOeeMachines.length > 0) {
        setIsAlertVisible(true);
      }
    } else {
      setUnderperformingMachines([]);
    }
  }, [data, oeeThreshold]);

  const handleFilterChange = (filters: { 
    startDate: string, 
    endDate: string, 
    area: string, 
    shift: Shift, 
    mode: DateSelectionMode,
    status: MachineStatus,
  }) => {
    setDateSelectionMode(filters.mode);
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setSelectedArea(filters.area);
    setSelectedShift(filters.mode === 'range' ? 'all' : filters.shift);
    setSelectedStatus(filters.status);
  };

  const handleClearFilters = () => {
    showNotification('Filters have been reset to default.', 'info');
    setDateSelectionMode('single');
    setStartDate(initialFilterData.defaultDate);
    setEndDate(initialFilterData.defaultDate);
    setSelectedArea(initialFilterData.defaultArea);
    setSelectedShift('all');
    setSelectedStatus('all');
    setOeeThreshold(80); // Also reset threshold
  };
  
  const handleMachineSelect = (machineId: string) => {
    setSelectedMachineId(machineId);
    setIsMachineModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsMachineModalOpen(false);
    setSelectedMachineId(null);
  };

  const handleDataSubmit = (newData: NewProductionData) => {
    addDefectData(newData);
    setIsDataEntryModalOpen(false);
    refreshData();
  };

  const handleDefectUpdate = (prodId: number, newQty: number) => {
    setPendingUpdate({ prodId, newQty });
    showNotification('Mục đích xác thực: Cần có mật khẩu để thay đổi dữ liệu.', 'info', 4000);
    setTimeout(() => {
        setShowPasswordModal(true);
    }, 1000);
  };
  
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPasswordError('');
    setPendingUpdate(null);
  };

  const handlePasswordConfirm = () => {
    if (passwordInput !== 'ADMIN247') {
        setPasswordError('Mật khẩu không chính xác. Vui lòng thử lại.');
        return;
    }
    
    if (pendingUpdate) {
        const result = updateDefectQuantity(pendingUpdate.prodId, pendingUpdate.newQty);
        if (result.success) {
            showNotification(result.message, 'success');
            refreshData();
        } else {
            showNotification(result.message, 'error');
        }
    }
    handlePasswordModalClose();
  };

  const modalMachineInfo = useMemo(() => {
    if (!selectedMachineId) return null;
    return getMachineInfo(selectedMachineId);
  }, [selectedMachineId]);

  const modalProductionRecord = useMemo(() => {
    if (!selectedMachineId || !data) return null;
    return data.productionLog.find(p => p.MACHINE_ID === selectedMachineId) || null;
  }, [selectedMachineId, data]);

  const modalAdjustmentHistory = useMemo(() => {
    if (!selectedMachineId) return [];
    return getDefectAdjustmentHistory(selectedMachineId);
  }, [selectedMachineId, data]);
  
  const modalDowntimeRecords = useMemo(() => {
    if (!selectedMachineId) return [];
    // Note: This filters all downtime records, not just the ones for the current date filter.
    // This is intentional to show all history for the selected machine in the modal.
    return allDowntimeRecords.filter(d => d.MACHINE_ID === selectedMachineId);
  }, [selectedMachineId]);


  const oeeTrendDataWithColor = useMemo(() => {
    if (!data?.performance?.sevenDayTrend) return [];
    
    const target = oeeThreshold / 100;
    return data.performance.sevenDayTrend.map((point, index, arr) => {
        const oee = point.oee ?? 0;
        let oeeAbove: number | null = (oee >= target) ? oee : null;
        let oeeBelow: number | null = (oee < target) ? oee : null;

        if (index > 0) {
            const prevOee = arr[index - 1].oee ?? 0;
            if (prevOee >= target && oee < target) { oeeAbove = oee; }
            if (prevOee < target && oee >= target) { oeeBelow = oee; }
        }
        
        return { date: point.date, oeeAbove, oeeBelow };
    });
  }, [data?.performance?.sevenDayTrend, oeeThreshold]);

  const menuSections = [
    {
      title: 'Data tables',
      items: [
        {
          label: 'View Database Tables',
          onClick: () => setIsSchemaPanelOpen(true),
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM4 8h5v2H4V8z" clipRule="evenodd" /></svg>
        },
      ]
    },
    {
      title: 'Related app settings',
      items: [
        {
          label: 'Data Entry (Nhập Lỗi)',
          onClick: () => setIsDataEntryModalOpen(true),
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
        }
      ]
    }
  ];
  
  const getOeeBarColor = (value: number) => {
    const threshold = oeeThreshold / 100;
    if (value < threshold) return '#ef4444'; // red-500
    if (value < 0.9) return '#facc15'; // yellow-400
    return '#22c55e'; // green-500
  };

  const TabButton: React.FC<{tabId: Tab, children: React.ReactNode}> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === tabId ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}
    >
      {children}
    </button>
  );

  const notificationColors: Record<NotificationType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 p-10 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Load Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">{loadError}</p>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.695a8.25 8.25 0 00-11.667 0l-3.181 3.183" />
              </svg>
              {isLoading ? 'Retrying...' : 'Try Again'}
            </button>
        </div>
      )
    }

    if (isLoading || !data) {
      return (
         <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
            <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="dark:text-white text-gray-700 mt-4">Loading Dashboard Data...</p>
        </div>
      )
    }
    
    if (data.summary.totalProduction === 0 && data.productionLog.length === 0) {
      return (
         <div className="flex-grow flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 p-10 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082m.75.082a24.301 24.301 0 004.5 0m4.5 0a24.301 24.301 0 00-4.5 0m-9 0a24.301 24.301 0 00-4.5 0m0 0a24.301 24.301 0 004.5 0m.75.082v5.714a2.25 2.25 0 00.659 1.591L19.5 14.5m-9.75 3.104c.251.023.501.05.75.082m.75.082a24.301 24.301 0 004.5 0m4.5 0a24.301 24.301 0 00-4.5 0m-9 0a24.301 24.301 0 00-4.5 0m0 0a24.301 24.301 0 004.5 0" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">No Production Data Available</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">There is no production data for the selected filters. Please adjust the date range, area, or shift.</p>
        </div>
      );
    }
    
    return (
      <main className="space-y-12 mt-6">
        {activeTab === 'overview' && (
            <>
              <section>
                  <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">
                    {dateSelectionMode === 'range' ? `Hiệu Suất Tổng Quan (${startDate} to ${endDate})` : 'Hiệu Suất Tổng Quan Trong Ngày'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
                      <KpiCard title="Tổng Sản Lượng" value={data.summary.totalProduction} unit="pcs" precision={0}/>
                      <KpiCard title="Tổng Phế Phẩm" value={data.summary.totalDefects} unit="pcs" precision={0}/>
                      <KpiCard title="Tổng Dừng Máy" value={data.summary.totalDowntime} unit="phút" precision={0} />
                      <KpiCard title="Availability" value={data.summary.avgAvailability} />
                      <KpiCard title="Performance" value={data.summary.avgPerformance} />
                      <KpiCard title="Quality" value={data.summary.avgQuality} />
                      <KpiCard title="Utilization" value={data.summary.machineUtilization} />
                      <div className="lg:col-span-2 xl:col-span-2">
                          <OeeGauge
                            value={data.summary.avgOee}
                            availability={data.summary.avgAvailability}
                            performance={data.summary.avgPerformance}
                            quality={data.summary.avgQuality}
                            theme={theme}
                            oeeThreshold={oeeThreshold}
                          />
                      </div>
                  </div>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Sản Lượng Theo Line</h3>
                      <SimpleBarChart data={data.summary.productionByLine} xAxisKey="name" barKey="value" fillColor="#38bdf8" theme={theme} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">OEE Theo Line</h3>
                      <SimpleBarChart data={data.summary.oeeByLine} xAxisKey="name" barKey="value" fillColor={getOeeBarColor} isPercentage={true} theme={theme} />
                  </div>
              </section>
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 border-l-4 border-cyan-400 pl-3">
                    {dateSelectionMode === 'range' ? `Nhật Ký Sản Xuất (Kết thúc vào ${endDate})` : 'Nhật Ký Sản Xuất Hàng Ngày'}
                </h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                  <ProductionLogTable data={data.productionLog} onMachineSelect={handleMachineSelect} onUpdateDefect={handleDefectUpdate} oeeThreshold={oeeThreshold} />
                </div>
              </section>
            </>
        )}

        {activeTab === 'performance' && (
          <>
            <section>
                <h2 className="text-2xl font-semibold text-orange-400 mb-4 border-l-4 border-orange-400 pl-3">Phân Tích Xu Hướng</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Xu Hướng KPI Tổng Thể</h3>
                        <TrendChart 
                            data={data.performance.sevenDayTrend}
                            lines={[
                                { dataKey: 'oee', stroke: '#34d399', name: 'OEE' },
                                { dataKey: 'availability', stroke: '#38bdf8', name: 'Availability' },
                                { dataKey: 'performance', stroke: '#f472b6', name: 'Performance' },
                                { dataKey: 'quality', stroke: '#a78bfa', name: 'Quality' },
                            ]}
                            isPercentage={true}
                            theme={theme}
                            targetLines={[
                                { value: 0.9, label: '90% A', stroke: '#0284c7' },
                                { value: 0.9, label: '90% P', stroke: '#db2777' },
                                { value: 0.9, label: '90% Q', stroke: '#7c3aed' },
                            ]}
                        />
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Xu Hướng OEE (7 Ngày Gần Nhất)</h3>
                        <TrendChart 
                            data={oeeTrendDataWithColor}
                            lines={[
                                { dataKey: 'oeeAbove', stroke: '#22c55e', name: `OEE (>= ${oeeThreshold}%)` },
                                { dataKey: 'oeeBelow', stroke: '#ef4444', name: `OEE (< ${oeeThreshold}%)` },
                            ]}
                            isPercentage={true}
                            targetLines={[{ value: oeeThreshold / 100, label: `Mục tiêu ${oeeThreshold}%`, stroke: '#facc15' }]}
                            areaLines={['oeeBelow']}
                            theme={theme}
                        />
                    </div>
                </div>
            </section>
            <section>
                <h2 className="text-2xl font-semibold text-purple-400 mb-4 border-l-4 border-purple-400 pl-3">Phân Tích Phân Bố Sản Lượng</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Phân Bố Sản Lượng Theo Line</h3>
                    <BoxplotChart data={data.performance.productionBoxplot} theme={theme} />
                </div>
            </section>
            <section>
                 <h2 className="text-2xl font-semibold text-indigo-400 mb-4 border-l-4 border-indigo-400 pl-3">Phân Tích OEE Theo Ca và Line</h2>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Heatmap OEE Theo Line và Ca</h3>
                    <HeatmapChart data={data.performance.oeeHeatmap} theme={theme} />
                </div>
            </section>
          </>
        )}
        {activeTab === 'quality' && (
          <section>
            <h2 className="text-2xl font-semibold text-red-400 mb-4 border-l-4 border-red-400 pl-3">Phân Tích Chuyên Sâu Chất Lượng</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Pareto Phế Phẩm Theo Loại Lỗi</h3>
                    <ParetoChart data={data.quality.defectPareto} barKey="value" lineKey="cumulative" barColor="#ef4444" lineColor="#f97316" theme={theme} />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top 5 Lines Có Tỷ Lệ Lỗi Cao Nhất</h3>
                    <div className="flex-grow">
                      <Top5Table 
                          headers={['Line ID', 'Tỷ Lệ Lỗi', 'Tổng Lỗi', 'Tổng Sản Lượng']}
                          data={data.quality.top5DefectLines.map(item => ({
                              col1: item.lineId,
                              col2: `${(item.defectRate * 100).toFixed(2)}%`,
                              col3: item.totalDefects.toLocaleString(),
                              col4: item.totalProduction.toLocaleString(),
                          }))}
                      />
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Xu Hướng Tỷ Lệ Lỗi</h3>
                      <TrendChart 
                          data={data.quality.defectRateTrend}
                          lines={[{ dataKey: 'defectRate', stroke: '#ef4444', name: 'Tỷ Lệ Lỗi' }]}
                          isPercentage={true}
                          theme={theme}
                      />
                  </div>
            </div>
          </section>
        )}
        {activeTab === 'downtime' && (
           <section>
              <h2 className="text-2xl font-semibold text-yellow-400 mb-4 border-l-4 border-yellow-400 pl-3">Phân Tích Chuyên Sâu Dừng Máy</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Pareto Dừng Máy Theo Lý Do</h3>
                      <ParetoChart data={data.downtime.downtimePareto} barKey="value" lineKey="cumulative" barColor="#f59e0b" lineColor="#38bdf8" theme={theme} />
                  </div>
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top 5 Máy Có Thời Gian Dừng Cao Nhất</h3>
                      <div className="flex-grow">
                        <Top5Table
                            headers={['Machine ID', 'Tổng Thời Gian Dừng (phút)']}
                            data={data.downtime.top5DowntimeMachines.map(item => ({
                                col1: item.machineId,
                                col2: item.totalDowntime.toLocaleString(),
                            }))}
                        />
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Xu Hướng Thời Gian Dừng Máy</h3>
                      <TrendChart
                          data={data.downtime.downtimeTrend}
                          lines={[{ dataKey: 'downtime', stroke: '#f59e0b', name: 'Thời gian dừng (phút)' }]}
                          theme={theme}
                      />
                  </div>
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg lg:col-span-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Phân Bố Thời Gian Dừng Theo Line</h3>
                      <StackedBarChart data={data.downtime.downtimeByLine} keys={data.downtime.uniqueDowntimeReasons} theme={theme} />
                  </div>
              </div>
          </section>
        )}
      </main>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="mb-8 flex flex-wrap items-center gap-6">
        <HamburgerMenu sections={menuSections} />
        <div className="flex-grow">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard Sản Xuất 24/7</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Phân tích hiệu suất, chất lượng và thời gian dừng máy.</p>
        </div>
        <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
            aria-label="Open user guide"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
        </button>
      </header>

      <FilterBar
        startDate={startDate}
        endDate={endDate}
        selectedArea={selectedArea}
        selectedShift={selectedShift}
        dateSelectionMode={dateSelectionMode}
        selectedStatus={selectedStatus}
        availableAreas={initialFilterData.availableAreas}
        oeeThreshold={oeeThreshold}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onThresholdChange={setOeeThreshold}
      />

      <nav className="my-6 flex items-center gap-2 border-b border-gray-300 dark:border-gray-700 pb-2">
        <TabButton tabId="overview">Tổng Quan</TabButton>
        <TabButton tabId="performance">Phân Tích Hiệu Suất</TabButton>
        <TabButton tabId="quality">Phân Tích Chất Lượng</TabButton>
        <TabButton tabId="downtime">Phân Tích Dừng Máy</TabButton>
      </nav>
      
      {underperformingMachines.length > 0 && isAlertVisible && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-400 dark:text-yellow-200 rounded-r-lg flex justify-between items-center shadow-md animate-fade-in-up">
            <div>
                <p className="font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  OEE Alert
                </p>
                <p className="mt-1">The following machines are below the {oeeThreshold}% threshold: <span className="font-semibold">{underperformingMachines.join(', ')}</span></p>
            </div>
            <button onClick={() => setIsAlertVisible(false)} className="p-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors" aria-label="Dismiss alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      )}

      {renderContent()}

      <MachineDetailsModal
        isOpen={isMachineModalOpen}
        onClose={handleCloseModal}
        machineInfo={modalMachineInfo}
        productionRecord={modalProductionRecord}
        downtimeRecords={modalDowntimeRecords}
        adjustmentHistory={modalAdjustmentHistory}
        theme={theme}
      />
      <DataEntryModal
        isOpen={isDataEntryModalOpen}
        onClose={() => setIsDataEntryModalOpen(false)}
        onSubmit={handleDataSubmit}
        availableMachines={data?.availableMachines.map(m => ({ id: m, line: data.productionLog.find(p => p.MACHINE_ID === m)?.LINE_ID || 'N/A' })) || []}
        currentDate={startDate}
        uniqueDefectTypes={uniqueDefectTypes}
      />
      <DatabaseSchemaPanel isOpen={isSchemaPanelOpen} onClose={() => setIsSchemaPanelOpen(false)} />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      {notification && (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up ${notificationColors[notification.type]}`}>
            {notification.message}
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm text-gray-900 dark:text-white animate-fade-in-up">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">Yêu cầu xác thực</h2>
            </header>
            <main className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">Vui lòng nhập mật khẩu quản trị viên để sửa đổi dữ liệu này.</p>
              <div>
                <label htmlFor="admin-password" className="sr-only">Password</label>
                <input
                  type="password"
                  id="admin-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
                  className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-900 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  autoFocus
                />
              </div>
              {passwordError && <p className="text-red-500 dark:text-red-400 text-sm">{passwordError}</p>}
            </main>
            <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <button type="button" onClick={handlePasswordModalClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                Hủy
              </button>
              <button type="button" onClick={handlePasswordConfirm} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                Xác nhận
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;