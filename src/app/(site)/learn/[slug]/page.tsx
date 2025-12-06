'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: {
    id: number;
    alt: string | null;
    url: string;
  } | null;
  content: any;
  publishedAt: string | null;
  author: string | null;
  authorBio: string | null;
  authorPhoto: string | null;
  keyTakeaways: { takeaway: string }[];
}

interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: {
    url: string;
    alt: string | null;
  } | null;
}

// Scroll to top on mount (desktop only)
function useScrollToTopOnMount() {
  useEffect(() => {
    if (window.innerWidth >= 768) {
      window.scrollTo(0, 0);
    }
  }, []);
}

// Extract headings from content for table of contents
function extractHeadings(content: any): { id: string; text: string; level: number }[] {
  if (!content?.root?.children) return [];

  const headings: { id: string; text: string; level: number }[] = [];

  const extractText = (node: any): string => {
    if (node.type === 'text') return node.text || '';
    if (node.children) return node.children.map(extractText).join('');
    return '';
  };

  content.root.children.forEach((node: any, index: number) => {
    if (node.type === 'heading') {
      const text = extractText(node);
      const id = `heading-${index}`;
      headings.push({ id, text, level: node.tag || 2 });
    }
  });

  return headings;
}

// Table of Contents Component
function TableOfContents({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <div className="bg-grey-50 rounded-xl p-5 mb-6">
      <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        In This Article
      </h3>
      <nav className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`block text-sm py-1 transition-colors ${
              level === 3 ? 'pl-4' : ''
            } ${
              activeId === id
                ? 'text-red font-medium'
                : 'text-grey-600 hover:text-navy'
            }`}
          >
            {text}
          </a>
        ))}
      </nav>
    </div>
  );
}

