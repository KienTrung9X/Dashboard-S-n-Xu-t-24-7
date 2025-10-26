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
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-gray-900 dark:text-white animate-fade-in-up">
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold flex items-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
            {t('helpUserGuide')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
            {/* FIX: Corrected translation keys */}
            <HelpSection title={t('dashboardOverview')}>
                <p>{t('helpText1')}</p>
            </HelpSection>

            <HelpSection title={t('usingFilters')}>
                <p>...</p>
            </HelpSection>

             <HelpSection title={t('interpretingTabs')}>
                <p>...</p>
            </HelpSection>

            <HelpSection title={t('keyFeatures')}>
                <p>...</p>
            </HelpSection>

        </main>
         <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
              Got It
            </button>
        </footer>
      </div>
    </div>
  );
};

export default HelpModal;