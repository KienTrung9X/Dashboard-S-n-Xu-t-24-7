// types.ts

// --- MASTER DATA TABLES ---

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'Admin' | 'Supervisor' | 'Operator' | 'QA' | 'Maintenance';
}

export interface Shift {
  id: number;
  code: 'A' | 'B' | 'C';
  name: string;
}

export interface MachineInfo {
  id: number;
  MACHINE_ID: string; // Keep original for display consistency
  MACHINE_NAME: string;
  LINE_ID: string;
  IDEAL_CYCLE_TIME: number; // minutes per unit
  DESIGN_SPEED: number; // units per minute
  STATUS: 'active' | 'inactive';
  x?: number; // X-coordinate percentage for shop floor layout
  y?: number; // Y-coordinate percentage for shop floor layout
}

export interface DefectType {
  id: number;
  code: string;
  name: string;
}

export interface DefectCause {
  id: number;
  category: 'Man' | 'Machine' | 'Material' | 'Method' | 'Environment';
  detail: string | null;
}

// --- CORE DATA TABLES ---

export interface ProductionDaily {
  Prod_ID: number;
  COMP_DAY: string; // YYYY-MM-DD
  LINE_ID: string;
  MACHINE_ID: string;
  ITEM_CODE: string;
  ACT_PRO_QTY: number;
  DEFECT_QTY: number;
  RUN_TIME_MIN: number;
  DOWNTIME_MIN: number;
  IDEAL_CYCLE_TIME: number; // minutes per unit
  OEE: number;
  shift_id: number;
  SHIFT: 'A' | 'B' | 'C'; // Keep for display consistency
  STATUS?: 'active' | 'inactive';
  availability?: number;
  performance?: number;
  quality?: number;
}

export interface DowntimeRecord {
  Downtime_ID: number;
  COMP_DAY: string; // YYYY-MM-DD
  MACHINE_ID: string;
  DOWNTIME_REASON: string;
  DOWNTIME_MIN: number;
  START_TIME: string; // HH:MM
  END_TIME: string; // HH:MM
}

// --- NEW UNIFIED ERROR REPORTING MODULE ---

export type ErrorReportStatus = 'Reported' | 'In Progress' | 'Fixed' | 'Not Machine Issue' | 'Closed';
export type ErrorSeverity = 'Low' | 'Medium' | 'High';
export type CauseCategory = 'Man' | 'Machine' | 'Material' | 'Method' | 'Environment';

export interface ErrorReport {
  id: number;
  reportNo: string; // e.g., ERR20251026-001
  machine_id: number;
  shift_id: number;
  operator_id: number;
  report_time: string; // ISO Date String
  defect_type: string;
  defect_description: string;
  severity: ErrorSeverity;
  status: ErrorReportStatus;
  root_cause: string | null;
  cause_category: CauseCategory | null;
  action_taken: string | null;
  technician_id: number | null;
  fix_time: string | null;
  verify_by: number | null;
  verify_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  linked_maintenance_order_id: number | null;
}

export interface ErrorImage {
  id: number;
  error_id: number;
  uploaded_by: number;
  role: 'Operator' | 'Maintenance';
  image_url: string;
  description: string | null;
  uploaded_at: string;
}

export interface ErrorHistory {
  id: number;
  error_id: number;
  changed_by: number;
  old_status: ErrorReportStatus | null;
  new_status: ErrorReportStatus;
  note: string | null;
  changed_at: string;
}

// --- MAINTENANCE & SPARE PARTS (Supporting role) ---
export interface SparePart {
    id: number;
    part_code: string;
    name: string;
    location: string;
    available: number; // Qty in main warehouse. "InStock" in PRD.
    in_transit: number; // Qty from open POs. "InTransit" in PRD.
    reserved: number; // Qty issued to maintenance, not yet used. "Reserved" in PRD.
    used_in_period: number; // Qty consumed in current period. "Used" in PRD.
    safety_stock: number;
    reorder_point: number;
    maintenance_interval_days?: number;
    flagged_for_order?: boolean;
}

// FIX: Added missing Maintenance types
export interface MaintenancePartUsage {
    order_id: number;
    part_id: number;
    qty_used: number;
}

