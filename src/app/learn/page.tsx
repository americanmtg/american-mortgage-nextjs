import Link from 'next/link';

const blogPosts = [
  {
    slug: 'fha-loan-eligibility',
    title: '2025 FHA Home Loan Eligibility',
    excerpt: 'FHA loan qualifications are pretty flexible, but for the best chance at approval, you should aim for a credit score of 620+.',
    readTime: '8 min read',
    publishedAt: '2025-03-12',
    category: 'FHA Loans',
  },
  {
    slug: 'first-time-homebuyer-guide',
    title: 'First-Time Homebuyer Guide',
    excerpt: 'A complete walkthrough of the homebuying process, from pre-approval to closing day.',
    readTime: '12 min read',
    publishedAt: '2025-03-10',
    category: 'Guides',
  },
  {
    slug: 'down-payment-assistance-programs',
    title: 'Understanding Down Payment Assistance Programs',
    excerpt: 'Learn about the various DPA programs available and how to qualify for assistance.',
    readTime: '6 min read',
    publishedAt: '2025-03-08',
    category: 'Down Payment',
  },
];

export default function LearnPage() {
  return (
    <>
      <section className="bg-navy py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            Learning Center
          </h1>
          <p className="text-grey-300 text-center mt-4 text-lg max-w-2xl mx-auto">
            Expert advice and guides to help you navigate the mortgage process with confidence.
          </p>
        </div>
      </section>

      <section className="section-padding bg-grey-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link 
                key={post.slug}
                href={`/learn/${post.slug}`}
                className="card group hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video bg-grey-200 relative overflow-hidden">
                  <span className="absolute bottom-4 left-4 px-3 py-1 bg-red text-white text-xs font-semibold rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-grey-500 mb-3">
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <h2 className="text-xl font-bold text-navy mb-3 group-hover:text-red transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-grey-600 text-sm">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
