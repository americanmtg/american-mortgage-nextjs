import Link from 'next/link';

function StickySidebar() {
  return (
    <div className="sticky top-24">
      <div className="bg-grey-50 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-navy text-center mb-2">
          Prequalify for your home loan today
        </h3>
        <Link href="/apply" className="btn btn-primary w-full mt-4">
          Apply Now
        </Link>
        <p className="text-center text-sm text-grey-500 mt-3">
          ⭐ <span className="text-red font-semibold">609</span> families started their quote today!
        </p>
      </div>
    </div>
  );
}

function KeyTakeaways({ text }: { text: string }) {
  return (
    <div className="bg-grey-50 border-l-4 border-navy rounded-r-xl p-6 mb-8">
      <h3 className="font-bold text-navy mb-3">Key Takeaways</h3>
      <p className="text-grey-700">{text}</p>
    </div>
  );
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = {
    title: '2025 FHA Home Loan Eligibility',
    publishedAt: '2025-03-12',
    author: {
      name: 'Shiloh Davis',
      title: 'Loan Officer Development (NMLS #2056630)',
      bio: 'Shiloh has extensive experience with FHA and conventional loans from his time as a senior loan officer.',
    },
    reviewer: 'Tim Jones, Senior Risk Advisor',
    keyTakeaways: 'FHA loan qualifications are pretty flexible, but for the best chance at approval, you should aim for a credit score of 620+, a DTI ratio of 43% or lower, and enough upfront funds to cover a 3.5% down payment.',
  };

  return (
    <>
      <section className="bg-navy py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-grey-300">
              <span>Written by {post.author.name}</span>
              <span>•</span>
              <span>Reviewed by {post.reviewer}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-grey-200">
        <div className="container-custom py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              ✓ Expert Reviewed
            </span>
            <span className="text-grey-500">
              Updated {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <KeyTakeaways text={post.keyTakeaways} />

              <div className="prose-custom">
                <p>
                  Thinking about buying your first home in 2025? An FHA loan could be a perfect fit! Known for their flexible requirements, low down payments, and low interest rates, FHA loans are a go-to option for first-time buyers.
                </p>

                <h2>2025 FHA Loan Requirements</h2>
                <p>
                  To qualify for an FHA loan, you will need to meet a few key requirements. Here is what FHA lenders typically look for:
                </p>

                <table>
                  <thead>
                    <tr>
                      <th colSpan={2}>2025 FHA Loan Requirements</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">Credit Score</td>
                      <td>500 (with 10% down) or 580+ (with 3.5% down)</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Down Payment</td>
                      <td>At least 3.5% of the purchase price</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">DTI Ratio</td>
                      <td>Typically no more than 43%</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Loan Limits</td>
                      <td>$524,225 in most areas (2025)</td>
                    </tr>
                  </tbody>
                </table>

                <h2>Credit Score and Down Payment</h2>
                <p>
                  FHA loan credit score minimums and down payments are linked. You need a minimum of 500 to qualify with a 10% down payment or a 580+ credit score with a 3.5% down payment.
                </p>

                <h2>How to Qualify For an FHA Loan</h2>
                <p>
                  While the U.S. Federal Housing Administration insures FHA loans, the US government does not actually issue them. Instead, you will apply for your loan through an FHA-approved lender.
                </p>

                <div className="bg-navy text-white rounded-2xl p-8 my-12">
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    Want to check your eligibility for an FHA loan?
                  </h3>
                  <p className="text-grey-300 mb-6">
                    Get in touch with an American Mortgage Loan Expert.
                  </p>
                  <Link href="/apply" className="btn btn-primary">
                    Get Started
                  </Link>
                </div>

                <h2>Is an FHA loan right for you?</h2>
                <p>
                  If you are having difficulty applying for a conventional loan or you want to save the money you would use on a higher down payment, then an FHA loan could be a good choice.
                </p>
              </div>

              <div className="border-t border-grey-200 mt-12 pt-12">
                <div className="bg-grey-50 rounded-2xl p-6">
                  <div className="font-bold text-navy text-lg">By: {post.author.name}</div>
                  <div className="text-grey-500 text-sm mb-3">{post.author.title}</div>
                  <p className="text-grey-600 text-sm">{post.author.bio}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <StickySidebar />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
