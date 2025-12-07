/**
 * MortgageProcessSection - Static design for review
 * A polished four-step horizontal timeline showing the mortgage process
 *
 * Design Notes:
 * - Light grey background (#f9fafb) to contrast with white sections
 * - Navy (#181F53) and red (#d93c37) brand colors
 * - Open Sans for body text, Lora for headlines (matching site)
 * - Clean modern spacing with premium feel
 * - Responsive: horizontal on desktop, vertical stack on mobile
 */

export default function MortgageProcessSection() {
  const steps = [
    {
      number: 1,
      title: 'Get Pre-Approved',
      description: 'Know your budget and shop with confidence. A strong pre-approval makes your offer stand out.',
    },
    {
      number: 2,
      title: 'Find Your Home',
      description: 'Once you are under contract, we order the appraisal and start building your loan file.',
    },
    {
      number: 3,
      title: 'Loan Processing',
      description: 'We handle the paperwork, verify your documents, and guide your file through underwriting.',
    },
    {
      number: 4,
      title: 'Close and Get Keys',
      description: 'Sign your final documents and walk away with the keys to your new home.',
    },
  ];

  return (
    <section className="bg-grey-50 py-16 md:py-24">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <span
            className="block text-red text-[18px] font-bold tracking-[0.15em] uppercase mb-3 md:mb-4"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            How It Works
          </span>

          {/* Desktop Headline */}
          <h2
            className="hidden md:block text-navy mb-4"
            style={{
              fontFamily: 'Lora, serif',
              fontSize: '48px',
              fontWeight: 500,
              lineHeight: '56px'
            }}
          >
            Your Path to <span className="text-[#02327d]">Homeownership</span>
          </h2>

          {/* Mobile Headline */}
          <h2
            className="md:hidden text-navy mb-4"
            style={{
              fontFamily: 'Lora, serif',
              fontSize: '32px',
              fontWeight: 500,
              lineHeight: '40px'
            }}
          >
            Your Path to <span className="text-[#02327d]">Homeownership</span>
          </h2>

          <p
            className="text-grey-600 max-w-2xl mx-auto"
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontSize: '18px',
              lineHeight: '28px'
            }}
          >
            We keep you informed at every step. No surprises, no confusion, just
            a clear path from pre-approval to closing day.
          </p>
        </div>

        {/* Desktop Timeline - Horizontal */}
        <div className="hidden lg:block">
          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-navy via-navy-light to-red" />

            {/* Steps Grid */}
            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {/* Number Circle */}
                  <div
                    className={`
                      relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                      text-white text-xl font-bold shadow-lg
                      ${index === steps.length - 1 ? 'bg-red' : 'bg-navy'}
                    `}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.number}
                  </div>

                  {/* Step Title */}
                  <h3
                    className="mt-6 text-navy font-semibold text-lg"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p
                    className="mt-3 text-grey-600 text-sm leading-relaxed max-w-[200px]"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet Timeline - Horizontal Compact */}
        <div className="hidden md:block lg:hidden">
          <div className="relative max-w-3xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-navy via-navy-light to-red" />

            {/* Steps Grid */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {/* Number Circle */}
                  <div
                    className={`
                      relative z-10 w-14 h-14 rounded-full flex items-center justify-center
                      text-white text-lg font-bold shadow-lg
                      ${index === steps.length - 1 ? 'bg-red' : 'bg-navy'}
                    `}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.number}
                  </div>

                  {/* Step Title */}
                  <h3
                    className="mt-5 text-navy font-semibold text-base"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p
                    className="mt-2 text-grey-600 text-xs leading-relaxed"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline - Vertical */}
        <div className="md:hidden">
          <div className="relative max-w-sm mx-auto pl-8">
            {/* Vertical Connecting Line */}
            <div className="absolute top-4 bottom-4 left-[23px] w-0.5 bg-gradient-to-b from-navy via-navy-light to-red" />

            {/* Steps */}
            <div className="space-y-10">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex items-start gap-5">
                  {/* Number Circle */}
                  <div
                    className={`
                      relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      text-white text-base font-bold shadow-lg
                      ${index === steps.length - 1 ? 'bg-red' : 'bg-navy'}
                    `}
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="pt-1">
                    <h3
                      className="text-navy font-semibold text-lg"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="mt-2 text-grey-600 text-sm leading-relaxed"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
