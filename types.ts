// types.ts

export interface MachineInfo {
  MACHINE_ID: string;
  MACHINE_NAME: string;
  LINE_ID: string;
  IDEAL_CYCLE_TIME: number; // minutes per unit
  DESIGN_SPEED: number; // units per minute
  STATUS: 'active' | 'inactive';
  x?: number; // X-coordinate percentage for shop floor layout
  y?: number; // Y-coordinate percentage for shop floor layout
}

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
  SHIFT: 'A' | 'B' | 'C';
  STATUS?: 'active' | 'inactive';
  // Optional fields for detailed table
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

export interface DefectRecord {
  Defect_ID: number;
  COMP_DAY: string; // YYYY-MM-DD
  MACHINE_ID: string;
  DEFECT_TYPE: string; // Title
  DEFECT_QTY: number;
  SHIFT: 'A' | 'B' | 'C';
  ITEM_CODE: string;
  LINE_ID: string;
  DEFECT_CATEGORY: 'Fixed' | 'Abnormal';
  DESCRIPTION: string;
  SEVERITY: 'Low' | 'Medium' | 'High';
  DISCOVERED_BY: string;
  STATUS: 'Open' | 'In Progress' | 'Closed';
  ROOT_CAUSE?: string;
  CORRECTIVE_ACTION?: string;
  RESPONSIBLE_PERSON?: string;
  DUE_DATE?: string;
  ATTACHMENT_URL?: string;
}

export interface OperatorInfo {
  OPERATOR_ID: string;
  OPERATOR_NAME: string;
  SHIFT: 'A' | 'B' | 'C';
  LINE_ID: string;
  TEAM: string;
}

// Updated NewProductionData for the defect entry form
export interface NewProductionData {
  // Existing fields
  MACHINE_ID: string;
  LINE_ID: string;
  SHIFT: 'A' | 'B' | 'C';
  DEFECT_QTY: number;
  DEFECT_TYPE: string; // Title
  OPERATOR_NAME: string; // Will be repurposed as DISCOVERED_BY
  COMP_DAY: string;
  
  DEFECT_CATEGORY: 'Fixed' | 'Abnormal';

  // New mandatory fields
  DESCRIPTION: string;
  SEVERITY: 'Low' | 'Medium' | 'High';
  STATUS: 'Open' | 'In Progress' | 'Closed';

  // New optional fields
  ROOT_CAUSE?: string;
  CORRECTIVE_ACTION?: string;
  RESPONSIBLE_PERSON?: string;
  DUE_DATE?: string;
  ATTACHMENT_URL?: string;
}

// New interface for logging manual defect adjustments
export interface DefectAdjustmentLog {
  logId: number;
  prodId: number;
  machineId: string;
  timestamp: string; // ISO 8601 format
  previousValue: number;
  newValue: number;
  user: string; // e.g., 'Admin'
}

// Generic data point for simple charts (bar, pie, line)
export interface DataPoint {
  name: string; // e.g., Line ID, Date, Defect Type, Downtime Reason
  value: number;
  cumulative?: number;
}

// Data for multi-series trend charts
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

// Data for stacked bar charts (e.g., Downtime by Line & Reason)
// Example: { name: 'Line 31', Setup: 40, Jam: 30 }
export interface StackedBarDataPoint {
  name: string; // Usually the category on the axis, e.g., Line ID
  [key: string]: number | string; // Each key is a segment in the bar
}

// Data for Top 5 tables
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
  name: string; // Line ID
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface HeatmapDataPoint {
  shift: string;
  line: string;
  value: number; // OEE
}


// Structured data for each dashboard section

export interface OverallSummary {
  totalProduction: number;
  totalDefects: number;
  totalDowntime: number;
  machineUtilization: number;
  avgOee: number;
  avgAvailability: number;
  avgPerformance: number;
  avgQuality: number;
  productionByLine: DataPoint[]; // For bar chart
  oeeByLine: DataPoint[]; // For bar chart
}

export interface PerformanceAnalysis {
  sevenDayTrend: TrendData[];
  productionBoxplot: BoxplotDataPoint[];
  oeeHeatmap: HeatmapDataPoint[];
}

export interface QualityAnalysis {
  defectPareto: DataPoint[];
  defectRateTrend: TrendData[];
  defectTrend: TrendData[];
  top5DefectLines: Top5DefectLine[];
}

export interface DowntimeAnalysis {
  downtimePareto: DataPoint[];
  downtimeTrend: TrendData[];
  downtimeByCategory: DataPoint[]; // For pie chart
  top5DowntimeMachines: Top5DowntimeMachine[];
  downtimeByLine: StackedBarDataPoint[];
  uniqueDowntimeReasons: string[];
}

// New interface for the detailed defect analysis tab
export interface DefectAnalysis {
    defectsBySeverity: DataPoint[];
    defectsByStatus: DataPoint[];
    defectsByCategory: DataPoint[];
}


// New interface for machine status on the shop floor layout
export interface MachineStatusData {
    machineId: string;
    status: 'Running' | 'Stopped' | 'Error' | 'Inactive';
    oee: number | null;
    lineId: string;
}


// The main, fully-structured data object for the dashboard
export interface DashboardData {
  // Raw data for detailed tables and modals
  productionLog: ProductionDaily[];
  downtimeRecords: DowntimeRecord[];
  allMachineInfo: MachineInfo[]; // Added for layout component
  allDefectRecords: DefectRecord[]; // Added for new defect log table

  // Data for filter controls
  availableLines: string[];
  availableMachines: string[];

  // Real-time status for shop floor map
  machineStatus: MachineStatusData[];

  // Processed data for each dashboard section
  summary: OverallSummary;
  performance: PerformanceAnalysis;
  quality: QualityAnalysis;
  downtime: DowntimeAnalysis;
  defectAnalysis: DefectAnalysis; // New section
}
