import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | American Mortgage',
  description: 'Learn more about American Mortgage and our commitment to helping you achieve homeownership.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us - Coming Soon</h1>

        <p className="text-xl text-gray-600 mb-8">
          We&apos;re putting together our story to share with you. Check back soon to learn more
          about American Mortgage and our dedication to making homeownership accessible.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-600 mb-6">
            Have questions? We&apos;d love to hear from you.
          </p>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Phone:</strong>{' '}
              <a href="tel:870-926-4052" className="text-blue-600 hover:underline">(870) 926-4052</a>
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@americanmtg.com" className="text-blue-600 hover:underline">hello@americanmtg.com</a>
            </p>
            <p>
              <strong>Address:</strong> 122 CR 7185, Jonesboro, AR 72405
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/giveaways"
            className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Enter Our Giveaways
          </Link>
        </div>
      </div>
    </div>
  );
}
