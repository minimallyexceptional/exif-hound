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
        className="absolute left-0 top-20 -translate-x-full p-2 bg-app-gray-dark border-l border-y border-app-gray-light rounded-l-lg text-app-white hover:bg-app-gray-light/20 transition-colors"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Sidebar Content */}
      <div className="w-64 h-full bg-app-gray-dark border-l border-app-gray-light shadow-lg">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StatsSidebar; 