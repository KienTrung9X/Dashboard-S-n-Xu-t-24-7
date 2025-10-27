import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Key, Link, Database } from 'lucide-react';

interface DatabaseSchemaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const schema = {
  tables: [
    { id: 'User', name: 'User', descriptionKey: 'userDesc', columns: ['id (PK)', 'username', 'full_name', 'role'], initialPos: { x: 50, y: 50 } },
    { id: 'Shift', name: 'Shift', descriptionKey: 'shiftDesc', columns: ['id (PK)', 'code', 'name'], initialPos: { x: 50, y: 180 } },
    { id: 'MachineInfo', name: 'Machine_Info', descriptionKey: 'machineInfoDesc', columns: ['id (PK)', 'MACHINE_ID', 'LINE_ID', 'STATUS'], initialPos: { x: 50, y: 350 } },
    { id: 'DefectType', name: 'Defect_Type', descriptionKey: 'defectTypeDesc', columns: ['id (PK)', 'code', 'name'], initialPos: { x: 50, y: 520 } },
    { id: 'DefectCause', name: 'Defect_Cause', descriptionKey: 'defectCauseDesc', columns: ['id (PK)', 'category', 'detail'], initialPos: { x: 50, y: 650 } },

    { id: 'ProductionDaily', name: 'Production_Daily', descriptionKey: 'productionDailyDesc', columns: ['Prod_ID (PK)', 'machine_id (FK)', 'shift_id (FK)', 'OEE'], initialPos: { x: 350, y: 350 } },
    { id: 'DowntimeRecord', name: 'Downtime_Records', descriptionKey: 'downtimeRecordDesc', columns: ['Downtime_ID (PK)', 'machine_id (FK)', 'START_TIME'], initialPos: { x: 350, y: 520 } },
    
    { id: 'ErrorReport', name: 'Error_Report', descriptionKey: 'errorReportDesc', columns: ['id (PK)', 'machine_id (FK)', 'operator_id (FK)', 'technician_id (FK)', 'status'], initialPos: { x: 650, y: 180 } },
    { id: 'MaintenanceOrder', name: 'Maintenance_Order', descriptionKey: 'maintenanceOrderDesc', columns: ['id (PK)', 'machine_id (FK)', 'reported_by_id (FK)', 'assigned_to_id (FK)', 'status'], initialPos: { x: 650, y: 350 } },
    
    { id: 'ErrorImage', name: 'Error_Image', descriptionKey: 'errorImageDesc', columns: ['id (PK)', 'error_id (FK)', 'uploaded_by (FK)'], initialPos: { x: 950, y: 50 } },
    { id: 'ErrorHistory', name: 'Error_History', descriptionKey: 'errorHistoryDesc', columns: ['id (PK)', 'error_id (FK)', 'changed_by (FK)'], initialPos: { x: 950, y: 200 } },
    { id: 'MaintenancePartUsage', name: 'Maintenance_Part_Usage', descriptionKey: 'maintPartUsageDesc', columns: ['order_id (FK)', 'part_id (FK)', 'qty_used'], initialPos: { x: 950, y: 350 } },
    
    { id: 'SparePart', name: 'Spare_Part', descriptionKey: 'sparePartDesc', columns: ['id (PK)', 'part_code', 'name', 'qty_on_hand'], initialPos: { x: 650, y: 520 } },
  ],
  relations: [
    { from: 'MachineInfo', to: 'ProductionDaily' },
    { from: 'Shift', to: 'ProductionDaily' },
    { from: 'MachineInfo', to: 'DowntimeRecord' },
    { from: 'MachineInfo', to: 'MaintenanceOrder' },
    { from: 'MachineInfo', to: 'ErrorReport' },
    { from: 'User', to: 'ErrorReport', via: 'operator_id' },
    { from: 'User', to: 'ErrorReport', via: 'technician_id' },
    { from: 'User', to: 'MaintenanceOrder', via: 'reported_by_id' },
    { from: 'User', to: 'MaintenanceOrder', via: 'assigned_to_id' },
    { from: 'ErrorReport', to: 'ErrorImage' },
    { from: 'ErrorReport', to: 'ErrorHistory' },
    { from: 'User', to: 'ErrorImage', via: 'uploaded_by' },
    { from: 'User', to: 'ErrorHistory', via: 'changed_by' },
    { from: 'MaintenanceOrder', to: 'MaintenancePartUsage' },
    { from: 'SparePart', to: 'MaintenancePartUsage' },
    { from: 'ErrorReport', to: 'MaintenanceOrder' },
  ]
};

