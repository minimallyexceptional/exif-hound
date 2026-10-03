import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  // Mock user data - in a real app this would come from a backend
  const userData = {
    name: "James Abels",
    email: "jamesrabels@gmail.com",
    plan: "Pro",
    purchaseDate: "April 1, 2023",
    updatesUntil: "April 1, 2024",
    licenseKey: "EXIF-HOUND-XXXX-XXXX-XXXX",
  };

  // Mock available downloads
  const availableDownloads = [
    {
      name: "EXIF Hound v2.5.1",
      platform: "Windows",
      size: "34.2 MB",
      date: "March 15, 2023",
      icon: "/windows.svg",
    },
    {
      name: "EXIF Hound v2.5.1",
      platform: "macOS",
      size: "38.5 MB",
      date: "March 15, 2023",
      icon: "/apple.svg",
    },
    {
      name: "EXIF Hound v2.5.1",
      platform: "Linux",
      size: "31.8 MB",
      date: "March 15, 2023",
      icon: "/linux.svg",
    },
    {
      name: "EXIF Hound v2.3.5",
      platform: "Windows",
      size: "33.8 MB",
      date: "January 12, 2023",
      icon: "/windows.svg",
    },
    {
      name: "EXIF Hound v2.3.5",
      platform: "macOS",
      size: "37.2 MB",
      date: "January 12, 2023",
      icon: "/apple.svg",
    },
  ];

  // Recent activity feed
  const activityFeed = [
    {
      action: "Downloaded EXIF Hound v2.5.1 for Windows",
      date: "3 days ago",
    },
    {
      action: "Received update to v2.5.1",
      date: "14 days ago",
    },
    {
      action: "Logged in from new device",
      date: "21 days ago",
    },
    {
      action: "Activated Pro license",
      date: "30 days ago",
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
              <li>
                <Link 
                  href="/" 
                  className="flex items-center gap-1.5 font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="flex items-center gap-1.5 font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="/docs" 
                  className="flex items-center gap-1.5 font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  href="/support" 
                  className="flex items-center gap-1.5 font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap"
                >
                  Support
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="gap-9 relative flex-[0_0_auto] inline-flex items-center">
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
              {userData.name.charAt(0)}
            </div>
            <span className="font-medium text-[#212121] text-[15px]">
              {userData.name}
            </span>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>

          <button className="font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black">
            Log out
          </button>
        </div>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col items-start gap-12 relative flex-1 grow max-w-6xl mx-auto w-full">
          {/* Dashboard Header */}
          <div className="w-full flex justify-between items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#212121]">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Last login: 2 days ago</span>
              <Link
                href="/settings"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
            {/* License Information Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#212121]">License Information</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Updates Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Plan</p>
                  <p className="text-lg font-medium text-[#212121]">{userData.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
                  <p className="text-lg font-medium text-[#212121]">{userData.purchaseDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Updates Until</p>
                  <p className="text-lg font-medium text-[#212121]">{userData.updatesUntil}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-lg font-medium text-[#212121]">{userData.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">License Key</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-[#212121] text-sm flex-1">
                      {userData.licenseKey}
                    </code>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <svg
                        width="20"
                        height="20"
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

              <div className="flex gap-4 mt-8">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  Extend Updates
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Request Invoice
                </button>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#212121] mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {activityFeed.map((activity, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="text-[#212121] font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                ))}
              </div>
              
              <Link
                href="/activity"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium mt-6"
              >
                View all activity →
              </Link>
            </div>
          </div>

          {/* Downloads Section */}
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#212121] mb-6">Download EXIF Hound</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Version</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Platform</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Size</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableDownloads.map((download, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Image
                            src={download.icon}
                            alt={`${download.platform} icon`}
                            width={24}
                            height={24}
                          />
                          <span className="font-medium text-[#212121]">{download.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#212121]">{download.platform}</td>
                      <td className="py-4 px-4 text-[#212121]">{download.size}</td>
                      <td className="py-4 px-4 text-[#212121]">{download.date}</td>
                      <td className="py-4 px-4 text-right">
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors">
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <Link
                href="/downloads/all"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View all versions →
              </Link>
              
              <div className="text-sm text-gray-500">
                Need an older version? <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact support</Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <Link
              href="/docs"
              className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 mb-4"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
              <h3 className="font-bold text-[#212121] mb-1">Documentation</h3>
              <p className="text-sm text-center text-gray-600">Learn how to use EXIF Hound effectively</p>
            </Link>
            
            <Link
              href="/support"
              className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 mb-4"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3 className="font-bold text-[#212121] mb-1">Support</h3>
              <p className="text-sm text-center text-gray-600">Get help with any issues or questions</p>
            </Link>
            
            <Link
              href="/support#community"
              className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600 mb-4"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3 className="font-bold text-[#212121] mb-1">Community</h3>
              <p className="text-sm text-center text-gray-600">Join discussions with other users</p>
            </Link>
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