import { Metadata } from 'next';
import Link from 'next/link';
import { getLegalPage } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('terms');
  return {
    title: page?.title ? `${page.title} | American Mortgage` : 'Terms & Conditions | American Mortgage',
    description: page?.metaDescription || 'Terms and Conditions for American Mortgage website and services.',
  };
}

export default async function TermsPage() {
  const page = await getLegalPage('terms');

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Terms &amp; Conditions</h1>
          <p className="text-gray-400 text-sm mt-1">Last updated: December 4, 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">

            {/* Introduction */}
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                By accessing and using the American Mortgage website (americanmtg.com), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">1. Use of Website</h2>
              <p className="text-gray-700 text-sm mb-3">You agree to use this website only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Interfere with the operation of the website</li>
                <li>Attempt to gain unauthorized access to any part of the website</li>
                <li>Transmit any harmful code or malware</li>
              </ul>
            </div>

            {/* Section 2 - Giveaway Terms */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">2. Giveaway Terms</h2>
              <p className="text-gray-700 text-sm mb-4">
                By entering any giveaway or sweepstakes on our website, you agree to the following:
              </p>

              <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Eligibility</h3>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
                <li>You must be 18 years of age or older</li>
                <li>You must be a legal resident of the United States</li>
                <li>Employees of American Mortgage and their immediate family members are not eligible</li>
                <li>Void where prohibited by law</li>
              </ul>

              <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Entry</h3>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
                <li>No purchase necessary to enter or win</li>
                <li>Limit one entry per person per giveaway unless otherwise specified</li>
                <li>Entries must be submitted during the giveaway period</li>
                <li>All entries become the property of American Mortgage</li>
              </ul>

              <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Winner Selection & Prizes</h3>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Winners are selected at random from all eligible entries</li>
                <li>Winners will be notified via email and/or SMS</li>
                <li>Winners must claim their prize within the specified timeframe</li>
                <li>Prizes are non-transferable and cannot be exchanged for cash</li>
                <li>Winners are responsible for any applicable taxes</li>
              </ul>
            </div>

            {/* Section 3 - SMS Terms */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">3. SMS Terms</h2>
              <p className="text-gray-700 text-sm mb-3">
                By providing your phone number and opting in to receive SMS messages, you agree to:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-3">
                <li>Receive automated text messages related to giveaways and services</li>
                <li>Message frequency varies based on activity</li>
                <li>Message and data rates may apply</li>
                <li>You can opt out at any time by replying STOP</li>
                <li>For help, reply HELP or contact us</li>
              </ul>
              <p className="text-gray-700 text-sm">
                Carriers are not liable for delayed or undelivered messages.
              </p>
            </div>

            {/* Section 4 - Mortgage Services */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">4. Mortgage Services</h2>
              <p className="text-gray-700 text-sm mb-3">
                When applying for mortgage services through American Mortgage:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>All loan applications are subject to credit approval</li>
                <li>Rates, terms, and conditions are subject to change without notice</li>
                <li>You must provide accurate and complete information</li>
                <li>We reserve the right to verify all information provided</li>
                <li>Loan terms are governed by separate loan documents</li>
              </ul>
            </div>

            {/* Section 5 - Intellectual Property */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">5. Intellectual Property</h2>
              <p className="text-gray-700 text-sm">
                All content on this website, including text, graphics, logos, images, and software, is the property of American Mortgage or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
              </p>
            </div>

            {/* Section 6 - Disclaimer of Warranties */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">6. Disclaimer of Warranties</h2>
              <p className="text-gray-700 text-sm">
                This website and its content are provided &quot;as is&quot; without warranties of any kind, either express or implied. American Mortgage does not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.
              </p>
            </div>

            {/* Section 7 - Limitation of Liability */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">7. Limitation of Liability</h2>
              <p className="text-gray-700 text-sm">
                To the fullest extent permitted by law, American Mortgage shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the website or services.
              </p>
            </div>

            {/* Section 8 - Indemnification */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">8. Indemnification</h2>
              <p className="text-gray-700 text-sm">
                You agree to indemnify and hold harmless American Mortgage, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the website or violation of these terms.
              </p>
            </div>

            {/* Section 9 - Privacy */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">9. Privacy</h2>
              <p className="text-gray-700 text-sm">
                Your use of this website is also governed by our <Link href="/privacy-policy" className="text-[#181F53] hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
            </div>

            {/* Section 10 - Modifications */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">10. Modifications</h2>
              <p className="text-gray-700 text-sm">
                American Mortgage reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website constitutes acceptance of the modified terms.
              </p>
            </div>

            {/* Section 11 - Governing Law */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">11. Governing Law</h2>
              <p className="text-gray-700 text-sm">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of Arkansas, without regard to its conflict of law provisions.
              </p>
            </div>

            {/* Contact Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">12. Contact Information</h2>
              <p className="text-gray-700 text-sm mb-3">
                If you have any questions about these Terms and Conditions, please contact us:
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
                <Link href="/licenses" className="text-sm text-[#181F53] hover:underline">Licenses</Link>
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
