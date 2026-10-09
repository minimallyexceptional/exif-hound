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
      className={`glass-panel rounded-lg p-5 flex flex-col ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0 pt-1">
          <span className="text-app-accent shrink-0">{icon}</span>
          <h3 className="text-base font-semibold text-app-white min-w-0 truncate">{title}</h3>
          {count !== undefined && (
            <span className="shrink-0 text-xs font-medium text-app-accent-dim bg-app-gray-light/50 rounded-full px-2 py-0.5 tabular-nums selectable-value">
              {count}
            </span>
          )}
        </div>
        {drillInLabel && onDrillIn && (
          <button
            onClick={onDrillIn}
            className="shrink-0 flex min-h-10 items-center gap-1 text-sm font-medium text-app-accent hover:text-app-white transition-colors duration-200 rounded px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
            aria-label={drillInLabel}
          >
            {drillInLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-app-accent-dim tabular-nums selectable-value -mt-3 mb-4 ml-[26px]">{subtitle}</p>
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
