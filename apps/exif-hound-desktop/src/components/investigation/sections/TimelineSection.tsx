import React from 'react';
import { CalendarClock } from 'lucide-react';
import type { TimelineInsights } from 'exif-insights';
import InsightCard from '../InsightCard';
import { formatClock, formatDuration, formatHour, formatRange, formatTimestamp } from '../format';

interface TimelineSectionProps {
  timeline: TimelineInsights;
  onOpenTimeline: () => void;
  /** Events rendered in the event list before the "showing first N" note. */
  maxEvents?: number;
  /** Extra classes controlling grid placement from the parent layout. */
  className?: string;
}

/**
 * Timeline of events: capture range, activity by hour of day, bursts,
 * gaps and a chronological event list. Times are camera-clock local time.
 */
export const TimelineSection: React.FC<TimelineSectionProps> = ({
  timeline,
  onOpenTimeline,
  maxEvents = 6,
  className
}) => {
  const { events, range, byHour, byDay, bursts, gaps, noTimestamp } = timeline;
  const maxHourCount = Math.max(...byHour, 1);

  return (
    <InsightCard
      icon={<CalendarClock className="w-4 h-4" />}
      title="Timeline of Events"
      count={range ? `${events.length} event${events.length === 1 ? '' : 's'}` : undefined}
      subtitle={range ? formatRange(range.start, range.end) : undefined}
      drillInLabel="Timeline"
      onDrillIn={onOpenTimeline}
      emptyMessage={events.length === 0 ? 'No capture timestamps found in this dataset' : undefined}
      className={className}
    >
      <div className="flex flex-col gap-4">
        {/* Activity by hour of day */}
        <div>
          <p className="text-xs text-app-accent-dim mb-1.5">Activity by hour of day (camera clock)</p>
          <div className="flex items-end gap-px h-14" role="img"
            aria-label={`Activity by hour: ${byHour.map((count, hour) => count > 0 ? `${formatHour(hour)}: ${count}` : null).filter(Boolean).join(', ')}`}
          >
            {byHour.map((count, hour) => (
              <div key={hour} className="flex-1 flex flex-col justify-end h-full" title={count > 0 ? `${formatHour(hour)} — ${count} image${count === 1 ? '' : 's'}` : undefined}>
                {count > 0 && (
                  <div
                    className="rounded-t-sm bg-app-accent"
                    style={{ height: `${Math.max((count / maxHourCount) * 100, 8)}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-app-accent-dim tabular-nums mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Bursts and gaps */}
        {(bursts.length > 0 || gaps.length > 0) && (
          <div className="flex flex-col gap-1">
            {bursts.map((burst, index) => (
              <p key={`burst-${index}`} className="text-xs text-app-accent-dim leading-relaxed">
                <span className="text-app-white">Burst</span>{' '}
                <span className="selectable-value tabular-nums">
                  {burst.count} images · {formatClock(burst.start)}–{formatClock(burst.end)}
                </span>
              </p>
            ))}
            {gaps.map((gap, index) => (
              <p key={`gap-${index}`} className="text-xs text-app-accent-dim leading-relaxed">
                <span className="text-app-white">Gap</span>{' '}
                <span className="selectable-value tabular-nums">
                  {formatDuration(gap.durationMs)} after {formatClock(gap.start)}
                </span>
              </p>
            ))}
          </div>
        )}

        {/* Chronological events */}
        {events.length > 0 && (
          <div className="flex flex-col">
            {events.slice(0, maxEvents).map(event => (
              <div
                key={event.timestamp}
                className="flex items-baseline justify-between gap-3 py-1 border-b border-app-gray-light/30 last:border-b-0"
              >
                <span className="text-sm text-app-white tabular-nums selectable-value truncate">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className="shrink-0 text-xs text-app-accent-dim tabular-nums selectable-value">
                  {event.count} image{event.count === 1 ? '' : 's'}
                </span>
              </div>
            ))}
            {events.length > maxEvents && (
              <p className="text-xs text-app-accent-dim mt-2">
                Showing first {maxEvents} of {events.length} events
              </p>
            )}
          </div>
        )}

        {noTimestamp > 0 && (
          <p className="text-xs text-app-accent-dim tabular-nums selectable-value">
            {noTimestamp} image{noTimestamp === 1 ? '' : 's'} without a capture timestamp
          </p>
        )}
        {byDay.length > 1 && (
          <p className="text-xs text-app-accent-dim tabular-nums selectable-value">
            Activity across {byDay.length} days
          </p>
        )}
      </div>
    </InsightCard>
  );
};

export default TimelineSection;
