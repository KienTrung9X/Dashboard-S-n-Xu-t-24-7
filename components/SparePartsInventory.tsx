import React, { useState, useMemo } from 'react';
import { SparePart, EnrichedMaintenanceOrder } from '../types';
import { AlertTriangle, ChevronDown, ChevronRight, Flag, ShoppingCart, Plus, Edit } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface SparePartsInventoryProps {
    parts: SparePart[];
    allMaintenanceRecords: EnrichedMaintenanceOrder[];
    onPartSelect: (part: SparePart) => void;
    onAddNewPart: () => void;
    onEditPart: (part: SparePart) => void;
    onToggleFlag: (partId: number) => void;
    onCreateRequest: (part: SparePart) => void;
}

type SortKey = keyof SparePart;
type SortDirection = 'ascending' | 'descending';

const SparePartsInventory: React.FC<SparePartsInventoryProps> = ({ parts, allMaintenanceRecords, onPartSelect, onAddNewPart, onEditPart, onToggleFlag, onCreateRequest }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'part_code', direction: 'ascending' });
    const [expandedPartId, setExpandedPartId] = useState<number | null>(null);

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const filteredAndSortedParts = useMemo(() => {
        const filtered = parts.filter(part =>
            part.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.location.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            let comparison = 0;
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [parts, searchTerm, sortConfig]);
    
     const historyForExpandedPart = useMemo(() => {
        if (!expandedPartId) return [];
        const history: { date: string, machineId: string, orderId: number, qtyUsed: number }[] = [];
        allMaintenanceRecords.forEach(order => {
            order.parts_used.forEach(partUsed => {
                if (partUsed.part_id === expandedPartId) {
                    history.push({
                        date: new Date(order.created_at).toISOString().slice(0, 10),
                        machineId: order.MACHINE_ID,
                        orderId: order.id,
                        qtyUsed: partUsed.qty_used
                    });
                }
            });
        });
        return history.sort((a,b) => b.date.localeCompare(a.date));
    }, [expandedPartId, allMaintenanceRecords]);

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };
    
    const headers: { key: SortKey, label: string }[] = [
        { key: 'part_code', label: t('partCode') },
        { key: 'name', label: t('name') },
        { key: 'qty_on_hand', label: t('qtyOnHand') },
        { key: 'reorder_point', label: t('reorderPoint') },
        { key: 'location', label: t('location') },
    ];

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-cyan-400 border-l-4 border-cyan-400 pl-3">{t('sparePartsTitle')}</h2>
                 <button 
                    onClick={onAddNewPart}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                >
                    <Plus size={16} />
                    {t('addNewPart')}
                </button>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder={t('searchByCodeName')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 bg-gray-700 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="w-12 p-3"></th>
                                {headers.map(header => (
                                    <th key={header.key} className="p-3 text-left">
                                        <button onClick={() => requestSort(header.key)} className="group flex items-center gap-2">
                                            {header.label}
                                            <span className="text-cyan-400">{getSortIcon(header.key)}</span>
                                        </button>
                                    </th>
                                ))}
                                <th className="p-3 text-left">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredAndSortedParts.map(part => {
                                const isLowStock = part.qty_on_hand <= part.reorder_point;
                                const isExpanded = expandedPartId === part.id;
                                
                                return (
                                    <React.Fragment key={part.id}>
                                        <tr className={`hover:bg-gray-700/50 ${isLowStock ? 'bg-orange-900/30' : ''} ${isExpanded ? 'bg-gray-700/60' : ''} cursor-pointer`} onClick={() => onPartSelect(part)}>
                                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setExpandedPartId(isExpanded ? null : part.id)} className="text-gray-400 hover:text-white">
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </td>
                                            <td className="p-3 font-mono">{part.part_code}</td>
                                            <td className="p-3">{part.name}</td>
                                            <td className={`p-3 font-semibold ${isLowStock ? 'text-orange-400' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    {isLowStock && <AlertTriangle size={14} />}
                                                    {part.qty_on_hand}
                                                </div>
                                            </td>
                                            <td className="p-3">{part.reorder_point}</td>
                                            <td className="p-3">{part.location}</td>
                                            <td className="p-3" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => onToggleFlag(part.id)} title={t('flagForOrder')} className={`p-2 rounded-md transition-colors ${part.flagged_for_order ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40' : 'text-gray-400 hover:text-white'}`}>
                                                        <Flag size={16} />
                                                    </button>
                                                    <button onClick={() => onCreateRequest(part)} title={t('createPurchaseRequest')} className="p-2 text-gray-400 hover:text-white hover:bg-cyan-500/20 rounded-md transition-colors">
                                                        <ShoppingCart size={16} />
                                                    </button>
                                                     <button onClick={() => onEditPart(part)} title={t('edit')} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600/50 rounded-md transition-colors">
                                                        <Edit size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-900/70">
                                                <td colSpan={headers.length + 2} className="p-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-12">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-300 mb-2">{t('usageHistory')}</h4>
                                                            {historyForExpandedPart.length > 0 ? (
                                                                <div className="overflow-y-auto max-h-40 border border-gray-700 rounded-md">
                                                                    <table className="min-w-full text-xs">
                                                                        <thead className="bg-gray-700 sticky top-0"><tr>
                                                                            <th className="p-2 text-left">{t('date')}</th>
                                                                            <th className="p-2 text-left">{t('machineId')}</th>
                                                                            <th className="p-2 text-left">{t('orderId')}</th>
                                                                            <th className="p-2 text-right">{t('qtyUsed')}</th>
                                                                        </tr></thead>
                                                                        <tbody className="divide-y divide-gray-700">
                                                                            {historyForExpandedPart.map((h, i) => (
                                                                                <tr key={i}>
                                                                                    <td className="p-2">{h.date}</td>
                                                                                    <td className="p-2">{h.machineId}</td>
                                                                                    <td className="p-2">{h.orderId}</td>
                                                                                    <td className="p-2 text-right">{h.qtyUsed}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                             ) : <p className="text-sm text-gray-500">{t('noUsageHistory')}</p>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-300 mb-2">{t('maintenanceInfo')}</h4>
                                                             {part.maintenance_interval_days ? (
                                                                <p className="text-sm text-gray-400">{t('maintenanceInterval')}: <span className="font-bold text-white">{part.maintenance_interval_days} {t('days')}</span></p>
                                                             ) : <p className="text-sm text-gray-500">N/A</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                     {filteredAndSortedParts.length === 0 && <div className="text-center p-8 text-gray-500">{t('noPartsMatch')}</div>}
                </div>
            </div>
        </section>
    );
};

export default SparePartsInventory;