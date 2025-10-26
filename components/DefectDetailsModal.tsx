
import React from 'react';
import { DefectRecord } from '../types';

interface DefectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: DefectRecord | null;
  onNavigateToLog: (date: string, shift: 'A' | 'B' | 'C') => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-md text-gray-800 dark:text-white whitespace-pre-wrap">{value || 'N/A'}</p>
    </div>
);

const DefectDetailsModal: React.FC<DefectDetailsModalProps> = ({ isOpen, onClose, defect, onNavigateToLog }) => {
  if (!isOpen || !defect) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleNavigateClick = () => {
    if (defect) {
        onNavigateToLog(defect.COMP_DAY, defect.SHIFT);
        onClose();
    }
  };

  const getSeverityChip = (severity: 'Low' | 'Medium' | 'High') => {
    const styles = {
      Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severity]}`}>{severity}</span>;
  };

  const getStatusChip = (status: 'Open' | 'In Progress' | 'Closed') => {
    const styles = {
      Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      Closed: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white animate-fade-in-up">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
                <h2 className="text-xl font-bold">{defect.DEFECT_TYPE}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Defect ID: {defect.Defect_ID}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>

        <main className="p-6 overflow-y-auto space-y-6">
            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400 mb-3 border-l-4 border-cyan-500 pl-3">General Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Date" value={defect.COMP_DAY} />
                    <DetailItem label="Machine ID" value={defect.MACHINE_ID} />
                    <DetailItem label="Line ID" value={defect.LINE_ID} />
                    <DetailItem label="Shift" value={defect.SHIFT} />
                    <DetailItem label="Item Code" value={defect.ITEM_CODE} />
                    <DetailItem label="Quantity" value={`${defect.DEFECT_QTY.toLocaleString()} pcs`} />
                </div>
            </section>
            
            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400 mb-3 border-l-4 border-cyan-500 pl-3">Defect Details</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem label="Severity" value={getSeverityChip(defect.SEVERITY)} />
                    <DetailItem label="Status" value={getStatusChip(defect.STATUS)} />
                    <DetailItem label="Category" value={defect.DEFECT_CATEGORY} />
                    <DetailItem label="Discovered By" value={defect.DISCOVERED_BY} />
                </div>
                <div className="mt-4">
                    <DetailItem label="Description" value={defect.DESCRIPTION} fullWidth />
                </div>
            </section>
            
            <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-cyan-500 dark:text-cyan-400 mb-3 border-l-4 border-cyan-500 pl-3">Analysis & Corrective Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Responsible Person" value={defect.RESPONSIBLE_PERSON} />
                    <DetailItem label="Due Date" value={defect.DUE_DATE} />
                    <DetailItem label="Root Cause" value={defect.ROOT_CAUSE} fullWidth />
                    <DetailItem label="Corrective Action" value={defect.CORRECTIVE_ACTION} fullWidth />
                     <DetailItem label="Attachment" value={defect.ATTACHMENT_URL ? <a href={defect.ATTACHMENT_URL} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">{defect.ATTACHMENT_URL}</a> : 'N/A'} fullWidth />
                </div>
            </section>
        </main>
        <footer className="flex-shrink-0 flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 gap-3">
            <button 
                onClick={onClose} 
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
                Close
            </button>
            <button 
                onClick={handleNavigateClick} 
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1.158a1 1 0 01-1.82.556l-.663-1.148a1 1 0 10-1.732 1l.663 1.148A1 1 0 013.158 7H2a1 1 0 100 2h1.158a1 1 0 01.556 1.82l-1.148.663a1 1 0 101 1.732l1.148-.663A1 1 0 017 12.842V14a1 1 0 102 0v-1.158a1 1 0 011.82-.556l.663 1.148a1 1 0 101.732-1l-.663-1.148A1 1 0 0112.842 9H14a1 1 0 100-2h-1.158a1 1 0 01-.556-1.82l1.148-.663a1 1 0 10-1-1.732l-1.148.663A1 1 0 019 4.158V3z" />
                    <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
                View in Production Log
            </button>
        </footer>
      </div>
    </div>
  );
};

export default DefectDetailsModal;
