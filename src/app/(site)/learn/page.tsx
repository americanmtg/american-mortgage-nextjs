import Link from 'next/link';
import { client } from '@/lib/sanity';

async function getBlogPosts() {
  return await client.fetch(`
    *[_type == "blogPost"] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      readTime,
      publishedAt,
      "category": categories[0]->title
    }
  `);
}

export default async function LearnPage() {
  const blogPosts = await getBlogPosts();

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
          {blogPosts.length === 0 ? (
            <p className="text-center text-grey-500">No blog posts yet. Check back soon!</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post: any) => (
                <Link 
                  key={post._id}
                  href={`/learn/${post.slug}`}
                  className="card group hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-video bg-grey-200 relative overflow-hidden">
                    {post.category && (
                      <span className="absolute bottom-4 left-4 px-3 py-1 bg-red text-white text-xs font-semibold rounded-full">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-grey-500 mb-3">
                      {post.readTime && <span>{post.readTime}</span>}
                      {post.readTime && post.publishedAt && <span>•</span>}
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-navy mb-3 group-hover:text-red transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-grey-600 text-sm">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
