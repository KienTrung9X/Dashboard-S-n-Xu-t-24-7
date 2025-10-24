import React from 'react';

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
            User Guide
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
            <HelpSection title="Dashboard Overview">
                <p>This dashboard provides a comprehensive view of manufacturing performance, focusing on Overall Equipment Effectiveness (OEE). Use the filters and tabs to analyze production data across different areas, shifts, and time periods.</p>
            </HelpSection>

            <HelpSection title="Using Filters">
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Date Mode:</strong> Switch between <strong>Single Day</strong> to view data for one specific day, or <strong>Date Range</strong> to analyze trends over a period. The Shift filter is disabled in range mode.</li>
                    <li><strong>Date Pickers:</strong> Select the start and end dates for your analysis.</li>
                    <li><strong>Khu Vực (Area):</strong> Filter the data to a specific manufacturing area or view 'all' areas combined. You can search for an area by typing in the search box.</li>
                    <li><strong>Ca (Shift):</strong> Select a specific shift (A, B, or C) or view data for the entire day ('Cả Ngày').</li>
                    <li><strong>OEE Threshold:</strong> Set a percentage value to highlight underperforming machines. Any machine with an OEE below this threshold will be flagged in yellow in the production log and will trigger a dashboard-wide alert.</li>
                    <li><strong>Clear Filters:</strong> This button resets all filters, including the OEE threshold, to their default state.</li>
                </ul>
            </HelpSection>

             <HelpSection title="Interpreting the Tabs">
                <p>The dashboard is divided into four main tabs for focused analysis:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><strong>Tổng Quan (Overview):</strong> Your main landing page. It shows key performance indicators (KPIs), an overall OEE gauge, production/OEE by line, and a detailed production log.</li>
                    <li><strong>Phân Tích Hiệu Suất (Performance Analysis):</strong> Visualizes performance trends over time, production distribution (Boxplot), and OEE performance by line and shift (Heatmap).</li>
                    <li><strong>Phân Tích Chất Lượng (Quality Analysis):</strong> Focuses on defect data. The Pareto chart helps identify the most frequent defect types (the "vital few").</li>
                    <li><strong>Phân Tích Dừng Máy (Downtime Analysis):</strong> Similar to the quality tab, but for downtime. The Pareto chart here identifies the most significant reasons for machine downtime.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Key Features & Interactivity">
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>OEE Gauge:</strong> Hover over the main gauge on the Overview tab to see a breakdown of Availability, Performance, and Quality. Hover over the info icon to see the color legend.</li>
                    <li><strong>Production Log:</strong> Click on any <span className="font-semibold text-cyan-400 dark:text-cyan-300">Machine ID</span> in the table to open a detailed modal with its specs, performance, and downtime history.</li>
                    <li><strong>Editable Defects:</strong> In the Production Log, you can <span className="font-semibold text-cyan-400 dark:text-cyan-300">double-click</span> on a value in the 'Defects' column to edit it. This requires an admin password ('ADMIN247').</li>
                    <li><strong>Hamburger Menu (☰):</strong> Access additional features like the <span className="font-semibold text-cyan-400 dark:text-cyan-300">Data Entry</span> form to log new defect records and <span className="font-semibold text-cyan-400 dark:text-cyan-300">View Database Tables</span> to see the raw mock data.</li>
                </ul>
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