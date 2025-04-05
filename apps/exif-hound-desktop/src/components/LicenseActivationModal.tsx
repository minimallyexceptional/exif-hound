import { useState, useEffect, useRef } from 'react';
import { activateLicense, validateLicenseKeyFormat, VALID_TEST_LICENSE, VALID_TEST_LICENSE_EMAIL } from '../utils/licenseStorage';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { AlertCircle, Loader, Server, Check, Info } from 'lucide-react';
import { fetch } from '@tauri-apps/plugin-http';

interface LicenseActivationModalProps {
  onSuccess: () => void;
}

export function LicenseActivationModal({ onSuccess }: LicenseActivationModalProps) {
  console.log('📝 LicenseActivationModal rendering');
  
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [serverStatusDetail, setServerStatusDetail] = useState<string>('');
  const [showTestLicenseHint, setShowTestLicenseHint] = useState(false);
  
  // Use AbortController for fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Create a new AbortController on mount
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      console.log('LicenseActivationModal unmounting, aborting pending requests');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Only show the test license hint if the user manually enters the test key
    if (licenseKey === VALID_TEST_LICENSE) {
      setShowTestLicenseHint(true);
    } else {
      setShowTestLicenseHint(false);
    }
  }, [licenseKey]);

  // Check server connectivity when component mounts
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        setServerStatus('checking');
        setServerStatusDetail('');
        // Force development mode for tauri:dev
        const isDev = true; // Always use localhost in Tauri dev mode
        
        const websiteUrl = isDev 
          ? 'http://localhost:3000' 
          : 'https://exifhound.com';
          
        console.log('Checking license server at:', websiteUrl);
        
        // Using a health check endpoint or a minimal request to check connectivity
        try {
          // First try a simple ping endpoint if available
          const healthUrl = `${websiteUrl}/api/health`;
          console.log('Checking health endpoint:', healthUrl);
          
          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            signal: abortControllerRef.current?.signal // Add abort signal
          });
          
          if (response.ok) {
            console.log('License server is online (health check)');
            try {
              const responseBody = await response.text();
              console.log('Health check response:', responseBody);
            } catch (e) {
              console.log('Could not read health check response body');
            }
            setServerStatus('online');
            return;
          } else {
            console.log('Health check returned status:', response.status);
            // 404 on health check is not a fatal error - the endpoint might not exist
            if (response.status === 404) {
              console.log('Health endpoint not found (404) - this is normal if endpoint is not implemented');
            } else {
              // Other error codes might indicate API issues
              setServerStatusDetail(`Health check error: ${response.status}`);
              setServerStatus('error');
              return;
            }
          }
        } catch (pingError) {
          // Check if the request was aborted due to component unmounting
          if ((pingError as any)?.name === 'AbortError') {
            console.log('Health check aborted');
            return;
          }
          
          console.log('Health check failed with error:', pingError);
          console.log('Trying license verification endpoint');
          // Health check failed, try the license endpoint as fallback
        }
        
        // Fallback to the verify license endpoint with dummy data
        const verifyUrl = `${websiteUrl}/api/verify-license`;
        console.log('Checking verify-license endpoint as fallback:', verifyUrl);
        
        try {
          const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            // Send dummy test data just to check connectivity
            body: JSON.stringify({ 
              licenseKey: 'EXHPRO-TEST1-TEST2-TEST3-TEST4', 
              email: 'test@example.com' 
            }),
            signal: abortControllerRef.current?.signal // Add abort signal
          });
          
          // If we get 400/403/404, the server is online but the API has validation issues
          // This is expected, so we mark the server as online
          console.log('Server responded with status:', verifyResponse.status);
          
          if (verifyResponse.status >= 400 && verifyResponse.status < 500) {
            console.log('API returned error code, but server is reachable');
            // 404 is special - it means the endpoint doesn't exist
            if (verifyResponse.status === 404) {
              setServerStatusDetail('Verify endpoint not found (404)');
              setServerStatus('error');
            } else {
              // 400/403 etc are validation errors - server is working correctly
              setServerStatus('online');
            }
          } else if (verifyResponse.status >= 500) {
            // 500 level errors indicate server issues
            setServerStatusDetail(`Server error: ${verifyResponse.status}`);
            setServerStatus('error');
          } else {
            // 200 level responses mean all is well
            console.log('Server check successful');
            setServerStatus('online');
          }
        } catch (verifyError) {
          console.error('Verify endpoint error:', verifyError);
          setServerStatusDetail('Connection error: ' + ((verifyError as Error)?.message || 'Unknown'));
          setServerStatus('error');
        }
        
      } catch (err) {
        // Check if the request was aborted due to component unmounting
        if ((err as any)?.name === 'AbortError') {
          console.log('Verify endpoint check aborted');
          return;
        }
        
        console.error('License server connection error:', err);
        setServerStatusDetail('Connection error: ' + ((err as any)?.message || 'Unknown'));
        setServerStatus('offline');
      }
    };
    
    // Start the server check
    const checkPromise = checkServerConnection();
    
    // Cleanup function
    return () => {
      console.log('Server check effect cleanup');
      // AbortController will abort any pending requests
    };
  }, []);

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setLicenseKey(value);
    
    // Format validation
    if (value && !validateLicenseKeyFormat(value)) {
      setFormatError('License key format should be EXHPRO-XXXXX-XXXXX-XXXXX-XXXXX');
    } else {
      setFormatError(null);
    }
  };

  // Function to format the license key as the user types
  const formatLicenseKey = (key: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = key.replace(/[^A-Z0-9]/g, '');
    
    // Special handling for the EXHPRO prefix
    if (cleaned.length <= 6) {
      // Just return the characters if less than or equal to the prefix length
      return cleaned;
    }
    
    // Extract the prefix (first 6 characters)
    const prefix = cleaned.slice(0, 6);
    
    // Extract the rest and split into chunks of 5
    const remainder = cleaned.slice(6);
    const chunks = [prefix];
    
    for (let i = 0; i < remainder.length; i += 5) {
      chunks.push(remainder.slice(i, i + 5));
    }
    
    return chunks.join('-');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!licenseKey || !email) {
      setError('Please enter both license key and email.');
      return;
    }
    
    if (!validateLicenseKeyFormat(licenseKey)) {
      setError('Invalid license key format.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting license activation with:', { licenseKey, email });
      await activateLicense(licenseKey, email);
      console.log('License activation successful');
      onSuccess();
    } catch (err: any) {
      console.error('License activation error:', err);
      
      // Specific error handling for email mismatch
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('not registered to this email')) {
        setError('This license key is registered to a different email address.');
      } else if (errorMessage.includes('License key not found')) {
        setError('License key not found. Please check your license key and try again.');
      } else if (errorMessage.includes('License key expired')) {
        setError('This license key has expired. Please renew your license.');
      } else if (errorMessage.includes('Server error: 404')) {
        setError('License activation server not found (404). Please check your internet connection or try again later.');
      } else if (errorMessage.includes('Server error: 400')) {
        setError('Invalid request (400). Please check your license key and email format.');
      } else if (errorMessage.includes('Server error: 500')) {
        setError('Server error (500). Please try again later or contact support.');
      } else {
        setError(errorMessage || 'Failed to activate license. Please check your license key and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Simple email validation
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <Modal title="Activate Exif Hound Pro" size="sm" onClose={() => {/* No-op: user must activate license */}}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-app-accent-dim">
            Enter your license key and email to activate the application.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-app-accent-dim">Server:</span>
            {serverStatus === 'checking' && (
              <span className="flex items-center gap-1 text-yellow-400 text-xs">
                <Loader className="w-3 h-3 animate-spin" />
                Checking
              </span>
            )}
            {serverStatus === 'online' && (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <Check className="w-3 h-3" />
                Online
              </span>
            )}
            {serverStatus === 'error' && (
              <span className="flex items-center gap-1 text-orange-400 text-xs" title={serverStatusDetail}>
                <AlertCircle className="w-3 h-3" />
                Error
              </span>
            )}
            {serverStatus === 'offline' && (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        {(serverStatus === 'offline' || serverStatus === 'error') && (
          <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-200 flex items-start gap-2">
            <Server className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">License server is {serverStatus === 'offline' ? 'offline' : 'experiencing issues'}</p>
              {serverStatusDetail && (
                <p className="text-xs mb-1">{serverStatusDetail}</p>
              )}
              <p className="text-sm">
                You can use the test license key <strong>{VALID_TEST_LICENSE}</strong> with 
                email <strong>{VALID_TEST_LICENSE_EMAIL}</strong> for demonstration.
              </p>
            </div>
          </div>
        )}
        
        {showTestLicenseHint && serverStatus === 'online' && (
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded text-blue-200 flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Test License Detected</p>
              <p className="text-sm">
                This test license key is registered to <strong>{VALID_TEST_LICENSE_EMAIL}</strong>. 
                Please use this email to activate.
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="licenseKey" className="block text-sm font-medium text-app-white mb-1">
              License Key
            </label>
            <input
              type="text"
              id="licenseKey"
              placeholder="EXHPRO-XXXXX-XXXXX-XXXXX-XXXXX"
              value={formatLicenseKey(licenseKey)}
              onChange={handleLicenseKeyChange}
              className="w-full p-2 bg-app-gray border border-app-gray-light rounded text-app-white"
              disabled={isSubmitting}
            />
            {formatError && (
              <p className="mt-1 text-sm text-red-400">{formatError}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-app-white mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-2 bg-app-gray border border-app-gray-light rounded text-app-white"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              variant="primary"
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !!formatError}
            >
              {isSubmitting ? 'Activating...' : 'Activate License'}
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-app-accent-dim mt-4">
          Need help? Contact support at support@exifhound.com or visit our website at exifhound.com/support
        </p>
      </div>
    </Modal>
  );
} 