import Link from 'next/link';
import { getRecentBlogPosts, getFeaturedLoans, getMediaUrl } from '@/lib/data';
import HeroSection from '@/components/HeroSection';

export default async function Home() {
  const [recentPosts, featuredLoans] = await Promise.all([
    getRecentBlogPosts(3),
    getFeaturedLoans(),
  ]);

  // Default loans for fallback if CMS is empty
  const defaultLoans = [
    {
      title: 'Conventional Loans',
      description: 'Traditional financing with competitive rates and flexible terms for qualified buyers.',
      features: [
        { text: '3% Down Available' },
        { text: 'Higher Lending Limits' },
        { text: 'Ideal for Good Credit' },
      ],
      showDPA: true,
      linkUrl: '/apply',
      linkText: 'Start Your Conventional',
    },
    {
      title: 'FHA Loans',
      description: 'Government-backed loans with lower requirements for first-time homebuyers.',
      features: [
        { text: '3.5% Down Payment' },
        { text: 'Lower Credit Requirements' },
        { text: 'Flexible Debt-to-Income' },
      ],
      showDPA: true,
      linkUrl: '/apply',
      linkText: 'Start Your FHA',
    },
    {
      title: 'Refinance',
      description: 'Lower your rate, reduce your term, or access your home equity.',
      features: [
        { text: 'Lock in Lower Rates' },
        { text: 'Access Home Equity' },
        { text: 'Streamlined Process' },
      ],
      showDPA: false,
      linkUrl: '/apply',
      linkText: 'Start Your Refinance',
    },
  ];

  const loans = featuredLoans.length > 0 ? featuredLoans : defaultLoans;

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Loans */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
              Featured Loans
            </h2>
            <p className="text-[#666] text-base">
              From first home to refinance, we&apos;re here for you.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loans.map((loan: any, index: number) => {
              const imageUrl = getMediaUrl(loan.image);
              return (
                <div key={loan.id || index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-[#181F53] to-[#2a3270] flex items-center justify-center relative overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={loan.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white/30 text-sm">Loan Image</div>
                    )}
                  </div>
                  <div className="p-6">
                    {loan.showDPA && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-3">
                        Down Payment Assistance Available
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{loan.title}</h3>
                    <p className="text-[#666] text-sm mb-4 whitespace-pre-line">{loan.description}</p>
                    <ul className="space-y-2 mb-6">
                      {loan.features?.map((feature: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature.text || feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={loan.linkUrl || '/apply'}
                      className="block w-full text-center bg-[#181F53] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#232b5e] transition-colors"
                    >
                      {loan.linkText || `Start Your ${loan.title.replace(' Loans', '')}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Down Payment Assistance */}
      <section className="section-padding bg-[#f8f8f8]">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-[#181F53]/10 text-[#181F53] text-sm font-semibold rounded-full mb-4">
                DPA Programs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4">
                Down Payment Assistance
              </h2>
              <p className="text-lg text-[#666] mb-6">
                Don&apos;t let a down payment hold you back. We offer programs to help you get into your home sooner with forgivable assistance options.
              </p>
              <ul className="space-y-4 mb-8">
                {['Up to $10,000 in assistance', 'Forgivable programs available', '0% down options', 'Works with FHA and Conventional', 'Quick eligibility check'].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#d93c37]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-[#d93c37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[#1a1a1a]">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dpa"
                className="inline-block bg-[#d93c37] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#b8302c] transition-colors"
              >
                Check Eligibility
              </Link>
            </div>
            <div className="bg-gradient-to-br from-[#181F53] to-[#2a3270] rounded-2xl h-80 flex items-center justify-center">
              <div className="text-white/30 text-sm">DPA Image</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Calculators */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
              Tools & Calculators
            </h2>
            <p className="text-[#666] text-base">
              Free resources to help you plan your home purchase
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Mortgage Calculator', description: 'Estimate your monthly payment', icon: '🏠', href: '/calculator' },
              { title: 'Affordability Calculator', description: 'See how much home you can afford', icon: '💰', href: '/calculator' },
              { title: 'Refinance Calculator', description: 'Calculate your potential savings', icon: '📊', href: '/calculator' },
            ].map((tool, index) => (
              <Link
                key={index}
                href={tool.href}
                className="flex items-center gap-4 p-6 bg-[#f8f8f8] rounded-xl hover:bg-[#f0f0f0] transition-colors group"
              >
                <div className="w-14 h-14 bg-[#181F53]/10 rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#181F53]/20 transition-colors">
                  {tool.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] group-hover:text-[#181F53] transition-colors">{tool.title}</h3>
                  <p className="text-sm text-[#666]">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Agent CTA */}
      <section className="section-padding bg-[#181F53]">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Talk to a Loan Expert Today
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Get personalized guidance from our experienced loan officers. We&apos;re here to help you navigate the mortgage process with confidence.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-block bg-[#d93c37] text-white font-semibold py-3 px-8 rounded-lg hover:bg-[#b8302c] transition-colors"
                >
                  Schedule a Call
                </Link>
                <a
                  href="tel:8709264052"
                  className="inline-block bg-white/10 text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Call 870-926-4052
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center text-white/30">
                Agent Photo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">
                  Latest Articles
                </h2>
                <p className="text-[#666] mt-2">Tips and guides for homebuyers</p>
              </div>
              <Link href="/learn" className="text-[#181F53] font-semibold hover:text-[#d93c37] transition-colors hidden md:inline-flex items-center gap-2">
                View All Articles
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {recentPosts.map((post: any) => (
                <Link key={post.id} href={`/learn/${post.slug}`} className="group">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-[#181F53] to-[#2a3270] relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#181F53] transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-[#666] text-sm line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link href="/learn" className="text-[#181F53] font-semibold hover:text-[#d93c37] transition-colors">
                View All Articles →
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
