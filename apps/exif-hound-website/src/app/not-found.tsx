"use client";

import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
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
            <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold text-gray-300">404</span>
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">
          Page Not Found
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="bg-black text-white font-medium py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
          
          <Link 
            href="/support" 
            className="bg-white text-black font-medium py-3 px-8 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        <div className="mt-16 space-y-4">
          <p className="text-gray-600 font-medium">You might want to check out:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/docs" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Documentation
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/download" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Downloads
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/pricing" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Pricing
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/blog" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Blog
            </Link>
          </div>
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