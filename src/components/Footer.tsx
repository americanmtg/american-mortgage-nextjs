import Link from 'next/link';
import Image from 'next/image';
import { getSiteSettings, getMediaUrl, getFooter } from '@/lib/data';

export default async function Footer() {
  const [settings, footerData] = await Promise.all([
    getSiteSettings(),
    getFooter(),
  ]);

  const phone = settings?.phone || '1-800-906-8960';
  const email = settings?.email || 'hi@americanmortgage.com';
  const logoWhiteUrl = getMediaUrl(settings?.logoWhite);
  const logoWhiteHeight = settings?.logoWhiteHeight || 60;

  // Use CMS footer data with fallback to defaults
  const tagline = footerData?.tagline || 'Making homeownership possible for everyone.';
  const copyrightText = footerData?.copyrightText || 'American Mortgage is a DBA of Mortgage Research Center, LLC. Copyright {{year}} Mortgage Research Center, LLC. All Rights Reserved.';
  const nmlsInfo = footerData?.nmlsInfo || 'NMLS ID #1907 (www.nmlsconsumeraccess.org). Equal Housing Opportunity.';
  const ctaText = footerData?.ctaText || 'See what home loan is right for you';
  const ctaButtonText = footerData?.ctaButtonText || 'Start Here';
  const ctaButtonUrl = footerData?.ctaButtonUrl || '/apply';

  // Use CMS columns if available, otherwise use defaults
  const footerColumns = footerData?.columns && footerData.columns.length > 0 ? footerData.columns : [
    {
      title: 'Customer Resources',
      links: [
        { label: 'Log In', url: '/login' },
        { label: 'Tools', url: '/tools' },
        { label: 'Learning Center', url: '/learn' },
        { label: 'Affordability Calculator', url: '/tools/affordability' },
        { label: 'Mortgage Calculator', url: '/tools/mortgage' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', url: '/about' },
        { label: 'Careers', url: '/careers' },
        { label: 'Applicant Resources', url: '/resources' },
        { label: phone, url: `tel:${phone.replace(/[^0-9]/g, '')}` },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: email, url: `mailto:${email}` },
        { label: 'Help', url: '/help' },
        { label: 'Contact', url: '/contact' },
        { label: 'Accessibility', url: '/accessibility' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Use', url: '/terms' },
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Licenses', url: '/licenses' },
        { label: 'Disclaimer', url: '/disclaimer' },
      ],
    },
  ];

  return (
    <footer className="bg-grey-900 text-grey-300">
      <div className="container-custom section-padding">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <div style={{ minHeight: `${logoWhiteHeight}px` }} className="mb-4">
              {logoWhiteUrl && (
                <Image
                  src={logoWhiteUrl}
                  alt="American Mortgage"
                  width={Math.round(logoWhiteHeight * 3.33)}
                  height={logoWhiteHeight}
                  style={{ height: `${logoWhiteHeight}px`, width: 'auto' }}
                  unoptimized
                />
              )}
            </div>
            <p className="text-sm text-grey-400">
              {tagline}
            </p>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column: any) => (
            <div key={column.title}>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links?.map((link: any) => (
                  <li key={link.label}>
                    <Link
                      href={link.url}
                      className="text-sm hover:text-white transition-colors"
                      {...(link.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Text */}
        <div className="text-xs text-grey-500 space-y-4 pt-8 border-t border-grey-700">
          <p>
            {copyrightText.replace('{{year}}', new Date().getFullYear().toString())}
          </p>
          <p>
            {nmlsInfo}
          </p>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      <div className="bg-navy py-4">
        <div className="container-custom flex items-center justify-center gap-4">
          <span className="text-white font-medium hidden sm:inline">
            {ctaText}
          </span>
          <Link href={ctaButtonUrl} className="btn btn-primary">
            {ctaButtonText}
          </Link>
        </div>
      </div>
    </footer>
  );
}
