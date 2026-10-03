import Image from "next/image";
import Link from "next/link";

export default function Blog() {
  // Navigation menu items
  const navItems = [
    { label: "Features", hasDropdown: false, link: "/" },
    { label: "Pricing", hasDropdown: false, link: "/pricing" },
    { label: "Documentation", hasDropdown: false, link: "/docs" },
    { label: "Support", hasDropdown: false, link: "/support" },
  ];

  // Blog post data
  const featuredPost = {
    id: "understanding-metadata-privacy",
    title: "Understanding Metadata Privacy: What Your Photos Are Revealing About You",
    excerpt: "Every photo you take contains hidden information that could be exposing more than you realize. Learn how to protect your privacy with EXIF Hound.",
    date: "March 28, 2024",
    author: "Emma Richards",
    authorRole: "Chief Privacy Officer",
    authorImage: "/user.svg",
    image: "/a-person-sitting-at-a-desk-using-a-laptop-to-analyze-image-metad.png",
    category: "Privacy",
    readTime: "6 min read"
  };

  const recentPosts = [
    {
      id: "batch-processing-guide",
      title: "The Ultimate Guide to Batch Processing Image Metadata",
      excerpt: "Learn how to efficiently process thousands of images and clean metadata in just a few clicks with EXIF Hound's batch processing features.",
      date: "March 15, 2024",
      author: "Michael Chen",
      authorRole: "Technical Writer",
      authorImage: "/user.svg",
      image: "/a-computer-screen-showing-a-detailed-analysis-of-image-metadata-.png",
      category: "Tutorials",
      readTime: "8 min read"
    },
    {
      id: "metadata-for-photographers",
      title: "How Professional Photographers Use Metadata to Organize Their Work",
      excerpt: "Discover the metadata workflows that top photographers use to manage their image libraries and streamline their post-processing.",
      date: "March 5, 2024",
      author: "Sarah Johnson",
      authorRole: "Photography Consultant",
      authorImage: "/user.svg",
      image: "/a-person-sitting-at-a-modern-desk--reviewing-images-on-a-compute.png",
      category: "Photography",
      readTime: "7 min read"
    },
    {
      id: "exif-data-explained",
      title: "EXIF Data Explained: The Complete Guide for Beginners",
      excerpt: "New to image metadata? This comprehensive guide breaks down everything you need to know about EXIF data in simple terms.",
      date: "February 20, 2024",
      author: "David Park",
      authorRole: "Education Lead",
      authorImage: "/user.svg",
      image: "/a-computer-screen-showing-a-user-interface-with-several-images-b.png",
      category: "Education",
      readTime: "10 min read"
    }
  ];

  // Blog categories
  const categories = [
    { name: "All", count: 24 },
    { name: "Tutorials", count: 8 },
    { name: "Privacy", count: 5 },
    { name: "Photography", count: 7 },
    { name: "Updates", count: 4 },
    { name: "Education", count: 6 }
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
        <div className="flex flex-col items-start relative flex-1 grow max-w-6xl mx-auto w-full px-4">
          {/* Page Header */}
          <div className="w-full mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#212121] mb-4">
              EXIF Hound Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Insights, tutorials, and updates on image metadata management and privacy
            </p>
          </div>

          {/* Featured Post */}
          <div className="w-full mb-16">
            <h2 className="text-2xl font-bold text-[#212121] mb-6">Featured Post</h2>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 md:h-auto">
                  <Image 
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded">{featuredPost.category}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#212121] mb-3">{featuredPost.title}</h3>
                  <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative w-10 h-10 mr-3 rounded-full overflow-hidden bg-gray-100">
                        <Image 
                          src={featuredPost.authorImage}
                          alt={featuredPost.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#212121]">{featuredPost.author}</p>
                        <p className="text-xs text-gray-500">{featuredPost.authorRole}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{featuredPost.date}</span>
                  </div>
                  
                  <Link 
                    href={`/blog/${featuredPost.id}`} 
                    className="mt-6 inline-flex items-center px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Read Article
                    <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts and Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Recent Posts */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-[#212121] mb-6">Recent Articles</h2>
              <div className="space-y-8">
                {recentPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="relative h-48 md:h-auto">
                        <Image 
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="md:col-span-2 p-6">
                        <div className="flex items-center mb-3">
                          <span className="text-xs font-medium bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded">{post.category}</span>
                          <span className="mx-2 text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{post.readTime}</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#212121] mb-2">{post.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="relative w-8 h-8 mr-2 rounded-full overflow-hidden bg-gray-100">
                              <Image 
                                src={post.authorImage}
                                alt={post.author}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm text-gray-700">{post.author}</span>
                          </div>
                          <span className="text-sm text-gray-500">{post.date}</span>
                        </div>
                        
                        <Link 
                          href={`/blog/${post.id}`} 
                          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          Read more
                          <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <button className="px-6 py-3 bg-white text-black border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Load More Articles
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Search */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-[#212121] mb-4">Search Articles</h3>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button className="absolute right-3 top-2.5">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-[#212121] mb-4">Categories</h3>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <Link 
                        href={`/blog/category/${category.name.toLowerCase()}`} 
                        className="flex justify-between items-center text-gray-700 hover:text-blue-600"
                      >
                        <span>{category.name}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">{category.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-[#212121] mb-2">Subscribe to our newsletter</h3>
                <p className="text-sm text-gray-600 mb-4">Get the latest articles and resources sent straight to your inbox.</p>
                <form className="space-y-3">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button 
                    type="submit" 
                    className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
                <p className="mt-3 text-xs text-gray-500">By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.</p>
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
                    className={`relative self-stretch font-medium ${item.name === "Blog" ? "text-black font-semibold" : "text-[#666666]"} text-sm tracking-[0] leading-[18px] hover:text-black`}
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
                    className="relative self-stretch font-medium text-[#666666] text-sm tracking-[0] leading-[18px] hover:text-black"
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