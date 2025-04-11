import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutSuccess() {
  return (
    <div className="flex flex-col min-h-[900px] items-start px-11 py-0 relative bg-[#fcfcfc]">
      <header className="items-center justify-between px-0 py-[18px] z-[2] flex relative self-stretch w-full flex-[0_0_auto] bg-[#fcfcfc]">
        {/* Logo */}
        <div className="inline-flex items-center gap-[46px] relative flex-[0_0_auto]">
          <Link href="/" className="inline-flex h-8 items-center gap-1 relative flex-[0_0_auto]">
            <Image
              className="relative w-[29px] h-[29px]"
              alt="Subtract"
              src="/subtract-1.svg"
              width={29}
              height={29}
            />
            <div className="relative w-fit font-bold text-[#494949] text-[28px] tracking-[-1.12px] leading-7 whitespace-nowrap">
              EXIF HOUND
            </div>
          </Link>
        </div>

        {/* Checkout Steps */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-200 text-green-600 flex items-center justify-center text-sm font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span className="ml-2 text-[#212121] font-medium">Checkout</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span className="ml-2 text-[#212121] font-medium">Confirmation</span>
          </div>
        </div>

        {/* Help Button */}
        <Link 
          href="/support" 
          className="relative font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
        >
          Need Help?
        </Link>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-16">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          {/* Success Message */}
          <h1 className="text-4xl font-bold text-[#212121] mb-4 text-center">Thank You for Your Purchase!</h1>
          <p className="text-xl text-[#212121] mb-10 text-center max-w-2xl">
            Your order has been successfully processed. A confirmation email with your license key and receipt has been sent to your email address.
          </p>
          
          {/* Order Details */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full mb-12">
            <h2 className="text-xl font-bold text-[#212121] mb-6">Order Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b border-gray-100">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium text-[#212121]">EH-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-gray-100">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-[#212121]">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-gray-100">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-[#212121]">Credit Card</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-gray-100">
                <span className="text-gray-600">License Key:</span>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1 bg-gray-100 rounded-lg font-mono text-[#212121] text-sm">
                    EXIF-HOUND-XXXX-XXXX-XXXX
                  </code>
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Next Steps */}
          <h2 className="text-2xl font-bold text-[#212121] mb-6 text-center">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#212121] mb-2">Download EXIF Hound</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Download and install EXIF Hound on your computer to start using it right away.
              </p>
              <Link
                href="/dashboard"
                className="mt-auto text-blue-600 font-medium hover:text-blue-800"
              >
                Go to Downloads →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#212121] mb-2">Read Documentation</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Learn how to use EXIF Hound with our comprehensive documentation and guides.
              </p>
              <Link
                href="/docs"
                className="mt-auto text-purple-600 font-medium hover:text-purple-800"
              >
                View Documentation →
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#212121] mb-2">Join Community</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Connect with other EXIF Hound users, share tips, and get help when needed.
              </p>
              <Link
                href="/community"
                className="mt-auto text-green-600 font-medium hover:text-green-800"
              >
                Join Community →
              </Link>
            </div>
          </div>
          
          {/* Return to Dashboard Button */}
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
} 