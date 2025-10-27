import { 
    ProductionDaily, DowntimeRecord, DashboardData, DataPoint, TrendData, 
    Top5DefectLine, Top5DowntimeMachine, StackedBarDataPoint, BoxplotDataPoint, 
    HeatmapDataPoint, MachineInfo, DefectAdjustmentLog, MachineStatusData, 
    OeeTarget, User, Shift, DefectType, DefectCause, SparePart,
    ErrorReport, ErrorImage, ErrorHistory, EnrichedErrorReport, NewErrorReportData, UpdateErrorData, ErrorReportStatus,
    DefectRecord, EnrichedDefectRecord, MaintenanceOrder, MaintenancePartUsage, EnrichedMaintenanceOrder, NewMaintenanceOrderData, CauseCategory, NewMachineData, NewDefectData,
    McPartPurchaseRequest, ConsumablePurchaseRequest, PurchaseStatus, NewConsumableRequestData, NewSparePartData, NewMcPartRequestData,
    MaintenanceSchedule, PmPartsTemplate, EnrichedMaintenanceSchedule, McPartOrder,
    MachineMaintenanceStats, DowntimeCauseStats,
    ScatterDataPoint,
    EnrichedSparePart,
    SparePartUsageHistory
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
      maintenance_interval_days: 30, flagged_for_order: false,
      image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/spare-part-filter.png',
      lifespan_days: 180,
      wear_tear_standard: 'Check for clogging and tears. Airflow reduction > 20% indicates wear.',
      replacement_standard: 'Replace every 6 months or if torn.'
    },
    // Almost out
    { id: 2, part_code: 'BLT-A300', name: 'Belt A300', location: 'Aisle 3, Bin 5', 
      available: 3, in_transit: 0, reserved: 0, used_in_period: 8, safety_stock: 3, reorder_point: 5,
      flagged_for_order: false,
      image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/spare-part-belt.png',
      lifespan_days: 730,
      wear_tear_standard: 'Visible cracks, fraying, or loss of tension.',
      replacement_standard: 'Replace every 24 months or upon visible wear.'
    },
    // Sufficient stock
     { id: 3, part_code: 'BEAR-210', name: 'Ball Bearing 210mm', location: 'Aisle 3, Bin 5',
      available: 50, in_transit: 20, reserved: 5, used_in_period: 15, safety_stock: 15, reorder_point: 20,
      maintenance_interval_days: 365, flagged_for_order: false,
      image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/spare-part-bearing.png'
    },
     // Need to order
    { id: 4, part_code: 'NOZ-PNT-A', name: 'Paint Nozzle Type A', location: 'Aisle 5, Bin 1',
      available: 4, in_transit: 0, reserved: 1, used_in_period: 5, safety_stock: 5, reorder_point: 5,
      flagged_for_order: false,
      image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/spare-part-nozzle.png'
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
      image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/spare-part-bearing-2.png'
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
    { id: 5, machine_id: 3, pm_type: 'PM-24M', last_pm_date: '2023-12-01', cycle_days: 730 },
    { id: 6, machine_id: 3, pm_type: 'PM-1M', last_pm_date: '2025-10-25', cycle_days: 30 },
    { id: 7, machine_id: 5, pm_type: 'PM-12M', last_pm_date: '2025-09-05', cycle_days: 365 },
    { id: 8, machine_id: 6, pm_type: 'PM-1M', last_pm_date: '2025-10-02', cycle_days: 30 },
];

export const pmPartsTemplatesData: PmPartsTemplate[] = [
    { pm_type: 'PM-1M', machine_id: 0, parts: [{ part_id: 1, qty: 1 }] }, // General template for all machines
    { pm_type: 'PM-12M', machine_id: 1, parts: [{ part_id: 1, qty: 2 }, { part_id: 2, qty: 1 }] }, // Specific for M01
    { pm_type: 'PM-12M', machine_id: 2, parts: [{ part_id: 1, qty: 2 }, { part_id: 3, qty: 4 }] }, // Specific for M02
];

// --- CORE DATA MOCKS ---

