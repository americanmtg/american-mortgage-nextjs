import Link from 'next/link';
import Image from 'next/image';
import { getSiteSettings, getNavigation, getMediaUrl, getHeaderSettings } from '@/lib/data';
import MobileMenuButton from './MobileMenuButton';

interface NavItem {
  label: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean | null;
}

const defaultNavItems: NavItem[] = [
  { label: 'About', url: '/about' },
  { label: 'Loan Options', url: '/loans' },
  { label: 'Calculator', url: '/calculator' },
  { label: 'Learn', url: '/learn' },
  { label: 'Reviews', url: '/reviews' },
];

export default async function Header() {
  const [settings, navigation, headerSettings] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
    getHeaderSettings(),
  ]);

  // Use CMS menu if available, otherwise use defaults
  const navItems: NavItem[] = navigation?.mainMenu && navigation.mainMenu.length > 0
    ? navigation.mainMenu.filter((item: any) => item.enabled !== false)
    : defaultNavItems;

  const phone = settings?.phone || '1-800-906-8960';
  const legalBanner = settings?.legalBanner || 'American Mortgage services are not available in NY, NV, NJ, UT, VT.';
  const logoUrl = getMediaUrl(settings?.logo);
  const logoHeight = settings?.logoHeight || 60;

  // Header button settings
  const buttonText = headerSettings?.headerButtonText || 'Apply';
  const buttonUrl = headerSettings?.headerButtonUrl || '/apply';
  const buttonBgColor = headerSettings?.headerButtonBackgroundColor || '#d93c37';
  const buttonTextColor = headerSettings?.headerButtonTextColor || '#ffffff';

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
      {/* Top Banner */}
      <div className="bg-[#f6f7f7] text-[#323232] text-center py-2 text-sm">
        {legalBanner}
      </div>

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
          <div className="flex items-center justify-between h-20">
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
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => {
                const isExternal = item.url.startsWith('http') || item.openInNewTab;
                if (isExternal) {
                  return (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-grey-700 font-medium hover:text-navy transition-colors"
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.url}
                    className="text-grey-700 font-medium hover:text-navy transition-colors"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="text-navy font-semibold">
                {phone}
              </a>
              <Link
                href={buttonUrl}
                className="btn btn-primary"
                style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              >
                {buttonText}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <MobileMenuButton navItems={navItems} phone={phone} buttonText={buttonText} buttonUrl={buttonUrl} buttonBgColor={buttonBgColor} buttonTextColor={buttonTextColor} />
          </div>
        </div>
      </header>
    </>
  );
}
