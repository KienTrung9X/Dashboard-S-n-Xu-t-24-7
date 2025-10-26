import { 
    ProductionDaily, DowntimeRecord, DashboardData, DataPoint, TrendData, 
    Top5DefectLine, Top5DowntimeMachine, StackedBarDataPoint, BoxplotDataPoint, 
    HeatmapDataPoint, MachineInfo, DefectAdjustmentLog, MachineStatusData, 
    OeeTarget, User, Shift, DefectType, DefectCause, SparePart,
    ErrorReport, ErrorImage, ErrorHistory, EnrichedErrorReport, NewErrorReportData, UpdateErrorData, ErrorReportStatus,
    // FIX: Added missing type imports
    DefectRecord, EnrichedDefectRecord, MaintenanceOrder, MaintenancePartUsage, EnrichedMaintenanceOrder, NewMaintenanceOrderData, CauseCategory, NewMachineData,
    McPartPurchaseRequest, ConsumablePurchaseRequest, PurchaseStatus, NewConsumableRequestData, NewSparePartData, NewMcPartRequestData,
    MaintenanceSchedule, PmPartsTemplate, EnrichedMaintenanceSchedule, McPartOrder,
    MachineMaintenanceStats, DowntimeCauseStats
} from '../types';
import { quantile } from 'simple-statistics';

// --- MASTER DATA MOCKS ---

export const usersData: User[] = [
    { id: 1, username: 'admin', full_name: 'Admin', role: 'Admin' },
    { id: 101, username: 'vhung', full_name: 'Văn Hùng', role: 'Maintenance' },
    { id: 102, username: 'tlan', full_name: 'Thị Lan', role: 'Maintenance' },
    { id: 103, username: 'mtri', full_name: 'Minh Trí', role: 'Maintenance' },
    { id: 201, username: 'operatorA', full_name: 'Operator Ca A', role: 'Operator' },
    { id: 202, username: 'qa_team', full_name: 'QA Team', role: 'QA' },
    { id: 203, username: 'supervisor.b', full_name: 'Supervisor B', role: 'Supervisor' },
];

export const shiftsData: Shift[] = [
    { id: 1, code: 'A', name: 'Ca A (06:00 - 14:00)' },
    { id: 2, code: 'B', name: 'Ca B (14:00 - 22:00)' },
    { id: 3, code: 'C', name: 'Ca C (22:00 - 06:00)' },
];

export const defectTypesData: DefectType[] = [
    { id: 1, code: 'SKIP_STITCH', name: 'Skip stitch' },
    { id: 2, code: 'TAPE_JAM', name: 'Tape jam' },
    { id: 3, code: 'COSMETIC', name: 'Cosmetic' },
    { id: 4, code: 'MISALIGNED', name: 'Misaligned' },
    { id: 5, code: 'PAINT_DRIP', name: 'Paint Drip' },
    { id: 6, code: 'SCRATCH', name: 'Scratch' },
    { id: 7, code: 'PACKAGING', name: 'Packaging' },
    { id: 8, code: 'TRIM', name: 'Material Trim' },
];

export const defectCausesData: DefectCause[] = [
    { id: 1, category: 'Man', detail: null },
    { id: 2, category: 'Machine', detail: null },
    { id: 3, category: 'Material', detail: null },
    { id: 4, category: 'Method', detail: null },
    { id: 5, category: 'Environment', detail: null },
];

export const LINE_TO_AREA_MAP: Record<string, string> = {
    '31': 'Area Stamping', '32': 'Area Assembly', '41': 'Area Painting',
    '42': 'Area Painting', '51': 'Area Finishing',
};

export let machineInfoData: MachineInfo[] = [
    { id: 1, MACHINE_ID: 'M01', MACHINE_NAME: 'Assembler Alpha', LINE_ID: '32', IDEAL_CYCLE_TIME: 0.045, DESIGN_SPEED: 22, STATUS: 'active', x: 30, y: 20 },
    { id: 2, MACHINE_ID: 'M02', MACHINE_NAME: 'Assembler Beta', LINE_ID: '32', IDEAL_CYCLE_TIME: 0.045, DESIGN_SPEED: 22, STATUS: 'active', x: 30, y: 60 },
    { id: 3, MACHINE_ID: 'M03', MACHINE_NAME: 'Stamping Press 1', LINE_ID: '31', IDEAL_CYCLE_TIME: 0.06, DESIGN_SPEED: 17, STATUS: 'active', x: 10, y: 30 },
    { id: 4, MACHINE_ID: 'M04', MACHINE_NAME: 'Paint Booth A', LINE_ID: '41', IDEAL_CYCLE_TIME: 0.25, DESIGN_SPEED: 4, STATUS: 'inactive', x: 55, y: 30 },
    { id: 5, MACHINE_ID: 'M05', MACHINE_NAME: 'Paint Booth B', LINE_ID: '42', IDEAL_CYCLE_TIME: 0.24, DESIGN_SPEED: 4, STATUS: 'active', x: 55, y: 70 },
    { id: 6, MACHINE_ID: 'M06', MACHINE_NAME: 'Finishing Line 1', LINE_ID: '51', IDEAL_CYCLE_TIME: 0.08, DESIGN_SPEED: 12, STATUS: 'active', x: 80, y: 50 },
];

export let sparePartsData: SparePart[] = [
    // Sufficient stock
    { id: 1, part_code: 'FIL-001', name: 'Air Filter', location: 'Aisle 3, Bin 12', 
      available: 15, in_transit: 0, reserved: 2, used_in_period: 8, safety_stock: 8, reorder_point: 10,
      maintenance_interval_days: 30, flagged_for_order: false
    },
    // Almost out
    { id: 2, part_code: 'BLT-A300', name: 'Belt A300', location: 'Aisle 3, Bin 5', 
      available: 3, in_transit: 0, reserved: 0, used_in_period: 8, safety_stock: 3, reorder_point: 5,
      flagged_for_order: false
    },
    // Sufficient stock
     { id: 3, part_code: 'BEAR-210', name: 'Ball Bearing 210mm', location: 'Aisle 3, Bin 5',
      available: 50, in_transit: 20, reserved: 5, used_in_period: 15, safety_stock: 15, reorder_point: 20,
      maintenance_interval_days: 365, flagged_for_order: false 
    },
     // Need to order
    { id: 4, part_code: 'NOZ-PNT-A', name: 'Paint Nozzle Type A', location: 'Aisle 5, Bin 1',
      available: 4, in_transit: 0, reserved: 1, used_in_period: 5, safety_stock: 5, reorder_point: 5,
      flagged_for_order: false
    },
    // From PRD example: "Cần đặt hàng" (Need to order)
    { id: 5, part_code: 'CP-F20005', name: 'Coupling F20005', location: 'Aisle 2, Bin 8', 
      available: 1, in_transit: 1, reserved: 2, used_in_period: 15, safety_stock: 4, reorder_point: 6,
      flagged_for_order: true
    },
    // From PRD example: "Đủ" (Sufficient)
    { id: 6, part_code: 'BRG-6301ZZE', name: 'Bearing 6301ZZE', location: 'Aisle 1, Bin 4', 
      available: 5, in_transit: 2, reserved: 1, used_in_period: 20, safety_stock: 3, reorder_point: 5,
      flagged_for_order: false,
    },
];

