import React, { useId, useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocusCapture={() => setIsVisible(true)}
      onBlurCapture={() => setIsVisible(false)}
      onKeyDown={(event) => { if (event.key === 'Escape') setIsVisible(false); }}
    >
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      }) : children}
      {isVisible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 max-w-64 rounded border border-app-gray-light bg-app-gray px-2 py-1 text-xs text-app-white shadow-lg ${positionClasses[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
};
