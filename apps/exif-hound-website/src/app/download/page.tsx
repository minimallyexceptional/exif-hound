import Image from "next/image";
import Link from "next/link";

export default function DownloadPage() {
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
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4 text-[#212121]">Download EXIF Hound</h1>
          <p className="text-lg text-gray-600 mb-8">
            Choose the version that matches your operating system:
          </p>

          <div className="grid gap-6 mb-8">
            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <h2 className="text-xl font-semibold mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17l3-2.94m0 0l3 2.94M9 17l3-2.94M12 2l-3 2.94m3-2.94l3 2.94M12 2v13.17"></path>
                </svg>
                Windows
              </h2>
              <p className="text-sm text-gray-500 mb-4">For Windows 10 and Windows 11</p>
              <a 
                href="#" 
                className="bg-blue-600 text-white py-2 px-6 rounded-xl inline-block hover:bg-blue-700 transition-colors"
              >
                Download for Windows (64-bit)
              </a>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <h2 className="text-xl font-semibold mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v16M19 3v16M12 3v16M5 8h7M12 8h7M5 12h7M12 12h7M5 16h7M12 16h7"></path>
                </svg>
                macOS
              </h2>
              <p className="text-sm text-gray-500 mb-4">For macOS 11 Big Sur and newer</p>
              <a 
                href="#" 
                className="bg-blue-600 text-white py-2 px-6 rounded-xl inline-block hover:bg-blue-700 transition-colors"
              >
                Download for macOS
              </a>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <h2 className="text-xl font-semibold mb-2 flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v18M15 3v18M3 9h18M3 15h18"></path>
                </svg>
                Linux
              </h2>
              <p className="text-sm text-gray-500 mb-4">AppImage, DEB, and RPM packages</p>
              <a 
                href="#" 
                className="bg-blue-600 text-white py-2 px-6 rounded-xl inline-block hover:bg-blue-700 transition-colors"
              >
                Download for Linux
              </a>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Already downloaded?</h2>
            <Link
              href="/activate"
              className="border border-gray-300 py-2 px-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Activate Your License
            </Link>
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