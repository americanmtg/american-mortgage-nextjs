import Link from 'next/link';
import Image from 'next/image';
import { getSiteSettings, getNavigation, getMediaUrl, getHeaderSettings, getMobileMenuButtons } from '@/lib/data';
import MobileMenuButton from './MobileMenuButton';

interface NavItem {
  label: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean | null;
  showOnDesktop?: boolean;
  showOnMobileBar?: boolean;
  showInHamburger?: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: 'About', url: '/about', showOnDesktop: true, showOnMobileBar: false, showInHamburger: true },
  { label: 'Loan Options', url: '/loans', showOnDesktop: true, showOnMobileBar: false, showInHamburger: true },
  { label: 'Calculator', url: '/calculator', showOnDesktop: true, showOnMobileBar: false, showInHamburger: true },
  { label: 'Learn', url: '/learn', showOnDesktop: true, showOnMobileBar: false, showInHamburger: true },
  { label: 'Reviews', url: '/reviews', showOnDesktop: true, showOnMobileBar: false, showInHamburger: true },
];

function HeaderButtonIcon({ icon, color }: { icon: string; color: string }) {
  if (!icon || icon === 'none') return null;
  const iconClass = "w-5 h-5";
  switch (icon) {
    case 'phone':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      );
    case 'home':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'calculator':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'document':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function Header() {
  const [settings, navigation, headerSettings, mobileButtons] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
    getHeaderSettings(),
    getMobileMenuButtons(),
  ]);

  // Use CMS menu if available, otherwise use defaults
  const navItems: NavItem[] = navigation?.mainMenu && navigation.mainMenu.length > 0
    ? navigation.mainMenu.filter((item: any) => item.enabled !== false)
    : defaultNavItems;

  const phone = settings?.phone || '1-800-906-8960';
  const legalBanner = settings?.legalBanner || 'American Mortgage services are not available in NY, NV, NJ, UT, VT.';
  const legalBannerMobile = settings?.legalBannerMobile || legalBanner;
  const legalBannerShowDesktop = settings?.legalBannerShowDesktop ?? true;
  const legalBannerShowMobile = settings?.legalBannerShowMobile ?? true;
  const logoUrl = getMediaUrl(settings?.logo);
  const logoHeight = settings?.logoHeight || 60;

  // Header button settings
  const buttonText = headerSettings?.headerButtonText || 'Apply';
  const buttonUrl = headerSettings?.headerButtonUrl || '/apply';
  const buttonBgColor = headerSettings?.headerButtonBackgroundColor || '#d93c37';
  const buttonTextColor = headerSettings?.headerButtonTextColor || '#ffffff';
  const buttonIcon = headerSettings?.headerButtonIcon || 'none';
  const buttonBorderColor = headerSettings?.headerButtonBorderColor || buttonBgColor;

  // Header background settings
  const bgType = headerSettings?.backgroundType || 'solid';
  const bgColor = headerSettings?.backgroundColor || '#ffffff';
  const gradientStart = headerSettings?.gradientStartColor || '#ffffff';
  const gradientEnd = headerSettings?.gradientEndColor || '#f0f0f0';
  const gradientDir = headerSettings?.gradientDirection || 'to-right';
  const patternType = headerSettings?.patternType || 'dots';
  const patternColor = headerSettings?.patternColor || '#e5e5e5';
  const patternBgColor = headerSettings?.patternBackgroundColor || '#ffffff';
  const bgImageUrl = null; // Not implemented in current data layer
  const bgImageOverlay = headerSettings?.backgroundImageOverlay || 'rgba(255,255,255,0.9)';
  const bgVideoUrl = headerSettings?.backgroundVideoUrl || null;
  const bgVideoOverlay = headerSettings?.backgroundVideoOverlay || 'rgba(255,255,255,0.9)';
  const patternImageUrl = null; // Not implemented in current data layer

  // Generate background style
  const getHeaderStyle = () => {
    switch (bgType) {
      case 'solid':
        return { backgroundColor: bgColor };
      case 'gradient':
        const direction = gradientDir
          .replace('to-right', 'to right')
          .replace('to-left', 'to left')
          .replace('to-bottom', 'to bottom')
          .replace('to-top', 'to top')
          .replace('to-br', 'to bottom right')
          .replace('to-bl', 'to bottom left');
        return { background: `linear-gradient(${direction}, ${gradientStart}, ${gradientEnd})` };
      case 'pattern':
        if (patternType === 'custom' && patternImageUrl) {
          return { backgroundColor: patternBgColor, backgroundImage: `url(${patternImageUrl})`, backgroundRepeat: 'repeat' };
        }
        // CSS patterns
        const patterns: Record<string, string> = {
          dots: `radial-gradient(${patternColor} 1px, ${patternBgColor} 1px)`,
          lines: `repeating-linear-gradient(0deg, ${patternBgColor}, ${patternBgColor} 10px, ${patternColor} 10px, ${patternColor} 11px)`,
          grid: `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, ${patternBgColor} 1px)`,
          diagonal: `repeating-linear-gradient(45deg, ${patternBgColor}, ${patternBgColor} 10px, ${patternColor} 10px, ${patternColor} 11px)`,
        };
        return {
          backgroundImage: patterns[patternType] || patterns.dots,
          backgroundSize: patternType === 'dots' ? '20px 20px' : patternType === 'grid' ? '20px 20px' : undefined,
        };
      case 'image':
        return {
          backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'video':
        return { position: 'relative' as const };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  return (
    <>
      {/* Top Banner - Desktop */}
      {legalBannerShowDesktop && (
        <div className="hidden md:block bg-[#f6f7f7] text-[#323232] text-center py-2 text-sm">
          {legalBanner}
        </div>
      )}
      {/* Top Banner - Mobile */}
      {legalBannerShowMobile && (
        <div className="md:hidden bg-[#f6f7f7] text-[#323232] text-center py-2 text-sm">
          {legalBannerMobile}
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-grey-200 sticky top-0 z-50" style={getHeaderStyle()}>
        {/* Video background */}
        {bgType === 'video' && bgVideoUrl && (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={bgVideoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{ backgroundColor: bgVideoOverlay }} />
          </>
        )}
        {/* Image overlay */}
        {bgType === 'image' && bgImageUrl && (
          <div className="absolute inset-0" style={{ backgroundColor: bgImageOverlay }} />
        )}
        <div className="container-custom relative">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center"
              style={{ height: `${logoHeight}px` }}
            >
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt="American Mortgage"
                  width={Math.round(logoHeight * 3.33)}
                  height={logoHeight}
                  priority
                  unoptimized
                  style={{
                    height: `${logoHeight}px`,
                    width: 'auto'
                  }}
                />
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-8">
              {navItems.filter(item => item.showOnDesktop !== false).map((item) => {
                const isExternal = item.url.startsWith('http') || item.openInNewTab;
                if (isExternal) {
                  return (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0f2e71] hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '18px', fontWeight: 700 }}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.url}
                    className="text-[#0f2e71] hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '18px', fontWeight: 700 }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="text-navy font-semibold">
                {phone}
              </a>
              <Link
                href={buttonUrl}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded font-semibold transition-colors"
                style={{
                  backgroundColor: buttonBgColor,
                  color: buttonTextColor,
                  border: `2px solid ${buttonBorderColor}`,
                }}
              >
                <HeaderButtonIcon icon={buttonIcon} color={buttonTextColor} />
                {buttonText}
              </Link>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            {/* Top row: Logo, Apply Now button, Hamburger */}
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="flex-shrink-0 flex items-center"
                style={{ height: '40px' }}
              >
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="American Mortgage"
                    width={133}
                    height={40}
                    priority
                    unoptimized
                    style={{
                      height: '40px',
                      width: 'auto'
                    }}
                  />
                )}
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href={buttonUrl}
                  className="px-4 py-2 rounded font-semibold text-sm transition-colors"
                  style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                >
                  Apply Now
                </Link>
                <MobileMenuButton navItems={navItems} phone={phone} buttons={mobileButtons} buttonText={buttonText} buttonUrl={buttonUrl} buttonBgColor={buttonBgColor} buttonTextColor={buttonTextColor} />
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200" />
            {/* Mobile bar menu items */}
            <nav className="flex items-center justify-center gap-6 py-3">
              {navItems.filter(item => item.showOnMobileBar).map((item) => (
                <Link key={item.label} href={item.url} className="text-[#0f2e71] font-bold text-sm">{item.label}</Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
