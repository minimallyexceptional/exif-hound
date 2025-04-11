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
  
  // Keep track of the component mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  
  // Track if a server check is already in progress
  const isCheckingServerRef = useRef(false);
  
  // Create a fresh AbortController
  const createFreshAbortController = () => {
    if (abortControllerRef.current) {
      // Don't abort ongoing requests when creating a new controller for a different request
      // This prevents race conditions between different fetch operations
      console.log('Existing controller found, but not aborting to prevent race conditions');
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };
  
  // Create a safe setter for server status that only updates if the component is mounted
  const setServerStatusSafe = (status: 'checking' | 'online' | 'offline' | 'error') => {
    if (isMountedRef.current) {
      setServerStatus(status);
    } else {
      console.log('Skipping server status update since component is unmounted:', status);
    }
  };
  
  const setServerStatusDetailSafe = (detail: string) => {
    if (isMountedRef.current) {
      setServerStatusDetail(detail);
    } else {
      console.log('Skipping server status detail update since component is unmounted:', detail);
    }
  };
  
  // Cleanup function for when the component unmounts
  useEffect(() => {
    // Component is now mounted
    isMountedRef.current = true;
    console.log('LicenseActivationModal mounted');
    
    return () => {
      // Use a small delay before marking as unmounted to allow in-flight requests to complete
      console.log('LicenseActivationModal unmounting, will abort requests shortly');
      
      // First mark as unmounted so no new state updates occur
      isMountedRef.current = false;
      
      // Give in-flight requests a small window to complete
      setTimeout(() => {
        if (abortControllerRef.current) {
          console.log('Aborting any pending requests after unmount');
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }, 50); // Small delay to allow any pending callbacks to finish
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
    // We need to ensure we don't start this effect if the component is already unmounted
    if (!isMountedRef.current) {
      console.log('Not starting server check because component is already unmounted');
      return;
    }
    
    const checkServerConnection = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingServerRef.current) {
        console.log('Server check already in progress, skipping');
        return;
      }
      
      isCheckingServerRef.current = true;
      console.log('Starting server connectivity check');
      
      // Create a specific abort controller just for this check
      const controller = createFreshAbortController();
      
      try {
        // Make sure we're mounted
        if (!isMountedRef.current) {
          console.log('Component not mounted, aborting server check');
          return;
        }
        
        setServerStatusSafe('checking');
        setServerStatusDetailSafe('');
        
        // We're in a desktop app, so we can't rely on window.location
        // Use development server (localhost) for testing
        const useLocalDev = import.meta.env.DEV || process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
        
        const websiteUrl = useLocalDev 
          ? 'http://localhost:3000' 
          : 'https://exifhound.com';
          
        console.log('[SERVER-CHECK] License server URL:', websiteUrl, {
          isDev: useLocalDev,
          env: import.meta.env.DEV ? 'development' : 'production',
          hostname: window.location.hostname
        });
        
        // Add request timeout to prevent hanging requests
        const timeout = setTimeout(() => {
          if (controller.signal.aborted) return;
          console.log('Health check timed out after 10 seconds');
          controller.abort();
        }, 10000); // 10 second timeout
        
        // First try the health endpoint
        try {
          const healthUrl = `${websiteUrl}/api/health`;
          console.log('Checking health endpoint:', healthUrl);
          
          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            signal: controller.signal
          });
          
          // Clear timeout since request completed
          clearTimeout(timeout);
          
          if (response.ok) {
            // Health endpoint is available and working
            console.log('Health check successful, server is online');
            
            try {
              const healthData = await response.json();
              console.log('Health check response:', healthData);
            } catch (e) {
              console.log('Could not parse health check response');
            }
            
            if (isMountedRef.current) {
              setServerStatusSafe('online');
            }
            return;
          } else {
            // Health check returned non-200 status but the server is reachable
            console.log(`Health check returned status: ${response.status}`);
            
            try {
              const errorText = await response.text();
              console.log('Health check error response:', errorText);
            } catch (e) {
              console.log('Could not read health check error response');
            }
          }
        } catch (pingError) {
          // Clear timeout
          clearTimeout(timeout);
          
          // Handle abort error separately
          if ((pingError as any)?.name === 'AbortError') {
            console.log('Health check aborted (either timeout or component unmounted)');
            return;
          }
          
          console.log('Health endpoint error:', pingError);
          console.log('Health endpoint unavailable, checking license endpoints instead');
        }
        
        // Only proceed if we're still mounted
        if (!isMountedRef.current) {
          console.log('Component not mounted after health check, aborting fallback');
          return;
        }
        
        // Health check failed, try the license verify endpoint as a fallback
        console.log('Proceeding with license endpoint fallback check');
        
        // Create a new timeout for the fallback request
        const fallbackTimeout = setTimeout(() => {
          if (controller.signal.aborted) return;
          console.log('License endpoint check timed out after 10 seconds');
          controller.abort();
        }, 10000); // 10 second timeout
        
        try {
          const verifyUrl = `${websiteUrl}/api/verify-license`;
          console.log('Checking license endpoint as fallback:', verifyUrl);
          
          // Send a POST with invalid data just to check if the endpoint exists
          // We expect a validation error (400), not a server error (500) or not found (404)
          const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify({ 
              licenseKey: 'EXHPRO-TEST1-TEST2-TEST3-TEST4', 
              email: 'test@example.com' 
            }),
            signal: controller.signal
          });
          
          // Clear timeout since request completed
          clearTimeout(fallbackTimeout);
          
          console.log('License endpoint check status:', verifyResponse.status);
          
          // Only update status if still mounted
          if (!isMountedRef.current) {
            console.log('Component not mounted after verification, skipping status update');
            return;
          }
          
          // 400-499 means validation failed but server is working (good)
          // 404 specifically means endpoint not found (bad)
          // 500+ means server error (bad)
          if (verifyResponse.status === 404) {
            setServerStatusDetailSafe('License verification endpoint not found');
            setServerStatusSafe('error');
          } else if (verifyResponse.status >= 500) {
            setServerStatusDetailSafe(`Server error: ${verifyResponse.status}`);
            setServerStatusSafe('error');
          } else {
            // For 400-499 status codes (except 404), the server is actually working correctly
            // These are just validation errors which is expected
            console.log('License server is online and responding');
            setServerStatusSafe('online');
          }
        } catch (verifyError) {
          // Clear timeout
          clearTimeout(fallbackTimeout);
          
          // Don't update if the component is unmounted
          if (!isMountedRef.current) return;
          
          // Handle abort error
          if ((verifyError as any)?.name === 'AbortError') {
            console.log('Verification check aborted (either timeout or component unmounted)');
            return;
          }
          
          // Network error or other issue with the verification endpoint
          console.error('Failed to connect to license server:', verifyError);
          setServerStatusDetailSafe('Connection error: ' + ((verifyError as Error)?.message || 'Unknown'));
          setServerStatusSafe('offline');
        }
      } catch (err) {
        // Don't update if the component is unmounted
        if (!isMountedRef.current) return;
        
        // Handle any unexpected errors in the overall check
        if ((err as any)?.name === 'AbortError') {
          console.log('Server check aborted');
          return;
        }
        
        console.error('License server connection error:', err);
        setServerStatusDetailSafe('Connection error: ' + ((err as any)?.message || 'Unknown'));
        setServerStatusSafe('offline');
      } finally {
        isCheckingServerRef.current = false;
        console.log('Server check completed');
      }
    };
    
    // Start the server check
    console.log('Scheduling server connection check');
    // Slight delay to allow component to fully mount
    setTimeout(checkServerConnection, 100);
    
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
    
    // Special debugging for the problem license key
    if (licenseKey === 'EXHPRO-34YMY-S9VXJ-4ZRMA-8WYZ7') {
      console.log('[MODAL-DEBUG] Problem license detected. Adding special checks');
      
      // Check if the license key passes the format validation
      const formatValid = validateLicenseKeyFormat(licenseKey);
      console.log('[MODAL-DEBUG] Format validation for problem license:', {
        formatValid,
        licenseKey,
        regex: /^EXHPRO-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(licenseKey),
        segments: licenseKey.split('-'),
        segmentLengths: licenseKey.split('-').map(s => s.length)
      });
    }
    
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
    
    // Create a new abort controller for this submission
    const controller = createFreshAbortController();
    
    setIsSubmitting(true);
    setError(null);
    
    // Add timeout to prevent hanging activation requests
    const activationTimeout = setTimeout(() => {
      if (controller.signal.aborted) return;
      console.log('License activation timed out after 15 seconds');
      controller.abort();
    }, 15000); // 15 second timeout for activation
    
    try {
      console.log('Submitting license activation with:', { licenseKey, email });
      await activateLicense(licenseKey, email, controller.signal);
      console.log('License activation successful');
      
      // Clear timeout since activation completed
      clearTimeout(activationTimeout);
      
      // Only proceed with success if component is still mounted
      if (isMountedRef.current) {
        onSuccess();
      }
    } catch (err: any) {
      // Clear timeout
      clearTimeout(activationTimeout);
      
      // Don't update state if the component is unmounted
      if (!isMountedRef.current) return;
      
      console.error('License activation error:', err);
      
      // Don't show error if the request was aborted
      if (err.message === 'License activation was canceled' || (err as any)?.name === 'AbortError') {
        console.log('Activation canceled or timed out, skipping error message');
        return;
      }
      
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
        setServerStatusSafe('error');
        setServerStatusDetailSafe('License activation endpoint not found');
      } else if (errorMessage.includes('Server error: 400')) {
        setError('Invalid request (400). Please check your license key and email format.');
      } else if (errorMessage.includes('Server error: 500')) {
        setError('Server error (500). Please try again later or contact support.');
        setServerStatusSafe('error');
        setServerStatusDetailSafe('Server error (500) during activation');
      } else if (errorMessage.includes('timed out')) {
        setError('Connection timed out. Please check your internet connection and try again.');
        setServerStatusSafe('offline');
      } else {
        setError(errorMessage || 'Failed to activate license. Please check your license key and try again.');
      }
    } finally {
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
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
              <span className="flex items-center gap-1 text-yellow-400 text-xs [data-theme='light']:text-yellow-600">
                <Loader className="w-3 h-3 animate-spin" />
                Checking
              </span>
            )}
            {serverStatus === 'online' && (
              <span className="flex items-center gap-1 text-green-400 text-xs [data-theme='light']:text-green-600">
                <Check className="w-3 h-3" />
                Online
              </span>
            )}
            {serverStatus === 'error' && (
              <span className="flex items-center gap-1 text-orange-400 text-xs [data-theme='light']:text-orange-600" title={serverStatusDetail}>
                <AlertCircle className="w-3 h-3" />
                Error
              </span>
            )}
            {serverStatus === 'offline' && (
              <span className="flex items-center gap-1 text-red-400 text-xs [data-theme='light']:text-red-600">
                <AlertCircle className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-200 dark:text-red-200 [data-theme='light']:bg-red-100 [data-theme='light']:border-red-300 [data-theme='light']:text-red-800">
            {error}
          </div>
        )}

        {(serverStatus === 'offline' || serverStatus === 'error') && (
          <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-200 dark:text-yellow-200 [data-theme='light']:bg-amber-100 [data-theme='light']:border-amber-300 [data-theme='light']:text-amber-800 flex items-start gap-2">
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
          <div className="p-3 bg-blue-900/30 border border-blue-700 rounded text-blue-200 dark:text-blue-200 [data-theme='light']:bg-blue-100 [data-theme='light']:border-blue-300 [data-theme='light']:text-blue-800 flex items-start gap-2">
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
              className="w-full p-2 bg-app-gray border border-app-gray-light rounded text-app-white [data-theme='light']:border-gray-300"
              disabled={isSubmitting}
            />
            {formatError && (
              <p className="mt-1 text-sm text-red-400 [data-theme='light']:text-red-600">{formatError}</p>
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
              className="w-full p-2 bg-app-gray border border-app-gray-light rounded text-app-white [data-theme='light']:border-gray-300"
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
        
        <p className="text-xs text-app-accent-dim mt-4 [data-theme='light']:text-gray-600">
          Need help? Contact support at support@exifhound.com or visit our website at exifhound.com/support
        </p>
      </div>
    </Modal>
  );
} 