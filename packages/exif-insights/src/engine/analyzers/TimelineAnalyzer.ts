import { BaseAnalyzer } from '../BaseAnalyzer';
import {
  DayActivity,
  InsightImage,
  TimelineBurst,
  TimelineEvent,
  TimelineGap,
  TimelineInsights
} from '../../types';
import {
  BURST_THRESHOLD_MS,
  GAP_RANGE_FRACTION,
  localDateString,
  parseCaptureTimestamp
} from '../../utils';

/**
 * Timeline-of-events analysis: chronological capture events, activity
 * histograms, burst and gap detection. Only actual capture timestamps are
 * used; the dataset is never augmented with synthetic entries.
 */
export class TimelineAnalyzer extends BaseAnalyzer<TimelineInsights> {
  analyze(images: readonly InsightImage[]): TimelineInsights {
    // Collect timestamped images, sorted ascending.
    const timestamped = images
      .map(image => ({ image, timestamp: parseCaptureTimestamp(image.dateTimeOriginal) }))
      .filter((entry): entry is { image: InsightImage; timestamp: number } => entry.timestamp !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    const noTimestamp = images.length - timestamped.length;

    // Merge images sharing an identical timestamp into single events.
    const events: TimelineEvent[] = [];
    for (const { image, timestamp } of timestamped) {
      const last = events[events.length - 1];
      if (last && last.timestamp === timestamp) {
        last.imageIds.push(image.id);
        last.count++;
        const label = this.deviceLabel(image);
        if (!last.deviceLabels.includes(label)) last.deviceLabels.push(label);
      } else {
        events.push({
          timestamp,
          iso: new Date(timestamp).toISOString(),
          count: 1,
          imageIds: [image.id],
          deviceLabels: [this.deviceLabel(image)]
        });
      }
    }

    let range: TimelineInsights['range'] = null;
    let byHour: number[] = new Array<number>(24).fill(0);
    let byDay: DayActivity[] = [];
    let bursts: TimelineBurst[] = [];
    let gaps: TimelineGap[] = [];

    if (events.length > 0) {
      const start = events[0].timestamp;
      const end = events[events.length - 1].timestamp;
      range = { start, end };

      byHour = this.activityByHour(events);
      byDay = this.activityByDay(events);
      bursts = this.detectBursts(events);
      gaps = this.detectGaps(events, start, end);
    }

    return { events, range, byHour, byDay, bursts, gaps, noTimestamp };
  }

  private activityByHour(events: readonly TimelineEvent[]): number[] {
    const byHour = new Array<number>(24).fill(0);
    for (const event of events) {
      byHour[new Date(event.timestamp).getHours()] += event.count;
    }
    return byHour;
  }

  private activityByDay(events: readonly TimelineEvent[]): DayActivity[] {
    const byDay = new Map<string, number>();
    for (const event of events) {
      const date = localDateString(event.timestamp);
      byDay.set(date, (byDay.get(date) ?? 0) + event.count);
    }
    return [...byDay.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Bursts: runs of consecutive events where each event starts within
   * BURST_THRESHOLD_MS of the previous event in the run.
   */
  private detectBursts(events: readonly TimelineEvent[]): TimelineBurst[] {
    const bursts: TimelineBurst[] = [];
    let current: { start: number; end: number; imageIds: string[] } | null = null;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const previous = i > 0 ? events[i - 1] : null;
      const inBurst = previous !== null && event.timestamp - previous.timestamp <= BURST_THRESHOLD_MS;

      if (inBurst) {
        if (!current) {
          current = { start: previous!.timestamp, end: previous!.timestamp, imageIds: [...previous!.imageIds] };
        }
        current.end = event.timestamp;
        current.imageIds.push(...event.imageIds);
      } else if (current) {
        bursts.push({
          start: current.start,
          end: current.end,
          count: current.imageIds.length,
          imageIds: current.imageIds
        });
        current = null;
      }
    }

    if (current) {
      bursts.push({
        start: current.start,
        end: current.end,
        count: current.imageIds.length,
        imageIds: current.imageIds
      });
    }

    return bursts;
  }

  /**
   * Gaps: inter-event intervals longer than GAP_RANGE_FRACTION of the
   * total covered range.
   */
  private detectGaps(
    events: readonly TimelineEvent[],
    start: number,
    end: number
  ): TimelineGap[] {
    const gaps: TimelineGap[] = [];
    const minDuration = (end - start) * GAP_RANGE_FRACTION;

    for (let i = 1; i < events.length; i++) {
      const gapStart = events[i - 1].timestamp;
      const gapEnd = events[i].timestamp;
      const duration = gapEnd - gapStart;
      if (duration > minDuration) {
        gaps.push({ start: gapStart, end: gapEnd, durationMs: duration });
      }
    }

    return gaps;
  }
}
