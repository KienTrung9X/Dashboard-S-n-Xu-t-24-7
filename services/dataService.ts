

import { ProductionDaily, DowntimeRecord, DefectRecord, DashboardData, DataPoint, TrendData, Top5DefectLine, Top5DowntimeMachine, StackedBarDataPoint, BoxplotDataPoint, HeatmapDataPoint, MachineInfo, NewProductionData, DefectAdjustmentLog } from '../types';
import { quantile } from 'simple-statistics';

const SHIFTS: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

const LINE_TO_AREA_MAP: Record<string, string> = {
    '31': 'Area Stamping',
    '32': 'Area Assembly',
    '41': 'Area Painting',
    '42': 'Area Painting',
    '51': 'Area Finishing',
};

export const machineInfoData: MachineInfo[] = [
    { MACHINE_ID: 'M01', MACHINE_NAME: 'Assembler Alpha', LINE_ID: '32', IDEAL_CYCLE_TIME: 0.045, DESIGN_SPEED: 22, STATUS: 'active' },
    { MACHINE_ID: 'M02', MACHINE_NAME: 'Assembler Beta', LINE_ID: '32', IDEAL_CYCLE_TIME: 0.045, DESIGN_SPEED: 22, STATUS: 'active' },
    { MACHINE_ID: 'M03', MACHINE_NAME: 'Stamping Press 1', LINE_ID: '31', IDEAL_CYCLE_TIME: 0.06, DESIGN_SPEED: 17, STATUS: 'active' },
    { MACHINE_ID: 'M04', MACHINE_NAME: 'Paint Booth A', LINE_ID: '41', IDEAL_CYCLE_TIME: 0.25, DESIGN_SPEED: 4, STATUS: 'inactive' },
    { MACHINE_ID: 'M05', MACHINE_NAME: 'Paint Booth B', LINE_ID: '42', IDEAL_CYCLE_TIME: 0.24, DESIGN_SPEED: 4, STATUS: 'active' },
    { MACHINE_ID: 'M06', MACHINE_NAME: 'Finishing Line 1', LINE_ID: '51', IDEAL_CYCLE_TIME: 0.08, DESIGN_SPEED: 12, STATUS: 'active' },
];

// Expanded mock data to cover 30 days, multiple lines, machines, and areas
// Changed to `let` to allow for additions
// FIX: Add explicit type `ProductionDaily[]` to the return of the flatMap callback to fix type inference issue with the STATUS property.
export let productionDailyData: ProductionDaily[] = Array.from({ length: 30 }).flatMap((_, i): ProductionDaily[] => {
    const date = new Date('2025-10-30');
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().slice(0, 10);
    return [
        // Area Stamping
        { Prod_ID: i * 6 + 1, COMP_DAY: dateString, LINE_ID: '31', MACHINE_ID: 'M03', ITEM_CODE: '03CI Assy', ACT_PRO_QTY: 20500 + i * 50, DEFECT_QTY: 50 + i * 3, RUN_TIME_MIN: 1400 - i * 5, DOWNTIME_MIN: 40 + i * 5, IDEAL_CYCLE_TIME: 0.06, OEE: 0.90 - i * 0.008, SHIFT: SHIFTS[(i*6+1)%3], STATUS: 'active' },
        // Area Assembly
        { Prod_ID: i * 6 + 2, COMP_DAY: dateString, LINE_ID: '32', MACHINE_ID: 'M01', ITEM_CODE: '05CITape', ACT_PRO_QTY: 28000 + i * 200, DEFECT_QTY: 120 - i * 5, RUN_TIME_MIN: 1320 - i * 10, DOWNTIME_MIN: 120 + i * 10, IDEAL_CYCLE_TIME: 0.045, OEE: 0.89 - i * 0.01, SHIFT: SHIFTS[(i*6+2)%3], STATUS: 'active' },
        { Prod_ID: i * 6 + 3, COMP_DAY: dateString, LINE_ID: '32', MACHINE_ID: 'M02', ITEM_CODE: '05CITape', ACT_PRO_QTY: 27000 - i * 150, DEFECT_QTY: 200 + i * 8, RUN_TIME_MIN: 1280 + i * 5, DOWNTIME_MIN: 160 - i * 8, IDEAL_CYCLE_TIME: 0.045, OEE: 0.84 + i * 0.005, SHIFT: SHIFTS[(i*6+3)%3], STATUS: 'active' },
        // Area Painting
        { Prod_ID: i * 6 + 4, COMP_DAY: dateString, LINE_ID: '41', MACHINE_ID: 'M04', ITEM_CODE: 'Panel_A', ACT_PRO_QTY: 5000 - i * 100, DEFECT_QTY: 80 + i * 2, RUN_TIME_MIN: 1300, DOWNTIME_MIN: 140, IDEAL_CYCLE_TIME: 0.25, OEE: 0.82 - i*0.01, SHIFT: SHIFTS[(i*6+4)%3], STATUS: 'inactive' },
        { Prod_ID: i * 6 + 5, COMP_DAY: dateString, LINE_ID: '42', MACHINE_ID: 'M05', ITEM_CODE: 'Panel_B', ACT_PRO_QTY: 5200 + i * 50, DEFECT_QTY: 60 - i, RUN_TIME_MIN: 1350, DOWNTIME_MIN: 90, IDEAL_CYCLE_TIME: 0.24, OEE: 0.88 + i*0.005, SHIFT: SHIFTS[(i*6+5)%3], STATUS: 'active' },
        // Area Finishing
        { Prod_ID: i * 6 + 6, COMP_DAY: dateString, LINE_ID: '51', MACHINE_ID: 'M06', ITEM_CODE: 'Final Assy', ACT_PRO_QTY: 15000 + i * 100, DEFECT_QTY: 150 - i * 4, RUN_TIME_MIN: 1380 - i*10, DOWNTIME_MIN: 60 + i*10, IDEAL_CYCLE_TIME: 0.08, OEE: 0.91 - i*0.002, SHIFT: SHIFTS[(i*6+6)%3], STATUS: 'active' },
    ];
}).reverse();