export const mcPartOrdersData: McPartOrder[] = [
    { id: 1, area: '312', order_id: 'PO202510A', item_code: 'BRG-6301ZZE', item_name: 'Bearing 6301ZZE', qty_order: 2, order_date: '2025-10-01', expected_date: '2025-10-28', supplier: 'NSK Vietnam', status: 'In Transit' },
    { id: 2, area: '312', order_id: 'PO202510B', item_code: 'CP-F20005', item_name: 'Coupling F20005', qty_order: 1, order_date: '2025-10-03', expected_date: '2025-10-30', supplier: 'Miba', status: 'Delayed' },
    { id: 3, area: '410', order_id: 'PO202509C', item_code: 'NOZ-PNT-A', item_name: 'Paint Nozzle Type A', qty_order: 5, order_date: '2025-09-15', expected_date: '2025-10-15', supplier: 'Graco Inc.', status: 'Received' },
    { id: 4, area: '320', order_id: 'PO202510D', item_code: 'BEAR-210', item_name: 'Ball Bearing 210mm', qty_order: 20, order_date: '2025-10-10', expected_date: '2025-11-05', supplier: 'SKF', status: 'In Transit' },
];


const machineIdMap = new Map(machineInfoData.map(m => [m.id, m]));

// NEW MOCK DATA for PM Scheduling
export const maintenanceScheduleData: MaintenanceSchedule[] = [
    { id: 1, machine_id: 1, pm_type: 'PM-12M', last_pm_date: '2024-11-15', cycle_days: 365 },
    { id: 2, machine_id: 1, pm_type: 'PM-1M', last_pm_date: '2025-10-10', cycle_days: 30 },
    { id: 3, machine_id: 2, pm_type: 'PM-12M', last_pm_date: '2025-01-20', cycle_days: 365 },
    { id: 4, machine_id: 2, pm_type: 'PM-1M', last_pm_date: '2025-09-28', cycle_days: 30 },
    { id: 5, machine_id: 3, pm_type: 'PM-24M', last_pm_date: '2024-02-10', cycle_days: 730 },
    { id: 6, machine_id: 3, pm_type: 'PM-1M', last_pm_date: '2025-10-25', cycle_days: 30 },
    { id: 7, machine_id: 5, pm_type: 'PM-12M', last_pm_date: '2024-12-01', cycle_days: 365 },
    { id: 8, machine_id: 6, pm_type: 'PM-36M', last_pm_date: '2023-05-20', cycle_days: 1095 },
];

export const pmPartsTemplateData: PmPartsTemplate[] = [
    { pm_type: 'PM-1M', machine_id: 0, parts: [{ part_id: 1, qty: 1 }] }, // General PM-1M: 1 Air filter
    { pm_type: 'PM-12M', machine_id: 1, parts: [{ part_id: 2, qty: 1 }, { part_id: 3, qty: 2 }] }, // M01: Belt & Bearings
    { pm_type: 'PM-12M', machine_id: 2, parts: [{ part_id: 2, qty: 1 }, { part_id: 3, qty: 2 }] }, // M02: Belt & Bearings
    { pm_type: 'PM-12M', machine_id: 5, parts: [{ part_id: 4, qty: 2 }] }, // M05: 2 Paint nozzles
    { pm_type: 'PM-24M', machine_id: 3, parts: [{ part_id: 3, qty: 8 }] }, // M03: 8 Ball bearings
];


// --- MOCK DATA FOR MAINTENANCE ---
export let maintenanceOrdersData: MaintenanceOrder[] = [];
export let maintenancePartUsageData: MaintenancePartUsage[] = [];

