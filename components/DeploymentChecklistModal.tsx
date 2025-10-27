import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { ChevronDown, ChevronUp, Database, Server, Code, TestTube, Check, Circle } from 'lucide-react';

interface DeploymentChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const checklistConfig = {
    databaseSchema: ['dbSchema_sparePart', 'dbSchema_maintenancePartUsage', 'dbSchema_mcPartPurchaseRequest', 'dbSchema_mcPartOrder', 'dbSchema_runMigrations'],
    backendApi: ['api_getParts', 'api_getPartDetails', 'api_addPart', 'api_updatePart', 'api_getRequests', 'api_createRequest'],
    frontendUi: ['ui_inventoryList', 'ui_partDetailsModal', 'ui_editPartModal', 'ui_createRequestModal', 'ui_connectToApp'],
    testingDeployment: ['test_unitTests', 'test_integrationTests', 'test_userAcceptance', 'deploy_production'],
};

const allItems = Object.values(checklistConfig).flat();

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-3 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-full text-cyan-400">{icon}</div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isExpanded && <div className="p-4 border-t border-gray-200 dark:border-gray-600/50">{children}</div>}
        </div>
    );
};

const ChecklistItem: React.FC<{ text: string; id: string; isChecked: boolean; onToggle: (id: string) => void }> = ({ text, id, isChecked, onToggle }) => {
    return (
        <div
            onClick={() => onToggle(id)}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors checklist-item ${isChecked ? 'checked' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
            <div className="flex-shrink-0">
                {isChecked ? <Check size={20} className="text-green-500" /> : <Circle size={20} className="text-gray-400" />}
            </div>
            <label htmlFor={id} className={`flex-grow cursor-pointer ${isChecked ? 'line-through text-gray-500' : ''}`}>
                {text}
            </label>
        </div>
    );
};


const DeploymentChecklistModal: React.FC<DeploymentChecklistModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen) {
            // Load state from localStorage when modal opens
            const savedState = localStorage.getItem('deploymentChecklist');
            if (savedState) {
                setCheckedItems(JSON.parse(savedState));
            }
        }
    }, [isOpen]);

    const handleToggle = (id: string) => {
        const newCheckedState = { ...checkedItems, [id]: !checkedItems[id] };
        setCheckedItems(newCheckedState);
        // Save state to localStorage
        localStorage.setItem('deploymentChecklist', JSON.stringify(newCheckedState));
    };

    const progress = useMemo(() => {
        const checkedCount = Object.values(checkedItems).filter(Boolean).length;
        return (checkedCount / allItems.length) * 100;
    }, [checkedItems]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl text-gray-900 dark:text-white animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex items-start justify-between p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold">{t('deploymentChecklistTitle')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">A meta-checklist to track the development of this module.</p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                <div className="px-6 py-4 flex-shrink-0">
                    <p className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">{t('progress')}: {progress.toFixed(0)}%</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-cyan-500 h-4 rounded-full checklist-progress-bar text-xs text-white flex items-center justify-center font-bold" style={{ width: `${progress}%` }}>
                           {progress > 10 && `${progress.toFixed(0)}%`}
                        </div>
                    </div>
                </div>

                <main className="px-6 pb-6 space-y-4 overflow-y-auto">
                    <Section title={t('databaseSchema')} icon={<Database size={18} />}>
                        <div className="space-y-2">
                           {checklistConfig.databaseSchema.map(id => (
                                <ChecklistItem key={id} id={id} text={t(id as any)} isChecked={!!checkedItems[id]} onToggle={handleToggle} />
                           ))}
                        </div>
                    </Section>
                    <Section title={t('backendApi')} icon={<Server size={18} />}>
                       <div className="space-y-2">
                           {checklistConfig.backendApi.map(id => (
                                <ChecklistItem key={id} id={id} text={t(id as any)} isChecked={!!checkedItems[id]} onToggle={handleToggle} />
                           ))}
                        </div>
                    </Section>
                     <Section title={t('frontendUi')} icon={<Code size={18} />}>
                       <div className="space-y-2">
                           {checklistConfig.frontendUi.map(id => (
                                <ChecklistItem key={id} id={id} text={t(id as any)} isChecked={!!checkedItems[id]} onToggle={handleToggle} />
                           ))}
                        </div>
                    </Section>
                     <Section title={t('testingDeployment')} icon={<TestTube size={18} />}>
                       <div className="space-y-2">
                           {checklistConfig.testingDeployment.map(id => (
                                <ChecklistItem key={id} id={id} text={t(id as any)} isChecked={!!checkedItems[id]} onToggle={handleToggle} />
                           ))}
                        </div>
                    </Section>
                </main>

                <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 mt-auto flex-shrink-0">
                    <button onClick={onClose} className="bg-cyan-500 hover:bg-cyan-600 font-bold py-2 px-6 rounded-lg text-white">
                        {t('close')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DeploymentChecklistModal;
