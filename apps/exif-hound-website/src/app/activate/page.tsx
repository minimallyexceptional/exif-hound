'use client';

import { useState } from 'react';
import Image from "next/image";
import Link from "next/link";

export default function ActivatePage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | { valid: boolean; message: string }>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setVerificationResult({
        valid: false,
        message: 'Please enter a license key'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();
      
      if (data.valid) {
        setVerificationResult({
          valid: true,
          message: `License is valid. Expires on: ${new Date(data.expiresAt).toLocaleDateString()}`
        });
      } else {
        setVerificationResult({
          valid: false,
          message: data.error || 'Invalid license key'
        });
      }
    } catch (error) {
      setVerificationResult({
        valid: false,
        message: 'An error occurred during verification. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
      <header className="flex items-center justify-between px-11 py-5 border-b border-gray-200">
        <Link href="/" className="inline-flex h-8 items-center gap-1">
          <Image
            className="w-7 h-7"
            alt="Logo"
            src="/subtract-1.svg"
            width={28}
            height={28}
          />
          <div className="font-bold text-[#494949] text-[28px] leading-7">
            EXIF HOUND
          </div>
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-center text-[#212121]">Activate License</h1>
          <p className="text-gray-600 mb-8 text-center">
            Enter your license key to verify and activate your EXIF Hound license.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 mb-1">
                License Key
              </label>
              <input
                type="text"
                id="licenseKey"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="EXH-XXXXX-XXXXX-XXXXX-XXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isVerifying ? 'Verifying...' : 'Verify License'}
            </button>

            {verificationResult && (
              <div 
                className={`p-4 rounded-lg ${
                  verificationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <p className={`text-sm ${verificationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {verificationResult.message}
                </p>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p>Don't have a license key?</p>
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                Purchase EXIF Hound
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          &copy; {new Date().getFullYear()} EXIF Hound. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 