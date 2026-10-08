import { BaseAnalyzer } from '../BaseAnalyzer';
import { InsightImage, OverviewInsights } from '../../types';

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/**
 * Dataset overview: totals, processing status and EXIF coverage metrics.
 */
export class OverviewAnalyzer extends BaseAnalyzer<OverviewInsights> {
  analyze(images: readonly InsightImage[]): OverviewInsights {
    const total = images.length;
    let processing = 0;
    let withGps = 0;
    let withDateTime = 0;
    let withDevice = 0;
    let withSoftware = 0;

    for (const image of images) {
      if (image.isProcessing) processing++;
      if (this.hasGps(image)) withGps++;
      if (image.dateTimeOriginal) withDateTime++;
      if (this.hasText(image.make) || this.hasText(image.model)) withDevice++;
      if (this.hasText(image.software)) withSoftware++;
    }

    return {
      total,
      processing,
      withGps,
      withGpsPercent: percent(withGps, total),
      withDateTime,
      withDateTimePercent: percent(withDateTime, total),
      withDevice,
      withDevicePercent: percent(withDevice, total),
      withSoftware,
      withSoftwarePercent: percent(withSoftware, total)
    };
  }
}
