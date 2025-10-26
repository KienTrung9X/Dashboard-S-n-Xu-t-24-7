

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

const formInputClass = "mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-800 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";
const formLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const FormField: React.FC<{ label: string; id: string; required?: boolean; children: React.ReactNode }> = ({ label, id, required, children }) => (
    <div>
        <label htmlFor={id} className={formLabelClass}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);


const DataEntryModal: React.FC<DataEntryModalProps> = ({ isOpen, onClose, onSubmit, availableMachines, currentDate, uniqueDefectTypes }) => {
    
    const getInitialState = () => ({
        COMP_DAY: currentDate,
        MACHINE_ID: availableMachines[0]?.id || '',
        LINE_ID: availableMachines[0]?.line || '',
        SHIFT: 'A' as 'A' | 'B' | 'C',
        DEFECT_TYPE: '',
        DEFECT_QTY: '',
        OPERATOR_NAME: 'Admin', // Hardcoded "Discoverer"
        DESCRIPTION: '',
        SEVERITY: 'Medium' as 'Low' | 'Medium' | 'High',
        STATUS: 'Open' as 'Open' | 'In Progress' | 'Closed',
        ROOT_CAUSE: '',
        CORRECTIVE_ACTION: '',
        RESPONSIBLE_PERSON: '',
        DUE_DATE: '',
        ATTACHMENT_URL: '',
    });

    const [formData, setFormData] = useState(getInitialState());
    const [defectCategory, setDefectCategory] = useState<'Fixed' | 'Abnormal'>('Abnormal');
    const [error, setError] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    const selectedMachine = useMemo(() => {
        return availableMachines.find(m => m.id === formData.MACHINE_ID);
    }, [formData.MACHINE_ID, availableMachines]);

    // Reset form when modal opens or dependencies change
    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setDefectCategory('Abnormal');
            setError('');
            setIsConfirming(false);
        }
    }, [isOpen, availableMachines, currentDate]);
    
    // Update LINE_ID when MACHINE_ID changes
    useEffect(() => {
        if (selectedMachine) {
            setFormData(prev => ({...prev, LINE_ID: selectedMachine.line}));
        }
    }, [selectedMachine]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReview = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const defectNum = parseInt(formData.DEFECT_QTY, 10);
        
        // Mandatory field validation
        if (!formData.MACHINE_ID || !selectedMachine) { setError('Please select a valid machine.'); return; }
        if (!formData.DEFECT_TYPE.trim()) { setError('Defect Title is required.'); return; }
        if (isNaN(defectNum) || defectNum <= 0) { setError('Defect quantity must be a positive number.'); return; }

        if (defectCategory === 'Abnormal') {
            if (!formData.DESCRIPTION.trim()) { setError('Detailed Description is required for abnormal waste.'); return; }
        }

        setIsConfirming(true);
    };

    const handleFinalSubmit = () => {
        const submissionData: NewProductionData = {
            ...formData,
            DEFECT_CATEGORY: defectCategory,
            DEFECT_QTY: parseInt(formData.DEFECT_QTY, 10),
            // Provide defaults for 'Fixed' waste to satisfy the type
            DESCRIPTION: defectCategory === 'Fixed' ? `Standard loss: ${formData.DEFECT_TYPE}` : formData.DESCRIPTION,
            SEVERITY: defectCategory === 'Fixed' ? 'Low' : formData.SEVERITY,
            STATUS: defectCategory === 'Fixed' ? 'Closed' : formData.STATUS,
        };
        onSubmit(submissionData);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">{isConfirming ? 'Confirm Defect Report' : `Báo Cáo Lỗi Chi Tiết (${defectCategory === 'Fixed' ? 'Cố Định' : 'Phát Sinh'})`}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                {isConfirming ? (
                    <main className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Please review the information below before submitting.</p>
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg space-y-2 text-gray-700 dark:text-gray-200 text-sm">
                            <div className="flex justify-between"><span>Category:</span> <span className="font-semibold">{defectCategory === 'Fixed' ? 'Phế phẩm cố định (Fixed Waste)' : 'Phế phẩm phát sinh (Abnormal Waste)'}</span></div>
                            <div className="flex justify-between"><span>Date:</span> <span className="font-semibold">{formData.COMP_DAY}</span></div>
                            <div className="flex justify-between"><span>Machine:</span> <span className="font-semibold">{formData.MACHINE_ID} (Line {formData.LINE_ID})</span></div>
                            <div className="flex justify-between"><span>Shift:</span> <span className="font-semibold">Ca {formData.SHIFT}</span></div>
                            {defectCategory === 'Abnormal' && <div className="flex justify-between"><span>Status:</span> <span className="font-semibold">{formData.STATUS}</span></div>}
                            <hr className="border-gray-300 dark:border-gray-600 my-2" />
                            <div className="flex justify-between"><span>Defect Title:</span> <span className="font-semibold">{formData.DEFECT_TYPE}</span></div>
                            <div className="flex justify-between"><span>Quantity:</span> <span className="font-semibold">{formData.DEFECT_QTY} pcs</span></div>
                            {defectCategory === 'Abnormal' && <>
                                <div className="flex justify-between"><span>Severity:</span> <span className="font-semibold">{formData.SEVERITY}</span></div>
                                <div><span className="block">Description:</span> <p className="font-semibold whitespace-pre-wrap pl-2">{formData.DESCRIPTION}</p></div>
                                <hr className="border-gray-300 dark:border-gray-600 my-2" />
                                <div className="flex justify-between"><span>Root Cause:</span> <span className="font-semibold">{formData.ROOT_CAUSE || 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Corrective Action:</span> <span className="font-semibold">{formData.CORRECTIVE_ACTION || 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Responsible:</span> <span className="font-semibold">{formData.RESPONSIBLE_PERSON || 'N/A'}</span></div>
                                <div className="flex justify-between"><span>Due Date:</span> <span className="font-semibold">{formData.DUE_DATE || 'N/A'}</span></div>
                                <hr className="border-gray-300 dark:border-gray-600 my-2" />
                                <div className="flex justify-between"><span>Attachment URL:</span> <span className="font-semibold">{formData.ATTACHMENT_URL || 'N/A'}</span></div>
                            </>}
                             <div className="flex justify-between"><span>Discovered By:</span> <span className="font-semibold">{formData.OPERATOR_NAME}</span></div>
                        </div>
                    </main>
                ) : (
                    <form id="data-entry-form" onSubmit={handleReview}>
                        <main className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {error && <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-md" role="alert">{error}</div>}
                            
                            <fieldset className="border dark:border-gray-600 p-4 rounded-md">
                                <legend className="px-2 font-semibold text-cyan-500 dark:text-cyan-400">Loại Phế Phẩm (Waste Category)</legend>
                                <div className="md:col-span-2 flex gap-x-6 gap-y-2 flex-wrap" role="radiogroup">
                                    <div className="flex items-center gap-2">
                                        <input type="radio" id="category-abnormal" name="defectCategory" value="Abnormal" checked={defectCategory === 'Abnormal'} onChange={() => setDefectCategory('Abnormal')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" />
                                        <label htmlFor="category-abnormal" className="font-medium text-gray-800 dark:text-gray-200">Phế phẩm phát sinh (Abnormal Waste)</label>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <input type="radio" id="category-fixed" name="defectCategory" value="Fixed" checked={defectCategory === 'Fixed'} onChange={() => setDefectCategory('Fixed')} className="h-4 w-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"/>
                                        <label htmlFor="category-fixed" className="font-medium text-gray-800 dark:text-gray-200">Phế phẩm cố định (Fixed Waste)</label>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {defectCategory === 'Abnormal' 
                                      ? 'Lỗi do vận hành, nguyên liệu, thiết bị... Cần phân tích và cải tiến.'
                                      : 'Hao hụt kỹ thuật không thể tránh, nằm trong định mức.'}
                                </p>
                            </fieldset>

                            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 p-4 rounded-md">
                                <legend className="px-2 font-semibold text-cyan-500 dark:text-cyan-400">Thông tin chung (General Info)</legend>
                                <FormField label="Ngày (Date)" id="COMP_DAY" required><input type="date" name="COMP_DAY" id="COMP_DAY" value={formData.COMP_DAY} onChange={handleChange} className={formInputClass} required /></FormField>
                                <FormField label="Ca (Shift)" id="SHIFT" required>
                                    <select name="SHIFT" id="SHIFT" value={formData.SHIFT} onChange={handleChange} className={formInputClass}>
                                        <option value="A">Ca A</option><option value="B">Ca B</option><option value="C">Ca C</option>
                                    </select>
                                </FormField>
                                <FormField label="Máy (Machine)" id="MACHINE_ID" required>
                                    <select name="MACHINE_ID" id="MACHINE_ID" value={formData.MACHINE_ID} onChange={handleChange} className={formInputClass}>
                                        {availableMachines.map(m => <option key={m.id} value={m.id}>{m.id} (Line {m.line})</option>)}
                                    </select>
                                </FormField>
                                {defectCategory === 'Abnormal' && <FormField label="Trạng thái (Status)" id="STATUS" required>
                                    <select name="STATUS" id="STATUS" value={formData.STATUS} onChange={handleChange} className={formInputClass}>
                                        <option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Closed">Closed</option>
                                    </select>
                                </FormField>}
                            </fieldset>
                            
                            {defectCategory === 'Fixed' ? (
                                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 p-4 rounded-md animate-fade-in-up">
                                    <legend className="px-2 font-semibold text-cyan-500 dark:text-cyan-400">Thông tin Phế phẩm Cố định (Fixed Waste Info)</legend>
                                    <FormField label="Loại Phế phẩm (Waste Type)" id="DEFECT_TYPE" required>
                                        <div className="relative mt-1"><input type="text" name="DEFECT_TYPE" id="DEFECT_TYPE" value={formData.DEFECT_TYPE} onChange={handleChange} className={formInputClass} required list="defect-types-datalist" placeholder="e.g., Material Trim"/></div>
                                        <datalist id="defect-types-datalist">{uniqueDefectTypes.map(type => <option key={type} value={type}/>)}</datalist>
                                    </FormField>
                                    <FormField label="Số lượng (Quantity)" id="DEFECT_QTY" required>
                                        <input type="number" name="DEFECT_QTY" id="DEFECT_QTY" value={formData.DEFECT_QTY} onChange={handleChange} min="1" className={formInputClass} required/>
                                    </FormField>
                                </fieldset>
                            ) : (
                                <>
                                    <fieldset className="grid grid-cols-1 gap-4 border dark:border-gray-600 p-4 rounded-md animate-fade-in-up">
                                        <legend className="px-2 font-semibold text-cyan-500 dark:text-cyan-400">Mô tả lỗi (Defect Details)</legend>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField label="Tiêu đề lỗi (Defect Title)" id="DEFECT_TYPE_ABNORMAL" required>
                                                <div className="relative mt-1"><input type="text" name="DEFECT_TYPE" id="DEFECT_TYPE_ABNORMAL" value={formData.DEFECT_TYPE} onChange={handleChange} className={formInputClass} required list="defect-types-datalist" placeholder="e.g., Skip stitch"/></div>
                                                <datalist id="defect-types-datalist">{uniqueDefectTypes.map(type => <option key={type} value={type}/>)}</datalist>
                                            </FormField>
                                            <FormField label="Số lượng lỗi (pcs)" id="DEFECT_QTY_ABNORMAL" required><input type="number" name="DEFECT_QTY" id="DEFECT_QTY_ABNORMAL" value={formData.DEFECT_QTY} onChange={handleChange} min="1" className={formInputClass} required/></FormField>
                                            <FormField label="Mức độ (Severity)" id="SEVERITY" required>
                                                <select name="SEVERITY" id="SEVERITY" value={formData.SEVERITY} onChange={handleChange} className={formInputClass}>
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </FormField>
                                        </div>
                                        <FormField label="Mô tả chi tiết (Detailed Description)" id="DESCRIPTION" required><textarea name="DESCRIPTION" id="DESCRIPTION" value={formData.DESCRIPTION} onChange={handleChange} rows={3} className={formInputClass} required placeholder="Describe what is wrong, where it is, and when it occurred..."></textarea></FormField>
                                    </fieldset>
                                    
                                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border dark:border-gray-600 p-4 rounded-md animate-fade-in-up">
                                        <legend className="px-2 font-semibold text-cyan-500 dark:text-cyan-400">Phân tích & Khắc phục (Analysis & Action)</legend>
                                        <div className="md:col-span-2"><FormField label="Phân tích Nguyên nhân (Root Cause Analysis)" id="ROOT_CAUSE"><textarea name="ROOT_CAUSE" id="ROOT_CAUSE" value={formData.ROOT_CAUSE} onChange={handleChange} rows={2} className={formInputClass}></textarea></FormField></div>
                                        <div className="md:col-span-2"><FormField label="Hành động Khắc phục/Phòng ngừa (Corrective/Preventive Action)" id="CORRECTIVE_ACTION"><textarea name="CORRECTIVE_ACTION" id="CORRECTIVE_ACTION" value={formData.CORRECTIVE_ACTION} onChange={handleChange} rows={2} className={formInputClass}></textarea></FormField></div>
                                        <FormField label="Người chịu trách nhiệm (Responsible Person)" id="RESPONSIBLE_PERSON"><input type="text" name="RESPONSIBLE_PERSON" id="RESPONSIBLE_PERSON" value={formData.RESPONSIBLE_PERSON} onChange={handleChange} className={formInputClass}/></FormField>
                                        <FormField label="Thời hạn hoàn thành (Due Date)" id="DUE_DATE"><input type="date" name="DUE_DATE" id="DUE_DATE" value={formData.DUE_DATE} onChange={handleChange} className={formInputClass}/></FormField>
                                        <div className="md:col-span-2"><FormField label="Đính kèm (Attachment URL)" id="ATTACHMENT_URL"><input type="url" name="ATTACHMENT_URL" id="ATTACHMENT_URL" value={formData.ATTACHMENT_URL} onChange={handleChange} className={formInputClass} placeholder="https://example.com/image.png"/></FormField></div>
                                    </fieldset>
                                </>
                            )}
                        </main>
                    </form>
                )}

                <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 mt-auto">
                    {isConfirming ? (
                        <>
                            <button type="button" onClick={() => setIsConfirming(false)} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">Go Back</button>
                            <button type="button" onClick={handleFinalSubmit} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">Confirm Submission</button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors">Hủy</button>
                            <button type="submit" form="data-entry-form" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">Review & Submit</button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default DataEntryModal;