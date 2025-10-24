
import React, { useState, useMemo, useEffect } from 'react';

import { NewProductionData } from '../types';

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewProductionData) => void;
  availableMachines: { id: string; line: string }[];
  currentDate: string;
  uniqueDefectTypes: string[];
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ isOpen, onClose, onSubmit, availableMachines, currentDate, uniqueDefectTypes }) => {
  const [entryDate, setEntryDate] = useState(currentDate);
  const [machineId, setMachineId] = useState(availableMachines[0]?.id || '');
  const [shift, setShift] = useState<'A' | 'B' | 'C'>('A');
  const [defectType, setDefectType] = useState('');
  const [defectQty, setDefectQty] = useState('');
  const [operatorName] = useState('Admin'); // Hardcoded to 'Admin'
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);


  const selectedMachine = useMemo(() => {
    return availableMachines.find(m => m.id === machineId);
  }, [machineId, availableMachines]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setEntryDate(currentDate);
        setMachineId(availableMachines[0]?.id || '');
        setShift('A');
        setDefectType('');
        setDefectQty('');
        setError('');
        setIsConfirming(false); // Reset to form view
    }
  }, [isOpen, availableMachines, currentDate]);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const defectNum = parseInt(defectQty, 10);
    const trimmedDefectType = defectType.trim();

    if (!machineId || !selectedMachine) {
      setError('Please select a valid machine.');
      return;
    }
    if (!trimmedDefectType) {
        setError('Defect Name is required.');
        return;
    }
    if (isNaN(defectNum) || defectNum <= 0) {
      setError('Defect quantity must be a positive number.');
      return;
    }

    // Move to confirmation view
    setIsConfirming(true);
  };

  const handleFinalSubmit = () => {
      const defectNum = parseInt(defectQty, 10);
      
      onSubmit({
        MACHINE_ID: machineId,
        LINE_ID: selectedMachine!.line,
        SHIFT: shift,
        DEFECT_QTY: defectNum,
        DEFECT_TYPE: defectType.trim(),
        OPERATOR_NAME: operatorName,
        COMP_DAY: entryDate,
      });
  };
  
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{isConfirming ? 'Confirm Your Entry' : 'Nhập Dữ Liệu Lỗi'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {isConfirming ? (
          <main className="p-6 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Please review the information below before submitting.</p>
            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg space-y-2 text-gray-700 dark:text-gray-200">
                <div className="flex justify-between"><span>Date:</span> <span className="font-semibold">{entryDate}</span></div>
                <div className="flex justify-between"><span>Machine:</span> <span className="font-semibold">{machineId} (Line {selectedMachine?.line})</span></div>
                <div className="flex justify-between"><span>Shift:</span> <span className="font-semibold">Ca {shift}</span></div>
                <div className="flex justify-between"><span>Defect Name:</span> <span className="font-semibold">{defectType}</span></div>
                <div className="flex justify-between"><span>Quantity:</span> <span className="font-semibold">{defectQty} pcs</span></div>
                <div className="flex justify-between"><span>Entered By:</span> <span className="font-semibold">{operatorName}</span></div>
            </div>
          </main>
        ) : (
          <form id="data-entry-form" onSubmit={handleReview}>
            <main className="p-6 space-y-4">
              {error && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-4" role="alert">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="entryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày (Date)</label>
                      <input 
                          type="date" 
                          id="entryDate" 
                          value={entryDate} 
                          onChange={e => setEntryDate(e.target.value)} 
                          className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                          required 
                      />
                  </div>
                  <div>
                      <label htmlFor="shift" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ca (Shift)</label>
                      <select id="shift" value={shift} onChange={e => setShift(e.target.value as 'A' | 'B' | 'C')} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                          <option value="A">Ca A</option>
                          <option value="B">Ca B</option>
                          <option value="C">Ca C</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label htmlFor="machineId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Máy (Machine)</label>
                  <select id="machineId" value={machineId} onChange={e => setMachineId(e.target.value)} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500">
                      {availableMachines.map(m => <option key={m.id} value={m.id}>{m.id} (Line {m.line})</option>)}
                  </select>
              </div>

               <div>
                  <label htmlFor="defectType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại Lỗi (Defect Name)</label>
                   <div className="relative mt-1">
                      <input 
                        type="text" 
                        id="defectType" 
                        value={defectType} 
                        onChange={e => setDefectType(e.target.value)} 
                        className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" 
                        required 
                        list="defect-types-datalist"
                        placeholder="e.g., Skip stitch"
                      />
                      <datalist id="defect-types-datalist">
                          {uniqueDefectTypes.map(type => <option key={type} value={type} />)}
                      </datalist>
                  </div>
                </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label htmlFor="defectQty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số Lượng Lỗi (pcs)</label>
                  <input type="number" id="defectQty" value={defectQty} onChange={e => setDefectQty(e.target.value)} min="1" className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" required />
                </div>
                 <div>
                  <label htmlFor="operatorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Người Nhập (Entered By)</label>
                  <input type="text" id="operatorName" value={operatorName} className="mt-1 block w-full bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-500 dark:text-gray-400 focus:outline-none cursor-not-allowed" disabled readOnly />
                </div>
              </div>
            </main>
          </form>
        )}
        
        <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 mt-auto">
          {isConfirming ? (
            <>
              <button type="button" onClick={() => setIsConfirming(false)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                Go Back
              </button>
              <button type="button" onClick={handleFinalSubmit} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                Confirm Submission
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                Hủy
              </button>
              <button type="submit" form="data-entry-form" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                Review & Submit
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default DataEntryModal;