import { fetch } from '@tauri-apps/plugin-http';

export interface License {
  key: string;
  email: string;
  activatedAt: string;
  expiresAt: string;
  isValid: boolean;
}

const LOCAL_STORAGE_KEY = 'exif_hound_license';

// Force development mode for Tauri dev
const isDev = true; // Always use localhost in Tauri dev mode

// Set the API URL based on the environment
const WEBSITE_URL = isDev
  ? 'http://localhost:3000' 
  : 'https://exifhound.com';

console.log('License API URL:', WEBSITE_URL);

// Hardcoded valid license for testing
export const VALID_TEST_LICENSE = 'EXHPRO-PLF9W-DZJH6-8FFX8-9NTYY';
// The email associated with the test license
export const VALID_TEST_LICENSE_EMAIL = 'jamesrabels@gmail.com';

// Function to validate license key format
export function validateLicenseKeyFormat(key: string): boolean {
  // Format should be: EXHPRO-XXXXX-XXXXX-XXXXX-XXXXX
  const regex = /^EXHPRO-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  const isValid = regex.test(key);
  
  // Debug log
  console.log('License key format validation:', { 
    key, 
    isValid, 
    pattern: regex.toString(),
    length: key.length,
    segments: key.split('-').length,
    segmentLengths: key.split('-').map(s => s.length)
  });
  
  return isValid;
}

// Save license to localStorage
export async function saveLicense(license: License): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(license));
    console.log('License saved to localStorage successfully');
  } catch (error) {
    console.error('Failed to save license to localStorage:', error);
    throw new Error('Failed to save license');
  }
}

// Read license from localStorage
export async function readLicense(): Promise<License | null> {
  try {
    const licenseData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!licenseData) {
      return null;
    }
    
    return JSON.parse(licenseData) as License;
  } catch (error) {
    console.error('Failed to read license from localStorage:', error);
    return null;
  }
}

// Check if license exists
export async function hasLicense(): Promise<boolean> {
  const license = await readLicense();
  return license !== null;
}

