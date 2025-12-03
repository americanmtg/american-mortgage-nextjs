import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Apply for a Mortgage | American Mortgage',
  description: 'Apply for a mortgage with American Mortgage. Our online application is coming soon.',
};

export default function ApplyPage() {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Online Application Coming Soon</h1>

        <p className="text-xl text-gray-600 mb-8">
          We&apos;re working hard to bring you a seamless online mortgage application experience.
          In the meantime, give us a call to get started on your home loan journey.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Apply Now?</h2>
          <p className="text-gray-600 mb-6">
            Our loan officers are standing by to help you with your mortgage application.
          </p>
          <a
            href="tel:870-926-4052"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call (870) 926-4052
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Try Our Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
