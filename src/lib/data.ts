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
      legalBannerMobile: settings.legal_banner_mobile,
      legalBannerShowDesktop: settings.legal_banner_show_desktop ?? true,
      legalBannerShowMobile: settings.legal_banner_show_mobile ?? true,
      logo: transformMedia(settings.media_site_settings_logo_idTomedia),
      logoWhite: transformMedia(settings.media_site_settings_logo_white_idTomedia),
      logoHeight: settings.logo_height ? Number(settings.logo_height) : 40,
      logoWhiteHeight: settings.logo_white_height ? Number(settings.logo_white_height) : 40,
      logoHeightMobile: settings.logo_height_mobile ? Number(settings.logo_height_mobile) : 30,
      logoWhiteHeightMobile: settings.logo_white_height_mobile ? Number(settings.logo_white_height_mobile) : 30,
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

// Homepage Settings
export async function getHomepageSettings() {
  try {
    const settings = await prisma.homepage_settings.findFirst()

    if (!settings) return null

    return {
      id: settings.id,
      hero: {
        eyebrow: settings.hero_eyebrow || 'Trusted Nationwide',
        headlineLine1: settings.hero_headline_line1 || 'Get home with the',
        headlineLine2: settings.hero_headline_line2 || 'first name in financing',
        buttonText: settings.hero_button_text || 'Get Started Now',
        buttonUrl: settings.hero_button_url || '/apply',
        reassuranceTime: settings.hero_reassurance_time || '3 min',
        reassuranceText: settings.hero_reassurance_text || 'No impact to credit',
        ratingPercent: settings.hero_rating_percent || '98%',
        ratingText: settings.hero_rating_text || 'would recommend',
        widgetType: (settings.hero_widget_type || 'badge') as 'ratings' | 'badge',
        widgetEnabled: settings.hero_widget_enabled ?? true,
        photo1Url: settings.hero_photo1_url || null,
        photo2Url: settings.hero_photo2_url || null,
        photo3Url: settings.hero_photo3_url || null,
        badgeText: settings.hero_badge_text || 'Same-Day Pre-Approvals',
        badgeSubtext: settings.hero_badge_subtext || 'Fast & hassle-free',
        mobileGradientEnabled: settings.hero_mobile_gradient_enabled ?? true,
      },
      featuredLoans: {
        eyebrow: settings.featured_loans_eyebrow || 'Featured Loans',
        headlineLine1: settings.featured_loans_headline_line1 || 'From first home',
        headlineLine2: settings.featured_loans_headline_line2 || "we're here for you.",
      },
      dpa: {
        enabled: settings.dpa_enabled ?? true,
        headline: settings.dpa_headline || 'Make homebuying more affordable with down payment assistance.',
        feature1: settings.dpa_feature1 || 'Cover the downpayment, closing costs, or both',
        feature2: settings.dpa_feature2 || 'Forgivable and long-term repayment plans',
        feature3: settings.dpa_feature3 || '0% down options available',
        buttonText: settings.dpa_button_text || 'Check Eligibility',
        buttonUrl: settings.dpa_button_url || '/apply',
        reassuranceText: settings.dpa_reassurance_text || 'No impact to credit',
        backgroundStyle: (settings.dpa_background_style || 'blue') as 'blue' | 'grey',
      },
      tools: {
        eyebrow: settings.tools_eyebrow || 'Tools & Calculators',
        headlineLine1: settings.tools_headline_line1 || 'Get an estimate instantly with our',
        headlineLine2: settings.tools_headline_line2 || 'online mortgage tools',
        // Use JSON column if available, otherwise fall back to legacy fixed columns
        cards: settings.tools_cards ? (settings.tools_cards as any[]) : [
          {
            title: settings.tools_card1_title || 'Mortgage Calculator',
            description: settings.tools_card1_description || 'Estimate your monthly payment',
            icon: settings.tools_card1_icon || '🏠',
            url: settings.tools_card1_url || '/calculator',
          },
          {
            title: settings.tools_card2_title || 'Affordability Calculator',
            description: settings.tools_card2_description || 'See how much home you can afford',
            icon: settings.tools_card2_icon || '💰',
            url: settings.tools_card2_url || '/calculator',
          },
          {
            title: settings.tools_card3_title || 'Refinance Calculator',
            description: settings.tools_card3_description || 'Calculate your potential savings',
            icon: settings.tools_card3_icon || '📊',
            url: settings.tools_card3_url || '/calculator',
          },
        ],
      },
      moreLoans: {
        enabled: settings.more_loans_enabled ?? true,
        text: settings.more_loans_text || 'Not finding the right fit? We have',
        linkText: settings.more_loans_link_text || 'more loan options',
        linkUrl: settings.more_loans_link_url || '/loans',
        style: (settings.more_loans_style || 'red') as 'red' | 'blue',
      },
      articles: {
        title: settings.articles_title || 'Latest Articles',
        subtitle: settings.articles_subtitle || 'Tips and guides for homebuyers',
      },
      whyChooseUs: settings.why_choose_us as any || null,
      directoryBanner: {
        enabled: settings.directory_banner_enabled ?? true,
        text: settings.directory_banner_text || 'Need a trusted real estate professional?',
        linkText: settings.directory_banner_link_text || 'Browse our directory',
        linkUrl: settings.directory_banner_link_url || '/directory',
      },
      process: {
        enabled: settings.process_enabled ?? true,
        eyebrow: settings.process_eyebrow || 'How It Works',
        headline: settings.process_headline || 'Your Path to Homeownership',
        subheadline: settings.process_subheadline || 'We keep you informed at every step. No surprises, no confusion, just a clear path from pre-approval to closing day.',
        steps: (settings.process_steps as any[]) || [
          { title: 'Get Pre-Approved', description: 'Know your budget and shop with confidence. A strong pre-approval makes your offer stand out.' },
          { title: 'Find Your Home', description: 'Once you are under contract, we order the appraisal and start building your loan file.' },
          { title: 'Loan Processing', description: 'We handle the paperwork, verify your documents, and guide your file through underwriting.' },
          { title: 'Close and Get Keys', description: 'Sign your final documents and walk away with the keys to your new home.' },
        ],
      },
      updatedAt: settings.updated_at,
    }
  } catch (error) {
    console.error('Error fetching homepage settings:', error)
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
      headerButtonIcon: settings.header_button_icon,
      headerButtonBorderColor: settings.header_button_border_color,
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
          showOnDesktop: item.show_on_desktop ?? true,
          showOnMobileBar: item.show_on_mobile_bar ?? false,
          showInHamburger: item.show_in_hamburger ?? true,
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
      showDPA: loan.show_dpa ?? true,
      dpaText: loan.dpa_text ?? 'Down Payment Assistance Available',
      learnMoreEnabled: loan.learn_more_enabled ?? false,
      learnMoreUrl: loan.learn_more_url,
      learnMoreText: loan.learn_more_text ?? 'Learn More',
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

// Mobile Menu Buttons
export async function getMobileMenuButtons() {
  try {
    const buttons = await prisma.mobile_menu_buttons.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    })

    return buttons.map(btn => ({
      id: btn.id,
      label: btn.label,
      url: btn.url,
      icon: btn.icon,
      buttonType: btn.button_type,
      backgroundColor: btn.background_color,
      textColor: btn.text_color,
      borderColor: btn.border_color,
    }))
  } catch (error) {
    console.error('Error fetching mobile menu buttons:', error)
    return []
  }
}

