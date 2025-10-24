import React, { useState, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface HamburgerMenuProps {
  sections: MenuSection[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ sections }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-cyan-500"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Open main menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="origin-top-left absolute left-0 mt-2 w-72 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-up z-20"
          role="menu"
          aria-orientation="vertical"
          tabIndex={-1}
        >
          <div className="py-2" role="none">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {sectionIndex > 0 && <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>}
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{section.title}</p>
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => handleItemClick(item.onClick)}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                    role="menuitem"
                    tabIndex={-1}
                  >
                    {item.icon && <span className="text-gray-400">{item.icon}</span>}
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;