// Key Takeaways Component
function KeyTakeaways({ takeaways }: { takeaways: { takeaway: string }[] }) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-6 mb-8 text-white">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-red" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Key Takeaways
      </h3>
      <ul className="space-y-3">
        {takeaways.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-red/20 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-red" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="text-white/90">{item.takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Rich Text Renderer with heading IDs
function RichTextRenderer({ content }: { content: any }) {
  if (!content || !content.root || !content.root.children) {
    return <p className="text-grey-500 italic">No content available.</p>;
  }

  let headingIndex = 0;

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
        return (
          <p key={index} className="mb-5 text-grey-700 leading-relaxed text-[17px]">
            {children}
          </p>
        );
      case 'heading':
        const id = `heading-${headingIndex++}`;
        const HeadingTag = `h${node.tag || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses = node.tag === 3
          ? "text-xl font-bold text-navy mt-10 mb-4 scroll-mt-24"
          : "text-2xl font-bold text-navy mt-12 mb-5 scroll-mt-24";
        return (
          <HeadingTag key={index} id={id} className={headingClasses}>
            {children}
          </HeadingTag>
        );
      case 'list':
        if (node.listType === 'number') {
          return (
            <ol key={index} className="list-none mb-6 space-y-3 pl-0">
              {node.children?.map((child: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-navy text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-grey-700">{renderNode(child, i)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={index} className="mb-6 space-y-3 pl-0">
            {node.children?.map((child: any, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-2 h-2 bg-red rounded-full mt-2.5" />
                <span className="text-grey-700">{renderNode(child, i)}</span>
              </li>
            ))}
          </ul>
        );
      case 'listitem':
        return <>{children}</>;
      case 'quote':
        return (
          <blockquote key={index} className="relative bg-grey-50 border-l-4 border-red rounded-r-lg p-6 my-8 italic">
            <svg className="absolute top-4 left-4 w-8 h-8 text-red/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <div className="pl-8 text-grey-700">{children}</div>
          </blockquote>
        );
      case 'link':
        return (
          <a key={index} href={node.url} className="text-red hover:text-red-dark underline underline-offset-2">
            {children}
          </a>
        );
      case 'linebreak':
        return <br key={index} />;
      default:
        return <>{children}</>;
    }
  };

  return <div>{renderNode(content.root, 0)}</div>;
}

// Social Share Buttons
function SocialShare({ title, slug }: { title: string; slug: string }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-grey-500">Share:</span>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-grey-100 hover:bg-blue-100 hover:text-blue-600 rounded-full flex items-center justify-center text-grey-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
        </svg>
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-grey-100 hover:bg-sky-100 hover:text-sky-500 rounded-full flex items-center justify-center text-grey-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-grey-100 hover:bg-blue-100 hover:text-blue-700 rounded-full flex items-center justify-center text-grey-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </a>
    </div>
  );
}

// Sidebar Widgets
function ApplyNowWidget() {
  return (
    <div className="bg-gradient-to-br from-red to-red-dark rounded-xl p-6 text-white">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h3 className="font-bold text-lg mb-2">Ready to Buy a Home?</h3>
      <p className="text-white/80 text-sm mb-4">
        Get pre-approved in minutes and see how much you qualify for.
      </p>
      <Link
        href="/apply"
        className="block w-full py-3 bg-white text-red font-semibold rounded-lg text-center hover:bg-grey-100 transition-colors shine-button"
      >
        Apply Now
      </Link>
      <p className="text-center text-xs text-white/60 mt-3">
        Free • No credit impact • 5 minutes
      </p>
    </div>
  );
}

function CalculatorWidget() {
  const [homePrice, setHomePrice] = useState(250000);
  const [downPayment, setDownPayment] = useState(12500);
  const [interestRate] = useState(6.5);
  const [loanTerm] = useState(30);

  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  return (
    <div className="bg-white border border-grey-200 rounded-xl p-6">
      <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Quick Calculator
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-grey-600 mb-1 block">Home Price</label>
          <input
            type="range"
            min="100000"
            max="750000"
            step="5000"
            value={homePrice}
            onChange={(e) => {
              setHomePrice(Number(e.target.value));
              setDownPayment(Math.round(Number(e.target.value) * 0.05));
            }}
            className="w-full accent-red"
          />
          <div className="text-right text-navy font-semibold">${homePrice.toLocaleString()}</div>
        </div>

        <div>
          <label className="text-sm text-grey-600 mb-1 block">Down Payment ({Math.round(downPayment / homePrice * 100)}%)</label>
          <input
            type="range"
            min={Math.round(homePrice * 0.035)}
            max={Math.round(homePrice * 0.20)}
            step="1000"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full accent-red"
          />
          <div className="text-right text-navy font-semibold">${downPayment.toLocaleString()}</div>
        </div>

        <div className="bg-grey-50 rounded-lg p-4 text-center">
          <p className="text-sm text-grey-600 mb-1">Estimated Monthly Payment</p>
          <p className="text-3xl font-bold text-navy">
            ${Math.round(monthlyPayment).toLocaleString()}
          </p>
          <p className="text-xs text-grey-500 mt-1">Principal & Interest only</p>
        </div>
      </div>

      <Link
        href="/calculator"
        className="block w-full mt-4 py-2.5 border border-navy text-navy font-medium rounded-lg text-center hover:bg-navy hover:text-white transition-colors text-sm"
      >
        Full Calculator →
      </Link>
    </div>
  );
}

function RealtorWidget() {
  return (
    <div className="bg-white border border-grey-200 rounded-xl p-6">
      <h3 className="font-bold text-navy mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Find a Realtor
      </h3>
      <p className="text-grey-600 text-sm mb-4">
        Connect with trusted real estate professionals in your area.
      </p>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">JD</div>
          <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">SM</div>
          <div className="w-8 h-8 rounded-full bg-grey-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">+5</div>
        </div>
        <span className="text-sm text-grey-600">7 agents available</span>
      </div>
      <Link
        href="/directory"
        className="block w-full py-2.5 bg-navy text-white font-medium rounded-lg text-center hover:bg-navy-light transition-colors text-sm"
      >
        Browse Directory
      </Link>
    </div>
  );
}

function NewsletterWidget() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className="bg-grey-50 rounded-xl p-6">
      <h3 className="font-bold text-navy mb-2">Stay Informed</h3>
      <p className="text-grey-600 text-sm mb-4">
        Get the latest mortgage tips and market updates.
      </p>
      {subscribed ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-medium">You're subscribed!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-grey-300 focus:border-navy focus:ring-1 focus:ring-navy outline-none text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-navy text-white font-medium rounded-lg hover:bg-navy-light transition-colors text-sm"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}

// Related Posts Component
function RelatedPosts({ posts, currentSlug }: { posts: RelatedPost[]; currentSlug: string }) {
  const filtered = posts.filter(p => p.slug !== currentSlug).slice(0, 3);
  if (filtered.length === 0) return null;

  return (
    <section className="py-16 bg-grey-50">
      <div className="container-custom">
        <h2 className="text-2xl font-bold text-navy mb-8">Continue Reading</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/learn/${post.slug}`}
              className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[16/10] bg-grey-100 relative overflow-hidden">
                {post.featuredImage?.url ? (
                  <img
                    src={post.featuredImage.url}
                    alt={post.featuredImage.alt || post.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy to-navy-light">
                    <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 md:p-5">
                <h3 className="font-bold text-navy group-hover:text-red transition-colors line-clamp-2 text-sm md:text-base">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-grey-600 text-sm mt-2 line-clamp-2 hidden md:block">{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Author Bio Component
function AuthorBio({ author, bio, photo }: { author: string; bio?: string | null; photo?: string | null }) {
  return (
    <div className="border-t border-grey-200 pt-8 mt-12">
      <div className="flex items-start gap-4">
        {photo ? (
          <img
            src={photo}
            alt={author}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {author.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div>
          <p className="text-sm text-grey-500 mb-1">Written by</p>
          <h4 className="font-bold text-navy text-lg">{author}</h4>
          <p className="text-grey-600 text-sm mt-1">
            {bio || 'Mortgage specialist with years of experience helping families achieve their homeownership dreams.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  useScrollToTopOnMount();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch the current post
        const res = await fetch(`/api/blog-posts/public?slug=${params.slug}`);
        const json = await res.json();

        if (json.success && json.data) {
          setPost(json.data);
        } else {
          setNotFound(true);
        }

        // Fetch related posts
        const relatedRes = await fetch('/api/blog-posts/public?limit=4');
        const relatedJson = await relatedRes.json();
        if (relatedJson.success) {
          setRelatedPosts(relatedJson.data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Loading skeleton */}
        <div className="bg-navy py-12 md:py-20">
          <div className="container-custom">
            <div className="max-w-3xl">
              <div className="h-4 w-32 bg-white/20 rounded animate-pulse mb-4" />
              <div className="h-10 w-full bg-white/20 rounded animate-pulse mb-3" />
              <div className="h-10 w-2/3 bg-white/20 rounded animate-pulse mb-6" />
              <div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="container-custom py-12">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="h-4 bg-grey-200 rounded animate-pulse" />
              <div className="h-4 bg-grey-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-grey-200 rounded animate-pulse w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-navy mb-4">Article Not Found</h1>
          <p className="text-grey-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link href="/learn" className="btn btn-primary">
            Browse All Articles
          </Link>
        </div>
      </div>
    );
  }

  const headings = extractHeadings(post.content);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <>
      {/* Hero Section - Compact (matching /loans) */}
      <section className="bg-navy py-6 md:py-8">
        <div className="container-custom">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-grey-400 mb-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/learn" className="hover:text-white transition-colors whitespace-nowrap">Learning Center</Link>
              <span>/</span>
              <span className="text-grey-300 truncate">{post.title}</span>
            </nav>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {post.title}
            </h1>

            {/* Meta info - subtitle style */}
            <div className="flex flex-wrap items-center gap-3 text-grey-400 text-sm mt-1">
              {post.author && (
                <span>By {post.author}</span>
              )}
              {formattedDate && post.author && (
                <span>•</span>
              )}
              {formattedDate && (
                <span>{formattedDate}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pt-6 pb-12 bg-white">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Article Content */}
            <article className="flex-1 max-w-3xl">
              {/* Key Takeaways */}
              {post.keyTakeaways && post.keyTakeaways.length > 0 && (
                <KeyTakeaways takeaways={post.keyTakeaways} />
              )}

              {/* Content */}
              <RichTextRenderer content={post.content} />

              {/* Author Bio */}
              {post.author && <AuthorBio author={post.author} bio={post.authorBio} photo={post.authorPhoto} />}

              {/* Share & Tags */}
              <div className="border-t border-grey-200 pt-8 mt-8 flex flex-wrap items-center justify-between gap-4">
                <SocialShare title={post.title} slug={post.slug} />
                <Link href="/learn" className="text-sm text-navy hover:text-red font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Learning Center
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Table of Contents */}
                <TableOfContents headings={headings} />

                {/* Apply Now Widget */}
                <ApplyNowWidget />

                {/* Calculator Widget */}
                <CalculatorWidget />

                {/* Realtor Widget */}
                <RealtorWidget />

                {/* Newsletter Widget */}
                <NewsletterWidget />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts posts={relatedPosts} currentSlug={post.slug} />
    </>
  );
}
