'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface MetaSettings {
  noticeEnabled: boolean;
  headerDesktopEnabled: boolean;
  headerMobileEnabled: boolean;
  headerLogoCenteredMobile: boolean;
  menuEnabled: boolean;
  menuItems: { label: string; url: string; openInNewTab?: boolean }[];
  applyButton: { desktopEnabled: boolean; mobileEnabled: boolean; iconEnabled: boolean; text: string; url: string; color: string; textColor: string };
  heading: { line1: string; line2: string; line3: string };
  description: string;
  ctaButton: { enabled: boolean; iconEnabled: boolean; text: string; url: string; color: string; textColor: string };
}

interface SiteSettings {
  logo?: { url: string };
  logoWhite?: { url: string };
  logoHeight?: number;
  logoHeightMobile?: number;
  logoWhiteHeight?: number;
  logoWhiteHeightMobile?: number;
  legalBanner?: string;
  legalBannerMobile?: string;
  legalBannerShowDesktop?: boolean;
  legalBannerShowMobile?: boolean;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface FooterData {
  copyrightText?: string;
  nmlsInfo?: string;
}

export default function MetaLandingPage() {
  const [metaSettings, setMetaSettings] = useState<MetaSettings | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metaRes, siteRes, footerRes] = await Promise.all([
          fetch('/api/settings/meta-landing'),
          fetch('/api/settings/site'),
          fetch('/api/settings/footer'),
        ]);

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setMetaSettings(metaData.data);
        }
        if (siteRes.ok) {
          const siteData = await siteRes.json();
          setSiteSettings(siteData.data);
        }
        if (footerRes.ok) {
          const footer = await footerRes.json();
          setFooterData(footer.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#181F53]"></div>
      </div>
    );
  }

  const logoUrl = siteSettings?.logo?.url;
  const logoWhiteUrl = siteSettings?.logoWhite?.url;
  const logoHeight = siteSettings?.logoHeight || 60;
  const logoHeightMobile = siteSettings?.logoHeightMobile || 30;
  const logoWhiteHeight = siteSettings?.logoWhiteHeight || 60;
  const logoWhiteHeightMobile = siteSettings?.logoWhiteHeightMobile || 30;
  const legalBanner = siteSettings?.legalBanner || 'American Mortgage services are not available in NY, NV, NJ, UT, VT.';
  const legalBannerMobile = siteSettings?.legalBannerMobile || legalBanner;
  const companyName = siteSettings?.companyName || 'American Mortgage';
  const phone = siteSettings?.phone || '1-800-906-8960';
  const email = siteSettings?.email || 'hi@americanmortgage.com';
  const address = siteSettings?.address || '';

  const copyrightText = footerData?.copyrightText || `${companyName}, LLC. Copyright {{year}} All Rights Reserved.`;
  const nmlsInfo = footerData?.nmlsInfo || 'NMLS ID #2676687 (www.nmlsconsumeraccess.org). Equal Housing Opportunity.';

  const defaults: MetaSettings = {
    noticeEnabled: true,
    headerDesktopEnabled: true,
    headerMobileEnabled: true,
    headerLogoCenteredMobile: false,
    menuEnabled: true,
    menuItems: [],
    applyButton: { desktopEnabled: true, mobileEnabled: true, iconEnabled: true, text: 'Apply Now', url: '/apply', color: '#d93c37', textColor: '#ffffff' },
    heading: { line1: 'Find Out', line2: 'Your Homebuying', line3: 'Budget Today' },
    description: 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
    ctaButton: { enabled: true, iconEnabled: true, text: 'Check My Budget', url: '/apply', color: '#d93c37', textColor: '#ffffff' },
  };

  const settings = metaSettings || defaults;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner - Only show if noticeEnabled */}
      {settings.noticeEnabled && (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-[#f6f7f7] text-[#323232] text-center py-2 text-sm">
            {legalBanner}
          </div>
          {/* Mobile */}
          <div className="md:hidden bg-[#f6f7f7] text-[#323232] text-center py-2 text-sm px-4">
            {legalBannerMobile}
          </div>
        </>
      )}

      {/* Header - Show if either desktop or mobile header is enabled */}
      {(settings.headerDesktopEnabled || settings.headerMobileEnabled) && (
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop header - only show if desktop header is enabled */}
            {settings.headerDesktopEnabled && (
              <div className="hidden md:flex items-center justify-between h-20">
                {/* Logo */}
                {logoUrl && (
                  <Link href="/" className="flex-shrink-0 flex items-center">
                    <Image
                      src={logoUrl}
                      alt={companyName}
                      width={Math.round(logoHeight * 3.33)}
                      height={logoHeight}
                      priority
                      unoptimized
                      style={{ height: `${logoHeight}px`, width: 'auto' }}
                    />
                  </Link>
                )}

                {/* Navigation (if enabled) */}
                <div className="flex items-center gap-8">
                  {settings.menuEnabled && settings.menuItems.length > 0 && (
                    <nav className="flex items-center gap-8">
                      {settings.menuItems.map((item, index) => {
                        const isExternal = item.url.startsWith('http') || item.openInNewTab;
                        if (isExternal) {
                          return (
                            <a
                              key={index}
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0f2e71] hover:text-[#d93c37] transition-colors font-semibold"
                            >
                              {item.label}
                            </a>
                          );
                        }
                        return (
                          <Link
                            key={index}
                            href={item.url}
                            className="text-[#0f2e71] hover:text-[#d93c37] transition-colors font-semibold"
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  )}

                  {/* Apply Now Button - Desktop */}
                  {settings.applyButton.desktopEnabled && (
                    <Link
                      href={settings.applyButton.url}
                      className="px-6 py-2.5 rounded font-semibold text-base transition-colors inline-flex items-center gap-2"
                      style={{
                        backgroundColor: settings.applyButton.color,
                        color: settings.applyButton.textColor,
                      }}
                    >
                      {settings.applyButton.iconEnabled && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {settings.applyButton.text}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Mobile header - only show if mobile header is enabled */}
            {settings.headerMobileEnabled && (
              <div className={`md:hidden flex items-center h-16 ${settings.headerLogoCenteredMobile ? 'justify-center' : 'justify-between'}`}>
                {/* Logo */}
                {logoUrl && (
                  <Link href="/" className="flex-shrink-0 flex items-center">
                    <Image
                      src={logoUrl}
                      alt={companyName}
                      width={Math.round(logoHeightMobile * 3.33)}
                      height={logoHeightMobile}
                      priority
                      unoptimized
                      style={{ height: `${logoHeightMobile}px`, width: 'auto' }}
                    />
                  </Link>
                )}

                {/* Apply Now Button - Mobile (only show if not centered) */}
                {!settings.headerLogoCenteredMobile && settings.applyButton.mobileEnabled && (
                  <Link
                    href={settings.applyButton.url}
                    className="px-4 py-2 rounded font-semibold text-sm transition-colors inline-flex items-center gap-2"
                    style={{
                      backgroundColor: settings.applyButton.color,
                      color: settings.applyButton.textColor,
                    }}
                  >
                    {settings.applyButton.iconEnabled && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                    {settings.applyButton.text}
                  </Link>
                )}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#181F53] mb-6 leading-tight">
            {/* Mobile: 3 lines */}
            <span className="block md:hidden">{settings.heading.line1}</span>
            <span className="block md:hidden">{settings.heading.line2}</span>
            <span className="block md:hidden">{settings.heading.line3}</span>
            {/* Desktop: 2 lines */}
            <span className="hidden md:block">{settings.heading.line1} {settings.heading.line2}</span>
            <span className="hidden md:block">{settings.heading.line3}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            {settings.description}
          </p>
          {settings.ctaButton.enabled && (
            <Link
              href={settings.ctaButton.url}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                backgroundColor: settings.ctaButton.color,
                color: settings.ctaButton.textColor,
              }}
            >
              {settings.ctaButton.iconEnabled && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
              {settings.ctaButton.text}
            </Link>
          )}
        </div>
      </main>

      {/* Collapsible Disclaimer Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => setDisclaimerOpen(!disclaimerOpen)}
            className="w-full flex items-center justify-between text-left text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm font-medium">Disclaimer & Legal Information</span>
            <svg
              className={`w-5 h-5 transition-transform ${disclaimerOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {disclaimerOpen && (
            <div className="mt-4 text-xs text-gray-500 space-y-4 animate-in slide-in-from-top-2">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Earnings Disclaimer</h4>
                <p>
                  The strategies, tools, and information provided on this website are for educational and informational purposes only.
                  While we strive to present accurate and reliable content, {companyName} makes no guarantees or promises regarding
                  loan approvals, interest rates, or financial outcomes. Examples provided are for illustrative purposes only and
                  should not be interpreted as guarantees of results. Mortgage approvals and outcomes depend on various factors,
                  including creditworthiness, income, and market conditions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Not Financial or Legal Advice</h4>
                <p>
                  The information on this website does not constitute financial, legal, or tax advice. All mortgage-related decisions
                  should be made after consulting with a qualified financial advisor, attorney, or tax professional.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Contact Permission</h4>
                <p>
                  By submitting your information through this website, you consent to being contacted by {companyName} via email,
                  phone, or text as outlined in our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">General Disclaimer</h4>
                <p>
                  All loan programs, interest rates, and terms mentioned on this website are subject to change without notice and
                  are subject to lender approval. Past results do not guarantee future outcomes. Please carefully review all loan
                  options and associated risks before proceeding.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Licensing & Compliance</h4>
                <p>
                  {companyName} is an Equal Housing Lender. We do not discriminate based on race, color, religion, national origin,
                  sex, handicap, or familial status. {nmlsInfo.replace('Equal Housing Opportunity.', '')}
                  For more information, visit the <a href="https://www.nmlsconsumeraccess.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">NMLS Consumer Access</a> website.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Accessibility Statement</h4>
                <p>
                  We are committed to making our website accessible to all users. If you experience any difficulty accessing content,
                  please contact us at the information below.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Contact Us</h4>
                <p>
                  Email: <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a><br />
                  Phone: <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="text-blue-600 hover:underline">{phone}</a>
                  {address && <><br />{address}</>}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Limited Footer */}
      <footer className="bg-[#171f53] text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            {logoWhiteUrl && (
              <div className="flex-shrink-0">
                {/* Desktop logo */}
                <Image
                  src={logoWhiteUrl}
                  alt={companyName}
                  width={Math.round(logoWhiteHeight * 3.33)}
                  height={logoWhiteHeight}
                  unoptimized
                  className="hidden md:block"
                  style={{ height: `${logoWhiteHeight}px`, width: 'auto' }}
                />
                {/* Mobile logo */}
                <Image
                  src={logoWhiteUrl}
                  alt={companyName}
                  width={Math.round(logoWhiteHeightMobile * 3.33)}
                  height={logoWhiteHeightMobile}
                  unoptimized
                  className="md:hidden"
                  style={{ height: `${logoWhiteHeightMobile}px`, width: 'auto' }}
                />
              </div>
            )}

            {/* Disclosure Text */}
            <div className="text-xs text-gray-400 text-center md:text-right max-w-2xl space-y-1">
              <p>{copyrightText.replace('{{year}}', new Date().getFullYear().toString())}</p>
              <p className="flex items-center justify-center md:justify-end gap-1 flex-wrap">
                {nmlsInfo.replace('Equal Housing Opportunity.', '')}
                <span className="inline-flex items-center whitespace-nowrap">
                  Equal Housing Opportunity.
                  <a
                    href="https://www.nmlsconsumeraccess.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-1 hover:opacity-80 transition-opacity"
                    aria-label="Equal Housing Opportunity"
                  >
                    <svg className="h-4 w-4 inline-block" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgb(156 163 175)' }}>
                      <path d="M12 3L2 12h3v9h14v-9h3L12 3zm0 2.5L18 11v8H6v-8l6-5.5z"/>
                      <rect x="9" y="13" width="6" height="1" fill="currentColor"/>
                      <rect x="9" y="15" width="6" height="1" fill="currentColor"/>
                    </svg>
                  </a>
                </span>
              </p>
              <p className="pt-2">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                {' | '}
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
