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
import DefectTrendChart from './DefectTrendChart';
import AiAnalysis from './AiAnalysis';


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

// New Goal KPI Card Component
interface GoalKpiCardProps {
  title: string;
  actual: number;
  goal: number;
  unit?: string;
}

const GoalKpiCard: React.FC<GoalKpiCardProps> = ({ title, actual, goal, unit = '' }) => {
  const progress = goal > 0 ? (actual / goal) * 100 : 0;
  const clampedProgress = Math.min(progress, 100);

  let progressBarColor = 'bg-green-500';
  if (progress < 95) progressBarColor = 'bg-yellow-500';
  if (progress < 75) progressBarColor = 'bg-red-500';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">
          {actual.toLocaleString()}
          <span className="text-xl text-gray-400 dark:text-gray-500"> / {goal > 0 ? goal.toLocaleString() : 'N/A'} {unit}</span>
        </p>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Progress</span>
          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">{goal > 0 ? `${progress.toFixed(1)}%` : 'N/A'}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${clampedProgress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Tab Icons
const OverviewIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>);
const PerformanceIcon = () => (<svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>);
const QualityIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 18.5a11.954 11.954 0 007.834-13.501l-4.95-2.025L10 5.446 6.95 2.975l-4.784 2.024zm11.388 1.442l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 6.44c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81z" clipRule="evenodd" /></svg>);
const DowntimeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" /></svg>);


