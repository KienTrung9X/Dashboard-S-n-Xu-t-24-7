
import React, { useState, useMemo } from 'react';
import { DefectRecord } from '../types';

interface DefectLogTableProps {
  data: DefectRecord[];
  onViewDetails: (defect: DefectRecord) => void;
}

type SortKey = keyof DefectRecord;
type SortDirection = 'ascending' | 'descending';

const FilterInput: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; label: string }> = ({ value, onChange, placeholder, label }) => (
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} aria-label={label}
        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
);

const DefectLogTable: React.FC<DefectLogTableProps> = ({ data, onViewDetails }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        SEVERITY: 'all',
        STATUS: 'all',
        DEFECT_CATEGORY: 'all',
    });
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'COMP_DAY', direction: 'descending' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const uniqueValues = useMemo(() => {
        return {
            SEVERITY: ['all', ...Array.from(new Set(data.map(d => d.SEVERITY)))],
            STATUS: ['all', ...Array.from(new Set(data.map(d => d.STATUS)))],
            DEFECT_CATEGORY: ['all', ...Array.from(new Set(data.map(d => d.DEFECT_CATEGORY)))],
        }
    }, [data]);
    
    const filteredData = useMemo(() => {
        return data.filter(log => {
            const searchMatch = !searchTerm ||
                log.MACHINE_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.DEFECT_TYPE.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.DESCRIPTION.toLowerCase().includes(searchTerm.toLowerCase());

            const severityMatch = filters.SEVERITY === 'all' || log.SEVERITY === filters.SEVERITY;
            const statusMatch = filters.STATUS === 'all' || log.STATUS === filters.STATUS;
            const categoryMatch = filters.DEFECT_CATEGORY === 'all' || log.DEFECT_CATEGORY === filters.DEFECT_CATEGORY;

            return searchMatch && severityMatch && statusMatch && categoryMatch;
        });
    }, [data, searchTerm, filters]);

    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue;
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [filteredData, sortConfig]);
    
    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="text-gray-400 dark:text-gray-500 transition-opacity opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? <span className="text-cyan-500">▲</span> : <span className="text-cyan-500">▼</span>;
    };

    const headerButtonClass = "group inline-flex items-center gap-1.5 focus:outline-none";

    return (
        <div>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                        <FilterInput value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Machine, Defect, Desc..." label="Search" />
                    </div>
                    <div>
                        <label htmlFor="SEVERITY" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                        <select id="SEVERITY" name="SEVERITY" value={filters.SEVERITY} onChange={handleFilterChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            {uniqueValues.SEVERITY.map(v => <option key={v} value={v}>{v === 'all' ? 'All Severities' : v}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="STATUS" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select id="STATUS" name="STATUS" value={filters.STATUS} onChange={handleFilterChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                           {uniqueValues.STATUS.map(v => <option key={v} value={v}>{v === 'all' ? 'All Statuses' : v}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="DEFECT_CATEGORY" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select id="DEFECT_CATEGORY" name="DEFECT_CATEGORY" value={filters.DEFECT_CATEGORY} onChange={handleFilterChange} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            {uniqueValues.DEFECT_CATEGORY.map(v => <option key={v} value={v}>{v === 'all' ? 'All Categories' : v}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('COMP_DAY')} className={headerButtonClass}>Date {getSortIcon('COMP_DAY')}</button></th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DEFECT_TYPE')} className={headerButtonClass}>Defect Type {getSortIcon('DEFECT_TYPE')}</button></th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('MACHINE_ID')} className={headerButtonClass}>Machine {getSortIcon('MACHINE_ID')}</button></th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('DEFECT_QTY')} className={headerButtonClass}>Qty {getSortIcon('DEFECT_QTY')}</button></th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('SEVERITY')} className={headerButtonClass}>Severity {getSortIcon('SEVERITY')}</button></th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"><button onClick={() => requestSort('STATUS')} className={headerButtonClass}>Status {getSortIcon('STATUS')}</button></th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {sortedData.map(log => (
                            <tr key={log.Defect_ID} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">{log.COMP_DAY}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-200">{log.DEFECT_TYPE}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{log.MACHINE_ID}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-red-500 dark:text-red-400">{log.DEFECT_QTY}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{log.SEVERITY}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{log.STATUS}</td>
                                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                    <button onClick={() => onViewDetails(log)} className="text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedData.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400">No records match your filters.</div>}
            </div>
        </div>
    );
};

export default DefectLogTable;