const ColumnItem: React.FC<{ col: string }> = ({ col }) => {
    const isPk = col.includes('(PK)');
    const isFk = col.includes('(FK)');
    const cleanCol = col.replace(/\s\((PK|FK)\)/, '');
    return (
        <li className="flex items-center gap-2 text-sm">
            {isPk && <Key size={12} className="text-yellow-400" />}
            {isFk && <Link size={12} className="text-cyan-400" />}
            {!isPk && !isFk && <div className="w-3" />}
            <span>{cleanCol}</span>
        </li>
    );
};

const DatabaseSchemaPanel: React.FC<DatabaseSchemaPanelProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const nodesRef = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const initialPositions = schema.tables.reduce((acc, table) => {
                acc[table.id] = table.initialPos;
                return acc;
            }, {} as Record<string, {x: number, y: number}>);
            setPositions(initialPositions);
        }
    }, [isOpen]);

    const { highlightedRelations, relatedTableIds } = useMemo(() => {
        if (!selectedTableId) return { highlightedRelations: new Set(), relatedTableIds: new Set() };
        
        const highlighted = new Set<string>();
        const related = new Set<string>([selectedTableId]);

        schema.relations.forEach((rel, index) => {
            if (rel.from === selectedTableId || rel.to === selectedTableId) {
                highlighted.add(`${rel.from}-${rel.to}`);
                related.add(rel.from);
                related.add(rel.to);
            }
        });

        return { highlightedRelations: highlighted, relatedTableIds: related };
    }, [selectedTableId]);

    const handleNodeClick = (tableId: string) => {
        setSelectedTableId(prev => prev === tableId ? null : tableId);
    };

    const getNodePosition = (tableId: string) => {
        const node = nodesRef.current[tableId];
        const pos = positions[tableId];
        if (!node || !pos) return { x1: 0, y1: 0, x2: 0, y2: 0 };
        return {
            x1: pos.x,
            y1: pos.y + node.offsetHeight / 2,
            x2: pos.x + node.offsetWidth,
            y2: pos.y + node.offsetHeight / 2
        };
    };

    return (
    <>
      <div className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose} aria-hidden="true" />
      <aside className={`fixed top-0 right-0 h-full w-full max-w-5xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={24} /> Interactive Database Schema
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Close panel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main ref={containerRef} className={`flex-grow p-6 overflow-auto bg-gray-100 dark:bg-gray-900 relative db-schema-container ${selectedTableId ? 'dimmed' : ''}`}>
            <svg className="absolute inset-0 w-full h-full" style={{minWidth: '1200px', minHeight: '800px'}}>
                {schema.relations.map((rel, index) => {
                    const fromPos = getNodePosition(rel.from);
                    const toPos = getNodePosition(rel.to);
                    const isHighlighted = highlightedRelations.has(`${rel.from}-${rel.to}`);
                    return (
                        <line 
                            key={index}
                            x1={fromPos.x2} y1={fromPos.y2}
                            x2={toPos.x1} y2={toPos.y1}
                            className={`db-relation-line ${isHighlighted ? 'highlighted' : ''}`}
                        />
                    );
                })}
            </svg>

            {schema.tables.map(table => {
                const pos = positions[table.id];
                if (!pos) return null;
                const isSelected = selectedTableId === table.id;
                const isRelated = relatedTableIds.has(table.id);

                return (
                    <div
                        key={table.id}
                        ref={el => { nodesRef.current[table.id] = el; }}
                        className={`db-node absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 w-52 group ${isSelected ? 'selected' : ''}`}
                        style={{
                            left: `${pos.x}px`,
                            top: `${pos.y}px`,
                            opacity: selectedTableId ? (isRelated ? 1 : 0.3) : 1,
                        }}
                        onClick={() => handleNodeClick(table.id)}
                    >
                        <div className="p-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg">
                            <h4 className="font-bold text-gray-800 dark:text-white">{table.name}</h4>
                        </div>
                        <ul className="p-2 space-y-1">
                            {table.columns.map(col => <ColumnItem key={col} col={col} />)}
                        </ul>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                            {t(table.descriptionKey as any)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                    </div>
                );
            })}
        </main>
      </aside>
    </>
  );
};

export default DatabaseSchemaPanel;