export interface MaintenanceOrder {
    id: number;
    machine_id: number;
    type: 'PM' | 'CM' | 'Breakdown'; // Preventive, Corrective
    priority: 'Low' | 'Medium' | 'High';
    status: 'Open' | 'InProgress' | 'Done' | 'Canceled';
    reported_by_id: number;
    assigned_to_id: number | null;
    symptom: string;
    downtime_min: number | null;
    created_at: string;
    completed_at: string | null;
    linked_defect_id: number | null;
    updated_cause_id: number | null;
}

// --- NEW PM SCHEDULE TYPES ---
export type PmType = 'PM-1M' | 'PM-12M' | 'PM-24M' | 'PM-36M' | 'PM-48M' | 'PM-60M';
export type PmCycleDays = 30 | 365 | 730 | 1095 | 1460 | 1825;

export interface MaintenanceSchedule {
  id: number;
  machine_id: number;
  pm_type: PmType;
  last_pm_date: string; // YYYY-MM-DD
  cycle_days: PmCycleDays;
}

export interface EnrichedMaintenanceSchedule extends MaintenanceSchedule {
  MACHINE_ID: string;
  MACHINE_NAME: string;
  next_pm_date: string; // YYYY-MM-DD, calculated
  status: 'On schedule' | 'Due soon' | 'Overdue';
}

export interface PmPartsTemplate {
  pm_type: PmType;
  machine_id: number; // Can be specific to machine, or 0 for general
  parts: { part_id: number; qty: number }[];
}


// --- PURCHASING MODULE ---
export type PurchaseStatus = 'Pending' | 'Approved' | 'Ordered' | 'Received';

export interface McPartPurchaseRequest {
  id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  reason: string;
  status: PurchaseStatus;
  request_date: string; // YYYY-MM-DD
}

export interface ConsumablePurchaseRequest {
  id: number;
  name: string;
  component_code: string;
  specs: string;
  image_url: string;
  quantity: number;
  order_month: string; // YYYY-MM
  receipt_month: string; // YYYY-MM
  notes: string | null;
  status: PurchaseStatus;
}

// New type for MC Part Purchase Orders based on new PRD
export interface McPartOrder {
    id: number;
    order_id: string; // PO number like PO202510A
    item_code: string;
    item_name: string;
    qty_order: number;
    order_date: string; // YYYY-MM-DD
    expected_date: string; // YYYY-MM-DD
    supplier: string;
    status: 'In Transit' | 'Delayed' | 'Received';
    area: string;
}


// --- OEE BENCHMARKING MODULE ---
export interface OeeTarget {
  id: number;
  level: 'Plant' | 'Area' | 'Line' | 'Machine';
  line_id: string | null; // Using string LINE_ID for simplicity with existing filters
  target_oee: number; // 0-1
  target_output: number; // For KpiProgress component
  target_defect_rate: number; // For KpiProgress component
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null;
}

// --- ENRICHED TYPES FOR UI CONSUMPTION ---
export interface EnrichedErrorReport extends ErrorReport {
    MACHINE_ID: string;
    LINE_ID: string;
    SHIFT_CODE: 'A' | 'B' | 'C';
    operator_name: string;
    technician_name: string | null;
    verifier_name: string | null;
    images: ErrorImage[];
    history: (ErrorHistory & { changed_by_name: string })[];
}

// FIX: Added missing EnrichedMaintenanceOrder type
export interface EnrichedMaintenanceOrder extends MaintenanceOrder {
    MACHINE_ID: string;
    reported_by_name: string;
    assigned_to_name: string | null;
    parts_used: (MaintenancePartUsage & { part_code: string, part_name: string })[];
}

// FIX: Added missing DefectRecord and EnrichedDefectRecord types for legacy defect system
export interface DefectRecord {
    id: number;
    work_date: string;
    machine_id: number;
    shift_id: number;
    defect_type_id: number;
    cause_id: number | null;
    quantity: number;
    note: string | null;
    severity: 'Low' | 'Medium' | 'High';
    status: 'Open' | 'In Progress' | 'Closed';
    is_abnormal: boolean;
    reporter_id: number;
    linked_maintenance_order_id: number | null;
    image_urls?: string[];
}