// Activate license by calling the website API
export async function activateLicense(licenseKey: string, email: string): Promise<License> {
  try {
    console.log('Activating license with key:', licenseKey);
    
    // Special case for our test license key
    if (licenseKey === VALID_TEST_LICENSE) {
      console.log('Using test license key with email validation');
      
      // Check if the email matches the one registered for the test license
      if (email.toLowerCase() !== VALID_TEST_LICENSE_EMAIL.toLowerCase()) {
        throw new Error('This license key is registered to a different email address.');
      }
      
      // Create license object with test data
      const license: License = {
        key: licenseKey,
        email: email,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        isValid: true
      };
      
      // Save the license
      await saveLicense(license);
      
      return license;
    }
    
    // Make the activation API request using Tauri HTTP client
    const activationUrl = `${WEBSITE_URL}/api/activate-license`;
    console.log('Calling license activation endpoint:', activationUrl);
    console.log('License activation request payload:', { licenseKey, email });
    
    const activationResponse = await fetch(activationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey, email }),
    });
    
    // Check if response is ok before parsing JSON
    if (!activationResponse.ok) {
      console.error(`Server responded with status: ${activationResponse.status}`);
      // Log more detailed information about the response
      const responseText = await activationResponse.text();
      console.error('Response body:', responseText);
      throw new Error(`Server error: ${activationResponse.status}`);
    }
    
    // Check response type before parsing JSON
    const contentType = activationResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Unexpected content type: ${contentType}`);
      throw new Error('Server returned invalid response format');
    }
    
    const activationResult = await activationResponse.json();
    
    if (!activationResult.success) {
      throw new Error(activationResult.error || 'License activation failed');
    }
    
    // Verify the license with the API to get expiration date
    const verifyUrl = `${WEBSITE_URL}/api/verify-license`;
    console.log('Calling license verification endpoint:', verifyUrl);
    console.log('License verification request payload:', { licenseKey, email });
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey, email }),
    });
    
    // Check if response is ok before parsing JSON
    if (!verifyResponse.ok) {
      console.error(`Verification server responded with status: ${verifyResponse.status}`);
      // Log more detailed information about the response
      const verifyResponseText = await verifyResponse.text();
      console.error('Verification response body:', verifyResponseText);
      throw new Error(`Verification error: ${verifyResponse.status}`);
    }
    
    // Check response type before parsing JSON
    const verifyContentType = verifyResponse.headers.get('content-type');
    if (!verifyContentType || !verifyContentType.includes('application/json')) {
      console.error(`Unexpected verification content type: ${verifyContentType}`);
      throw new Error('Verification server returned invalid response format');
    }
    
    const verifyResult = await verifyResponse.json();
    
    if (!verifyResult.valid) {
      throw new Error(verifyResult.error || 'License validation failed');
    }
    
    // Create license object
    const license: License = {
      key: licenseKey,
      email: email,
      activatedAt: new Date().toISOString(),
      expiresAt: verifyResult.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isValid: true
    };
    
    // Save the license
    await saveLicense(license);
    
    return license;
  } catch (error) {
    console.error('License activation error:', error);
    throw error;
  }
}

// Verify the license is still valid
export async function verifyLicense(): Promise<{ isValid: boolean; errorMessage?: string }> {
  try {
    const license = await readLicense();
    
    if (!license) {
      return { isValid: false, errorMessage: 'No license found' };
    }
    
    // Special case for our test license key
    if (license.key === VALID_TEST_LICENSE) {
      console.log('Test license key detected, checking email match');
      
      // Verify the email matches the test license email
      if (license.email.toLowerCase() !== VALID_TEST_LICENSE_EMAIL.toLowerCase()) {
        return { 
          isValid: false, 
          errorMessage: 'Test license is registered to jamesrabels@gmail.com but was activated with a different email' 
        };
      }
      
      return { isValid: true };
    }
    
    // Check expiration date locally first
    const expirationDate = new Date(license.expiresAt);
    const now = new Date();
    
    if (expirationDate < now) {
      return { isValid: false, errorMessage: 'License has expired' };
    }
    
    // Verify with the API
    try {
      const verifyUrl = `${WEBSITE_URL}/api/verify-license`;
      console.log('Verifying license with API:', verifyUrl);
      
      // Make sure we have an email
      if (!license.email) {
        return { isValid: false, errorMessage: 'License is missing email information' };
      }
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          licenseKey: license.key,
          email: license.email // Email is required for validation
        }),
      });
      
      // Check for specific error status codes
      if (response.status === 403) {
        // 403 usually means the license exists but email doesn't match
        return { 
          isValid: false, 
          errorMessage: 'Your license key is registered to a different email address' 
        };
      }
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error(`Server responded with status: ${response.status}`);
        return { isValid: false, errorMessage: `Server error: ${response.status}` };
      }
      
      // Check response type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Unexpected content type: ${contentType}`);
        return { isValid: false, errorMessage: 'Server returned invalid response format' };
      }
      
      const result = await response.json();
      
      if (!result.valid) {
        // Return the specific error message from the server
        return { isValid: false, errorMessage: result.error || 'License is invalid' };
      }
      
      // Verify the license email matches
      if (result.email && result.email.toLowerCase() !== license.email.toLowerCase()) {
        console.error('Email mismatch:', { stored: license.email, server: result.email });
        return { 
          isValid: false, 
          errorMessage: 'License email mismatch. Please reactivate with the correct email.'
        };
      }
      
      // Update expiration date if it has changed
      if (result.expiresAt && result.expiresAt !== license.expiresAt) {
        const updatedLicense = {
          ...license,
          expiresAt: result.expiresAt
        };
        await saveLicense(updatedLicense);
      }
      
      return { isValid: true };
    } catch (error) {
      // If server is unavailable, fall back to local validation
      console.warn('License server error, using cached license:', error);
      return { isValid: true };
    }
  } catch (error) {
    console.error('License verification error:', error);
    return { isValid: false, errorMessage: 'Error verifying license' };
  }
} 