export let downtimeRecords: DowntimeRecord[] = Array.from({ length: 30 }).flatMap((_, i) => {
    const date = new Date('2025-10-30');
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().slice(0, 10);
    return [
        { Downtime_ID: i * 8 + 1, COMP_DAY: dateString, MACHINE_ID: 'M01', DOWNTIME_REASON: 'Setup', DOWNTIME_MIN: 80 - i * 2, START_TIME: '00:30', END_TIME: '01:50' },
        { Downtime_ID: i * 8 + 2, COMP_DAY: dateString, MACHINE_ID: 'M01', DOWNTIME_REASON: 'Jam', DOWNTIME_MIN: 40 + i * 3, START_TIME: '06:15', END_TIME: '06:55' },
        { Downtime_ID: i * 8 + 3, COMP_DAY: dateString, MACHINE_ID: 'M02', DOWNTIME_REASON: 'Maintenance', DOWNTIME_MIN: 120 + i, START_TIME: '10:00', END_TIME: '12:00' },
        { Downtime_ID: i * 8 + 4, COMP_DAY: dateString, MACHINE_ID: 'M03', DOWNTIME_REASON: 'Tooling Issues', DOWNTIME_MIN: 40 + i, START_TIME: '08:00', END_TIME: '08:40' },
        { Downtime_ID: i * 8 + 5, COMP_DAY: dateString, MACHINE_ID: 'M04', DOWNTIME_REASON: 'Material Shortage', DOWNTIME_MIN: 90 - i * 5, START_TIME: '14:00', END_TIME: '15:30' },
        { Downtime_ID: i * 8 + 6, COMP_DAY: dateString, MACHINE_ID: 'M05', DOWNTIME_REASON: 'Machine Failure', DOWNTIME_MIN: 50 + i * 2, START_TIME: '16:00', END_TIME: '16:50' },
        { Downtime_ID: i * 8 + 7, COMP_DAY: dateString, MACHINE_ID: 'M06', DOWNTIME_REASON: 'Quality Hold', DOWNTIME_MIN: 60 - i, START_TIME: '23:00', END_TIME: '00:00' },
        { Downtime_ID: i * 8 + 8, COMP_DAY: dateString, MACHINE_ID: 'M02', DOWNTIME_REASON: 'Operator Absent', DOWNTIME_MIN: 30 + i, START_TIME: '17:00', END_TIME: '17:30' },
    ];
}).reverse();

