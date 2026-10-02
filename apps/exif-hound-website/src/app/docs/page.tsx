import Image from "next/image";
import Link from "next/link";

export default function Documentation() {
  // Navigation menu items
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Documentation", hasDropdown: false, link: "/docs" },
    { label: "Support", hasDropdown: false, link: "/support" },
  ];

  // Documentation sections
  const docSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      items: [
        { id: "installation", title: "Installation", active: true },
        { id: "quick-start", title: "Quick Start Guide", active: false },
        { id: "user-interface", title: "User Interface", active: false },
      ]
    },
    {
      id: "features",
      title: "Features",
      items: [
        { id: "metadata-analysis", title: "Metadata Analysis", active: false },
        { id: "batch-processing", title: "Batch Processing", active: false },
        { id: "export-options", title: "Export Options", active: false },
        { id: "privacy-protection", title: "Privacy Protection", active: false },
      ]
    },
    {
      id: "advanced",
      title: "Advanced Usage",
      items: [
        { id: "command-line", title: "Command Line Interface", active: false },
        { id: "automation", title: "Automation", active: false },
        { id: "api", title: "API Reference", active: false },
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      items: [
        { id: "common-issues", title: "Common Issues", active: false },
        { id: "faq", title: "FAQ", active: false },
      ]
    },
  ];

  // Footer navigation data
  const footerNavigation = [
    {
      title: "Company",
      links: ["About Us", "Careers", "Press"],
    },
    {
      title: "Resources",
      links: ["Blog", "Documentation", "API"],
    },
    {
      title: "Support",
      links: ["Contact Support", "FAQs", "Community"],
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service"],
    },
  ];

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

          {/* Navigation Menu */}
          <nav>
            <ul className="items-start gap-9 inline-flex relative flex-[0_0_auto]">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.link} 
                    className={`flex items-center gap-1.5 font-medium ${item.link === '/docs' ? 'text-black underline underline-offset-4' : 'text-[#212121]'} text-[15px] tracking-[0] leading-5 whitespace-nowrap`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="gap-9 relative flex-[0_0_auto] inline-flex items-center">
          <Link 
            href="/dashboard" 
            className="relative font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
          >
            Log in
          </Link>

          <Link
            href="/register"
            className="bg-black rounded-2xl px-[18px] py-2 font-medium text-white text-[15px] hover:bg-gray-800 transition-colors"
          >
            Get EXIF Hound
          </Link>
        </div>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col items-start relative flex-1 grow max-w-6xl mx-auto w-full">
          {/* Documentation Header */}
          <div className="w-full mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">Documentation</h1>
            <p className="text-xl text-[#212121]">
              Learn how to use EXIF Hound to analyze and manage image metadata effectively.
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full mb-10">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg 
                  className="w-5 h-5 text-gray-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input 
                type="search" 
                className="w-full p-4 pl-12 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Search documentation..."
              />
            </div>
          </div>

          {/* Documentation Content */}
          <div className="flex flex-col md:flex-row w-full gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="sticky top-8">
                <nav className="space-y-8">
                  {docSections.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <h5 className="font-bold text-[#212121] text-sm uppercase tracking-wider">{section.title}</h5>
                      <ul className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item.id}>
                            <a 
                              href={`#${item.id}`} 
                              className={`block py-1 ${item.active ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}`}
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <div id="installation" className="space-y-6">
                <h2 className="text-3xl font-bold text-[#212121]">Installation</h2>
                
                <div className="prose max-w-none">
                  <p>
                    EXIF Hound is available for Windows, macOS, and Linux operating systems. 
                    Follow the instructions below to install EXIF Hound on your system.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">System Requirements</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Windows:</strong> Windows 10 or later (64-bit)</li>
                    <li><strong>macOS:</strong> macOS 10.14 (Mojave) or later</li>
                    <li><strong>Linux:</strong> Ubuntu 18.04 or later, Debian 10 or later</li>
                    <li><strong>RAM:</strong> 4GB minimum, 8GB recommended</li>
                    <li><strong>Disk Space:</strong> 200MB for installation</li>
                  </ul>

                  <h3 className="text-xl font-bold mt-8 mb-4">Windows Installation</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Download the installer from your dashboard or the download page.</li>
                    <li>Run the <code className="bg-gray-100 px-2 py-1 rounded">EXIF-Hound-Setup.exe</code> file.</li>
                    <li>Follow the installation wizard instructions.</li>
                    <li>After installation, launch EXIF Hound from the Start menu or desktop shortcut.</li>
                  </ol>

                  <h3 className="text-xl font-bold mt-8 mb-4">macOS Installation</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Download the macOS installer from your dashboard or the download page.</li>
                    <li>Open the <code className="bg-gray-100 px-2 py-1 rounded">EXIF-Hound.dmg</code> file.</li>
                    <li>Drag the EXIF Hound application to your Applications folder.</li>
                    <li>If prompted about security settings, go to System Preferences → Security & Privacy and click "Open Anyway".</li>
                  </ol>

                  <h3 className="text-xl font-bold mt-8 mb-4">Linux Installation</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Download the appropriate package for your distribution from your dashboard or the download page.</li>
                    <li>For Debian/Ubuntu, install with:</li>
                  </ol>

                  <div className="bg-gray-900 text-white p-4 rounded-lg my-4 overflow-x-auto">
                    <code>sudo dpkg -i exif-hound_2.5.1_amd64.deb</code>
                  </div>

                  <p>
                    For other Linux distributions, follow the instructions provided in the README file 
                    included with the download.
                  </p>

                  <h3 className="text-xl font-bold mt-8 mb-4">First Launch and Activation</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Launch EXIF Hound after installation.</li>
                    <li>You'll be prompted to enter your license key or sign in with your account credentials.</li>
                    <li>Enter the license key provided in your purchase confirmation email or dashboard.</li>
                    <li>Your software will be activated and ready to use.</li>
                  </ol>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          Your license allows installation on up to 2 computers that you own. If you need to install 
                          on additional machines, consider the Enterprise license or contact our support team.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mt-8 mb-4">Troubleshooting Installation</h3>
                  <p>
                    If you encounter any issues during installation, please check the 
                    <a href="#common-issues" className="text-blue-600 hover:text-blue-800"> Common Issues </a>
                    section or contact our <a href="/support" className="text-blue-600 hover:text-blue-800">support team</a>.
                  </p>

                  <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
                    <div></div>
                    <a 
                      href="#quick-start" 
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Next: Quick Start Guide
                      <svg className="ml-2 -mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-start gap-[30px] pt-[90px] pb-[46px] px-0 w-full bg-[#fcfcfc]">
        <div className="w-full h-[1.5px] mt-[-0.75px] bg-gray-200" />

        <div className="flex items-start gap-[46px] w-full">
          {/* Logo and social icons column */}
          <div className="flex flex-col items-start justify-between flex-1 self-stretch">
            <div className="h-8 gap-1 inline-flex items-center">
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
            </div>

            <div className="inline-flex items-start gap-3">
              <svg 
                className="w-6 h-6 text-gray-700" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              <svg 
                className="w-6 h-6 text-gray-700" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <svg 
                className="w-6 h-6 text-gray-700" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </div>
          </div>

          {/* Navigation columns */}
          {footerNavigation.map((category, index) => (
            <div
              key={index}
              className="flex flex-col w-[200px] items-start justify-center gap-2"
            >
              <div className="self-stretch mt-[-1.00px] font-medium text-[#212121] text-[15px] leading-5">
                {category.title}
              </div>

              {category.links.map((link, linkIndex) => (
                <div
                  key={linkIndex}
                  className="self-stretch font-medium text-[#2121219e] text-[15px] leading-5 cursor-pointer hover:text-[#212121]"
                >
                  {link}
                </div>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
} 