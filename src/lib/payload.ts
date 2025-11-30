const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL || 'http://localhost:3001';

interface PayloadResponse<T> {
  docs?: T[];
  totalDocs?: number;
  page?: number;
  [key: string]: any;
}

async function fetchPayload<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PAYLOAD_API_URL}/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Payload fetch error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Site Settings
export async function getSiteSettings() {
  try {
    const data = await fetchPayload<any>('/globals/site-settings');
    return data;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

// Blog Posts
export async function getBlogPosts() {
  try {
    const data = await fetchPayload<PayloadResponse<any>>('/blog-posts?sort=-publishedAt&depth=1');
    return data.docs || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getBlogPost(slug: string) {
  try {
    const data = await fetchPayload<PayloadResponse<any>>(`/blog-posts?where[slug][equals]=${encodeURIComponent(slug)}&depth=1`);
    return data.docs?.[0] || null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function getRecentBlogPosts(limit: number = 3) {
  try {
    const data = await fetchPayload<PayloadResponse<any>>(`/blog-posts?sort=-publishedAt&limit=${limit}&depth=1`);
    return data.docs || [];
  } catch (error) {
    console.error('Error fetching recent blog posts:', error);
    return [];
  }
}

// Pages
export async function getPage(slug: string) {
  try {
    const data = await fetchPayload<PayloadResponse<any>>(`/pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=1`);
    return data.docs?.[0] || null;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

// Navigation
export async function getNavigation() {
  try {
    const data = await fetchPayload<any>('/globals/navigation');
    return data;
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return null;
  }
}

// SEO Settings
export async function getSeoSettings() {
  try {
    const data = await fetchPayload<any>('/globals/seo-settings');
    return data;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
}

// Header Settings
export async function getHeaderSettings() {
  try {
    const data = await fetchPayload<any>('/globals/header-settings');
    return data;
  } catch (error) {
    console.error('Error fetching header settings:', error);
    return null;
  }
}

// Featured Loans
export async function getFeaturedLoans() {
  try {
    const data = await fetchPayload<PayloadResponse<any>>('/featured-loans?sort=order&where[isActive][equals]=true&depth=1');
    return data.docs || [];
  } catch (error) {
    console.error('Error fetching featured loans:', error);
    return [];
  }
}

// Footer
export async function getFooter() {
  try {
    const data = await fetchPayload<any>('/globals/footer');
    return data;
  } catch (error) {
    console.error('Error fetching footer:', error);
    return null;
  }
}

// Site base URL for absolute URLs (used in OG tags, etc.)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.americanmtg.com';

// Media URL helper - returns path that works in browser via proxy
export function getMediaUrl(media: any): string | null {
  if (!media) return null;
  const path = typeof media === 'string' ? media : media.url;
  if (!path) return null;

  // Use the proxy path so media works from any hostname
  // /cms-media/* gets rewritten to http://localhost:3001/api/media/* by Next.js
  if (path.startsWith('/api/media/')) {
    return path.replace('/api/media/', '/cms-media/');
  }
  // Fallback: return the path with CMS URL (for backward compatibility)
  return `${PAYLOAD_API_URL}${path}`;
}

// Absolute media URL helper - returns full URL with domain for external use (OG images, etc.)
export function getAbsoluteMediaUrl(media: any): string | null {
  const relativePath = getMediaUrl(media);
  if (!relativePath) return null;

  // If already absolute, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Make it absolute with the site URL
  return `${SITE_URL}${relativePath}`;
}
