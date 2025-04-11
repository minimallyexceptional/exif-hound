'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// Separate component to handle the license data fetching
function LicenseContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id') || null;
  const [license, setLicense] = useState<null | { key: string, productId: string }>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchLicense() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/license?session_id=${sessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          setLicense(data);
        } else {
          console.error('Failed to fetch license:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching license:', error);
      } finally {
        setLoading(false);
      }
    }

    // Only run in browser, not during prerendering
    if (typeof window !== 'undefined') {
      fetchLicense();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const copyToClipboard = async () => {
    if (license?.key) {
      try {
        await navigator.clipboard.writeText(license.key);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy license key:', err);
      }
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-xl mb-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Your EXIF Hound Pro License</h2>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      ) : license ? (
        <>
          <div className="flex justify-between items-center p-4 bg-white rounded-lg mb-3 border border-gray-300 shadow-sm">
            <span className="font-medium text-gray-900">License Key:</span>
            <code className="bg-gray-100 px-4 py-2 rounded font-mono text-sm break-all text-gray-900 border border-gray-300">
              {license.key}
            </code>
          </div>
          <div className="flex justify-end mb-2">
            <button 
              className="text-blue-700 hover:text-blue-900 text-sm font-medium flex items-center"
              onClick={copyToClipboard}
            >
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-gray-700 font-medium">
            Please save this license key. You'll need it to activate your software.
          </p>
        </>
      ) : (
        <div className="p-4 border border-yellow-400 bg-yellow-50 rounded text-sm">
          <p className="text-yellow-900 font-medium">
            License information not available. Check your email for license details or contact support.
          </p>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function LicenseLoading() {
  return (
    <div className="bg-gray-100 p-6 rounded-xl mb-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Your EXIF Hound Pro License</h2>
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    </div>
  );
}

// Main page component
export default function Success() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <header className="flex items-center justify-between px-11 py-5 border-b border-gray-200 bg-white shadow-sm">
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
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900">Thank You for Your Purchase!</h1>
          <p className="text-lg text-gray-800 mb-8">
            Your order has been successfully processed. You'll receive a confirmation email shortly.
          </p>

          <Suspense fallback={<LicenseLoading />}>
            <LicenseContent />
          </Suspense>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Next Steps</h2>
            <ol className="text-left space-y-4">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-medium text-sm">1</div>
                <div>
                  <p className="font-medium text-gray-900">Download EXIF Hound</p>
                  <p className="text-sm text-gray-700">Get the latest version for your operating system</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-medium text-sm">2</div>
                <div>
                  <p className="font-medium text-gray-900">Install the software</p>
                  <p className="text-sm text-gray-700">Follow the installation instructions</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-medium text-sm">3</div>
                <div>
                  <p className="font-medium text-gray-900">Activate with your license key</p>
                  <p className="text-sm text-gray-700">Enter the license key when prompted during first launch</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/download"
              className="bg-green-600 text-white py-3 px-8 rounded-xl hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              Download Now
            </Link>
            <Link
              href="/"
              className="border border-gray-300 py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors text-gray-800 font-medium"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-700">
          &copy; {new Date().getFullYear()} EXIF Hound. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 