export interface EnrichedDefectRecord extends DefectRecord {
    MACHINE_ID: string;
    SHIFT: 'A' | 'B' | 'C';
    defect_type_name: string;
    cause_category: CauseCategory | null;
    reporter_name: string;
    image_urls: string[];
}


// --- FORM SUBMISSION TYPES ---
export interface NewErrorReportData {
  machine_id: number;
  shift_id: number;
  operator_id: number;
  defect_type: string;
  defect_description: string;
  severity: ErrorSeverity;
  images?: { url: string; description: string }[]; // Simplified for mock
  linked_maintenance_order_id?: number | null;
}

export interface UpdateErrorData {
  root_cause: string;
  cause_category: CauseCategory;
  action_taken: string;
  technician_id: number;
  images?: { url: string; description: string }[];
}

export interface NewMachineData {
  MACHINE_ID: string;
  MACHINE_NAME: string;
  LINE_ID: string;
  IDEAL_CYCLE_TIME: number;
  DESIGN_SPEED: number;
  STATUS: 'active' | 'inactive';
}

export interface NewSparePartData {
    part_code: string;
    name: string;
    location: string;
    available: number;
    reorder_point: number;
    safety_stock: number;
    in_transit: number;
    reserved: number;
    used_in_period: number;
    maintenance_interval_days?: number;
}

export interface NewMcPartRequestData {
    item_code: string;
    item_name: string;
    quantity: number;
    reason: string;
}

export interface NewConsumableRequestData {
    name: string;
    component_code: string;
    specs: string;
    image_url: string;
    quantity: number;
    order_month: string;
    receipt_month: string;
    notes: string | null;
}


// FIX: Added missing NewDefectData type
export interface NewDefectData {
    work_date: string;
    machine_id: number;
    shift_id: number;
    defect_type_id: number;
    cause_id: number;
    quantity: number;
    note: string;
    severity: 'Low' | 'Medium' | 'High';
    status: 'Open' | 'In Progress' | 'Closed';
    is_abnormal: boolean;
    reporter_id: number;
    image_urls: string[];
    linked_maintenance_order_id: number | null;
}

// FIX: Added missing NewMaintenanceOrderData type
export interface NewMaintenanceOrderData {
    machine_id: number;
    type: 'PM' | 'CM' | 'Breakdown';
    priority: 'Low' | 'Medium' | 'High';
    reported_by_id: number;
    symptom: string;
    created_at: string;
    linked_defect_id: number | null;
    updated_cause_id: number | null;
    assigned_to_id?: number | null;
    parts_used?: { part_id: number, qty_used: number }[];
}

// FIX: Added missing checklist types
// --- CHECKLIST MODULE ---
export type ChecklistItemStatus = 'Checked' | 'Unchecked';
export type ChecklistInstanceStatus = 'Pending' | 'In Progress' | 'Completed';

export interface ChecklistItemTemplate {
    id: number;
    text: string;
    expected_value: string | null;
    sequence: number;
}

export interface ChecklistTemplate {
    id: number;
    name: string;
    description: string;
    area: 'Stamping' | 'Assembly' | 'Painting' | 'Finishing';
    type: 'Daily' | 'Weekly' | 'Setup';
    items: ChecklistItemTemplate[];
}

export interface ChecklistInstanceItem {
    id: number;
    instance_id: number;
    item_template_id: number;
    status: ChecklistItemStatus;
    actual_value: string | null;
    notes: string | null;
    // from template for easy display
    text: string;
    expected_value: string | null;
}

export interface EnrichedChecklistInstance {
    id: number;
    status: ChecklistInstanceStatus;
    created_at: string;
    completed_at: string | null;
    template_name: string;
    template_description: string;
    MACHINE_ID: string;
    assigned_to_name: string;
    items: ChecklistInstanceItem[];
}

// --- UTILITY & CHARTING TYPES (Largely unchanged) ---
export interface DefectAdjustmentLog {
  logId: number;
  prodId: number;
  machineId: string;
  timestamp: string;
  previousValue: number;
  newValue: number;
  user: string;
}

export interface DataPoint {
  name: string;
  value: number;
  cumulative?: number;
}

