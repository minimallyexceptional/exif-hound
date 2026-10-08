import { BaseAnalyzer } from '../BaseAnalyzer';
import { DeviceInsight, DevicesInsights, InsightImage } from '../../types';

interface MutableDeviceGroup {
  key: string;
  make: string | null;
  model: string | null;
  label: string;
  lenses: Set<string>;
  artists: Set<string>;
  copyrights: Set<string>;
  software: Set<string>;
  imageIds: string[];
}

/**
 * Unique-device analysis: camera make+model fingerprints with per-device
 * lens, attribution and software detail.
 */
export class DeviceAnalyzer extends BaseAnalyzer<DevicesInsights> {
  analyze(images: readonly InsightImage[]): DevicesInsights {
    const groups = new Map<string, MutableDeviceGroup>();
    let unknownCount = 0;

    for (const image of images) {
      const make = this.hasText(image.make) ? (image.make as string).trim() : null;
      const model = this.hasText(image.model) ? (image.model as string).trim() : null;

      if (!make && !model) {
        unknownCount++;
        continue;
      }

      const key = this.deviceKey({ ...image, make, model });
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          make,
          model,
          label: make && model ? `${make} ${model}` : make || (model as string),
          lenses: new Set(),
          artists: new Set(),
          copyrights: new Set(),
          software: new Set(),
          imageIds: []
        };
        groups.set(key, group);
      }

      if (this.hasText(image.lensModel)) group.lenses.add((image.lensModel as string).trim());
      if (this.hasText(image.artist)) group.artists.add((image.artist as string).trim());
      if (this.hasText(image.copyright)) group.copyrights.add((image.copyright as string).trim());
      if (this.hasText(image.software)) group.software.add((image.software as string).trim());
      group.imageIds.push(image.id);
    }

    const unique: DeviceInsight[] = [...groups.values()].map(group => ({
      key: group.key,
      make: group.make,
      model: group.model,
      label: group.label,
      count: group.imageIds.length,
      imageIds: [...group.imageIds],
      lenses: [...group.lenses].sort((a, b) => a.localeCompare(b)),
      artists: [...group.artists].sort((a, b) => a.localeCompare(b)),
      copyrights: [...group.copyrights].sort((a, b) => a.localeCompare(b)),
      software: [...group.software].sort((a, b) => a.localeCompare(b))
    })).sort((a, b) => this.byCountThenName(a, b));

    return { unique, unknownCount };
  }
}