// ==========================================
// GIVEAWAYS
// ==========================================

// Get active giveaways (public) - excludes those with winners already selected
export async function getActiveGiveaways() {
  try {
    const now = new Date()
    const giveaways = await prisma.giveaways.findMany({
      where: {
        status: 'active',
        start_date: { lte: now },
        end_date: { gte: now },
        winner_selected: false,
      },
      orderBy: [{ position: 'asc' }, { end_date: 'asc' }],
      include: {
        _count: {
          select: {
            entries: {
              where: { is_valid: true },
            },
          },
        },
      },
    })

    return giveaways.map(g => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      description: g.description,
      prizeTitle: g.prize_title,
      prizeValue: g.prize_value ? Number(g.prize_value) : null,
      prizeImage: g.prize_image,
      startDate: g.start_date.toISOString(),
      endDate: g.end_date.toISOString(),
      // Additional data for card display
      totalEntries: g._count.entries,
      numWinners: g.num_winners || 1,
      selectionMethod: g.alternate_selection === 'auto' ? 'Random' : 'Manual',
      deliveryMethod: g.delivery_method === 'physical' ? 'Physical Mail' : 'Email',
      // Button customization
      buttonText: g.button_text || 'Enter Now',
      buttonColor: g.button_color || '#2563eb',
      buttonIcon: g.button_icon || 'ticket',
    }))
  } catch (error) {
    console.error('Error fetching active giveaways:', error)
    return []
  }
}

