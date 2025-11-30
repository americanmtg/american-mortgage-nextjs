import { getMediaUrl } from '@/lib/data';

interface Template1Props {
  page: {
    title: string;
    subtitle?: string | null;
    heroImage?: any;
    content?: any;
    sidebarTitle?: string | null;
    sidebarContent?: any;
    ctaTitle?: string | null;
    ctaButtonText?: string | null;
    ctaButtonLink?: string | null;
    template?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    [key: string]: any;
  };
}

// Content renderer that handles both plain text/HTML strings and Lexical richText format
function ContentRenderer({ content, className = '' }: { content: any; className?: string }) {
  if (!content) {
    return null;
  }

  // If content is a plain string (from admin panel textarea), render as HTML
  if (typeof content === 'string') {
    return (
      <div
        className={`prose prose-lg max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // If content is Lexical richText format
  if (content?.root?.children) {
    return <div className={className}><RichTextRenderer content={content} /></div>;
  }

  return null;
}

function RichTextRenderer({ content }: { content: any }) {
  if (!content || !content.root || !content.root.children) {
    return null;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    // Text node
    if (node.type === 'text') {
      let text: React.ReactNode = node.text;
      if (node.format) {
        if (node.format & 1) text = <strong key={index}>{text}</strong>;
        if (node.format & 2) text = <em key={index}>{text}</em>;
        if (node.format & 8) text = <u key={index}>{text}</u>;
        if (node.format & 4) text = <s key={index}>{text}</s>;
      }
      return text;
    }

    const children = node.children?.map((child: any, i: number) => renderNode(child, i));

    switch (node.type) {
      case 'root':
        return <>{children}</>;
      case 'paragraph':
        return <p key={index} className="mb-5 text-gray-600 leading-relaxed">{children}</p>;
      case 'heading':
        const HeadingTag = `h${node.tag || 2}` as keyof JSX.IntrinsicElements;
        const headingClassMap: Record<number, string> = {
          1: "text-3xl font-bold text-[#0a0870] mb-6",
          2: "text-2xl font-bold text-[#0a0870] mb-5 mt-8",
          3: "text-xl font-semibold text-[#0a0870] mb-4 mt-6",
          4: "text-lg font-semibold text-[#0a0870] mb-3 mt-5",
        };
        const headingClasses = headingClassMap[node.tag || 2] || "text-2xl font-bold text-[#0a0870] mb-5";
        return <HeadingTag key={index} className={headingClasses}>{children}</HeadingTag>;
      case 'list':
        if (node.listType === 'number') {
          return <ol key={index} className="list-decimal list-inside mb-5 space-y-2 text-gray-600">{children}</ol>;
        }
        return <ul key={index} className="list-disc list-inside mb-5 space-y-2 text-gray-600">{children}</ul>;
      case 'listitem':
        return <li key={index} className="leading-relaxed">{children}</li>;
      case 'quote':
        return <blockquote key={index} className="border-l-4 border-[#d93c37] pl-5 italic text-gray-600 my-6 bg-gray-50 py-4 pr-4">{children}</blockquote>;
      case 'link':
        return <a key={index} href={node.url} className="text-[#0a0870] underline hover:text-[#d93c37] transition-colors">{children}</a>;
      case 'linebreak':
        return <br key={index} />;
      default:
        return <>{children}</>;
    }
  };

  return <div>{renderNode(content.root, 0)}</div>;
}

export default function Template1({ page }: Template1Props) {
  const heroImageUrl = getMediaUrl(page.heroImage);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-[#0a0870] py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="text-xl md:text-2xl text-white/80 max-w-2xl">
                {page.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Decorative Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60V30C240 50 480 60 720 45C960 30 1200 10 1440 30V60H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Featured Image */}
              {heroImageUrl && (
                <div className="mb-10 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={heroImageUrl}
                    alt={page.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose-custom">
                <ContentRenderer content={page.content} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Sidebar Card */}
              <div className="bg-[#f5f5f5] rounded-lg p-6 md:p-8 sticky top-8">
                {page.sidebarTitle && (
                  <h3 className="text-xl font-bold text-[#0a0870] mb-4">
                    {page.sidebarTitle}
                  </h3>
                )}

                {page.sidebarContent && (
                  <div className="text-gray-600 mb-6">
                    <ContentRenderer content={page.sidebarContent} />
                  </div>
                )}

                {/* CTA Section */}
                {page.ctaTitle && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-lg font-semibold text-[#0a0870] mb-4">
                      {page.ctaTitle}
                    </h4>
                    {page.ctaButtonText && page.ctaButtonLink && (
                      <a
                        href={page.ctaButtonLink}
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#d93c37] text-white font-semibold rounded-lg hover:bg-[#b82e2a] transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        {page.ctaButtonText}
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* Contact Info */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-[#0a0870] mb-4">
                    Contact Us
                  </h4>
                  <div className="space-y-3">
                    <a
                      href="tel:+1234567890"
                      className="flex items-center text-gray-600 hover:text-[#d93c37] transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-[#d93c37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Us Today
                    </a>
                    <a
                      href="/apply"
                      className="flex items-center text-gray-600 hover:text-[#d93c37] transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-[#d93c37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Apply Online
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-[#0a0870] py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Ready to Get Started?
              </h2>
              <p className="text-white/80">
                Let us help you find the perfect mortgage solution for your needs.
              </p>
            </div>
            <a
              href="/apply"
              className="inline-flex items-center px-8 py-4 bg-[#d93c37] text-white font-semibold rounded-lg hover:bg-[#b82e2a] transition-colors duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Apply Now
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
