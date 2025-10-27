import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Data and Types
import { 
    getDashboardData, 
    getInitialFilterData, 
    getMachineInfo,
    addErrorReport,
    updateErrorReport,
    addMaintenanceOrder,
    addMachine,
    updateMachine,
    addConsumableRequest,
    addMcPartRequest,
    addSparePart,
    updateSparePart,
    toggleFlagForOrder,
    getEnrichedSparePartDetails,
    addDefectRecord,
} from '../services/dataService';
import { DashboardData, EnrichedErrorReport, NewErrorReportData, UpdateErrorData, ErrorReportStatus, NewMaintenanceOrderData, EnrichedDefectRecord, MachineInfo, NewMachineData, SparePart, EnrichedMaintenanceOrder, McPartPurchaseRequest, ConsumablePurchaseRequest, PurchaseStatus, NewConsumableRequestData, NewMcPartRequestData, NewSparePartData, EnrichedMaintenanceSchedule, McPartOrder, EnrichedSparePart, NewDefectData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

// UI Components
import FilterBar from '../FilterBar';
import KpiCard from './KpiCard';
import OeeGauge from './OeeGauge';
import ProductionLogTable from './ProductionLogTable';
import MachineDetailsModal from './MachineDetailsModal';
import ParetoChart from './ParetoChart';
import SimpleBarChart from '../services/SimpleBarChart';
import TrendChart from '../TrendChart';
import BoxplotChart from './BoxplotChart';
import HeatmapChart from './HeatmapChart';
import Top5Table from './Top5Table';
import StackedBarChart from './StackedBarChart';
import DefectTrendChart from './DefectTrendChart';
import ShopFloorLayout from './ShopFloorLayout';
import HamburgerMenu from './HamburgerMenu';
import HelpModal from './HelpModal';
import DatabaseSchemaPanel from './DatabaseSchemaPanel';
import AiAnalysis from './AiAnalysis';
import ErrorLogTable from './ErrorLogTable';
import ErrorReportModal from './ErrorReportModal';
import MaintenanceDashboard from './MaintenanceDashboard';
import SparePartsInventory from '../SparePartsInventory';
import MaintenanceOrderModal from './MaintenanceOrderModal';
import MachineEditModal from './MachineEditModal';
import SparePartDetailsModal from './SparePartDetailsModal';
import DowntimeParetoChart from './DowntimeParetoChart';
import ConsumableRequestModal from './ConsumableRequestModal';
import McPartRequestModal from './McPartRequestModal';
import SparePartEditModal from './SparePartEditModal';
import NewMcPartRequestModal from './NewMcPartRequestModal';
import MaintenanceScheduleView from './MaintenanceSchedule';
import DeploymentChecklistModal from './DeploymentChecklistModal';
import DefectsPieChart from './DefectsPieChart';
import DataEntryModal from './DataEntryModal';
import DefectLogTable from './DefectLogTable';
import DefectDetailsModal from './DefectDetailsModal';


// Icons
// FIX: Import 'Plus' icon from 'lucide-react' to resolve 'Cannot find name' error.
import { LayoutDashboard, BarChart3, ShieldAlert, AlertTriangle, ListChecks, Database, HelpCircle, PlusCircle, Grid, Wrench, PackageSearch, ShoppingCart, Sun, Moon, Languages, Loader2, CalendarClock, Truck, CheckCircle, ClipboardList, Package, ListOrdered, Plus } from 'lucide-react';

type Tab = 'shopFloor' | 'overview' | 'performance' | 'quality' | 'downtime' | 'errorLog' | 'maintenance' | 'purchasing' | 'benchmarking';
type MaintenanceSubTab = 'dashboard' | 'mcPartInventory' | 'purchaseOrders' | 'pmSchedule';
type PurchasingSubTab = 'mcPart' | 'consumable';

// --- START OF IN-FILE PURCHASING COMPONENTS ---

interface McPartPurchaseOrdersProps {
    orders: McPartOrder[];
    t: (key: any) => string;
}

const McPartPurchaseOrders: React.FC<McPartPurchaseOrdersProps> = ({ orders, t }) => {
    const getStatusChip = (status: McPartOrder['status']) => {
        const styles: Record<McPartOrder['status'], string> = {
            'In Transit': 'bg-blue-900 text-blue-300',
            'Delayed': 'bg-red-900 text-red-300',
            'Received': 'bg-green-900 text-green-300',
        };
        const icons: Record<McPartOrder['status'], React.ReactNode> = {
            'In Transit': <Truck size={12} className="mr-1.5"/>,
            'Delayed': <AlertTriangle size={12} className="mr-1.5"/>,
            'Received': <CheckCircle size={12} className="mr-1.5"/>,
        };
        const translatedStatus = t(status.replace(/\s/g, '_').toLowerCase() as any);
        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
                {icons[status]}
                {translatedStatus || status}
            </span>
        );
    };
    
    return (
         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('purchaseOrders')}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left">{t('area')}</th>
                            <th className="py-3 px-4 text-left">{t('orderId')}</th>
                            <th className="py-3 px-4 text-left">{t('itemName')}</th>
                            <th className="py-3 px-4 text-left">{t('quantity')}</th>
                            <th className="py-3 px-4 text-left">{t('orderDate')}</th>
                            <th className="py-3 px-4 text-left">{t('expectedDate')}</th>
                            <th className="py-3 px-4 text-left">{t('supplier')}</th>
                            <th className="py-3 px-4 text-left">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {orders.length > 0 ? orders.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4">{req.area}</td>
                                <td className="py-3 px-4 font-mono">{req.order_id}</td>
                                <td className="py-3 px-4">{req.item_name}</td>
                                <td className="py-3 px-4">{req.qty_order}</td>
                                <td className="py-3 px-4">{req.order_date}</td>
                                <td className="py-3 px-4">{req.expected_date}</td>
                                <td className="py-3 px-4">{req.supplier}</td>
                                <td className="py-3 px-4">{getStatusChip(req.status)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">{t('noMcPartRequests')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


interface McPartPurchasingProps {
    requests: McPartPurchaseRequest[];
    t: (key: any) => string;
}

const McPartPurchasing: React.FC<McPartPurchasingProps> = ({ requests, t }) => {
    const getStatusChip = (status: PurchaseStatus) => {
        const styles: Record<PurchaseStatus, string> = {
            'Pending': 'bg-yellow-900 text-yellow-300',
            'Approved': 'bg-blue-900 text-blue-300',
            'Ordered': 'bg-purple-900 text-purple-300',
            'Received': 'bg-green-900 text-green-300',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    return (
         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left">{t('itemCode')}</th>
                            <th className="py-3 px-4 text-left">{t('itemName')}</th>
                            <th className="py-3 px-4 text-left">{t('quantity')}</th>
                            <th className="py-3 px-4 text-left">{t('reasonForPurchase')}</th>
                            <th className="py-3 px-4 text-left">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {requests.length > 0 ? requests.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4 font-mono">{req.item_code}</td>
                                <td className="py-3 px-4">{req.item_name}</td>
                                <td className="py-3 px-4">{req.quantity}</td>
                                <td className="py-3 px-4">{req.reason}</td>
                                <td className="py-3 px-4">{getStatusChip(req.status)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('noMcPartRequests')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface ConsumablePurchasingProps {
    requests: ConsumablePurchaseRequest[];
    t: (key: any) => string;
}

const ConsumablePurchasing: React.FC<ConsumablePurchasingProps> = ({ requests, t }) => {
     const getStatusChip = (status: PurchaseStatus) => {
        const styles: Record<PurchaseStatus, string> = {
            'Pending': 'bg-yellow-900 text-yellow-300',
            'Approved': 'bg-blue-900 text-blue-300',
            'Ordered': 'bg-purple-900 text-purple-300',
            'Received': 'bg-green-900 text-green-300',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left">{t('image')}</th>
                            <th className="py-3 px-4 text-left">{t('name')}</th>
                            <th className="py-3 px-4 text-left">{t('componentCode')}</th>
                            <th className="py-3 px-4 text-left">{t('technicalSpecifications')}</th>
                            <th className="py-3 px-4 text-left">{t('quantity')}</th>
                            <th className="py-3 px-4 text-left">{t('orderMonth')}</th>
                            <th className="py-3 px-4 text-left">{t('receiptMonth')}</th>
                            <th className="py-3 px-4 text-left">{t('notes')}</th>
                            <th className="py-3 px-4 text-left">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {requests.length > 0 ? requests.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4"><img src={req.image_url} alt={req.name} className="h-10 w-10 rounded-md object-cover" /></td>
                                <td className="py-3 px-4">{req.name}</td>
                                <td className="py-3 px-4 font-mono">{req.component_code}</td>
                                <td className="py-3 px-4">{req.specs}</td>
                                <td className="py-3 px-4">{req.quantity}</td>
                                <td className="py-3 px-4">{req.order_month}</td>
                                <td className="py-3 px-4">{req.receipt_month}</td>
                                <td className="py-3 px-4">{req.notes || '-'}</td>
                                <td className="py-3 px-4">{getStatusChip(req.status)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={9} className="text-center py-8 text-gray-500">{t('noConsumableRequests')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- END OF IN-FILE PURCHASING COMPONENTS ---

// --- START OF IN-FILE BENCHMARKING COMPONENTS ---

interface KpiProgressProps {
  label: string;
  actual: number;
  target: number;
  formatAs: 'number' | 'percent';
}

const KpiProgress: React.FC<KpiProgressProps> = ({ label, actual, target, formatAs }) => {
  const progress = target > 0 ? (actual / target) * 100 : 0;
  const isExceeded = progress > 100;
  const isBelowTarget = progress < 90;

  let progressBarColor = 'bg-cyan-500';
  if (isExceeded) progressBarColor = 'bg-green-500';
  if (isBelowTarget) progressBarColor = 'bg-red-500';
  
  const formatValue = (value: number) => {
    if (formatAs === 'percent') {
        return `${(value * 100).toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Target: {formatValue(target)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <div className="w-28 text-right">
            <span className={`font-bold text-lg ${isBelowTarget ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                {formatValue(actual)}
            </span>
        </div>
      </div>
    </div>
  );
};


interface BenchmarkDashboardProps {
  data: DashboardData;
  theme: 'light' | 'dark';
}

const BenchmarkDashboard: React.FC<BenchmarkDashboardProps> = ({ data, theme }) => {
  const { t } = useTranslation();
  const { oeeByLine, targets } = data.benchmarking;
  const { productionByLine } = data.summary;

  const benchmarkData = useMemo(() => {
    // Filter for line-level targets for this component
    const lineTargets = targets.filter(t => t.level === 'Line' && t.line_id);

    return lineTargets.map(target => {
      const actualOee = oeeByLine.find(o => o.name === target.line_id)?.value || 0;
      const actualOutput = productionByLine.find(p => p.name === target.line_id)?.value || 0;
      
      const lineDefects = data.quality.defectRecordsForPeriod
        .filter(d => {
            const machine = data.masterData.machines.find(m => m.id === d.machine_id);
            return machine?.LINE_ID === target.line_id;
        })
        .reduce((sum, d) => sum + d.quantity, 0);
      
      const totalProductionForLine = actualOutput + lineDefects;
      const actualDefectRate = totalProductionForLine > 0 ? lineDefects / totalProductionForLine : 0;

      return {
        lineId: target.line_id,
        targetOee: target.target_oee,
        actualOee,
        targetOutput: target.target_output,
        actualOutput,
        targetDefectRate: target.target_defect_rate,
        actualDefectRate,
      };
    });
  }, [oeeByLine, targets, productionByLine, data.quality.defectRecordsForPeriod, data.masterData.machines]);
  
  const getBarColor = (value: number) => {
    if (value >= 0.85) return '#22c55e';
    if (value >= 0.70) return '#facc15';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeBenchmarkTitle')}</h2>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <SimpleBarChart data={oeeByLine.sort((a,b) => b.value - a.value)} xAxisKey="name" barKey="value" fillColor={getBarColor} isPercentage theme={theme} />
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('targetVsActualTitle')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {benchmarkData.map(d => (
                <div key={d.lineId} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
                    <h3 className="text-xl font-bold">{t('line')} {d.lineId}</h3>
                    <KpiProgress label={t('oee')} actual={d.actualOee} target={d.targetOee} formatAs="percent" />
                    <KpiProgress label={t('output')} actual={d.actualOutput} target={d.targetOutput} formatAs="number" />
                    <KpiProgress label={t('defectRate')} actual={d.actualDefectRate} target={d.targetDefectRate} formatAs="percent" />
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};


// --- END OF IN-FILE BENCHMARKING COMPONENTS ---


const App: React.FC = () => {
    // State declarations
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark';
    });
    const { t, language, setLanguage } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('shopFloor');
    const [maintenanceSubTab, setMaintenanceSubTab] = useState<MaintenanceSubTab>('dashboard');
    const [purchasingSubTab, setPurchasingSubTab] = useState<PurchasingSubTab>('mcPart');
    const [pmScheduleFilter, setPmScheduleFilter] = useState<'all' | 'Overdue' | 'Due soon' | 'On schedule'>('all');


    // Filter states
    const { availableAreas, defaultDate, defaultArea } = getInitialFilterData();
    const [filters, setFilters] = useState({
        startDate: defaultDate,
        endDate: defaultDate,
        area: defaultArea,
        shift: 'all' as 'all' | 'A' | 'B' | 'C',
        mode: 'single' as 'single' | 'range' | 'last7' | 'lastWeek' | 'last30',
        status: 'all' as 'all' | 'active' | 'inactive',
    });
    
    // Threshold states
    const [thresholds, setThresholds] = useState({
        oee: 80,
        availability: 90,
        performance: 95,
        quality: 99,
    });

    // Modal states
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isDbPanelOpen, setIsDbPanelOpen] = useState(false);
    const [isErrorReportModalOpen, setIsErrorReportModalOpen] = useState(false);
    const [isMaintenanceOrderModalOpen, setIsMaintenanceOrderModalOpen] = useState(false);
    const [reportToUpdate, setReportToUpdate] = useState<EnrichedErrorReport | null>(null);
    const [maintenanceOrderDefaults, setMaintenanceOrderDefaults] = useState<Partial<NewMaintenanceOrderData> | undefined>(undefined);
    const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
    const [machineToEdit, setMachineToEdit] = useState<MachineInfo | null>(null);
    const [selectedSparePart, setSelectedSparePart] = useState<EnrichedSparePart | null>(null);
    const [isConsumableRequestModalOpen, setIsConsumableRequestModalOpen] = useState(false);
    const [isMcPartRequestModalOpen, setIsMcPartRequestModalOpen] = useState(false);
    const [isNewMcPartRequestModalOpen, setIsNewMcPartRequestModalOpen] = useState(false);
    const [partForMcRequest, setPartForMcRequest] = useState<SparePart | null>(null);
    const [isSparePartEditModalOpen, setIsSparePartEditModalOpen] = useState(false);
    const [partToEdit, setPartToEdit] = useState<SparePart | null>(null);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [isDataEntryModalOpen, setIsDataEntryModalOpen] = useState(false);
    const [selectedDefectRecord, setSelectedDefectRecord] = useState<EnrichedDefectRecord | null>(null);

    
    const [focusedLine, setFocusedLine] = useState<string | null>(null);

    // Theme effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const fetchData = useCallback(() => {
        setIsLoading(true);
        setError(null);
        getDashboardData(filters.startDate, filters.endDate, filters.area, filters.shift, filters.status, focusedLine)
            .then(setData)
            .catch(err => {
                console.error("Failed to fetch data:", err);
                setError("Could not load dashboard data.");
            })
            .finally(() => setIsLoading(false));
    }, [filters, focusedLine]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleFilterChange = useCallback((newFilters: any) => {
        setFilters(prev => ({...prev, ...newFilters}));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters({
            startDate: defaultDate,
            endDate: defaultDate,
            area: defaultArea,
            shift: 'all',
            mode: 'single',
            status: 'all',
        });
        setFocusedLine(null);
    }, [defaultDate, defaultArea]);

    const handleMachineSelect = (machineId: string) => {
        setSelectedMachineId(machineId);
    };

    const handleOpenUpdateModal = (report: EnrichedErrorReport) => {
        setReportToUpdate(report);
        setIsErrorReportModalOpen(true);
    };

    const handleReportSubmit = (reportData: NewErrorReportData) => {
        addErrorReport(reportData);
        setIsErrorReportModalOpen(false);
        fetchData();
    };

    const handleReportUpdate = (reportId: number, updateData: UpdateErrorData, newStatus: ErrorReportStatus) => {
        updateErrorReport(reportId, updateData, newStatus);
        setIsErrorReportModalOpen(false);
        setReportToUpdate(null);
        fetchData();
    };

    const handleMaintenanceOrderSubmit = (orderData: NewMaintenanceOrderData) => {
        addMaintenanceOrder(orderData);
        setIsMaintenanceOrderModalOpen(false);
        setMaintenanceOrderDefaults(undefined);
        fetchData();
    };

    const handleMachineSubmit = (machineData: NewMachineData, id: number | null) => {
        if (id) {
            updateMachine(id, machineData);
        } else {
            addMachine(machineData);
        }
        setIsMachineModalOpen(false);
        setMachineToEdit(null);
        fetchData();
    };

    const handleUpdateMachinePosition = (machineId: number, newPosition: { x: number; y: number }) => {
        updateMachine(machineId, newPosition);
        fetchData();
    };
    
    const handleConsumableRequestSubmit = (requestData: NewConsumableRequestData) => {
        addConsumableRequest(requestData);
        setIsConsumableRequestModalOpen(false);
        fetchData();
    };

    const handleMcPartRequestSubmit = (requestData: NewMcPartRequestData) => {
        addMcPartRequest(requestData);
        setIsMcPartRequestModalOpen(false);
        setIsNewMcPartRequestModalOpen(false);
        setPartForMcRequest(null);
        fetchData();
    };
    
    const handleSparePartSubmit = (partData: NewSparePartData, id: number | null) => {
        if (id) {
            updateSparePart(id, partData);
        } else {
            addSparePart(partData);
        }
        setIsSparePartEditModalOpen(false);
        setPartToEdit(null);
        fetchData();
    };

    const handleToggleFlag = (partId: number) => {
        toggleFlagForOrder(partId);
        fetchData();
    };
    
    const handleDefectRecordSubmit = (defectData: NewDefectData) => {
        addDefectRecord(defectData);
        setIsDataEntryModalOpen(false);
        fetchData();
    };

    const openCreateReportModal = () => {
        setReportToUpdate(null);
        setIsErrorReportModalOpen(true);
    };

    const openCreateOrderModal = (defaults?: Partial<NewMaintenanceOrderData>) => {
        setMaintenanceOrderDefaults(defaults);
        setIsMaintenanceOrderModalOpen(true);
    };
    
    const handleNavigateToSchedule = (filter: 'overdue' | 'dueSoon' | 'all') => {
        const newFilter = filter === 'overdue' ? 'Overdue' : filter === 'dueSoon' ? 'Due soon' : 'all';
        setPmScheduleFilter(newFilter);
        setMaintenanceSubTab('pmSchedule');
    };

    const selectedMachineDetails = useMemo(() => {
        if (!selectedMachineId || !data) return null;
        const machineInfo = getMachineInfo(selectedMachineId);
        const productionRecord = data.productionLog.find(p => p.MACHINE_ID === selectedMachineId) ?? null;
        const downtimeRecords = data.downtimeRecords.filter(d => d.MACHINE_ID === selectedMachineId);
        const errorHistory = data.errorReports.filter(r => r.MACHINE_ID === selectedMachineId);
        const maintenanceHistory = data.maintenanceOrders.filter(o => o.MACHINE_ID === selectedMachineId && o.status === 'Done');
        const plannedMaintenance = data.maintenanceOrders.filter(o => o.MACHINE_ID === selectedMachineId && o.status !== 'Done' && o.type === 'PM');
        return { machineInfo, productionRecord, downtimeRecords, errorHistory, maintenanceHistory, plannedMaintenance };
    }, [selectedMachineId, data]);
    
    const openPartDetails = (part: SparePart) => {
        const enrichedPart = getEnrichedSparePartDetails(part);
        setSelectedSparePart(enrichedPart);
    };

    const menuSections = [
        {
            title: t('actions'),
            items: [
                { label: t('reportDefectDetail'), onClick: () => setIsDataEntryModalOpen(true), icon: <PlusCircle size={16} /> },
                { label: t('createErrorReport'), onClick: openCreateReportModal, icon: <AlertTriangle size={16} /> },
                { label: t('createNewOrder'), onClick: () => openCreateOrderModal(), icon: <Wrench size={16} /> },
                { label: t('runChecklist'), onClick: () => setIsChecklistModalOpen(true), icon: <ListChecks size={16} /> },
            ],
        },
        {
            title: t('system'),
            items: [
                { label: t('viewDbTables'), onClick: () => setIsDbPanelOpen(true), icon: <Database size={16} /> },
                { label: t('viewDeploymentChecklist'), onClick: () => setIsChecklistModalOpen(true), icon: <ClipboardList size={16} /> },
                { label: t('helpUserGuide'), onClick: () => setIsHelpModalOpen(true), icon: <HelpCircle size={16} /> },
            ],
        },
    ];

    const tabConfig = {
      shopFloor: { icon: <Grid size={18} />, label: t('shopFloorTab') },
      overview: { icon: <LayoutDashboard size={18} />, label: t('overviewTab') },
      performance: { icon: <BarChart3 size={18} />, label: t('performanceTab') },
      quality: { icon: <CheckCircle size={18} />, label: t('qualityTab') },
      downtime: { icon: <ShieldAlert size={18} />, label: t('downtimeTab') },
      errorLog: { icon: <AlertTriangle size={18} />, label: t('errorLogTab') },
      maintenance: { icon: <Wrench size={18} />, label: t('maintenanceTab') },
      purchasing: { icon: <ShoppingCart size={18} />, label: t('purchasingTab') },
      benchmarking: { icon: <ListOrdered size={18} />, label: t('benchmarkingTab') },
    };

    const tabsWithGlobalFilter = useMemo(() => ['overview', 'performance', 'quality', 'downtime'], []);
    const shouldShowFilterBar = tabsWithGlobalFilter.includes(activeTab);

    const renderTabContent = () => {
        if (!data) return null;
        switch (activeTab) {
            case 'shopFloor':
                return <ShopFloorLayout 
                    allMachines={data.allMachineInfo} 
                    machineStatus={data.machineStatus}
                    onMachineSelect={handleMachineSelect}
                    onAddMachine={() => { setMachineToEdit(null); setIsMachineModalOpen(true); }}
                    onEditMachine={(machine) => { setMachineToEdit(machine); setIsMachineModalOpen(true); }}
                    onUpdateMachinePosition={handleUpdateMachinePosition}
                />;
            case 'overview':
                const paretoData = [...data.quality.defectPareto].sort((a,b) => b.value - a.value);
                const totalDefectsForPareto = paretoData.reduce((sum, item) => sum + item.value, 0);
                let cumulative = 0;
                const defectParetoWithCumulative = paretoData.map(item => {
                    cumulative += item.value;
                    return { ...item, cumulative: (cumulative / totalDefectsForPareto) * 100 };
                });
                return (
                    <div className="space-y-6">
                         <section>
                            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('kpiTitle')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <KpiCard title={t('totalProduction')} value={data.summary.totalProduction} unit=" units" precision={0} />
                                <KpiCard title={t('totalDefects')} value={data.summary.totalDefects} unit=" units" precision={0} />
                                <KpiCard title={t('totalDowntime')} value={data.summary.totalDowntime} unit=" min" precision={0} />
                                <KpiCard title={t('defectRate')} value={data.summary.defectRate} unit="%" precision={2} />
                            </div>
                        </section>
                        <OeeGauge value={data.summary.avgOee} availability={data.summary.avgAvailability} performance={data.summary.avgPerformance} quality={data.summary.avgQuality} theme={theme} oeeThreshold={thresholds.oee} />
                        <AiAnalysis data={data} filters={filters} />
                        <section>
                            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('productionLogTitle')}</h2>
                            <ProductionLogTable data={data.productionLog} onMachineSelect={handleMachineSelect} oeeThreshold={thresholds.oee} allDefectTypes={data.masterData.defectTypes} allDefectRecords={data.allDefectRecords} />
                        </section>
                    </div>
                );
            case 'performance':
                return (
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeTrendTitle')}</h2>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                <TrendChart data={data.performance.sevenDayTrend} lines={[
                                    { dataKey: 'oee', stroke: '#22d3ee', name: 'OEE' },
                                    { dataKey: 'availability', stroke: '#818cf8', name: 'Availability' },
                                    { dataKey: 'performance', stroke: '#f472b6', name: 'Performance' },
                                    { dataKey: 'quality', stroke: '#a78bfa', name: 'Quality' },
                                ]} isPercentage theme={theme} />
                            </div>
                        </section>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('productionDistributionTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <BoxplotChart data={data.performance.productionBoxplot} theme={theme} />
                                </div>
                            </section>
                            <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeHeatmapTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <HeatmapChart data={data.performance.oeeHeatmap} theme={theme} />
                                </div>
                            </section>
                        </div>
                    </div>
                );
            case 'quality':
                 const paretoQuality = [...data.quality.defectPareto].sort((a,b) => b.value - a.value);
                 const totalDefectsForParetoQuality = paretoQuality.reduce((sum, item) => sum + item.value, 0);
                 let cumulativeQuality = 0;
                 const defectParetoWithCumulativeQuality = paretoQuality.map(item => {
                     cumulativeQuality += item.value;
                     return { ...item, cumulative: (cumulativeQuality / totalDefectsForParetoQuality) * 100 };
                 });
                return (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectParetoTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <ParetoChart data={defectParetoWithCumulativeQuality} barKey="value" lineKey="cumulative" barColor="#ef4444" lineColor="#f97316" theme={theme} />
                                </div>
                            </section>
                             <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectCountTrendTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <DefectTrendChart data={data.quality.defectTrend} theme={theme} />
                                </div>
                            </section>
                        </div>
                         <section>
                             <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Defects by Root Cause</h2>
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                 <DefectsPieChart data={data.quality.defectsByRootCause} />
                             </div>
                         </section>
                        <section>
                            <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectLogTitle')}</h2>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                <DefectLogTable
                                    data={data.quality.defectRecordsForPeriod}
                                    onViewDetails={(defect) => setSelectedDefectRecord(defect)}
                                />
                            </div>
                        </section>
                    </div>
                );
            case 'downtime':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeParetoTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <DowntimeParetoChart data={data.downtime.downtimePareto} theme={theme} />
                                </div>
                            </section>
                            <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeTrendTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <TrendChart data={data.downtime.downtimeTrend} lines={[{ dataKey: 'downtime', stroke: '#f97316', name: 'Downtime (min)' }]} theme={theme} />
                                </div>
                            </section>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('top5DowntimeTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-full">
                                    <Top5Table headers={[t('machineId'), t('totalDowntime_short')]} data={data.downtime.top5DowntimeMachines.map(d => ({ col1: d.machineId, col2: d.totalDowntime }))} />
                                </div>
                            </section>
                             <section>
                                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeByLineTitle')}</h2>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                                    <StackedBarChart data={data.downtime.downtimeByLine} keys={data.downtime.uniqueDowntimeReasons} theme={theme} />
                                </div>
                            </section>
                        </div>
                    </div>
                );
            case 'errorLog':
                return <ErrorLogTable reports={data.errorReports} onOpenUpdateModal={handleOpenUpdateModal} onStatusUpdate={(id, status) => updateErrorReport(id, {}, status)} />;
            case 'maintenance':
                 const maintenanceNavClass = "py-2 px-4 text-sm font-medium text-center rounded-t-lg border-b-2 cursor-pointer";
                 const activeMaintenanceNavClass = "text-cyan-400 border-cyan-400";
                 const inactiveMaintenanceNavClass = "border-transparent text-gray-400 hover:text-cyan-400/70 hover:border-cyan-400/70";
                 return (
                    <div className="space-y-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                                <li className="mr-2">
                                    <button onClick={() => setMaintenanceSubTab('dashboard')} className={`${maintenanceNavClass} ${maintenanceSubTab === 'dashboard' ? activeMaintenanceNavClass : inactiveMaintenanceNavClass}`}>
                                        {t('maintReport')}
                                    </button>
                                </li>
                                <li className="mr-2">
                                    <button onClick={() => setMaintenanceSubTab('mcPartInventory')} className={`${maintenanceNavClass} ${maintenanceSubTab === 'mcPartInventory' ? activeMaintenanceNavClass : inactiveMaintenanceNavClass}`}>
                                        {t('mcPartInventory')}
                                    </button>
                                </li>
                                <li className="mr-2">
                                    <button onClick={() => setMaintenanceSubTab('purchaseOrders')} className={`${maintenanceNavClass} ${maintenanceSubTab === 'purchaseOrders' ? activeMaintenanceNavClass : inactiveMaintenanceNavClass}`}>
                                    {t('purchaseOrders')}
                                    </button>
                                </li>
                                <li className="mr-2">
                                    <button onClick={() => setMaintenanceSubTab('pmSchedule')} className={`${maintenanceNavClass} ${maintenanceSubTab === 'pmSchedule' ? activeMaintenanceNavClass : inactiveMaintenanceNavClass}`}>
                                        {t('pmSchedule')}
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div>
                            {maintenanceSubTab === 'dashboard' && <MaintenanceDashboard data={data.maintenance} onOpenModal={openCreateOrderModal} onNavigateToInventory={() => setMaintenanceSubTab('mcPartInventory')} onNavigateToSchedule={handleNavigateToSchedule} onCreatePo={(part) => { setPartForMcRequest(part); setIsMcPartRequestModalOpen(true); }} theme={theme}/>}
                            {maintenanceSubTab === 'mcPartInventory' && <SparePartsInventory parts={data.maintenance.spareParts} onPartSelect={openPartDetails} onAddNewPart={() => { setPartToEdit(null); setIsSparePartEditModalOpen(true); }} onEditPart={(part) => { setPartToEdit(part); setIsSparePartEditModalOpen(true); }} onToggleFlag={handleToggleFlag} onCreateRequest={(part) => { setPartForMcRequest(part); setIsMcPartRequestModalOpen(true); }} />}
                            {maintenanceSubTab === 'purchaseOrders' && <McPartPurchaseOrders orders={data.maintenance.mcPartOrders} t={t} />}
                            {maintenanceSubTab === 'pmSchedule' && <MaintenanceScheduleView schedule={data.maintenance.pmSchedule} onCreateWorkOrder={(item) => openCreateOrderModal({ machine_id: item.machine_id, type: 'PM', symptom: item.pm_type, created_at: item.next_pm_date })} initialFilter={pmScheduleFilter} />}
                        </div>
                    </div>
                );
            case 'purchasing':
                 const purchasingNavClass = "py-2 px-4 text-sm font-medium text-center rounded-t-lg border-b-2 cursor-pointer";
                 const activePurchasingNavClass = "text-cyan-400 border-cyan-400";
                 const inactivePurchasingNavClass = "border-transparent text-gray-400 hover:text-cyan-400/70 hover:border-cyan-400/70";
                 return (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                                    <li className="mr-2">
                                        <button onClick={() => setPurchasingSubTab('mcPart')} className={`${purchasingNavClass} ${purchasingSubTab === 'mcPart' ? activePurchasingNavClass : inactivePurchasingNavClass}`}>
                                            {t('mcPartPurchasing')}
                                        </button>
                                    </li>
                                    <li className="mr-2">
                                        <button onClick={() => setPurchasingSubTab('consumable')} className={`${purchasingNavClass} ${purchasingSubTab === 'consumable' ? activePurchasingNavClass : inactivePurchasingNavClass}`}>
                                            {t('consumablePurchasing')}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <button 
                                onClick={() => purchasingSubTab === 'mcPart' ? setIsNewMcPartRequestModalOpen(true) : setIsConsumableRequestModalOpen(true)}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                            >
                                <Plus size={16} />
                                {t('addNewRequest')}
                            </button>
                        </div>
                        <div>
                            {purchasingSubTab === 'mcPart' && <McPartPurchasing requests={data.purchasing.mcPartRequests} t={t} />}
                            {purchasingSubTab === 'consumable' && <ConsumablePurchasing requests={data.purchasing.consumableRequests} t={t} />}
                        </div>
                    </div>
                );
            case 'benchmarking':
                return <BenchmarkDashboard data={data} theme={theme} />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 size={48} className="animate-spin text-cyan-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-900/10 text-red-400 p-4">
                 <AlertTriangle size={48} className="mb-4" />
                 <h1 className="text-2xl font-bold mb-2">Error Loading Data</h1>
                 <p>{error}</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen">
             <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-30 shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                           <HamburgerMenu sections={menuSections} />
                           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dashboardTitle')}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                                <button onClick={() => setLanguage('vi')} className={`px-2 py-1 text-sm rounded-md ${language === 'vi' ? 'bg-cyan-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>VI</button>
                                <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-sm rounded-md ${language === 'en' ? 'bg-cyan-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>EN</button>
                           </div>
                           <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Toggle theme">
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                           </button>
                        </div>
                    </div>
                    <nav className="flex items-center space-x-1 overflow-x-auto -mb-px">
                        {Object.entries(tabConfig).map(([tabKey, tabInfo]) => (
                            <button
                                key={tabKey}
                                onClick={() => setActiveTab(tabKey as Tab)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                                    activeTab === tabKey
                                        ? 'border-cyan-500 text-cyan-500'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                {tabInfo.icon}
                                {tabInfo.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>
            
            <main className="container mx-auto p-4 md:p-6">
                {shouldShowFilterBar && (
                    <FilterBar
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        selectedArea={filters.area}
                        selectedShift={filters.shift}
                        dateSelectionMode={filters.mode}
                        selectedStatus={filters.status}
                        availableAreas={availableAreas}
                        oeeThreshold={thresholds.oee}
                        availabilityThreshold={thresholds.availability}
                        performanceThreshold={thresholds.performance}
                        qualityThreshold={thresholds.quality}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onOeeThresholdChange={(val) => setThresholds(p => ({...p, oee: val}))}
                        onAvailabilityThresholdChange={(val) => setThresholds(p => ({...p, availability: val}))}
                        onPerformanceThresholdChange={(val) => setThresholds(p => ({...p, performance: val}))}
                        onQualityThresholdChange={(val) => setThresholds(p => ({...p, quality: val}))}
                    />
                )}
                
                {data && renderTabContent()}
            </main>
            
            {/* Modals */}
            {data && selectedMachineDetails && (
                <MachineDetailsModal 
                    isOpen={!!selectedMachineId} 
                    onClose={() => setSelectedMachineId(null)} 
                    {...selectedMachineDetails}
                    theme={theme}
                />
            )}
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            <DatabaseSchemaPanel isOpen={isDbPanelOpen} onClose={() => setIsDbPanelOpen(false)} />
            {data && isErrorReportModalOpen && <ErrorReportModal isOpen={isErrorReportModalOpen} onClose={() => { setIsErrorReportModalOpen(false); setReportToUpdate(null); }} onSubmit={handleReportSubmit} onUpdate={handleReportUpdate} reportToUpdate={reportToUpdate} masterData={data.masterData} openMaintenanceOrders={data.maintenanceOrders.filter(o => o.status === 'Open' || o.status === 'InProgress')} />}
            {data && isMaintenanceOrderModalOpen && <MaintenanceOrderModal isOpen={isMaintenanceOrderModalOpen} onClose={() => { setIsMaintenanceOrderModalOpen(false); setMaintenanceOrderDefaults(undefined); }} onSubmit={handleMaintenanceOrderSubmit} allMachines={data.masterData.machines} allUsers={data.masterData.users} allDefectCauses={data.masterData.defectCauses} openDefects={data.allDefectRecords.filter(d => d.status !== 'Closed')} currentDate={filters.endDate} allSpareParts={data.masterData.spareParts} defaults={maintenanceOrderDefaults} />}
            {data && isMachineModalOpen && <MachineEditModal isOpen={isMachineModalOpen} onClose={() => { setIsMachineModalOpen(false); setMachineToEdit(null); }} onSubmit={handleMachineSubmit} machineToEdit={machineToEdit} allLines={data.availableLines} />}
            {selectedSparePart && <SparePartDetailsModal isOpen={!!selectedSparePart} onClose={() => setSelectedSparePart(null)} part={selectedSparePart} />}
            {isConsumableRequestModalOpen && <ConsumableRequestModal isOpen={isConsumableRequestModalOpen} onClose={() => setIsConsumableRequestModalOpen(false)} onSubmit={handleConsumableRequestSubmit} />}
            {isMcPartRequestModalOpen && partForMcRequest && <McPartRequestModal isOpen={isMcPartRequestModalOpen} onClose={() => { setIsMcPartRequestModalOpen(false); setPartForMcRequest(null); }} onSubmit={handleMcPartRequestSubmit} part={partForMcRequest} />}
            {isNewMcPartRequestModalOpen && <NewMcPartRequestModal isOpen={isNewMcPartRequestModalOpen} onClose={() => setIsNewMcPartRequestModalOpen(false)} onSubmit={handleMcPartRequestSubmit} />}
            {isSparePartEditModalOpen && <SparePartEditModal isOpen={isSparePartEditModalOpen} onClose={() => { setIsSparePartEditModalOpen(false); setPartToEdit(null); }} onSubmit={handleSparePartSubmit} partToEdit={partToEdit} />}
            {isChecklistModalOpen && <DeploymentChecklistModal isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)} />}
            {data && isDataEntryModalOpen && <DataEntryModal isOpen={isDataEntryModalOpen} onClose={() => setIsDataEntryModalOpen(false)} onSubmit={handleDefectRecordSubmit} allMachines={data.masterData.machines} allShifts={data.masterData.shifts} allDefectTypes={data.masterData.defectTypes} allDefectCauses={data.masterData.defectCauses} openMaintenanceOrders={data.maintenanceOrders.filter(o => o.status === 'Open' || o.status === 'InProgress')} currentDate={filters.endDate} />}
            {selectedDefectRecord && <DefectDetailsModal isOpen={!!selectedDefectRecord} onClose={() => setSelectedDefectRecord(null)} defect={selectedDefectRecord} onNavigateToLog={() => {}} />}

        </div>
    );
};

export default App;