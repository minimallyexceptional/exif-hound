import { randomBytes } from 'crypto';

/**
 * Generates a unique software license key
 * @param {string} prefix Optional prefix for the license key
 * @param {number} segments Number of segments in the license key
 * @param {number} segmentLength Length of each segment
 * @returns {string} The generated license key
 */
export function generateLicenseKey(
  prefix: string = 'EXH-', 
  segments: number = 4, 
  segmentLength: number = 5
): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like O, 0, I, 1
  let license = prefix;
  
  for (let i = 0; i < segments; i++) {
    const bytes = randomBytes(segmentLength);
    let segment = '';
    
    for (let j = 0; j < segmentLength; j++) {
      // Use the random bytes to select characters from our set
      const randomIndex = bytes[j] % characters.length;
      segment += characters[randomIndex];
    }
    
    license += segment;
    if (i < segments - 1) {
      license += '-';
    }
  }
  
  return license;
}

/**
 * Validates a license key format
 * @param {string} licenseKey The license key to validate
 * @param {string} prefix Expected prefix
 * @param {number} segments Expected number of segments
 * @param {number} segmentLength Expected length of each segment
 * @returns {boolean} Whether the license key is valid
 */
export function validateLicenseKeyFormat(
  licenseKey: string,
  prefix: string = 'EXHPRO-',  // Updated prefix to match the desktop application
  segments: number = 4,
  segmentLength: number = 5
): boolean {
  // Handle both formats: the new EXHPRO format and legacy EXH format
  if (licenseKey.startsWith('EXHPRO-')) {
    // Desktop application format: EXHPRO-XXXXX-XXXXX-XXXXX-XXXXX
    const desktopRegex = /^EXHPRO-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    return desktopRegex.test(licenseKey);
  } else if (licenseKey.startsWith('EXH-')) {
    // Legacy format
    const legacyRegex = new RegExp(
      `^EXH-([A-Z0-9]{${segmentLength}}-){${segments-1}}[A-Z0-9]{${segmentLength}}$`
    );
    return legacyRegex.test(licenseKey);
  }
  
  // If none of the formats match, create a regex based on the provided parameters
  const regex = new RegExp(
    `^${prefix}([A-Z0-9]{${segmentLength}}-){${segments-1}}[A-Z0-9]{${segmentLength}}$`
  );
  return regex.test(licenseKey);
}

