import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-semibold text-cyan-500 dark:text-cyan-400 mb-2">{title}</h3>
        <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
);

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  // Helper to parse simple bold markdown **text**
  const renderText = (key: any) => {
    const text = t(key);
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{t('helpUserGuide')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          <HelpSection title={t('dashboardOverview')}>
            <p>{renderText('help_overview_p1')}</p>
          </HelpSection>

          <HelpSection title={t('usingFilters')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{renderText('help_filters_p1')}</li>
              <li>{renderText('help_filters_p2')}</li>
              <li>{renderText('help_filters_p3')}</li>
            </ul>
          </HelpSection>

          <HelpSection title={t('interpretingTabs')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{renderText('help_tabs_p1')}</li>
              <li>{renderText('help_tabs_p2')}</li>
              <li>{renderText('help_tabs_p3')}</li>
              <li>{renderText('help_tabs_p4')}</li>
              <li>{renderText('help_tabs_p5')}</li>
               <li>{renderText('help_tabs_p6')}</li>
               <li>{renderText('help_tabs_p7')}</li>
            </ul>
          </HelpSection>

           <HelpSection title={t('keyFeatures')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>{renderText('help_features_p1')}</li>
              <li>{renderText('help_features_p2')}</li>
              <li>{renderText('help_features_p3')}</li>
              <li>{renderText('help_features_p4')}</li>
            </ul>
          </HelpSection>
        </main>
      </div>
    </div>
  );
};

export default HelpModal;