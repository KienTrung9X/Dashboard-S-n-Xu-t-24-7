import React, { useState, useMemo } from 'react';
// FIX: Imported missing type 'EnrichedDefectRecord'
import { EnrichedDefectRecord } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface DefectLogTableProps {
  data: EnrichedDefectRecord[];
  onViewDetails: (defect: EnrichedDefectRecord) => void;
}

type SortKey = keyof EnrichedDefectRecord;
type SortDirection = 'ascending' | 'descending';

const DefectLogTable: React.FC<DefectLogTableProps> = ({ data, onViewDetails }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ severity: 'all', status: 'all', is_abnormal: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'work_date', direction: 'descending' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    };
    
    const filteredData = useMemo(() => {
        return data.filter(log => 
            (searchTerm === '' || log.MACHINE_ID.toLowerCase().includes(searchTerm.toLowerCase()) || log.defect_type_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filters.severity === 'all' || log.severity === filters.severity) &&
            (filters.status === 'all' || log.status === filters.status) &&
            (filters.is_abnormal === 'all' || String(log.is_abnormal) === filters.is_abnormal)
        );
    }, [data, searchTerm, filters]);

    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key], bValue = b[sortConfig.key];
            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') comparison = aValue - bValue;
            else comparison = String(aValue).localeCompare(String(bValue));
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [filteredData, sortConfig]);
    
    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? <span className="text-cyan-500">▲</span> : <span className="text-cyan-500">▼</span>;
    };

    return (
        <div>
            <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div><label>Search</label><input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-gray-700 p-2 rounded"/></div>
                    <div><label>{t('severity')}</label><select name="severity" value={filters.severity} onChange={handleFilterChange} className="w-full bg-gray-700 p-2 rounded"><option value="all">{t('all')}</option><option>Low</option><option>Medium</option><option>High</option></select></div>
                    <div><label>{t('status')}</label><select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 p-2 rounded"><option value="all">{t('all')}</option><option>Open</option><option>In Progress</option><option>Closed</option></select></div>
                    {/* FIX: Corrected translation keys */}
                    <div><label>{t('category')}</label><select name="is_abnormal" value={filters.is_abnormal} onChange={handleFilterChange} className="w-full bg-gray-700 p-2 rounded"><option value="all">{t('all')}</option><option value="true">{t('abnormal')}</option><option value="false">{t('fixed')}</option></select></div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('work_date')} className="group">{t('date')} {getSortIcon('work_date')}</button></th>
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('defect_type_name')} className="group">{t('defectType')} {getSortIcon('defect_type_name')}</button></th>
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('MACHINE_ID')} className="group">{t('machine')} {getSortIcon('MACHINE_ID')}</button></th>
                            {/* FIX: Corrected translation key */}
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('quantity')} className="group">{t('quantity')} {getSortIcon('quantity')}</button></th>
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('severity')} className="group">{t('severity')} {getSortIcon('severity')}</button></th>
                            <th className="py-3 px-4 text-left"><button onClick={() => requestSort('status')} className="group">{t('status')} {getSortIcon('status')}</button></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-900">
                        {sortedData.map(log => (
                            <tr key={log.id} className="hover:bg-gray-800/60">
                                <td className="py-4 px-4">{log.work_date}</td>
                                <td className="py-4 px-4">{log.defect_type_name}</td>
                                <td className="py-4 px-4">{log.MACHINE_ID}</td>
                                <td className="py-4 px-4 text-red-400">{log.quantity}</td>
                                <td className="py-4 px-4">{log.severity}</td>
                                <td className="py-4 px-4">{log.status}</td>
                                <td className="py-4 px-4"><button onClick={() => onViewDetails(log)} className="text-cyan-400 hover:text-cyan-200">View</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedData.length === 0 && <div className="text-center py-8 text-gray-400">No records found.</div>}
            </div>
        </div>
    );
};

export default DefectLogTable;