import React, { type KeyboardEvent, type ReactNode } from 'react';

interface SidebarRailToggleProps {
  expanded: boolean;
  onToggle: () => void;
  screenReaderLabel: string;
  testId: string;
  chevron: ReactNode;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/**
 * Clickable sidebar rail header. Avoids aria-label/title on icon-only controls so
 * WebKit/GTK does not show native hover tooltips on chevrons.
 */
export const SidebarRailToggle: React.FC<SidebarRailToggleProps> = ({
  expanded,
  onToggle,
  screenReaderLabel,
  testId,
  chevron,
  className = '',
  leading,
  trailing,
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      data-testid={testId}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={className}
    >
      <span className="sr-only">{screenReaderLabel}</span>
      {leading}
      <div className={`flex shrink-0 items-center gap-1 ${leading ? 'ml-auto' : ''}`}>
        {trailing}
        <span className="pointer-events-none flex items-center" aria-hidden="true">
          {chevron}
        </span>
      </div>
    </div>
  );
};
