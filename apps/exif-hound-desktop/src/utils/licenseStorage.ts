import { fetch } from '@tauri-apps/plugin-http';

export interface License {
  key: string;
  email: string;
  activatedAt: string;
  expiresAt: string;
  isValid: boolean;
}

const LOCAL_STORAGE_KEY = 'exif_hound_license';

// Determine if we're in development mode by checking for specific conditions
// For Tauri desktop app, we need to detect dev mode properly
// This will properly detect when running with tauri:dev command
const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// Set the API URL based on the environment
const WEBSITE_URL = isDev
  ? 'http://localhost:3000' 
  : 'https://exifhound.com';

// For troubleshooting
console.log('[LICENSE-CONFIG] Environment settings:', { 
  WEBSITE_URL, 
  isDev, 
  env: import.meta.env.DEV ? 'development' : 'production',
  hostname: window.location.hostname
});

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
    console.log('[LICENSE] License saved to localStorage successfully:', {
      key: license.key,
      email: license.email,
      expiresAt: license.expiresAt
    });
  } catch (error) {
    console.error('[LICENSE] Failed to save license to localStorage:', error);
    throw new Error('Failed to save license');
  }
}

// Read license from localStorage
export async function readLicense(): Promise<License | null> {
  try {
    const licenseData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!licenseData) {
      console.log('[LICENSE] No license found in localStorage');
      return null;
    }
    
    const license = JSON.parse(licenseData) as License;
    console.log('[LICENSE] License read from localStorage:', {
      key: license.key,
      email: license.email,
      expiresAt: license.expiresAt
    });
    return license;
  } catch (error) {
    console.error('[LICENSE] Failed to read license from localStorage:', error);
    return null;
  }
}

// Check if license exists
export async function hasLicense(): Promise<boolean> {
  const license = await readLicense();
  const result = license !== null;
  console.log('[LICENSE] hasLicense check result:', result);
  return result;
}

