import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { readLicense, verifyLicense, License } from '../utils/licenseManager';

interface LicenseContextType {
  license: License | null;
  isLicensed: boolean;
  isLoading: boolean;
  error: string | null;
  refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType>({
  license: null,
  isLicensed: false,
  isLoading: true,
  error: null,
  refreshLicense: async () => {},
});

export const useLicenseContext = () => useContext(LicenseContext);

interface LicenseProviderProps {
  children: ReactNode;
}

export function LicenseProvider({ children }: LicenseProviderProps) {
  console.log('🔑 LicenseProvider initialized');
  
  const [license, setLicense] = useState<License | null>(null);
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLicense = async () => {
    try {
      console.log('[LicenseContext] Starting license loading...');
      setIsLoading(true);
      setError(null);
      
      // Read the license from disk
      const savedLicense = await readLicense();
      console.log('[LicenseContext] License read result:', savedLicense);
      setLicense(savedLicense);
      
      if (!savedLicense) {
        console.log('[LicenseContext] No license found, setting isLicensed to false');
        setIsLicensed(false);
        return;
      }
      
      // Verify the license is valid
      console.log('[LicenseContext] Verifying license...');
      const { isValid, errorMessage } = await verifyLicense();
      console.log('[LicenseContext] License verification result:', { isValid, errorMessage });
      
      if (!isValid) {
        console.log('[LicenseContext] License is invalid:', errorMessage);
        setIsLicensed(false);
        setError(errorMessage || 'License is not valid');
        return;
      }
      
      console.log('[LicenseContext] License is valid, setting isLicensed to true');
      setIsLicensed(true);
    } catch (err: any) {
      console.error('[LicenseContext] Error loading license:', err);
      setError(err.message || 'Failed to load license');
      setIsLicensed(false);
    } finally {
      setIsLoading(false);
      console.log('[LicenseContext] License loading completed');
    }
  };
  
  // Load license when component mounts
  useEffect(() => {
    loadLicense();
  }, []);
  
  // Function to refresh license status
  const refreshLicense = async () => {
    await loadLicense();
  };

  const value = {
    license,
    isLicensed,
    isLoading,
    error,
    refreshLicense,
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
} 