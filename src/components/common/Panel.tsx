import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
  headerActions
}) => {
  return (
    <div className={`glass-panel rounded-lg overflow-hidden ${className}`}>
      {(title || headerActions) && (
        <div className="p-4 border-b border-app-gray-light/30 flex justify-between items-center">
          {title && (
            <h2 className="text-lg font-semibold text-app-white">{title}</h2>
          )}
          {headerActions && (
            <div className="flex items-center space-x-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}; 