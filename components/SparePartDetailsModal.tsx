import React from 'react';
import { SparePart } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { AlertTriangle, Package, Calendar, MapPin } from 'lucide-react';

interface SparePartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: SparePart | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-md text-gray-800 dark:text-white">{value || 'N/A'}</p>
    </div>
);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <section className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {children}
        </div>
    </section>
);

const SparePartDetailsModal: React.FC<SparePartDetailsModalProps> = ({ isOpen, onClose, part }) => {
    const { t } = useTranslation();

    if (!isOpen || !part) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const isLowStock = part.qty_on_hand <= part.reorder_point;

    const getStatusChip = () => {
        if (isLowStock) {
            return (
                <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-red-900 text-red-300">
                    <AlertTriangle size={14} />
                    {t('lowStock')}
                </span>
            );
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900 text-green-300">OK</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick} role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                <header className="flex-shrink-0 flex items-start justify-between p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold">{part.name}</h2>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{part.part_code}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto space-y-6">
                    <SectionCard title={t('inventoryInfo')} icon={<Package size={18} />}>
                        <DetailItem label={t('partStatus')} value={getStatusChip()} />
                        <DetailItem label={t('onHand')} value={part.qty_on_hand.toLocaleString()} />
                        <DetailItem label={t('reorderPoint')} value={part.reorder_point.toLocaleString()} />
                    </SectionCard>

                    <SectionCard title={t('orderingInfo')} icon={<Calendar size={18} />}>
                        <DetailItem label={t('onOrder')} value={part.qty_on_order?.toLocaleString() || 0} />
                        <DetailItem label={t('orderDate')} value={part.order_date} />
                        <DetailItem label={t('expectedArrival')} value={part.expected_arrival_date} />
                    </SectionCard>
                    
                     <SectionCard title={t('location')} icon={<MapPin size={18} />}>
                         <DetailItem label={t('location')} value={part.location} className="col-span-full"/>
                    </SectionCard>

                    {part.maintenance_interval_days && (
                        <SectionCard title={t('maintenanceSchedule')} icon={<Calendar size={18} />}>
                            <DetailItem label={t('maintenanceInterval')} value={`${part.maintenance_interval_days} ${t('days')}`} />
                        </SectionCard>
                    )}
                </main>
                <footer className="flex-shrink-0 flex items-center justify-end p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button onClick={onClose} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg">
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SparePartDetailsModal;