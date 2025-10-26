import React, { useState, useMemo } from 'react';
import { EnrichedErrorReport, ErrorReportStatus } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { ChevronDown, ChevronRight, Image as ImageIcon, History } from 'lucide-react';

interface ErrorLogTableProps {
  reports: EnrichedErrorReport[];
  onOpenUpdateModal: (report: EnrichedErrorReport) => void;
  onStatusUpdate: (reportId: number, newStatus: ErrorReportStatus) => void;
}

type SortKey = keyof EnrichedErrorReport;
type SortDirection = 'ascending' | 'descending';

interface HistoryModalProps {
    report: EnrichedErrorReport;
    onClose: () => void;
    t: (key: any) => string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ report, onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">{t('history')} - {report.reportNo}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto">
                    <ul className="space-y-4">
                        {report.history.map((h, index) => (
                            <li key={h.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 bg-cyan-500 rounded-full z-10"></div>
                                    {index < report.history.length - 1 && <div className="w-0.5 flex-grow bg-gray-600 -mt-1"></div>}
                                </div>
                                <div className="pb-4">
                                    <p className="font-semibold text-gray-200">
                                        Status: {t((h.old_status?.replace(/\s/g, '') || 'Created') as any)} → {t(h.new_status.replace(/\s/g, '') as any)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {new Date(h.changed_at).toLocaleString()} by {h.changed_by_name}
                                    </p>
                                    {h.note && <p className="text-sm mt-2 p-2 bg-gray-700/50 rounded-md italic">"{h.note}"</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        </div>
    );
};

interface ImageViewerModalProps {
    report: EnrichedErrorReport;
    onClose: () => void;
    t: (key: any) => string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ report, onClose, t }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    if (report.images.length === 0) return null;

    const currentImage = report.images[currentIndex];

    const goToPrevious = () => {
        const isFirstImage = currentIndex === 0;
        const newIndex = isFirstImage ? report.images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastImage = currentIndex === report.images.length - 1;
        const newIndex = isLastImage ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">{t('images')} - {report.reportNo}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-4 overflow-y-auto flex-grow flex flex-col md:flex-row gap-4">
                    <div className="flex-grow flex items-center justify-center relative bg-black/20 rounded-md">
                        <img src={currentImage.image_url} alt={currentImage.description || `Image ${currentIndex + 1}`} className="max-w-full max-h-[60vh] object-contain rounded" />
                        {report.images.length > 1 && (
                            <>
                                <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    &#10094;
                                </button>
                                <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    &#10095;
                                </button>
                            </>
                        )}
                    </div>
                    <div className="w-full md:w-64 flex-shrink-0 space-y-3 bg-gray-100 dark:bg-gray-900/50 p-4 rounded-md">
                        <h3 className="font-bold text-lg">{t('details')}</h3>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Uploaded By</p>
                            <p>{currentImage.role}</p>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Description</p>
                            <p>{currentImage.description || 'N/A'}</p>
                        </div>
                         <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Timestamp</p>
                            <p>{new Date(currentImage.uploaded_at).toLocaleString()}</p>
                        </div>
                    </div>
                </main>
                 <footer className="text-center p-2 text-sm text-gray-400 border-t dark:border-gray-700 flex-shrink-0">
                    {t('images')} {currentIndex + 1} / {report.images.length}
                </footer>
            </div>
        </div>
    );
};


const ErrorLogTable: React.FC<ErrorLogTableProps> = ({ reports, onOpenUpdateModal, onStatusUpdate }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: 'all', severity: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'report_time', direction: 'descending' });
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
    const [historyModalReport, setHistoryModalReport] = useState<EnrichedErrorReport | null>(null);
    const [imageViewerReport, setImageViewerReport] = useState<EnrichedErrorReport | null>(null);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    };

    const filteredAndSortedReports = useMemo(() => {
        const filtered = reports.filter(report =>
            (searchTerm === '' || report.reportNo.toLowerCase().includes(searchTerm.toLowerCase()) || report.MACHINE_ID.toLowerCase().includes(searchTerm.toLowerCase()) || report.defect_type.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filters.status === 'all' || report.status === filters.status) &&
            (filters.severity === 'all' || report.severity === filters.severity)
        );

        return filtered.sort((a, b) => {
            const aVal = a[sortConfig.key], bVal = b[sortConfig.key];
            let comparison = 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') comparison = aVal - bVal;
            else comparison = String(aVal).localeCompare(String(bVal));
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }, [reports, searchTerm, filters, sortConfig]);

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <span className="opacity-20 group-hover:opacity-100">↕</span>;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    const getStatusChip = (status: ErrorReportStatus) => {
        const styles: Record<ErrorReportStatus, string> = {
            'Reported': 'bg-yellow-900 text-yellow-300',
            'In Progress': 'bg-blue-900 text-blue-300',
            'Fixed': 'bg-green-900 text-green-300',
            'Not Machine Issue': 'bg-purple-900 text-purple-300',
            'Closed': 'bg-gray-700 text-gray-400'
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{t(status.replace(/\s/g, '') as any)}</span>;
    };
    
    const getSeverityChip = (severity: 'Low' | 'Medium' | 'High') => {
        const styles: Record<string, string> = { Low: 'bg-green-900 text-green-300', Medium: 'bg-yellow-900 text-yellow-300', High: 'bg-red-900 text-red-300' };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[severity]}`}>{t(severity)}</span>;
    };

    const ActionButtons: React.FC<{ report: EnrichedErrorReport }> = ({ report }) => {
        const mainButton = (() => {
            switch (report.status) {
                case 'Reported':
                    return <button onClick={() => onStatusUpdate(report.id, 'In Progress')} className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1 px-3 rounded">{t('startWork')}</button>;
                case 'In Progress':
                    return <button onClick={() => onOpenUpdateModal(report)} className="text-sm bg-green-600 hover:bg-green-500 text-white font-semibold py-1 px-3 rounded">{t('updateComplete')}</button>;
                case 'Fixed':
                case 'Not Machine Issue':
                    return <button onClick={() => onStatusUpdate(report.id, 'Closed')} className="text-sm bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-3 rounded">{t('verifyAndClose')}</button>;
                case 'Closed':
                    return <button onClick={() => onOpenUpdateModal(report)} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded">{t('viewDetails')}</button>;
                default:
                    return null;
            }
        })();

        return (
            <div className="flex items-center gap-2">
                {mainButton}
                <button 
                    onClick={() => setHistoryModalReport(report)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                    title={t('history')}
                >
                    <History size={16} />
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2"><label className="text-sm">{t('searchBy')}</label><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('searchPlaceholder')} className="w-full bg-gray-700 p-2 rounded mt-1" /></div>
                <div><label className="text-sm">{t('status')}</label><select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-700 p-2 rounded mt-1"><option value="all">{t('all')}</option><option>Reported</option><option>In Progress</option><option>Fixed</option><option>Not Machine Issue</option><option>Closed</option></select></div>
                <div><label className="text-sm">{t('severity')}</label><select name="severity" value={filters.severity} onChange={handleFilterChange} className="w-full bg-gray-700 p-2 rounded mt-1"><option value="all">{t('all')}</option><option>Low</option><option>Medium</option><option>High</option></select></div>
            </div>
            <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="w-12 p-3"></th>
                            {['reportNo', 'report_time', 'MACHINE_ID', 'defect_type'].map(key => (
                                <th key={key} className="p-3 text-left"><button onClick={() => requestSort(key as SortKey)} className="group flex items-center gap-1">{t(key as any)} {getSortIcon(key as SortKey)}</button></th>
                            ))}
                            <th className="p-3 text-left">{t('images')}</th>
                            {['operator_name', 'technician_name', 'severity', 'status'].map(key => (
                                <th key={key} className="p-3 text-left"><button onClick={() => requestSort(key as SortKey)} className="group flex items-center gap-1">{t(key as any)} {getSortIcon(key as SortKey)}</button></th>
                            ))}
                             <th className="p-3 text-left">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {filteredAndSortedReports.map(report => {
                            const isExpanded = expandedRowId === report.id;
                            return (
                                <React.Fragment key={report.id}>
                                    <tr className={`hover:bg-gray-700/50 ${isExpanded ? 'bg-gray-700/40' : ''}`}>
                                        <td className="p-3 text-center"><button onClick={() => setExpandedRowId(isExpanded ? null : report.id)}>{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td>
                                        <td className="p-3 font-mono text-sm">{report.reportNo}</td>
                                        <td className="p-3 text-sm">{new Date(report.report_time).toLocaleString()}</td>
                                        <td className="p-3">{report.MACHINE_ID}</td>
                                        <td className="p-3">{report.defect_type}</td>
                                        <td className="p-3">
                                            {report.images.length > 0 ? (
                                                <button 
                                                    onClick={() => setImageViewerReport(report)}
                                                    className="flex items-center gap-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-2 rounded-md transition-colors"
                                                >
                                                    <ImageIcon size={14} />
                                                    <span>{report.images.length}</span>
                                                </button>
                                            ) : (
                                                <span className="text-gray-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-3">{report.operator_name}</td>
                                        <td className="p-3">{report.technician_name || 'N/A'}</td>
                                        <td className="p-3">{getSeverityChip(report.severity)}</td>
                                        <td className="p-3">{getStatusChip(report.status)}</td>
                                        <td className="p-3"><ActionButtons report={report} /></td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-900/70">
                                            <td colSpan={11} className="p-4">
                                                <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-300 mb-2">{t('details')}</h4>
                                                        <p className="text-sm text-gray-400"><strong>{t('description')}:</strong> {report.defect_description}</p>
                                                        <p className="text-sm text-gray-400 mt-2"><strong>{t('actionTaken')}:</strong> {report.action_taken || 'N/A'}</p>
                                                        <p className="text-sm text-gray-400 mt-2"><strong>{t('rootCause')}:</strong> {report.root_cause || 'N/A'} ({report.cause_category || 'N/A'})</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                         <div>
                                                            <h4 className="font-semibold text-gray-300 mb-2 flex items-center gap-2"><History size={16}/>{t('history')}</h4>
                                                            <ul className="text-xs text-gray-400 space-y-1 max-h-24 overflow-y-auto">
                                                                {report.history.map(h => (
                                                                    <li key={h.id}>
                                                                        <span className="font-semibold text-gray-300">{new Date(h.changed_at).toLocaleTimeString()}:</span> Status changed to <span className="font-bold">{h.new_status}</span> by {h.changed_by_name}.
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
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
                {filteredAndSortedReports.length === 0 && <div className="text-center py-8 text-gray-500">{t('noRecordsFound')}</div>}
            </div>
            {historyModalReport && (
                <HistoryModal 
                    report={historyModalReport}
                    onClose={() => setHistoryModalReport(null)}
                    t={t}
                />
            )}
            {imageViewerReport && (
                <ImageViewerModal 
                    report={imageViewerReport}
                    onClose={() => setImageViewerReport(null)}
                    t={t}
                />
            )}
        </div>
    );
};

export default ErrorLogTable;