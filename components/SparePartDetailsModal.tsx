import React from 'react';
import { EnrichedSparePart, McPartOrder } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { AlertTriangle, Package, Calendar, MapPin, Wrench, History, ShoppingCart, Truck, CheckCircle } from 'lucide-react';

interface SparePartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: EnrichedSparePart | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-md text-gray-800 dark:text-white whitespace-pre-line">{value || 'N/A'}</p>
    </div>
);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; fullWidth?: boolean }> = ({ title, icon, children, fullWidth = false }) => (
    <section className={`bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg ${fullWidth ? 'col-span-full' : ''}`}>
        <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h3>
        {children}
    </section>
);

const HistoryTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="col-span-full max-h-48 overflow-y-auto pr-2">
        <table className="min-w-full text-sm">
            {children}
        </table>
    </div>
);

const SparePartDetailsModal: React.FC<SparePartDetailsModalProps> = ({ isOpen, onClose, part }) => {
    const { t } = useTranslation();

    if (!isOpen || !part) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const getStatusChip = (status: McPartOrder['status']) => {
        const styles: Record<McPartOrder['status'], string> = {
            'In Transit': 'bg-blue-900 text-blue-300',
            'Delayed': 'bg-red-900 text-red-300',
            'Received': 'bg-green-900 text-green-300',
        };
        const icons: Record<McPartOrder['status'], React.ReactNode> = {
            'In Transit': <Truck size={12} className="mr-1.5"/>,
            'Delayed': <AlertTriangle size={12} className="mr-1.5"/>,
            'Received': <CheckCircle size={12} className="mr-1.5"/>,
        };
        const translatedStatus = t(status.replace(/\s/g, '_').toLowerCase() as any);
        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
                {icons[status]}
                {translatedStatus || status}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick} role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                <header className="flex-shrink-0 flex items-start justify-between p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold">{part.name}</h2>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{part.part_code}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                             <img src={part.image_url || `https://via.placeholder.com/200/374151/FFFFFF?Text=${part.part_code}`} alt={part.name} className="w-full rounded-lg object-cover shadow-lg" />
                        </div>
                        <div className="md:col-span-2">
                            <SectionCard title={t('inventoryInfo')} icon={<Package size={18}/>}>
                                <div className="grid grid-cols-2 gap-4">
                                     <DetailItem label={t('location')} value={part.location} />
                                     <DetailItem label={t('available')} value={part.available.toLocaleString()} />
                                     <DetailItem label={t('inTransit')} value={part.in_transit.toLocaleString()} />
                                     <DetailItem label={t('reorderPoint')} value={part.reorder_point.toLocaleString()} />
                                     <DetailItem label={t('safetyStock')} value={part.safety_stock.toLocaleString()} />
                                     <DetailItem label={t('used')} value={part.used_in_period.toLocaleString()} />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                    <SectionCard title={t('maintenanceAndStandards')} icon={<Wrench size={18} />} fullWidth>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label={`${t('maintenanceInterval')}`} value={`${part.maintenance_interval_days || 'N/A'} ${part.maintenance_interval_days ? t('days') : ''}`} />
                            <DetailItem label={`${t('lifespan')}`} value={`${part.lifespan_days || 'N/A'} ${part.lifespan_days ? t('days') : ''}`} />
                            <div className="md:col-span-2"><DetailItem label={t('wearTearStandard')} value={part.wear_tear_standard} /></div>
                            <div className="md:col-span-2"><DetailItem label={t('replacementStandard')} value={part.replacement_standard} /></div>
                        </div>
                    </SectionCard>
                    
                    <SectionCard title={t('usageHistory')} icon={<History size={18} />} fullWidth>
                         <HistoryTable>
                             {part.usageHistory.length > 0 ? (
                                <>
                                <thead className="text-left text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="py-2 pr-4">{t('machineUsed')}</th>
                                        <th className="py-2 pr-4">{t('dateUsed')}</th>
                                        <th className="py-2 pr-4">{t('qty')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {part.usageHistory.map(h => (
                                        <tr key={h.order_id} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="py-2 pr-4">{h.MACHINE_ID}</td>
                                            <td className="py-2 pr-4">{new Date(h.completed_at).toLocaleDateString()}</td>
                                            <td className="py-2 pr-4">{h.qty_used}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                </>
                             ) : <p className="text-gray-500 text-center py-4">{t('noUsageHistory')}</p>}
                         </HistoryTable>
                    </SectionCard>
                    
                     <SectionCard title={t('purchaseHistory')} icon={<ShoppingCart size={18} />} fullWidth>
                        <HistoryTable>
                             {part.purchaseHistory.length > 0 ? (
                                <>
                                <thead className="text-left text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="py-2 pr-4">{t('orderId')}</th>
                                        <th className="py-2 pr-4">{t('orderDate')}</th>
                                        <th className="py-2 pr-4">{t('expectedDate')}</th>
                                        <th className="py-2 pr-4">{t('qty')}</th>
                                        <th className="py-2 pr-4">{t('supplier')}</th>
                                        <th className="py-2 pr-4">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {part.purchaseHistory.map(h => (
                                        <tr key={h.id} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="py-2 pr-4 font-mono">{h.order_id}</td>
                                            <td className="py-2 pr-4">{h.order_date}</td>
                                            <td className="py-2 pr-4">{h.expected_date}</td>
                                            <td className="py-2 pr-4">{h.qty_order}</td>
                                            <td className="py-2 pr-4">{h.supplier}</td>
                                            <td className="py-2 pr-4">{getStatusChip(h.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                </>
                             ) : <p className="text-gray-500 text-center py-4">{t('noPurchaseHistory')}</p>}
                        </HistoryTable>
                    </SectionCard>

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
