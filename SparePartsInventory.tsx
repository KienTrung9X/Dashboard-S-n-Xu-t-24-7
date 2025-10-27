import React, { useState, useMemo } from 'react';
import { SparePart } from './types';
import { AlertTriangle, Flag, ShoppingCart, Plus, Edit, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from './i18n/LanguageContext';

interface SparePartsInventoryProps {
    parts: SparePart[];
    onPartSelect: (part: SparePart) => void;
    onAddNewPart: () => void;
    onEditPart: (part: SparePart) => void;
    onToggleFlag: (partId: number) => void;
    onCreateRequest: (part: SparePart) => void;
}

type SortKey = keyof SparePart | 'status';
type SortDirection = 'ascending' | 'descending';

const SparePartsInventory: React.FC<SparePartsInventoryProps> = ({ parts, onPartSelect, onAddNewPart, onEditPart, onToggleFlag, onCreateRequest }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'part_code', direction: 'ascending' });

    const getPartStatus = (part: SparePart) => {
        if ((part.available + part.in_transit) < part.reorder_point) {
            return { text: t('needToOrder'), color: 'text-red-400', icon: <AlertTriangle size={16} />, order: 1 };
        }
        if (part.available < part.safety_stock) {
            return { text: t('almostOut'), color: 'text-yellow-400', icon: <Clock size={16} />, order: 2 };
        }
        return { text: t('sufficient'), color: 'text-green-400', icon: <CheckCircle size={16} />, order: 3 };
    };

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const filteredAndSortedParts = useMemo(() => {
        const filtered = parts.filter(part =>
            part.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            part.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            let aVal, bVal;

            if (sortConfig.key === 'status') {
                aVal = getPartStatus(a).order;
                bVal = getPartStatus(b).order;
            } else {
                aVal = a[sortConfig.key as keyof SparePart];
                bVal = b[sortConfig.key as keyof SparePart];
            }

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
    }, [parts, searchTerm, sortConfig, t]);

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };
    
    const headers: { key: SortKey, label: string }[] = [
        { key: 'part_code', label: t('partCode') },
        { key: 'name', label: t('name') },
        { key: 'available', label: t('available') },
        { key: 'in_transit', label: t('inTransit') },
        { key: 'reserved', label: t('reserved') },
        { key: 'status', label: t('status') },
    ];

    return (
        <section>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-cyan-400 border-l-4 border-cyan-400 pl-3">{t('mcPartInventory')}</h2>
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
                                <th className="p-3 text-left">{t('image')}</th>
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
                                const status = getPartStatus(part);
                                const isLowStock = status.order === 1; // Need to Order
                                const isWarningStock = status.order === 2; // Almost out
                                
                                return (
                                    <tr 
                                        key={part.id} 
                                        className={`transition-colors duration-200 cursor-pointer 
                                            ${isLowStock ? 'bg-red-900/30 hover:bg-red-900/40' : 
                                              isWarningStock ? 'bg-yellow-900/20 hover:bg-yellow-900/30' : 
                                              'hover:bg-gray-700/50'}`}
                                        onClick={() => onPartSelect(part)}
                                    >
                                        <td className="p-2">
                                            <img src={part.image_url || `https://via.placeholder.com/64/374151/FFFFFF?Text=${part.part_code.substring(0,3)}`} alt={part.name} className="h-10 w-10 rounded-md object-cover"/>
                                        </td>
                                        <td className="p-3 font-mono">{part.part_code}</td>
                                        <td className="p-3">{part.name}</td>
                                        <td className="p-3 font-semibold">{part.available}</td>
                                        <td className="p-3">{part.in_transit}</td>
                                        <td className="p-3">{part.reserved}</td>
                                        <td className="p-3">
                                            <div className={`flex items-center gap-2 font-semibold ${status.color}`}>
                                                {status.icon}
                                                {status.text}
                                            </div>
                                        </td>
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
