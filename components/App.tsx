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
} from '../services/dataService';
import { DashboardData, EnrichedErrorReport, NewErrorReportData, UpdateErrorData, ErrorReportStatus, NewMaintenanceOrderData, EnrichedDefectRecord, MachineInfo, NewMachineData, SparePart, EnrichedMaintenanceOrder, McPartPurchaseRequest, ConsumablePurchaseRequest, PurchaseStatus, NewConsumableRequestData, NewMcPartRequestData, NewSparePartData, EnrichedMaintenanceSchedule } from '../types';
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
import HeatmapChart from '../HeatmapChart';
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
import SparePartsInventory from './SparePartsInventory';
import MaintenanceOrderModal from './MaintenanceOrderModal';
import MachineEditModal from './MachineEditModal';
import SparePartDetailsModal from './SparePartDetailsModal';
import DowntimeParetoChart from './DowntimeParetoChart';
import ConsumableRequestModal from './ConsumableRequestModal';
import McPartRequestModal from './McPartRequestModal';
import SparePartEditModal from './SparePartEditModal';
import NewMcPartRequestModal from './NewMcPartRequestModal';
import MaintenanceScheduleView from './MaintenanceSchedule';


// Icons
import { LayoutDashboard, BarChart3, ShieldAlert, AlertTriangle, ListChecks, Database, HelpCircle, PlusCircle, Grid, Wrench, PackageSearch, ShoppingCart, Sun, Moon, Languages, Loader2, CalendarClock } from 'lucide-react';

type Tab = 'shopFloor' | 'overview' | 'performance' | 'quality' | 'downtime' | 'errorLog' | 'maintenance' | 'purchasing';
type MaintenanceSubTab = 'dashboard' | 'inventory' | 'pmSchedule';
type PurchasingSubTab = 'mcPart' | 'consumable';

