import { getPage } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Template1 } from '@/components/templates';
import type { TemplateType } from '@/components/templates';

// Allow dynamic rendering of pages at request time
export const dynamic = 'force-dynamic';

// Content renderer that handles both plain text/HTML strings and Lexical richText format
function ContentRenderer({ content, className = '' }: { content: any; className?: string }) {
  if (!content) {
    return <p className="text-gray-500">No content yet.</p>;
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

  // Fallback for unknown format
  return <p className="text-gray-500">No content yet.</p>;
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
        return <p key={index} className="mb-4 text-gray-700">{children}</p>;
      case 'heading':
        const HeadingTag = `h${node.tag || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses = node.tag === 3
          ? "text-xl font-bold text-[#0a0870] mt-8 mb-3"
          : "text-2xl font-bold text-[#0a0870] mt-10 mb-4";
        return <HeadingTag key={index} className={headingClasses}>{children}</HeadingTag>;
      case 'list':
        if (node.listType === 'number') {
          return <ol key={index} className="list-decimal list-inside mb-4 space-y-2">{children}</ol>;
        }
        return <ul key={index} className="list-disc list-inside mb-4 space-y-2">{children}</ul>;
      case 'listitem':
        return <li key={index}>{children}</li>;
      case 'quote':
        return <blockquote key={index} className="border-l-4 border-[#d93c37] pl-4 italic text-gray-600 my-6">{children}</blockquote>;
      case 'link':
        return <a key={index} href={node.url} className="text-[#0a0870] underline hover:text-[#d93c37]">{children}</a>;
      case 'linebreak':
        return <br key={index} />;
      default:
        return <>{children}</>;
    }
  };

  return <div className="prose-custom">{renderNode(content.root, 0)}</div>;
}

// Default template component
function DefaultTemplate({ page }: { page: any }) {
  return (
    <>
      <section className="bg-[#0a0870] py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {page.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <ContentRenderer content={page.content} />
          </div>
        </div>
      </section>
    </>
  );
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  // Determine which template to use
  const template = (page.template || 'default') as TemplateType;

  // Render based on template
  switch (template) {
    case 'template-1':
      return <Template1 page={page} />;
    case 'default':
    default:
      return <DefaultTemplate page={page} />;
  }
}
