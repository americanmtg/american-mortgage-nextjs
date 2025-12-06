import { Metadata } from 'next';
import Link from 'next/link';
import { getLegalPage } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('licenses');
  return {
    title: page?.title ? `${page.title} | American Mortgage` : 'Licenses & Disclosures | American Mortgage',
    description: page?.metaDescription || 'NMLS licensing information and state disclosures for American Mortgage.',
  };
}

export default async function LicensesPage() {
  const page = await getLegalPage('licenses');

  // Use database values or fallbacks
  const contact = {
    company: page?.contactCompany || 'American Mortgage',
    nmlsId: page?.contactNmlsId || '',
    address: page?.contactAddress || '',
    email: page?.contactEmail || 'info@americanmtg.com',
    phone: page?.contactPhone || '',
    website: page?.contactWebsite || 'americanmtg.com',
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-[#181F53] py-6 md:py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Licenses &amp; Disclosures</h1>
          <p className="text-gray-400 text-sm mt-1">NMLS licensing and regulatory information</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">

            {/* NMLS Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Company NMLS Information</h2>
              <div className="bg-[#181F53]/5 border border-[#181F53]/20 rounded-lg p-4 mb-4">
                <p className="text-gray-700 text-sm mb-2">
                  <strong>{contact.company}</strong>
                </p>
                {contact.nmlsId && (
                  <p className="text-gray-700 text-sm mb-2">
                    NMLS ID: <strong>{contact.nmlsId}</strong>
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  You can verify our NMLS registration at{' '}
                  <a
                    href="https://www.nmlsconsumeraccess.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#181F53] hover:underline"
                  >
                    www.nmlsconsumeraccess.org
                  </a>
                </p>
              </div>
              <p className="text-gray-700 text-sm">
                American Mortgage is a mortgage broker licensed to conduct business in the State of Arkansas. As required by law, we provide the following licensing and disclosure information.
              </p>
            </div>

            {/* State Licenses */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">State Licenses</h2>
              <p className="text-gray-700 text-sm mb-4">
                American Mortgage is licensed to operate in the following states:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-gray-800">Arkansas</p>
                  {contact.nmlsId && <p className="text-xs text-gray-500">License #{contact.nmlsId}</p>}
                </div>
                {/* Add more states as needed */}
              </div>
              <p className="text-gray-500 text-xs mt-4 italic">
                * Licensing information is subject to change. Please verify current licensing status at nmlsconsumeraccess.org
              </p>
            </div>

            {/* Equal Housing */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Equal Housing Lender</h2>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z"/>
                    <path d="M12 10a2 2 0 100 4 2 2 0 000-4z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700 text-sm">
                    American Mortgage is an Equal Housing Lender. We do not discriminate on the basis of race, color, religion, national origin, sex, handicap, familial status, or any other protected class in accordance with the Fair Housing Act and other applicable laws.
                  </p>
                </div>
              </div>
            </div>

            {/* Regulatory Compliance */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Regulatory Compliance</h2>
              <p className="text-gray-700 text-sm mb-3">
                American Mortgage is committed to compliance with all applicable federal and state regulations, including:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                <li>
                  <strong>SAFE Act (Secure and Fair Enforcement for Mortgage Licensing Act)</strong> - All mortgage loan originators are licensed and registered through the Nationwide Multistate Licensing System (NMLS)
                </li>
                <li>
                  <strong>TILA (Truth in Lending Act)</strong> - We provide clear and accurate disclosure of loan terms and costs
                </li>
                <li>
                  <strong>RESPA (Real Estate Settlement Procedures Act)</strong> - We comply with all disclosure requirements related to settlement services
                </li>
                <li>
                  <strong>ECOA (Equal Credit Opportunity Act)</strong> - We do not discriminate against any applicant on a prohibited basis
                </li>
                <li>
                  <strong>GLBA (Gramm-Leach-Bliley Act)</strong> - We protect the privacy and security of consumer financial information
                </li>
                <li>
                  <strong>HMDA (Home Mortgage Disclosure Act)</strong> - We maintain records and report data as required by law
                </li>
              </ul>
            </div>

            {/* Consumer Resources */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Consumer Resources</h2>
              <p className="text-gray-700 text-sm mb-3">
                For more information about mortgage lending and your rights as a consumer:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.consumerfinance.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#181F53] hover:underline"
                  >
                    Consumer Financial Protection Bureau (CFPB)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nmlsconsumeraccess.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#181F53] hover:underline"
                  >
                    NMLS Consumer Access
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.hud.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#181F53] hover:underline"
                  >
                    U.S. Department of Housing and Urban Development (HUD)
                  </a>
                </li>
              </ul>
            </div>

            {/* Complaints */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Filing a Complaint</h2>
              <p className="text-gray-700 text-sm mb-3">
                If you have a complaint about our services, you may contact:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
                <li>American Mortgage directly at {contact.email}{contact.phone ? ` or ${contact.phone}` : ''}</li>
                <li>Arkansas Securities Department</li>
                <li>Consumer Financial Protection Bureau at consumerfinance.gov/complaint</li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Contact Us</h2>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="text-gray-700 font-medium">{contact.company}</p>
                {contact.nmlsId && <p className="text-gray-600">NMLS ID: {contact.nmlsId}</p>}
                {contact.address && <p className="text-gray-600">{contact.address}</p>}
                <p className="text-gray-600">Email: {contact.email}</p>
                {contact.phone && <p className="text-gray-600">Phone: {contact.phone}</p>}
                <p className="text-gray-600">Website: {contact.website}</p>
              </div>
            </div>

            {/* Related Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Related Pages:</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy-policy" className="text-sm text-[#181F53] hover:underline">Privacy Policy</Link>
                <span className="text-gray-300">|</span>
                <Link href="/terms" className="text-sm text-[#181F53] hover:underline">Terms & Conditions</Link>
                <span className="text-gray-300">|</span>
                <Link href="/disclaimer" className="text-sm text-[#181F53] hover:underline">Disclaimer</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