export interface TrendData {
  date: string;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
  defectRate?: number;
  downtime?: number;
  totalDefects?: number;
}

export interface StackedBarDataPoint {
  name: string;
  [key: string]: number | string;
}

export interface Top5DefectLine {
  lineId: string;
  defectRate: number;
  totalDefects: number;
  totalProduction: number;
}

export interface Top5DowntimeMachine {
  machineId: string;
  totalDowntime: number;
}

export interface BoxplotDataPoint {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface HeatmapDataPoint {
  shift: string;
  line: string;
  value: number;
}

export interface MachineStatusData {
    machineId: string;
    status: 'Running' | 'Stopped' | 'Error' | 'Inactive';
    oee: number | null;
    lineId: string;
}

export interface MaintenanceKpis {
  mtbf: number;
  mttr: number;
  breakdownCount: number;
  topMttrMachines: DataPoint[];
}

// --- NEW TYPES FOR MAINTENANCE DASHBOARD PRD ---
export interface MachineMaintenanceStats {
  machineId: string;
  mtbf: number;
  mttr: number;
  breakdownCount: number;
  totalDowntime: number;
  status: 'Alert' | 'Warning' | 'Normal';
}

export interface DowntimeCauseStats {
  reason: string;
  count: number;
  totalMinutes: number;
  mainMachineImpact: string;
}


// The main, fully-structured data object for the dashboard
export interface DashboardData {
  productionLog: ProductionDaily[];
  downtimeRecords: DowntimeRecord[];
  allMachineInfo: MachineInfo[];
  
  // New Error Reporting Data
  errorReports: EnrichedErrorReport[];
  
  // FIX: Added missing data for other modules
  allDefectRecords: EnrichedDefectRecord[];
  maintenanceOrders: EnrichedMaintenanceOrder[];

  availableLines: string[];
  availableMachines: string[];
  
  // New master data for UI elements like dropdowns
  masterData: {
    users: User[];
    shifts: Shift[];
    defectTypes: DefectType[];
    defectCauses: DefectCause[];
    // FIX: Added machines to masterData for easier access in modals
    machines: MachineInfo[];
    spareParts: SparePart[];
    pmPartsTemplates: PmPartsTemplate[];
  };

  machineStatus: MachineStatusData[];

  summary: {
    totalProduction: number;
    totalDefects: number;
    totalDowntime: number;
    machineUtilization: number;
    avgOee: number;
    avgAvailability: number;
    avgPerformance: number;
    avgQuality: number;
    productionByLine: DataPoint[];
    oeeByLine: DataPoint[];
  };

  performance: {
    sevenDayTrend: TrendData[];
    productionBoxplot: BoxplotDataPoint[];
    oeeHeatmap: HeatmapDataPoint[];
  };

  quality: {
    defectPareto: DataPoint[];
    defectRateTrend: TrendData[];
    defectTrend: TrendData[];
    top5DefectLines: Top5DefectLine[];
    defectsByRootCause: DataPoint[];
  };

  downtime: {
    downtimePareto: DataPoint[];
    downtimeTrend: TrendData[];
    downtimeByCategory: DataPoint[];
    top5DowntimeMachines: Top5DowntimeMachine[];
    downtimeByLine: StackedBarDataPoint[];
    uniqueDowntimeReasons: string[];
  };
  
  maintenance: {
    kpis: MaintenanceKpis;
    schedule: {
      overdue: EnrichedMaintenanceOrder[];
      dueSoon: EnrichedMaintenanceOrder[];
    };
    pmSchedule: EnrichedMaintenanceSchedule[];
    spareParts: SparePart[];
    lowStockParts: SparePart[];
    mcPartOrders: McPartOrder[];
    // New data based on PRD
    machineStats: MachineMaintenanceStats[];
    downtimeAnalysis: DowntimeCauseStats[];
    trend: { date: string, mtbf?: number, mttr?: number }[];
  };

  benchmarking: {
    oeeByLine: DataPoint[];
    targets: OeeTarget[];
  };

  purchasing: {
    mcPartRequests: McPartPurchaseRequest[];
    consumableRequests: ConsumablePurchaseRequest[];
  };
}