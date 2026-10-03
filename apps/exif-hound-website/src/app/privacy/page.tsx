import Image from "next/image";
import Link from "next/link";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Introduction */}
          <div className="prose max-w-none w-full mb-12">
            <p>
              EXIF Hound, Inc. ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you use our EXIF Hound software application 
              ("Software"), website, and services (collectively, the "Services").
            </p>
            <p>
              Please read this Privacy Policy carefully. By using our Services, you consent to the collection, use, and disclosure 
              of your information as described in this Privacy Policy. If you do not agree with our policies and practices, do not 
              use our Services.
            </p>
          </div>

          {/* Table of Contents */}
          <div className="w-full bg-gray-50 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><a href="#information-collect" className="text-blue-600 hover:underline">Information We Collect</a></li>
              <li><a href="#how-we-use" className="text-blue-600 hover:underline">How We Use Your Information</a></li>
              <li><a href="#sharing" className="text-blue-600 hover:underline">Sharing Your Information</a></li>
              <li><a href="#data-security" className="text-blue-600 hover:underline">Data Security</a></li>
              <li><a href="#data-retention" className="text-blue-600 hover:underline">Data Retention</a></li>
              <li><a href="#your-choices" className="text-blue-600 hover:underline">Your Choices and Rights</a></li>
              <li><a href="#children" className="text-blue-600 hover:underline">Children's Privacy</a></li>
              <li><a href="#international" className="text-blue-600 hover:underline">International Data Transfers</a></li>
              <li><a href="#updates" className="text-blue-600 hover:underline">Updates to This Privacy Policy</a></li>
              <li><a href="#contact-us" className="text-blue-600 hover:underline">Contact Us</a></li>
            </ol>
          </div>

          {/* Privacy Policy Content */}
          <div className="prose max-w-none w-full">
            <h2 id="information-collect" className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-bold mt-6 mb-3">Information You Provide to Us</h3>
            <p>We may collect the following types of information when you provide it to us:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, and password.</li>
              <li><strong>Profile Information:</strong> You may provide additional information such as job title, company name, and profile picture.</li>
              <li><strong>Payment Information:</strong> When you make a purchase, our payment processor collects payment card details and billing information.</li>
              <li><strong>Communications:</strong> We collect information you provide when you contact us for support or communicate with us.</li>
              <li><strong>Survey Responses:</strong> We may collect information you provide in response to surveys or feedback requests.</li>
              <li><strong>User Content:</strong> Any other content you upload to our Services.</li>
            </ul>

            <h3 className="text-xl font-bold mt-6 mb-3">Information We Collect Automatically</h3>
            <p>When you use our Services, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Information about how you use our Services, including features you use, time spent, and actions taken.</li>
              <li><strong>Device Information:</strong> Information about your device, including device type, operating system, browser type, IP address, and unique device identifiers.</li>
              <li><strong>Log Data:</strong> Information logged when you use our Services, including access times, pages viewed, and system activity.</li>
              <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies and similar technologies. For more information, please see our Cookie Policy.</li>
              <li><strong>Location Information:</strong> General location information based on your IP address.</li>
            </ul>

            <h3 className="text-xl font-bold mt-6 mb-3">Information About Your Images</h3>
            <p>
              EXIF Hound is designed to analyze metadata in your image files. When you use our Software to analyze your images:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>By default, all image processing happens locally on your device. The actual image content and metadata are not transmitted to our servers unless you explicitly choose to use our cloud-based features.</li>
              <li>If you use our cloud-based features (such as cloud backup or sharing), the images and their metadata will be transmitted to our servers over a secure connection.</li>
              <li>We do not use the content of your images for any purpose other than providing the Services you request.</li>
            </ul>

            <h2 id="how-we-use" className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and send related information, including confirmations, invoices, and service notifications</li>
              <li>Respond to your comments, questions, and requests, and provide customer service</li>
              <li>Send technical notices, updates, security alerts, and support and administrative messages</li>
              <li>Communicate with you about products, services, offers, promotions, and events, and provide other news or information about us</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect our rights and property</li>
              <li>Personalize your experience and deliver content and product features relevant to your interests</li>
              <li>Develop new products and services</li>
            </ul>

            <h2 id="sharing" className="text-2xl font-bold mt-8 mb-4">3. Sharing Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With Service Providers:</strong> We share information with third-party vendors, consultants, and other service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting, and customer service.</li>
              <li><strong>For Business Transfers:</strong> We may share information in connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose information if we believe it is necessary to comply with applicable laws, regulations, legal processes, or governmental requests, or to protect our rights, privacy, safety, or property.</li>
              <li><strong>With Your Consent:</strong> We may share information with third parties when you direct us to do so or otherwise consent to the sharing.</li>
            </ul>

            <p>
              We do not sell your personal information to third parties.
            </p>

            <h2 id="data-security" className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
            <p>
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, 
              disclosure, alteration, and destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypting data in transit using TLS/SSL protocols</li>
              <li>Encrypting sensitive data at rest</li>
              <li>Implementing access controls and authentication requirements</li>
              <li>Regularly reviewing and updating our security practices</li>
            </ul>
            <p>
              While we implement safeguards designed to protect your information, no security system is impenetrable. Due to the 
              inherent nature of the Internet, we cannot guarantee that data is 100% secure.
            </p>

            <h2 id="data-retention" className="text-2xl font-bold mt-8 mb-4">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the 
              appropriate retention period, we consider:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The amount, nature, and sensitivity of the personal information</li>
              <li>The potential risk of harm from unauthorized use or disclosure</li>
              <li>The purposes for which we process your data</li>
              <li>Whether we can achieve those purposes through other means</li>
              <li>Applicable legal requirements</li>
            </ul>
            <p>
              When we no longer need your personal information, we will securely delete or anonymize it.
            </p>

            <h2 id="your-choices" className="text-2xl font-bold mt-8 mb-4">6. Your Choices and Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> You may request access to the personal information we hold about you.</li>
              <li><strong>Correction:</strong> You may request that we correct inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> You may request that we delete your personal information in certain circumstances.</li>
              <li><strong>Data Portability:</strong> You may request a copy of the information you have provided to us in a structured, commonly used, and machine-readable format.</li>
              <li><strong>Objection and Restriction:</strong> You may object to our processing of your information or ask us to restrict processing in certain circumstances.</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section below. 
              Please note that some of these rights may be limited in certain circumstances, as required or permitted by applicable law.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">Account Information</h3>
            <p>
              You can update, correct, or delete your account information at any time by logging into your account and modifying 
              your profile. If you wish to delete your account, please contact us.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3">Marketing Communications</h3>
            <p>
              You can opt out of receiving promotional emails from us by following the instructions in those emails. If you opt out, 
              we may still send you non-promotional communications, such as those about your account or our ongoing business relations.
            </p>

            <h2 id="children" className="text-2xl font-bold mt-8 mb-4">7. Children's Privacy</h2>
            <p>
              Our Services are not directed to children under the age of 16, and we do not knowingly collect personal information 
              from children under 16. If you are a parent or guardian and believe we have collected information from your child, 
              please contact us immediately. If we learn that we have collected personal information from a child under 16 without 
              verification of parental consent, we will take steps to remove that information.
            </p>

            <h2 id="international" className="text-2xl font-bold mt-8 mb-4">8. International Data Transfers</h2>
            <p>
              We are based in the United States and may process your information in the United States and other countries. 
              These countries may have data protection laws that are different from the laws of your country. By using our Services, 
              you consent to the transfer of your information to countries outside your country of residence, including the United States.
            </p>
            <p>
              When we transfer personal information outside of your jurisdiction, we implement appropriate safeguards to ensure 
              that your information remains protected in accordance with this Privacy Policy and applicable law.
            </p>

            <h2 id="updates" className="text-2xl font-bold mt-8 mb-4">9. Updates to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email, 
              through the Software, or by posting a notice on our website prior to the changes becoming effective. We encourage 
              you to review the Privacy Policy whenever you access our Services to stay informed about our information practices.
            </p>

            <h2 id="contact-us" className="text-2xl font-bold mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p>
              Email: privacy@exifhound.com<br />
              Address: EXIF Hound, Inc.<br />
              123 Tech Lane, Suite 400<br />
              San Francisco, CA 94107
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
                    className={`relative self-stretch font-medium ${item.name === "Privacy" ? "text-black font-semibold" : "text-[#666666]"} text-sm tracking-[0] leading-[18px] hover:text-black`}
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