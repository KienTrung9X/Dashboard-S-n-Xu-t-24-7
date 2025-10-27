import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MachineInfo, MachineStatusData } from '../types';
import { LINE_TO_AREA_MAP } from '../services/dataService';
import { useTranslation } from '../i18n/LanguageContext';
import { Plus, Edit, PlayCircle, PauseCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ShopFloorLayoutProps {
    allMachines: MachineInfo[];
    machineStatus: MachineStatusData[];
    onMachineSelect: (machineId: string) => void;
    onAddMachine: () => void;
    onEditMachine: (machine: MachineInfo) => void;
    onUpdateMachinePosition: (machineId: number, newPosition: { x: number; y: number }) => void;
}

type MergedMachine = MachineInfo & {
    statusData: MachineStatusData;
};

const statusConfig: Record<string, { icon: React.ReactNode; labelKey: string; colorClasses: string; animationClass?: string }> = {
    Running: { icon: <PlayCircle size={16} className="text-green-500" />, labelKey: 'running', colorClasses: 'border-green-500/50 bg-green-500/5 dark:bg-green-900/10' },
    Stopped: { icon: <PauseCircle size={16} className="text-yellow-500" />, labelKey: 'stopped', colorClasses: 'border-yellow-500/50 bg-yellow-500/5 dark:bg-yellow-900/10' },
    Error: { icon: <AlertTriangle size={16} className="text-red-500" />, labelKey: 'error', colorClasses: 'border-red-500 bg-red-500/5 dark:bg-red-900/10', animationClass: 'animate-error-highlight' },
    Inactive: { icon: <XCircle size={16} className="text-gray-500" />, labelKey: 'inactive', colorClasses: 'border-gray-500/50 bg-gray-500/5 dark:bg-gray-800' },
};

const MachineNode: React.FC<{ 
    machine: MergedMachine; 
    position: { x: number, y: number };
    onEdit: (machine: MachineInfo) => void;
    onMouseDown: (e: React.MouseEvent, machine: MergedMachine) => void;
}> = ({ machine, position, onEdit, onMouseDown }) => {
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
                className={`w-28 h-16 rounded-lg shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 border-2 hover:border-cyan-500 dark:hover:border-cyan-400 ${config.colorClasses} ${config.animationClass || ''}`}
            >
                <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-bold text-lg text-gray-800 dark:text-white">{machine.MACHINE_ID}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">OEE: {oeePercentage}</span>
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
                    className="p-2 bg-cyan-500 hover:bg-cyan-600 rounded-full text-white shadow-md"
                    title={t('editMachine')}
                >
                    <Edit size={12} />
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
    const isDraggingRef = useRef(false);
    
    useEffect(() => {
        const initialPositions = allMachines.reduce((acc, m) => {
            acc[m.MACHINE_ID] = { x: m.x || 50, y: m.y || 50 };
            return acc;
        }, {} as Record<string, { x: number; y: number }>);
        setPositions(initialPositions);
    }, [allMachines]);

    const handleMouseDown = (e: React.MouseEvent, machine: MergedMachine) => {
        e.preventDefault();
        isDraggingRef.current = false;
        const node = e.currentTarget as HTMLElement;
        const rect = node.getBoundingClientRect();
        
        // Calculate offset from top-left of the node, in pixels
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setDraggedMachine({ id: machine.MACHINE_ID, offsetX, offsetY, machineInfo: machine });
    };

    const handleMouseMove = (e: React.MouseEvent, area: string) => {
        if (!draggedMachine || !layoutRefs.current[area]) return;
        
        isDraggingRef.current = true;
        const layoutRect = layoutRefs.current[area]!.getBoundingClientRect();

        const nodeWidth = 112; // w-28 is 7rem
        const nodeHeight = 64; // h-16 is 4rem

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
            if (isDraggingRef.current) {
                // This was a drag, save the final position
                const finalPosition = positions[draggedMachine.id];
                if(finalPosition) {
                    onUpdateMachinePosition(draggedMachine.machineInfo.id, finalPosition);
                }
            } else {
                // This was a click, trigger selection
                onMachineSelect(draggedMachine.id);
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