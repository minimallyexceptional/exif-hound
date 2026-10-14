import type { ProjectStore } from 'investigation-archive';
import type { ImageData } from '../types/imageData';
import type { LocationData } from '../types/location';
import { EvidenceIndexBuilder } from './EvidenceIndexBuilder';
import { EvidenceRepository } from './EvidenceRepository';
import type { EvidenceIndex } from './evidenceTypes';
import {
  applyGpsPlaceNamePatches,
  resolveMissingGpsPlaceNames,
  type GpsPlaceNamePatch,
} from './resolveGpsPlaceNames';

export interface EvidenceHubLoadResult {
  index: EvidenceIndex;
  patches: GpsPlaceNamePatch[];
}

export interface EvidenceHubServiceOptions {
  resolvePlaceNames?: boolean;
  lookupPlaceName?: (latitude: number, longitude: number) => Promise<LocationData>;
}

/** Orchestrates evidence loading and navigation helpers for the Evidence hub UI. */
export class EvidenceHubService {
  private readonly indexBuilder = new EvidenceIndexBuilder();

  constructor(
    private readonly store: ProjectStore,
    private readonly images: ImageData[],
    private readonly options: EvidenceHubServiceOptions = {},
  ) {}

  async loadIndex(): Promise<EvidenceHubLoadResult> {
    const sources = await EvidenceRepository.load(this.store);
    const patches = await resolveMissingGpsPlaceNames(this.images, {
      enabled: this.options.resolvePlaceNames === true,
      lookup: this.options.lookupPlaceName,
    });
    const images = applyGpsPlaceNamePatches(this.images, patches);
    return {
      index: this.indexBuilder.build(
        sources.ocr,
        sources.identifiers,
        sources.provenance,
        images,
      ),
      patches,
    };
  }

  resolveImage(imageId: number): ImageData | undefined {
    return this.images.find(
      (item) => item.projectImageId === imageId && !('hasImage' in item),
    );
  }

  static totalItemCount(index: EvidenceIndex): number {
    return index.categories.reduce((sum, category) => sum + category.count, 0);
  }

  static loadErrorMessage(cause: unknown): string {
    return cause instanceof Error ? cause.message : 'Could not load evidence.';
  }
}
