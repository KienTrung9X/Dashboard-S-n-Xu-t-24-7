import React from 'react';
import { ChecklistTemplate, EnrichedChecklistInstance } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { PlayCircle, ListChecks } from 'lucide-react';

interface ChecklistDashboardProps {
  templates: ChecklistTemplate[];
  pendingInstances: EnrichedChecklistInstance[];
  onStartChecklist: (instance: EnrichedChecklistInstance) => void;
}

const ChecklistDashboard: React.FC<ChecklistDashboardProps> = ({ templates, pendingInstances, onStartChecklist }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('pendingTasks')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingInstances.length > 0 ? pendingInstances.map(instance => (
                        <div key={instance.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-yellow-500 p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{instance.template_name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('machine')}: <span className="font-semibold">{instance.MACHINE_ID}</span></p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{instance.template_description}</p>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => onStartChecklist(instance)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                                >
                                    <PlayCircle size={16} />
                                    {t('start')}
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 dark:text-gray-400 md:col-span-3">{t('noPendingChecklists')}</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-cyan-400 mb-4 border-l-4 border-cyan-400 pl-3">{t('checklistTemplates')}</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {templates.map(template => (
                             <li key={template.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-center gap-4">
                                     <div className="p-2 bg-cyan-500/10 rounded-full">
                                        <ListChecks size={20} className="text-cyan-400" />
                                     </div>
                                     <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{template.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.area} - {template.type}</p>
                                    </div>
                                </div>
                                <button
                                    // In a real app, this would create a new instance first
                                    // For this mock, we'll find a related pending one or create a dummy
                                    onClick={() => onStartChecklist(pendingInstances[0])}
                                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                                >
                                    <PlayCircle size={16} />
                                    {t('startNow')}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default ChecklistDashboard;
