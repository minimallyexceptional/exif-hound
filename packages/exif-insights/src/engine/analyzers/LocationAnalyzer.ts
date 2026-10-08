import { BaseAnalyzer } from '../BaseAnalyzer';
import {
  InsightImage,
  LocationInsight,
  LocationsInsights
} from '../../types';
import { COORDINATE_PRECISION, composeLocationName, formatCoordinates } from '../../utils';

interface MutableLocationGroup {
  key: string;
  name: string | null;
  latSum: number;
  lonSum: number;
  altitudes: Set<number>;
  deviceLabels: Set<string>;
  imageIds: string[];
}

/**
 * Unique-location analysis. Images are grouped by reverse-geocoded place
 * name when available, otherwise by a ~100 m coordinate grid cell.
 */
export class LocationAnalyzer extends BaseAnalyzer<LocationsInsights> {
  analyze(images: readonly InsightImage[]): LocationsInsights {
    const groups = new Map<string, MutableLocationGroup>();
    let noGps = 0;

    for (const image of images) {
      if (!this.hasGps(image)) {
        noGps++;
        continue;
      }
      const lat = image.latitude as number;
      const lon = image.longitude as number;
      const name = composeLocationName(image.location);
      const key = name !== null
        ? `name:${name.toLowerCase()}`
        : `grid:${lat.toFixed(COORDINATE_PRECISION)},${lon.toFixed(COORDINATE_PRECISION)}`;

      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          name,
          latSum: 0,
          lonSum: 0,
          altitudes: new Set(),
          deviceLabels: new Set(),
          imageIds: []
        };
        groups.set(key, group);
      }
      group.latSum += lat;
      group.lonSum += lon;
      if (image.gpsAltitude != null) group.altitudes.add(image.gpsAltitude);
      group.deviceLabels.add(this.deviceLabel(image));
      group.imageIds.push(image.id);
    }

    const unique: LocationInsight[] = [...groups.values()].map(group => {
      const centroidLat = group.latSum / group.imageIds.length;
      const centroidLon = group.lonSum / group.imageIds.length;
      return {
        key: group.key,
        name: group.name,
        coordinateLabel: formatCoordinates(centroidLat, centroidLon),
        count: group.imageIds.length,
        imageIds: [...group.imageIds],
        altitudes: [...group.altitudes].sort((a, b) => a - b),
        deviceLabels: [...group.deviceLabels].sort((a, b) => a.localeCompare(b))
      };
    }).sort((a, b) => this.byCountThenName(a, b));

    return { unique, noGps };
  }
}
