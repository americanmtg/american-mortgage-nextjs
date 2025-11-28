import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-grey-50 to-white overflow-hidden">
        <div className="container-custom py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge mb-4">America&apos;s #1 Rated Lender</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy mb-6">
                Your Path To{' '}
                <span className="text-red">Homeownership</span>
              </h1>
              <p className="text-lg text-grey-600 mb-8">
                Low rates. Fast approvals. Expert guidance every step of the way.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href="/apply" className="btn btn-primary text-lg px-8 py-4">
                  Get Pre-Approved
                </Link>
                <Link href="/tools/calculator" className="btn btn-secondary text-lg px-8 py-4">
                  Calculate Payment
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-grey-300 border-2 border-white" />
                  ))}
                </div>
                <div>
                  <div className="text-navy font-bold">98%</div>
                  <div className="text-sm text-grey-500">Would Recommend</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-80 bg-grey-200 rounded-2xl flex items-center justify-center text-grey-400">
                Hero Image
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-navy py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '$10B+', label: 'Loans Funded' },
              { number: '50K+', label: 'Happy Families' },
              { number: '4.9/5', label: 'Customer Rating' },
              { number: '21', label: 'Years Experience' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-grey-300 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Loans */}
      <section className="section-padding bg-white">
        <div className=