(() => {
    maintenanceOrdersData = [
        { id: 1, machine_id: 2, type: 'Breakdown', priority: 'High', status: 'Done', reported_by_id: 203, assigned_to_id: 101, symptom: 'Machine M02 stopped, loud grinding noise reported.', downtime_min: 160, created_at: '2025-10-28T14:30:00Z', completed_at: '2025-10-28T17:10:00Z', linked_defect_id: null, updated_cause_id: 2 },
        { id: 2, machine_id: 5, type: 'CM', priority: 'Medium', status: 'Done', reported_by_id: 102, assigned_to_id: 102, symptom: 'Paint nozzle clogged, causing streaks.', downtime_min: 45, created_at: '2025-10-27T09:00:00Z', completed_at: '2025-10-27T09:45:00Z', linked_defect_id: null, updated_cause_id: null },
        { id: 3, machine_id: 1, type: 'PM', priority: 'Low', status: 'Done', reported_by_id: 1, assigned_to_id: 103, symptom: 'Quarterly conveyor belt check', downtime_min: 30, created_at: '2025-10-25T08:00:00Z', completed_at: '2025-10-25T08:30:00Z', linked_defect_id: null, updated_cause_id: null },
        { id: 4, machine_id: 3, type: 'Breakdown', priority: 'High', status: 'InProgress', reported_by_id: 201, assigned_to_id: 101, symptom: 'Hydraulic leak detected.', downtime_min: null, created_at: '2025-10-30T10:15:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null },
        { id: 5, machine_id: 6, type: 'PM', priority: 'Medium', status: 'Open', reported_by_id: 1, assigned_to_id: null, symptom: 'Annual bearing lubrication', downtime_min: null, created_at: '2025-11-05T09:00:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null },
        { id: 6, machine_id: 1, type: 'PM', priority: 'Medium', status: 'Open', reported_by_id: 1, assigned_to_id: null, symptom: 'Filter replacement (90 days)', downtime_min: null, created_at: '2025-11-02T09:00:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null },
        { id: 7, machine_id: 3, type: 'PM', priority: 'Low', status: 'Open', reported_by_id: 1, assigned_to_id: null, symptom: 'Scheduled inspection', downtime_min: null, created_at: '2025-10-20T09:00:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null },
    ];
    maintenancePartUsageData = [
        { order_id: 1, part_id: 2, qty_used: 1 },
        { order_id: 1, part_id: 3, qty_used: 4 },
        { order_id: 2, part_id: 4, qty_used: 1 },
    ];
})();

// --- NEW MOCK DATA FOR PURCHASING MODULE ---
export let mcPartPurchaseRequestsData: McPartPurchaseRequest[] = [
    { id: 1, item_code: 'BELT-045', item_name: 'Conveyor Belt M01/M02', quantity: 5, reason: 'Restock for upcoming PM cycle', status: 'Pending', request_date: '2025-10-29' },
    { id: 2, item_code: 'BEAR-210', item_name: 'Ball Bearing 210mm', quantity: 20, reason: 'Stock running low, critical component', status: 'Approved', request_date: '2025-10-28' },
    { id: 3, item_code: 'NOZ-PNT-A', item_name: 'Paint Nozzle Type A', quantity: 10, reason: 'Breakdown replacement stock', status: 'Ordered', request_date: '2025-10-27' },
];

export let consumablePurchaseRequestsData: ConsumablePurchaseRequest[] = [
    { id: 1, name: 'Industrial Lubricant', component_code: 'LUBE-SYN-5L', specs: 'Synthetic, High-temp, 5L canister', image_url: 'https://placehold.co/100x100/a5f3fc/083344?text=Lube', quantity: 10, order_month: '2025-11', receipt_month: '2025-11', notes: 'Urgent request for Line 32', status: 'Ordered' },
    { id: 2, name: 'Cleaning Solvent', component_code: 'SOLV-GEN-20L', specs: 'General purpose, 20L drum', image_url: 'https://placehold.co/100x100/f9a8d4/500724?text=Solvent', quantity: 5, order_month: '2025-11', receipt_month: '2025-12', notes: null, status: 'Pending' },
    { id: 3, name: 'Safety Gloves', component_code: 'GLV-STD-L', specs: 'Standard, Large, Pack of 100', image_url: 'https://placehold.co/100x100/fde047/422006?text=Gloves', quantity: 50, order_month: '2025-10', receipt_month: '2025-11', notes: 'Monthly restock', status: 'Received' },
];

// --- NEW MOCK DATA FOR ERROR REPORTING ---
export let errorReportsData: ErrorReport[] = [];
export let errorImagesData: ErrorImage[] = [];
export let errorHistoryData: ErrorHistory[] = [];

// Initialize mock data
(() => {
    let reportId = 1;
    for (let i = 0; i < 25; i++) {
        const date = new Date('2025-10-30T10:00:00Z');
        date.setHours(date.getHours() - i * 3);
        const machine = machineInfoData[i % machineInfoData.length];
        const defectType = defectTypesData[i % defectTypesData.length];
        
        let status: ErrorReportStatus = 'Reported';
        let technician_id = null, fix_time = null, action_taken = null, root_cause = null, cause_category = null;
        let verify_by = null, verify_time = null;
        
        const statusCycle = i % 7;
        if (statusCycle > 0) status = 'In Progress';
        if (statusCycle > 1) status = 'Fixed';
        if (statusCycle > 3) status = 'Closed';
        if (statusCycle === 2) status = 'Not Machine Issue';

        if(status !== 'Reported') {
            technician_id = usersData.find(u => u.role === 'Maintenance')!.id;
        }
        if(status === 'Fixed' || status === 'Not Machine Issue' || status === 'Closed') {
            const fixDate = new Date(date);
            fixDate.setHours(fixDate.getHours() + 1);
            fix_time = fixDate.toISOString();
            action_taken = "Checked connections and rebooted the controller.";
            root_cause = "Sensor misalignment due to vibration.";
            cause_category = 'Machine';
        }
        if(status === 'Closed') {
            const verifyDate = new Date(fix_time!);
            verifyDate.setMinutes(verifyDate.getMinutes() + 15);
            verify_by = usersData.find(u => u.role === 'Supervisor')!.id;
            verify_time = verifyDate.toISOString();
        }

        const newReport: ErrorReport = {
            id: reportId,
            reportNo: `ERR202510${30 - Math.floor(i / 8)}-${String(reportId).padStart(3, '0')}`,
            machine_id: machine.id,
            shift_id: (i % 3) + 1,
            operator_id: usersData.find(u => u.role === 'Operator')!.id,
            report_time: date.toISOString(),
            defect_type: defectType.name,
            defect_description: `Machine ${machine.MACHINE_ID} is producing items with ${defectType.name.toLowerCase()}. Please investigate.`,
            severity: (['High', 'Medium', 'Low'] as const)[i % 3],
            status,
            technician_id, fix_time, action_taken, root_cause, cause_category,
            verify_by, verify_time,
            note: status === 'Not Machine Issue' ? 'Technician confirmed machine is operating to spec. Issue likely related to material batch.' : null,
            created_at: date.toISOString(),
            updated_at: date.toISOString(),
            linked_maintenance_order_id: null,
        };
        errorReportsData.push(newReport);

        // Add history
        errorHistoryData.push({ id: errorHistoryData.length+1, error_id: reportId, changed_by: newReport.operator_id, old_status: null, new_status: 'Reported', note: 'Initial report.', changed_at: newReport.report_time});
        if(newReport.status !== 'Reported') {
            const progressDate = new Date(date);
            progressDate.setMinutes(date.getMinutes() + 15);
            errorHistoryData.push({ id: errorHistoryData.length+1, error_id: reportId, changed_by: newReport.technician_id!, old_status: 'Reported', new_status: 'In Progress', note: 'Acknowledged, starting investigation.', changed_at: progressDate.toISOString()});
        }
        if(newReport.fix_time) {
             errorHistoryData.push({ id: errorHistoryData.length+1, error_id: reportId, changed_by: newReport.technician_id!, old_status: 'In Progress', new_status: newReport.status, note: 'Work completed.', changed_at: newReport.fix_time});
        }
        if(newReport.verify_time) {
             errorHistoryData.push({ id: errorHistoryData.length+1, error_id: reportId, changed_by: newReport.verify_by!, old_status: 'Fixed', new_status: 'Closed', note: 'Operator confirmed resolution.', changed_at: newReport.verify_time});
        }

        // Add images
        errorImagesData.push({id: errorImagesData.length+1, error_id: reportId, uploaded_by: newReport.operator_id, role: 'Operator', image_url: 'https://placehold.co/400x300/f87171/white?text=Defect', description: 'Photo from operator', uploaded_at: newReport.report_time });
        if(newReport.fix_time) {
            errorImagesData.push({id: errorImagesData.length+1, error_id: reportId, uploaded_by: newReport.technician_id!, role: 'Maintenance', image_url: 'https://placehold.co/400x300/4ade80/white?text=Fixed', description: 'Replaced part', uploaded_at: newReport.fix_time });
        }
        
        reportId++;
    }
})();

export let productionDailyData: ProductionDaily[] = Array.from({ length: 30 }).flatMap((_, i): ProductionDaily[] => {
    const date = new Date('2025-10-30');
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().slice(0, 10);
    const shifts: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    return [
        { Prod_ID: i * 6 + 1, COMP_DAY: dateString, LINE_ID: '31', MACHINE_ID: 'M03', ITEM_CODE: '03CI Assy', ACT_PRO_QTY: 20500 + i * 50, DEFECT_QTY: 50 + i * 3, RUN_TIME_MIN: 1400 - i * 5, DOWNTIME_MIN: 40 + i * 5, IDEAL_CYCLE_TIME: 0.06, OEE: 0.90 - i * 0.008, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'active' },
        { Prod_ID: i * 6 + 2, COMP_DAY: dateString, LINE_ID: '32', MACHINE_ID: 'M01', ITEM_CODE: '05CITape', ACT_PRO_QTY: 28000 + i * 200, DEFECT_QTY: 120 - i * 5, RUN_TIME_MIN: 1320 - i * 10, DOWNTIME_MIN: 120 + i * 10, IDEAL_CYCLE_TIME: 0.045, OEE: 0.89 - i * 0.01, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'active' },
        { Prod_ID: i * 6 + 3, COMP_DAY: dateString, LINE_ID: '32', MACHINE_ID: 'M02', ITEM_CODE: '05CITape', ACT_PRO_QTY: 27000 - i * 150, DEFECT_QTY: 200 + i * 8, RUN_TIME_MIN: 1280 + i * 5, DOWNTIME_MIN: 160 - i * 8, IDEAL_CYCLE_TIME: 0.045, OEE: 0.84 + i * 0.005, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'active' },
        { Prod_ID: i * 6 + 4, COMP_DAY: dateString, LINE_ID: '41', MACHINE_ID: 'M04', ITEM_CODE: 'Panel_A', ACT_PRO_QTY: 5000 - i * 100, DEFECT_QTY: 80 + i * 2, RUN_TIME_MIN: 1300, DOWNTIME_MIN: 140, IDEAL_CYCLE_TIME: 0.25, OEE: 0.82 - i*0.01, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'inactive' },
        { Prod_ID: i * 6 + 5, COMP_DAY: dateString, LINE_ID: '42', MACHINE_ID: 'M05', ITEM_CODE: 'Panel_B', ACT_PRO_QTY: 5200 + i * 50, DEFECT_QTY: 60 - i, RUN_TIME_MIN: 1350, DOWNTIME_MIN: 90, IDEAL_CYCLE_TIME: 0.24, OEE: 0.88 + i*0.005, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'active' },
        { Prod_ID: i * 6 + 6, COMP_DAY: dateString, LINE_ID: '51', MACHINE_ID: 'M06', ITEM_CODE: 'Final Assy', ACT_PRO_QTY: 15000 + i * 100, DEFECT_QTY: 150 - i * 4, RUN_TIME_MIN: 1380 - i*10, DOWNTIME_MIN: 60 + i*10, IDEAL_CYCLE_TIME: 0.08, OEE: 0.91 - i*0.002, shift_id: (i%3)+1, SHIFT: shifts[i%3], STATUS: 'active' },
    ];
}).reverse();

export let downtimeRecords: DowntimeRecord[] = [];
(() => {
    productionDailyData.forEach(p => {
        if (p.DOWNTIME_MIN > 30) {
            downtimeRecords.push({
                Downtime_ID: downtimeRecords.length + 1,
                COMP_DAY: p.COMP_DAY,
                MACHINE_ID: p.MACHINE_ID,
                DOWNTIME_REASON: ['Power Outage', 'Material Jam', 'Tool Changeover', 'Operator Break'][downtimeRecords.length % 4],
                DOWNTIME_MIN: p.DOWNTIME_MIN,
                START_TIME: '10:00',
                END_TIME: '11:00'
            });
        }
    });
})();

export let defectRecords: DefectRecord[] = [];
(() => {
    let defectId = 1;
    productionDailyData.forEach(p => {
        if (p.DEFECT_QTY > 0) {
            const numDefectEntries = Math.floor(Math.random() * 3) + 1;
            let remainingQty = p.DEFECT_QTY;
            for (let i = 0; i < numDefectEntries && remainingQty > 0; i++) {
                const defectType = defectTypesData[defectId % defectTypesData.length];
                const cause = defectCausesData[defectId % defectCausesData.length];
                const quantity = i === numDefectEntries - 1 ? remainingQty : Math.floor(Math.random() * (remainingQty / 2)) + 1;
                if (quantity <= 0) continue;
                remainingQty -= quantity;

                defectRecords.push({
                    id: defectId++,
                    work_date: p.COMP_DAY,
                    machine_id: machineInfoData.find(m => m.MACHINE_ID === p.MACHINE_ID)!.id,
                    shift_id: p.shift_id,
                    defect_type_id: defectType.id,
                    cause_id: cause.id,
                    quantity: quantity,
                    note: `Note for ${defectType.name} on ${p.MACHINE_ID}. Operator observed issue during routine check.`,
                    severity: (['Low', 'Medium', 'High'] as const)[defectId % 3],
                    status: 'Closed',
                    is_abnormal: Math.random() > 0.5,
                    reporter_id: usersData.find(u => u.role === 'Operator')!.id,
                    linked_maintenance_order_id: null,
                    image_urls: Math.random() > 0.7 ? ['https://placehold.co/100x100/f87171/white?text=Defect1', 'https://placehold.co/100x100/fb923c/white?text=Defect2'] : [],
                });
            }
        }
    });
})();

let defectAdjustmentLogs: DefectAdjustmentLog[] = [];

export const oeeTargetsData: OeeTarget[] = [
    { id: 1, level: 'Line', line_id: '31', target_oee: 0.85, target_output: 21000, target_defect_rate: 0.003, effective_from: '2025-01-01', effective_to: null },
    { id: 2, level: 'Line', line_id: '32', target_oee: 0.90, target_output: 55000, target_defect_rate: 0.005, effective_from: '2025-01-01', effective_to: null },
];

export const getInitialFilterData = () => {
    return {
        availableAreas: ['all', ...Object.values(LINE_TO_AREA_MAP)],
        defaultDate: '2025-10-30',
        defaultArea: 'all',
    };
};

export const getMachineInfo = (machineId: string): MachineInfo | null => {
    return machineInfoData.find(m => m.MACHINE_ID === machineId) || null;
}

export const addMachine = (data: NewMachineData) => {
    const newId = Math.max(...machineInfoData.map(m => m.id)) + 1;
    const newLineId = data.LINE_ID;
    const machinesInLine = machineInfoData.filter(m => m.LINE_ID === newLineId);
    
    // Simple positioning logic
    const x = machinesInLine.length > 0 ? machinesInLine[0].x : 10;
    const y = 20 + (machinesInLine.length * 40) % 70;

    const newMachine: MachineInfo = {
        ...data,
        id: newId,
        x: x,
        y: y,
    };
    machineInfoData.unshift(newMachine);
};

export const updateMachine = (machineId: number, data: Partial<MachineInfo>) => {
    const machineIndex = machineInfoData.findIndex(m => m.id === machineId);
    if (machineIndex > -1) {
        machineInfoData[machineIndex] = {
            ...machineInfoData[machineIndex],
            ...data,
        };
    }
};

export const addErrorReport = (data: NewErrorReportData) => {
    const machine = machineInfoData.find(m => m.id === data.machine_id);
    const newId = Math.max(...errorReportsData.map(r => r.id)) + 1;
    const newReport: ErrorReport = {
        ...data,
        id: newId,
        reportNo: `ERR20251030-${String(newId).padStart(3, '0')}`,
        report_time: new Date().toISOString(),
        status: 'Reported',
        root_cause: null,
        cause_category: null,
        action_taken: null,
        technician_id: null,
        fix_time: null,
        verify_by: null,
        verify_time: null,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_maintenance_order_id: data.linked_maintenance_order_id || null,
    };
    errorReportsData.unshift(newReport);
    // Add history
    errorHistoryData.push({ id: errorHistoryData.length + 1, error_id: newId, changed_by: data.operator_id, old_status: null, new_status: 'Reported', note: 'Initial report.', changed_at: newReport.report_time });
};

export const updateErrorReport = (reportId: number, updateData: Partial<UpdateErrorData>, newStatus: ErrorReportStatus) => {
    const reportIndex = errorReportsData.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        const oldReport = { ...errorReportsData[reportIndex] };
        errorReportsData[reportIndex] = {
            ...oldReport,
            ...updateData,
            status: newStatus,
            updated_at: new Date().toISOString(),
        };

        if (newStatus === 'Fixed' || newStatus === 'Not Machine Issue') {
            errorReportsData[reportIndex].fix_time = new Date().toISOString();
        }
        if (newStatus === 'Closed') {
            errorReportsData[reportIndex].verify_time = new Date().toISOString();
            // Mock verifier
            errorReportsData[reportIndex].verify_by = usersData.find(u => u.role === 'Supervisor')?.id || null;
        }

        // Add history
        const changed_by = newStatus === 'In Progress' ? oldReport.operator_id : (updateData.technician_id || oldReport.technician_id || 1);
        errorHistoryData.push({
            id: errorHistoryData.length + 1,
            error_id: reportId,
            changed_by: changed_by,
            old_status: oldReport.status,
            new_status: newStatus,
            note: 'Status updated.',
            changed_at: new Date().toISOString()
        });
    }
};

export const addMaintenanceOrder = (data: NewMaintenanceOrderData) => {
    const newId = Math.max(...maintenanceOrdersData.map(o => o.id), 0) + 1;
    const newOrder: MaintenanceOrder = {
        machine_id: data.machine_id,
        type: data.type,
        priority: data.priority,
        reported_by_id: data.reported_by_id,
        symptom: data.symptom,
        created_at: data.created_at,
        linked_defect_id: data.linked_defect_id,
        updated_cause_id: data.updated_cause_id,
        id: newId,
        status: 'Open',
        assigned_to_id: data.assigned_to_id || null,
        downtime_min: null,
        completed_at: null,
    };
    maintenanceOrdersData.unshift(newOrder);

    if (data.parts_used && data.parts_used.length > 0) {
        data.parts_used.forEach(part => {
            if (part.part_id && part.qty_used > 0) {
                maintenancePartUsageData.push({
                    order_id: newId,
                    part_id: part.part_id,
                    qty_used: part.qty_used,
                });
            }
        });
    }
};

export const addConsumableRequest = (data: NewConsumableRequestData) => {
    const newId = Math.max(...consumablePurchaseRequestsData.map(r => r.id), 0) + 1;
    const newRequest: ConsumablePurchaseRequest = {
        ...data,
        id: newId,
        status: 'Pending',
    };
    consumablePurchaseRequestsData.unshift(newRequest);
};

export const addMcPartRequest = (data: NewMcPartRequestData) => {
    const newId = Math.max(...mcPartPurchaseRequestsData.map(r => r.id), 0) + 1;
    const newRequest: McPartPurchaseRequest = {
        ...data,
        id: newId,
        status: 'Pending',
        request_date: new Date().toISOString().slice(0, 10),
    };
    mcPartPurchaseRequestsData.unshift(newRequest);
};

export const addSparePart = (data: NewSparePartData) => {
    const newId = Math.max(...sparePartsData.map(p => p.id), 0) + 1;
    const newPart: SparePart = {
        ...data,
        id: newId,
        flagged_for_order: false,
    };
    sparePartsData.unshift(newPart);
};

export const updateSparePart = (id: number, data: Partial<NewSparePartData>) => {
    const partIndex = sparePartsData.findIndex(p => p.id === id);
    if (partIndex > -1) {
        sparePartsData[partIndex] = { ...sparePartsData[partIndex], ...data };
    }
};

export const toggleFlagForOrder = (partId: number) => {
    const partIndex = sparePartsData.findIndex(p => p.id === partId);
    if (partIndex > -1) {
        sparePartsData[partIndex].flagged_for_order = !sparePartsData[partIndex].flagged_for_order;
    }
};

const enrichErrorReports = (reports: ErrorReport[]): EnrichedErrorReport[] => {
    const userMap = new Map(usersData.map(u => [u.id, u.full_name]));
    const machineMap = new Map(machineInfoData.map(m => [m.id, m]));
    const shiftMap = new Map(shiftsData.map(s => [s.id, s.code]));
    return reports.map(report => {
        const machine = machineMap.get(report.machine_id);
        return {
            ...report,
            MACHINE_ID: machine?.MACHINE_ID || 'Unknown',
            LINE_ID: machine?.LINE_ID || 'Unknown',
            SHIFT_CODE: shiftMap.get(report.shift_id) || 'A',
            operator_name: userMap.get(report.operator_id) || 'Unknown',
            technician_name: report.technician_id ? userMap.get(report.technician_id) || 'Unknown' : null,
            verifier_name: report.verify_by ? userMap.get(report.verify_by) || 'Unknown' : null,
            images: errorImagesData.filter(img => img.error_id === report.id),
            history: errorHistoryData
                .filter(h => h.error_id === report.id)
                .map(h => ({ ...h, changed_by_name: userMap.get(h.changed_by) || 'Unknown' }))
                .sort((a,b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()),
        };
    });
};

const enrichMaintenanceOrders = (orders: MaintenanceOrder[]): EnrichedMaintenanceOrder[] => {
    const userMap = new Map(usersData.map(u => [u.id, u.full_name]));
    const machineMap = new Map(machineInfoData.map(m => [m.id, m]));
    const partMap = new Map(sparePartsData.map(p => [p.id, p]));

    return orders.map(order => {
        const machine = machineMap.get(order.machine_id);
        const parts_used = maintenancePartUsageData
            .filter(p => p.order_id === order.id)
            .map(p => {
                const partInfo = partMap.get(p.part_id);
                return {
                    ...p,
                    part_code: partInfo?.part_code || 'N/A',
                    part_name: partInfo?.name || 'Unknown Part'
                }
            });
        
        return {
            ...order,
            MACHINE_ID: machine?.MACHINE_ID || 'Unknown',
            reported_by_name: userMap.get(order.reported_by_id) || 'Unknown',
            assigned_to_name: order.assigned_to_id ? userMap.get(order.assigned_to_id) || 'Unknown' : null,
            parts_used,
        }
    })
};

const enrichDefectRecords = (records: DefectRecord[]): EnrichedDefectRecord[] => {
    const userMap = new Map(usersData.map(u => [u.id, u.full_name]));
    const machineMap = new Map(machineInfoData.map(m => [m.id, m]));
    const shiftMap = new Map(shiftsData.map(s => [s.id, s.code]));
    const defectTypeMap = new Map(defectTypesData.map(d => [d.id, d.name]));
    const causeMap = new Map(defectCausesData.map(c => [c.id, c.category]));
    
    return records.map(record => {
        const machine = machineMap.get(record.machine_id);
        return {
            ...record,
            MACHINE_ID: machine?.MACHINE_ID || 'Unknown',
            SHIFT: shiftMap.get(record.shift_id) || 'A',
            defect_type_name: defectTypeMap.get(record.defect_type_id) || 'Unknown',
            cause_category: record.cause_id ? causeMap.get(record.cause_id) || null : null,
            reporter_name: userMap.get(record.reporter_id) || 'Unknown',
            image_urls: record.image_urls || [],
        }
    });
};

const enrichMaintenanceSchedules = (schedules: MaintenanceSchedule[]): EnrichedMaintenanceSchedule[] => {
    const machineMap = new Map(machineInfoData.map(m => [m.id, m]));
    const today = new Date('2025-10-30T00:00:00Z');
    
    return schedules.map(schedule => {
        const machine = machineMap.get(schedule.machine_id);
        const lastPmDate = new Date(schedule.last_pm_date);
        const nextPmDate = new Date(lastPmDate);
        nextPmDate.setDate(lastPmDate.getDate() + schedule.cycle_days);

        const diffTime = nextPmDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'On schedule' | 'Due soon' | 'Overdue' = 'On schedule';
        if (diffDays < 0) {
            status = 'Overdue';
        } else if (diffDays <= 14) {
            status = 'Due soon';
        }
        
        return {
            ...schedule,
            MACHINE_ID: machine?.MACHINE_ID || 'Unknown',
            MACHINE_NAME: machine?.MACHINE_NAME || 'Unknown',
            next_pm_date: nextPmDate.toISOString().slice(0, 10),
            status,
        };
    });
}

// Simplified getDashboardData implementation
export const getDashboardData = async (
    startDate: string, endDate: string, area: string, shift: string, status: string, focusedLine: string | null
): Promise<DashboardData> => {
    // Mock API delay
    await new Promise(res => setTimeout(res, 500));

    // Basic filtering
    let filteredProduction = productionDailyData.filter(p => {
        const date = new Date(p.COMP_DAY);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateMatch = date >= start && date <= end;
        const shiftMatch = shift === 'all' || p.SHIFT === shift;
        const machineInfo = machineInfoData.find(m => m.MACHINE_ID === p.MACHINE_ID);
        const areaMatch = area === 'all' || (machineInfo && LINE_TO_AREA_MAP[machineInfo.LINE_ID] === area);
        const statusMatch = status === 'all' || p.STATUS === status;
        const lineMatch = !focusedLine || p.LINE_ID === focusedLine;

        return dateMatch && shiftMatch && areaMatch && statusMatch && lineMatch;
    });

    const totalProduction = filteredProduction.reduce((sum, p) => sum + p.ACT_PRO_QTY, 0);
    const totalDefects = filteredProduction.reduce((sum, p) => sum + p.DEFECT_QTY, 0);
    const totalDowntime = filteredProduction.reduce((sum, p) => sum + p.DOWNTIME_MIN, 0);
    const avgOee = filteredProduction.reduce((sum, p) => sum + p.OEE, 0) / (filteredProduction.length || 1);

    // Populate sub-components of OEE for display
    filteredProduction = filteredProduction.map(p => {
        const totalTime = p.RUN_TIME_MIN + p.DOWNTIME_MIN;
        const availability = totalTime > 0 ? p.RUN_TIME_MIN / totalTime : 0;
        const potentialQty = p.RUN_TIME_MIN / p.IDEAL_CYCLE_TIME;
        const performance = potentialQty > 0 ? p.ACT_PRO_QTY / potentialQty : 0;
        const quality = p.ACT_PRO_QTY > 0 ? (p.ACT_PRO_QTY - p.DEFECT_QTY) / p.ACT_PRO_QTY : 0;
        return {
            ...p,
            availability: availability,
            performance: performance,
            quality: quality,
            OEE: availability * performance * quality // Recalculate OEE for consistency
        }
    });

    const defectPareto: DataPoint[] = Object.entries(filteredProduction.reduce((acc, p) => {
        const defectType = defectTypesData[p.Prod_ID % defectTypesData.length].name;
        acc[defectType] = (acc[defectType] || 0) + p.DEFECT_QTY;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);

    const sevenDayTrend: TrendData[] = [...Array(7)].map((_, i) => {
        const date = new Date(endDate);
        date.setDate(date.getDate() - (6-i));
        const dateStr = date.toISOString().slice(0, 10);
        const dayData = filteredProduction.filter(p => p.COMP_DAY === dateStr);
        const oee = dayData.reduce((sum, p) => sum + p.OEE, 0) / (dayData.length || 1);
        return { date: dateStr, oee: oee };
    });

    const enrichedDefectRecords = enrichDefectRecords(defectRecords);

    // --- Quality Tab Calculations ---
    const filteredDefectRecords = enrichedDefectRecords.filter(d => {
        const date = new Date(d.work_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateMatch = date >= start && date <= end;
        const shiftMatch = shift === 'all' || d.SHIFT === shift;
        const machineInfo = machineInfoData.find(m => m.MACHINE_ID === d.MACHINE_ID);
        const areaMatch = area === 'all' || (machineInfo && LINE_TO_AREA_MAP[machineInfo.LINE_ID] === area);
        
        // Note: machine status filter is not applied here as defect records don't have it.
        return dateMatch && shiftMatch && areaMatch;
    });

    const defectsByDay = filteredProduction.reduce((acc, p) => {
        if (!acc[p.COMP_DAY]) {
            acc[p.COMP_DAY] = 0;
        }
        acc[p.COMP_DAY] += p.DEFECT_QTY;
        return acc;
    }, {} as Record<string, number>);

    const defectTrend: TrendData[] = Object.keys(defectsByDay)
        .map(date => ({
            date,
            totalDefects: defectsByDay[date],
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const statsByLine = filteredProduction.reduce((acc, p) => {
        if (!acc[p.LINE_ID]) {
            acc[p.LINE_ID] = { totalProduction: 0, totalDefects: 0 };
        }
        acc[p.LINE_ID].totalProduction += p.ACT_PRO_QTY;
        acc[p.LINE_ID].totalDefects += p.DEFECT_QTY;
        return acc;
    }, {} as Record<string, { totalProduction: number, totalDefects: number }>);

    const top5DefectLines: Top5DefectLine[] = Object.entries(statsByLine)
        .map(([lineId, stats]) => {
            const totalOutput = stats.totalProduction + stats.totalDefects;
            return {
                lineId,
                totalProduction: stats.totalProduction,
                totalDefects: stats.totalDefects,
                defectRate: totalOutput > 0 ? stats.totalDefects / totalOutput : 0,
            };
        })
        .sort((a, b) => b.defectRate - a.defectRate)
        .slice(0, 5);

    const defectsByRootCause: DataPoint[] = Object.entries(filteredDefectRecords.reduce((acc, d) => {
        const cause = d.cause_category || 'Unknown';
        acc[cause] = (acc[cause] || 0) + d.quantity;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // --- Downtime Tab Calculations ---
    const downtimeByMachine = filteredProduction.reduce((acc, p) => {
        acc[p.MACHINE_ID] = (acc[p.MACHINE_ID] || 0) + p.DOWNTIME_MIN;
        return acc;
    }, {} as Record<string, number>);

    const top5DowntimeMachines: Top5DowntimeMachine[] = Object.entries(downtimeByMachine)
        .map(([machineId, totalDowntime]) => ({ machineId, totalDowntime }))
        .sort((a, b) => b.totalDowntime - a.totalDowntime)
        .slice(0, 5);
        
    const filteredDowntimeRecords = downtimeRecords.filter(d => {
        const date = new Date(d.COMP_DAY);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateMatch = date >= start && date <= end;

        const machineInfo = machineInfoData.find(m => m.MACHINE_ID === d.MACHINE_ID);
        const areaMatch = area === 'all' || (machineInfo && LINE_TO_AREA_MAP[machineInfo.LINE_ID] === area);
        
        // Shift filter cannot be applied to downtimeRecords directly. 
        return dateMatch && areaMatch;
    });
    
    const downtimePareto: DataPoint[] = Object.entries(filteredDowntimeRecords.reduce((acc, p) => {
        acc[p.DOWNTIME_REASON] = (acc[p.DOWNTIME_REASON] || 0) + p.DOWNTIME_MIN;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);

    const downtimeByDay = filteredProduction.reduce((acc, p) => {
        if (!acc[p.COMP_DAY]) acc[p.COMP_DAY] = 0;
        acc[p.COMP_DAY] += p.DOWNTIME_MIN;
        return acc;
    }, {} as Record<string, number>);

    const downtimeTrend: TrendData[] = Object.keys(downtimeByDay)
        .map(date => ({ date, downtime: downtimeByDay[date] }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const uniqueDowntimeReasons = [...new Set(filteredDowntimeRecords.map(d => d.DOWNTIME_REASON))];
    const machineIdToLineId = new Map(machineInfoData.map(m => [m.MACHINE_ID, m.LINE_ID]));

    const downtimeByLineAndReason = filteredDowntimeRecords.reduce((acc, d) => {
        const lineId = machineIdToLineId.get(d.MACHINE_ID);
        if (lineId) {
            if (!acc[lineId]) acc[lineId] = {};
            acc[lineId][d.DOWNTIME_REASON] = (acc[lineId][d.DOWNTIME_REASON] || 0) + d.DOWNTIME_MIN;
        }
        return acc;
    }, {} as Record<string, Record<string, number>>);

    const availableLinesFromProduction = [...new Set(filteredProduction.map(p => p.LINE_ID))];
    
    const downtimeByLine: StackedBarDataPoint[] = availableLinesFromProduction.map(lineId => {
        const result: StackedBarDataPoint = { name: lineId };
        const reasonsForLine = downtimeByLineAndReason[lineId] || {};
        uniqueDowntimeReasons.forEach(reason => {
            result[reason] = reasonsForLine[reason] || 0;
        });
        return result;
    });


    // --- Maintenance Calculations (based on PRD) ---
    const enrichedMaintenanceOrders = enrichMaintenanceOrders(maintenanceOrdersData);
    const completedBreakdowns = enrichedMaintenanceOrders.filter(o => (o.type === 'Breakdown' || o.type === 'CM') && o.status === 'Done' && o.downtime_min);
    const mttr = completedBreakdowns.reduce((sum, o) => sum + o.downtime_min!, 0) / (completedBreakdowns.length || 1);
    const breakdownCount = enrichedMaintenanceOrders.filter(o => o.type === 'Breakdown').length;
    const totalRunTime = productionDailyData.reduce((sum, p) => sum + p.RUN_TIME_MIN, 0);
    const mtbf = (totalRunTime / 60) / (breakdownCount || 1); // in hours
    const mttrByMachine = completedBreakdowns.reduce((acc, order) => {
        if (!acc[order.MACHINE_ID]) acc[order.MACHINE_ID] = { total: 0, count: 0 };
        acc[order.MACHINE_ID].total += order.downtime_min!;
        acc[order.MACHINE_ID].count++;
        return acc;
    }, {} as Record<string, {total: number, count: number}>);
    
    const topMttrMachines = Object.entries(mttrByMachine)
        .map(([name, {total, count}]) => ({name, value: total/count}))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
        
    const today = new Date('2025-10-30T00:00:00Z');
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);

    const maintenanceSchedule = {
        overdue: enrichedMaintenanceOrders.filter(o => o.type === 'PM' && o.status !== 'Done' && new Date(o.created_at) < today),
        dueSoon: enrichedMaintenanceOrders.filter(o => o.type === 'PM' && o.status !== 'Done' && new Date(o.created_at) >= today && new Date(o.created_at) <= oneWeekFromNow),
    };
    
    const enrichedPmSchedule = enrichMaintenanceSchedules(maintenanceScheduleData);

    const lowStockParts = sparePartsData.filter(p => (p.available + p.in_transit) < p.reorder_point);

    // --- New Maintenance Calculations per PRD ---
    const machineStats: MachineMaintenanceStats[] = machineInfoData.map(mInfo => {
        const machineBreakdowns = enrichedMaintenanceOrders.filter(o => o.MACHINE_ID === mInfo.MACHINE_ID && o.type === 'Breakdown');
        const machineCompletedBreakdowns = machineBreakdowns.filter(o => o.status === 'Done' && o.downtime_min);
        const machineRunTime = filteredProduction.filter(p => p.MACHINE_ID === mInfo.MACHINE_ID).reduce((sum, p) => sum + p.RUN_TIME_MIN, 0);

        const breakdownCount = machineBreakdowns.length;
        const totalDowntime = machineCompletedBreakdowns.reduce((sum, o) => sum + o.downtime_min!, 0);
        const mttr = machineCompletedBreakdowns.length > 0 ? totalDowntime / machineCompletedBreakdowns.length : 0;
        const mtbf = breakdownCount > 0 ? (machineRunTime / 60) / breakdownCount : machineRunTime / 60; // in hours

        let status: 'Alert' | 'Warning' | 'Normal' = 'Normal';
        if (mtbf < 1000 || mttr > 120) status = 'Alert';
        else if (mtbf < 1500) status = 'Warning';
        
        return { machineId: mInfo.MACHINE_ID, mtbf, mttr, breakdownCount, totalDowntime, status };
    });

    const downtimeByReason = filteredDowntimeRecords.reduce((acc, d) => {
        if (!acc[d.DOWNTIME_REASON]) acc[d.DOWNTIME_REASON] = [];
        acc[d.DOWNTIME_REASON].push({ machine: d.MACHINE_ID, minutes: d.DOWNTIME_MIN });
        return acc;
    }, {} as Record<string, {machine: string, minutes: number}[]>);

    const downtimeAnalysis: DowntimeCauseStats[] = Object.entries(downtimeByReason).map(([reason, entries]) => {
        const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
        const machineImpact = entries.reduce((acc, e) => {
            acc[e.machine] = (acc[e.machine] || 0) + e.minutes;
            return acc;
        }, {} as Record<string, number>);
        const mainMachineImpact = Object.keys(machineImpact).length > 0 ? Object.entries(machineImpact).sort((a,b) => b[1] - a[1])[0][0] : 'N/A';
        return { reason, count: entries.length, totalMinutes, mainMachineImpact };
    }).sort((a,b) => b.totalMinutes - a.totalMinutes);

    const maintenanceTrend = Array.from({length: 30}).map((_, i) => {
        const date = new Date('2025-10-30');
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.toISOString().slice(0, 10),
            mtbf: 1800 - i * 15 + Math.random() * 200,
            mttr: 90 + i * 1.2 - Math.random() * 20,
        };
    });


    return {
        productionLog: filteredProduction,
        downtimeRecords: downtimeRecords.filter(d => {
            const date = new Date(d.COMP_DAY);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return date >= start && date <= end;
        }),
        allMachineInfo: machineInfoData,
        errorReports: enrichErrorReports(errorReportsData),
        allDefectRecords: enrichedDefectRecords,
        maintenanceOrders: enrichedMaintenanceOrders,
        availableLines: [...new Set(machineInfoData.map(m => m.LINE_ID))],
        availableMachines: machineInfoData.map(m => m.MACHINE_ID),
        masterData: {
            users: usersData,
            shifts: shiftsData,
            defectTypes: defectTypesData,
            defectCauses: defectCausesData,
            machines: machineInfoData,
            spareParts: sparePartsData,
            pmPartsTemplates: pmPartsTemplateData,
        },
        machineStatus: machineInfoData.map(m => ({
            machineId: m.MACHINE_ID,
            status: ['Running', 'Stopped', 'Error', 'Inactive'][m.id % 4] as any,
            oee: productionDailyData.find(p => p.MACHINE_ID === m.MACHINE_ID)?.OEE || 0,
            lineId: m.LINE_ID,
        })),
        summary: {
            totalProduction,
            totalDefects,
            totalDowntime,
            machineUtilization: 0.75, // dummy
            avgOee: avgOee,
            avgAvailability: 0.9, // dummy
            avgPerformance: 0.85, // dummy
            avgQuality: 0.95, // dummy
            productionByLine: [], // dummy
            oeeByLine: [], // dummy
        },
        performance: {
            sevenDayTrend,
            productionBoxplot: [], // dummy
            oeeHeatmap: [], // dummy
        },
        quality: {
            defectPareto,
            defectRateTrend: [], // still dummy, not used in UI
            defectTrend,
            top5DefectLines,
            defectsByRootCause,
        },
        downtime: {
            downtimePareto: downtimePareto,
            downtimeTrend: downtimeTrend,
            downtimeByCategory: [], // dummy
            top5DowntimeMachines: top5DowntimeMachines,
            downtimeByLine: downtimeByLine,
            uniqueDowntimeReasons: uniqueDowntimeReasons,
        },
        maintenance: {
            kpis: { mtbf, mttr, breakdownCount, topMttrMachines },
            schedule: maintenanceSchedule,
            pmSchedule: enrichedPmSchedule,
            spareParts: sparePartsData,
            lowStockParts,
            mcPartOrders: mcPartOrdersData,
            machineStats,
            downtimeAnalysis,
            trend: maintenanceTrend,
        },
        benchmarking: {
            oeeByLine: [], // dummy
            targets: oeeTargetsData,
        },
        purchasing: {
            mcPartRequests: mcPartPurchaseRequestsData,
            consumableRequests: consumablePurchaseRequestsData,
        }
    };
};