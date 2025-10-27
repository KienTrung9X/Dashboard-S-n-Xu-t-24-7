import React, { useState, useEffect } from 'react';
import { NewConsumableRequestData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ConsumableRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewConsumableRequestData) => void;
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const ConsumableRequestModal: React.FC<ConsumableRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation();

    const getInitialState = (): NewConsumableRequestData => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return {
            name: '',
            component_code: '',
            specs: '',
            image_url: '',
            quantity: 1,
            order_month: `${year}-${month}`,
            receipt_month: `${year}-${month}`,
            notes: '',
        };
    };

    const [formData, setFormData] = useState<NewConsumableRequestData>(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setError('');
        }
    }, [isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name.trim() || !formData.component_code.trim()) {
            setError(t('formErrorRequired'));
            return;
        }
        if (formData.quantity <= 0) {
            setError('Quantity must be positive.');
            return;
        }
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{t('addNewConsumableRequest')}</h2>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField label={t('name')} id="name" required><input type="text" name="name" value={formData.name} onChange={handleChange} className={formInputClass} required /></FormField>
                           <FormField label={t('componentCode')} id="component_code" required><input type="text" name="component_code" value={formData.component_code} onChange={handleChange} className={formInputClass} required /></FormField>
                           <div className="md:col-span-2"><FormField label={t('technicalSpecifications')} id="specs"><textarea name="specs" value={formData.specs} onChange={handleChange} rows={2} className={formInputClass}></textarea></FormField></div>
                           <FormField label={t('image')} id="image_url"><input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className={formInputClass} placeholder="https://..."/></FormField>
                           <FormField label={t('quantity')} id="quantity" required><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" className={formInputClass} required /></FormField>
                           <FormField label={t('orderMonth')} id="order_month" required><input type="month" name="order_month" value={formData.order_month} onChange={handleChange} className={formInputClass} required /></FormField>
                           <FormField label={t('receiptMonth')} id="receipt_month" required><input type="month" name="receipt_month" value={formData.receipt_month} onChange={handleChange} className={formInputClass} required /></FormField>
                           <div className="md:col-span-2"><FormField label={t('notes')} id="notes"><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} className={formInputClass}></textarea></FormField></div>
                        </div>
                    </main>
                    <footer className="px-6 py-4 bg-gray-900/50 flex justify-end gap-3 mt-auto">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg">{t('submit')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ConsumableRequestModal;
