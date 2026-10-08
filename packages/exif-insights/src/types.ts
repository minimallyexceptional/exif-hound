/**
 * Input record for the insights engine.
 *
 * This is a normalized, dependency-free projection of the desktop app's
 * `ImageData.exif` so the package never depends on app types. The app
 * adapts its own `ImageData[]` to `InsightImage[]` at the call site.
 */
export interface InsightImage {
  id: string;
  isProcessing?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  gpsAltitude?: number | null;
  /** Raw capture timestamp string (ISO 8601 or EXIF "YYYY:MM:DD HH:mm:ss"). */
  dateTimeOriginal?: string | null;
  make?: string | null;
  model?: string | null;
  lensModel?: string | null;
  software?: string | null;
  artist?: string | null;
  copyright?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  orientation?: number | null;
  /** Reverse-geocoded location, when available. */
  location?: {
    formatted?: string;
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    road?: string;
  } | null;
}

export interface OverviewInsights {
  total: number;
  processing: number;
  withGps: number;
  withGpsPercent: number;
  withDateTime: number;
  withDateTimePercent: number;
  withDevice: number;
  withDevicePercent: number;
  withSoftware: number;
  withSoftwarePercent: number;
}

export interface LocationInsight {
  /** Stable group key (`name:<…>` or `grid:<lat>,<lon>`). */
  key: string;
  /** Place name when reverse geocoding was available, otherwise null. */
  name: string | null;
  /** Centroid coordinates, formatted "lat, lon" (4 decimals). */
  coordinateLabel: string;
  count: number;
  imageIds: string[];
  /** Distinct GPS altitudes in metres, sorted ascending. */
  altitudes: number[];
  deviceLabels: string[];
}

export interface LocationsInsights {
  unique: LocationInsight[];
  noGps: number;
}

export interface DeviceInsight {
  key: string;
  make: string | null;
  model: string | null;
  /** Human-readable label, e.g. "Apple iPhone 15 Pro" or "Unknown device". */
  label: string;
  count: number;
  imageIds: string[];
  lenses: string[];
  artists: string[];
  copyrights: string[];
  software: string[];
}

export interface DevicesInsights {
  unique: DeviceInsight[];
  /** Images with neither make nor model. */
  unknownCount: number;
}

export interface TimelineEvent {
  timestamp: number;
  iso: string;
  count: number;
  imageIds: string[];
  deviceLabels: string[];
}

export interface TimelineBurst {
  start: number;
  end: number;
  count: number;
  imageIds: string[];
}

export interface TimelineGap {
  start: number;
  end: number;
  durationMs: number;
}

export interface DayActivity {
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  count: number;
}

export interface TimelineInsights {
  /** Chronological events; images sharing a timestamp are merged. */
  events: TimelineEvent[];
  range: { start: number; end: number } | null;
  /** Images per hour of day (0–23), local camera-clock time. */
  byHour: number[];
  byDay: DayActivity[];
  bursts: TimelineBurst[];
  gaps: TimelineGap[];
  noTimestamp: number;
}

export interface SoftwareInsights {
  /** Detected software values with image counts, sorted by count then name. */
  detected: Array<{ name: string; count: number }>;
  editedCount: number;
  cameraOriginalCount: number;
}

export interface AnomaliesInsights {
  /** Images with GPS coordinates but no capture timestamp. */
  gpsWithoutTimestamp: string[];
  /** Images with a capture timestamp but no GPS coordinates. */
  timestampWithoutGps: string[];
  /** Images with suspiciously sparse metadata (fewer than 3 core fields). */
  sparseMetadata: string[];
  /** Location keys captured by two or more distinct devices. */
  multiDeviceLocations: string[];
  /** Images whose resolution group is under 10% of images with dimensions. */
  resolutionOutliers: string[];
  /** Images whose orientation differs from the dataset majority. */
  orientationOutliers: string[];
}

export interface InvestigationInsights {
  overview: OverviewInsights;
  locations: LocationsInsights;
  devices: DevicesInsights;
  timeline: TimelineInsights;
  software: SoftwareInsights;
  anomalies: AnomaliesInsights;
}
