import React, { useState, useEffect } from 'react';
import { SparePart, NewSparePartData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface SparePartEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewSparePartData, id: number | null) => void;
  partToEdit: SparePart | null;
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const SparePartEditModal: React.FC<SparePartEditModalProps> = ({ isOpen, onClose, onSubmit, partToEdit }) => {
    const { t } = useTranslation();
    const isUpdateMode = !!partToEdit;

    const getInitialState = (): NewSparePartData => ({
        part_code: '',
        name: '',
        location: '',
        available: 0,
        reorder_point: 0,
        safety_stock: 0,
        in_transit: 0,
        reserved: 0,
        used_in_period: 0,
        maintenance_interval_days: undefined,
    });

    const [formData, setFormData] = useState<NewSparePartData>(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (isUpdateMode && partToEdit) {
                setFormData({
                    part_code: partToEdit.part_code,
                    name: partToEdit.name,
                    location: partToEdit.location,
                    available: partToEdit.available,
                    reorder_point: partToEdit.reorder_point,
                    safety_stock: partToEdit.safety_stock,
                    in_transit: partToEdit.in_transit,
                    reserved: partToEdit.reserved,
                    used_in_period: partToEdit.used_in_period,
                    maintenance_interval_days: partToEdit.maintenance_interval_days,
                });
            } else {
                setFormData(getInitialState());
            }
            setError('');
        }
    }, [isOpen, partToEdit]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['available', 'reorder_point', 'safety_stock', 'in_transit', 'reserved', 'used_in_period', 'maintenance_interval_days'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? (value === '' ? undefined : Number(value)) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.part_code.trim() || !formData.name.trim() || !formData.location.trim()) {
            setError(t('formErrorRequired'));
            return;
        }
        onSubmit(formData, partToEdit?.id || null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{isUpdateMode ? t('editSparePart') : t('addNewSparePart')}</h2>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('partCode')} id="part_code" required><input type="text" name="part_code" value={formData.part_code} onChange={handleChange} className={formInputClass} required /></FormField>
                            <FormField label={t('name')} id="name" required><input type="text" name="name" value={formData.name} onChange={handleChange} className={formInputClass} required /></FormField>
                            <div className="md:col-span-2"><FormField label={t('location')} id="location" required><input type="text" name="location" value={formData.location} onChange={handleChange} className={formInputClass} required /></FormField></div>
                            <FormField label={t('available')} id="available" required><input type="number" name="available" value={formData.available} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <FormField label={t('reorderPoint')} id="reorder_point" required><input type="number" name="reorder_point" value={formData.reorder_point} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <FormField label={t('safetyStock')} id="safety_stock" required><input type="number" name="safety_stock" value={formData.safety_stock} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <FormField label={t('inTransit')} id="in_transit" required><input type="number" name="in_transit" value={formData.in_transit} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <FormField label={t('reserved')} id="reserved" required><input type="number" name="reserved" value={formData.reserved} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <FormField label={t('used')} id="used_in_period" required><input type="number" name="used_in_period" value={formData.used_in_period} onChange={handleChange} min="0" className={formInputClass} required /></FormField>
                            <div className="md:col-span-2"><FormField label={`${t('maintenanceInterval')} (${t('days')})`} id="maintenance_interval_days"><input type="number" name="maintenance_interval_days" value={formData.maintenance_interval_days || ''} onChange={handleChange} min="0" className={formInputClass} /></FormField></div>
                        </div>
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

export default SparePartEditModal;
