import React, { useState, useEffect } from 'react';
import { MachineInfo, NewMachineData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface MachineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewMachineData, id: number | null) => void;
  machineToEdit: MachineInfo | null;
  allLines: string[];
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const MachineEditModal: React.FC<MachineEditModalProps> = ({ isOpen, onClose, onSubmit, machineToEdit, allLines }) => {
    const { t } = useTranslation();
    const isUpdateMode = !!machineToEdit;
    
    const getInitialState = (): NewMachineData => ({
        MACHINE_ID: '',
        MACHINE_NAME: '',
        LINE_ID: allLines[0] || '',
        IDEAL_CYCLE_TIME: 0,
        DESIGN_SPEED: 0,
        STATUS: 'active',
    });

    const [formData, setFormData] = useState<NewMachineData>(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isUpdateMode && machineToEdit) {
                setFormData({
                    MACHINE_ID: machineToEdit.MACHINE_ID,
                    MACHINE_NAME: machineToEdit.MACHINE_NAME,
                    LINE_ID: machineToEdit.LINE_ID,
                    IDEAL_CYCLE_TIME: machineToEdit.IDEAL_CYCLE_TIME,
                    DESIGN_SPEED: machineToEdit.DESIGN_SPEED,
                    STATUS: machineToEdit.STATUS,
                });
            } else {
                setFormData(getInitialState());
            }
            setError('');
        }
    }, [isOpen, machineToEdit, allLines]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['IDEAL_CYCLE_TIME', 'DESIGN_SPEED'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.MACHINE_ID.trim() || !formData.MACHINE_NAME.trim() || !formData.LINE_ID.trim()) {
            setError(t('formErrorRequired'));
            return;
        }
        onSubmit(formData, machineToEdit?.id || null);
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{isUpdateMode ? t('editMachine') : t('addMachine')}</h2>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('machineId')} id="MACHINE_ID" required><input type="text" name="MACHINE_ID" value={formData.MACHINE_ID} onChange={handleChange} className={formInputClass} required /></FormField>
                            <FormField label={t('machineName')} id="MACHINE_NAME" required><input type="text" name="MACHINE_NAME" value={formData.MACHINE_NAME} onChange={handleChange} className={formInputClass} required /></FormField>
                        </div>
                        <FormField label={t('line')} id="LINE_ID" required>
                            <select name="LINE_ID" value={formData.LINE_ID} onChange={handleChange} className={formInputClass}>
                                {allLines.map(line => <option key={line} value={line}>{line}</option>)}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('idealCycleTime')} id="IDEAL_CYCLE_TIME" required><input type="number" name="IDEAL_CYCLE_TIME" value={formData.IDEAL_CYCLE_TIME} onChange={handleChange} min="0" step="0.001" className={formInputClass} required /></FormField>
                            <FormField label={t('designSpeed')} id="DESIGN_SPEED" required><input type="number" name="DESIGN_SPEED" value={formData.DESIGN_SPEED} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                        </div>
                        <FormField label={t('status')} id="STATUS" required>
                            <select name="STATUS" value={formData.STATUS} onChange={handleChange} className={formInputClass}>
                                <option value="active">{t('active')}</option>
                                <option value="inactive">{t('inactive')}</option>
                            </select>
                        </FormField>
                    </main>
                    <footer className="px-6 py-4 bg-gray-900/50 flex justify-end gap-3 mt-auto">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg">{t('saveChanges')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default MachineEditModal;