// Get past giveaways with winners (public)
export async function getPastGiveaways() {
  try {
    const giveaways = await prisma.giveaways.findMany({
      where: {
        winner_selected: true,
        OR: [
          { archived: false },
          { archived: null },
        ],
      },
      orderBy: [{ position: 'asc' }, { end_date: 'desc' }],
      take: 10,
      include: {
        winners: {
          include: {
            entry: {
              select: {
                id: true,
                first_name: true,
                zip_code: true,
              },
            },
          },
          orderBy: [
            { winner_type: 'asc' }, // primary first
            { alternate_order: 'asc' },
          ],
        },
        _count: {
          select: {
            entries: {
              where: { is_valid: true },
            },
            winners: true,
          },
        },
      },
    })

    // Get winner entry counts for all winners
    const results = await Promise.all(giveaways.map(async (g) => {
      // Process all winners with their entry counts
      const winnersWithCounts = await Promise.all(g.winners.map(async (w) => {
        const winnerEntry = await prisma.giveaway_entries.findUnique({
          where: { id: w.entry.id },
          select: { email: true },
        })

        let entryCount = 0
        if (winnerEntry) {
          entryCount = await prisma.giveaway_entries.count({
            where: {
              giveaway_id: g.id,
              email: { equals: winnerEntry.email, mode: 'insensitive' },
              is_valid: true,
            },
          })
        }

        return {
          firstName: w.entry.first_name,
          zipCode: w.entry.zip_code,
          entryCount,
          winnerType: w.winner_type,
          selectionMethod: w.selection_method || 'manual',
        }
      }))

      const primaryWinner = g.winners[0]

      return {
        id: g.id,
        title: g.title,
        slug: g.slug,
        prizeTitle: g.prize_title,
        prizeValue: g.prize_value ? Number(g.prize_value) : null,
        prizeImage: g.prize_image,
        startDate: g.start_date.toISOString(),
        endDate: g.end_date.toISOString(),
        totalEntries: g._count.entries,
        totalWinners: g._count.winners,
        winnerSelectedAt: primaryWinner?.created_at?.toISOString() || null,
        selectionMethod: primaryWinner?.selection_method === 'automated' ? 'Automated' : 'Manual',
        deliveryMethod: g.delivery_method === 'physical' ? 'Physical Mail' : 'Email',
        winners: winnersWithCounts,
        // Keep backward compatibility
        winner: winnersWithCounts[0] || null,
      }
    }))

    return results
  } catch (error) {
    console.error('Error fetching past giveaways:', error)
    return []
  }
}

// Get giveaway by slug (public)
export async function getGiveawayBySlug(slug: string) {
  try {
    const giveaway = await prisma.giveaways.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { entries: true }
        },
        sections: {
          orderBy: { section_order: 'asc' }
        }
      }
    })

    if (!giveaway) return null

    // Only return if active or ended (not draft/cancelled)
    if (giveaway.status === 'draft' || giveaway.status === 'cancelled') {
      return null
    }

    const now = new Date()
    const isAcceptingEntries =
      giveaway.status === 'active' &&
      now >= giveaway.start_date &&
      now <= giveaway.end_date

    return {
      id: giveaway.id,
      title: giveaway.title,
      slug: giveaway.slug,
      description: giveaway.description,
      rules: giveaway.rules,
      prizeTitle: giveaway.prize_title,
      prizeValue: giveaway.prize_value ? Number(giveaway.prize_value) : null,
      prizeDescription: giveaway.prize_description,
      prizeImage: giveaway.prize_image,
      detailImage: giveaway.detail_image,
      startDate: giveaway.start_date.toISOString(),
      endDate: giveaway.end_date.toISOString(),
      drawingDate: giveaway.drawing_date?.toISOString() || null,
      status: giveaway.status,
      restrictedStates: giveaway.restricted_states,
      isAcceptingEntries,
      totalEntries: giveaway._count.entries,
      numWinners: giveaway.num_winners,
      deliveryMethod: giveaway.delivery_method || 'email',
      finePrint: giveaway.fine_print,
      entryType: giveaway.entry_type || 'both',
      primaryContact: giveaway.primary_contact || 'phone',
      bonusEntriesEnabled: giveaway.bonus_entries_enabled || false,
      bonusEntryCount: giveaway.bonus_entry_count || 1,
      sections: giveaway.sections.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        order: s.section_order,
        isExpanded: s.is_expanded,
      })),
    }
  } catch (error) {
    console.error('Error fetching giveaway:', error)
    return null
  }
}

// Legal Pages
export async function getLegalPage(slug: string) {
  try {
    const page = await prisma.legal_pages.findUnique({
      where: { slug },
    })

    if (!page) return null

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      metaDescription: page.meta_description,
      content: page.content,
      contactCompany: page.contact_company,
      contactNmlsId: page.contact_nmls_id,
      contactAddress: page.contact_address,
      contactEmail: page.contact_email,
      contactPhone: page.contact_phone,
      contactWebsite: page.contact_website,
      updatedAt: page.updated_at,
      createdAt: page.created_at,
    }
  } catch (error) {
    console.error('Error fetching legal page:', error)
    return null
  }
}

