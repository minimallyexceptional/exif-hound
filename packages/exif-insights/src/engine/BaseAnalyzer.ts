import { InsightImage } from '../types';

/**
 * Base class for all insight analyzers. Each analyzer is responsible for
 * exactly one section of the dashboard snapshot.
 */
export abstract class BaseAnalyzer<T> {
  /**
   * Compute this analyzer's section from the dataset.
   *
   * @param images - normalized image records (already EXIF-parsed)
   */
  abstract analyze(images: readonly InsightImage[]): T;

  /** True when a string field is present and non-blank. */
  protected hasText(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
  }

  /** True when both GPS coordinates are present. */
  protected hasGps(image: InsightImage): boolean {
    return image.latitude != null && image.longitude != null;
  }

  /** Stable device key ("make|model", lowercased). */
  protected deviceKey(image: InsightImage): string {
    return `${image.make ?? ''}|${image.model ?? ''}`.toLowerCase();
  }

  /** Human-readable device label. */
  protected deviceLabel(image: InsightImage): string {
    const make = image.make?.trim();
    const model = image.model?.trim();
    if (make && model) return `${make} ${model}`;
    return make || model || 'Unknown device';
  }

  /** Sort helper: descending count, then ascending name/key. */
  protected byCountThenName<A extends { count?: number }>(
    a: A & { name?: string | null; key?: string },
    b: A & { name?: string | null; key?: string }
  ): number {
    const countDelta = (b.count ?? 0) - (a.count ?? 0);
    if (countDelta !== 0) return countDelta;
    const aName = a.name ?? a.key ?? '';
    const bName = b.name ?? b.key ?? '';
    return aName.localeCompare(bName);
  }
}