export let defectRecords: DefectRecord[] = Array.from({ length: 30 }).flatMap((_, i): DefectRecord[] => {
    const date = new Date('2025-10-30');
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().slice(0, 10);
    // FIX: Add `as const` to preserve the literal types of the SHIFT property, preventing it from being widened to `string`.
    const mockRecords = [
        { Defect_ID: i * 6 + 1, COMP_DAY: dateString, MACHINE_ID: 'M01', DEFECT_TYPE: 'Skip stitch', DEFECT_QTY: 85 - i * 5, SHIFT: 'B', ITEM_CODE: '05CITape' },
        { Defect_ID: i * 6 + 2, COMP_DAY: dateString, MACHINE_ID: 'M01', DEFECT_TYPE: 'Tape jam', DEFECT_QTY: 40 + i * 2, SHIFT: 'C', ITEM_CODE: '05CITape' },
        { Defect_ID: i * 6 + 3, COMP_DAY: dateString, MACHINE_ID: 'M02', DEFECT_TYPE: 'Cosmetic', DEFECT_QTY: 150 + i * 10, SHIFT: 'A', ITEM_CODE: '05CITape' },
        { Defect_ID: i * 6 + 4, COMP_DAY: dateString, MACHINE_ID: 'M03', DEFECT_TYPE: 'Misaligned', DEFECT_QTY: 50 - i, SHIFT: 'A', ITEM_CODE: '03CI Assy' },
        { Defect_ID: i * 6 + 5, COMP_DAY: dateString, MACHINE_ID: 'M04', DEFECT_TYPE: 'Paint Drip', DEFECT_QTY: 60, SHIFT: 'B', ITEM_CODE: 'Panel_A' },
        { Defect_ID: i * 6 + 6, COMP_DAY: dateString, MACHINE_ID: 'M05', DEFECT_TYPE: 'Scratch', DEFECT_QTY: 40, SHIFT: 'C', ITEM_CODE: 'Panel_B' },
        { Defect_ID: i * 6 + 7, COMP_DAY: dateString, MACHINE_ID: 'M06', DEFECT_TYPE: 'Packaging', DEFECT_QTY: 100 - i * 3, SHIFT: 'B', ITEM_CODE: 'Final Assy' },
    ] as const;
    // Add new detailed fields to mock data
    return mockRecords.map((rec, index) => {
        const machine = machineInfoData.find(m => m.MACHINE_ID === rec.MACHINE_ID);
        return {
            ...rec,
            LINE_ID: machine?.LINE_ID || 'N/A',
            DESCRIPTION: `This is a sample detailed description for the defect '${rec.DEFECT_TYPE}' found on machine ${rec.MACHINE_ID}. Further analysis may be required.`,
            SEVERITY: index % 3 === 0 ? 'High' : index % 2 === 0 ? 'Medium' : 'Low',
            DISCOVERED_BY: 'Auto-generated',
            STATUS: index % 4 === 0 ? 'Closed' : index % 3 === 0 ? 'In Progress' : 'Open',
            ROOT_CAUSE: index % 2 === 0 ? 'Operator error during setup.' : 'Material specification out of tolerance.',
            CORRECTIVE_ACTION: 'Retrain operator on SOP-102.',
            RESPONSIBLE_PERSON: 'Jane Doe',
            DUE_DATE: '2025-11-15'
        };
    });
}).reverse();

// In-memory log for defect adjustments
let defectAdjustmentLogs: DefectAdjustmentLog[] = [];

// Function to get initial data for filters
export const getInitialFilterData = () => {
    const availableAreas = ['all', ...Array.from(new Set(Object.values(LINE_TO_AREA_MAP)))];
    const defaultDate = productionDailyData[productionDailyData.length - 1]?.COMP_DAY || new Date().toISOString().slice(0, 10);
    const defaultArea = 'all';

    return { availableAreas, defaultDate, defaultArea };
};

export const getMachineInfo = (machineId: string): MachineInfo | null => {
    return machineInfoData.find(m => m.MACHINE_ID === machineId) || null;
};

