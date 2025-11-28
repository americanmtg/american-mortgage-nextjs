import Link from 'next/link';
import { client } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';
import { notFound } from 'next/navigation';

async function getBlogPost(slug: string) {
  return await client.fetch(`
    *[_type == "blogPost" && slug.current == $slug][0] {
      _id,
      title,
      excerpt,
      keyTakeaways,
      content,
      readTime,
      publishedAt,
      "author": author->{name, title, bio, nmls},
      "categories": categories[]->title
    }
  `, { slug });
}

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

const portableTextComponents = {
  block: {
    h2: ({ children }: any) => <h2 className="text-2xl font-bold text-navy mt-10 mb-4">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-navy mt-8 mb-3">{children}</h3>,
    normal: ({ children }: any) => <p className="mb-4 text-grey-700">{children}</p>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-red pl-4 italic text-grey-600 my-6">{children}</blockquote>,
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold text-grey-800">{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ children, value }: any) => (
      <a href={value.href} className="text-navy underline hover:text-red">{children}</a>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
  },
};

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <section className="bg-navy py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-grey-300">
              {post.author && <span>Written by {post.author.name}</span>}
              {post.categories?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{post.categories.join(', ')}</span>
                </>
              )}
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
            {post.publishedAt && (
              <span className="text-grey-500">
                Published {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {post.readTime && (
              <>
                <span className="text-grey-500">•</span>
                <span className="text-grey-500">{post.readTime}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {post.keyTakeaways && <KeyTakeaways text={post.keyTakeaways} />}

              <div className="prose-custom">
                {post.content ? (
                  <PortableText value={post.content} components={portableTextComponents} />
                ) : (
                  <p className="text-grey-500">No content yet.</p>
                )}
              </div>

              {post.author && (
                <div className="border-t border-grey-200 mt-12 pt-12">
                  <div className="bg-grey-50 rounded-2xl p-6">
                    <div className="font-bold text-navy text-lg">By: {post.author.name}</div>
                    {post.author.title && (
                      <div className="text-grey-500 text-sm mb-3">
                        {post.author.title}
                        {post.author.nmls && ` (NMLS ${post.author.nmls})`}
                      </div>
                    )}
                    {post.author.bio && <p className="text-grey-600 text-sm">{post.author.bio}</p>}
                  </div>
                </div>
              )}
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