let productionLogData: ProductionDaily[] = [
    { Prod_ID: 1, COMP_DAY: '2025-10-26', LINE_ID: '32', MACHINE_ID: 'M01', ITEM_CODE: 'PN-12345', ACT_PRO_QTY: 9500, DEFECT_QTY: 50, RUN_TIME_MIN: 450, DOWNTIME_MIN: 30, IDEAL_CYCLE_TIME: 0.045, OEE: 0, shift_id: 1, SHIFT: 'A', STATUS: 'active' },
    { Prod_ID: 2, COMP_DAY: '2025-10-26', LINE_ID: '32', MACHINE_ID: 'M02', ITEM_CODE: 'PN-12345', ACT_PRO_QTY: 9800, DEFECT_QTY: 20, RUN_TIME_MIN: 470, DOWNTIME_MIN: 10, IDEAL_CYCLE_TIME: 0.045, OEE: 0, shift_id: 1, SHIFT: 'A', STATUS: 'active' },
    { Prod_ID: 3, COMP_DAY: '2025-10-26', LINE_ID: '31', MACHINE_ID: 'M03', ITEM_CODE: 'PN-67890', ACT_PRO_QTY: 7000, DEFECT_QTY: 150, RUN_TIME_MIN: 420, DOWNTIME_MIN: 60, IDEAL_CYCLE_TIME: 0.06, OEE: 0, shift_id: 2, SHIFT: 'B', STATUS: 'active' },
    { Prod_ID: 4, COMP_DAY: '2025-10-26', LINE_ID: '42', MACHINE_ID: 'M05', ITEM_CODE: 'PN-55555', ACT_PRO_QTY: 1800, DEFECT_QTY: 15, RUN_TIME_MIN: 440, DOWNTIME_MIN: 40, IDEAL_CYCLE_TIME: 0.24, OEE: 0, shift_id: 3, SHIFT: 'C', STATUS: 'active' },
    { Prod_ID: 5, COMP_DAY: '2025-10-26', LINE_ID: '51', MACHINE_ID: 'M06', ITEM_CODE: 'PN-77777', ACT_PRO_QTY: 5500, DEFECT_QTY: 250, RUN_TIME_MIN: 460, DOWNTIME_MIN: 20, IDEAL_CYCLE_TIME: 0.08, OEE: 0, shift_id: 3, SHIFT: 'C', STATUS: 'active' },
    { Prod_ID: 6, COMP_DAY: '2025-10-25', LINE_ID: '32', MACHINE_ID: 'M01', ITEM_CODE: 'PN-12345', ACT_PRO_QTY: 9600, DEFECT_QTY: 60, RUN_TIME_MIN: 460, DOWNTIME_MIN: 20, IDEAL_CYCLE_TIME: 0.045, OEE: 0, shift_id: 1, SHIFT: 'A', STATUS: 'active' },
    { Prod_ID: 7, COMP_DAY: '2025-10-25', LINE_ID: '31', MACHINE_ID: 'M03', ITEM_CODE: 'PN-67890', ACT_PRO_QTY: 6800, DEFECT_QTY: 200, RUN_TIME_MIN: 400, DOWNTIME_MIN: 80, IDEAL_CYCLE_TIME: 0.06, OEE: 0, shift_id: 2, SHIFT: 'B', STATUS: 'active' },
    { Prod_ID: 8, COMP_DAY: '2025-10-24', LINE_ID: '32', MACHINE_ID: 'M02', ITEM_CODE: 'PN-12345', ACT_PRO_QTY: 10000, DEFECT_QTY: 10, RUN_TIME_MIN: 480, DOWNTIME_MIN: 0, IDEAL_CYCLE_TIME: 0.045, OEE: 0, shift_id: 1, SHIFT: 'A', STATUS: 'active' },
];

let downtimeRecordsData: DowntimeRecord[] = [
    { Downtime_ID: 1, COMP_DAY: '2025-10-26', MACHINE_ID: 'M01', DOWNTIME_REASON: 'Material Jam', DOWNTIME_MIN: 30, START_TIME: '08:15', END_TIME: '08:45' },
    { Downtime_ID: 2, COMP_DAY: '2025-10-26', MACHINE_ID: 'M03', DOWNTIME_REASON: 'Tool Change', DOWNTIME_MIN: 45, START_TIME: '15:00', END_TIME: '15:45' },
    { Downtime_ID: 3, COMP_DAY: '2025-10-26', MACHINE_ID: 'M03', DOWNTIME_REASON: 'Operator Break', DOWNTIME_MIN: 15, START_TIME: '16:30', END_TIME: '16:45' },
    { Downtime_ID: 4, COMP_DAY: '2025-10-26', MACHINE_ID: 'M05', DOWNTIME_REASON: 'Sensor Error', DOWNTIME_MIN: 40, START_TIME: '23:00', END_TIME: '23:40' },
    { Downtime_ID: 5, COMP_DAY: '2025-10-26', MACHINE_ID: 'M06', DOWNTIME_REASON: 'Material Jam', DOWNTIME_MIN: 20, START_TIME: '01:10', END_TIME: '01:30' },
    { Downtime_ID: 6, COMP_DAY: '2025-10-25', MACHINE_ID: 'M03', DOWNTIME_REASON: 'Mechanical Failure', DOWNTIME_MIN: 80, START_TIME: '18:00', END_TIME: '19:20' },
];

let errorReportsData: ErrorReport[] = [
    {
        id: 1, reportNo: 'ERR20251026-001', machine_id: 3, shift_id: 2, operator_id: 201,
        report_time: '2025-10-26T15:05:00Z', defect_type: 'Skip stitch',
        defect_description: 'Machine M03 is producing items with skipped stitches consistently.',
        severity: 'High', status: 'In Progress', root_cause: 'Worn out needle',
        cause_category: 'Machine', action_taken: 'Replaced needle, pending verification.',
        technician_id: 101, fix_time: '2025-10-26T17:00:00Z', verify_by: null,
        verify_time: null, note: null, created_at: '2025-10-26T15:05:00Z', updated_at: '2025-10-26T17:00:00Z',
        linked_maintenance_order_id: 2
    },
    {
        id: 2, reportNo: 'ERR20251026-002', machine_id: 5, shift_id: 3, operator_id: 201,
        report_time: '2025-10-26T23:02:00Z', defect_type: 'Paint Drip',
        defect_description: 'Paint is dripping from nozzle A on machine M05.',
        severity: 'Medium', status: 'Reported', root_cause: null, cause_category: null,
        action_taken: null, technician_id: null, fix_time: null, verify_by: null,
        verify_time: null, note: 'Seems like a pressure issue.', created_at: '2025-10-26T23:02:00Z', updated_at: '2025-10-26T23:02:00Z',
        linked_maintenance_order_id: null
    },
];

