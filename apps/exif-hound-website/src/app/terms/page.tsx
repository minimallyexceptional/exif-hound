import Image from "next/image";
import Link from "next/link";

export default function TermsOfService() {
  // Navigation menu items
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Documentation", hasDropdown: false, link: "/docs" },
    { label: "Support", hasDropdown: false, link: "/support" },
  ];

  // Footer navigation data
  const footerNavigation = {
    company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
    ],
    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API", href: "/api-docs" },
      { name: "Community", href: "/support#community" },
      { name: "Downloads", href: "/download" },
    ],
    support: [
      { name: "Help Center", href: "/support" },
      { name: "Contact Sales", href: "/contact" },
      { name: "Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  // Last updated date
  const lastUpdated = "April 1, 2024";

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-[90px] py-5 relative self-stretch w-full bg-white z-10">
        {/* Logo and navigation */}
        <div className="gap-[46px] flex items-center">
          <Link href="/" className="flex items-center gap-2">
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

          <nav className="h-5 gap-9 flex items-start">
            <ul className="flex space-x-9">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.link} 
                    className="relative font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
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
        <div className="flex flex-col items-start relative flex-1 grow max-w-4xl mx-auto w-full px-4">
          {/* Page Header */}
          <div className="w-full mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#212121] mb-2">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose max-w-none w-full mb-12">
            <p>
              Welcome to EXIF Hound. These Terms of Service ("Terms") govern your use of the EXIF Hound software application 
              ("Software"), website, and services (collectively, the "Services") provided by EXIF Hound, Inc. ("we," "us," or "our"). 
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, 
              please do not use our Services.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="w-full bg-gray-50 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><a href="#license" className="text-blue-600 hover:underline">License and Use Rights</a></li>
              <li><a href="#account" className="text-blue-600 hover:underline">Account Registration</a></li>
              <li><a href="#payment" className="text-blue-600 hover:underline">Payment Terms</a></li>
              <li><a href="#updates" className="text-blue-600 hover:underline">Updates and Support</a></li>
              <li><a href="#restrictions" className="text-blue-600 hover:underline">Use Restrictions</a></li>
              <li><a href="#ip" className="text-blue-600 hover:underline">Intellectual Property Rights</a></li>
              <li><a href="#privacy" className="text-blue-600 hover:underline">Privacy</a></li>
              <li><a href="#disclaimer" className="text-blue-600 hover:underline">Disclaimer of Warranties</a></li>
              <li><a href="#limitation" className="text-blue-600 hover:underline">Limitation of Liability</a></li>
              <li><a href="#indemnification" className="text-blue-600 hover:underline">Indemnification</a></li>
              <li><a href="#termination" className="text-blue-600 hover:underline">Termination</a></li>
              <li><a href="#governing" className="text-blue-600 hover:underline">Governing Law</a></li>
              <li><a href="#changes" className="text-blue-600 hover:underline">Changes to Terms</a></li>
              <li><a href="#contact" className="text-blue-600 hover:underline">Contact Information</a></li>
            </ol>
          </div>

          {/* Terms Content */}
          <div className="prose max-w-none w-full">
            <h2 id="license" className="text-2xl font-bold mt-8 mb-4">1. License and Use Rights</h2>
            <p>
              Subject to your compliance with these Terms and your payment of applicable fees, we grant you a limited, 
              non-exclusive, non-transferable, non-sublicensable license to download, install, and use the Software on devices 
              that you own or control, solely for your personal or internal business purposes.
            </p>
            <p>
              For personal and professional licenses, you may install and use the Software on up to two (2) devices. 
              For enterprise licenses, the number of permitted installations will be specified in your purchase agreement.
            </p>

            <h2 id="account" className="text-2xl font-bold mt-8 mb-4">2. Account Registration</h2>
            <p>
              To access certain features of our Services, you may need to register for an account. You agree to provide 
              accurate, current, and complete information during the registration process and to update such information 
              to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all 
              activities that occur under your account.
            </p>
            <p>
              You agree to notify us immediately of any unauthorized use of your account or any other breach of security. 
              We will not be liable for any loss or damage arising from your failure to comply with this section.
            </p>

            <h2 id="payment" className="text-2xl font-bold mt-8 mb-4">3. Payment Terms</h2>
            <p>
              EXIF Hound is offered as a one-time purchase that includes one year of updates. By purchasing the Software, 
              you agree to pay all fees applicable to your selected plan. All payments are non-refundable except as required 
              by applicable law.
            </p>
            <p>
              After your initial year of updates expires, you may purchase additional update periods at the then-current 
              rates. Prices for the Software and updates are subject to change at any time.
            </p>
            <p>
              If you believe an error has been made regarding charges to your account, you must notify us within 60 days 
              of the charge.
            </p>

            <h2 id="updates" className="text-2xl font-bold mt-8 mb-4">4. Updates and Support</h2>
            <p>
              During your update period, you will receive access to software updates, bug fixes, patches, and technical 
              support at no additional cost. After your update period expires, your existing version of the Software will 
              continue to function, but you will not receive new features, updates, or technical support unless you purchase 
              an update extension.
            </p>
            <p>
              We are not obligated to provide support for modified versions of the Software, or for issues caused by your 
              hardware, other software, or third-party services.
            </p>

            <h2 id="restrictions" className="text-2xl font-bold mt-8 mb-4">5. Use Restrictions</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reverse engineer, decompile, or disassemble the Software</li>
              <li>Remove, circumvent, disable, damage or otherwise interfere with security-related features of the Software</li>
              <li>Copy, modify, create derivative works of, publicly display, publicly perform, republish, or transmit the Software</li>
              <li>Use the Software to violate any applicable laws or regulations</li>
              <li>Sell, lease, loan, distribute, transfer, or sublicense the Software or access to it</li>
              <li>Use the Software to harm, threaten, or harass another person, organization, or EXIF Hound</li>
              <li>Use the Software for any purpose that is illegal or prohibited by these Terms</li>
              <li>Use any automated system or software to extract data from our website or Services</li>
            </ul>

            <h2 id="ip" className="text-2xl font-bold mt-8 mb-4">6. Intellectual Property Rights</h2>
            <p>
              The Software and Services, including all content, features, and functionality, are owned by EXIF Hound, Inc., 
              its licensors, or other providers and are protected by copyright, trademark, patent, trade secret, and other 
              intellectual property or proprietary rights laws.
            </p>
            <p>
              These Terms do not grant you any rights to use our trademarks, logos, domain names, or other brand features. 
              All rights not expressly granted to you are reserved by us and our licensors.
            </p>

            <h2 id="privacy" className="text-2xl font-bold mt-8 mb-4">7. Privacy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal 
              information. By using our Services, you agree to the collection and use of information in accordance with our 
              Privacy Policy.
            </p>

            <h2 id="disclaimer" className="text-2xl font-bold mt-8 mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
              NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
            </p>
            <p>
              WE DO NOT WARRANT THAT: (A) THE SERVICES WILL FUNCTION UNINTERRUPTED, SECURE, OR AVAILABLE AT ANY PARTICULAR 
              TIME OR LOCATION; (B) ANY ERRORS OR DEFECTS WILL BE CORRECTED; (C) THE SERVICES ARE FREE OF VIRUSES OR OTHER 
              HARMFUL COMPONENTS; OR (D) THE RESULTS OF USING THE SERVICES WILL MEET YOUR REQUIREMENTS.
            </p>

            <h2 id="limitation" className="text-2xl font-bold mt-8 mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL EXIF HOUND, INC., ITS AFFILIATES, 
              DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, 
              USE, DATA, OR OTHER INTANGIBLE LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO USE, THE SERVICES.
            </p>
            <p>
              IN NO EVENT WILL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, OR CAUSES OF ACTION EXCEED THE AMOUNT 
              YOU HAVE PAID US IN THE LAST SIX (6) MONTHS, OR, IF GREATER, ONE HUNDRED DOLLARS ($100).
            </p>
            <p>
              THESE LIMITATIONS OF LIABILITY APPLY REGARDLESS OF THE LEGAL THEORY ON WHICH THE CLAIM IS BASED, EVEN IF WE 
              HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>

            <h2 id="indemnification" className="text-2xl font-bold mt-8 mb-4">10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless EXIF Hound, Inc., its affiliates, licensors, and service 
              providers, and its and their respective officers, directors, employees, contractors, agents, licensors, 
              suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, 
              losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your 
              violation of these Terms or your use of the Services.
            </p>

            <h2 id="termination" className="text-2xl font-bold mt-8 mb-4">11. Termination</h2>
            <p>
              We may terminate or suspend your access to all or part of the Services immediately, without prior notice or 
              liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, 
              you may simply discontinue using the Services or contact us to delete your account.
            </p>
            <p>
              All provisions of these Terms which by their nature should survive termination shall survive termination, 
              including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of 
              liability.
            </p>

            <h2 id="governing" className="text-2xl font-bold mt-8 mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of Delaware, United States, 
              without regard to its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. 
              If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of 
              these Terms will remain in effect.
            </p>

            <h2 id="changes" className="text-2xl font-bold mt-8 mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
              material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes 
              a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Services after those revisions become effective, you agree to be bound by the 
              revised terms. If you do not agree to the new terms, please stop using the Services.
            </p>

            <h2 id="contact" className="text-2xl font-bold mt-8 mb-4">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              Email: legal@exifhound.com<br />
              Address: 123 Tech Lane, Suite 400, San Francisco, CA 94107
            </p>
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
              <Link href="#" className="relative w-6 h-6">
                <Image src="/twitter.svg" alt="Twitter" fill />
              </Link>
              <Link href="#" className="relative w-6 h-6">
                <Image src="/instagram.svg" alt="Instagram" fill />
              </Link>
              <Link href="#" className="relative w-6 h-6">
                <Image src="/facebook.svg" alt="Facebook" fill />
              </Link>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="flex flex-col md:flex-row items-start gap-[46px] flex-1 self-stretch">
            {/* Company column */}
            <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
              <div className="font-bold text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap">
                Company
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch relative">
                {footerNavigation.company.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href} 
                    className="relative self-stretch font-medium text-[#666666] text-sm tracking-[0] leading-[18px] hover:text-black"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources column */}
            <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
              <div className="font-bold text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap">
                Resources
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch relative">
                {footerNavigation.resources.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href} 
                    className="relative self-stretch font-medium text-[#666666] text-sm tracking-[0] leading-[18px] hover:text-black"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Support column */}
            <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
              <div className="font-bold text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap">
                Support
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch relative">
                {footerNavigation.support.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href} 
                    className="relative self-stretch font-medium text-[#666666] text-sm tracking-[0] leading-[18px] hover:text-black"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal column */}
            <div className="flex flex-col items-start gap-4 flex-1 self-stretch">
              <div className="font-bold text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap">
                Legal
              </div>
              <div className="flex flex-col items-start gap-3 self-stretch relative">
                {footerNavigation.legal.map((item) => (
                  <Link 
                    key={item.name}
                    href={item.href} 
                    className={`relative self-stretch font-medium ${item.name === "Terms" ? "text-black font-semibold" : "text-[#666666]"} text-sm tracking-[0] leading-[18px] hover:text-black`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 text-center w-full text-sm text-gray-500">
          © {new Date().getFullYear()} EXIF Hound. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 