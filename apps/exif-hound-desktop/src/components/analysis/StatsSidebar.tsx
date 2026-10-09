import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StatsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({ isOpen, onToggle, children }) => {
  return (
    <div 
      className={`absolute top-0 right-0 h-full flex transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ zIndex: 10 }}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={isOpen ? 'Hide stats sidebar' : 'Show stats sidebar'}
        aria-expanded={isOpen}
        className="absolute left-0 top-20 -translate-x-full flex h-10 w-10 items-center justify-center bg-app-dark border-l border-y border-app-gray-light rounded-l-lg text-app-white hover:bg-app-gray-light/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Sidebar Content */}
      <div className="w-64 h-full bg-app-dark border-l border-app-gray-light shadow-lg">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StatsSidebar;
