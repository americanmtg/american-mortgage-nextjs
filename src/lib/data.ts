/**
 * Data layer using Prisma to query PostgreSQL directly
 */

import prisma from './prisma'

// Helper to convert snake_case DB fields to camelCase for API compatibility
function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = toCamelCase(value)
  }
  return result
}

// Site base URL for absolute URLs (used in OG tags, etc.)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.americanmtg.com'

// Media URL helper - returns path that works in browser via proxy
export function getMediaUrl(media: any): string | null {
  if (!media) return null
  const path = typeof media === 'string' ? media : media.url
  if (!path) return null

  // Use the proxy path so media works from any hostname
  // /cms-media/* gets rewritten to http://localhost:3001/api/media/* by Next.js
  if (path.startsWith('/api/media/')) {
    return path.replace('/api/media/', '/cms-media/')
  }
  // If it already uses cms-media prefix, return as-is
  if (path.startsWith('/cms-media/')) {
    return path
  }
  // Fallback for other paths
  return path
}

// Absolute media URL helper - returns full URL with domain for external use (OG images, etc.)
export function getAbsoluteMediaUrl(media: any): string | null {
  const relativePath = getMediaUrl(media)
  if (!relativePath) return null

  // If already absolute, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }

  // Make it absolute with the site URL
  return `${SITE_URL}${relativePath}`
}

// Helper to transform media object to match Payload structure
function transformMedia(media: any) {
  if (!media) return null
  return {
    id: media.id,
    alt: media.alt,
    url: media.url,
    filename: media.filename,
    mimeType: media.mime_type,
    filesize: media.filesize ? Number(media.filesize) : null,
    width: media.width ? Number(media.width) : null,
    height: media.height ? Number(media.height) : null,
    focalX: media.focal_x ? Number(media.focal_x) : null,
    focalY: media.focal_y ? Number(media.focal_y) : null,
  }
}

