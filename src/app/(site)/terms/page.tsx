import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | American Mortgage',
  description: 'Terms and Conditions for American Mortgage',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms &amp; Conditions</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using the American Mortgage website (americanmtg.com), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Website</h2>
            <p className="text-gray-700 mb-4">You agree to use this website only for lawful purposes and in a way that does not:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Interfere with the operation of the website</li>
              <li>Attempt to gain unauthorized access to any part of the website</li>
              <li>Transmit any harmful code or malware</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Giveaway Terms</h2>
            <p className="text-gray-700 mb-4">
              By entering any giveaway or sweepstakes on our website, you agree to the following:
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Eligibility</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You must be 18 years of age or older</li>
              <li>You must be a legal resident of the United States</li>
              <li>Employees of American Mortgage and their immediate family members are not eligible</li>
              <li>Void where prohibited by law</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Entry</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>No purchase necessary to enter or win</li>
              <li>Limit one entry per person per giveaway unless otherwise specified</li>
              <li>Entries must be submitted during the giveaway period</li>
              <li>All entries become the property of American Mortgage</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Winner Selection</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Winners are selected at random from all eligible entries</li>
              <li>Winners will be notified via email and/or SMS</li>
              <li>Winners must claim their prize within the specified timeframe</li>
              <li>Failure to claim a prize may result in forfeiture and selection of an alternate winner</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">Prizes</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Prizes are non-transferable and cannot be exchanged for cash</li>
              <li>American Mortgage reserves the right to substitute a prize of equal or greater value</li>
              <li>Winners are responsible for any applicable taxes</li>
              <li>Prizes will be shipped to the address provided by the winner</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. SMS Terms</h2>
            <p className="text-gray-700 mb-4">
              By providing your phone number and opting in to receive SMS messages, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Receive automated text messages related to giveaways you enter</li>
              <li>Message frequency varies based on giveaway activity</li>
              <li>Message and data rates may apply</li>
              <li>You can opt out at any time by replying STOP</li>
              <li>For help, reply HELP or contact us</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Carriers are not liable for delayed or undelivered messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content on this website, including text, graphics, logos, images, and software, is the property of American Mortgage or its content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Disclaimer of Warranties</h2>
            <p className="text-gray-700 mb-4">
              This website and its content are provided &quot;as is&quot; without warranties of any kind, either express or implied. American Mortgage does not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the fullest extent permitted by law, American Mortgage shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless American Mortgage, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the website or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of this website is also governed by our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modifications</h2>
            <p className="text-gray-700 mb-4">
              American Mortgage reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to the website. Your continued use of the website constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of Arkansas, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700"><strong>American Mortgage</strong></p>
              <p className="text-gray-700">Email: info@americanmtg.com</p>
              <p className="text-gray-700">Phone: (870) 604-3452</p>
              <p className="text-gray-700">Website: americanmtg.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
