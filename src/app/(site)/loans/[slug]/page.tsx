import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLoanProductBySlug, getOtherLoanProducts, getLoanPageWidgets } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Default loan content - will be overridden by database content when available
const defaultLoanContent: Record<string, {
  intro: string;
  sections: { title: string; content: string }[];
  requirements: string[];
  faqs: { q: string; a: string }[];
}> = {
  conventional: {
    intro: "Conventional loans are the most popular type of mortgage, offering competitive rates and flexible terms for qualified borrowers. Unlike government-backed loans, conventional mortgages are not insured by federal agencies, which often means stricter qualification requirements but potentially lower costs for those who qualify.",
    sections: [
      {
        title: "Who Should Consider a Conventional Loan?",
        content: "Conventional loans are ideal for borrowers with good to excellent credit scores (typically 620 or higher), stable income, and the ability to make a down payment. If you have a strong financial profile, you may qualify for better interest rates than government-backed alternatives. These loans work well for primary residences, second homes, and investment properties."
      },
      {
        title: "Down Payment Options",
        content: "While 20% down is often cited as the standard, many conventional loan programs allow down payments as low as 3% for first-time homebuyers. However, putting down less than 20% typically requires private mortgage insurance (PMI), which adds to your monthly payment until you build sufficient equity in your home."
      },
      {
        title: "Loan Limits and Terms",
        content: "Conventional loans have conforming loan limits set by the Federal Housing Finance Agency (FHFA). For 2024, the baseline limit is $766,550 in most areas, with higher limits in expensive markets. You can choose from various term lengths, with 30-year and 15-year fixed-rate mortgages being the most common options."
      }
    ],
    requirements: [
      "Minimum credit score of 620 (higher scores get better rates)",
      "Debt-to-income ratio typically below 43-45%",
      "Stable employment history (usually 2+ years)",
      "Down payment of 3-20% depending on the program",
      "Private mortgage insurance if down payment is less than 20%"
    ],
    faqs: [
      { q: "What's the difference between conventional and FHA loans?", a: "Conventional loans typically require higher credit scores and larger down payments but often have lower overall costs for qualified borrowers. FHA loans are more accessible but include mortgage insurance for the life of the loan." },
      { q: "Can I remove PMI from a conventional loan?", a: "Yes! Once you reach 20% equity in your home, you can request PMI removal. It's automatically removed at 22% equity." },
      { q: "Are conventional loans only for primary residences?", a: "No, conventional loans can be used for primary residences, second homes, and investment properties, making them very versatile." }
    ]
  },
  fha: {
    intro: "FHA loans are government-backed mortgages insured by the Federal Housing Administration, designed to make homeownership accessible to more Americans. With lower down payment requirements and more flexible credit standards, FHA loans are particularly popular among first-time homebuyers and those rebuilding their credit.",
    sections: [
      {
        title: "Why Choose an FHA Loan?",
        content: "FHA loans offer several advantages that make them attractive to many borrowers. The minimum down payment is just 3.5% with a credit score of 580 or higher, and borrowers with scores between 500-579 may still qualify with a 10% down payment. FHA loans also allow higher debt-to-income ratios and are more forgiving of past credit issues."
      },
      {
        title: "Understanding FHA Mortgage Insurance",
        content: "FHA loans require two types of mortgage insurance: an upfront mortgage insurance premium (UFMIP) of 1.75% of the loan amount, and an annual mortgage insurance premium (MIP) paid monthly. Unlike conventional PMI, FHA mortgage insurance typically remains for the life of the loan unless you refinance to a conventional mortgage."
      },
      {
        title: "Property Requirements",
        content: "FHA loans have specific property requirements to ensure the home is safe, secure, and structurally sound. The property must be your primary residence and meet FHA minimum property standards. An FHA-approved appraiser will assess the home during the buying process."
      }
    ],
    requirements: [
      "Minimum credit score of 580 for 3.5% down payment",
      "Credit scores 500-579 may qualify with 10% down",
      "Property must be your primary residence",
      "Debt-to-income ratio up to 43% (sometimes higher)",
      "Steady employment history",
      "Property must meet FHA minimum standards"
    ],
    faqs: [
      { q: "Can I use an FHA loan for a second home?", a: "No, FHA loans are only available for primary residences. You must intend to live in the home as your main residence." },
      { q: "How long do I pay FHA mortgage insurance?", a: "For loans with less than 10% down, MIP is required for the life of the loan. With 10% or more down, MIP can be removed after 11 years." },
      { q: "Can I use gift funds for my down payment?", a: "Yes, FHA allows 100% of your down payment to come from gift funds from family members, employers, or approved organizations." }
    ]
  },
  va: {
    intro: "VA loans are a powerful benefit earned by those who have served our country. Guaranteed by the U.S. Department of Veterans Affairs, these loans offer exceptional terms including no down payment requirement, no private mortgage insurance, and competitive interest rates. It's our privilege to help veterans and active-duty service members access this well-deserved benefit.",
    sections: [
      {
        title: "Eligibility Requirements",
        content: "VA loans are available to veterans, active-duty service members, National Guard and Reserve members, and certain surviving spouses. Eligibility is based on length and character of service. You'll need a Certificate of Eligibility (COE) to prove your entitlement, which we can help you obtain."
      },
      {
        title: "The Zero Down Payment Advantage",
        content: "One of the most significant benefits of a VA loan is the ability to purchase a home with no down payment. This allows veterans to become homeowners without saving for years. Combined with no PMI requirement, VA loans often have the lowest monthly payments of any mortgage option."
      },
      {
        title: "VA Funding Fee",
        content: "While VA loans don't require PMI, there is a one-time VA funding fee that helps sustain the program. The fee ranges from 1.25% to 3.3% of the loan amount, depending on your down payment and whether it's your first VA loan. Veterans with service-connected disabilities may be exempt from this fee."
      }
    ],
    requirements: [
      "Valid Certificate of Eligibility (COE)",
      "Meet minimum service requirements",
      "Satisfactory credit history (typically 620+ score)",
      "Sufficient income to cover mortgage payments",
      "Property must be your primary residence",
      "Meet VA minimum property requirements"
    ],
    faqs: [
      { q: "Can I use a VA loan more than once?", a: "Yes! VA loan entitlement can be restored and reused. You can have multiple VA loans over your lifetime, and in some cases, more than one at a time." },
      { q: "Do VA loans have loan limits?", a: "For veterans with full entitlement, there are no VA loan limits. Those with reduced entitlement may have limits based on the county." },
      { q: "Can surviving spouses qualify for VA loans?", a: "Yes, un-remarried surviving spouses of veterans who died in service or from a service-connected disability may be eligible." }
    ]
  },
  usda: {
    intro: "USDA loans, backed by the U.S. Department of Agriculture, provide a path to homeownership for moderate-income families in rural and suburban areas. With no down payment required and competitive rates, these loans make buying a home more accessible for those in eligible locations.",
    sections: [
      {
        title: "Location Eligibility",
        content: "Despite the name, USDA loans aren't just for farms. Many suburban areas and small towns qualify, including areas near major cities. The USDA eligibility map includes approximately 97% of U.S. land area. We can help you determine if your desired location qualifies."
      },
      {
        title: "Income Requirements",
        content: "USDA loans are designed for moderate-income households. Your household income must not exceed 115% of the area median income. This is based on total household income, not just the borrower's income. Income limits vary by location and household size."
      },
      {
        title: "USDA Guarantee Fee",
        content: "USDA loans require an upfront guarantee fee of 1% of the loan amount and an annual fee of 0.35% paid monthly. These fees are typically lower than FHA mortgage insurance premiums, making USDA loans an affordable option for eligible buyers."
      }
    ],
    requirements: [
      "Property must be in USDA-eligible rural area",
      "Household income at or below 115% of area median",
      "Must be your primary residence",
      "Credit score typically 640+ (some flexibility available)",
      "Stable income and employment",
      "U.S. citizenship or permanent residency"
    ],
    faqs: [
      { q: "What areas are eligible for USDA loans?", a: "Many suburban and rural areas qualify. Use the USDA eligibility map or contact us to check if a specific address is eligible." },
      { q: "Is there really no down payment required?", a: "Correct! USDA loans offer 100% financing, meaning no down payment is required. You'll still need funds for closing costs." },
      { q: "Can I include closing costs in my loan?", a: "In some cases, closing costs can be rolled into the loan if the appraised value exceeds the purchase price." }
    ]
  },
  jumbo: {
    intro: "When your dream home exceeds conventional loan limits, a jumbo loan provides the financing you need. These loans are designed for high-value properties and luxury homes, offering substantial loan amounts with competitive terms for well-qualified borrowers.",
    sections: [
      {
        title: "What Makes a Loan \"Jumbo\"?",
        content: "A jumbo loan exceeds the conforming loan limits set by the Federal Housing Finance Agency. For 2024, this means loan amounts above $766,550 in most areas (higher in expensive markets like California and New York). These loans are not eligible for purchase by Fannie Mae or Freddie Mac."
      },
      {
        title: "Qualification Requirements",
        content: "Because jumbo loans represent larger risk for lenders, qualification requirements are typically stricter. Expect to need excellent credit (usually 700+), substantial assets, a larger down payment (often 10-20%), and a lower debt-to-income ratio. Documentation requirements are also more thorough."
      },
      {
        title: "Interest Rates and Terms",
        content: "Historically, jumbo loan rates were higher than conforming loans, but today they're often competitive and sometimes even lower. Jumbo loans are available in fixed and adjustable-rate options with various term lengths. Some programs offer interest-only options for qualified borrowers."
      }
    ],
    requirements: [
      "Excellent credit score (typically 700-720+)",
      "Down payment of 10-20% or more",
      "Lower debt-to-income ratio (usually under 43%)",
      "Substantial cash reserves (often 6-12 months)",
      "Thorough income and asset documentation",
      "Property appraisal from qualified appraiser"
    ],
    faqs: [
      { q: "Are jumbo loan rates higher than conventional?", a: "Not necessarily. Jumbo rates are often competitive with conforming loans and sometimes even lower, depending on your qualifications." },
      { q: "Can I get a jumbo loan with less than 20% down?", a: "Some programs offer jumbo loans with 10% down, though PMI may be required. Terms vary by lender and qualification." },
      { q: "Is there a maximum jumbo loan amount?", a: "Maximum amounts vary by lender. Many offer jumbo loans up to $2-3 million, with some extending to $5 million or more for qualified borrowers." }
    ]
  },
  refinance: {
    intro: "Refinancing your mortgage can be a smart financial move, whether you want to lower your monthly payment, reduce your interest rate, shorten your loan term, or access your home's equity. With various refinancing options available, we'll help you find the right solution for your goals.",
    sections: [
      {
        title: "Rate-and-Term Refinancing",
        content: "The most common type of refinance, rate-and-term refinancing replaces your current mortgage with a new one at a different interest rate, term length, or both. This can lower your monthly payment, reduce the total interest paid, or help you pay off your home faster."
      },
      {
        title: "Cash-Out Refinancing",
        content: "If you've built equity in your home, a cash-out refinance lets you borrow more than you owe and receive the difference in cash. This can be used for home improvements, debt consolidation, education expenses, or other financial needs. You'll typically need at least 20% equity remaining after the refinance."
      },
      {
        title: "Streamline Refinancing",
        content: "If you have an FHA, VA, or USDA loan, you may qualify for a streamline refinance with reduced documentation and faster processing. These programs are designed to make refinancing easier for borrowers who are current on their existing government-backed loans."
      }
    ],
    requirements: [
      "Sufficient equity in your home",
      "Good payment history on current mortgage",
      "Stable income and employment",
      "Credit score requirements vary by program",
      "Debt-to-income ratio within guidelines",
      "Property appraisal (may be waived for some streamline programs)"
    ],
    faqs: [
      { q: "When does refinancing make sense?", a: "Generally, if you can reduce your rate by 0.5-1% or more, plan to stay in your home long enough to recoup closing costs, or need to access equity, refinancing may be beneficial." },
      { q: "What are the costs of refinancing?", a: "Closing costs typically range from 2-5% of the loan amount. Some lenders offer no-closing-cost options in exchange for a slightly higher rate." },
      { q: "Can I refinance with bad credit?", a: "Options exist, though rates may be higher. FHA streamline refinances focus on payment history rather than credit scores." }
    ]
  },
  'non-qm': {
    intro: "Non-QM (Non-Qualified Mortgage) loans provide flexible financing solutions for borrowers who don't fit the traditional lending mold. Whether you're self-employed, a real estate investor, or have non-traditional income sources, these programs offer alternative ways to qualify for a mortgage.",
    sections: [
      {
        title: "DSCR Loans for Investors",
        content: "Debt Service Coverage Ratio (DSCR) loans are designed for real estate investors and are qualified based on the property's rental income rather than personal income. If the rental income covers the mortgage payment, you may qualify regardless of your personal tax returns or employment status. This makes DSCR loans ideal for building a rental portfolio."
      },
      {
        title: "Bank Statement Programs",
        content: "Bank statement loans allow self-employed borrowers to qualify using 12-24 months of personal or business bank statements instead of tax returns. This is perfect for business owners who show less income on tax returns due to legitimate deductions but have strong cash flow through their accounts."
      },
      {
        title: "1099 and Asset-Based Programs",
        content: "1099 programs are designed for independent contractors and gig economy workers who receive 1099 income. Asset-based programs allow you to qualify using liquid assets like savings, investments, or retirement accounts. These flexible options help borrowers with non-traditional income documentation become homeowners."
      }
    ],
    requirements: [
      "Minimum credit score typically 620-660+",
      "Down payment requirements vary (often 10-25%)",
      "DSCR: Property must generate sufficient rental income",
      "Bank statement: 12-24 months of statements required",
      "1099: Two years of 1099 income documentation",
      "Asset-based: Sufficient liquid assets to qualify"
    ],
    faqs: [
      { q: "What does Non-QM mean?", a: "Non-QM refers to mortgages that don't meet the Consumer Financial Protection Bureau's 'Qualified Mortgage' standards. They're not subprime loans—they simply use alternative documentation methods for qualified borrowers." },
      { q: "Are Non-QM loan rates higher?", a: "Non-QM rates are typically 0.5-2% higher than conventional loans due to the additional flexibility they offer. However, they make homeownership possible for many who wouldn't otherwise qualify." },
      { q: "Can I use a Non-QM loan for investment properties?", a: "Yes! DSCR loans are specifically designed for investment properties. Other Non-QM programs can also be used for investment properties depending on the program requirements." }
    ]
  }
};

