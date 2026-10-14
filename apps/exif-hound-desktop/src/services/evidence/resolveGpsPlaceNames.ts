import type { ImageData } from '../../types';
import { getLocationFromCoordinates, type LocationData } from '../../utils/geocoding';

export interface GpsPlaceNamePatch {
  id: string;
  location: LocationData;
}

function isGpsTagged(image: ImageData): boolean {
  if (image.projectImageId === undefined || 'hasImage' in image) return false;
  const { latitude, longitude } = image.exif;
  return typeof latitude === 'number' && Number.isFinite(latitude)
    && typeof longitude === 'number' && Number.isFinite(longitude);
}

function hasFormattedPlaceName(image: ImageData): boolean {
  const formatted = image.exif.location?.formatted;
  return typeof formatted === 'string' && formatted.trim().length > 0;
}

export function applyGpsPlaceNamePatches(
  images: ImageData[],
  patches: GpsPlaceNamePatch[],
): ImageData[] {
  if (patches.length === 0) return images;
  const byId = new Map(patches.map((patch) => [patch.id, patch.location]));
  return images.map((image) => {
    const location = byId.get(image.id);
    if (!location) return image;
    return { ...image, exif: { ...image.exif, location } };
  });
}

export async function resolveMissingGpsPlaceNames(
  images: ImageData[],
  options: {
    enabled: boolean;
    lookup?: (latitude: number, longitude: number) => Promise<LocationData>;
  },
): Promise<GpsPlaceNamePatch[]> {
  if (!options.enabled) return [];
  const lookup = options.lookup ?? getLocationFromCoordinates;
  const patches: GpsPlaceNamePatch[] = [];
  for (const image of images) {
    if (!isGpsTagged(image) || hasFormattedPlaceName(image)) continue;
    const location = await lookup(image.exif.latitude as number, image.exif.longitude as number);
    if (typeof location.formatted === 'string' && location.formatted.trim().length > 0) {
      patches.push({ id: image.id, location });
    }
  }
  return patches;
}
