import React, { useState, useEffect } from 'react';
import { EnrichedErrorReport, NewErrorReportData, UpdateErrorData, ErrorReportStatus, MachineInfo, Shift, DefectType, User, DefectCause, EnrichedMaintenanceOrder } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewErrorReportData) => void;
  onUpdate: (reportId: number, data: UpdateErrorData, newStatus: ErrorReportStatus) => void;
  reportToUpdate: EnrichedErrorReport | null;
  masterData: {
    users: User[];
    shifts: Shift[];
    defectTypes: DefectType[];
    machines: MachineInfo[];
    defectCauses: DefectCause[];
  };
  openMaintenanceOrders: EnrichedMaintenanceOrder[];
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const ErrorReportModal: React.FC<ErrorReportModalProps> = ({ isOpen, onClose, onSubmit, onUpdate, reportToUpdate, masterData, openMaintenanceOrders }) => {
    const { t } = useTranslation();
    const isUpdateMode = !!reportToUpdate;

    const getInitialCreateState = () => ({
        machine_id: masterData.machines[0]?.id || 0,
        shift_id: masterData.shifts[0]?.id || 0,
        defect_type: masterData.defectTypes[0]?.name || '',
        defect_description: '',
        severity: 'Medium' as 'Low' | 'Medium' | 'High',
    });

    const getInitialUpdateState = () => ({
        root_cause: reportToUpdate?.root_cause || '',
        cause_category: reportToUpdate?.cause_category || masterData.defectCauses[0]?.category || 'Machine',
        action_taken: reportToUpdate?.action_taken || '',
    });

    const [createData, setCreateData] = useState(getInitialCreateState());
    const [updateData, setUpdateData] = useState(getInitialUpdateState());
    const [error, setError] = useState('');
    const [completionStatus, setCompletionStatus] = useState<ErrorReportStatus>('Fixed');
    const [linkToOrder, setLinkToOrder] = useState(false);
    const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);
    const [availableOrders, setAvailableOrders] = useState<EnrichedMaintenanceOrder[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (isUpdateMode) {
                setUpdateData(getInitialUpdateState());
            } else {
                setCreateData(getInitialCreateState());
            }
            setError('');
            setCompletionStatus('Fixed');
            setLinkToOrder(false);
            setLinkedOrderId(null);
            setAvailableOrders([]);
        }
    }, [isOpen, reportToUpdate, masterData]);

    useEffect(() => {
        if (!isUpdateMode) { // Only for new reports
            const ordersForMachine = openMaintenanceOrders.filter(
                o => o.machine_id === createData.machine_id
            );
            setAvailableOrders(ordersForMachine);
            
            // Reset linking if machine changes or has no open orders
            if (ordersForMachine.length === 0) {
                setLinkToOrder(false);
                setLinkedOrderId(null);
            } else {
                // Check if the currently linked order is still valid for the new machine
                const isCurrentLinkValid = ordersForMachine.some(o => o.id === linkedOrderId);
                if (!isCurrentLinkValid) {
                    setLinkedOrderId(null);
                }
            }
        }
    }, [createData.machine_id, openMaintenanceOrders, isUpdateMode, linkedOrderId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, mode: 'create' | 'update') => {
        const { name, value } = e.target;
        const isNumericField = name.endsWith('_id');
        const finalValue = isNumericField ? parseInt(value, 10) : value;

        if (mode === 'create') {
            setCreateData(prev => ({ ...prev, [name]: finalValue }));
        } else {
            setUpdateData(prev => ({ ...prev, [name]: finalValue }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isUpdateMode) {
            if (!updateData.root_cause?.trim() || !updateData.action_taken?.trim()) {
                setError(t('errorFieldsRequired'));
                return;
            }
            // Mock technician ID
            const technician_id = masterData.users.find(u => u.role === 'Maintenance')?.id || 0;
            onUpdate(reportToUpdate.id, { ...updateData, technician_id }, completionStatus);
        } else {
            if (!createData.defect_description.trim()) {
                setError(t('errorDescriptionRequired'));
                return;
            }
             // Mock operator ID
            const operator_id = masterData.users.find(u => u.role === 'Operator')?.id || 0;
            onSubmit({ 
                ...createData, 
                operator_id,
                linked_maintenance_order_id: linkToOrder ? linkedOrderId : null,
            });
        }
    };
    
    if (!isOpen) return null;
    
    const isReadOnly = isUpdateMode && reportToUpdate.status === 'Closed';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{isUpdateMode ? `${t('updateReport')} #${reportToUpdate.reportNo}` : t('createErrorReport')}</h2>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>

                <form onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 p-4 rounded-md">
                            <legend className="px-2 font-semibold text-cyan-400">{t('operatorReport')}</legend>
                            <FormField label={t('machine')} id="machine_id" required>
                                <select name="machine_id" value={isUpdateMode ? reportToUpdate.machine_id : createData.machine_id} onChange={(e) => handleChange(e, 'create')} className={formInputClass} disabled={isUpdateMode || linkToOrder}>
                                    {masterData.machines.map(m => <option key={m.id} value={m.id}>{m.MACHINE_ID} - {m.MACHINE_NAME}</option>)}
                                </select>
                            </FormField>
                            <FormField label={t('shift')} id="shift_id" required>
                                <select name="shift_id" value={isUpdateMode ? reportToUpdate.shift_id : createData.shift_id} onChange={(e) => handleChange(e, 'create')} className={formInputClass} disabled={isUpdateMode}>
                                    {masterData.shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label={t('defectType')} id="defect_type" required>
                                <select name="defect_type" value={isUpdateMode ? reportToUpdate.defect_type : createData.defect_type} onChange={(e) => handleChange(e, 'create')} className={formInputClass} disabled={isUpdateMode}>
                                    {masterData.defectTypes.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label={t('severity')} id="severity" required>
                                <select name="severity" value={isUpdateMode ? reportToUpdate.severity : createData.severity} onChange={(e) => handleChange(e, 'create')} className={formInputClass} disabled={isUpdateMode}>
                                    <option>Low</option><option>Medium</option><option>High</option>
                                </select>
                            </FormField>
                            <div className="md:col-span-2">
                                <FormField label={t('description')} id="defect_description" required>
                                    <textarea name="defect_description" value={isUpdateMode ? reportToUpdate.defect_description : createData.defect_description} onChange={(e) => handleChange(e, 'create')} rows={3} className={formInputClass} required={!isUpdateMode} disabled={isUpdateMode}></textarea>
                                </FormField>
                            </div>
                            <div className="md:col-span-2">
                                <FormField label={t('operatorImages')} id="images">
                                    <input type="file" multiple disabled={isUpdateMode} />
                                </FormField>
                            </div>
                            {!isUpdateMode && (
                                <div className="p-4 border border-dashed border-gray-600 rounded-lg md:col-span-2">
                                    <div className="flex items-center gap-3">
                                        <input id="link-maint-checkbox" type="checkbox" checked={linkToOrder} onChange={(e) => setLinkToOrder(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600" />
                                        <label htmlFor="link-maint-checkbox" className="font-semibold text-cyan-400">{t('linkToMaintOrder')}</label>
                                    </div>
                                    {linkToOrder && (
                                        <div className="mt-3 space-y-3 animate-fade-in-up">
                                            <p className="text-xs text-gray-400">{t('linkToMaintOrderHelp')}</p>
                                            <FormField label={t('selectOpenMaintOrder')} id="linked_order_id">
                                                <select name="linked_maintenance_order_id" value={linkedOrderId ?? ''} onChange={(e) => setLinkedOrderId(e.target.value ? parseInt(e.target.value, 10) : null)} className={formInputClass}>
                                                    <option value="">{t('selectOpenMaintOrder')}</option>
                                                    {availableOrders.map(o => (
                                                        <option key={o.id} value={o.id}>
                                                            #{o.id} - {o.MACHINE_ID}: {o.symptom.substring(0, 50)}...
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormField>
                                        </div>
                                    )}
                                </div>
                            )}
                        </fieldset>

                        {isUpdateMode && !isReadOnly && (
                            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 p-4 rounded-md">
                                <legend className="px-2 font-semibold text-cyan-400">{t('maintenanceUpdate')}</legend>
                                <div className="md:col-span-2">
                                    <FormField label={t('rootCause')} id="root_cause" required>
                                        <textarea name="root_cause" value={updateData.root_cause} onChange={(e) => handleChange(e, 'update')} rows={2} className={formInputClass} required />
                                    </FormField>
                                </div>
                                <FormField label={t('causeCategory')} id="cause_category" required>
                                    <select name="cause_category" value={updateData.cause_category} onChange={(e) => handleChange(e, 'update')} className={formInputClass}>
                                        {masterData.defectCauses.map(c => <option key={c.id} value={c.category}>{c.category}</option>)}
                                    </select>
                                </FormField>
                                <div className="md:col-span-2">
                                    <FormField label={t('actionTaken')} id="action_taken" required>
                                        <textarea name="action_taken" value={updateData.action_taken} onChange={(e) => handleChange(e, 'update')} rows={3} className={formInputClass} required />
                                    </FormField>
                                </div>
                                 <div className="md:col-span-2">
                                    <FormField label={t('maintenanceImages')} id="maintenance_images">
                                        <input type="file" multiple />
                                    </FormField>
                                </div>
                                <div className="md:col-span-2">
                                     <FormField label={t('completionStatus')} id="completion_status" required>
                                        <select name="completion_status" value={completionStatus} onChange={(e) => setCompletionStatus(e.target.value as ErrorReportStatus)} className={formInputClass}>
                                            <option value="Fixed">Fixed</option>
                                            <option value="Not Machine Issue">Not Machine Issue</option>
                                        </select>
                                    </FormField>
                                </div>
                            </fieldset>
                        )}
                    </main>
                    <footer className="px-6 py-4 bg-gray-900/50 flex justify-end gap-3 mt-auto">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                        {!isReadOnly && (
                            <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg">
                                {isUpdateMode ? t('updateReport') : t('submitReport')}
                            </button>
                        )}
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default ErrorReportModal;