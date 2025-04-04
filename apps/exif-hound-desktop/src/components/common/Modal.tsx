import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFullscreenToggle?: boolean;
  className?: string;
  headerContent?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  onClose,
  children,
  size = 'md',
  showFullscreenToggle = false,
  className = '',
  headerContent
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div 
      className="fixed inset-0 bg-app-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`glass-panel rounded-lg shadow-inner-light w-full ${isFullscreen ? '' : sizeClasses[size]} ${className} flex flex-col ${
        isFullscreen ? 'fixed inset-0 rounded-none' : 'max-h-[calc(100vh-2rem)]'
      }`}>
        <div className="flex-none p-4 border-b border-app-gray-light/30 bg-app-gray/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between gap-4">
            {headerContent ? (
              <>
                {headerContent}
                <div className="flex items-center gap-2">
                  {showFullscreenToggle && (
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 text-app-accent-dim hover:text-app-white transition-colors"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                      {isFullscreen ? 
                        <Minimize2 className="w-5 h-5" /> : 
                        <Maximize2 className="w-5 h-5" />
                      }
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-app-accent-dim hover:text-app-white transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-app-white">{title}</h2>
                <div className="flex items-center gap-2">
                  {showFullscreenToggle && (
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 text-app-accent-dim hover:text-app-white transition-colors"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                      {isFullscreen ? 
                        <Minimize2 className="w-5 h-5" /> : 
                        <Maximize2 className="w-5 h-5" />
                      }
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-app-accent-dim hover:text-app-white transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto ${isFullscreen ? 'flex items-center justify-center' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}; 