// Icon components
const icons: Record<string, React.ReactNode> = {
  home: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  star: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  currency: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
      <line x1="8" y1="6" x2="16" y2="6" strokeWidth={2} />
      <line x1="8" y1="10" x2="10" y2="10" strokeWidth={2} />
      <line x1="14" y1="10" x2="16" y2="10" strokeWidth={2} />
      <line x1="8" y1="14" x2="10" y2="14" strokeWidth={2} />
      <line x1="14" y1="14" x2="16" y2="14" strokeWidth={2} />
    </svg>
  ),
  user: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const loan = await getLoanProductBySlug(slug);

  if (!loan) {
    return {
      title: 'Loan Not Found | American Mortgage',
    };
  }

  return {
    title: `${loan.name} | American Mortgage`,
    description: loan.description || `Learn about ${loan.name} from American Mortgage. ${loan.tagline}`,
  };
}

export default async function LoanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [loan, otherLoans, widgets] = await Promise.all([
    getLoanProductBySlug(slug),
    getOtherLoanProducts(slug),
    getLoanPageWidgets(),
  ]);

  if (!loan) {
    notFound();
  }

  // Use database content if available, otherwise use defaults
  const dbSections = loan.article_sections as { title: string; content: string }[] | null;
  const dbFaqs = loan.article_faqs as { q: string; a: string }[] | null;

  const content = {
    intro: loan.article_intro || defaultLoanContent[slug]?.intro || loan.description || '',
    sections: (dbSections && dbSections.length > 0) ? dbSections : (defaultLoanContent[slug]?.sections || []),
    requirements: (loan.article_requirements && loan.article_requirements.length > 0)
      ? loan.article_requirements
      : (defaultLoanContent[slug]?.requirements || loan.highlights || []),
    faqs: (dbFaqs && dbFaqs.length > 0) ? dbFaqs : (defaultLoanContent[slug]?.faqs || [])
  };

  // Filter widgets for desktop sidebar
  const desktopWidgets = widgets.filter(w => w.show_on_desktop);

  return (
    <>
      {/* Hero Section - Compact (matching /loans) */}
      <section className="bg-[#181F53] py-6 md:py-8">
        <div className="container-custom">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/loans" className="hover:text-white transition-colors">Loan Programs</Link>
              <span>/</span>
              <span className="text-gray-300">{loan.name}</span>
            </nav>

            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {loan.name}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{loan.tagline}</p>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="pt-6 pb-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Article Content */}
            <article className="flex-1 max-w-3xl">
              {/* White content card */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                {/* At a Glance Widget */}
                <div className="bg-gradient-to-br from-[#181F53] to-[#2a3a7d] rounded-xl p-6 mb-8 text-white">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#d93c37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    At a Glance
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#d93c37]/20 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-[#d93c37]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-white/90">
                        {loan.down_payment?.toLowerCase() === 'varies'
                          ? <>Down payment <strong>varies by program</strong></>
                          : <>Down payment as low as <strong>{loan.down_payment || 'varies by program'}</strong></>
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#d93c37]/20 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-[#d93c37]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-white/90">Minimum credit score of <strong>{loan.credit_score || 'varies'}</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#d93c37]/20 rounded-full flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-[#d93c37]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-white/90">Best for <strong>{loan.best_for?.toLowerCase() || 'various buyers'}</strong></span>
                    </li>
                  </ul>
                </div>

                {/* Introduction */}
                <p className="text-[17px] text-gray-700 leading-relaxed mb-8">
                  {content.intro}
                </p>

                {/* Content Sections */}
                {content.sections.map((section, index) => (
                  <div key={index} className="mb-10">
                    <h2 className="text-2xl font-bold text-[#181F53] mt-12 mb-5">
                      {section.title}
                    </h2>
                    <p className="text-[17px] text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}

                {/* Requirements */}
                {content.requirements.length > 0 && (
                  <div className="mt-12 mb-10">
                    <h2 className="text-2xl font-bold text-[#181F53] mb-5">
                      Eligibility Requirements
                    </h2>
                    <ul className="space-y-3 pl-0">
                      {content.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-2 h-2 bg-[#d93c37] rounded-full mt-2.5" />
                          <span className="text-gray-700">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* FAQs */}
                {content.faqs.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-bold text-[#181F53] mb-5">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                      {content.faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                          <h3 className="font-semibold text-[#181F53] mb-2">
                            {faq.q}
                          </h3>
                          <p className="text-gray-600">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Widgets - Mobile only (desktop has sidebar) */}
                <div className="lg:hidden border-t border-gray-200 pt-6 mt-6 flex flex-col sm:flex-row gap-4">
                  {/* Apply Now CTA */}
                  <div className="flex-1 bg-gradient-to-br from-[#d93c37] to-[#b8302c] rounded-xl p-5 text-white">
                    <h3 className="font-bold mb-2">Ready to Get Started?</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Get pre-approved in minutes with no impact to your credit.
                    </p>
                    <Link
                      href="/apply"
                      className="block w-full py-2.5 bg-white text-[#d93c37] text-sm font-semibold rounded-lg text-center hover:bg-gray-100 transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>

                  {/* Contact Card */}
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <h3 className="font-bold text-[#181F53] mb-2">Have Questions?</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Our loan experts are here to help.
                    </p>
                    <a
                      href="tel:870-926-4052"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#181F53] text-white text-sm font-semibold rounded-lg hover:bg-[#0f1638] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      (870) 926-4052
                    </a>
                  </div>
                </div>
              </div>
            </article>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Apply Now CTA */}
                <div className="bg-gradient-to-br from-[#d93c37] to-[#b8302c] rounded-xl p-5 text-white">
                  <h3 className="font-bold mb-2">Ready to Get Started?</h3>
                  <p className="text-white/80 text-sm mb-4">
                    Get pre-approved in minutes with no impact to your credit.
                  </p>
                  <Link
                    href="/apply"
                    className="block w-full py-2.5 bg-white text-[#d93c37] text-sm font-semibold rounded-lg text-center hover:bg-gray-100 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>

                {/* Contact Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#181F53] mb-2">Have Questions?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Our loan experts are here to help.
                  </p>
                  <a
                    href="tel:870-926-4052"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#181F53] text-white text-sm font-semibold rounded-lg hover:bg-[#0f1638] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    (870) 926-4052
                  </a>
                </div>

                {/* Dynamic Widgets from database */}
                {desktopWidgets.map((widget) => (
                  <div key={widget.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    {widget.widget_type === 'featured_partner' ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-[#d93c37] font-semibold uppercase tracking-wider">
                            {widget.title}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Sponsor
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#181F53] to-[#2a3270] rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[#181F53]">{widget.partner_name}</p>
                            <p className="text-sm text-gray-500">{widget.partner_company}</p>
                            {widget.partner_email && <p className="text-sm text-gray-500">{widget.partner_email}</p>}
                          </div>
                        </div>
                        {widget.partner_phone && (
                          <a
                            href={`tel:${widget.partner_phone.replace(/[^0-9]/g, '')}`}
                            className="block w-full py-2.5 bg-[#181F53] text-white text-center text-sm font-semibold rounded-lg hover:bg-[#0f1638] transition-colors"
                          >
                            Call {widget.partner_phone}
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          {widget.icon_name && (
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${widget.icon_color || '#181F53'}20` }}
                            >
                              <div style={{ color: widget.icon_color || '#181F53' }}>
                                {icons[widget.icon_name]}
                              </div>
                            </div>
                          )}
                          <h3 className="font-bold text-[#181F53]">{widget.title}</h3>
                        </div>
                        {widget.description && (
                          <p className="text-gray-500 text-sm mb-4">{widget.description}</p>
                        )}
                        {widget.button_text && widget.button_link && (
                          <Link
                            href={widget.button_link}
                            className="block w-full py-2.5 border-2 text-center font-semibold rounded-lg transition-colors text-sm"
                            style={{
                              borderColor: widget.icon_color || '#181F53',
                              color: widget.icon_color || '#181F53',
                            }}
                          >
                            {widget.button_text}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Other Loan Options */}
      {otherLoans.length > 0 && (
        <section className="pt-4 pb-8 bg-white border-t border-gray-100">
          <div className="container-custom">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#181F53] mb-2">
                Explore Other Loan Programs
              </h2>
              <p className="text-gray-600 text-sm">
                Not the right fit? Check out our other loan options.
              </p>
            </div>

            <div className="max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherLoans.slice(0, 6).map((otherLoan) => (
                <Link
                  key={otherLoan.id}
                  href={`/loans/${otherLoan.slug}`}
                  className="group flex items-center gap-4 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                    <div className="text-[#181F53] [&>svg]:w-6 [&>svg]:h-6">
                      {icons[otherLoan.icon_name || 'home']}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#181F53] group-hover:text-[#d93c37] transition-colors">
                      {otherLoan.name}
                    </h3>
                    <p className="text-gray-500 text-sm truncate">
                      {otherLoan.tagline}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-[#d93c37] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