// Function to add new defect data
export const addDefectData = (newData: NewProductionData) => {
    // Create a new DefectRecord
    const newDefectId = Math.max(...defectRecords.map(d => d.Defect_ID), 0) + 1;
    const machineInfo = getMachineInfo(newData.MACHINE_ID);

    const newDefect: DefectRecord = {
        Defect_ID: newDefectId,
        COMP_DAY: newData.COMP_DAY,
        MACHINE_ID: newData.MACHINE_ID,
        LINE_ID: newData.LINE_ID,
        SHIFT: newData.SHIFT,
        ITEM_CODE: machineInfo?.MACHINE_NAME || 'Unknown',
        DEFECT_TYPE: newData.DEFECT_TYPE,
        DEFECT_QTY: newData.DEFECT_QTY,
        DESCRIPTION: newData.DESCRIPTION,
        SEVERITY: newData.SEVERITY,
        DISCOVERED_BY: newData.OPERATOR_NAME,
        STATUS: newData.STATUS,
        ROOT_CAUSE: newData.ROOT_CAUSE,
        CORRECTIVE_ACTION: newData.CORRECTIVE_ACTION,
        RESPONSIBLE_PERSON: newData.RESPONSIBLE_PERSON,
        DUE_DATE: newData.DUE_DATE,
        ATTACHMENT_URL: newData.ATTACHMENT_URL,
    };
    defectRecords.unshift(newDefect); // Add to beginning for visibility

    // Find the corresponding production log and update the defect quantity
    const prodLog = productionDailyData.find(p =>
        p.COMP_DAY === newData.COMP_DAY &&
        p.MACHINE_ID === newData.MACHINE_ID &&
        p.SHIFT === newData.SHIFT
    );

    if (prodLog) {
        prodLog.DEFECT_QTY += newData.DEFECT_QTY;
    } else {
        // If no production log exists, we might need to create a new one.
        // For simplicity, this example assumes a log for the day/machine/shift exists.
        console.warn("No production log found for the new defect entry. Defect is logged, but daily summary might not update immediately.");
    }
};

// Function to update defect quantity in the production log
export const updateDefectQuantity = (prodId: number, newQty: number): { success: boolean; message: string } => {
    const record = productionDailyData.find(p => p.Prod_ID === prodId);
    if (!record) {
        return { success: false, message: 'Record not found.' };
    }
    const previousValue = record.DEFECT_QTY;
    record.DEFECT_QTY = newQty;

    // Log the adjustment
    const newLog: DefectAdjustmentLog = {
        logId: defectAdjustmentLogs.length + 1,
        prodId: prodId,
        machineId: record.MACHINE_ID,
        timestamp: new Date().toISOString(),
        previousValue: previousValue,
        newValue: newQty,
        user: 'Admin', // In a real app, this would be the logged-in user
    };
    defectAdjustmentLogs.push(newLog);

    return { success: true, message: `Defects for machine ${record.MACHINE_ID} updated successfully.` };
};

