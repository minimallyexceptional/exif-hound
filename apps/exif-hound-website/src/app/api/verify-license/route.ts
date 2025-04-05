import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { validateLicenseKeyFormat } from '@/utils/licenseGenerator';
import type { License } from '@/lib/licenses';

// Path to the licenses database
const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');

/**
 * API route to verify license keys
 * This can be used by the desktop application to verify licenses
 */
export async function POST(request: NextRequest) {
  try {
    // Get license key and email from request body
    const { licenseKey, email } = await request.json();
    
    if (!licenseKey) {
      return NextResponse.json(
        { valid: false, error: 'License key is required' },
        { status: 400 }
      );
    }
    
    // Make email a required field for verification
    if (!email) {
      return NextResponse.json(
        { valid: false, error: 'Email is required for license verification' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // First validate the format of the license key
    if (!validateLicenseKeyFormat(licenseKey)) {
      console.error('License key format validation failed for:', licenseKey);
      return NextResponse.json(
        { valid: false, error: 'Invalid license key format' },
        { status: 400 }
      );
    }
    
    // Check if the license key exists in the database
    try {
      const data = await fs.readFile(licensesPath, 'utf8');
      const licenses: License[] = JSON.parse(data);
      
      const license = licenses.find(lic => lic.key === licenseKey);
      
      if (!license) {
        return NextResponse.json(
          { valid: false, error: 'License key not found' },
          { status: 404 }
        );
      }
      
      // Require email match for verification
      if (!license.email) {
        return NextResponse.json(
          { valid: false, error: 'License has not been activated with an email' },
          { status: 403 }
        );
      }
      
      // Strict email verification - case-insensitive comparison
      if (email.toLowerCase() !== license.email.toLowerCase()) {
        return NextResponse.json(
          { valid: false, error: 'License key is not registered to this email' },
          { status: 403 }
        );
      }
      
      // Check if the license is expired
      const expiresAt = new Date(license.expiresAt);
      const now = new Date();
      
      if (expiresAt < now) {
        return NextResponse.json(
          { valid: false, error: 'License key expired', expiresAt: license.expiresAt },
          { status: 400 }
        );
      }
      
      // Return license information
      return NextResponse.json({
        valid: true,
        productId: license.productId,
        expiresAt: license.expiresAt,
        email: license.email // Return email for confirmation
      });
      
    } catch (error) {
      console.error('Error reading licenses database:', error);
      return NextResponse.json(
        { valid: false, error: 'Server error: Unable to verify license' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error verifying license:', error);
    return NextResponse.json(
      { valid: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Simple email validation
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
} 