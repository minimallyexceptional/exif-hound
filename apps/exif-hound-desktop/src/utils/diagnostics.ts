/**
 * GPS coordinate utilities for map rendering.
 *
 * Historically these functions "fixed" coordinates by guessing hemispheres
 * from magnitude ranges — e.g. flipping a positive longitude to negative when
 * the coordinates resembled the Americas. That guessing mirrored perfectly
 * valid eastern-hemisphere photos (Tokyo, Sydney, Auckland) to the wrong side
 * of the globe and caused the reticle/details-panel coordinate mismatch.
 *
 * EXIF hemisphere references are now resolved by exifreader (see
 * packages/exif-middleware), so the coordinates arriving here are trusted
 * as-is. The function is kept as an explicit seam for map layers.
 */

/**
 * Returns the coordinates unchanged. Kept as a seam so map layers have a
 * single place to normalize coordinates if that is ever needed again.
 */
export function fixCoordinates(lat: number | null, lng: number | null): [number | null, number | null] {
  return [lat, lng];
}