// Function to get the adjustment history for a machine
export const getDefectAdjustmentHistory = (machineId: string): DefectAdjustmentLog[] => {
    return defectAdjustmentLogs.filter(log => log.machineId === machineId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Main data processing function
export const getDashboardData = (
    startDate: string,
    endDate: string,
    selectedArea: string,
    selectedShift: 'all' | 'A' | 'B' | 'C',
    selectedStatus: 'all' | 'active' | 'inactive',
    opts: { signal?: AbortSignal } = {}
): Promise<DashboardData> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            // Simulate potential failure
            if (Math.random() > 0.9) { // 10% chance of failure
                reject(new Error("A random network error occurred. Please try again."));
                return;
            }

            try {
                 // Determine which machines to include based on status
                const allowedMachineIdsByStatus = new Set(
                    machineInfoData
                        .filter(m => selectedStatus === 'all' || m.STATUS === selectedStatus)
                        .map(m => m.MACHINE_ID)
                );

                // Filtering
                const linesInArea = selectedArea === 'all'
                    ? Object.keys(LINE_TO_AREA_MAP)
                    : Object.keys(LINE_TO_AREA_MAP).filter(line => LINE_TO_AREA_MAP[line] === selectedArea);

                const filteredProduction = productionDailyData.filter(p =>
                    p.COMP_DAY >= startDate &&
                    p.COMP_DAY <= endDate &&
                    linesInArea.includes(p.LINE_ID) &&
                    (selectedShift === 'all' || p.SHIFT === selectedShift) &&
                    allowedMachineIdsByStatus.has(p.MACHINE_ID)
                );

                const machineIdsInFilter = [...new Set(filteredProduction.map(p => p.MACHINE_ID))];

                const filteredDowntime = downtimeRecords.filter(d =>
                    d.COMP_DAY >= startDate &&
                    d.COMP_DAY <= endDate &&
                    machineIdsInFilter.includes(d.MACHINE_ID)
                );
                
                const filteredDefects = defectRecords.filter(d =>
                    d.COMP_DAY >= startDate &&
                    d.COMP_DAY <= endDate &&
                    machineIdsInFilter.includes(d.MACHINE_ID)
                );

                // Calculations
                const totalProduction = filteredProduction.reduce((sum, p) => sum + p.ACT_PRO_QTY, 0);
                const totalDefects = filteredProduction.reduce((sum, p) => sum + p.DEFECT_QTY, 0);
                const totalDowntime = filteredProduction.reduce((sum, p) => sum + p.DOWNTIME_MIN, 0);
                const totalRuntime = filteredProduction.reduce((sum, p) => sum + p.RUN_TIME_MIN, 0);

                const avgOee = filteredProduction.length ? filteredProduction.reduce((sum, p) => sum + p.OEE, 0) / filteredProduction.length : 0;
                
                const goodParts = totalProduction - totalDefects;
                const quality = totalProduction > 0 ? goodParts / totalProduction : 0;
                const availability = (totalRuntime + totalDowntime) > 0 ? totalRuntime / (totalRuntime + totalDowntime) : 0;
                const performance = totalProduction > 0 && totalRuntime > 0 ? (totalProduction * Math.min(...filteredProduction.map(p => p.IDEAL_CYCLE_TIME))) / totalRuntime : 0;
                
                // Summary charts
                const productionByLine: DataPoint[] = Object.entries(
                    filteredProduction.reduce((acc, p) => {
                        acc[p.LINE_ID] = (acc[p.LINE_ID] || 0) + p.ACT_PRO_QTY;
                        return acc;
                    }, {} as Record<string, number>)
                ).map(([name, value]) => ({ name, value }));
                
                const oeeByLine: DataPoint[] = Object.entries(
                     filteredProduction.reduce((acc, p) => {
                        if (!acc[p.LINE_ID]) acc[p.LINE_ID] = { sum: 0, count: 0 };
                        acc[p.LINE_ID].sum += p.OEE;
                        acc[p.LINE_ID].count++;
                        return acc;
                    }, {} as Record<string, { sum: number, count: number }>)
                ).map(([name, data]) => ({ name, value: data.count > 0 ? data.sum / data.count : 0 }));


                // Quality Analysis
                const defectParetoData = Object.entries(
                    filteredDefects.reduce((acc, d) => {
                        acc[d.DEFECT_TYPE] = (acc[d.DEFECT_TYPE] || 0) + d.DEFECT_QTY;
                        return acc;
                    }, {} as Record<string, number>)
                ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

                let cumulative = 0;
                const totalDefectCount = defectParetoData.reduce((sum, item) => sum + item.value, 0);
                const defectPareto = defectParetoData.map(item => {
                    cumulative += item.value;
                    return { ...item, cumulative: totalDefectCount > 0 ? (cumulative / totalDefectCount) * 100 : 0 };
                });
                
                // Downtime Analysis
                const downtimeParetoData = Object.entries(
                    filteredDowntime.reduce((acc, d) => {
                        acc[d.DOWNTIME_REASON] = (acc[d.DOWNTIME_REASON] || 0) + d.DOWNTIME_MIN;
                        return acc;
                    }, {} as Record<string, number>)
                ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                
                let cumulativeDt = 0;
                const totalDowntimeMinutes = downtimeParetoData.reduce((sum, item) => sum + item.value, 0);
                const downtimePareto = downtimeParetoData.map(item => {
                    cumulativeDt += item.value;
                    return { ...item, cumulative: totalDowntimeMinutes > 0 ? (cumulativeDt / totalDowntimeMinutes) * 100 : 0 };
                });

                const top5DowntimeMachines: Top5DowntimeMachine[] = Object.entries(
                    filteredProduction.reduce((acc, p) => {
                        acc[p.MACHINE_ID] = (acc[p.MACHINE_ID] || 0) + p.DOWNTIME_MIN;
                        return acc;
                    }, {} as Record<string, number>)
                )
                .map(([machineId, totalDowntime]) => ({ machineId, totalDowntime }))
                .sort((a, b) => b.totalDowntime - a.totalDowntime)
                .slice(0, 5);


                // Create production log with calculated A, P, Q
                const productionLog = filteredProduction.map(p => {
                    const machine = machineInfoData.find(m => m.MACHINE_ID === p.MACHINE_ID);
                    const totalTime = p.RUN_TIME_MIN + p.DOWNTIME_MIN;
                    const availability = totalTime > 0 ? p.RUN_TIME_MIN / totalTime : 0;
                    const performance = p.ACT_PRO_QTY > 0 && p.RUN_TIME_MIN > 0 && machine ? (p.ACT_PRO_QTY * machine.IDEAL_CYCLE_TIME) / p.RUN_TIME_MIN : 0;
                    const goodParts = p.ACT_PRO_QTY - p.DEFECT_QTY;
                    const quality = p.ACT_PRO_QTY > 0 ? goodParts / p.ACT_PRO_QTY : 0;
                    return { ...p, availability, performance, quality };
                }).sort((a,b) => b.OEE - a.OEE);
                
                // --- Advanced Analytics Calculations ---
                
                const dailyAggregates: { [date: string]: { oeeSum: number; availabilitySum: number; performanceSum: number; qualitySum: number; prodSum: number; defectSum: number; downtimeSum: number; count: number; } } = {};

                productionLog.forEach(p => {
                    if (!dailyAggregates[p.COMP_DAY]) {
                        dailyAggregates[p.COMP_DAY] = { oeeSum: 0, availabilitySum: 0, performanceSum: 0, qualitySum: 0, prodSum: 0, defectSum: 0, downtimeSum: 0, count: 0 };
                    }
                    dailyAggregates[p.COMP_DAY].oeeSum += p.OEE;
                    dailyAggregates[p.COMP_DAY].availabilitySum += p.availability ?? 0;
                    dailyAggregates[p.COMP_DAY].performanceSum += p.performance ?? 0;
                    dailyAggregates[p.COMP_DAY].qualitySum += p.quality ?? 0;
                    dailyAggregates[p.COMP_DAY].prodSum += p.ACT_PRO_QTY;
                    dailyAggregates[p.COMP_DAY].defectSum += p.DEFECT_QTY;
                    dailyAggregates[p.COMP_DAY].downtimeSum += p.DOWNTIME_MIN;
                    dailyAggregates[p.COMP_DAY].count++;
                });
                
                const sortedDates = Object.keys(dailyAggregates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

                const sevenDayTrend: TrendData[] = sortedDates.map(date => ({
                    date,
                    oee: dailyAggregates[date].oeeSum / dailyAggregates[date].count,
                    availability: dailyAggregates[date].availabilitySum / dailyAggregates[date].count,
                    performance: dailyAggregates[date].performanceSum / dailyAggregates[date].count,
                    quality: dailyAggregates[date].qualitySum / dailyAggregates[date].count,
                }));

                const defectRateTrend: TrendData[] = sortedDates.map(date => ({
                    date,
                    defectRate: dailyAggregates[date].prodSum > 0 ? dailyAggregates[date].defectSum / dailyAggregates[date].prodSum : 0,
                }));

                const downtimeTrend: TrendData[] = sortedDates.map(date => ({
                    date,
                    downtime: dailyAggregates[date].downtimeSum,
                }));

                const prodByLine: { [lineId: string]: number[] } = {};
                filteredProduction.forEach(p => {
                    if (!prodByLine[p.LINE_ID]) prodByLine[p.LINE_ID] = [];
                    prodByLine[p.LINE_ID].push(p.ACT_PRO_QTY);
                });
                const productionBoxplot: BoxplotDataPoint[] = Object.entries(prodByLine)
                    .map(([lineId, values]) => {
                        if (values.length === 0) return null;
                        const sortedValues = [...values].sort((a, b) => a - b);
                        return {
                            name: lineId,
                            min: sortedValues[0],
                            q1: quantile(sortedValues, 0.25),
                            median: quantile(sortedValues, 0.5),
                            q3: quantile(sortedValues, 0.75),
                            max: sortedValues[sortedValues.length - 1],
                        };
                    }).filter((p): p is BoxplotDataPoint => p !== null);

                const oeeByLineShift: { [key: string]: { sum: number; count: number } } = {};
                filteredProduction.forEach(p => {
                    const key = `${p.LINE_ID}|${p.SHIFT}`;
                    if (!oeeByLineShift[key]) oeeByLineShift[key] = { sum: 0, count: 0 };
                    oeeByLineShift[key].sum += p.OEE;
                    oeeByLineShift[key].count++;
                });
                const oeeHeatmap: HeatmapDataPoint[] = Object.entries(oeeByLineShift).map(([key, data]) => {
                    const [line, shift] = key.split('|');
                    return { line, shift: shift as 'A' | 'B' | 'C', value: data.count > 0 ? data.sum / data.count : 0 };
                });

                const downtimeByLineAndReason: { [lineId: string]: { [reason: string]: number } } = {};
                filteredDowntime.forEach(d => {
                    const machine = machineInfoData.find(m => m.MACHINE_ID === d.MACHINE_ID);
                    if (!machine) return;
                    const lineId = machine.LINE_ID;
                    if (!downtimeByLineAndReason[lineId]) downtimeByLineAndReason[lineId] = {};
                    downtimeByLineAndReason[lineId][d.DOWNTIME_REASON] = (downtimeByLineAndReason[lineId][d.DOWNTIME_REASON] || 0) + d.DOWNTIME_MIN;
                });
                const downtimeByLine: StackedBarDataPoint[] = Object.entries(downtimeByLineAndReason).map(([lineId, reasons]) => ({
                    name: lineId, ...reasons,
                }));

                const qualityByLine = Object.entries(
                    filteredProduction.reduce((acc, p) => {
                        if (!acc[p.LINE_ID]) acc[p.LINE_ID] = { totalDefects: 0, totalProduction: 0 };
                        acc[p.LINE_ID].totalDefects += p.DEFECT_QTY;
                        acc[p.LINE_ID].totalProduction += p.ACT_PRO_QTY;
                        return acc;
                    }, {} as Record<string, { totalDefects: number, totalProduction: number }>)
                ).map(([lineId, data]) => ({
                    lineId, ...data, defectRate: data.totalProduction > 0 ? data.totalDefects / data.totalProduction : 0,
                }));
                const top5DefectLines = [...qualityByLine].sort((a, b) => b.defectRate - a.defectRate).slice(0, 5);


                const result: DashboardData = {
                    productionLog,
                    downtimeRecords: filteredDowntime,
                    availableLines: [...new Set(productionDailyData.map(p => p.LINE_ID))],
                    availableMachines: [...new Set(productionDailyData.map(p => p.MACHINE_ID))],
                    summary: {
                        totalProduction,
                        totalDefects,
                        totalDowntime,
                        machineUtilization: 0.8, // placeholder
                        avgOee,
                        avgAvailability: availability,
                        avgPerformance: performance,
                        avgQuality: quality,
                        productionByLine,
                        oeeByLine,
                    },
                    performance: {
                       sevenDayTrend,
                       productionBoxplot,
                       oeeHeatmap,
                    },
                    quality: {
                       defectPareto,
                       defectRateTrend,
                       top5DefectLines,
                    },
                    downtime: {
                       downtimePareto,
                       downtimeTrend,
                       downtimeByCategory: downtimePareto.slice(0, 5), // simplified for pie chart
                       top5DowntimeMachines,
                       downtimeByLine,
                       uniqueDowntimeReasons: [...new Set(downtimePareto.map(d => d.name))],
                    }
                };
                
                resolve(result);

            } catch (e) {
                reject(e);
            }

        }, 1000); // Simulate network delay

        if (opts.signal) {
            opts.signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        }
    });
};
