import React from 'react';
// FIX: Imported missing type 'EnrichedDefectRecord'
import { EnrichedDefectRecord } from '../types';

interface DefectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: EnrichedDefectRecord | null;
  onNavigateToLog: (date: string, machineId: string, shift: 'A' | 'B' | 'C') => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-md text-gray-800 dark:text-white whitespace-pre-wrap">{value || 'N/A'}</p>
    </div>
);

const DefectDetailsModal: React.FC<DefectDetailsModalProps> = ({ isOpen, onClose, defect, onNavigateToLog }) => {
  if (!isOpen || !defect) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  const handleNavigateClick = () => { if (defect) { onNavigateToLog(defect.work_date, defect.MACHINE_ID, defect.SHIFT); onClose(); }};

  const getSeverityChip = (severity: 'Low' | 'Medium' | 'High') => {
    const styles = { Low: 'bg-green-900 text-green-300', Medium: 'bg-yellow-900 text-yellow-300', High: 'bg-red-900 text-red-300' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severity]}`}>{severity}</span>;
  };
  const getStatusChip = (status: 'Open' | 'In Progress' | 'Closed') => {
    const styles = { Open: 'bg-blue-900 text-blue-300', 'In Progress': 'bg-purple-900 text-purple-300', Closed: 'bg-gray-700 text-gray-300' };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick} role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div>
                <h2 className="text-xl font-bold">{defect.defect_type_name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Defect ID: {defect.id}</p>
            </div>
            <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6">
            <section className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 border-l-4 border-cyan-400 pl-3">General Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Date" value={defect.work_date} />
                    <DetailItem label="Machine ID" value={defect.MACHINE_ID} />
                    <DetailItem label="Shift" value={defect.SHIFT} />
                    <DetailItem label="Quantity" value={`${defect.quantity.toLocaleString()} pcs`} />
                </div>
            </section>
            <section className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 border-l-4 border-cyan-400 pl-3">Defect Details</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Severity" value={getSeverityChip(defect.severity)} />
                    <DetailItem label="Status" value={getStatusChip(defect.status)} />
                    <DetailItem label="Category" value={defect.is_abnormal ? 'Abnormal' : 'Fixed'} />
                    <DetailItem label="Reported By" value={defect.reporter_name} />
                </div>
                <div className="mt-4"><DetailItem label="Description / Note" value={defect.note} fullWidth /></div>
            </section>
            <section className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3 border-l-4 border-cyan-400 pl-3">Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Root Cause Category" value={defect.cause_category} />
                </div>
                 {defect.image_urls && defect.image_urls.length > 0 && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                        <p className="text-sm uppercase tracking-wider mb-2">Attached Images</p>
                        <div className="flex flex-wrap gap-2">
                            {defect.image_urls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`Defect ${index + 1}`} className="h-24 w-24 rounded-md object-cover border-2 border-transparent hover:border-cyan-500"/>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
        <footer className="flex-shrink-0 flex items-center justify-end p-4 border-t dark:border-gray-700 bg-gray-900/50 gap-3">
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-4 rounded-lg">Close</button>
            <button onClick={handleNavigateClick} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">View in Production Log</button>
        </footer>
      </div>
    </div>
  );
};

export default DefectDetailsModal;