import React, { useState, useMemo } from 'react';
import { MachineInfo, MachineStatusData } from '../types';
import { LINE_TO_AREA_MAP } from '../services/dataService';

interface ShopFloorLayoutProps {
    allMachines: MachineInfo[];
    machineStatus: MachineStatusData[];
    onMachineSelect: (machineId: string) => void;
}

type SortKey = 'MACHINE_ID' | 'status' | 'oee';
type SortOrder = 'asc' | 'desc';
type SortConfig = Record<string, { key: SortKey; order: SortOrder }>;

type MergedMachine = MachineInfo & {
    statusData: MachineStatusData;
};

const statusConfig = {
    Running: { color: 'bg-green-500', pulse: false, label: 'Running', order: 3 },
    Stopped: { color: 'bg-yellow-500', pulse: false, label: 'Stopped / Idle', order: 2 },
    Error: { color: 'bg-red-500', pulse: true, label: 'Error (Low OEE)', order: 1 },
    Inactive: { color: 'bg-gray-500', pulse: false, label: 'Inactive', order: 4 },
};

const SortButton: React.FC<{
    label: string;
    sortKey: SortKey;
    activeSort: { key: SortKey; order: SortOrder } | undefined;
    onClick: () => void;
}> = ({ label, sortKey, activeSort, onClick }) => {
    const isActive = activeSort?.key === sortKey;
    const icon = isActive ? (activeSort.order === 'asc' ? '▲' : '▼') : '';

    return (
        <button
            onClick={onClick}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                isActive
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
        >
            {label} {icon}
        </button>
    );
};


const ShopFloorLayout: React.FC<ShopFloorLayoutProps> = ({ allMachines, machineStatus, onMachineSelect }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({});
    
    const machinesByArea = useMemo(() => {
        const statusMap = new Map(machineStatus.map(s => [s.machineId, s]));
        const grouped: Record<string, MergedMachine[]> = {};

        for (const machine of allMachines) {
            const area = LINE_TO_AREA_MAP[machine.LINE_ID] || 'Unknown Area';
            if (!grouped[area]) {
                grouped[area] = [];
            }
            const statusData = statusMap.get(machine.MACHINE_ID) || { machineId: machine.MACHINE_ID, status: 'Inactive', oee: null, lineId: machine.LINE_ID };
            grouped[area].push({ ...machine, statusData });
        }
        return grouped;
    }, [allMachines, machineStatus]);

    const handleSort = (area: string, key: SortKey) => {
        setSortConfig(prev => {
            const current = prev[area];
            const order: SortOrder = current && current.key === key && current.order === 'asc' ? 'desc' : 'asc';
            return { ...prev, [area]: { key, order } };
        });
    };

    const getSortedMachines = (area: string, machines: MergedMachine[]) => {
        const config = sortConfig[area];
        if (!config) return machines;

        return [...machines].sort((a, b) => {
            let aVal, bVal;
            if (config.key === 'status') {
                aVal = statusConfig[a.statusData.status].order;
                bVal = statusConfig[b.statusData.status].order;
            } else if (config.key === 'oee') {
                // Higher OEE is better, so desc order should show high numbers first.
                // Nulls are treated as lowest value.
                aVal = a.statusData.oee ?? -1;
                bVal = b.statusData.oee ?? -1;
                 // Invert for OEE, high is good.
                if (config.order === 'asc') return aVal - bVal;
                return bVal - aVal;
            } else { // 'MACHINE_ID'
                const numA = parseInt(a.MACHINE_ID.replace('M', ''));
                const numB = parseInt(b.MACHINE_ID.replace('M', ''));
                aVal = isNaN(numA) ? a.MACHINE_ID : numA;
                bVal = isNaN(numB) ? b.MACHINE_ID : numB;
            }
            
            if (aVal < bVal) return config.order === 'asc' ? -1 : 1;
            if (aVal > bVal) return config.order === 'asc' ? 1 : -1;
            return 0;
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {Object.entries(machinesByArea).map(([area, machines]) => {
                const sortedMachines = getSortedMachines(area, machines);
                return (
                    <div key={area} className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                        <header className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-gray-700 dark:text-white">{area} <span className="text-sm font-normal text-gray-400">({machines.length})</span></h3>
                            <div className="flex items-center gap-2">
                                <SortButton label="ID" sortKey="MACHINE_ID" activeSort={sortConfig[area]} onClick={() => handleSort(area, 'MACHINE_ID')} />
                                <SortButton label="Status" sortKey="status" activeSort={sortConfig[area]} onClick={() => handleSort(area, 'status')} />
                                <SortButton label="OEE" sortKey="oee" activeSort={sortConfig[area]} onClick={() => handleSort(area, 'oee')} />
                            </div>
                        </header>
                        <div className="p-3 flex flex-wrap gap-2 overflow-y-auto">
                             {sortedMachines.map(machine => {
                                const config = statusConfig[machine.statusData.status];
                                return (
                                     <div key={machine.MACHINE_ID} className="group relative">
                                        <button
                                            onClick={() => onMachineSelect(machine.MACHINE_ID)}
                                            className={`w-14 h-14 rounded-md shadow-md flex flex-col items-center justify-center text-white font-bold text-xs cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-cyan-500 ${config.color}`}
                                        >
                                            <div className={`absolute w-full h-full rounded-md ${config.pulse ? 'animate-pulse' : ''} ${config.color} opacity-75`}></div>
                                            <span className="relative z-10">{machine.MACHINE_ID}</span>
                                        </button>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                            <strong>{machine.MACHINE_NAME}</strong>
                                            <div className="mt-1">
                                                <p>Status: <span className="font-semibold">{config.label}</span></p>
                                                {machine.statusData?.oee !== null && <p>OEE: <span className="font-semibold">{(machine.statusData.oee * 100).toFixed(1)}%</span></p>}
                                            </div>
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ShopFloorLayout;