// Site Settings
export async function getSiteSettings() {
  try {
    const settings = await prisma.site_settings.findFirst({
      include: {
        media_site_settings_logo_idTomedia: true,
        media_site_settings_logo_white_idTomedia: true,
      },
    })

    if (!settings) return null

    return {
      id: settings.id,
      companyName: settings.company_name,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      legalBanner: settings.legal_banner,
      logo: transformMedia(settings.media_site_settings_logo_idTomedia),
      logoWhite: transformMedia(settings.media_site_settings_logo_white_idTomedia),
      logoHeight: settings.logo_height ? Number(settings.logo_height) : 40,
      logoWhiteHeight: settings.logo_white_height ? Number(settings.logo_white_height) : 40,
      socialLinks: {
        facebook: settings.social_links_facebook || null,
        twitter: settings.social_links_twitter || null,
        instagram: settings.social_links_instagram || null,
        linkedin: settings.social_links_linkedin || null,
        youtube: settings.social_links_youtube || null,
      },
      updatedAt: settings.updated_at,
      createdAt: settings.created_at,
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}

// SEO Settings
export async function getSeoSettings() {
  try {
    const settings = await prisma.seo_settings.findFirst({
      include: {
        media_seo_settings_favicon_idTomedia: true,
        media_seo_settings_og_image_idTomedia: true,
      },
    })

    if (!settings) return null

    return {
      id: settings.id,
      siteTitle: settings.site_title,
      metaDescription: settings.meta_description,
      metaKeywords: settings.meta_keywords,
      favicon: transformMedia(settings.media_seo_settings_favicon_idTomedia),
      ogTitle: settings.og_title,
      ogDescription: settings.og_description,
      ogImage: transformMedia(settings.media_seo_settings_og_image_idTomedia),
      googleAnalyticsId: settings.google_analytics_id,
      updatedAt: settings.updated_at,
      createdAt: settings.created_at,
    }
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return null
  }
}

// Header Settings
export async function getHeaderSettings() {
  try {
    const settings = await prisma.header_settings.findFirst()

    if (!settings) return null

    return {
      id: settings.id,
      backgroundType: settings.background_type,
      backgroundColor: settings.background_color,
      gradientStartColor: settings.gradient_start_color,
      gradientEndColor: settings.gradient_end_color,
      gradientDirection: settings.gradient_direction,
      patternType: settings.pattern_type,
      patternColor: settings.pattern_color,
      patternBackgroundColor: settings.pattern_background_color,
      backgroundImageOverlay: settings.background_image_overlay,
      backgroundVideoUrl: settings.background_video_url,
      backgroundVideoOverlay: settings.background_video_overlay,
      headerButtonText: settings.header_button_text,
      headerButtonUrl: settings.header_button_url,
      headerButtonBackgroundColor: settings.header_button_background_color,
      headerButtonTextColor: settings.header_button_text_color,
      updatedAt: settings.updated_at,
      createdAt: settings.created_at,
    }
  } catch (error) {
    console.error('Error fetching header settings:', error)
    return null
  }
}

// Footer with nested columns and links
export async function getFooter() {
  try {
    const footer = await prisma.footer.findFirst({
      include: {
        footer_columns: {
          orderBy: { order: 'asc' },
          include: {
            footer_columns_links: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!footer) return null

    return {
      id: footer.id,
      tagline: footer.tagline,
      copyrightText: footer.copyright_text,
      nmlsInfo: footer.nmls_info,
      ctaText: footer.cta_text,
      ctaButtonText: footer.cta_button_text,
      ctaButtonUrl: footer.cta_button_url,
      columns: footer.footer_columns.map(col => ({
        id: col.id,
        title: col.title,
        links: col.footer_columns_links.map(link => ({
          id: link.id,
          label: link.label,
          url: link.url,
          openInNewTab: link.open_in_new_tab || false,
        })),
      })),
      updatedAt: footer.updated_at,
      createdAt: footer.created_at,
    }
  } catch (error) {
    console.error('Error fetching footer:', error)
    return null
  }
}

// Navigation
export async function getNavigation() {
  try {
    // Get main menu items with children
    const mainMenu = await prisma.navigation_main_menu.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    })

    // Get children for each menu item
    const mainMenuWithChildren = await Promise.all(
      mainMenu.map(async (item) => {
        const children = await prisma.navigation_main_menu_children.findMany({
          where: { parent_id: item.id, enabled: true },
          orderBy: { order: 'asc' },
        })

        return {
          id: item.id,
          label: item.label,
          url: item.url,
          openInNewTab: item.open_in_new_tab || false,
          enabled: item.enabled,
          children: children.map(child => ({
            id: child.id,
            label: child.label,
            url: child.url,
            openInNewTab: child.open_in_new_tab || false,
            enabled: child.enabled,
          })),
        }
      })
    )

    return {
      mainMenu: mainMenuWithChildren,
    }
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return null
  }
}

// Blog Posts
export async function getBlogPosts() {
  try {
    const posts = await prisma.blog_posts.findMany({
      orderBy: { published_at: 'desc' },
      include: {
        media: true,
        blog_posts_key_takeaways: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: transformMedia(post.media),
      content: post.content,
      publishedAt: post.published_at,
      author: post.author,
      keyTakeaways: post.blog_posts_key_takeaways.map(kt => ({
        id: kt.id,
        takeaway: kt.takeaway,
      })),
      updatedAt: post.updated_at,
      createdAt: post.created_at,
    }))
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export async function getBlogPost(slug: string) {
  try {
    const post = await prisma.blog_posts.findUnique({
      where: { slug },
      include: {
        media: true,
        blog_posts_key_takeaways: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!post) return null

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: transformMedia(post.media),
      content: post.content,
      publishedAt: post.published_at,
      author: post.author,
      keyTakeaways: post.blog_posts_key_takeaways.map(kt => ({
        id: kt.id,
        takeaway: kt.takeaway,
      })),
      updatedAt: post.updated_at,
      createdAt: post.created_at,
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function getRecentBlogPosts(limit: number = 3) {
  try {
    const posts = await prisma.blog_posts.findMany({
      orderBy: { published_at: 'desc' },
      take: limit,
      include: {
        media: true,
      },
    })

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: transformMedia(post.media),
      publishedAt: post.published_at,
      author: post.author,
      updatedAt: post.updated_at,
      createdAt: post.created_at,
    }))
  } catch (error) {
    console.error('Error fetching recent blog posts:', error)
    return []
  }
}

// Pages
export async function getPage(slug: string) {
  try {
    const page = await prisma.pages.findUnique({
      where: { slug },
    })

    if (!page) return null

    return {
      id: page.id,
      title: page.title,
      slug: page.slug,
      subtitle: page.subtitle,
      template: page.template,
      content: page.content,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      sidebarTitle: page.sidebar_title,
      sidebarContent: page.sidebar_content,
      ctaTitle: page.cta_title,
      ctaButtonText: page.cta_button_text,
      ctaButtonLink: page.cta_button_link,
      updatedAt: page.updated_at,
      createdAt: page.created_at,
    }
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

export async function getPages() {
  try {
    const pages = await prisma.pages.findMany({
      orderBy: { created_at: 'desc' },
    })

    return pages.map(page => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      subtitle: page.subtitle,
      template: page.template,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      updatedAt: page.updated_at,
      createdAt: page.created_at,
    }))
  } catch (error) {
    console.error('Error fetching pages:', error)
    return []
  }
}

// Featured Loans
export async function getFeaturedLoans() {
  try {
    const loans = await prisma.featured_loans.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
      include: {
        featured_loans_features: {
          orderBy: { order: 'asc' },
        },
        media: true,
      },
    })

    return loans.map(loan => ({
      id: loan.id,
      title: loan.title,
      subtitle: loan.subtitle,
      description: loan.description,
      icon: loan.icon,
      image: transformMedia(loan.media),
      linkUrl: loan.link_url,
      linkText: loan.link_text,
      order: loan.order ? Number(loan.order) : 0,
      isActive: loan.is_active,
      features: loan.featured_loans_features.map(f => ({
        id: f.id,
        text: f.text,
      })),
      updatedAt: loan.updated_at,
      createdAt: loan.created_at,
    }))
  } catch (error) {
    console.error('Error fetching featured loans:', error)
    return []
  }
}

// Routes (for dynamic page routing)
export async function getRoutes() {
  try {
    const routes = await prisma.routes.findMany({
      where: { is_active: true },
      orderBy: { path: 'asc' },
    })

    return routes.map(route => ({
      id: route.id,
      name: route.name,
      path: route.path,
      description: route.description,
      icon: route.icon,
      isActive: route.is_active,
      updatedAt: route.updated_at,
      createdAt: route.created_at,
    }))
  } catch (error) {
    console.error('Error fetching routes:', error)
    return []
  }
}

// Media
export async function getMedia(id: number) {
  try {
    const media = await prisma.media.findUnique({
      where: { id },
    })

    return transformMedia(media)
  } catch (error) {
    console.error('Error fetching media:', error)
    return null
  }
}
