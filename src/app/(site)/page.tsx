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
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="badge mb-4">Loan Options</span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              Find Your Perfect <span className="text-red">Home Loan</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'FHA Loans',
                description: 'Low down payment options for first-time buyers. Credit scores as low as 580.',
                features: ['3.5% Down Payment', 'Flexible Credit Requirements', 'Lower Interest Rates'],
                showDPA: true,
              },
              {
                title: 'Conventional Loans',
                description: 'Traditional financing with competitive rates for qualified buyers.',
                features: ['3% Down Available', 'No PMI with 20% Down', 'Various Term Options'],
                showDPA: false,
              },
              {
                title: 'VA Loans',
                description: 'Exclusive benefits for veterans and active military members.',
                features: ['0% Down Payment', 'No PMI Required', 'Competitive Rates'],
                showDPA: false,
              },
            ].map((loan) => (
              <div key={loan.title} className="card p-6 hover:shadow-xl transition-shadow">
                {loan.showDPA && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-4">
                    DPA Available
                  </span>
                )}
                <h3 className="text-xl font-bold text-navy mb-3">{loan.title}</h3>
                <p className="text-grey-600 mb-4">{loan.description}</p>
                <ul className="space-y-2 mb-6">
                  {loan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-grey-700">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/loans" className="btn btn-secondary w-full">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DPA Section */}
      <section className="section-padding bg-grey-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6">
                Down Payment <span className="text-red">Assistance</span>
              </h2>
              <p className="text-lg text-grey-600 mb-6">
                Don&apos;t let a down payment hold you back. We offer programs to help you get into your home sooner.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Up to $10,000 in assistance',
                  'No repayment required in most cases',
                  'Works with FHA and Conventional loans',
                  'Quick approval process',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-grey-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dpa" className="btn btn-primary">
                Check Eligibility
              </Link>
            </div>
            <div className="w-full h-80 bg-grey-200 rounded-2xl flex items-center justify-center text-grey-400">
              DPA Image
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="badge mb-4">Free Tools</span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              Helpful <span className="text-red">Calculators</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Mortgage Calculator', description: 'Estimate your monthly payment', icon: '🏠' },
              { title: 'Affordability Calculator', description: 'See how much home you can afford', icon: '💰' },
              { title: 'Refinance Calculator', description: 'Calculate your potential savings', icon: '📊' },
            ].map((tool) => (
              <Link 
                key={tool.title}
                href="/tools"
                className="flex items-center gap-4 p-6 bg-grey-50 rounded-xl hover:bg-grey-100 transition-colors"
              >
                <div className="text-4xl">{tool.icon}</div>
                <div>
                  <h3 className="font-semibold text-navy">{tool.title}</h3>
                  <p className="text-sm text-grey-500">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Agent CTA */}
      <section className="section-padding bg-navy">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Talk to a Loan Expert Today
              </h2>
              <p className="text-lg text-grey-300 mb-8">
                Get personalized guidance from our experienced loan officers. 
                We&apos;re here to help you navigate the mortgage process with confidence.
              </p>
              <Link href="/contact" className="btn btn-primary">
                Schedule a Call
              </Link>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-grey-700 rounded-full flex items-center justify-center text-grey-500">
                Agent Photo
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