let errorImagesData: ErrorImage[] = [
    { id: 1, error_id: 1, uploaded_by: 201, role: 'Operator', image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/defect-skip-stitch.png', description: 'Close-up of the skipped stitch.', uploaded_at: '2025-10-26T15:06:00Z' },
    { id: 2, error_id: 1, uploaded_by: 101, role: 'Maintenance', image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/defect-worn-needle.png', description: 'Image of the worn needle after removal.', uploaded_at: '2025-10-26T17:01:00Z' },
    { id: 3, error_id: 2, uploaded_by: 201, role: 'Operator', image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/defect-paint-drip.png', description: 'Paint drip on the product surface.', uploaded_at: '2025-10-26T23:03:00Z' },
];

let errorHistoryData: ErrorHistory[] = [
    { id: 1, error_id: 1, changed_by: 201, old_status: null, new_status: 'Reported', note: 'Initial report submitted.', changed_at: '2025-10-26T15:05:00Z' },
    { id: 2, error_id: 1, changed_by: 101, old_status: 'Reported', new_status: 'In Progress', note: 'Started working on the issue.', changed_at: '2025-10-26T15:30:00Z' },
    { id: 3, error_id: 2, changed_by: 201, old_status: null, new_status: 'Reported', note: 'New issue reported.', changed_at: '2025-10-26T23:02:00Z' },
];

export let defectRecordsData: DefectRecord[] = [
    { id: 1, work_date: "2025-10-26", machine_id: 1, shift_id: 1, defect_type_id: 1, cause_id: 2, quantity: 50, note: "Slight skipping on startup", severity: "Medium", status: "In Progress", is_abnormal: true, reporter_id: 201, linked_maintenance_order_id: null, image_urls: ['https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/defect-skip-stitch.png'] },
    { id: 2, work_date: "2025-10-26", machine_id: 3, shift_id: 2, defect_type_id: 4, cause_id: 1, quantity: 150, note: "Operator error during setup caused misalignment", severity: "High", status: "Closed", is_abnormal: true, reporter_id: 203, linked_maintenance_order_id: null, image_urls: [] },
    { id: 3, work_date: "2025-10-26", machine_id: 6, shift_id: 3, defect_type_id: 6, cause_id: 3, quantity: 250, note: "Scratches from raw material batch #RM-5592", severity: "Low", status: "In Progress", is_abnormal: true, reporter_id: 202, linked_maintenance_order_id: null, image_urls: [] },
];

let maintenanceOrdersData: MaintenanceOrder[] = [
    { id: 1, machine_id: 1, type: 'PM', priority: 'Medium', status: 'Done', reported_by_id: 1, assigned_to_id: 102, symptom: 'PM-12M for M01', downtime_min: 120, created_at: '2025-09-15T09:00:00Z', completed_at: '2025-09-15T11:00:00Z', linked_defect_id: null, updated_cause_id: null },
    { id: 2, machine_id: 3, type: 'CM', priority: 'High', status: 'InProgress', reported_by_id: 201, assigned_to_id: 101, symptom: 'Machine producing skipped stitches', downtime_min: null, created_at: '2025-10-26T15:10:00Z', completed_at: null, linked_defect_id: 1, updated_cause_id: 2 },
    { id: 3, machine_id: 5, type: 'Breakdown', priority: 'High', status: 'Open', reported_by_id: 201, assigned_to_id: null, symptom: 'Sensor E5-1 failed, machine stopped', downtime_min: null, created_at: '2025-10-26T23:05:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null },
    { id: 4, machine_id: 2, type: 'PM', priority: 'Low', status: 'Open', reported_by_id: 1, assigned_to_id: null, symptom: 'PM-1M Checkup', downtime_min: null, created_at: '2025-10-28T09:00:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null }, // Due soon
    { id: 5, machine_id: 3, type: 'PM', priority: 'High', status: 'Open', reported_by_id: 1, assigned_to_id: null, symptom: 'PM-24M Overhaul', downtime_min: null, created_at: '2025-10-20T09:00:00Z', completed_at: null, linked_defect_id: null, updated_cause_id: null }, // Overdue
];

let maintenancePartUsageData: MaintenancePartUsage[] = [
    { order_id: 1, part_id: 1, qty_used: 2 },
    { order_id: 1, part_id: 2, qty_used: 1 },
    { order_id: 2, part_id: 3, qty_used: 1 },
];

let mcPartPurchaseRequestsData: McPartPurchaseRequest[] = [
    {id: 1, item_code: 'BLT-A300', item_name: 'Belt A300', quantity: 10, reason: 'Low stock', status: 'Pending', request_date: '2025-10-26'},
    {id: 2, item_code: 'NOZ-PNT-A', item_name: 'Paint Nozzle Type A', quantity: 5, reason: 'Periodic replacement', status: 'Approved', request_date: '2025-10-25'},
];

let consumablePurchaseRequestsData: ConsumablePurchaseRequest[] = [
    {id: 1, name: 'Cutting Fluid', component_code: 'FL-CUT-01', specs: '5L, Synthetic', image_url: 'https://storage.googleapis.com/aistudio-marketplace-llm-provider-images/website_pr_assets_maker-explainer/consumable-fluid.png', quantity: 20, order_month: '2025-11', receipt_month: '2025-12', notes: 'Urgent for Line 31', status: 'Pending'},
];

// OEE BENCHMARKING MOCKS
const oeeTargetsData: OeeTarget[] = [
    { id: 1, level: 'Plant', line_id: null, target_oee: 0.85, target_output: 100000, target_defect_rate: 0.01, effective_from: '2025-01-01', effective_to: null },
    { id: 2, level: 'Line', line_id: '31', target_oee: 0.82, target_output: 8000, target_defect_rate: 0.02, effective_from: '2025-01-01', effective_to: null },
    { id: 3, level: 'Line', line_id: '32', target_oee: 0.90, target_output: 10000, target_defect_rate: 0.005, effective_from: '2025-01-01', effective_to: null },
    { id: 4, level: 'Line', line_id: '42', target_oee: 0.88, target_output: 2000, target_defect_rate: 0.01, effective_from: '2025-01-01', effective_to: null },
    { id: 5, level: 'Line', line_id: '51', target_oee: 0.85, target_output: 6000, target_defect_rate: 0.03, effective_from: '2025-01-01', effective_to: null },
];


// --- UTILITY FUNCTIONS ---

export const addDefectRecord = (data: NewDefectData) => {
    const newId = Math.max(...defectRecordsData.map(r => r.id), 0) + 1;
    const newRecord: DefectRecord = {
        id: newId,
        ...data,
    };
    defectRecordsData.unshift(newRecord);
};

export const addErrorReport = (data: NewErrorReportData) => {
    const newId = Math.max(...errorReportsData.map(r => r.id), 0) + 1;
    const newReport: ErrorReport = {
        id: newId,
        reportNo: `ERR${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${newId}`,
        machine_id: data.machine_id,
        shift_id: data.shift_id,
        operator_id: data.operator_id,
        report_time: new Date().toISOString(),
        defect_type: data.defect_type,
        defect_description: data.defect_description,
        severity: data.severity,
        status: 'Reported',
        root_cause: null, cause_category: null, action_taken: null,
        technician_id: null, fix_time: null, verify_by: null, verify_time: null,
        note: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        linked_maintenance_order_id: data.linked_maintenance_order_id || null,
    };
    errorReportsData.unshift(newReport);
    errorHistoryData.push({
        id: Math.max(...errorHistoryData.map(h => h.id), 0) + 1,
        error_id: newId,
        changed_by: data.operator_id,
        old_status: null,
        new_status: 'Reported',
        note: 'Initial report created.',
        changed_at: new Date().toISOString(),
    });
     if (data.images) {
        data.images.forEach(img => {
            errorImagesData.push({
                id: Math.max(...errorImagesData.map(i => i.id), 0) + 1,
                error_id: newId,
                uploaded_by: data.operator_id,
                role: 'Operator',
                image_url: img.url,
                description: img.description,
                uploaded_at: new Date().toISOString(),
            });
        });
    }
};

export const updateErrorReport = (reportId: number, data: Partial<UpdateErrorData>, newStatus: ErrorReportStatus) => {
    const reportIndex = errorReportsData.findIndex(r => r.id === reportId);
    if (reportIndex > -1) {
        const oldStatus = errorReportsData[reportIndex].status;
        const error = errorReportsData[reportIndex];
        
        error.status = newStatus;
        error.updated_at = new Date().toISOString();

        let changedById = 1; // default admin
        let note = `Status changed to ${newStatus}`;

        if (newStatus === 'In Progress') {
            changedById = 101; // Assume a technician starts work
            note = 'Work has started on this issue.';
        }
        
        if (Object.keys(data).length > 0 && data.root_cause) {
            error.root_cause = data.root_cause;
            error.cause_category = data.cause_category!;
            error.action_taken = data.action_taken!;
            error.technician_id = data.technician_id!;
            error.fix_time = new Date().toISOString();
            changedById = data.technician_id!;
            note = 'Maintenance details updated and issue marked as resolved.';
        }
        
        if (newStatus === 'Closed') {
            error.verify_by = 203; // Assume a supervisor verifies
            error.verify_time = new Date().toISOString();
            changedById = 203;
            note = 'Resolution verified and report closed.';
        }

        errorHistoryData.push({
            id: Math.max(...errorHistoryData.map(h => h.id), 0) + 1,
            error_id: reportId,
            changed_by: changedById,
            old_status: oldStatus,
            new_status: newStatus,
            note: note,
            changed_at: new Date().toISOString(),
        });
         if (data.images && data.technician_id) {
            data.images.forEach(img => {
                errorImagesData.push({
                    id: Math.max(...errorImagesData.map(i => i.id), 0) + 1,
                    error_id: reportId,
                    uploaded_by: data.technician_id!,
                    role: 'Maintenance',
                    image_url: img.url,
                    description: img.description,
                    uploaded_at: new Date().toISOString(),
                });
            });
        }
    }
};

export const addMaintenanceOrder = (data: NewMaintenanceOrderData) => {
    const newOrder: MaintenanceOrder = {
        id: Math.max(...maintenanceOrdersData.map(o => o.id), 0) + 1,
        machine_id: data.machine_id,
        type: data.type,
        priority: data.priority,
        status: 'Open',
        reported_by_id: data.reported_by_id,
        assigned_to_id: data.assigned_to_id || null,
        symptom: data.symptom,
        downtime_min: null,
        created_at: data.created_at,
        completed_at: null,
        linked_defect_id: data.linked_defect_id || null,
        updated_cause_id: data.updated_cause_id || null,
    };
    maintenanceOrdersData.unshift(newOrder);

    if (data.parts_used) {
        data.parts_used.forEach(part => {
            maintenancePartUsageData.push({ order_id: newOrder.id, ...part });
        });
    }
};

export const addMachine = (data: NewMachineData) => {
    const newId = Math.max(...machineInfoData.map(m => m.id), 0) + 1;
    const newMachine: MachineInfo = {
        id: newId,
        x: 50, // Default position
        y: 50,
        ...data
    };
    machineInfoData.push(newMachine);
};

export const updateMachine = (id: number, data: Partial<NewMachineData & {x: number; y: number}>) => {
    const index = machineInfoData.findIndex(m => m.id === id);
    if (index > -1) {
        machineInfoData[index] = { ...machineInfoData[index], ...data };
    }
};

export const addConsumableRequest = (data: NewConsumableRequestData) => {
    const newId = Math.max(...consumablePurchaseRequestsData.map(r => r.id), 0) + 1;
    const newRequest: ConsumablePurchaseRequest = {
        id: newId,
        status: 'Pending',
        ...data,
    };
    consumablePurchaseRequestsData.unshift(newRequest);
};

export const addMcPartRequest = (data: NewMcPartRequestData) => {
    const newId = Math.max(...mcPartPurchaseRequestsData.map(r => r.id), 0) + 1;
    const newRequest: McPartPurchaseRequest = {
        id: newId,
        status: 'Pending',
        request_date: new Date().toISOString().slice(0, 10),
        ...data,
    };
    mcPartPurchaseRequestsData.unshift(newRequest);
};

export const addSparePart = (data: NewSparePartData) => {
    const newId = Math.max(...sparePartsData.map(p => p.id), 0) + 1;
    const newPart: SparePart = {
        id: newId,
        ...data,
    };
    sparePartsData.unshift(newPart);
};

export const updateSparePart = (id: number, data: Partial<NewSparePartData>) => {
    const index = sparePartsData.findIndex(p => p.id === id);
    if (index > -1) {
        sparePartsData[index] = { ...sparePartsData[index], ...data };
    }
};

export const toggleFlagForOrder = (partId: number) => {
    const part = sparePartsData.find(p => p.id === partId);
    if (part) {
        part.flagged_for_order = !part.flagged_for_order;
    }
};

// --- DATA TRANSFORMATION & ANALYSIS ---

// Main data fetching function
export const getDashboardData = (
    startDate: string,
    endDate: string,
    area: string,
    shift: 'all' | 'A' | 'B' | 'C',
    status: 'all' | 'active' | 'inactive',
    focusedLine: string | null = null,
): Promise<DashboardData> => {
    return new Promise(resolve => {
        
        const allMachineInfo = [...machineInfoData];
        const availableLines = [...new Set(allMachineInfo.map(m => m.LINE_ID))].sort();

        // 1. FILTERING
        const linesInArea = focusedLine ? [focusedLine] : (area === 'all' ? availableLines : availableLines.filter(line => LINE_TO_AREA_MAP[line] === area));
        const machinesInScope = allMachineInfo.filter(m => linesInArea.includes(m.LINE_ID) && (status === 'all' || m.STATUS === status));
        const machineIdsInScope = new Set(machinesInScope.map(m => m.MACHINE_ID));

        const productionForPeriod = productionLogData
            .filter(p => p.COMP_DAY >= startDate && p.COMP_DAY <= endDate)
            .filter(p => machineIdsInScope.has(p.MACHINE_ID))
            .filter(p => shift === 'all' || p.SHIFT === shift);

        productionForPeriod.forEach(log => {
            const totalTime = log.RUN_TIME_MIN + log.DOWNTIME_MIN;
            const totalPieces = log.ACT_PRO_QTY + log.DEFECT_QTY;
            
            log.availability = totalTime > 0 ? log.RUN_TIME_MIN / totalTime : 0;
            const performanceDenominator = log.RUN_TIME_MIN > 0 && totalPieces > 0 ? log.RUN_TIME_MIN : 0;
            log.performance = performanceDenominator > 0 ? (totalPieces * log.IDEAL_CYCLE_TIME) / performanceDenominator : 0;
            log.quality = totalPieces > 0 ? log.ACT_PRO_QTY / totalPieces : 0;
            log.OEE = log.availability * log.performance * log.quality;
        });

        const downtimeForPeriod = downtimeRecordsData
            .filter(d => d.COMP_DAY >= startDate && d.COMP_DAY <= endDate)
            .filter(d => machineIdsInScope.has(d.MACHINE_ID));
        
        // 2. SUMMARY
        const totalProduction = productionForPeriod.reduce((sum, log) => sum + log.ACT_PRO_QTY, 0);
        const totalDefects = productionForPeriod.reduce((sum, log) => sum + log.DEFECT_QTY, 0);
        const totalDowntime = productionForPeriod.reduce((sum, log) => sum + log.DOWNTIME_MIN, 0);
        const totalPossibleTime = productionForPeriod.reduce((sum, log) => sum + log.RUN_TIME_MIN + log.DOWNTIME_MIN, 0);
        const machineUtilization = totalPossibleTime > 0 ? productionForPeriod.reduce((sum, log) => sum + log.RUN_TIME_MIN, 0) / totalPossibleTime : 0;
        const avgOee = productionForPeriod.length > 0 ? productionForPeriod.reduce((sum, log) => sum + log.OEE, 0) / productionForPeriod.length : 0;
        const avgAvailability = productionForPeriod.length > 0 ? productionForPeriod.reduce((sum, log) => sum + (log.availability ?? 0), 0) / productionForPeriod.length : 0;
        const avgPerformance = productionForPeriod.length > 0 ? productionForPeriod.reduce((sum, log) => sum + (log.performance ?? 0), 0) / productionForPeriod.length : 0;
        const avgQuality = productionForPeriod.length > 0 ? productionForPeriod.reduce((sum, log) => sum + (log.quality ?? 0), 0) / productionForPeriod.length : 0;
        const defectRate = (totalProduction + totalDefects) > 0 ? totalDefects / (totalProduction + totalDefects) : 0;

        const productionByLine = linesInArea.map(lineId => ({
            name: lineId,
            value: productionForPeriod.filter(p => p.LINE_ID === lineId).reduce((sum, p) => sum + p.ACT_PRO_QTY, 0)
        }));
        
        const oeeByLine = linesInArea.map(lineId => {
            const logs = productionForPeriod.filter(p => p.LINE_ID === lineId);
            const avg = logs.length > 0 ? logs.reduce((sum, p) => sum + p.OEE, 0) / logs.length : 0;
            return { name: lineId, value: avg };
        });

        // 3. PERFORMANCE ANALYSIS
        const sevenDayTrend: TrendData[] = [...Array(7)].map((_, i) => {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const day = d.toISOString().slice(0, 10);
            const logs = productionLogData.filter(p => p.COMP_DAY === day && machineIdsInScope.has(p.MACHINE_ID));
            const oee = logs.length > 0 ? logs.reduce((sum, log) => sum + log.OEE, 0) / logs.length : 0;
            const availability = logs.length > 0 ? logs.reduce((sum, log) => sum + (log.availability ?? 0), 0) / logs.length : 0;
            const performance = logs.length > 0 ? logs.reduce((sum, log) => sum + (log.performance ?? 0), 0) / logs.length : 0;
            const quality = logs.length > 0 ? logs.reduce((sum, log) => sum + (log.quality ?? 0), 0) / logs.length : 0;
            return { date: day.slice(5), oee, availability, performance, quality };
        }).reverse();

        const productionBoxplot: BoxplotDataPoint[] = linesInArea.map(lineId => {
            const values = productionForPeriod.filter(p => p.LINE_ID === lineId).map(p => p.ACT_PRO_QTY);
            if (values.length === 0) return { name: lineId, min: 0, q1: 0, median: 0, q3: 0, max: 0 };
            return {
                name: lineId,
                min: Math.min(...values),
                q1: quantile(values, 0.25),
                median: quantile(values, 0.5),
                q3: quantile(values, 0.75),
                max: Math.max(...values),
            };
        });

        const oeeHeatmap: HeatmapDataPoint[] = [];
        linesInArea.forEach(line => {
            (['A', 'B', 'C'] as const).forEach(shiftCode => {
                const logs = productionForPeriod.filter(p => p.LINE_ID === line && p.SHIFT === shiftCode);
                const value = logs.length > 0 ? logs.reduce((s, l) => s + l.OEE, 0) / logs.length : 0;
                oeeHeatmap.push({ line, shift: shiftCode, value });
            });
        });
        
        // 4. QUALITY ANALYSIS
        const defectsByReason = productionForPeriod.reduce((acc, log) => {
            const defectType = `Type ${log.DEFECT_QTY % 8 + 1}`; // Mocking defect type
            acc[defectType] = (acc[defectType] || 0) + log.DEFECT_QTY;
            return acc;
        }, {} as Record<string, number>);
        const defectPareto: DataPoint[] = Object.entries(defectsByReason).map(([name, value]) => ({name, value}));
        
        const defectTrend: TrendData[] = sevenDayTrend.map(d => {
            const logs = productionLogData.filter(p => p.COMP_DAY.endsWith(d.date) && machineIdsInScope.has(p.MACHINE_ID));
            const totalDefects = logs.reduce((sum, log) => sum + log.DEFECT_QTY, 0);
            return { date: d.date, totalDefects };
        });

        const defectRateTrend: TrendData[] = sevenDayTrend.map(d => {
             const logs = productionLogData.filter(p => p.COMP_DAY.endsWith(d.date) && machineIdsInScope.has(p.MACHINE_ID));
             const totalProd = logs.reduce((sum, log) => sum + log.ACT_PRO_QTY, 0);
             const totalDef = logs.reduce((sum, log) => sum + log.DEFECT_QTY, 0);
             const defectRate = (totalProd + totalDef) > 0 ? totalDef / (totalProd + totalDef) : 0;
             return { date: d.date, defectRate };
        });

        const top5DefectLines: Top5DefectLine[] = linesInArea.map(lineId => {
            const logs = productionForPeriod.filter(p => p.LINE_ID === lineId);
            const totalProduction = logs.reduce((s, l) => s + l.ACT_PRO_QTY, 0);
            const totalDefects = logs.reduce((s, l) => s + l.DEFECT_QTY, 0);
            const defectRate = (totalProduction + totalDefects) > 0 ? totalDefects / (totalProduction + totalDefects) : 0;
            return { lineId, totalProduction, totalDefects, defectRate };
        }).sort((a,b) => b.defectRate - a.defectRate).slice(0, 5);
        
        const defectsByRootCause = [
            { name: 'Machine', value: Math.random() * 500 },
            { name: 'Man', value: Math.random() * 300 },
            { name: 'Material', value: Math.random() * 200 },
            { name: 'Method', value: Math.random() * 100 },
        ];
        
        // 5. DOWNTIME ANALYSIS
        const downtimeByReason = downtimeForPeriod.reduce((acc, record) => {
            acc[record.DOWNTIME_REASON] = (acc[record.DOWNTIME_REASON] || 0) + record.DOWNTIME_MIN;
            return acc;
        }, {} as Record<string, number>);
        const downtimePareto: DataPoint[] = Object.entries(downtimeByReason).map(([name, value]) => ({ name, value }));

        const downtimeTrend: TrendData[] = sevenDayTrend.map(d => {
            const totalDowntime = downtimeRecordsData.filter(dt => dt.COMP_DAY.endsWith(d.date) && machineIdsInScope.has(dt.MACHINE_ID))
                                                    .reduce((sum, dt) => sum + dt.DOWNTIME_MIN, 0);
            return { date: d.date, downtime: totalDowntime };
        });

        const top5DowntimeMachines: Top5DowntimeMachine[] = machinesInScope.map(m => {
            const totalDowntime = downtimeForPeriod.filter(d => d.MACHINE_ID === m.MACHINE_ID).reduce((s, d) => s + d.DOWNTIME_MIN, 0);
            return { machineId: m.MACHINE_ID, totalDowntime };
        }).sort((a,b) => b.totalDowntime - a.totalDowntime).slice(0, 5);
        
        const uniqueDowntimeReasons = [...new Set(downtimeForPeriod.map(d => d.DOWNTIME_REASON))];
        const downtimeByLine: StackedBarDataPoint[] = linesInArea.map(lineId => {
            const lineData: StackedBarDataPoint = { name: lineId };
            const machineIdsOnLine = machinesInScope.filter(m => m.LINE_ID === lineId).map(m => m.MACHINE_ID);
            uniqueDowntimeReasons.forEach(reason => {
                lineData[reason] = downtimeForPeriod.filter(d => machineIdsOnLine.includes(d.MACHINE_ID) && d.DOWNTIME_REASON === reason)
                                                    .reduce((s, d) => s + d.DOWNTIME_MIN, 0);
            });
            return lineData;
        });
        
         const downtimeVsProduction: ScatterDataPoint[] = productionForPeriod.map(p => ({
            production: p.ACT_PRO_QTY,
            downtime: p.DOWNTIME_MIN,
            machineId: p.MACHINE_ID,
            lineId: p.LINE_ID,
        }));

        // 6. MACHINE STATUS
        const machineStatus: MachineStatusData[] = allMachineInfo.map(m => {
            const log = productionForPeriod.find(p => p.MACHINE_ID === m.MACHINE_ID);
            if (!log) return { machineId: m.MACHINE_ID, status: m.STATUS === 'active' ? 'Stopped' : 'Inactive', oee: null, lineId: m.LINE_ID };
            const oee = (log.availability ?? 0) * (log.performance ?? 0) * (log.quality ?? 0);
            if (log.DOWNTIME_MIN > 60) return { machineId: m.MACHINE_ID, status: 'Error', oee, lineId: m.LINE_ID };
            if (log.RUN_TIME_MIN > 0) return { machineId: m.MACHINE_ID, status: 'Running', oee, lineId: m.LINE_ID };
            return { machineId: m.MACHINE_ID, status: 'Stopped', oee, lineId: m.LINE_ID };
        });

        // 7. ENRICH DATA
        const enrichedErrorReports: EnrichedErrorReport[] = errorReportsData.map(report => {
            const machine = allMachineInfo.find(m => m.id === report.machine_id);
            const shift = shiftsData.find(s => s.id === report.shift_id);
            const operator = usersData.find(u => u.id === report.operator_id);
            const technician = usersData.find(u => u.id === report.technician_id);
            const verifier = usersData.find(u => u.id === report.verify_by);
            const images = errorImagesData.filter(img => img.error_id === report.id);
            const history = errorHistoryData.filter(h => h.error_id === report.id)
                .map(h => ({ ...h, changed_by_name: usersData.find(u => u.id === h.changed_by)?.full_name || 'System' }))
                .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

            return {
                ...report,
                MACHINE_ID: machine?.MACHINE_ID || 'N/A',
                LINE_ID: machine?.LINE_ID || 'N/A',
                SHIFT_CODE: shift?.code || 'A',
                operator_name: operator?.full_name || 'N/A',
                technician_name: technician?.full_name || null,
                verifier_name: verifier?.full_name || null,
                images,
                history,
            };
        });

        const allEnrichedDefectRecords: EnrichedDefectRecord[] = defectRecordsData.map(rec => ({
            ...rec,
            MACHINE_ID: allMachineInfo.find(m => m.id === rec.machine_id)?.MACHINE_ID || 'N/A',
            SHIFT: shiftsData.find(s => s.id === rec.shift_id)?.code || 'A',
            defect_type_name: defectTypesData.find(dt => dt.id === rec.defect_type_id)?.name || 'Unknown',
            cause_category: defectCausesData.find(dc => dc.id === rec.cause_id)?.category || null,
            reporter_name: usersData.find(u => u.id === rec.reporter_id)?.full_name || 'Unknown',
            image_urls: rec.image_urls || [],
        }));
        
        const defectRecordsForPeriod = allEnrichedDefectRecords.filter(rec => 
            rec.work_date >= startDate && rec.work_date <= endDate &&
            machineIdsInScope.has(rec.MACHINE_ID) &&
            (shift === 'all' || rec.SHIFT === shift)
        );


         const enrichedMaintenanceOrders: EnrichedMaintenanceOrder[] = maintenanceOrdersData.map(order => ({
            ...order,
            MACHINE_ID: allMachineInfo.find(m => m.id === order.machine_id)?.MACHINE_ID || 'N/A',
            reported_by_name: usersData.find(u => u.id === order.reported_by_id)?.full_name || 'N/A',
            assigned_to_name: usersData.find(u => u.id === order.assigned_to_id)?.full_name || null,
            parts_used: maintenancePartUsageData.filter(p => p.order_id === order.id).map(p => {
                const partInfo = sparePartsData.find(sp => sp.id === p.part_id);
                return { ...p, part_code: partInfo?.part_code || 'N/A', part_name: partInfo?.name || 'N/A' };
            }),
        }));

        // 8. MAINTENANCE
        const breakdownOrders = enrichedMaintenanceOrders.filter(o => o.type === 'Breakdown' && o.status === 'Done');
        const totalDowntimeForBreakdowns = breakdownOrders.reduce((sum, o) => sum + (o.downtime_min || 0), 0);
        const mtbf = 100; // Mock
        const mttr = breakdownOrders.length > 0 ? totalDowntimeForBreakdowns / breakdownOrders.length : 0;
        
        const machineStats: MachineMaintenanceStats[] = machinesInScope.map(m => ({
            machineId: m.MACHINE_ID, mtbf: Math.random() * 200 + 50, mttr: Math.random() * 60 + 15, breakdownCount: Math.floor(Math.random() * 5),
            totalDowntime: Math.floor(Math.random() * 300), status: ['Alert', 'Warning', 'Normal'][Math.floor(Math.random()*3)] as any,
        }));
        
        const downtimeAnalysis: DowntimeCauseStats[] = Object.entries(downtimeByReason).map(([reason, totalMinutes]) => ({
            reason, count: Math.floor(totalMinutes / 30), totalMinutes, mainMachineImpact: `M0${Math.floor(Math.random()*6)+1}`
        }));
        
        const maintenanceTrend = sevenDayTrend.map(d => ({ date: d.date, mtbf: Math.random() * 200, mttr: Math.random() * 60}));
        
        const enrichedPmSchedule: EnrichedMaintenanceSchedule[] = maintenanceScheduleData.map(s => {
            const machine = allMachineInfo.find(m => m.id === s.machine_id)!;
            const lastPm = new Date(s.last_pm_date);
            const nextPm = new Date(lastPm);
            nextPm.setDate(nextPm.getDate() + s.cycle_days);
            const next_pm_date = nextPm.toISOString().slice(0, 10);
            
            const today = new Date('2025-10-27'); // Mock date for consistency
            const daysUntilDue = (nextPm.getTime() - today.getTime()) / (1000 * 3600 * 24);
            let status: 'On schedule' | 'Due soon' | 'Overdue' = 'On schedule';
            if (daysUntilDue < 0) status = 'Overdue';
            else if (daysUntilDue <= 14) status = 'Due soon';

            return { ...s, MACHINE_ID: machine.MACHINE_ID, MACHINE_NAME: machine.MACHINE_NAME, next_pm_date, status };
        });

        const data: DashboardData = {
            productionLog: productionForPeriod,
            downtimeRecords: downtimeForPeriod,
            allMachineInfo,
            errorReports: enrichedErrorReports,
            allDefectRecords: allEnrichedDefectRecords,
            maintenanceOrders: enrichedMaintenanceOrders,
            availableLines,
            availableMachines: machinesInScope.map(m => m.MACHINE_ID),
            masterData: {
                users: usersData, shifts: shiftsData, defectTypes: defectTypesData, defectCauses: defectCausesData,
                machines: allMachineInfo,
                spareParts: sparePartsData,
                pmPartsTemplates: pmPartsTemplatesData,
            },
            machineStatus,
            summary: {
                totalProduction, totalDefects, totalDowntime, machineUtilization,
                avgOee, avgAvailability, avgPerformance, avgQuality, defectRate,
                productionByLine, oeeByLine
            },
            performance: { sevenDayTrend, productionBoxplot, oeeHeatmap },
            quality: { defectPareto, defectTrend, defectRateTrend, top5DefectLines, defectsByRootCause, defectRecordsForPeriod },
            downtime: { downtimePareto, downtimeTrend, top5DowntimeMachines, downtimeByLine, uniqueDowntimeReasons, downtimeVsProduction, downtimeByCategory: downtimePareto },
            maintenance: {
                kpis: { mtbf, mttr, breakdownCount: breakdownOrders.length, topMttrMachines: [] },
                schedule: {
                    overdue: enrichedMaintenanceOrders.filter(o => o.id === 5),
                    dueSoon: enrichedMaintenanceOrders.filter(o => o.id === 4),
                },
                pmSchedule: enrichedPmSchedule,
                spareParts: sparePartsData,
                lowStockParts: sparePartsData.filter(p => (p.available + p.in_transit) < p.reorder_point),
                mcPartOrders: mcPartOrdersData,
                machineStats,
                downtimeAnalysis,
                trend: maintenanceTrend
            },
            benchmarking: { oeeByLine, targets: oeeTargetsData, },
            purchasing: { mcPartRequests: mcPartPurchaseRequestsData, consumableRequests: consumablePurchaseRequestsData },
        };
        resolve(data);
    });
};

export const getEnrichedSparePartDetails = (part: SparePart): EnrichedSparePart => {
    const usageHistory: SparePartUsageHistory[] = maintenancePartUsageData
        .filter(usage => usage.part_id === part.id)
        .map(usage => {
            const order = maintenanceOrdersData.find(o => o.id === usage.order_id);
            const machine = machineInfoData.find(m => m.id === order?.machine_id);
            return {
                order_id: usage.order_id,
                MACHINE_ID: machine?.MACHINE_ID || 'N/A',
                completed_at: order?.completed_at || '',
                qty_used: usage.qty_used,
            };
        })
        .filter(h => h.completed_at)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    const purchaseHistory = mcPartOrdersData.filter(po => po.item_code === part.part_code)
        .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    
    return { ...part, usageHistory, purchaseHistory };
};


export const getInitialFilterData = () => {
    const today = new Date('2025-10-26');
    const defaultDate = today.toISOString().slice(0, 10);
    const availableAreas = [...new Set(Object.values(LINE_TO_AREA_MAP))].sort();
    return {
        defaultDate,
        defaultArea: 'all',
        availableAreas
    };
};

export const getMachineInfo = (machineId: string) => {
    return machineInfoData.find(m => m.MACHINE_ID === machineId) || null;
};
