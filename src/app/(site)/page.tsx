import Link from 'next/link';
import { getRecentBlogPosts, getFeaturedLoans, getMediaUrl, getHomepageSettings, getLenderLogos } from '@/lib/data';
import HeroSection from '@/components/HeroSection';
import SnowEffectWrapper from '@/components/SnowEffectWrapper';
import WhyAmericanMortgage from '@/components/WhyAmericanMortgage';
import MoreLoansBanner from '@/components/MoreLoansBanner';

export default async function Home() {
  const [recentPosts, featuredLoans, homepageSettings, lenderLogos] = await Promise.all([
    getRecentBlogPosts(3),
    getFeaturedLoans(),
    getHomepageSettings(),
    getLenderLogos(),
  ]);
  const defaultLoans = [
    { title: 'Conventional Loans', description: 'Own your next home with the most popular mortgage available.', features: [{ text: 'Flexible for rates & terms' }, { text: 'Higher lending limits' }, { text: 'Great for homebuyers and buyers with good credit' }], showDPA: true, linkUrl: '/apply', linkText: 'Start Your Conventional Loan' },
    { title: 'FHA Loans', description: 'Close with lower upfront costs and easier approval.', features: [{ text: 'Lower credit requirements' }, { text: 'Put as little as 3.5% down' }, { text: 'Relaxed debt-to-income requirements' }], showDPA: true, linkUrl: '/apply', linkText: 'Start Your FHA Loan' },
    { title: 'Refinance', description: 'Save more every month or unlock cash with your home value.', features: [{ text: 'Lock in a lower rate' }, { text: 'Use equity to unlock funds' }, { text: 'Conventional and FHA refinancing available' }], showDPA: false, linkUrl: '/apply', linkText: 'Start Your Refinance' },
  ];
  const loans = featuredLoans.length > 0 ? featuredLoans : defaultLoans;

  return (
    <>
      {/* Snow effect container - wraps hero and lender logos */}
      <div className="relative">
        <SnowEffectWrapper />
        <HeroSection settings={homepageSettings?.hero} />
        {/* Lender Partners Section */}
        {lenderLogos.items.length > 0 && (
          <section className="bg-[#141a47] pt-6 pb-[91px] md:pt-8 md:pb-16">
            <div className="container-custom">
              <p className="text-white/60 text-center text-sm mb-4 md:mb-6" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                {lenderLogos.sectionTitle}
              </p>
              {/* Desktop layout - horizontal */}
              <div className="hidden md:flex flex-wrap items-center justify-center gap-8 lg:gap-12">
                {lenderLogos.items.map((logo: any) => (
                  <div key={logo.id} className="flex items-center justify-center">
                    {logo.logoUrl ? (
                      <img
                        src={logo.logoUrl}
                        alt={logo.name}
                        style={{
                          width: logo.width ? `${logo.width}px` : 'auto',
                          height: logo.height ? `${logo.height}px` : '40px',
                          maxWidth: '160px',
                          objectFit: 'contain'
                        }}
                        className="opacity-90 hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <span className="text-white/80 font-semibold text-lg">{logo.name}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Mobile layout - scrollable or wrapped */}
              <div className="md:hidden flex flex-wrap items-center justify-center gap-6">
                {lenderLogos.items.map((logo: any) => (
                  <div key={logo.id} className="flex items-center justify-center">
                    {logo.logoUrl ? (
                      <img
                        src={logo.logoUrl}
                        alt={logo.name}
                        style={{
                          width: logo.width ? `${Math.min(logo.width * 0.8, 120)}px` : 'auto',
                          height: logo.height ? `${Math.min(logo.height * 0.8, 32)}px` : '32px',
                          maxWidth: '120px',
                          objectFit: 'contain'
                        }}
                        className="opacity-90"
                      />
                    ) : (
                      <span className="text-white/80 font-semibold text-sm">{logo.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* Star Icon at bottom of logo section */}
        <div className="bg-white flex justify-center pt-20 md:pt-16">
          <div className="w-24 h-24 bg-white rounded-full p-3 border-8 border-white shadow-lg -mt-32 md:-mt-28 relative z-20">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59.74 59.74" className="w-full h-full"><g fill="#181F53"><path d="M29.87,11.07c.39,0,.77.03,1.16.06L31.7.06c-.61-.04-1.22-.06-1.83-.06h-.05l.02,11.07s.02,0,.03,0Z"/><path d="M23.78,12.1l-3.58-10.5c-.63.21-1.24.45-1.85.7l4.26,10.22c.38-.16.78-.29,1.17-.43Z"/><path d="M13.01,21.6l-9.96-4.88c-.28.58-.55,1.17-.8,1.77l10.24,4.22c.16-.38.34-.74.52-1.11Z"/><path d="M17.45,15.78l-7.33-8.32c-.49.43-.97.88-1.43,1.35l7.85,7.81c.29-.29.6-.56.91-.84Z"/><path d="M47.63,23.76l10.49-3.61c-.21-.62-.45-1.24-.70-1.84l-10.21,4.28c.16.38.29.77.43,1.17Z"/><path d="M43.94,17.44l8.30-7.36c-.43-.49-.88-.96-1.34-1.42l-7.80,7.87c.29.29.56.60.84.91Z"/><path d="M38.11,13l4.85-9.98c-.58-.28-1.16-.54-1.75-.79l-4.20,10.25c.38.15.74.33,1.10.51Z"/><path d="M11.07,29.87c0-.40.04-.79.06-1.18L.06,27.99c-.04.62-.06,1.25-.06,1.88v.68l.06.68,11.03-.98c0-.13-.02-.25-.02-.38Z"/><path d="M35.92,47.65l3.57,10.50c.63-.21,1.24-.45,1.85-.70l-4.25-10.23c-.38.16-.78.29-1.17.43Z"/><path d="M46.71,38.18l9.94,4.93c.29-.59.56-1.18.81-1.79l-10.23-4.26c-.16.38-.34.75-.53,1.12Z"/><path d="M12.10,35.95l-10.49,3.60c.21.61.44,1.21.68,1.80l10.22-4.26c-.16-.37-.29-.76-.42-1.14Z"/><path d="M42.25,43.98l7.31,8.34c.49-.43.97-.88,1.43-1.34l-7.83-7.83c-.29.29-.60.56-.92.83Z"/><path d="M59.72,29.19l-11.07.46c0,.08.01.15.01.22,0,.41-.04.82-.06,1.22l11.07.71c.04-.64.06-1.28.06-1.93l-.02-.68Z"/><path d="M15.77,42.27l-8.31,7.35c.42.48.86.94,1.31,1.39l7.81-7.85c-.29-.29-.55-.59-.82-.90Z"/><path d="M29.87,48.66c-.41,0-.80-.04-1.20-.06l-.70,11.07c.63.04,1.26.06,1.90.06h.02v-11.07s-.01,0-.02,0Z"/><path d="M21.58,46.72l-4.89,9.96c.59.29,1.18.56,1.79.81l4.23-10.24c-.38-.16-.75-.34-1.12-.52Z"/></g><path fill="#181F53" d="M37.04,41.4c-.1,0-.21-.03-.29-.1l-6.87-4.99-6.87,4.99c-.18.13-.41.13-.59,0-.17-.13-.25-.35-.18-.56l2.62-8.08-6.87-4.99c-.17-.13-.25-.35-.18-.56.07-.21.26-.35.48-.35h8.5l2.63-8.08c.07-.21.26-.35.48-.35h0c.22,0,.41.14.48.35l2.62,8.08h8.5c.22,0,.41.14.48.35.07.21,0,.43-.18.56l-6.87,4.99,2.62,8.08c.07.21,0,.43-.18.56-.09.06-.19.1-.29.1ZM19.81,27.76l5.92,4.30c.17.13.25.35.18.56l-2.26,6.96,5.92-4.30c.18-.13.41-.13.59,0l5.92,4.30-2.26-6.96c-.07-.21,0-.43.18-.56l5.92-4.30h-7.32c-.22,0-.41-.14-.48-.35l-2.26-6.96-2.26,6.96c-.07.21-.26.35-.48.35h-7.32Z"/></svg>
          </div>
        </div>
      </div>

      {/* Why American Mortgage Section */}
      <WhyAmericanMortgage settings={homepageSettings?.whyChooseUs} />

      {/* Featured Loans Section */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-24 bg-white relative z-10">
        <div className="container-custom">
          <div className="flex flex-col items-center">
            <h2 className="text-center text-[#181F53] mb-12">
              <span className="block text-[#d93c37] text-[18px] font-bold tracking-[0.15em] uppercase mb-2 md:mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>{homepageSettings?.featuredLoans?.eyebrow || 'Featured Loans'}</span>
              {/* Desktop - 3 lines */}
              <span className="hidden md:block text-[54.936px]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '60.429px' }}>{homepageSettings?.featuredLoans?.headlineLine1 || 'From first home'}</span>
              <span className="hidden md:block text-[54.936px]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '60.429px' }}>to refinance,</span>
              <span className="hidden md:block text-[54.936px] text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '60.429px' }}>{homepageSettings?.featuredLoans?.headlineLine2 || "we're here for you."}</span>
              {/* Mobile - 3 lines */}
              <span className="md:hidden block text-[32px]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>{homepageSettings?.featuredLoans?.headlineLine1 || 'From first home'}</span>
              <span className="md:hidden block text-[32px]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>to refinance,</span>
              <span className="md:hidden block text-[32px] text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>{homepageSettings?.featuredLoans?.headlineLine2 || "we're here for you."}</span>
            </h2>
            <div className="flex flex-wrap justify-center items-stretch gap-8 lg:gap-10 w-full mb-12">
              {loans.map((loan: any, index: number) => {
                const imageUrl = getMediaUrl(loan.image);
                return (
                  <div key={loan.id || index} className="flex flex-col w-full md:w-[305.34px] h-full">
                    <h3 className="text-[#181F53] text-center mb-2" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '22.5px', fontWeight: 700 }}>{loan.title}</h3>
                    {/* Desktop description */}
                    <p className="hidden md:block text-[#666] text-center mb-4" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '18px', fontWeight: 400, lineHeight: '28.8px' }}>{loan.description}</p>
                    {/* Mobile description with custom line breaks */}
                    <p className="md:hidden text-[#666] text-center mb-4" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '18px', fontWeight: 400, lineHeight: '28.8px' }}>
                      {loan.title === 'FHA Loans' ? (
                        <>Close with lower upfront costs<br />and easier approval.</>
                      ) : loan.title === 'Refinance' ? (
                        <>Save more every month or unlock<br />cash with your home value.</>
                      ) : (
                        loan.description
                      )}
                    </p>
                    <Link href={loan.linkUrl || '/apply'} className="relative block mb-5 rounded-lg overflow-hidden group">
                      <div className="w-full aspect-[4/3] md:w-[305.34px] md:h-[375px] md:aspect-auto bg-gradient-to-br from-[#181F53] to-[#2a3270]">
                        {imageUrl ? (<img src={imageUrl} alt={loan.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>) : (<div className="w-full h-full flex items-center justify-center text-white/30 text-sm">Loan Image</div>)}
                      </div>
                      {loan.showDPA && (<div className="absolute bottom-0 left-0 right-0 bg-[#181F53]/90 text-white text-xs font-medium py-2 px-4">{loan.dpaText || 'Down Payment Assistance Available'}</div>)}
                    </Link>
                    <ul className="space-y-2 mb-6 flex-grow">
                      {loan.features?.map((feature: any, i: number) => (<li key={i} className="flex items-start gap-2 text-[#333] text-sm"><svg className="w-5 h-5 text-[#181F53] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6"/></svg><span>{feature.text || feature}</span></li>))}
                    </ul>
                    <div className="flex flex-col gap-3">
                      <Link href={loan.linkUrl || '/apply'} className="block w-full md:w-[305.34px] h-[54px] text-center border border-[#d93c37] text-[#d93c37] font-bold rounded-md hover:border-[#820201] hover:text-[#820201] hover:bg-white transition-colors text-lg flex items-center justify-center">{loan.linkText || `Start Your ${loan.title.replace(' Loans', '')} Loan`}</Link>
                      {loan.learnMoreEnabled && loan.learnMoreUrl && (
                        <Link href={loan.learnMoreUrl} className="block w-full md:w-[305.34px] h-[44px] text-center border border-[#181F53] text-[#181F53] font-semibold rounded-md hover:bg-[#181F53] hover:text-white transition-colors text-base flex items-center justify-center">{loan.learnMoreText || 'Learn More'}</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {(homepageSettings?.moreLoans?.enabled !== false) && (
              <MoreLoansBanner settings={homepageSettings?.moreLoans} />
            )}
            {(homepageSettings?.dpa?.enabled !== false) && (
              <div className={`w-full rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 ${
                homepageSettings?.dpa?.backgroundStyle === 'grey'
                  ? 'bg-gradient-to-r from-[#f3f4f6] to-[#e5e7eb] border border-gray-200'
                  : 'bg-[#181F53]'
              }`}>
                <div className="flex-1">
                  <h3 className={`text-2xl md:text-3xl font-normal mb-6 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#181F53]' : 'text-white'}`}>{homepageSettings?.dpa?.headline || 'Make homebuying more affordable with down payment assistance.'}</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-3">
                    <div className={`flex items-start gap-2 text-base font-medium ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#333]' : 'text-white'}`}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'border-[#181F53]' : 'border-[#fed560]'}`}><svg className={`w-3 h-3 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#181F53]' : 'text-[#fed560]'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div><span>{homepageSettings?.dpa?.feature1 || 'Cover the downpayment, closing costs, or both'}</span></div>
                    <div className={`flex items-start gap-2 text-base font-medium ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#333]' : 'text-white'}`}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'border-[#181F53]' : 'border-[#fed560]'}`}><svg className={`w-3 h-3 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#181F53]' : 'text-[#fed560]'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div><span>{homepageSettings?.dpa?.feature2 || 'Forgivable and long-term repayment plans'}</span></div>
                    <div className={`flex items-start gap-2 text-base font-medium ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#333]' : 'text-white'}`}><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'border-[#181F53]' : 'border-[#fed560]'}`}><svg className={`w-3 h-3 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#181F53]' : 'text-[#fed560]'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div><span>{homepageSettings?.dpa?.feature3 || '0% down options available'}</span></div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <Link href={homepageSettings?.dpa?.buttonUrl || '/apply'} className={`shine-button font-semibold rounded transition-all text-base whitespace-nowrap flex items-center justify-center relative overflow-hidden ${
                    homepageSettings?.dpa?.backgroundStyle === 'grey'
                      ? 'bg-[#181F53] text-white hover:bg-[#0f1337]'
                      : 'bg-[#d93c37] md:bg-[#dd0202] text-white hover:bg-[#b8302c] md:hover:bg-[#b80202]'
                  }`} style={{ width: '213.69px', height: '54px' }}>{homepageSettings?.dpa?.buttonText || 'Check Eligibility'}</Link>
                  <span className={`mt-2 ${homepageSettings?.dpa?.backgroundStyle === 'grey' ? 'text-[#666]' : 'text-white'}`} style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '14.4px', fontWeight: 400, fontStyle: 'italic' }}>{homepageSettings?.dpa?.reassuranceText || 'No impact to credit'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="pt-0 pb-6 md:pt-2 md:pb-10 bg-white">
        <div className="container-custom">
          <div className="text-center mb-8">
            <span className="block text-[#d93c37] text-[18px] font-bold tracking-[0.15em] uppercase mb-2 md:mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>{homepageSettings?.tools?.eyebrow || 'Tools & Calculators'}</span>
            {/* Desktop */}
            <span className="hidden md:block text-[#181F53]" style={{ fontFamily: 'Lora, sans-serif', fontSize: '43.938px', fontWeight: 500, lineHeight: '48px' }}>{homepageSettings?.tools?.headlineLine1 || 'Get an estimate instantly with our'}</span>
            <span className="hidden md:block text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontSize: '43.938px', fontWeight: 500, lineHeight: '48px' }}>{homepageSettings?.tools?.headlineLine2 || 'online mortgage tools'}</span>
            {/* Mobile */}
            <span className="md:hidden block text-[32px] text-[#181F53]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>{homepageSettings?.tools?.headlineLine1 || 'Get an estimate instantly with our'}</span>
            <span className="md:hidden block text-[32px] text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>{homepageSettings?.tools?.headlineLine2 || 'online mortgage tools'}</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
            {(homepageSettings?.tools?.cards || [
              { title: 'Mortgage Calculator', description: 'Estimate your monthly payment', icon: 'calculator', url: '/calculator' },
              { title: 'Affordability Calculator', description: 'See how much home you can afford', icon: 'home', url: '/calculator' },
              { title: 'Refinance Calculator', description: 'Calculate your potential savings', icon: 'refresh', url: '/calculator' }
            ]).map((tool: any, index: number) => (
              <Link
                key={index}
                href={tool.url || tool.href || '/calculator'}
                className="group flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-5 py-5 shadow-sm hover:shadow-md hover:border-[#d93c37]/30 transition-all duration-300"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#d93c37] to-[#b8302c] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  {(tool.icon === 'calculator' || tool.icon === '🏠') && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="8" y1="10" x2="10" y2="10" />
                      <line x1="14" y1="10" x2="16" y2="10" />
                      <line x1="8" y1="14" x2="10" y2="14" />
                      <line x1="14" y1="14" x2="16" y2="14" />
                      <line x1="8" y1="18" x2="10" y2="18" />
                      <line x1="14" y1="18" x2="16" y2="18" />
                    </svg>
                  )}
                  {(tool.icon === 'home' || tool.icon === '💰') && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {(tool.icon === 'refresh' || tool.icon === '📊') && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#1a1a1a] group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    {tool.title}
                  </h3>
                  <p className="text-[#666] text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    {tool.description}
                  </p>
                </div>

                {/* Arrow */}
                <svg className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-[#d93c37] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {recentPosts && recentPosts.length > 0 && (
        <section className="py-6 md:py-10 bg-white">
          <div className="container-custom">
            <div className="flex justify-between items-end mb-6"><div><h2 className="text-2xl md:text-3xl font-bold text-[#1a1a1a]">{homepageSettings?.articles?.title || 'Latest Articles'}</h2><p className="text-[#666] mt-1">{homepageSettings?.articles?.subtitle || 'Tips and guides for homebuyers'}</p></div><Link href="/learn" className="text-[#181F53] font-semibold hover:text-[#d93c37] transition-colors hidden md:inline-flex items-center gap-2">View All Articles<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></Link></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {recentPosts.slice(0, 3).map((post: any) => (<Link key={post.id} href={`/learn/${post.slug}`} className="group"><div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"><div className="aspect-[16/10] bg-gradient-to-br from-[#181F53] to-[#2a3270] relative overflow-hidden">{post.featuredImage?.url ? (<img src={post.featuredImage.url} alt={post.featuredImage.alt || post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>) : (<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>)}</div><div className="p-3 md:p-4"><h3 className="text-sm md:text-base font-semibold text-[#1a1a1a] mb-1 group-hover:text-[#181F53] transition-colors line-clamp-2">{post.title}</h3>{post.excerpt && (<p className="text-[#666] text-xs md:text-sm line-clamp-2 hidden md:block">{post.excerpt}</p>)}</div></div></Link>))}
            </div>
            <div className="text-center mt-8 md:hidden"><Link href="/learn" className="text-[#181F53] font-semibold hover:text-[#d93c37] transition-colors">View All Articles →</Link></div>
          </div>
        </section>
      )}
    </>
  );
}
