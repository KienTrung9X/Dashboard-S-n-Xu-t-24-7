import React, { useState, useEffect } from 'react';
import { NewMaintenanceOrderData, MachineInfo, User, DefectCause, EnrichedDefectRecord, SparePart } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface MaintenanceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewMaintenanceOrderData) => void;
  allMachines: MachineInfo[];
  allUsers: User[];
  allDefectCauses: DefectCause[];
  openDefects: EnrichedDefectRecord[];
  currentDate: string;
  allSpareParts: SparePart[];
  defaults?: Partial<NewMaintenanceOrderData>;
}

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, id, required, children, className }) => (
    <div className={className}><label htmlFor={id} className={formLabelClass}>{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>
);

const MaintenanceOrderModal: React.FC<MaintenanceOrderModalProps> = ({ isOpen, onClose, onSubmit, allMachines, allUsers, allDefectCauses, openDefects, currentDate, allSpareParts, defaults }) => {
    const { t } = useTranslation();

    const getInitialState = () => ({
        machine_id: defaults?.machine_id || allMachines[0]?.id || 0,
        type: defaults?.type || 'CM' as 'PM' | 'CM' | 'Breakdown',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        reported_by_id: allUsers.find(u => u.role === 'Maintenance')?.id || 0,
        symptom: defaults?.symptom || (defaults?.type === 'PM' ? 'Scheduled Preventive Maintenance' : ''),
        created_at: defaults?.created_at || currentDate,
        assigned_to_id: null as number | null,
    });

    const [formData, setFormData] = useState(getInitialState());
    const [error, setError] = useState('');
    const [linkToDefect, setLinkToDefect] = useState(false);
    const [linkedDefectId, setLinkedDefectId] = useState<number | null>(null);
    const [updatedCauseId, setUpdatedCauseId] = useState<number | null>(null);
    const [partsUsed, setPartsUsed] = useState<{ part_id: number | string; qty_used: number }[]>([{ part_id: '', qty_used: 1 }]);

    useEffect(() => {
        if (isOpen) {
            const initialState = {
                machine_id: defaults?.machine_id || allMachines[0]?.id || 0,
                type: defaults?.type || 'CM' as 'PM' | 'CM' | 'Breakdown',
                priority: 'Medium' as 'Low' | 'Medium' | 'High',
                reported_by_id: allUsers.find(u => u.role === 'Maintenance')?.id || 0,
                symptom: defaults?.symptom || (defaults?.type === 'PM' ? 'Scheduled Preventive Maintenance' : ''),
                created_at: defaults?.created_at || currentDate,
                assigned_to_id: defaults?.assigned_to_id || null,
            };
            setFormData(initialState);
            setError('');
            setLinkToDefect(false);
            setLinkedDefectId(null);
            setUpdatedCauseId(null);
            
            const defaultParts = defaults?.parts_used?.map(p => ({ part_id: p.part_id, qty_used: p.qty_used })) || [];
            setPartsUsed(defaultParts.length > 0 ? defaultParts : [{ part_id: '', qty_used: 1 }]);
        }
    }, [isOpen, defaults, allMachines, allUsers, currentDate]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumericField = name.endsWith('_id');
        setFormData(prev => ({ ...prev, [name]: isNumericField ? (value ? parseInt(value, 10) : null) : value }));
    };

    const handleDefectLinkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const defectId = e.target.value ? parseInt(e.target.value, 10) : null;
        setLinkedDefectId(defectId);
        
        if (defectId) {
            const selectedDefect = openDefects.find(d => d.id === defectId);
            if (selectedDefect) {
                setFormData(prev => ({
                    ...prev,
                    machine_id: selectedDefect.machine_id,
                    symptom: prev.symptom || selectedDefect.note || '',
                }));
                setUpdatedCauseId(selectedDefect.cause_id);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                machine_id: allMachines[0]?.id || 0,
                symptom: '',
            }));
            setUpdatedCauseId(null);
        }
    }

    const handlePartChange = (index: number, field: 'part_id' | 'qty_used', value: string | number) => {
        const newParts = [...partsUsed];
        newParts[index] = { ...newParts[index], [field]: field === 'part_id' ? (value ? parseInt(value as string) : '') : (value ? parseInt(value as string) : 1) };
        setPartsUsed(newParts);
    };

    const addPartRow = () => {
        setPartsUsed([...partsUsed, { part_id: '', qty_used: 1 }]);
    };

    const removePartRow = (index: number) => {
        const newParts = partsUsed.filter((_, i) => i !== index);
        setPartsUsed(newParts);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.machine_id || !formData.reported_by_id) { 
            setError('Please select a machine and reporter.');
            return;
        }
        if (formData.type !== 'PM' && !formData.symptom.trim()) {
            setError('Symptom description is required for CM and Breakdown orders.');
            return;
        }
        
        const finalPartsUsed = partsUsed
            .filter(p => p.part_id && Number(p.qty_used) > 0)
            .map(p => ({ ...p, part_id: Number(p.part_id), qty_used: Number(p.qty_used) }));

        onSubmit({
            ...formData,
            linked_defect_id: linkedDefectId,
            updated_cause_id: updatedCauseId,
            assigned_to_id: formData.assigned_to_id,
            parts_used: finalPartsUsed,
        });
    };
    
    if (!isOpen) return null;

    const maintenanceUsers = allUsers.filter(u => u.role === 'Maintenance' || u.role === 'Admin');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{t('createMaintOrderTitle')}</h2>
                    <button onClick={onClose} aria-label="Close modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>

                <form id="maintenance-order-form" onSubmit={handleSubmit}>
                    <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md">{error}</div>}
                        
                        <div className="p-4 border border-dashed border-gray-600 rounded-lg">
                            <div className="flex items-center gap-3">
                                <input id="link-defect-checkbox" type="checkbox" checked={linkToDefect} onChange={(e) => {
                                    setLinkToDefect(e.target.checked);
                                    if (!e.target.checked) { setLinkedDefectId(null); setUpdatedCauseId(null); }
                                }} className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-cyan-500 focus:ring-cyan-600" />
                                <label htmlFor="link-defect-checkbox" className="font-semibold text-cyan-400">{t('linkToOpenDefect')}</label>
                            </div>
                            {linkToDefect && (
                                <div className="mt-3 space-y-3 animate-fade-in-up">
                                    <p className="text-xs text-gray-400">{t('linkToOpenDefectHelp')}</p>
                                    <FormField label={t('selectOpenDefect')} id="linked_defect_id">
                                        <select name="linked_defect_id" value={linkedDefectId ?? ''} onChange={handleDefectLinkChange} className={formInputClass}>
                                            <option value="">{t('selectOpenDefect')}</option>
                                            {openDefects.map(d => (
                                                <option key={d.id} value={d.id}>ID: {d.id} - {d.defect_type_name} on {d.MACHINE_ID} ({d.work_date})</option>
                                            ))}
                                        </select>
                                    </FormField>
                                    {linkedDefectId && (<FormField label={t('updateRootCause')} id="updated_cause_id">
                                        <select name="updated_cause_id" value={updatedCauseId ?? ''} onChange={(e) => setUpdatedCauseId(parseInt(e.target.value))} className={formInputClass}>
                                            {allDefectCauses.map(c => <option key={c.id} value={c.id}>{c.category}</option>)}
                                        </select>
                                    </FormField>)}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('orderType')} id="type" required><select name="type" value={formData.type} onChange={handleChange} className={formInputClass}><option value="CM">{t('cm')}</option><option value="Breakdown">{t('breakdown')}</option><option value="PM">{t('pm')}</option></select></FormField>
                            <FormField label={t('priority')} id="priority" required><select name="priority" value={formData.priority} onChange={handleChange} className={formInputClass}><option>Low</option><option>Medium</option><option>High</option></select></FormField>
                        </div>

                        <FormField label={t('machine')} id="machine_id" required><select name="machine_id" value={formData.machine_id} onChange={handleChange} className={formInputClass} disabled={!!linkedDefectId}>{allMachines.map(m => <option key={m.id} value={m.id}>{m.MACHINE_ID} - {m.MACHINE_NAME} (Line {m.LINE_ID})</option>)}</select></FormField>
                        
                        {formData.type === 'PM' ? (
                            <FormField label={t('scheduledDate')} id="created_at" required><input type="date" name="created_at" value={formData.created_at} onChange={handleChange} className={formInputClass} required /></FormField>
                        ) : (
                             <FormField label={t('symptomDesc')} id="symptom" required><textarea name="symptom" value={formData.symptom} onChange={handleChange} rows={4} className={formInputClass} placeholder={t('describeIssue')} disabled={!!linkedDefectId}></textarea></FormField>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t('reportedBy')} id="reported_by_id" required><select name="reported_by_id" value={formData.reported_by_id} onChange={handleChange} className={formInputClass}>{maintenanceUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}</select></FormField>
                            <FormField label={t('assignTechnician')} id="assigned_to_id"><select name="assigned_to_id" value={formData.assigned_to_id || ''} onChange={handleChange} className={formInputClass}><option value="">{t('selectTechnician')}</option>{maintenanceUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}</select></FormField>
                        </div>
                        
                        <FormField label={t('partsToUse')} id="parts_to_use" className="md:col-span-2">
                             <div className="mt-2 space-y-3 p-3 border dark:border-gray-600 rounded-md">
                                {partsUsed.map((part, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="flex-grow"><label htmlFor={`part-${index}`} className="sr-only">{t('part')}</label><select id={`part-${index}`} value={part.part_id} onChange={(e) => handlePartChange(index, 'part_id', e.target.value)} className={formInputClass + " mt-0"}><option value="">{t('selectPart')}</option>{allSpareParts.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.part_code}) - {p.qty_on_hand} left</option>))}</select></div>
                                        <div className="w-24"><label htmlFor={`qty-${index}`} className="sr-only">{t('quantity')}</label><input id={`qty-${index}`} type="number" min="1" value={part.qty_used} onChange={(e) => handlePartChange(index, 'qty_used', parseInt(e.target.value))} className={formInputClass + " mt-0"}/></div>
                                        <button type="button" onClick={() => removePartRow(index)} className="p-2 text-gray-400 hover:text-red-400 rounded-full transition-colors">&times;</button>
                                    </div>
                                ))}
                                <button type="button" onClick={addPartRow} className="text-sm text-cyan-400 hover:underline">{t('addPart')}</button>
                            </div>
                        </FormField>
                    </main>
                </form>

                <footer className="px-6 py-4 bg-gray-900/50 flex justify-end gap-3 mt-auto">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-bold py-2 px-6 rounded-lg">{t('cancel')}</button>
                    <button type="submit" form="maintenance-order-form" className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg">{t('submitOrder')}</button>
                </footer>
            </div>
        </div>
    );
};

export default MaintenanceOrderModal;