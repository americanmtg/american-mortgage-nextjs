import { Metadata } from 'next';
import Link from 'next/link';
import { getLoanProducts, getLoanPageWidgets, getLoanPageSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Loan Programs | American Mortgage',
  description: 'Explore our mortgage loan programs including Conventional, FHA, VA, USDA, and more. Find the perfect loan for your home buying journey.',
};

// Icon components mapped by name
const icons: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  shield: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  star: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  currency: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
      <line x1="8" y1="6" x2="16" y2="6" strokeWidth={2} />
      <line x1="8" y1="10" x2="10" y2="10" strokeWidth={2} />
      <line x1="14" y1="10" x2="16" y2="10" strokeWidth={2} />
      <line x1="8" y1="14" x2="10" y2="14" strokeWidth={2} />
      <line x1="14" y1="14" x2="16" y2="14" strokeWidth={2} />
    </svg>
  ),
  user: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default async function LoansPage() {
  const [products, widgets, settings] = await Promise.all([
    getLoanProducts(),
    getLoanPageWidgets(),
    getLoanPageSettings(),
  ]);

  const heroTitle = settings?.hero_title || 'Loan Programs';
  const heroDescription = settings?.hero_description || "Whether you're buying your first home, upgrading, or refinancing, we have loan options tailored to your needs.";
  const showJumpPills = settings?.show_jump_pills ?? true;
  const bottomCtaTitle = settings?.bottom_cta_title || 'Not Sure Which Loan is Right for You?';
  const bottomCtaDescription = settings?.bottom_cta_description || 'Our loan experts are here to help. Get personalized advice with no obligation.';

  const mobileWidgets = widgets.filter(w => w.show_on_mobile);
  const desktopWidgets = widgets.filter(w => w.show_on_desktop);

  // Helper to create URL-safe ID from name
  const createId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

  return (
    <>
      {/* Hero Section - Compact */}
      <section className="bg-[#181F53] py-6 md:py-8">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {heroTitle}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{heroDescription}</p>
          </div>

          {/* Mobile Jump to Loan Type Pills */}
          {showJumpPills && products.length > 0 && (
            <div className="lg:hidden mt-6">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Jump to loan type</p>
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <a
                    key={product.id}
                    href={`#${createId(product.name)}`}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full transition-colors"
                  >
                    {product.name.replace(' Loans', '')}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content with Sticky Sidebar */}
      <section className="py-8 lg:py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Loan Products */}
              <div className="space-y-5 lg:space-y-8">
                {products.map((loan) => (
                  <div
                    key={loan.id}
                    id={createId(loan.name)}
                    className="bg-white rounded-xl lg:rounded-2xl shadow-sm hover:shadow-md lg:hover:shadow-lg transition-shadow overflow-hidden scroll-mt-32 border border-gray-100"
                  >
                    {/* Mobile Layout (Layout #1) - Compact */}
                    <div className="lg:hidden p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                          <div className="text-[#181F53]">{icons[loan.icon_name || 'home']}</div>
                        </div>
                        <div>
                          <Link href={`/loans/${loan.slug}`} className="hover:text-[#d93c37] transition-colors">
                            <h2 className="text-xl font-bold text-[#181F53] hover:text-[#d93c37]">{loan.name}</h2>
                          </Link>
                          <p className="text-gray-500 text-sm">{loan.tagline}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{loan.description}</p>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">Down Payment: </span>
                          <span className="font-semibold text-[#181F53]">{loan.down_payment}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Credit Score: </span>
                          <span className="font-semibold text-[#181F53]">{loan.credit_score}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="grid grid-cols-1 gap-1.5">
                          {(loan.highlights || []).map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0 text-[#181F53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-gray-600">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {loan.primary_button_text && loan.primary_button_link && (
                          loan.primary_button_link.startsWith('tel:') ? (
                            <a
                              href={loan.primary_button_link}
                              className={`py-2.5 px-4 text-center text-sm font-semibold rounded-lg transition-colors ${
                                loan.primary_button_style === 'outline'
                                  ? 'border border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                                  : 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                              }`}
                            >
                              {loan.primary_button_text}
                            </a>
                          ) : (
                            <Link
                              href={loan.primary_button_link}
                              className={`py-2.5 px-4 text-center text-sm font-semibold rounded-lg transition-colors ${
                                loan.primary_button_style === 'outline'
                                  ? 'border border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                                  : 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                              }`}
                            >
                              {loan.primary_button_text}
                            </Link>
                          )
                        )}
                        {loan.show_secondary_button && loan.secondary_button_text && loan.secondary_button_link && (
                          loan.secondary_button_link.startsWith('tel:') ? (
                            <a
                              href={loan.secondary_button_link}
                              className={`py-2.5 px-4 text-center text-sm font-semibold rounded-lg transition-colors ${
                                loan.secondary_button_style === 'filled'
                                  ? 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                                  : 'border border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                              }`}
                            >
                              {loan.secondary_button_text}
                            </a>
                          ) : (
                            <Link
                              href={loan.secondary_button_link}
                              className={`py-2.5 px-4 text-center text-sm font-semibold rounded-lg transition-colors ${
                                loan.secondary_button_style === 'filled'
                                  ? 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                                  : 'border border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                              }`}
                            >
                              {loan.secondary_button_text}
                            </Link>
                          )
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout (Layout #2) - Full */}
                    <div className="hidden lg:block p-6 md:p-8">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                          <div className="text-[#181F53]">{icons[loan.icon_name || 'home']}</div>
                        </div>
                        <div>
                          <Link href={`/loans/${loan.slug}`} className="hover:text-[#d93c37] transition-colors">
                            <h2 className="text-2xl font-bold text-[#181F53] hover:text-[#d93c37]">{loan.name}</h2>
                          </Link>
                          <p className="text-gray-500">{loan.tagline}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6 leading-relaxed">{loan.description}</p>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Down Payment</p>
                          <p className="text-lg font-bold text-[#181F53]">{loan.down_payment}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                          <p className="text-lg font-bold text-[#181F53]">{loan.credit_score}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Best For</p>
                          <p className="text-xs font-medium text-[#181F53] line-clamp-2">{loan.best_for}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Benefits</h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {(loan.highlights || []).map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <svg className="w-5 h-5 flex-shrink-0 text-[#181F53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-gray-600">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {loan.primary_button_text && loan.primary_button_link && (
                          loan.primary_button_link.startsWith('tel:') ? (
                            <a
                              href={loan.primary_button_link}
                              className={`flex-1 py-3 px-6 text-center font-semibold rounded-lg transition-colors ${
                                loan.primary_button_style === 'outline'
                                  ? 'border-2 border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                                  : 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                              }`}
                            >
                              {loan.primary_button_text}
                            </a>
                          ) : (
                            <Link
                              href={loan.primary_button_link}
                              className={`flex-1 py-3 px-6 text-center font-semibold rounded-lg transition-colors ${
                                loan.primary_button_style === 'outline'
                                  ? 'border-2 border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                                  : 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                              }`}
                            >
                              {loan.primary_button_text}
                            </Link>
                          )
                        )}
                        {loan.show_secondary_button && loan.secondary_button_text && loan.secondary_button_link && (
                          loan.secondary_button_link.startsWith('tel:') ? (
                            <a
                              href={loan.secondary_button_link}
                              className={`flex-1 py-3 px-6 text-center font-semibold rounded-lg transition-colors ${
                                loan.secondary_button_style === 'filled'
                                  ? 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                                  : 'border-2 border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                              }`}
                            >
                              {loan.secondary_button_text}
                            </a>
                          ) : (
                            <Link
                              href={loan.secondary_button_link}
                              className={`flex-1 py-3 px-6 text-center font-semibold rounded-lg transition-colors ${
                                loan.secondary_button_style === 'filled'
                                  ? 'bg-[#d93c37] text-white hover:bg-[#b8302c]'
                                  : 'border-2 border-[#181F53] text-[#181F53] hover:bg-[#181F53] hover:text-white'
                              }`}
                            >
                              {loan.secondary_button_text}
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Down Payment Assistance Banner */}
              <div className="mt-8 bg-[#181F53] rounded-xl p-5 lg:p-8 text-white">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
                  <div>
                    <h3 className="text-lg lg:text-2xl font-bold mb-1 lg:mb-2">Down Payment Assistance Available</h3>
                    <p className="text-white/70 text-sm lg:text-base">
                      Ask about programs that can help cover your down payment and closing costs.
                    </p>
                  </div>
                  <Link
                    href="/apply"
                    className="flex-shrink-0 px-6 lg:px-8 py-2.5 lg:py-4 bg-[#d93c37] text-white text-sm lg:text-base font-semibold rounded-lg hover:bg-[#b8302c] transition-colors whitespace-nowrap"
                  >
                    Check Eligibility
                  </Link>
                </div>
              </div>

              {/* Mobile Widgets - Show below cards on mobile */}
              <div className="lg:hidden mt-8 space-y-4">
                {mobileWidgets.map((widget) => (
                  <div key={widget.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    {widget.widget_type === 'featured_partner' ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-[#d93c37] font-semibold uppercase tracking-wider">
                            {widget.title}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Sponsor
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#181F53] to-[#2a3270] rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#181F53]">{widget.partner_name}</p>
                            <p className="text-sm text-gray-500">{widget.partner_company}</p>
                            {widget.partner_email && <p className="text-sm text-gray-500">{widget.partner_email}</p>}
                          </div>
                        </div>
                        {widget.partner_phone && (
                          <a
                            href={`tel:${widget.partner_phone.replace(/[^0-9]/g, '')}`}
                            className="block w-full py-2.5 bg-[#181F53] text-white text-center text-sm font-semibold rounded-lg hover:bg-[#0f1638] transition-colors"
                          >
                            Call {widget.partner_phone}
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          {widget.icon_name && (
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${widget.icon_color || '#181F53'}20` }}
                            >
                              <div style={{ color: widget.icon_color || '#181F53' }}>
                                {icons[widget.icon_name]}
                              </div>
                            </div>
                          )}
                          <h3 className="font-bold text-[#181F53]">{widget.title}</h3>
                        </div>
                        {widget.description && (
                          <p className="text-gray-500 text-sm mb-4">{widget.description}</p>
                        )}
                        {widget.button_text && widget.button_link && (
                          <Link
                            href={widget.button_link}
                            className="block w-full py-2.5 border-2 text-center font-semibold rounded-lg transition-colors text-sm"
                            style={{
                              borderColor: widget.icon_color || '#181F53',
                              color: widget.icon_color || '#181F53',
                            }}
                          >
                            {widget.button_text}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Not Sure Which Loan - Mobile version styled like widgets */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                  <h3 className="text-lg font-bold text-[#181F53] mb-1">
                    {bottomCtaTitle.includes('Right')
                      ? bottomCtaTitle.replace('Right', '\nRight').split('\n').map((line, i) => (
                          <span key={i}>{line}{i === 0 && <br />}</span>
                        ))
                      : bottomCtaTitle
                    }
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">{bottomCtaDescription}</p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/apply"
                      className="py-2.5 bg-[#d93c37] text-white text-center text-sm font-semibold rounded-lg hover:bg-[#b8302c] transition-colors"
                    >
                      Start Your Application
                    </Link>
                    <a
                      href="tel:870-926-4052"
                      className="py-2.5 border border-[#181F53] text-[#181F53] text-center text-sm font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
                    >
                      Call (870) 926-4052
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Sticky Sidebar - Hidden on mobile */}
            <div className="hidden lg:block w-80">
              <div className="lg:sticky lg:top-24 space-y-6">
                {desktopWidgets.map((widget) => (
                  <div key={widget.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    {widget.widget_type === 'featured_partner' ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-[#d93c37] font-semibold uppercase tracking-wider">
                            {widget.title}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Sponsor
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#181F53] to-[#2a3270] rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#181F53]">{widget.partner_name}</p>
                            <p className="text-sm text-gray-500">{widget.partner_company}</p>
                            {widget.partner_email && <p className="text-sm text-gray-500">{widget.partner_email}</p>}
                          </div>
                        </div>
                        {widget.partner_phone && (
                          <a
                            href={`tel:${widget.partner_phone.replace(/[^0-9]/g, '')}`}
                            className="block w-full py-2.5 bg-[#181F53] text-white text-center text-sm font-semibold rounded-lg hover:bg-[#0f1638] transition-colors"
                          >
                            Call {widget.partner_phone}
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          {widget.icon_name && (
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${widget.icon_color || '#181F53'}20` }}
                            >
                              <div style={{ color: widget.icon_color || '#181F53' }}>
                                {icons[widget.icon_name]}
                              </div>
                            </div>
                          )}
                          <h3 className="font-bold text-[#181F53]">{widget.title}</h3>
                        </div>
                        {widget.description && (
                          <p className="text-gray-500 text-sm mb-4">{widget.description}</p>
                        )}
                        {widget.button_text && widget.button_link && (
                          <Link
                            href={widget.button_link}
                            className="block w-full py-2.5 border-2 text-center font-semibold rounded-lg transition-colors text-sm"
                            style={{
                              borderColor: widget.icon_color || '#181F53',
                              color: widget.icon_color || '#181F53',
                            }}
                          >
                            {widget.button_text}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA - Desktop only (mobile version is in widgets above) */}
      <section className="hidden lg:block py-10 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#181F53] mb-3">
              {bottomCtaTitle.includes('Right')
                ? bottomCtaTitle.replace('Right', '\nRight').split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                  ))
                : bottomCtaTitle
              }
            </h2>
            <p className="text-gray-600 mb-6">{bottomCtaDescription}</p>
            <div className="flex flex-row gap-3 justify-center">
              <Link
                href="/apply"
                className="px-6 py-3 bg-[#d93c37] text-white font-semibold rounded-lg hover:bg-[#b8302c] transition-colors"
              >
                Start Your Application
              </Link>
              <a
                href="tel:870-926-4052"
                className="px-6 py-3 border border-[#181F53] text-[#181F53] font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
              >
                Call (870) 926-4052
              </a>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