type Tab = 'overview' | 'performance' | 'quality' | 'downtime';
type Shift = 'all' | 'A' | 'B' | 'C';
type DateSelectionMode = 'single' | 'range' | 'last7' | 'lastWeek' | 'last30';
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
  const [availabilityThreshold, setAvailabilityThreshold] = useState<number>(initialFilters?.availabilityThreshold ?? 90);
  const [performanceThreshold, setPerformanceThreshold] = useState<number>(initialFilters?.performanceThreshold ?? 95);
  const [qualityThreshold, setQualityThreshold] = useState<number>(initialFilters?.qualityThreshold ?? 99);
  
  // Alert state
  const [underperformingMachines, setUnderperformingMachines] = useState<string[]>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isAlertCritical, setIsAlertCritical] = useState(false);
  const lastUnderperformingOeeRef = useRef<number | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);
  
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

  // New tab navigation state and refs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({
      opacity: 0,
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  });
  
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Tổng Quan', icon: <OverviewIcon /> },
    { id: 'performance', label: 'Phân Tích Hiệu Suất', icon: <PerformanceIcon /> },
    { id: 'quality', label: 'Phân Tích Chất Lượng', icon: <QualityIcon /> },
    { id: 'downtime', label: 'Phân Tích Dừng Máy', icon: <DowntimeIcon /> }
  ], []);

  // Effect to update the sliding indicator for the new tabs
  useEffect(() => {
    if (data && tabsContainerRef.current) {
        const activeTabElement = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLButtonElement | null;
        if (activeTabElement) {
            const { offsetLeft, offsetWidth } = activeTabElement;
            setSliderStyle(prev => ({
                ...prev,
                left: `${offsetLeft}px`,
                width: `${offsetWidth}px`,
                opacity: 1
            }));
        }
    }
  }, [activeTab, data]); // Re-calculate when tab changes or data (which affects layout) loads

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
            ? 'Yêu cầu đã bị hủy.' 
            : (typeof e?.message === 'string' ? e.message : "Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
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
        availabilityThreshold,
        performanceThreshold,
        qualityThreshold,
      };
      localStorage.setItem('manufacturingDashboardFilters', JSON.stringify(filtersToSave));
    } catch (e) {
      console.error("Failed to save filters to localStorage", e);
    }
  }, [startDate, endDate, dateSelectionMode, selectedArea, selectedShift, selectedStatus, oeeThreshold, availabilityThreshold, performanceThreshold, qualityThreshold]);

  // Effect to calculate underperforming machines and trigger alerts
  useEffect(() => {
    if (data?.productionLog && data.productionLog.length > 0) {
      const underperformers = data.productionLog.filter(log => log.OEE < (oeeThreshold / 100));
      const lowOeeMachines = underperformers.map(log => log.MACHINE_ID);
      setUnderperformingMachines(lowOeeMachines);

      if (lowOeeMachines.length > 0) {
        const currentAvgOee = underperformers.reduce((sum, log) => sum + log.OEE, 0) / underperformers.length;

        // Make alert critical if performance has worsened
        if (lastUnderperformingOeeRef.current !== null && currentAvgOee < lastUnderperformingOeeRef.current) {
          setIsAlertCritical(true);
        } else {
          setIsAlertCritical(false);
        }
        lastUnderperformingOeeRef.current = currentAvgOee;
        setIsAlertVisible(true);
      } else {
        // No underperforming machines, reset alert state
        setIsAlertVisible(false);
        setIsAlertCritical(false);
        lastUnderperformingOeeRef.current = null;
      }
    } else {
      setUnderperformingMachines([]);
      setIsAlertVisible(false);
      setIsAlertCritical(false);
      lastUnderperformingOeeRef.current = null;
    }
  }, [data, oeeThreshold]);

  // Effect to auto-dismiss the alert
  useEffect(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    if (isAlertVisible) {
      alertTimeoutRef.current = window.setTimeout(() => {
        setIsAlertVisible(false);
      }, 15000); // 15-second auto-dismiss
    }
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [isAlertVisible]);


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
    setSelectedShift(filters.mode !== 'single' ? 'all' : filters.shift);
    setSelectedStatus(filters.status);
  };
  
  const handleManualRefresh = () => {
    if (isLoading) return;
    refreshData();
  };


  const handleClearFilters = () => {
    showNotification('Bộ lọc đã được đặt lại về mặc định.', 'info');
    setDateSelectionMode('single');
    setStartDate(initialFilterData.defaultDate);
    setEndDate(initialFilterData.defaultDate);
    setSelectedArea(initialFilterData.defaultArea);
    setSelectedShift('all');
    setSelectedStatus('all');
    setOeeThreshold(80);
    setAvailabilityThreshold(90);
    setPerformanceThreshold(95);
    setQualityThreshold(99);
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
    showNotification('Đã thêm thành công bản ghi lỗi mới.', 'success');
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
    // Find the latest record for the machine within the filtered data for context
    return data.productionLog
      .filter(p => p.MACHINE_ID === selectedMachineId)
      .sort((a,b) => new Date(b.COMP_DAY).getTime() - new Date(a.COMP_DAY).getTime())[0] || null;
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
    const warningTarget = target - 0.05; // 5 percentage points below target

    return data.performance.sevenDayTrend.map((point, index, arr) => {
        const oee = point.oee ?? 0;

        let oeeAbove: number | null = null;
        let oeeWarning: number | null = null;
        let oeeBelow: number | null = null;

        // Assign value to the correct segment
        if (oee >= target) {
            oeeAbove = oee;
        } else if (oee >= warningTarget) {
            oeeWarning = oee;
        } else {
            oeeBelow = oee;
        }

        // Handle connections for smooth line transitions
        if (index > 0) {
            const prevOee = arr[index - 1].oee ?? 0;
            const prevIsAbove = prevOee >= target;
            const prevIsWarning = prevOee < target && prevOee >= warningTarget;
            const prevIsBelow = prevOee < warningTarget;

            const isAbove = oee >= target;
            const isWarning = oee < target && oee >= warningTarget;
            const isBelow = oee < warningTarget;
            
            // If the state changes, connect the lines by giving the previous segment the current value
            if (prevIsAbove && (isWarning || isBelow)) oeeAbove = oee;
            if (prevIsWarning && (isAbove || isBelow)) oeeWarning = oee;
            if (prevIsBelow && (isAbove || isWarning)) oeeBelow = oee;
        }
        
        return { date: point.date, oeeAbove, oeeWarning, oeeBelow };
    });
  }, [data?.performance?.sevenDayTrend, oeeThreshold]);
  
  const availableMachinesForModal = useMemo(() => {
    if (!data) return [];
    return data.availableMachines.map(m => ({
      id: m,
      line: data.productionLog.find(p => p.MACHINE_ID === m)?.LINE_ID || 'N/A'
    }));
  }, [data]);

  const menuSections = [
    {
      title: 'Tác Vụ Dữ Liệu',
      items: [
        {
          label: 'Xem Bảng Dữ Liệu',
          onClick: () => setIsSchemaPanelOpen(true),
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM4 8h5v2H4V8z" clipRule="evenodd" /></svg>
        },
        {
          label: 'Data Entry (Nhập Lỗi)',
          onClick: () => setIsDataEntryModalOpen(true),
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
        },
      ]
    }
  ];
  
  const getOeeBarColor = (value: number) => {
    const threshold = oeeThreshold / 100;
    if (value < threshold) return '#ef4444'; // red-500
    if (value < 0.9) return '#facc15'; // yellow-400
    return '#22c55e'; // green-500
  };

  const notificationColors: Record<NotificationType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg ${className}`}>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-l-4 border-cyan-500 pl-3">{title}</h2>
          {children}
      </div>
  );

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 p-10 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tải Dữ Liệu Thất Bại</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">{loadError}</p>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.695a8.25 8.25 0 00-11.667 0l-3.181 3.183" />
              </svg>
              {isLoading ? 'Đang thử lại...' : 'Thử Lại'}
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
            <p className="dark:text-white text-gray-700 mt-4">Đang tải dữ liệu Dashboard...</p>
        </div>
      )
    }
    
    if (data.summary.totalProduction === 0 && data.productionLog.length === 0) {
      return (
         <div className="flex-grow flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 p-10 rounded-lg shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Không Tìm Thấy Dữ Liệu</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">Không có dữ liệu sản xuất nào được tìm thấy cho các bộ lọc đã chọn. Vui lòng thử điều chỉnh ngày hoặc khu vực.</p>
        </div>
      )
    }

    const DAILY_TARGET_PER_MACHINE = 28000; // An ambitious but reasonable daily target per machine.
    const uniqueMachinesInFilter = new Set(data.productionLog.map(p => p.MACHINE_ID));
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const productionGoal = Math.round(uniqueMachinesInFilter.size * numberOfDays * DAILY_TARGET_PER_MACHINE);

    return (
        <>
            <FilterBar 
              startDate={startDate}
              endDate={endDate}
              selectedArea={selectedArea}
              selectedShift={selectedShift}
              dateSelectionMode={dateSelectionMode}
              selectedStatus={selectedStatus}
              availableAreas={initialFilterData.availableAreas}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              oeeThreshold={oeeThreshold}
              availabilityThreshold={availabilityThreshold}
              performanceThreshold={performanceThreshold}
              qualityThreshold={qualityThreshold}
              onOeeThresholdChange={setOeeThreshold}
              onAvailabilityThresholdChange={setAvailabilityThreshold}
              onPerformanceThresholdChange={setPerformanceThreshold}
              onQualityThresholdChange={setQualityThreshold}
            />
             {isAlertVisible && (
                <div className={`relative p-4 rounded-lg border flex items-start gap-3 animate-fade-in-up ${isAlertCritical ? 'bg-orange-100/80 dark:bg-orange-900/50 border-orange-400/50 animate-pulse-bg text-orange-800 dark:text-orange-200' : 'bg-yellow-100/80 dark:bg-yellow-900/50 border-yellow-400/50 text-yellow-800 dark:text-yellow-200'}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   <div className="flex-grow">
                     <h4 className="font-bold">{isAlertCritical ? 'Cảnh Báo Quan Trọng' : 'Cảnh Báo Hiệu Suất'}</h4>
                     <p className="text-sm">Đã phát hiện {underperformingMachines.length} máy hoạt động dưới ngưỡng OEE {oeeThreshold}%. Các máy bị ảnh hưởng: {underperformingMachines.slice(0, 5).join(', ')}{underperformingMachines.length > 5 ? '...' : '.'}</p>
                   </div>
                   <button onClick={() => setIsAlertVisible(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
            )}
            
            <nav className="mt-4">
              <div ref={tabsContainerRef} className="relative flex p-1 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-x-auto">
                  <div
                      className="absolute top-1 bottom-1 bg-white dark:bg-gray-800 rounded-full shadow-md"
                      style={sliderStyle}
                  />
                  {tabs.map((tab) => (
                      <button
                          key={tab.id}
                          data-tab-id={tab.id}
                          onClick={() => setActiveTab(tab.id as Tab)}
                          className={`relative z-10 flex flex-shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                              activeTab === tab.id
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                          }`}
                          aria-selected={activeTab === tab.id}
                      >
                          {tab.icon}
                          <span>{tab.label}</span>
                      </button>
                  ))}
              </div>
            </nav>

            <div className="animate-fade-in-up mt-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            <KpiCard title="OEE" value={data.summary.avgOee} />
                            <KpiCard title="Machine Utilization" value={data.summary.machineUtilization} description="Percentage of total available time (24/7) that the machine was running." />
                            <GoalKpiCard title="Production Output Goal" actual={data.summary.totalProduction} goal={productionGoal} unit="pcs" />
                            <KpiCard title="Tổng sản lượng" value={data.summary.totalProduction} unit="pcs" precision={0} />
                            <KpiCard title="Tổng phế phẩm" value={data.summary.totalDefects} unit="pcs" precision={0} />
                            <KpiCard title="Tổng thời gian dừng máy" value={data.summary.totalDowntime} unit="min" precision={0} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <OeeGauge value={data.summary.avgOee} availability={data.summary.avgAvailability} performance={data.summary.avgPerformance} quality={data.summary.avgQuality} theme={theme} oeeThreshold={oeeThreshold}/>
                            </div>
                            <div className="lg:col-span-2">
                                <Card title="Sản lượng theo Chuyền">
                                    <SimpleBarChart data={data.summary.productionByLine} xAxisKey="name" barKey="value" fillColor="#38bdf8" theme={theme} />
                                </Card>
                            </div>
                        </div>
                        <AiAnalysis data={data} filters={{startDate, endDate, area: selectedArea, shift: selectedShift, mode: dateSelectionMode}}/>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        <Card title="Xu Hướng OEE 7 Ngày">
                            <TrendChart data={oeeTrendDataWithColor} 
                                lines={[
                                    { dataKey: 'oeeAbove', stroke: '#22c55e', name: 'Đạt mục tiêu' },
                                    { dataKey: 'oeeWarning', stroke: '#facc15', name: 'Cảnh báo' },
                                    { dataKey: 'oeeBelow', stroke: '#ef4444', name: 'Dưới ngưỡng' }
                                ]} 
                                isPercentage 
                                theme={theme}
                                targetLines={[
                                    { value: oeeThreshold / 100, label: `OEE ${oeeThreshold}%`, stroke: '#ef4444' },
                                    { value: availabilityThreshold / 100, label: `Avail. ${availabilityThreshold}%`, stroke: '#a855f7' },
                                    { value: performanceThreshold / 100, label: `Perf. ${performanceThreshold}%`, stroke: '#3b82f6' },
                                    { value: qualityThreshold / 100, label: `Qual. ${qualityThreshold}%`, stroke: '#14b8a6' },
                                ]}
                            />
                        </Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Phân Bố Sản Lượng theo Chuyền">
                                <BoxplotChart data={data.performance.productionBoxplot} theme={theme} />
                            </Card>
                            <Card title="Heatmap OEE theo Chuyền & Ca">
                                <HeatmapChart data={data.performance.oeeHeatmap} theme={theme} />
                            </Card>
                        </div>
                         <Card title="Nhật Ký Sản Xuất Chi Tiết">
                            <ProductionLogTable data={data.productionLog} onMachineSelect={handleMachineSelect} onUpdateDefect={handleDefectUpdate} oeeThreshold={oeeThreshold} uniqueDefectTypes={uniqueDefectTypes}/>
                        </Card>
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className="space-y-6">
                        <Card title="Phân Tích Pareto Lỗi">
                             <ParetoChart data={data.quality.defectPareto} barKey="value" lineKey="cumulative" barColor="#ef4444" lineColor="#f97316" theme={theme} />
                        </Card>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card title="Xu Hướng Tỷ Lệ Lỗi">
                                <TrendChart data={data.quality.defectRateTrend} lines={[{ dataKey: 'defectRate', stroke: '#eab308', name: 'Tỷ lệ lỗi'}]} isPercentage theme={theme} areaLines={['defectRate']}/>
                            </Card>
                             <Card title="Xu Hướng Tổng Lỗi">
                                <DefectTrendChart data={data.quality.defectTrend} theme={theme} />
                            </Card>
                        </div>
                        <Card title="Top 5 Chuyền có Tỷ Lệ Lỗi Cao Nhất">
                            <Top5Table 
                                headers={["Line ID", "Defect Rate", "Total Defects", "Total Production"]}
                                data={data.quality.top5DefectLines.map(d => ({
                                    col1: d.lineId,
                                    col2: `${(d.defectRate * 100).toFixed(2)}%`,
                                    col3: d.totalDefects.toLocaleString(),
                                    col4: d.totalProduction.toLocaleString(),
                                }))}
                            />
                        </Card>
                    </div>
                )}
                {activeTab === 'downtime' && (
                    <div className="space-y-6">
                        <Card title="Phân Tích Pareto Dừng Máy">
                            <ParetoChart data={data.downtime.downtimePareto} barKey="value" lineKey="cumulative" barColor="#f97316" lineColor="#38bdf8" theme={theme} />
                        </Card>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <Card title="Dừng Máy theo Chuyền & Nguyên Nhân">
                                <StackedBarChart data={data.downtime.downtimeByLine} keys={data.downtime.uniqueDowntimeReasons} theme={theme}/>
                            </Card>
                             <Card title="Top 5 Máy Dừng Nhiều Nhất">
                                <Top5Table 
                                    headers={["Machine ID", "Total Downtime (min)"]}
                                    data={data.downtime.top5DowntimeMachines.map(d => ({
                                        col1: d.machineId,
                                        col2: d.totalDowntime.toLocaleString(),
                                    }))}
                                />
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
  }
  
  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );


  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
            <HamburgerMenu sections={menuSections} />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manufacturing OEE Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full transition-colors ${isLoading ? 'cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              disabled={isLoading}
              aria-label="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.695a8.25 8.25 0 00-11.667 0l-3.181 3.183" />
              </svg>
            </button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle theme">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button onClick={() => setIsHelpModalOpen(true)} className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Open help guide">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 1.152-.468 2.213-1.228 3-1.049.998-2.617 1.631-4.114 2.197a1 1 0 01-1.226-1.396 11.954 11.954 0 001.56-2.919 1 1 0 00-1.226-1.396c-.344.195-.682.36-1.02.493a1 1 0 01-1.226-1.396A6.96 6.96 0 018.228 9z" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
            </button>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col gap-6">
        {renderContent()}
      </main>

       {/* Modals and Notifications */}
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
        availableMachines={availableMachinesForModal}
        currentDate={startDate}
        uniqueDefectTypes={uniqueDefectTypes}
      />
      <DatabaseSchemaPanel 
        isOpen={isSchemaPanelOpen}
        onClose={() => setIsSchemaPanelOpen(false)}
      />
      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

       {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={handlePasswordModalClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Yêu Cầu Xác Thực</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Vui lòng nhập mật khẩu quản trị viên để sửa đổi dữ liệu sản xuất.</p>
                <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
                    autoFocus
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={handlePasswordModalClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Hủy</button>
                    <button onClick={handlePasswordConfirm} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">Xác Nhận</button>
                </div>
            </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-5 right-5 ${notificationColors[notification.type]} text-white py-3 px-5 rounded-lg shadow-lg animate-fade-in-up z-50`}>
            {notification.message}
        </div>
      )}

    </div>
  );
};

export default App;