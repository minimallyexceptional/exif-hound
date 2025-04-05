import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface License {
  id: string;
  key: string;
  email?: string;
  productId: string;
  createdAt: string;
  expiresAt: string;
  stripeSessionId: string;
  activated: boolean;
}

const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

/**
 * Save a license to the database
 */
export async function saveLicense(license: License): Promise<void> {
  await ensureDataDir();
  
  let licenses: License[] = [];
  try {
    const data = await fs.readFile(licensesPath, 'utf8');
    licenses = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet or other error, start with empty array
    console.log('Creating new licenses database');
  }
  
  // Add the license with a unique ID if not provided
  if (!license.id) {
    license.id = uuidv4();
  }
  
  licenses.push(license);
  await fs.writeFile(licensesPath, JSON.stringify(licenses, null, 2));
}

/**
 * Get a license by Stripe session ID
 */
export async function getLicenseBySessionId(sessionId: string): Promise<License | null> {
  try {
    const data = await fs.readFile(licensesPath, 'utf8');
    const licenses: License[] = JSON.parse(data);
    return licenses.find(license => license.stripeSessionId === sessionId) || null;
  } catch (error) {
    console.error('Error getting license by session ID:', error);
    return null;
  }
}

/**
 * Get all licenses
 */
export async function getAllLicenses(): Promise<License[]> {
  try {
    const data = await fs.readFile(licensesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting all licenses:', error);
    return [];
  }
}

/**
 * Activate a license
 */
export async function activateLicense(licenseKey: string, email?: string): Promise<boolean> {
  try {
    const data = await fs.readFile(licensesPath, 'utf8');
    const licenses: License[] = JSON.parse(data);
    
    const licenseIndex = licenses.findIndex(license => license.key === licenseKey);
    if (licenseIndex === -1) {
      return false;
    }
    
    licenses[licenseIndex].activated = true;
    
    // Store the email if provided
    if (email) {
      licenses[licenseIndex].email = email;
    }
    
    await fs.writeFile(licensesPath, JSON.stringify(licenses, null, 2));
    return true;
  } catch (error) {
    console.error('Error activating license:', error);
    return false;
  }
}

