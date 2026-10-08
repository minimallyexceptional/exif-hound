import React from 'react';
import { ChevronRight } from 'lucide-react';

interface InsightCardProps {
  /** Section icon (lucide node). */
  icon: React.ReactNode;
  title: string;
  /** Optional one-line context under the title. */
  subtitle?: string;
  /** Optional count shown as a compact pill beside the title. */
  count?: string;
  /** Label for the drill-in action; omit to disable drilling in. */
  drillInLabel?: string;
  onDrillIn?: () => void;
  /** Shown when the dataset has no data for this section at all. */
  emptyMessage?: string | null;
  children?: React.ReactNode;
  /** Extra classes controlling grid placement from the parent layout. */
  className?: string;
}

/**
 * Card shell for dashboard insight sections: icon, title, optional count
 * pill, optional drill-in action, and a built-in empty state.
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  icon,
  title,
  subtitle,
  count,
  drillInLabel,
  onDrillIn,
  emptyMessage,
  children,
  className = ''
}) => {
  const isEmpty = emptyMessage != null;

  return (
    <section
      aria-label={title}
      className={`glass-panel rounded-lg p-4 flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-app-accent shrink-0">{icon}</span>
          <h3 className="text-sm font-semibold text-app-white truncate">{title}</h3>
          {count !== undefined && (
            <span className="shrink-0 text-xs font-medium text-app-accent-dim bg-app-gray-light/50 rounded-full px-2 py-0.5 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {drillInLabel && onDrillIn && (
          <button
            onClick={onDrillIn}
            className="shrink-0 flex items-center gap-1 text-xs text-app-accent hover:text-app-white transition-colors duration-200 rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
            aria-label={drillInLabel}
          >
            {drillInLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-app-accent-dim tabular-nums selectable-value mb-3 -mt-2">{subtitle}</p>
      )}

      {isEmpty ? (
        <p className="text-xs text-app-accent-dim leading-relaxed flex-1 flex items-center">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
};

export default InsightCard;
