import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MachineInfo, MachineStatusData } from '../types';
import { LINE_TO_AREA_MAP } from '../services/dataService';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Edit } from 'lucide-react';

interface ShopFloorLayoutProps {
    allMachines: MachineInfo[];
    machineStatus: MachineStatusData[];
    onMachineSelect: (machineId: string) => void;
    onAddMachine: () => void;
    onEditMachine: (machine: MachineInfo) => void;
    onUpdateMachinePosition: (machineId: number, newPosition: { x: number, y: number }) => void;
}

type MergedMachine = MachineInfo & {
    statusData: MachineStatusData;
};

const statusConfig: Record<string, { dotClass: string; animationClass?: string; labelKey: string }> = {
    Running: { dotClass: 'bg-green-500', labelKey: 'running' },
    Stopped: { dotClass: 'bg-yellow-500', labelKey: 'stopped' },
    Error: { dotClass: 'bg-red-500', animationClass: 'animate-pulse', labelKey: 'error' },
    Inactive: { dotClass: 'bg-gray-500', labelKey: 'inactive' },
};

const MachineNode: React.FC<{ 
    machine: MergedMachine; 
    position: { x: number, y: number };
    onSelect: (id: string) => void; 
    onEdit: (machine: MachineInfo) => void;
    onMouseDown: (e: React.MouseEvent, machine: MergedMachine) => void;
}> = ({ machine, position, onSelect, onEdit, onMouseDown }) => {
    const { t } = useTranslation();
    const config = statusConfig[machine.statusData.status];
    const oee = machine.statusData?.oee;
    const oeePercentage = oee !== null ? (oee * 100).toFixed(1) + '%' : 'N/A';

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-grab"
            style={{ top: `${position.y}%`, left: `${position.x}%` }}
            onMouseDown={(e) => onMouseDown(e, machine)}
        >
            <div
                onClick={() => onSelect(machine.MACHINE_ID)}
                className={`w-20 h-14 rounded-md shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-400 ${machine.statusData.status === 'Error' ? 'animate-error-highlight border-red-500' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass} ${config.animationClass || ''}`}></span>
                    <span className="font-bold text-base text-gray-800 dark:text-white">{machine.MACHINE_ID}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t(config.labelKey as any)}</span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 text-center">
                <p className="font-bold">{machine.MACHINE_NAME}</p>
                <p>OEE: {oeePercentage}</p>
                <p>Status: {t(config.labelKey as any)}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
             {/* Edit Button */}
            <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(machine); }}
                    className="p-1.5 bg-gray-700 hover:bg-cyan-600 rounded-full text-white"
                    title={t('editMachine')}
                >
                    <Edit size={10} />
                </button>
            </div>
        </div>
    );
};


const ShopFloorLayout: React.FC<ShopFloorLayoutProps> = ({ allMachines, machineStatus, onMachineSelect, onAddMachine, onEditMachine, onUpdateMachinePosition }) => {
    const { t } = useTranslation();
    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [draggedMachine, setDraggedMachine] = useState<{ id: string; offsetX: number; offsetY: number; machineInfo: MergedMachine } | null>(null);
    const layoutRefs = useRef<Record<string, HTMLDivElement | null>>({});
    
    useEffect(() => {
        const initialPositions = allMachines.reduce((acc, m) => {
            acc[m.MACHINE_ID] = { x: m.x || 50, y: m.y || 50 };
            return acc;
        }, {} as Record<string, { x: number; y: number }>);
        setPositions(initialPositions);
    }, [allMachines]);

    const handleMouseDown = (e: React.MouseEvent, machine: MergedMachine) => {
        e.preventDefault();
        const node = e.currentTarget as HTMLElement;
        const rect = node.getBoundingClientRect();
        
        // Calculate offset from top-left of the node, in pixels
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setDraggedMachine({ id: machine.MACHINE_ID, offsetX, offsetY, machineInfo: machine });
    };

    const handleMouseMove = (e: React.MouseEvent, area: string) => {
        if (!draggedMachine || !layoutRefs.current[area]) return;
        
        const layoutRect = layoutRefs.current[area]!.getBoundingClientRect();

        const nodeWidth = 80; // w-20 is 5rem
        const nodeHeight = 56; // h-14 is 3.5rem

        // Calculate new top-left position in pixels, relative to the layout container
        let newX_px = e.clientX - layoutRect.left - draggedMachine.offsetX;
        let newY_px = e.clientY - layoutRect.top - draggedMachine.offsetY;
        
        // Convert to center position in pixels
        const newCenterX_px = newX_px + nodeWidth / 2;
        const newCenterY_px = newY_px + nodeHeight / 2;
        
        // Convert to percentage
        const newXPercent = (newCenterX_px / layoutRect.width) * 100;
        const newYPercent = (newCenterY_px / layoutRect.height) * 100;

        // Clamp values to stay within bounds (e.g., 5% to 95% to avoid hiding the node)
        const clampedX = Math.max(5, Math.min(95, newXPercent));
        const clampedY = Math.max(5, Math.min(95, newYPercent));

        setPositions(prev => ({
            ...prev,
            [draggedMachine.id]: { x: clampedX, y: clampedY }
        }));
    };

    const handleMouseUp = () => {
        if (draggedMachine) {
            const finalPosition = positions[draggedMachine.id];
            if(finalPosition) {
                onUpdateMachinePosition(draggedMachine.machineInfo.id, finalPosition);
            }
            setDraggedMachine(null);
        }
    };
    
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


    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {Object.entries(machinesByArea).map(([area, machines]: [string, MergedMachine[]]) => {
                return (
                    <div key={area} className="min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col shadow-sm">
                        <header className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{area} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({machines.length} {t('machines')})</span></h3>
                        </header>
                        <div 
                            // FIX: Ref callbacks should not return a value. Wrapped the assignment in curly braces to ensure the function returns void.
                            ref={el => { layoutRefs.current[area] = el; }}
                            onMouseMove={(e) => handleMouseMove(e, area)}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className={`p-4 flex-grow relative min-h-[300px] md:min-h-[400px] bg-dots rounded-b-lg ${draggedMachine ? 'grabbing' : ''}`}
                        >
                            {machines.map(machine => {
                                const position = positions[machine.MACHINE_ID];
                                if (!position) return null;
                                return (
                                    <MachineNode
                                        key={machine.MACHINE_ID}
                                        machine={machine}
                                        position={position}
                                        onSelect={onMachineSelect}
                                        onEdit={onEditMachine}
                                        onMouseDown={handleMouseDown}
                                    />
                                );
                            })}
                            <button
                                onClick={onAddMachine}
                                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-cyan-500"
                                title={t('addMachine')}
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ShopFloorLayout;