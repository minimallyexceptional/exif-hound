"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Image 
            className="w-7 h-7" 
            alt="Logomark" 
            src="/logomark-1.svg" 
            width={28}
            height={28}
          />
          <div className="w-fit font-bold text-[#494949] text-[28px] tracking-[-1.12px] leading-7 whitespace-nowrap">
            EXIF Hound
          </div>
        </Link>

        <div className="flex justify-center mb-8">
          <div className="relative h-48 w-48">
            <div className="absolute inset-0 bg-red-50 rounded-full flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-24 h-24 text-red-200"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">
          Something Went Wrong
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          We apologize for the inconvenience. An unexpected error occurred while processing your request.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-black text-white font-medium py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
          
          <Link 
            href="/support" 
            className="bg-white text-black font-medium py-3 px-8 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Report Problem
          </Link>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200 text-left">
          <h3 className="font-bold text-lg mb-2">Error Information</h3>
          <p className="text-gray-700 mb-1">Error ID: {error.digest}</p>
          <p className="text-gray-700">Message: {error.message || "Unknown error"}</p>
        </div>

        <div className="mt-12">
          <p className="text-gray-600">
            You can try refreshing the page or navigating back to the{" "}
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              home page
            </Link>.
          </p>
        </div>
      </div>

      <footer className="absolute bottom-0 w-full py-6 text-center border-t border-gray-200">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} EXIF Hound. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 