// Activate license by calling the website API
export async function activateLicense(licenseKey: string, email: string, signal?: AbortSignal): Promise<License> {
  try {
    console.log('[LICENSE-DEBUG] Activating license:', { 
      licenseKey, 
      email, 
      serverUrl: WEBSITE_URL,
      keyLength: licenseKey.length,
      keySegments: licenseKey.split('-'),
      keyFormat: validateLicenseKeyFormat(licenseKey) ? 'valid' : 'invalid',
      emailValid: validateEmail(email)
    });
    
    // Add special logging for the specific problem license
    if (licenseKey === 'EXHPRO-34YMY-S9VXJ-4ZRMA-8WYZ7') {
      console.log('[LICENSE-DEBUG] DETECTED PROBLEM LICENSE KEY. Adding special logs.');
    }
    
    // Validate inputs first
    if (!licenseKey) {
      throw new Error('License key is required');
    }
    
    if (!email) {
      throw new Error('Email address is required');
    }
    
    if (!validateLicenseKeyFormat(licenseKey)) {
      // Additional debug logging for format validation failure
      console.error('[LICENSE-DEBUG] Format validation failed:', { 
        licenseKey,
        isExhproPrefix: licenseKey.startsWith('EXHPRO-'),
        segments: licenseKey.split('-'),
        segmentLengths: licenseKey.split('-').map(s => s.length),
        regexPattern: /^EXHPRO-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.toString()
      });
      throw new Error('Invalid license key format');
    }
    
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Special case for our test license key
    if (licenseKey === VALID_TEST_LICENSE) {
      console.log('[LICENSE] Using test license key with email validation');
      
      // Check if the email matches the one registered for the test license
      if (email.toLowerCase() !== VALID_TEST_LICENSE_EMAIL.toLowerCase()) {
        console.error('[LICENSE] Test license email mismatch:', { 
          providedEmail: email, 
          expectedEmail: VALID_TEST_LICENSE_EMAIL 
        });
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
    
    // Make the activation API request using fetch
    const activationUrl = `${WEBSITE_URL}/api/activate-license`;
    console.log('[LICENSE] Calling license activation endpoint:', activationUrl);
    
    const activationResponse = await fetch(activationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ licenseKey, email }),
      signal: signal
    });
    
    // Log the response status for debugging
    console.log('[LICENSE] Activation response status:', activationResponse.status);
    
    // Check if response is ok before parsing JSON
    if (!activationResponse.ok) {
      console.error(`[LICENSE] Server responded with status: ${activationResponse.status}`);
      // Log more detailed information about the response
      const responseText = await activationResponse.text();
      console.error('[LICENSE] Response body:', responseText);
      
      if (activationResponse.status === 403) {
        throw new Error('This license key is registered to a different email address.');
      } else if (activationResponse.status === 404) {
        throw new Error('License key not found');
      } else {
        throw new Error(`Server error: ${activationResponse.status}`);
      }
    }
    
    // Check response type before parsing JSON
    const contentType = activationResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[LICENSE] Unexpected content type: ${contentType}`);
      throw new Error('Server returned invalid response format');
    }
    
    const activationResult = await activationResponse.json();
    console.log('[LICENSE] Activation result:', activationResult);
    
    if (!activationResult.success) {
      console.error('[LICENSE] Activation failed with error:', activationResult.error);
      throw new Error(activationResult.error || 'License activation failed');
    }
    
    // Verify the license with the API to get expiration date
    const verifyUrl = `${WEBSITE_URL}/api/verify-license`;
    console.log('[LICENSE] Calling license verification endpoint:', verifyUrl);
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ licenseKey, email }),
      signal: signal
    });
    
    // Log the response status for debugging
    console.log('[LICENSE] Verification response status:', verifyResponse.status);
    
    // Check if response is ok before parsing JSON
    if (!verifyResponse.ok) {
      console.error(`[LICENSE] Verification server responded with status: ${verifyResponse.status}`);
      // Log more detailed information about the response
      const verifyResponseText = await verifyResponse.text();
      console.error('[LICENSE] Verification response body:', verifyResponseText);
      
      if (verifyResponse.status === 403) {
        throw new Error('This license key is registered to a different email address.');
      } else if (verifyResponse.status === 404) {
        throw new Error('License key not found');
      } else {
        throw new Error(`Verification error: ${verifyResponse.status}`);
      }
    }
    
    // Check response type before parsing JSON
    const verifyContentType = verifyResponse.headers.get('content-type');
    if (!verifyContentType || !verifyContentType.includes('application/json')) {
      console.error(`[LICENSE] Unexpected verification content type: ${verifyContentType}`);
      throw new Error('Verification server returned invalid response format');
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('[LICENSE] Verification result:', verifyResult);
    
    if (!verifyResult.valid) {
      console.error('[LICENSE] Verification failed with error:', verifyResult.error);
      throw new Error(verifyResult.error || 'License validation failed');
    }
    
    // Verify the expected email matches
    if (verifyResult.email && verifyResult.email.toLowerCase() !== email.toLowerCase()) {
      console.error('[LICENSE] Email mismatch:', { 
        providedEmail: email, 
        serverEmail: verifyResult.email 
      });
      throw new Error('This license key is registered to a different email address.');
    }
    
    // Create license object
    const license: License = {
      key: licenseKey,
      email: email,
      activatedAt: new Date().toISOString(),
      expiresAt: verifyResult.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isValid: true
    };
    
    console.log('[LICENSE] License created and ready to save:', license);
    
    // Save the license
    await saveLicense(license);
    
    return license;
  } catch (error) {
    // Check if this is an abort error
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('[LICENSE] License activation request was aborted');
      throw new Error('License activation was canceled');
    }
    
    console.error('[LICENSE] License activation error:', error);
    throw error;
  }
}

// Simple email validation helper
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Verify the license is still valid
export async function verifyLicense(signal?: AbortSignal): Promise<{ isValid: boolean; errorMessage?: string }> {
  try {
    console.log('[LICENSE] Starting license verification process');
    const license = await readLicense();
    
    if (!license) {
      console.warn('[LICENSE] No license found in storage');
      return { isValid: false, errorMessage: 'No license found' };
    }
    
    console.log('[LICENSE] Found stored license:', {
      key: license.key,
      email: license.email,
      expiresAt: license.expiresAt,
      isValid: license.isValid
    });
    
    // Special case for our test license key
    if (license.key === VALID_TEST_LICENSE) {
      console.log('[LICENSE] Test license key detected, checking email match');
      
      // Verify the email matches the test license email
      if (license.email.toLowerCase() !== VALID_TEST_LICENSE_EMAIL.toLowerCase()) {
        console.error('[LICENSE] Test license email mismatch:', {
          storedEmail: license.email,
          expectedEmail: VALID_TEST_LICENSE_EMAIL
        });
        return { 
          isValid: false, 
          errorMessage: 'Test license is registered to jamesrabels@gmail.com but was activated with a different email' 
        };
      }
      
      console.log('[LICENSE] Test license validated successfully');
      return { isValid: true };
    }
    
    // Check expiration date locally first
    const expirationDate = new Date(license.expiresAt);
    const now = new Date();
    
    if (expirationDate < now) {
      console.warn('[LICENSE] License has expired:', {
        expiryDate: expirationDate,
        currentDate: now
      });
      return { isValid: false, errorMessage: 'License has expired' };
    }
    
    // Verify with the API
    try {
      const verifyUrl = `${WEBSITE_URL}/api/verify-license`;
      console.log('[LICENSE] Verifying license with API:', verifyUrl, {
        licenseKey: license.key,
        email: license.email
      });
      
      // Make sure we have an email
      if (!license.email) {
        console.error('[LICENSE] License missing email information');
        return { isValid: false, errorMessage: 'License is missing email information' };
      }
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          licenseKey: license.key,
          email: license.email // Email is required for validation
        }),
        signal: signal
      });
      
      console.log('[LICENSE] Verification response status:', response.status);
      
      // Check for specific error status codes
      if (response.status === 403) {
        // 403 usually means the license exists but email doesn't match
        console.error('[LICENSE] License email mismatch (403)');
        
        try {
          const errorText = await response.text();
          console.error('[LICENSE] 403 response details:', errorText);
        } catch (e) {
          console.error('[LICENSE] Could not read 403 response body');
        }
        
        return { 
          isValid: false, 
          errorMessage: 'Your license key is registered to a different email address' 
        };
      }
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error(`[LICENSE] Server responded with status: ${response.status}`);
        
        try {
          const errorText = await response.text();
          console.error('[LICENSE] Error response details:', errorText);
        } catch (e) {
          console.error('[LICENSE] Could not read error response body');
        }
        
        return { isValid: false, errorMessage: `Server error: ${response.status}` };
      }
      
      // Check response type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`[LICENSE] Unexpected content type: ${contentType}`);
        return { isValid: false, errorMessage: 'Server returned invalid response format' };
      }
      
      const result = await response.json();
      console.log('[LICENSE] Verification result:', result);
      
      if (!result.valid) {
        // Return the specific error message from the server
        console.error('[LICENSE] Server reported license as invalid:', result.error);
        return { isValid: false, errorMessage: result.error || 'License is invalid' };
      }
      
      // Verify the license email matches
      if (result.email && result.email.toLowerCase() !== license.email.toLowerCase()) {
        console.error('[LICENSE] Email mismatch between stored license and server:', {
          storedEmail: license.email,
          serverEmail: result.email
        });
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
        console.log('[LICENSE] Updated license expiration date:', result.expiresAt);
      }
      
      console.log('[LICENSE] License verified successfully with server');
      return { isValid: true };
    } catch (error) {
      // Don't fall back to local validation on server errors
      console.error('[LICENSE] License server unavailable or returned error:', error);
      
      // Only allow offline fallback for non-network errors or if license was previously verified online
      if (license.isValid && license.activatedAt) {
        // If the license was previously verified and is still within grace period, allow offline usage
        const activationDate = new Date(license.activatedAt);
        const now = new Date();
        const daysSinceActivation = Math.floor((now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Allow a 7-day grace period for offline usage after successful online verification
        const OFFLINE_GRACE_PERIOD_DAYS = 7;
        
        if (daysSinceActivation <= OFFLINE_GRACE_PERIOD_DAYS) {
          console.warn('[LICENSE] Server unavailable, but license is within grace period. Allowing offline usage.');
          return { 
            isValid: true, 
            errorMessage: 'License server unavailable. Using cached license (offline mode).'
          };
        }
      }
      
      console.error('[LICENSE] License verification failed due to server error and grace period expired');
      return { 
        isValid: false, 
        errorMessage: 'License verification failed. Please check your internet connection and try again.'
      };
    }
  } catch (error) {
    console.error('[LICENSE] License verification error:', error);
    return { isValid: false, errorMessage: 'Error verifying license' };
  }
} 