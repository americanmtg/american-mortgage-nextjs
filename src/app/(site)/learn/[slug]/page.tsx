import Link from 'next/link';
import { getBlogPost } from '@/lib/data';
import { notFound } from 'next/navigation';

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
          <span className="text-red font-semibold">609</span> families started their quote today!
        </p>
      </div>
    </div>
  );
}

function KeyTakeaways({ takeaways }: { takeaways: { takeaway: string }[] }) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <div className="bg-grey-50 border-l-4 border-navy rounded-r-xl p-6 mb-8">
      <h3 className="font-bold text-navy mb-3">Key Takeaways</h3>
      <ul className="space-y-2">
        {takeaways.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-grey-700">
            <span className="text-navy font-bold">•</span>
            {item.takeaway}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RichTextRenderer({ content }: { content: any }) {
  if (!content || !content.root || !content.root.children) {
    return <p className="text-grey-500">No content yet.</p>;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    // Text node
    if (node.type === 'text') {
      let text: React.ReactNode = node.text;
      if (node.format) {
        if (node.format & 1) text = <strong key={index}>{text}</strong>; // bold
        if (node.format & 2) text = <em key={index}>{text}</em>; // italic
        if (node.format & 8) text = <u key={index}>{text}</u>; // underline
        if (node.format & 4) text = <s key={index}>{text}</s>; // strikethrough
      }
      return text;
    }

    // Get children
    const children = node.children?.map((child: any, i: number) => renderNode(child, i));

    switch (node.type) {
      case 'root':
        return <>{children}</>;
      case 'paragraph':
        return <p key={index} className="mb-4 text-grey-700">{children}</p>;
      case 'heading':
        const HeadingTag = `h${node.tag || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses = node.tag === 3
          ? "text-xl font-bold text-navy mt-8 mb-3"
          : "text-2xl font-bold text-navy mt-10 mb-4";
        return <HeadingTag key={index} className={headingClasses}>{children}</HeadingTag>;
      case 'list':
        if (node.listType === 'number') {
          return <ol key={index} className="list-decimal list-inside mb-4 space-y-2">{children}</ol>;
        }
        return <ul key={index} className="list-disc list-inside mb-4 space-y-2">{children}</ul>;
      case 'listitem':
        return <li key={index}>{children}</li>;
      case 'quote':
        return <blockquote key={index} className="border-l-4 border-red pl-4 italic text-grey-600 my-6">{children}</blockquote>;
      case 'link':
        return <a key={index} href={node.url} className="text-navy underline hover:text-red">{children}</a>;
      case 'linebreak':
        return <br key={index} />;
      default:
        return <>{children}</>;
    }
  };

  return <div className="prose-custom">{renderNode(content.root, 0)}</div>;
}

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
              {post.author && <span>Written by {post.author}</span>}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white border-b border-grey-200">
        <div className="container-custom py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              Expert Reviewed
            </span>
            {post.publishedAt && (
              <span className="text-grey-500">
                Published {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <KeyTakeaways takeaways={post.keyTakeaways} />
              )}

              <RichTextRenderer content={post.content} />

              {post.author && (
                <div className="border-t border-grey-200 mt-12 pt-12">
                  <div className="bg-grey-50 rounded-2xl p-6">
                    <div className="font-bold text-navy text-lg">By: {post.author}</div>
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
