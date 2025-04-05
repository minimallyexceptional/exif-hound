import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { validateLicenseKeyFormat } from '@/utils/licenseGenerator';
import { activateLicense } from '@/lib/licenses';
import type { License } from '@/lib/licenses';

// Path to the licenses database
const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');

/**
 * API route to activate license keys
 * This is used when a user activates their license for the first time
 */
export async function POST(request: NextRequest) {
  try {
    // Get license key and email from request body
    const { licenseKey, email } = await request.json();
    
    if (!licenseKey) {
      return NextResponse.json(
        { success: false, error: 'License key is required' },
        { status: 400 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required for license activation' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // First validate the format of the license key
    if (!validateLicenseKeyFormat(licenseKey)) {
      console.error('License key format validation failed for:', licenseKey);
      return NextResponse.json(
        { success: false, error: 'Invalid license key format' },
        { status: 400 }
      );
    }
    
    try {
      // Read the licenses database
      const data = await fs.readFile(licensesPath, 'utf8');
      const licenses: License[] = JSON.parse(data);
      
      // Find the license
      const license = licenses.find(lic => lic.key === licenseKey);
      
      if (!license) {
        return NextResponse.json(
          { success: false, error: 'License key not found' },
          { status: 404 }
        );
      }
      
      // Check if the license is already activated
      if (license.activated) {
        // If activated but with a different email, prevent reactivation
        if (license.email && license.email !== email) {
          return NextResponse.json(
            { success: false, error: 'License is already activated with a different email' },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { success: true, message: 'License is already activated', alreadyActivated: true }
        );
      }
      
      // Activate the license and store the email
      const success = await activateLicense(licenseKey, email);
      
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'License activated successfully'
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to activate license' },
          { status: 500 }
        );
      }
      
    } catch (error) {
      console.error('Error activating license:', error);
      return NextResponse.json(
        { success: false, error: 'Server error: Unable to activate license' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error activating license:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Simple email validation
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
} 