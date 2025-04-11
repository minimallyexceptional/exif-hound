import Image from "next/image";
import Link from "next/link";

export default function Register() {
  // Navigation menu items data
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Support", hasDropdown: false, link: "/" },
    { label: "Contact", hasDropdown: false, link: "/" },
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
                    className="flex items-center gap-1.5 font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap"
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
            href="/download" 
            className="relative w-fit font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
          >
            Download app
          </Link>

          <div className="h-8 w-px bg-gray-200"></div>

          <Link 
            href="/login" 
            className="relative w-fit font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
          >
            Log in
          </Link>

          <Link
            href="/download"
            className="bg-black rounded-2xl px-[18px] py-2 font-medium text-white text-[15px] hover:bg-gray-800 transition-colors"
          >
            Get EXIF Hound
          </Link>
        </div>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col items-center justify-center relative flex-1 grow max-w-6xl mx-auto">
          {/* Registration Form Section */}
          <div className="w-full max-w-md mx-auto py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">Create Account</h1>
              <p className="text-lg text-gray-600">Join EXIF Hound and take control of your image metadata</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="Create a password"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long with at least one number and one special character
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all"
                    placeholder="Confirm your password"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input 
                    id="terms"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>
                  </label>
                </div>
                
                <Link 
                  href="/dashboard" 
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center mt-6 transition-colors"
                >
                  Create Account
                </Link>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
            
            {/* Social Sign-up Options */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#fcfcfc] text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="w-full flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" fill="#4285F4"/>
                    <path d="M12.966 16.26c-1.352 0-2.532-.455-3.383-1.254l-2.206 2.207c1.716 1.565 3.95 2.448 6.278 2.448 4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625h-8.327v3.451h4.792c-.314 1.53-1.31 2.708-2.896 3.316l-2.585.39z" fill="#34A853"/>
                    <path d="M5.504 11.41c-.099-.651-.151-1.323-.151-2.003 0-.68.054-1.354.151-2.004l-3.05-2.789c-.649 1.39-1.01 2.949-1.01 4.569 0 1.62.361 3.179 1.01 4.569l3.05-2.342z" fill="#FBBC05"/>
                    <path d="M9.583 7.491c1.057-.959 2.415-1.538 3.949-1.538 1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233-2.537 0-4.822 1.056-6.47 2.728l3.05 2.464z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="w-full flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" fill="#1877F2"/>
                  </svg>
                  <span>Facebook</span>
                </button>
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