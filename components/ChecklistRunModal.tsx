import React, { useState, useEffect, useMemo } from 'react';
import { EnrichedChecklistInstance, ChecklistInstanceItem, ChecklistItemStatus } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { MessageSquare, X } from 'lucide-react';

interface ChecklistRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instanceId: number, items: ChecklistInstanceItem[]) => void;
  checklistInstance: EnrichedChecklistInstance;
}

interface ItemState {
    status: ChecklistItemStatus;
    actual_value: string | null;
    notes: string | null;
}

const ChecklistRunModal: React.FC<ChecklistRunModalProps> = ({ isOpen, onClose, onSubmit, checklistInstance }) => {
    const { t } = useTranslation();
    const [itemsState, setItemsState] = useState<Record<number, ItemState>>({});
    
    useEffect(() => {
        if (isOpen) {
            const initialState: Record<number, ItemState> = {};
            checklistInstance.items.forEach(item => {
                initialState[item.id] = {
                    status: 'Unchecked',
                    actual_value: '',
                    notes: null,
                };
            });
            setItemsState(initialState);
        }
    }, [isOpen, checklistInstance]);

    const handleItemChange = (itemId: number, field: keyof ItemState, value: any) => {
        setItemsState(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value },
        }));
    };

    const handleCheckboxChange = (itemId: number, checked: boolean) => {
        handleItemChange(itemId, 'status', checked ? 'Checked' : 'Unchecked');
    };

    const handleSubmit = () => {
        // In a real app, you would transform itemsState back to ChecklistInstanceItem[]
        // For now, we'll just pass a simplified version.
        onSubmit(checklistInstance.id, []);
    };
    
    const { progress, allChecked } = useMemo(() => {
        const totalItems = checklistInstance.items.length;
        if (totalItems === 0) return { progress: 100, allChecked: true };
        
        // FIX: Explicitly type `item` as `ItemState` to resolve TypeScript error where it was inferred as `unknown`.
        const checkedCount = Object.values(itemsState).filter((item: ItemState) => item.status === 'Checked').length;
        const progress = (checkedCount / totalItems) * 100;
        return { progress, allChecked: checkedCount === totalItems };
    }, [itemsState, checklistInstance.items]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">{t('runChecklist')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{checklistInstance.template_name} - {checklistInstance.MACHINE_ID}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal"><X size={24} /></button>
                </header>
                
                <div className="px-6 py-3 flex-shrink-0">
                    <p className="text-sm font-semibold mb-1">{t('progress')}: {progress.toFixed(0)}%</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-cyan-500 h-2.5 rounded-full checklist-progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <main className="px-6 pb-6 space-y-3 overflow-y-auto">
                    {checklistInstance.items.map(item => {
                        const state = itemsState[item.id];
                        const isChecked = state?.status === 'Checked';

                        return (
                            <div key={item.id} className={`p-3 border dark:border-gray-600 rounded-lg checklist-item ${isChecked ? 'checked' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <input
                                        type="checkbox"
                                        id={`item-${item.id}`}
                                        checked={isChecked}
                                        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600"
                                    />
                                    <div className="flex-grow">
                                        <label htmlFor={`item-${item.id}`} className="font-medium text-gray-800 dark:text-white cursor-pointer">{item.text}</label>
                                        {item.expected_value && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {t('expectedValue')}: <span className="font-semibold">{item.expected_value}</span>
                                            </p>
                                        )}
                                    </div>
                                    <button className="text-gray-400 hover:text-cyan-400" title={t('addNote')}><MessageSquare size={16} /></button>
                                </div>
                                {item.expected_value && (
                                    <div className="pl-9 mt-2">
                                        <label htmlFor={`actual-value-${item.id}`} className="text-sm font-medium">{t('actualValue')}:</label>
                                        <input
                                            type="text"
                                            id={`actual-value-${item.id}`}
                                            value={state?.actual_value || ''}
                                            onChange={(e) => handleItemChange(item.id, 'actual_value', e.target.value)}
                                            className="mt-1 block w-full max-w-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 px-3 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </main>
                
                <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!allChecked}
                        className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg"
                        title={!allChecked ? t('allRequiredChecked') : ''}
                    >
                        {t('submitChecklist')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ChecklistRunModal;