// Loan Page Data Functions
export async function getLoanProducts() {
  try {
    const products = await prisma.loan_products.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    })
    return products
  } catch (error) {
    console.error('Error fetching loan products:', error)
    return []
  }
}

export async function getLoanProductBySlug(slug: string) {
  try {
    const product = await prisma.loan_products.findFirst({
      where: { slug, is_active: true },
    })
    return product
  } catch (error) {
    console.error('Error fetching loan product by slug:', error)
    return null
  }
}

export async function getOtherLoanProducts(excludeSlug: string) {
  try {
    const products = await prisma.loan_products.findMany({
      where: {
        is_active: true,
        slug: { not: excludeSlug }
      },
      orderBy: { display_order: 'asc' },
    })
    return products
  } catch (error) {
    console.error('Error fetching other loan products:', error)
    return []
  }
}

export async function getLoanPageWidgets() {
  try {
    const widgets = await prisma.loan_page_widgets.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    })
    return widgets
  } catch (error) {
    console.error('Error fetching loan page widgets:', error)
    return []
  }
}

export async function getLoanPageSettings() {
  try {
    const settings = await prisma.loan_page_settings.findFirst({
      where: { id: 1 },
    })
    return settings
  } catch (error) {
    console.error('Error fetching loan page settings:', error)
    return null
  }
}

// Lender Logos
export async function getLenderLogos() {
  try {
    const [logos, settings] = await Promise.all([
      prisma.lender_logos.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
        include: {
          media: true,
        },
      }),
      prisma.lender_logos_settings.findFirst({
        where: { id: 1 },
      }),
    ])

    return {
      items: logos.map(logo => ({
        id: logo.id,
        name: logo.name,
        logoUrl: logo.logo_url || (logo.media ? logo.media.url : null),
        width: logo.width,
        height: logo.height,
      })),
      sectionTitle: settings?.section_title || 'Trusted Lender Partners',
    }
  } catch (error) {
    console.error('Error fetching lender logos:', error)
    return { items: [], sectionTitle: 'Trusted Lender Partners' }
  }
}

// Meta Landing Page Settings
export async function getMetaLandingSettings() {
  try {
    const settings = await prisma.meta_landing_page_settings.findFirst()

    if (!settings) {
      return {
        noticeEnabled: true,
        headerDesktopEnabled: true,
        headerMobileEnabled: true,
        menuEnabled: true,
        menuItems: [] as { label: string; url: string; openInNewTab?: boolean }[],
        applyButton: {
          text: 'Apply Now',
          url: '/apply',
          color: '#d93c37',
          textColor: '#ffffff',
        },
        heading: {
          line1: 'Find Out',
          line2: 'Your Homebuying',
          line3: 'Budget Today',
        },
        description: 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
        ctaButton: {
          text: 'Check My Budget',
          url: '/apply',
          color: '#d93c37',
          textColor: '#ffffff',
        },
      }
    }

    return {
      noticeEnabled: settings.notice_enabled ?? true,
      headerDesktopEnabled: settings.header_desktop_enabled ?? true,
      headerMobileEnabled: settings.header_mobile_enabled ?? true,
      menuEnabled: settings.menu_enabled ?? true,
      menuItems: (settings.menu_items as { label: string; url: string; openInNewTab?: boolean }[]) || [],
      applyButton: {
        text: settings.apply_button_text || 'Apply Now',
        url: settings.apply_button_url || '/apply',
        color: settings.apply_button_color || '#d93c37',
        textColor: settings.apply_button_text_color || '#ffffff',
      },
      heading: {
        line1: settings.heading_line1 || 'Find Out',
        line2: settings.heading_line2 || 'Your Homebuying',
        line3: settings.heading_line3 || 'Budget Today',
      },
      description: settings.description_text || 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
      ctaButton: {
        text: settings.cta_button_text || 'Check My Budget',
        url: settings.cta_button_url || '/apply',
        color: settings.cta_button_color || '#d93c37',
        textColor: settings.cta_button_text_color || '#ffffff',
      },
    }
  } catch (error) {
    console.error('Error fetching meta landing settings:', error)
    return {
      noticeEnabled: true,
      headerDesktopEnabled: true,
      headerMobileEnabled: true,
      menuEnabled: true,
      menuItems: [] as { label: string; url: string; openInNewTab?: boolean }[],
      applyButton: {
        text: 'Apply Now',
        url: '/apply',
        color: '#d93c37',
        textColor: '#ffffff',
      },
      heading: {
        line1: 'Find Out',
        line2: 'Your Homebuying',
        line3: 'Budget Today',
      },
      description: 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
      ctaButton: {
        text: 'Check My Budget',
        url: '/apply',
        color: '#d93c37',
        textColor: '#ffffff',
      },
    }
  }
}
