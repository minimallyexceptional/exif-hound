import Image from "next/image";
import Link from "next/link";

export default function Pricing() {
  // Navigation menu items data
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Documentation", hasDropdown: false, link: "/docs" },
    { label: "Download", hasDropdown: false, link: "/download" },
    { label: "Blog", hasDropdown: false, link: "/blog" },
    { label: "Support", hasDropdown: false, link: "/support" },
  ];

  // Pricing plans data
  const pricingPlans = [
    {
      name: "Basic",
      price: "$29",
      period: "one-time payment",
      description: "Basic metadata analysis for personal use",
      features: [
        "Analyze unlimited images",
        "View basic EXIF data",
        "Remove metadata from your photos",
        "Community support",
        "1 year of updates"
      ],
      buttonText: "Buy Now",
      isPopular: false,
      backgroundColor: "bg-white",
      borderColor: "border-gray-200",
    },
    {
      name: "Pro",
      price: "$79",
      period: "one-time payment",
      description: "Advanced capabilities for professional photographers",
      features: [
        "All Basic features",
        "Access to all metadata fields",
        "Batch processing",
        "Privacy risk detection",
        "Export reports in multiple formats",
        "Priority email support",
        "1 year of updates"
      ],
      buttonText: "Buy Now",
      isPopular: true,
      backgroundColor: "bg-black",
      borderColor: "border-black",
      textColor: "text-white"
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "one-time payment",
      description: "Custom solutions for business needs",
      features: [
        "All Pro features",
        "API access",
        "Custom integrations",
        "Advanced reporting",
        "Dedicated support",
        "Custom deployment options",
        "1 year of updates with priority fixes"
      ],
      buttonText: "Buy Now",
      isPopular: false,
      backgroundColor: "bg-white",
      borderColor: "border-gray-200",
    }
  ];

  // FAQ data
  const faqItems = [
    {
      question: "How does the one-time purchase work?",
      answer: "EXIF Hound is a one-time purchase that includes 1 year of updates. You buy the software once and own that version forever. For 12 months, you'll receive all new features and improvements at no additional cost."
    },
    {
      question: "What happens after my 1 year of updates ends?",
      answer: "After your update period ends, your software will continue to work without any limitations. If you want to receive new features and updates beyond the first year, you can purchase an update extension at a discounted rate."
    },
    {
      question: "Can I use EXIF Hound on multiple computers?",
      answer: "Yes, your license allows you to install EXIF Hound on up to 2 computers that you own. Enterprise licenses come with options for multiple installations based on your team size."
    },
    {
      question: "Do you offer educational or non-profit discounts?",
      answer: "Yes, we offer special pricing for educational institutions and non-profit organizations. Please contact our sales team for more information."
    }
  ];

  // Footer navigation data
  const footerNavigation = [
    {
      title: "Company",
      links: [
        { label: "About Us", link: "/" },
        { label: "Careers", link: "/" },
        { label: "Press", link: "/" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", link: "/blog" },
        { label: "Documentation", link: "/docs" },
        { label: "Download", link: "/download" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Support", link: "/support" },
        { label: "FAQs", link: "/support#faqs" },
        { label: "Community", link: "/support#community" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", link: "/privacy" },
        { label: "Terms of Service", link: "/terms" },
      ],
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
                    className={`flex items-center gap-1.5 font-medium ${item.link === '/pricing' ? 'text-black underline underline-offset-4' : 'text-[#212121]'} text-[15px] tracking-[0] leading-5 whitespace-nowrap`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right side with login and signup */}
        <div className="gap-9 relative flex-[0_0_auto] inline-flex items-center">
          <Link 
            href="/dashboard" 
            className="relative font-medium text-[#212121] text-[15px] tracking-[0] leading-5 whitespace-nowrap hover:text-black"
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
        <div className="flex flex-col items-start relative flex-1 grow">
          {/* Hero Section */}
          <div className="relative self-stretch w-full bg-[#fcfcfc]">
            <div className="flex flex-col w-full items-center pt-28 pb-20 px-[90px] relative [background:radial-gradient(50%_50%_at_50%_-2%,rgba(252,252,252,0.7)_31%,rgba(199,199,199,0.11)_100%),linear-gradient(0deg,rgba(252,252,252,1)_0%,rgba(252,252,252,1)_100%)]">
              <div className="flex flex-col items-center justify-center gap-6 relative self-stretch w-full max-w-4xl mx-auto">
                <h1 className="relative self-stretch font-bold text-[#212121] text-7xl md:text-8xl text-center tracking-[-2.00px] leading-tight">
                  Simple, Transparent Pricing
                </h1>
                <p className="relative self-stretch font-normal text-[#212121] text-xl md:text-2xl text-center tracking-[-0.12px] leading-8 max-w-3xl mx-auto">
                  Choose the plan that's right for you and take control of your image metadata
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Plans Section */}
          <div className="flex flex-col items-center gap-20 py-20 relative self-stretch w-full bg-[#fcfcfc]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto px-4">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`flex flex-col p-8 rounded-3xl border-2 relative ${plan.backgroundColor} ${plan.borderColor} h-full transition-all hover:shadow-lg`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 right-8 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className={`text-2xl font-bold mb-1 ${plan.textColor || 'text-[#212121]'}`}>{plan.name}</h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className={`text-4xl font-bold ${plan.textColor || 'text-[#212121]'}`}>{plan.price}</span>
                      <span className={`text-lg ${plan.textColor ? plan.textColor + '/70' : 'text-gray-500'}`}>{plan.period}</span>
                    </div>
                    <p className={`text-base ${plan.textColor ? plan.textColor + '/90' : 'text-gray-600'}`}>{plan.description}</p>
                  </div>
                  
                  <div className="flex-grow">
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <svg 
                            className={`w-5 h-5 mt-0.5 ${plan.textColor || 'text-blue-500'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span className={`${plan.textColor || 'text-[#212121]'}`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link 
                    href={`/checkout?plan=${plan.name.toLowerCase()}`}
                    className={`w-full py-3 rounded-2xl font-medium text-[15px] transition-colors text-center block ${
                      plan.isPopular 
                        ? 'bg-white text-black border border-black hover:bg-gray-100' 
                        : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Section */}
          <div className="w-full py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12 text-[#212121]">Compare Plans</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-6 text-left text-lg font-bold text-[#212121]">Features</th>
                      {pricingPlans.map((plan, i) => (
                        <th key={i} className="py-4 px-6 text-center text-lg font-bold text-[#212121]">{plan.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">Images</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Unlimited</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Unlimited</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Unlimited</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">Metadata fields</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Basic</td>
                      <td className="py-4 px-6 text-center text-[#212121]">All</td>
                      <td className="py-4 px-6 text-center text-[#212121]">All + Custom</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">Batch processing</td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">API access</td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </td>
                      <td className="py-4 px-6 text-center text-[#212121]">
                        <svg className="w-5 h-5 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">Support</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Community</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Priority Email</td>
                      <td className="py-4 px-6 text-center text-[#212121]">Dedicated</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-6 text-[#212121]">Updates</td>
                      <td className="py-4 px-6 text-center text-[#212121]">1 year</td>
                      <td className="py-4 px-6 text-center text-[#212121]">1 year</td>
                      <td className="py-4 px-6 text-center text-[#212121]">1 year priority</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="w-full py-20 bg-[#fcfcfc]">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12 text-[#212121]">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-2xl p-6 transition-all hover:shadow-md">
                    <h3 className="text-xl font-bold text-[#212121] mb-2">{item.question}</h3>
                    <p className="text-[#212121]">{item.answer}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <p className="text-[#212121] text-lg mb-4">Still have questions?</p>
                <button className="bg-black text-white rounded-2xl px-8 py-3 font-medium">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative self-stretch w-full py-[90px] bg-[#fcfcfc]">
            <div className="w-full max-w-4xl mx-auto px-4">
              <div className="w-full items-center gap-[46px] flex flex-col relative">
                <div className="flex flex-col items-start gap-[18px] relative w-full flex-auto">
                  <h2 className="relative self-stretch mt-[-1.00px] font-bold text-[#212121] text-5xl md:text-6xl text-center tracking-[-1.28px] leading-[68px]">
                    Ready to get started?
                  </h2>
                  <p className="relative self-stretch font-normal text-[#212121] text-xl md:text-2xl text-center tracking-[-0.12px] leading-8">
                    Purchase once, own forever, and enjoy a full year of updates and improvements.
                  </p>
                </div>

                <Link
                  href="/checkout?plan=basic"
                  className="bg-black rounded-2xl px-[30px] py-3 text-white hover:bg-gray-800 transition-colors"
                >
                  Get EXIF Hound Today
                </Link>
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
                <Link
                  key={linkIndex}
                  href={link.link}
                  className="self-stretch font-medium text-[#2121219e] text-[15px] leading-5 cursor-pointer hover:text-[#212121]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
} 