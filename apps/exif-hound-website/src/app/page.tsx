'use client';

import Image from "next/image";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";

export default function Home() {
  // Function to handle checkout
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.sessionId) {
        throw new Error('No session ID returned from the API');
      }
      
      // Get Stripe instance and redirect to checkout
      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error('Stripe failed to load');
      }
    } catch (error) {
      console.error('Error initiating checkout:', error);
      alert('Payment initialization failed. Please try again later.');
    }
  };

  // Feature data for mapping
  const features = [
    {
      title: "Secure Analysis",
      description:
        "Secure Analysis: Examine image metadata locally without uploading to external servers.",
      buttonText: "Learn More",
      imagePath:
        "/a-person-sitting-at-a-desk-using-a-laptop-to-analyze-image-metad.png",
    },
    {
      title: "Complete EXIF Detection",
      description:
        "Complete EXIF Detection: Identify all hidden metadata including geolocation, camera settings, and timestamps.",
      buttonText: "Explore Features",
      imagePath:
        "/a-computer-screen-showing-a-detailed-analysis-of-image-metadata-.png",
    },
    {
      title: "Batch Processing",
      description:
        "Batch Processing: Analyze multiple images simultaneously for efficient workflows.",
      buttonText: "See in Action",
      imagePath:
        "/a-computer-screen-showing-a-user-interface-with-several-images-b.png",
    },
    {
      title: "Privacy Protection",
      description:
        "Privacy Protection: Identify and remove sensitive personal information from your images.",
      buttonText: "Protect Your Privacy",
      imagePath:
        "/a-person-sitting-at-a-modern-desk--reviewing-images-on-a-compute.png",
    },
  ];

  // Benefits data for mapping
  const benefits = [
    {
      icon: "/server.svg",
      description: "Cross-Platform: Available for Windows, macOS, and Linux",
    },
    {
      icon: "/clipboard.svg",
      description:
        "Detailed Reporting: Generate comprehensive reports on your image metadata",
    },
    {
      icon: "/user.svg",
      description:
        "User-Friendly: Intuitive interface for both beginners and experts",
    },
    {
      icon: "/tools.svg",
      description: "Efficient Workflows: Streamline your metadata management",
    },
    {
      icon: "/settings.svg",
      description: "Privacy Focused: Your data stays on your device",
    },
    {
      icon: "/tools.svg",
      description: "Comprehensive Support: Get help whenever you need",
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
        </div>

        {/* Buy button */}
        <div className="gap-9 relative flex-[0_0_auto] inline-flex items-center justify-center">
          <button
            className="flex items-center gap-2.5 px-4 py-2 relative bg-[#212121] rounded-[100px] hover:bg-gray-800 transition-colors"
            onClick={handleCheckout}
          >
            <div className="relative w-fit font-medium text-white text-[15px] tracking-[0] leading-5 whitespace-nowrap">
              Buy Now - $39.95
            </div>
          </button>
        </div>
      </header>

      {/* Main content section */}
      <section className="flex items-start px-0 py-11 relative self-stretch w-full flex-auto z-[1]">
        <div className="flex flex-col items-start relative flex-1 grow">
          {/* Hero Section */}
          <div className="relative self-stretch w-full bg-[#fcfcfc]">
            <div className="flex flex-col w-full items-center gap-32 pt-36 pb-0 px-[90px] relative [background:radial-gradient(50%_50%_at_50%_-2%,rgba(252,252,252,0.7)_31%,rgba(199,199,199,0.11)_100%),linear-gradient(0deg,rgba(252,252,252,1)_0%,rgba(252,252,252,1)_100%)]">
              <div className="flex flex-col items-center justify-center gap-[90px] relative self-stretch w-full">
                <Image
                  className="absolute w-[436px] h-[436px] top-[-84px] left-[460px]"
                  alt="Subtract"
                  src="/subtract.svg"
                  width={436}
                  height={436}
                />

                <h1 className="relative self-stretch mt-[-1.00px] font-bold text-[#212121] text-[120px] text-center tracking-[-2.40px] leading-[120px]">
                  The Ultimate Metadata Analysis Tool
                </h1>
              </div>

              <div className="relative self-stretch w-full h-[500px] mb-32">
                <div className="relative w-full max-w-[1027px] h-[723px] mx-auto top-5 bg-[#fcfcfc] rounded-[20px] overflow-hidden border-[1.5px] border-solid border-[#5b5b5b33] shadow-[0px_12px_27px_#00000008,0px_50px_50px_#00000008,0px_112px_67px_#00000005,0px_199px_80px_transparent,0px_311px_87px_transparent]">
                  <div className="absolute w-[729px] h-[271px] top-[106px] left-10 bg-[#21212133] rounded-[20px] opacity-30" />
                  <div className="absolute w-[729px] h-[271px] top-[409px] left-10 bg-[#21212133] rounded-[20px] opacity-30" />
                  <div className="absolute w-[183px] h-[574px] top-[106px] left-[801px] bg-[#21212133] rounded-[20px] opacity-30" />

                  <div className="h-12 gap-1.5 absolute top-[37px] left-10 inline-flex items-center">
                    <Image
                      className="relative w-[42px] h-[42px]"
                      alt="Logomark"
                      src="/logomark.svg"
                      width={42}
                      height={42}
                    />
                    <div className="relative w-fit font-bold text-[#494949] text-[42px] tracking-[-1.68px] leading-[42px] whitespace-nowrap">
                      EXIF Hound
                    </div>
                  </div>

                  <button
                    className="absolute top-[37px] left-[816px] bg-black rounded-2xl px-4 py-2 text-white hover:bg-gray-800 transition-colors"
                    onClick={handleCheckout}
                  >
                    Buy Now - $39.95
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Sections */}
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-start justify-center gap-[46px] px-0 py-[46px] relative self-stretch w-full flex-auto bg-[#fcfcfc]"
            >
              <div className="items-center gap-[46px] self-stretch w-full flex-auto flex flex-col relative">
                <div className="flex flex-col max-w-[1260px] items-start gap-[18px] relative w-full flex-auto">
                  <h2 className="relative self-stretch mt-[-1.00px] font-bold text-[#212121] text-[64px] text-center tracking-[-1.28px] leading-[68px]">
                    {feature.title}
                  </h2>
                  <p className="relative self-stretch font-normal text-[#212121] text-2xl text-center tracking-[-0.12px] leading-8">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div
                className="relative self-stretch w-full h-[756px] rounded-[20px] border-[1.5px] border-solid border-transparent"
                style={{
                  backgroundImage: `url(${feature.imagePath})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div className="hidden" />
            </div>
          ))}

          {/* Why Choose Section */}
          <div className="flex items-start gap-[90px] px-0 py-[90px] relative self-stretch w-full flex-auto bg-[#fcfcfc]">
            <div className="flex items-start gap-[90px] px-0 py-[46px] relative flex-1 grow">
              <h2 className="relative flex-1 mt-[-1.00px] font-bold text-[#212121] text-5xl tracking-[-0.96px] leading-[52px]">
                Why Choose EXIF Hound?
              </h2>

              <div className="items-start pt-2 pb-0 px-0 flex-1 grow flex flex-col relative">
                <p className="relative self-stretch mt-[-1.00px] font-normal text-[#212121] text-2xl tracking-[-0.12px] leading-8">
                  EXIF Hound combines powerful analysis capabilities with
                  user-friendly design, making metadata management accessible to
                  everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="flex flex-col items-start gap-[30px] pt-16 pb-[90px] px-0 relative self-stretch w-full flex-auto bg-[#fcfcfc]">
            <h2 className="relative self-stretch mt-[-1.00px] font-bold text-[#212121] text-5xl tracking-[-0.96px] leading-[52px]">
              Key Benefits
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] w-full">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div
                  key={index}
                  className="h-64 bg-[#51515117] rounded-[20px] border-[1.5px] border-solid border-transparent overflow-hidden"
                >
                  <div className="flex flex-col h-full items-start gap-[30px] p-9">
          <Image
                      className="w-16 h-16"
                      alt="Feature icon"
                      src={benefit.icon}
                      width={64}
                      height={64}
                    />
                    <p className="font-normal text-[#212121] text-2xl tracking-[-0.12px] leading-8">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] w-full">
              {benefits.slice(3).map((benefit, index) => (
                <div
                  key={index}
                  className="h-64 bg-[#51515117] rounded-[20px] border-[1.5px] border-solid border-transparent overflow-hidden"
                >
                  <div className="flex flex-col h-full items-start gap-[30px] p-9">
          <Image
                      className="w-16 h-16"
                      alt="Feature icon"
                      src={benefit.icon}
                      width={64}
                      height={64}
                    />
                    <p className="font-normal text-[#212121] text-2xl tracking-[-0.12px] leading-8">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative self-stretch w-full py-[90px] bg-[#fcfcfc]">
            <div className="w-full mx-auto">
              <div className="w-full items-center gap-[46px] flex flex-col relative">
                <div className="flex flex-col max-w-[1260px] items-start gap-[18px] relative w-full flex-auto">
                  <h2 className="relative self-stretch mt-[-1.00px] font-bold text-[#212121] text-[64px] text-center tracking-[-1.28px] leading-[68px]">
                    Get started with EXIF Hound today!
                  </h2>
                  <p className="relative self-stretch font-normal text-[#212121] text-2xl text-center tracking-[-0.12px] leading-8">
                    Get the ultimate metadata analysis tool now and take
                    control of your image data.
                  </p>
                </div>

                <button
                  className="bg-black rounded-2xl px-[30px] py-3 text-white hover:bg-gray-800 transition-colors"
                  onClick={handleCheckout}
                >
                  Buy Now - $39.95
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="flex flex-col items-center gap-[30px] pt-[60px] pb-[30px] px-0 w-full bg-[#fcfcfc]">
        <div className="w-full h-[1.5px] mt-[-0.75px] bg-gray-200" />
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-2">
          <Image
              className="w-6 h-6"
              alt="Logomark"
              src="/subtract-1.svg"
              width={24}
              height={24}
            />
            <span className="font-bold text-[#494949] text-xl">EXIF HOUND</span>
          </div>
          <p className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} EXIF Hound. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
