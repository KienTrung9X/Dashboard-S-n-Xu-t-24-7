import React, { useState } from 'react';
import { SparePart, NewMcPartRequestData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface McPartRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewMcPartRequestData) => void;
  part: SparePart;
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const McPartRequestModal: React.FC<McPartRequestModalProps> = ({ isOpen, onClose, onSubmit, part }) => {
    const { t } = useTranslation();
    const [quantity, setQuantity] = useState(part.reorder_point > part.available ? part.reorder_point : 10);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (quantity <= 0) {
            setError('Quantity must be positive.');
            return;
        }
        if (!reason.trim()) {
            setError(t('formErrorRequired'));
            return;
        }
        onSubmit({
            item_code: part.part_code,
            item_name: part.name,
            quantity,
            reason,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold">{t('createPurchaseRequest')}</h2>
                        <p className="text-sm text-gray-400">{part.name} ({part.part_code})</p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>
                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        <FormField label={t('quantity')} id="quantity" required>
                            <input type="number" name="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" className={formInputClass} required />
                        </FormField>
                        <FormField label={t('reasonForPurchase')} id="reason" required>
                            <textarea name="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={formInputClass} required />
                        </FormField>
                    </main>
                    <footer className="px-6 py-4 bg-gray-900/50 flex justify-end gap-3 mt-auto">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg">{t('createRequest')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default McPartRequestModal;
