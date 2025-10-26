
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Data and Types
import { 
    getDashboardData, 
    getInitialFilterData, 
    updateDefectQuantity,
    getMachineInfo,
    getDefectAdjustmentHistory,
    addDefectData,
    machineInfoData,
} from '../services/dataService';
import { DashboardData, DefectRecord, NewProductionData } from '../types';

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
import DataEntryModal from './DataEntryModal';
import HelpModal from './HelpModal';
import DatabaseSchemaPanel from './DatabaseSchemaPanel';
import AiAnalysis from './AiAnalysis';
import DefectLogTable from './DefectLogTable';
import DefectDetailsModal from './DefectDetailsModal';

// Icons
import { LayoutDashboard, BarChart3, ShieldAlert, AlertTriangle, ListChecks, Database, HelpCircle, PlusCircle } from 'lucide-react';

type Tab = 'overview' | 'performance' | 'quality' | 'downtime' | 'defectLog';

const App: React.FC = () => {
    // State declarations
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('overview');

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
    const [isDataEntryModalOpen, setIsDataEntryModalOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isDbPanelOpen, setIsDbPanelOpen] = useState(false);
    const [selectedDefect, setSelectedDefect] = useState<DefectRecord | null>(null);
    
    const [focusedLine, setFocusedLine] = useState<string | null>(null);
    
    // Data fetching effect
    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await getDashboardData(
                    filters.startDate, filters.endDate, filters.area, filters.shift, filters.status, focusedLine, { signal: controller.signal }
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

    const handleUpdateDefect = useCallback((prodId: number, newQty: number) => {
        const result = updateDefectQuantity(prodId, newQty);
        if (result.success) {
            // Re-fetch data to reflect changes
            setFilters(f => ({...f}));
        } else {
            alert(result.message);
        }
    }, []);
    
    const handleDataEntrySubmit = useCallback((newDefectData: NewProductionData) => {
        addDefectData(newDefectData);
        setIsDataEntryModalOpen(false);
        // Re-fetch to update dashboard
        setFilters(f => ({...f})); 
    }, []);

    const handleNavigateToLog = useCallback((date: string, shift: 'A' | 'B' | 'C') => {
        setActiveTab('overview');
        setFilters(prev => ({
            ...prev,
            startDate: date,
            endDate: date,
            mode: 'single',
            shift: shift,
            // Reset other filters to ensure the record is visible
            area: 'all', 
            status: 'all',
        }));
    }, []);

    const selectedMachineInfo = useMemo(() => {
        if (!selectedMachineId) return null;
        return getMachineInfo(selectedMachineId);
    }, [selectedMachineId]);
    
    const selectedMachineProduction = useMemo(() => {
        if (!selectedMachineId || !data) return null;
        // In date range mode, there might be multiple entries. For simplicity, we find the first one.
        return data.productionLog.find(p => p.MACHINE_ID === selectedMachineId) || null;
    }, [selectedMachineId, data]);

    const selectedMachineDowntime = useMemo(() => {
        if (!selectedMachineId || !data) return [];
        return data.downtimeRecords.filter(d => d.MACHINE_ID === selectedMachineId);
    }, [selectedMachineId, data]);

    const selectedMachineAdjHistory = useMemo(() => {
        if (!selectedMachineId) return [];
        // Re-fetch history every time data changes to ensure it's up-to-date
        return getDefectAdjustmentHistory(selectedMachineId);
    }, [selectedMachineId, data]);

    const handleBarClick = useCallback((payload: any) => {
        if (payload?.name) {
            setFocusedLine(line => line === payload.name ? null : payload.name);
        }
    }, []);
    
    const menuSections = [
        { title: 'Actions', items: [
            { label: 'Enter Defect Data', icon: <PlusCircle size={16} />, onClick: () => setIsDataEntryModalOpen(true) },
        ]},
        { title: 'System', items: [
            { label: 'View Database Tables', icon: <Database size={16} />, onClick: () => setIsDbPanelOpen(true) },
            { label: 'Help / User Guide', icon: <HelpCircle size={16} />, onClick: () => setIsHelpModalOpen(true) },
        ]}
    ];

    const renderTabContent = () => {
        if (!data) return null;
        switch (activeTab) {
            case 'overview': return (
                <div className="space-y-6">
                    <section>
                         <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">
                            Shop Floor Status
                            <span className="text-sm font-normal text-gray-400 ml-2">Click a machine for details.</span>
                        </h2>
                         <ShopFloorLayout allMachines={data.allMachineInfo} machineStatus={data.machineStatus} onMachineSelect={setSelectedMachineId} />
                    </section>
                    <section>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Key Performance Indicators</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2">
                                <OeeGauge value={data.summary.avgOee} availability={data.summary.avgAvailability} performance={data.summary.avgPerformance} quality={data.summary.avgQuality} theme={theme} oeeThreshold={thresholds.oee} />
                            </div>
                            <KpiCard title="Total Production" value={data.summary.totalProduction} unit=" pcs" precision={0} />
                            <KpiCard title="Total Defects" value={data.summary.totalDefects} unit=" pcs" precision={0} />
                            <KpiCard title="Total Downtime" value={data.summary.totalDowntime} unit=" min" precision={0} />
                        </div>
                    </section>
                     <AiAnalysis data={data} filters={filters} />
                    <section>
                        <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Production Log</h2>
                        <ProductionLogTable data={data.productionLog} onMachineSelect={setSelectedMachineId} onUpdateDefect={handleUpdateDefect} oeeThreshold={thresholds.oee / 100} uniqueDefectTypes={[...new Set(data.allDefectRecords.map(d => d.DEFECT_TYPE))]} />
                    </section>
                </div>
            );
            case 'performance': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2"><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">OEE Trend</h2><TrendChart data={data.performance.sevenDayTrend} lines={[{ dataKey: 'oee', stroke: '#22d3ee', name: 'OEE' }, { dataKey: 'availability', stroke: '#a78bfa', name: 'Availability' }, { dataKey: 'performance', stroke: '#facc15', name: 'Performance' }, { dataKey: 'quality', stroke: '#4ade80', name: 'Quality' }]} isPercentage theme={theme} areaLines={['oee']} targetLines={[{value: thresholds.oee/100, label: 'Target', stroke: '#f87171'}]} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Production Distribution by Line</h2><BoxplotChart data={data.performance.productionBoxplot} theme={theme} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">OEE Heatmap by Line & Shift</h2><HeatmapChart data={data.performance.oeeHeatmap} theme={theme} /></div>
                </div>
            );
            case 'quality': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Defect Pareto Analysis</h2><ParetoChart data={data.quality.defectPareto} barKey="value" lineKey="cumulative" barColor="#ef4444" lineColor="#f97316" theme={theme} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Top 5 Lines by Defect Rate</h2><Top5Table headers={['Line ID', 'Defect Rate', 'Total Defects', 'Total Production']} data={data.quality.top5DefectLines.map(d => ({ col1: d.lineId, col2: `${(d.defectRate * 100).toFixed(2)}%`, col3: d.totalDefects.toLocaleString(), col4: d.totalProduction.toLocaleString() }))} /></div>
                    <div className="lg:col-span-2"><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Defect Count Trend</h2><DefectTrendChart data={data.quality.defectTrend} theme={theme} /></div>
                </div>
            );
            case 'downtime': return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Downtime Pareto Analysis</h2><ParetoChart data={data.downtime.downtimePareto} barKey="value" lineKey="cumulative" barColor="#f59e0b" lineColor="#eab308" theme={theme} /></div>
                    <div><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Top 5 Machines by Downtime</h2><Top5Table headers={['Machine ID', 'Total Downtime (min)']} data={data.downtime.top5DowntimeMachines.map(d => ({ col1: d.machineId, col2: d.totalDowntime.toFixed(0) }))} /></div>
                    <div className="lg:col-span-2"><h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Downtime by Line and Reason</h2><StackedBarChart data={data.downtime.downtimeByLine} keys={data.downtime.uniqueDowntimeReasons} theme={theme} /></div>
                </div>
            );
            case 'defectLog': return (
                 <section>
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">Detailed Defect Log</h2>
                    <DefectLogTable data={data.allDefectRecords} onViewDetails={setSelectedDefect} />
                </section>
            );
        }
    };
    
    const TabButton: React.FC<{ tab: Tab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
        <button onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}>
            {icon}{label}
        </button>
    );

    return (
        <div className={`${theme} bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200 font-sans`}>
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <HamburgerMenu sections={menuSections} />
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">OEE Dashboard</h1>
                        {focusedLine && <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full">Focus: {focusedLine}</span>}
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-6 space-y-6">
                <FilterBar 
                    startDate={filters.startDate} endDate={filters.endDate} selectedArea={filters.area} selectedShift={filters.shift}
                    dateSelectionMode={filters.mode} selectedStatus={filters.status} availableAreas={availableAreas}
                    oeeThreshold={thresholds.oee} availabilityThreshold={thresholds.availability}
                    performanceThreshold={thresholds.performance} qualityThreshold={thresholds.quality}
                    onFilterChange={handleFilterChange} onClearFilters={handleClearFilters}
                    onOeeThresholdChange={(v) => setThresholds(t => ({...t, oee: v}))}
                    onAvailabilityThresholdChange={(v) => setThresholds(t => ({...t, availability: v}))}
                    onPerformanceThresholdChange={(v) => setThresholds(t => ({...t, performance: v}))}
                    onQualityThresholdChange={(v) => setThresholds(t => ({...t, quality: v}))}
                />

                <nav className="border-b border-gray-700 flex items-center overflow-x-auto">
                    <TabButton tab="overview" label="Tổng Quan" icon={<LayoutDashboard size={16} />} />
                    <TabButton tab="performance" label="Hiệu Suất" icon={<BarChart3 size={16} />} />
                    <TabButton tab="quality" label="Chất Lượng" icon={<ShieldAlert size={16} />} />
                    <TabButton tab="downtime" label="Dừng Máy" icon={<AlertTriangle size={16} />} />
                    <TabButton tab="defectLog" label="Nhật Ký Lỗi" icon={<ListChecks size={16} />} />
                </nav>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin" style={{borderTopColor: '#22d3ee'}}></div></div>
                ) : error ? (
                    <div className="text-center text-red-500 bg-red-900/50 p-4 rounded-md">{error}</div>
                ) : (
                    renderTabContent()
                )}
            </main>

            {/* Modals */}
            <MachineDetailsModal isOpen={!!selectedMachineId} onClose={() => setSelectedMachineId(null)} machineInfo={selectedMachineInfo} productionRecord={selectedMachineProduction} downtimeRecords={selectedMachineDowntime} adjustmentHistory={selectedMachineAdjHistory} theme={theme} />
            <DataEntryModal isOpen={isDataEntryModalOpen} onClose={() => setIsDataEntryModalOpen(false)} onSubmit={handleDataEntrySubmit} availableMachines={machineInfoData.map(m => ({id: m.MACHINE_ID, line: m.LINE_ID}))} currentDate={defaultDate} uniqueDefectTypes={data ? [...new Set(data.allDefectRecords.map(d => d.DEFECT_TYPE))] : []} />
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            <DatabaseSchemaPanel isOpen={isDbPanelOpen} onClose={() => setIsDbPanelOpen(false)} />
            <DefectDetailsModal 
                isOpen={!!selectedDefect} 
                onClose={() => setSelectedDefect(null)} 
                defect={selectedDefect} 
                onNavigateToLog={handleNavigateToLog}
            />
        </div>
    );
};

export default App;
