import Image from "next/image";
import Link from "next/link";

export default function Support() {
  // Navigation menu items
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Documentation", hasDropdown: false, link: "/docs" },
    { label: "Support", hasDropdown: false, link: "/support" },
  ];

  // Common questions
  const commonQuestions = [
    {
      question: "How do I install EXIF Hound?",
      answer: "Installation instructions can be found in our documentation. We provide installers for Windows, macOS, and Linux operating systems.",
      link: "/docs#installation"
    },
    {
      question: "How do I activate my license?",
      answer: "After purchasing, you'll receive a license key via email. Enter this key in the activation dialog when first launching the application.",
      link: "/docs#activation"
    },
    {
      question: "Can I install EXIF Hound on multiple computers?",
      answer: "Yes, your license allows installation on up to 2 computers that you own. Enterprise licenses include options for multiple installations.",
      link: "/pricing"
    },
    {
      question: "How do I update to the latest version?",
      answer: "EXIF Hound checks for updates automatically. You can also download the latest version from your account dashboard.",
      link: "/dashboard"
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
                    className={`flex items-center gap-1.5 font-medium ${item.link === '/support' ? 'text-black underline underline-offset-4' : 'text-[#212121]'} text-[15px] tracking-[0] leading-5 whitespace-nowrap`}
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
          {/* Support Header */}
          <div className="w-full mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">Support Center</h1>
            <p className="text-xl text-[#212121] max-w-3xl mx-auto">
              Need help with EXIF Hound? Browse our resources below or contact our support team.
            </p>
          </div>

          {/* Support Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
            {/* Documentation Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#212121] mb-2">Documentation</h3>
              <p className="text-gray-600 mb-6">
                Explore our detailed documentation for guides, tutorials, and technical information.
              </p>
              <Link
                href="/docs"
                className="mt-auto text-blue-600 font-medium hover:text-blue-800"
              >
                View Documentation →
              </Link>
            </div>

            {/* Community Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#212121] mb-2">Community Forum</h3>
              <p className="text-gray-600 mb-6">
                Join discussions with other users, share tips, and get help from the community.
              </p>
              <Link
                href="/community"
                className="mt-auto text-purple-600 font-medium hover:text-purple-800"
              >
                Join the Community →
              </Link>
            </div>

            {/* Contact Card */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#212121] mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-6">
                Get immediate help from our support team via live chat during business hours.
              </p>
              <button className="mt-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Start Chat
              </button>
            </div>
          </div>

          {/* Common Questions */}
          <div className="w-full mb-16">
            <h2 className="text-3xl font-bold text-[#212121] mb-8 text-center">Common Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonQuestions.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-[#212121] mb-3">{item.question}</h3>
                  <p className="text-gray-600 mb-4">{item.answer}</p>
                  <Link
                    href={item.link}
                    className="text-blue-600 font-medium hover:text-blue-800"
                  >
                    Learn more →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-3xl font-bold text-[#212121] mb-6">Contact Support</h2>
            <p className="text-gray-600 mb-8">
              Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
            </p>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What's your question about?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your issue in detail"
                ></textarea>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    I agree to the <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
                  </label>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </form>
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