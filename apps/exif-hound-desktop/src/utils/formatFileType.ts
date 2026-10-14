/**
 * Human-readable file type label from a MIME type or empty string (e.g. CSV imports).
 */
export function formatFileType(mimeType: string): string {
  if (!mimeType) {
    return 'N/A';
  }
  const subtype = mimeType.split('/')[1];
  if (!subtype) {
    return 'N/A';
  }
  return subtype.toUpperCase();
}
