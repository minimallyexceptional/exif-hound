import { BaseAnalyzer } from '../BaseAnalyzer';
import { AnomaliesInsights, InsightImage } from '../../types';
import {
  COORDINATE_PRECISION,
  OUTLIER_FRACTION,
  SPARSE_FIELD_COUNT,
  composeLocationName,
  countCoreFields,
  parseCaptureTimestamp
} from '../../utils';

/**
 * Cross-cutting anomaly detection for investigators: missing-field
 * conflicts, sparse metadata, multi-device locations, and resolution or
 * orientation outliers.
 */
export class AnomalyAnalyzer extends BaseAnalyzer<AnomaliesInsights> {
  analyze(images: readonly InsightImage[]): AnomaliesInsights {
    const gpsWithoutTimestamp: string[] = [];
    const timestampWithoutGps: string[] = [];
    const sparseMetadata: string[] = [];

    for (const image of images) {
      const hasGps = this.hasGps(image);
      const hasTimestamp = parseCaptureTimestamp(image.dateTimeOriginal) !== null;
      if (hasGps && !hasTimestamp) gpsWithoutTimestamp.push(image.id);
      if (hasTimestamp && !hasGps) timestampWithoutGps.push(image.id);
      if (countCoreFields(image) < SPARSE_FIELD_COUNT) sparseMetadata.push(image.id);
    }

    return {
      gpsWithoutTimestamp,
      timestampWithoutGps,
      sparseMetadata,
      multiDeviceLocations: this.findMultiDeviceLocations(images),
      resolutionOutliers: this.findResolutionOutliers(images),
      orientationOutliers: this.findOrientationOutliers(images)
    };
  }

  /**
   * Location keys (from the same grouping rule the location section uses:
   * reverse-geocoded names, else the ~100 m grid) captured by two or more
   * distinct devices.
   */
  private findMultiDeviceLocations(images: readonly InsightImage[]): string[] {
    const devicesByLocation = new Map<string, Set<string>>();

    for (const image of images) {
      if (!this.hasGps(image)) continue;
      const name = composeLocationName(image.location);
      const key = name !== null
        ? `name:${name.toLowerCase()}`
        : `grid:${image.latitude!.toFixed(COORDINATE_PRECISION)},${image.longitude!.toFixed(COORDINATE_PRECISION)}`;
      const label = this.deviceLabel(image);
      let devices = devicesByLocation.get(key);
      if (!devices) {
        devices = new Set();
        devicesByLocation.set(key, devices);
      }
      devices.add(label);
    }

    return [...devicesByLocation.entries()]
      .filter(([, devices]) => devices.size >= 2)
      .map(([key]) => key)
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * Images whose exact width×height group makes up less than 10% of the
   * images that have dimensions.
   */
  private findResolutionOutliers(images: readonly InsightImage[]): string[] {
    const sized = images.filter(
      image => image.imageWidth != null && image.imageHeight != null
    );
    if (sized.length === 0) return [];

    const groups = new Map<string, string[]>();
    for (const image of sized) {
      const key = `${image.imageWidth}x${image.imageHeight}`;
      const group = groups.get(key);
      if (group) {
        group.push(image.id);
      } else {
        groups.set(key, [image.id]);
      }
    }

    const threshold = sized.length * OUTLIER_FRACTION;
    return [...groups.values()]
      .filter(group => group.length < threshold)
      .flat()
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * Images whose orientation differs from the dataset majority (only
   * images carrying an orientation value participate).
   */
  private findOrientationOutliers(images: readonly InsightImage[]): string[] {
    const oriented = images.filter(image => image.orientation != null);
    if (oriented.length === 0) return [];

    const counts = new Map<number, number>();
    for (const image of oriented) {
      counts.set(image.orientation!, (counts.get(image.orientation!) ?? 0) + 1);
    }

    let majority: number | null = null;
    let majorityCount = 0;
    for (const [orientation, count] of counts) {
      if (count > majorityCount) {
        majority = orientation;
        majorityCount = count;
      }
    }

    return oriented
      .filter(image => image.orientation !== majority)
      .map(image => image.id);
  }
}