// --- START OF IN-FILE PURCHASING COMPONENTS ---

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
    const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(null);
    const [isConsumableRequestModalOpen, setIsConsumableRequestModalOpen] = useState(false);
    const [isMcPartRequestModalOpen, setIsMcPartRequestModalOpen] = useState(false);
    const [isNewMcPartRequestModalOpen, setIsNewMcPartRequestModalOpen] = useState(false);
    const [partForMcRequest, setPartForMcRequest] = useState<SparePart | null>(null);
    const [isSparePartEditModalOpen, setIsSparePartEditModalOpen] = useState(false);
    const [partToEdit, setPartToEdit] = useState<SparePart | null>(null);

    
    const [focusedLine, setFocusedLine] = useState<string | null>(null);

    // Theme effect
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Data fetching effect
    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // The signal is no longer needed for mock data, but is good practice
                const result = await getDashboardData(
                    filters.startDate, filters.endDate, filters.area, filters.shift, filters.status, focusedLine
                );
                setData(result);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Failed to fetch dashboard data:", err);
                    setError("Could not load dashboard data. Please try again later.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
        return () => controller.abort();
    }, [filters, focusedLine]);

    const forceDataRefresh = () => setFilters(f => ({...f}));

    // Handlers
    const handleFilterChange = useCallback((newFilters: any) => setFilters(newFilters), []);
    const handleClearFilters = useCallback(() => {
        setFilters({
            startDate: defaultDate, endDate: defaultDate, area: defaultArea,
            shift: 'all', mode: 'single', status: 'all'
        });
        setThresholds({ oee: 80, availability: 90, performance: 95, quality: 99 });
        setFocusedLine(null);
    }, [defaultDate, defaultArea]);
    
    const handleOpenCreateReportModal = () => {
        setReportToUpdate(null);
        setIsErrorReportModalOpen(true);
    };

    const handleOpenUpdateReportModal = (report: EnrichedErrorReport) => {
        setReportToUpdate(report);
        setIsErrorReportModalOpen(true);
    };

    const handleErrorReportSubmit = (newReportData: NewErrorReportData) => {
        addErrorReport(newReportData);
        setIsErrorReportModalOpen(false);
        forceDataRefresh();
    };

    const handleErrorReportUpdate = (reportId: number, updateData: UpdateErrorData, newStatus: ErrorReportStatus) => {
        updateErrorReport(reportId, updateData, newStatus);
        setIsErrorReportModalOpen(false);
        forceDataRefresh();
    };

    const handleStatusUpdate = (reportId: number, newStatus: ErrorReportStatus) => {
        // This is for simple status transitions like "Reported" -> "In Progress"
        updateErrorReport(reportId, {}, newStatus);
        forceDataRefresh();
    };

    const handleOpenCreateMaintOrderModal = (defaults?: Partial<NewMaintenanceOrderData>) => {
        setMaintenanceOrderDefaults(defaults);
        setIsMaintenanceOrderModalOpen(true);
    };

    const handleMaintOrderSubmit = (newOrderData: NewMaintenanceOrderData) => {
        addMaintenanceOrder(newOrderData);
        setIsMaintenanceOrderModalOpen(false);
        forceDataRefresh();
    };
    
    const handleOpenAddMachineModal = () => {
        setMachineToEdit(null);
        setIsMachineModalOpen(true);
    };

    const handleOpenEditMachineModal = (machine: MachineInfo) => {
        setMachineToEdit(machine);
        setIsMachineModalOpen(true);
    };
    
    const handleMachineModalSubmit = (data: NewMachineData, id: number | null) => {
        if (id) {
            updateMachine(id, data);
        } else {
            addMachine(data);
        }
        setIsMachineModalOpen(false);
        forceDataRefresh();
    };

    const handleOpenSparePartDetails = (part: SparePart) => {
        setSelectedSparePart(part);
    };

    const handleConsumableRequestSubmit = (data: NewConsumableRequestData) => {
        addConsumableRequest(data);
        setIsConsumableRequestModalOpen(false);
        forceDataRefresh();
    };
    
    const handleMcPartRequestSubmit = (data: NewMcPartRequestData) => {
        addMcPartRequest(data);
        setIsMcPartRequestModalOpen(false);
        setPurchasingSubTab('mcPart'); // Switch tab to see the new request
        forceDataRefresh();
    };

     const handleNewMcPartRequestSubmit = (data: NewMcPartRequestData) => {
        addMcPartRequest(data);
        setIsNewMcPartRequestModalOpen(false);
        forceDataRefresh();
    };

    const handleOpenMcPartRequestModal = (part: SparePart) => {
        setPartForMcRequest(part);
        setIsMcPartRequestModalOpen(true);
    };

    const handleSparePartSubmit = (data: NewSparePartData, id: number | null) => {
        if (id) {
            updateSparePart(id, data);
        } else {
            addSparePart(data);
        }
        setIsSparePartEditModalOpen(false);
        forceDataRefresh();
    };

    const handleOpenSparePartEditModal = (part: SparePart | null) => {
        setPartToEdit(part);
        setIsSparePartEditModalOpen(true);
    };

    const handleToggleFlagForOrder = (partId: number) => {
        toggleFlagForOrder(partId);
        forceDataRefresh();
    };

    const handleCreateMaintOrderFromSchedule = (scheduleItem: EnrichedMaintenanceSchedule) => {
        if (!data) return;
        // Find a specific template for the machine first, then fall back to a general one (machine_id: 0)
        const template = data.masterData.pmPartsTemplates.find(
            t => t.pm_type === scheduleItem.pm_type && t.machine_id === scheduleItem.machine_id
        ) || data.masterData.pmPartsTemplates.find(
            t => t.pm_type === scheduleItem.pm_type && t.machine_id === 0
        );

        const parts_used = template?.parts.map(p => ({ part_id: p.part_id, qty_used: p.qty })) || [];

        const defaults: Partial<NewMaintenanceOrderData> = {
            machine_id: scheduleItem.machine_id,
            type: 'PM',
            symptom: `${scheduleItem.pm_type} for ${scheduleItem.MACHINE_ID}`,
            created_at: scheduleItem.next_pm_date, // Schedule it for the day it's due
            parts_used,
        };
        handleOpenCreateMaintOrderModal(defaults);
    };


    const selectedMachineInfo = useMemo(() => {
        if (!selectedMachineId) return null;
        return getMachineInfo(selectedMachineId);
    }, [selectedMachineId]);
    
    const selectedMachineProduction = useMemo(() => {
        if (!selectedMachineId || !data) return null;
        return data.productionLog.find(p => p.MACHINE_ID === selectedMachineId) || null;
    }, [selectedMachineId, data]);

    const selectedMachineDowntime = useMemo(() => {
        if (!selectedMachineId || !data) return [];
        return data.downtimeRecords.filter(d => d.MACHINE_ID === selectedMachineId);
    }, [selectedMachineId, data]);

    const selectedMachineErrorHistory = useMemo((): EnrichedErrorReport[] => {
        if (!selectedMachineId || !data) return [];
        const machine = data.allMachineInfo.find(m => m.MACHINE_ID === selectedMachineId);
        if (!machine) return [];
        return data.errorReports
            .filter(r => r.machine_id === machine.id)
            .sort((a, b) => new Date(b.report_time).getTime() - new Date(a.report_time).getTime())
            .slice(0, 10);
    }, [selectedMachineId, data]);

    const selectedMachineMaintenanceHistory = useMemo((): EnrichedMaintenanceOrder[] => {
        if (!selectedMachineId || !data) return [];
        const machine = data.allMachineInfo.find(m => m.MACHINE_ID === selectedMachineId);
        if (!machine) return [];
        return data.maintenanceOrders
            .filter(o => o.machine_id === machine.id && o.status === 'Done')
            .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
            .slice(0, 10);
    }, [selectedMachineId, data]);

    const selectedMachinePlannedMaintenance = useMemo((): EnrichedMaintenanceOrder[] => {
        if (!selectedMachineId || !data) return [];
        const machine = data.allMachineInfo.find(m => m.MACHINE_ID === selectedMachineId);
        if (!machine) return [];
        return data.maintenanceOrders
            .filter(o => o.machine_id === machine.id && (o.status === 'Open' || o.status === 'InProgress') && o.type === 'PM')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [selectedMachineId, data]);

    const openMaintenanceOrders = useMemo((): EnrichedMaintenanceOrder[] => {
        if (!data) return [];
        return data.maintenanceOrders.filter(o => o.status === 'Open' || o.status === 'InProgress');
    }, [data]);

    const defectParetoData = useMemo(() => {
        if (!data?.quality.defectPareto) return [];
        const sorted = [...data.quality.defectPareto].sort((a,b) => b.value - a.value);
        const total = sorted.reduce((sum, item) => sum + item.value, 0);
        let cumulative = 0;
        return sorted.map(item => {
            cumulative += item.value;
            return {
                ...item,
                cumulative: total > 0 ? (cumulative / total) * 100 : 0
            };
        });
    }, [data]);


    const handleBarClick = useCallback((payload: any) => {
        if (payload?.name) {
            setFocusedLine(line => line === payload.name ? null : payload.name);
        }
    }, []);
    
    const menuSections = [
        { title: t('actions'), items: [ 
            { label: t('createErrorReport'), icon: <PlusCircle size={16} />, onClick: handleOpenCreateReportModal },
            { label: t('createNewOrder'), icon: <Wrench size={16} />, onClick: () => handleOpenCreateMaintOrderModal() },
            { label: t('addMachine'), icon: <PlusCircle size={16} />, onClick: handleOpenAddMachineModal },
        ]},
        { title: t('system'), items: [ { label: t('viewDbTables'), icon: <Database size={16} />, onClick: () => setIsDbPanelOpen(true) }, { label: t('helpUserGuide'), icon: <HelpCircle size={16} />, onClick: () => setIsHelpModalOpen(true) }, ]}
    ];

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'shopFloor', label: t('shopFloorTab'), icon: <Grid size={18} /> },
        { id: 'overview', label: t('overviewTab'), icon: <LayoutDashboard size={18} /> },
        { id: 'performance', label: t('performanceTab'), icon: <BarChart3 size={18} /> },
        { id: 'quality', label: t('qualityTab'), icon: <ShieldAlert size={18} /> },
        { id: 'downtime', label: t('downtimeTab'), icon: <AlertTriangle size={18} /> },
        { id: 'errorLog', label: t('errorLogTab'), icon: <ListChecks size={18} /> },
        { id: 'maintenance', label: t('maintenanceTab'), icon: <Wrench size={18} /> },
        { id: 'purchasing', label: t('purchasingTab'), icon: <ShoppingCart size={18} /> },
    ];

    const renderTabContent = () => {
        if (!data) return null;
        switch (activeTab) {
            case 'shopFloor': return (
                 <section>
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('shopFloorStatusTitle')}</h2>
                    <ShopFloorLayout 
                        allMachines={data.allMachineInfo} 
                        machineStatus={data.machineStatus} 
                        onMachineSelect={setSelectedMachineId}
                        onAddMachine={handleOpenAddMachineModal}
                        onEditMachine={handleOpenEditMachineModal}
                    />
                </section>
            );
            case 'overview': return (
                <div className="space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('kpiTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2"><OeeGauge value={data.summary.avgOee} availability={data.summary.avgAvailability} performance={data.summary.avgPerformance} quality={data.summary.avgQuality} theme={theme} oeeThreshold={thresholds.oee} /></div>
                            <KpiCard title={t('totalProduction')} value={data.summary.totalProduction} unit=" pcs" precision={0} />
                            <KpiCard title={t('totalDefects')} value={data.summary.totalDefects} unit=" pcs" precision={0} />
                            <KpiCard title={t('totalDowntime')} value={data.summary.totalDowntime} unit=" min" precision={0} />
                        </div>
                    </section>
                     <AiAnalysis data={data} filters={filters} />
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-cyan-400 border-l-4 border-cyan-400 pl-3">{t('productionLogTitle')}</h2>
                        </div>
                        <ProductionLogTable 
                            data={data.productionLog} 
                            onMachineSelect={setSelectedMachineId} 
                            oeeThreshold={thresholds.oee / 100}
                            allDefectTypes={data.masterData.defectTypes}
                            allDefectRecords={data.allDefectRecords}
                        />
                    </section>
                </div>
            );
            case 'performance': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2"><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeTrendTitle')}</h2><TrendChart data={data.performance.sevenDayTrend} lines={[{ dataKey: 'oee', stroke: '#22d3ee', name: 'OEE' }]} isPercentage theme={theme} areaLines={['oee']} targetLines={[{value: thresholds.oee/100, label: 'Target', stroke: '#f87171'}]} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('productionDistributionTitle')}</h2><BoxplotChart data={data.performance.productionBoxplot} theme={theme} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('oeeHeatmapTitle')}</h2><HeatmapChart data={data.performance.oeeHeatmap} theme={theme} /></div>
                </div>
            );
            case 'quality': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectParetoTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <ParetoChart data={defectParetoData} barKey="value" lineKey="cumulative" barColor="#ef4444" lineColor="#38bdf8" theme={theme} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('top5DefectsTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80">
                            <Top5Table 
                                headers={[t('line'), t('defectRate'), t('totalDefects')]} 
                                data={data.quality.top5DefectLines.map(line => ({ 
                                    col1: line.lineId, 
                                    col2: `${(line.defectRate * 100).toFixed(2)}%`, 
                                    col3: line.totalDefects.toLocaleString()
                                }))} 
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectsByRootCauseTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80">
                           <SimpleBarChart data={data.quality.defectsByRootCause} xAxisKey="name" barKey="value" fillColor="#f97316" theme={theme} />
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('defectCountTrendTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <DefectTrendChart data={data.quality.defectTrend} theme={theme} />
                        </div>
                    </div>
                </div>
            );
            case 'downtime': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeParetoTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <DowntimeParetoChart data={data.downtime.downtimePareto} />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeTrendTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <TrendChart 
                                data={data.downtime.downtimeTrend} 
                                lines={[{ dataKey: 'downtime', stroke: '#f97316', name: 'Downtime (min)' }]} 
                                theme={theme}
                                areaLines={['downtime']}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('top5DowntimeTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80">
                            <Top5Table 
                                headers={[t('machineId'), t('totalDowntime')]} 
                                data={data.downtime.top5DowntimeMachines.map(d => ({ 
                                    col1: d.machineId, 
                                    col2: `${d.totalDowntime.toFixed(0)} min`
                                }))} 
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('downtimeByLineTitle')}</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-80">
                            <StackedBarChart 
                                data={data.downtime.downtimeByLine} 
                                keys={data.downtime.uniqueDowntimeReasons} 
                                theme={theme} 
                            />
                        </div>
                    </div>
                </div>
            );
            case 'errorLog': return (
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-cyan-400 border-l-4 border-cyan-400 pl-3">{t('errorLogTitle')}</h2>
                        <button 
                            onClick={handleOpenCreateReportModal}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                        >
                            <PlusCircle size={16} />
                            {t('createErrorReport')}
                        </button>
                    </div>
                    <ErrorLogTable 
                        reports={data.errorReports} 
                        onOpenUpdateModal={handleOpenUpdateReportModal}
                        onStatusUpdate={handleStatusUpdate}
                    />
                </section>
            );
            case 'maintenance':
                const subTabClass = (tabName: MaintenanceSubTab) =>
                    `px-3 py-2 font-medium text-sm rounded-md focus:outline-none transition-colors flex items-center gap-2 ${
                    maintenanceSubTab === tabName
                        ? 'bg-cyan-500 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`;

                return (
                    <section>
                        <div className="mb-4 border-b border-gray-700 pb-2">
                            <nav className="flex space-x-2" aria-label="Maintenance Tabs">
                                <button onClick={() => setMaintenanceSubTab('dashboard')} className={subTabClass('dashboard')}>
                                    <LayoutDashboard size={16} /> {t('maintKpis')}
                                </button>
                                <button onClick={() => setMaintenanceSubTab('pmSchedule')} className={subTabClass('pmSchedule')}>
                                    <CalendarClock size={16} /> {t('pmSchedule')}
                                </button>
                                <button onClick={() => setMaintenanceSubTab('inventory')} className={subTabClass('inventory')}>
                                    <PackageSearch size={16} /> {t('sparePartsTitle')}
                                </button>
                            </nav>
                        </div>
                        {maintenanceSubTab === 'dashboard' ? (
                            <MaintenanceDashboard 
                                data={{
                                    records: data.maintenanceOrders,
                                    kpis: data.maintenance.kpis,
                                    schedule: data.maintenance.schedule,
                                    spareParts: data.maintenance.spareParts,
                                    lowStockParts: data.maintenance.lowStockParts,
                                }}
                                onOpenModal={handleOpenCreateMaintOrderModal}
                                onNavigateToInventory={() => setMaintenanceSubTab('inventory')}
                                onNavigateToSchedule={() => setMaintenanceSubTab('pmSchedule')}
                            />
                        ) : maintenanceSubTab === 'inventory' ? (
                            <SparePartsInventory 
                                parts={data.maintenance.spareParts} 
                                allMaintenanceRecords={data.maintenanceOrders}
                                onPartSelect={handleOpenSparePartDetails}
                                onAddNewPart={() => handleOpenSparePartEditModal(null)}
                                onEditPart={handleOpenSparePartEditModal}
                                onToggleFlag={handleToggleFlagForOrder}
                                onCreateRequest={handleOpenMcPartRequestModal}
                            />
                        ) : (
                            <MaintenanceScheduleView 
                                schedule={data.maintenance.pmSchedule}
                                onCreateWorkOrder={handleCreateMaintOrderFromSchedule}
                            />
                        )}
                    </section>
                );
            case 'purchasing':
                const purchasingSubTabClass = (tabName: PurchasingSubTab) =>
                    `px-3 py-2 font-medium text-sm rounded-md focus:outline-none transition-colors ${
                    purchasingSubTab === tabName
                        ? 'bg-cyan-500 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`;
                return (
                    <section>
                         <div className="flex justify-between items-center mb-4">
                            <div className="border-b border-gray-700 pb-2 flex-grow">
                                <nav className="flex space-x-2" aria-label="Purchasing Tabs">
                                    <button onClick={() => setPurchasingSubTab('mcPart')} className={purchasingSubTabClass('mcPart')}>
                                        {t('mcPartPurchasing')}
                                    </button>
                                    <button onClick={() => setPurchasingSubTab('consumable')} className={purchasingSubTabClass('consumable')}>
                                        {t('consumablePurchasing')}
                                    </button>
                                </nav>
                            </div>
                            <button 
                                onClick={() => {
                                    if (purchasingSubTab === 'consumable') {
                                        setIsConsumableRequestModalOpen(true);
                                    } else {
                                        setIsNewMcPartRequestModalOpen(true);
                                    }
                                }}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105 ml-4"
                            >
                                <PlusCircle size={16} />
                                {t('addNewRequest')}
                            </button>
                        </div>
                        {purchasingSubTab === 'mcPart' ? (
                            <McPartPurchasing requests={data.purchasing.mcPartRequests} t={t} />
                        ) : (
                            <ConsumablePurchasing requests={data.purchasing.consumableRequests} t={t} />
                        )}
                    </section>
                );
            default: return null;
        }
    };

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${theme}`}>
            <DatabaseSchemaPanel isOpen={isDbPanelOpen} onClose={() => setIsDbPanelOpen(false)} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md z-10">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <HamburgerMenu sections={menuSections} />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboardTitle')}</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')} className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <Languages size={20} />
                            </button>
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                        </div>
                    </div>
                     <nav className="px-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                                        activeTab === tab.id
                                            ? 'text-cyan-500 dark:text-cyan-400 border-b-2 border-cyan-500'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                </header>

                <div className="flex-1 flex flex-col overflow-auto p-6 space-y-6">
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
                        onOeeThresholdChange={(val) => setThresholds(t => ({...t, oee: val}))}
                        onAvailabilityThresholdChange={(val) => setThresholds(t => ({...t, availability: val}))}
                        onPerformanceThresholdChange={(val) => setThresholds(t => ({...t, performance: val}))}
                        onQualityThresholdChange={(val) => setThresholds(t => ({...t, quality: val}))}
                    />

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center"><Loader2 size={48} className="animate-spin text-cyan-500" /></div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
                    ) : (
                        renderTabContent()
                    )}
                </div>

                {selectedMachineId && (
                    <MachineDetailsModal
                        isOpen={!!selectedMachineId}
                        onClose={() => setSelectedMachineId(null)}
                        machineInfo={selectedMachineInfo}
                        productionRecord={selectedMachineProduction}
                        downtimeRecords={selectedMachineDowntime}
                        errorHistory={selectedMachineErrorHistory}
                        maintenanceHistory={selectedMachineMaintenanceHistory}
                        plannedMaintenance={selectedMachinePlannedMaintenance}
                        theme={theme}
                    />
                )}
                <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
                {isErrorReportModalOpen && data && (
                    <ErrorReportModal 
                        isOpen={isErrorReportModalOpen}
                        onClose={() => setIsErrorReportModalOpen(false)}
                        onSubmit={handleErrorReportSubmit}
                        onUpdate={handleErrorReportUpdate}
                        reportToUpdate={reportToUpdate}
                        masterData={data.masterData}
                        openMaintenanceOrders={openMaintenanceOrders}
                    />
                )}
                {isMaintenanceOrderModalOpen && data && (
                    <MaintenanceOrderModal
                        isOpen={isMaintenanceOrderModalOpen}
                        onClose={() => setIsMaintenanceOrderModalOpen(false)}
                        onSubmit={handleMaintOrderSubmit}
                        allMachines={data.masterData.machines}
                        allUsers={data.masterData.users}
                        allDefectCauses={data.masterData.defectCauses}
                        openDefects={data.allDefectRecords.filter(d => d.status === 'Open')}
                        currentDate={filters.endDate}
                        allSpareParts={data.masterData.spareParts}
                        defaults={maintenanceOrderDefaults}
                    />
                )}
                {isMachineModalOpen && data && (
                    <MachineEditModal
                        isOpen={isMachineModalOpen}
                        onClose={() => setIsMachineModalOpen(false)}
                        onSubmit={handleMachineModalSubmit}
                        machineToEdit={machineToEdit}
                        allLines={data.availableLines}
                    />
                )}
                 <SparePartDetailsModal
                    isOpen={!!selectedSparePart}
                    onClose={() => setSelectedSparePart(null)}
                    part={selectedSparePart}
                />
                {isConsumableRequestModalOpen && (
                    <ConsumableRequestModal 
                        isOpen={isConsumableRequestModalOpen}
                        onClose={() => setIsConsumableRequestModalOpen(false)}
                        onSubmit={handleConsumableRequestSubmit}
                    />
                )}
                {isMcPartRequestModalOpen && partForMcRequest && (
                    <McPartRequestModal
                        isOpen={isMcPartRequestModalOpen}
                        onClose={() => setIsMcPartRequestModalOpen(false)}
                        onSubmit={handleMcPartRequestSubmit}
                        part={partForMcRequest}
                    />
                )}
                {isNewMcPartRequestModalOpen && (
                    <NewMcPartRequestModal
                        isOpen={isNewMcPartRequestModalOpen}
                        onClose={() => setIsNewMcPartRequestModalOpen(false)}
                        onSubmit={handleNewMcPartRequestSubmit}
                    />
                )}
                {isSparePartEditModalOpen && data && (
                    <SparePartEditModal
                        isOpen={isSparePartEditModalOpen}
                        onClose={() => setIsSparePartEditModalOpen(false)}
                        onSubmit={handleSparePartSubmit}
                        partToEdit={partToEdit}
                    />
                )}
            </main>
        </div>
    );
};

export default App;