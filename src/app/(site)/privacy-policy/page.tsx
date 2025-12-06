import { Metadata } from 'next';
import Link from 'next/link';
import { getLegalPage } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage('privacy-policy');
  return {
    title: page?.title ? `${page.title} | American Mortgage` : 'Privacy Policy | American Mortgage',
    description: page?.metaDescription || 'Privacy Policy for American Mortgage - How we collect, use, and protect your personal information.',
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getLegalPage('privacy-policy');

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Privacy Policy</h1>
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
                American Mortgage (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, participate in our giveaways, or use our mortgage services.
              </p>
            </div>

            {/* Section 1 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">1. Information We Collect</h2>

              <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Personal Information</h3>
              <p className="text-gray-700 text-sm mb-3">We may collect personal information that you voluntarily provide, including:</p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
                <li>Name, email address, and phone number</li>
                <li>Mailing address (for prize fulfillment or mortgage services)</li>
                <li>Social Security Number (for mortgage applications only)</li>
                <li>Financial information (income, employment, assets - for mortgage applications)</li>
                <li>Any other information you choose to provide</li>
              </ul>

              <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">Automatically Collected Information</h3>
              <p className="text-gray-700 text-sm mb-3">When you visit our website, we may automatically collect:</p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>IP address, browser type, and device information</li>
                <li>Pages visited and time spent on our site</li>
                <li>Referring website and search terms</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">2. How We Use Your Information</h2>
              <p className="text-gray-700 text-sm mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Process mortgage applications and provide lending services</li>
                <li>Process and manage giveaway entries</li>
                <li>Notify winners and fulfill prizes</li>
                <li>Send communications via email and SMS (with your consent)</li>
                <li>Respond to inquiries and provide customer support</li>
                <li>Improve our website and services</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </div>

            {/* Section 3 - GLBA Notice */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">3. Gramm-Leach-Bliley Act (GLBA) Notice</h2>
              <p className="text-gray-700 text-sm mb-3">
                As a mortgage company, we are required to comply with the Gramm-Leach-Bliley Act. We collect nonpublic personal information about you from:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-4">
                <li>Information you provide on applications or other forms</li>
                <li>Information about your transactions with us or others</li>
                <li>Information from consumer reporting agencies</li>
              </ul>
              <p className="text-gray-700 text-sm">
                We do not disclose nonpublic personal information about our customers or former customers to anyone, except as permitted by law. We maintain physical, electronic, and procedural safeguards to protect your nonpublic personal information.
              </p>
            </div>

            {/* Section 4 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">4. SMS/Text Messaging</h2>
              <p className="text-gray-700 text-sm mb-3">
                By providing your phone number and consenting to receive SMS notifications, you agree to receive text messages from American Mortgage, which may include:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1 mb-3">
                <li>Entry confirmations and winner notifications</li>
                <li>Loan status updates and reminders</li>
                <li>Prize claim reminders</li>
              </ul>
              <p className="text-gray-700 text-sm">
                <strong>Message frequency varies.</strong> Message and data rates may apply. Opt out anytime by replying STOP. For help, reply HELP or contact us.
              </p>
            </div>

            {/* Section 5 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">5. Information Sharing</h2>
              <p className="text-gray-700 text-sm mb-3">
                We do not sell, trade, or rent your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li><strong>Service Providers:</strong> Companies that help us operate (email, SMS, payment processing)</li>
                <li><strong>Regulatory Authorities:</strong> As required by NMLS and applicable lending regulations</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">6. Data Security</h2>
              <p className="text-gray-700 text-sm">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure servers, and regular security assessments. However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            {/* Section 7 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">7. Your Rights</h2>
              <p className="text-gray-700 text-sm mb-3">You have the right to:</p>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal retention requirements)</li>
                <li>Opt out of marketing communications</li>
                <li>Opt out of SMS messages by replying STOP</li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">8. Cookies</h2>
              <p className="text-gray-700 text-sm">
                Our website uses cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings.
              </p>
            </div>

            {/* Section 9 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">9. Children&apos;s Privacy</h2>
              <p className="text-gray-700 text-sm">
                Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </div>

            {/* Section 10 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">10. Changes to This Policy</h2>
              <p className="text-gray-700 text-sm">
                We may update this Privacy Policy from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date.
              </p>
            </div>

            {/* Contact Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">11. Contact Us</h2>
              <p className="text-gray-700 text-sm mb-3">
                If you have questions about this Privacy Policy, please contact us:
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
                <Link href="/terms" className="text-sm text-[#181F53] hover:underline">Terms & Conditions</Link>
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
