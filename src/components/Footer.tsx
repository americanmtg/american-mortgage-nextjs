import Link from 'next/link';
import { client } from '@/lib/sanity';

async function getSiteSettings() {
  return await client.fetch(`*[_type == "siteSettings"][0]`);
}

export default async function Footer() {
  const settings = await getSiteSettings();
  
  const phone = settings?.phone || '1-800-906-8960';
  const email = settings?.email || 'hi@americanmortgage.com';

  const footerColumns = [
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
            <div className="text-xl font-bold text-white mb-4">
              AMERICAN<span className="text-red"> MORTGAGE</span>
            </div>
            <p className="text-sm text-grey-400">
              Making homeownership possible for everyone.
            </p>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                {column.title}
              </h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.url}
                      className="text-sm hover:text-white transition-colors"
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
            American Mortgage is a DBA of Mortgage Research Center, LLC. 
            Copyright © {new Date().getFullYear()} Mortgage Research Center, LLC. All Rights Reserved.
          </p>
          <p>
            NMLS ID #1907 (www.nmlsconsumeraccess.org). Equal Housing Opportunity.
          </p>
        </div>
      </div>

      {/* Sticky CTA Bar */}
      <div className="bg-navy py-4">
        <div className="container-custom flex items-center justify-center gap-4">
          <span className="text-white font-medium hidden sm:inline">
            See what home loan is right for you
          </span>
          <Link href="/apply" className="btn btn-primary">
            Start Here
          </Link>
        </div>
      </div>
    </footer>
  );
}
