import { Metadata } from 'next';
import Link from 'next/link';
import { getLegalPage } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('disclaimer');
  return {
    title: page?.title ? `${page.title} | American Mortgage` : 'Disclaimer | American Mortgage',
    description: page?.metaDescription || 'Important disclaimers and disclosures for American Mortgage services.',
  };
}

export default async function DisclaimerPage() {
  const page = await getLegalPage('disclaimer');

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Disclaimer</h1>
          <p className="text-gray-400 text-sm mt-1">Important disclosures and legal notices</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">

            {/* General Disclaimer */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">General Disclaimer</h2>
              <p className="text-gray-700 text-sm mb-3">
                The information provided on this website is for general informational purposes only. American Mortgage makes no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the website.
              </p>
              <p className="text-gray-700 text-sm">
                Any reliance you place on such information is strictly at your own risk. In no event will American Mortgage be liable for any loss or damage including without limitation, indirect or consequential loss or damage arising from the use of this website.
              </p>
            </div>

            {/* Mortgage Disclaimer */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Mortgage & Loan Information</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 text-sm font-medium mb-2">Important Notice</p>
                <p className="text-amber-700 text-sm">
                  This is not a commitment to lend. All loan applications are subject to credit approval. Rates, terms, and conditions are subject to change without notice.
                </p>
              </div>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                <li>All mortgage loans are subject to credit and property approval</li>
                <li>Interest rates and APRs shown are subject to change and may vary based on credit score, loan amount, and other factors</li>
                <li>Monthly payment examples do not include taxes, insurance, or PMI which may increase your payment</li>
                <li>Pre-qualification is not a commitment to lend and does not guarantee approval</li>
                <li>Loan terms and availability may vary by state and are subject to regulatory requirements</li>
                <li>Down payment assistance programs are subject to availability and qualification requirements</li>
              </ul>
            </div>

            {/* Rate Disclaimer */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Rate & APR Disclaimer</h2>
              <p className="text-gray-700 text-sm mb-3">
                Interest rates and Annual Percentage Rates (APR) displayed on this website are for informational purposes only and may not reflect current market rates. Actual rates may vary based on:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Credit score and credit history</li>
                <li>Loan-to-value ratio</li>
                <li>Property type and occupancy</li>
                <li>Loan amount and term</li>
                <li>Market conditions at time of lock</li>
                <li>State-specific requirements</li>
              </ul>
            </div>

            {/* Calculator Disclaimer */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Calculator Disclaimer</h2>
              <p className="text-gray-700 text-sm">
                Any calculators or tools provided on this website are for illustrative purposes only. Results are estimates based on the information you provide and may not reflect actual loan terms, payments, or costs. These tools do not constitute a loan offer or commitment. For accurate quotes and information, please contact us directly.
              </p>
            </div>

            {/* Third-Party Links */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Third-Party Links</h2>
              <p className="text-gray-700 text-sm">
                This website may contain links to external websites that are not operated by American Mortgage. We have no control over the content and practices of these sites and cannot accept responsibility for their respective content, privacy policies, or practices. Linking to external websites does not constitute an endorsement.
              </p>
            </div>

            {/* No Professional Advice */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Not Professional Advice</h2>
              <p className="text-gray-700 text-sm mb-3">
                The content on this website is not intended to be a substitute for professional financial, legal, or tax advice. Always seek the advice of qualified professionals regarding:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Financial planning and investment decisions</li>
                <li>Legal matters related to real estate transactions</li>
                <li>Tax implications of mortgage interest and homeownership</li>
                <li>Insurance coverage and requirements</li>
              </ul>
            </div>

            {/* Fair Lending */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Fair Lending Statement</h2>
              <p className="text-gray-700 text-sm">
                American Mortgage is committed to fair lending practices. We do not discriminate in lending or advertising on the basis of race, color, religion, national origin, sex, marital status, age (provided the applicant has the capacity to contract), receipt of income from public assistance, or exercise of any right under the Consumer Credit Protection Act. We comply with all applicable federal and state fair lending laws and regulations.
              </p>
            </div>

            {/* NMLS Notice */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">NMLS Disclosure</h2>
              <p className="text-gray-700 text-sm mb-3">
                American Mortgage is registered with the Nationwide Multistate Licensing System (NMLS). For consumer information and verification of our licensing status, visit:
              </p>
              <a
                href="https://www.nmlsconsumeraccess.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#181F53] hover:underline text-sm"
              >
                www.nmlsconsumeraccess.org
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Changes */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Changes to This Disclaimer</h2>
              <p className="text-gray-700 text-sm">
                American Mortgage reserves the right to modify this disclaimer at any time without prior notice. Your continued use of the website following any changes constitutes acceptance of the modified disclaimer.
              </p>
            </div>

            {/* Contact Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Questions?</h2>
              <p className="text-gray-700 text-sm mb-3">
                If you have any questions about this disclaimer, please contact us:
              </p>
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
                <Link href="/licenses" className="text-sm text-[#181F53] hover:underline">Licenses</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
