import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get homepage settings (public for frontend, but also used by admin)
export async function GET() {
  try {
    const settings = await prisma.homepage_settings.findFirst()

    if (!settings) {
      return successResponse(null)
    }

    return successResponse({
      id: settings.id,
      // Hero Section
      hero: {
        eyebrow: settings.hero_eyebrow,
        headlineLine1: settings.hero_headline_line1,
        headlineLine2: settings.hero_headline_line2,
        buttonText: settings.hero_button_text,
        buttonUrl: settings.hero_button_url,
        reassuranceTime: settings.hero_reassurance_time,
        reassuranceText: settings.hero_reassurance_text,
        ratingPercent: settings.hero_rating_percent,
        ratingText: settings.hero_rating_text,
        widgetType: settings.hero_widget_type || 'badge',
        widgetEnabled: settings.hero_widget_enabled ?? true,
        photo1Url: settings.hero_photo1_url,
        photo2Url: settings.hero_photo2_url,
        photo3Url: settings.hero_photo3_url,
        badgeText: settings.hero_badge_text || 'Same-Day Pre-Approvals',
        badgeSubtext: settings.hero_badge_subtext || 'Fast & hassle-free',
        mobileGradientEnabled: settings.hero_mobile_gradient_enabled ?? true,
      },
      // Featured Loans Section
      featuredLoans: {
        eyebrow: settings.featured_loans_eyebrow,
        headlineLine1: settings.featured_loans_headline_line1,
        headlineLine2: settings.featured_loans_headline_line2,
      },
      // Down Payment Assistance Card
      dpa: {
        enabled: settings.dpa_enabled ?? true,
        headline: settings.dpa_headline,
        feature1: settings.dpa_feature1,
        feature2: settings.dpa_feature2,
        feature3: settings.dpa_feature3,
        buttonText: settings.dpa_button_text,
        buttonUrl: settings.dpa_button_url,
        reassuranceText: settings.dpa_reassurance_text,
        backgroundStyle: settings.dpa_background_style || 'blue',
      },
      // Tools & Calculators Section
      tools: {
        eyebrow: settings.tools_eyebrow,
        headlineLine1: settings.tools_headline_line1,
        headlineLine2: settings.tools_headline_line2,
        // Use JSON column if available, otherwise fall back to legacy fixed columns
        cards: settings.tools_cards ? (settings.tools_cards as any[]) : [
          {
            title: settings.tools_card1_title,
            description: settings.tools_card1_description,
            icon: settings.tools_card1_icon,
            url: settings.tools_card1_url,
          },
          {
            title: settings.tools_card2_title,
            description: settings.tools_card2_description,
            icon: settings.tools_card2_icon,
            url: settings.tools_card2_url,
          },
          {
            title: settings.tools_card3_title,
            description: settings.tools_card3_description,
            icon: settings.tools_card3_icon,
            url: settings.tools_card3_url,
          },
        ].filter(card => card.title || card.description || card.icon || card.url),
      },
      // More Loan Options Card
      moreLoans: {
        enabled: settings.more_loans_enabled ?? true,
        text: settings.more_loans_text,
        linkText: settings.more_loans_link_text,
        linkUrl: settings.more_loans_link_url,
        style: settings.more_loans_style || 'red',
      },
      // Latest Articles Section
      articles: {
        title: settings.articles_title,
        subtitle: settings.articles_subtitle,
      },
      // Why Choose Us Section
      whyChooseUs: settings.why_choose_us || null,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching homepage settings:', error)
    return errorResponse('Failed to fetch homepage settings')
  }
}

// PUT - Update homepage settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { hero, featuredLoans, whyChooseUs, dpa, tools, moreLoans, articles } = body

    // Find existing settings or create new
    const existing = await prisma.homepage_settings.findFirst()

    const data = {
      // Hero Section
      ...(hero?.eyebrow !== undefined && { hero_eyebrow: hero.eyebrow }),
      ...(hero?.headlineLine1 !== undefined && { hero_headline_line1: hero.headlineLine1 }),
      ...(hero?.headlineLine2 !== undefined && { hero_headline_line2: hero.headlineLine2 }),
      ...(hero?.buttonText !== undefined && { hero_button_text: hero.buttonText }),
      ...(hero?.buttonUrl !== undefined && { hero_button_url: hero.buttonUrl }),
      ...(hero?.reassuranceTime !== undefined && { hero_reassurance_time: hero.reassuranceTime }),
      ...(hero?.reassuranceText !== undefined && { hero_reassurance_text: hero.reassuranceText }),
      ...(hero?.ratingPercent !== undefined && { hero_rating_percent: hero.ratingPercent }),
      ...(hero?.ratingText !== undefined && { hero_rating_text: hero.ratingText }),
      ...(hero?.widgetType !== undefined && { hero_widget_type: hero.widgetType }),
      ...(hero?.widgetEnabled !== undefined && { hero_widget_enabled: hero.widgetEnabled }),
      ...(hero?.photo1Url !== undefined && { hero_photo1_url: hero.photo1Url }),
      ...(hero?.photo2Url !== undefined && { hero_photo2_url: hero.photo2Url }),
      ...(hero?.photo3Url !== undefined && { hero_photo3_url: hero.photo3Url }),
      ...(hero?.badgeText !== undefined && { hero_badge_text: hero.badgeText }),
      ...(hero?.badgeSubtext !== undefined && { hero_badge_subtext: hero.badgeSubtext }),
      ...(hero?.mobileGradientEnabled !== undefined && { hero_mobile_gradient_enabled: hero.mobileGradientEnabled }),

      // Featured Loans Section
      ...(featuredLoans?.eyebrow !== undefined && { featured_loans_eyebrow: featuredLoans.eyebrow }),
      ...(featuredLoans?.headlineLine1 !== undefined && { featured_loans_headline_line1: featuredLoans.headlineLine1 }),
      ...(featuredLoans?.headlineLine2 !== undefined && { featured_loans_headline_line2: featuredLoans.headlineLine2 }),

      // Why Choose Us Section (stored as JSON)
      ...(whyChooseUs !== undefined && { why_choose_us: whyChooseUs }),

      // Down Payment Assistance Card
      ...(dpa?.enabled !== undefined && { dpa_enabled: dpa.enabled }),
      ...(dpa?.headline !== undefined && { dpa_headline: dpa.headline }),
      ...(dpa?.feature1 !== undefined && { dpa_feature1: dpa.feature1 }),
      ...(dpa?.feature2 !== undefined && { dpa_feature2: dpa.feature2 }),
      ...(dpa?.feature3 !== undefined && { dpa_feature3: dpa.feature3 }),
      ...(dpa?.buttonText !== undefined && { dpa_button_text: dpa.buttonText }),
      ...(dpa?.buttonUrl !== undefined && { dpa_button_url: dpa.buttonUrl }),
      ...(dpa?.reassuranceText !== undefined && { dpa_reassurance_text: dpa.reassuranceText }),
      ...(dpa?.backgroundStyle !== undefined && { dpa_background_style: dpa.backgroundStyle }),

      // Tools & Calculators Section
      ...(tools?.eyebrow !== undefined && { tools_eyebrow: tools.eyebrow }),
      ...(tools?.headlineLine1 !== undefined && { tools_headline_line1: tools.headlineLine1 }),
      ...(tools?.headlineLine2 !== undefined && { tools_headline_line2: tools.headlineLine2 }),
      // Store cards as JSON array
      ...(tools?.cards !== undefined && { tools_cards: tools.cards }),

      // More Loan Options Card
      ...(moreLoans?.enabled !== undefined && { more_loans_enabled: moreLoans.enabled }),
      ...(moreLoans?.text !== undefined && { more_loans_text: moreLoans.text }),
      ...(moreLoans?.linkText !== undefined && { more_loans_link_text: moreLoans.linkText }),
      ...(moreLoans?.linkUrl !== undefined && { more_loans_link_url: moreLoans.linkUrl }),
      ...(moreLoans?.style !== undefined && { more_loans_style: moreLoans.style }),

      // Latest Articles Section
      ...(articles?.title !== undefined && { articles_title: articles.title }),
      ...(articles?.subtitle !== undefined && { articles_subtitle: articles.subtitle }),

      updated_at: new Date(),
    }

    let settings
    if (existing) {
      settings = await prisma.homepage_settings.update({
        where: { id: existing.id },
        data,
      })
    } else {
      settings = await prisma.homepage_settings.create({
        data: {
          ...data,
          created_at: new Date(),
        },
      })
    }

    return successResponse({
      id: settings.id,
      hero: {
        eyebrow: settings.hero_eyebrow,
        headlineLine1: settings.hero_headline_line1,
        headlineLine2: settings.hero_headline_line2,
        buttonText: settings.hero_button_text,
        buttonUrl: settings.hero_button_url,
        reassuranceTime: settings.hero_reassurance_time,
        reassuranceText: settings.hero_reassurance_text,
        ratingPercent: settings.hero_rating_percent,
        ratingText: settings.hero_rating_text,
        widgetType: settings.hero_widget_type || 'badge',
        widgetEnabled: settings.hero_widget_enabled ?? true,
        photo1Url: settings.hero_photo1_url,
        photo2Url: settings.hero_photo2_url,
        photo3Url: settings.hero_photo3_url,
        badgeText: settings.hero_badge_text || 'Same-Day Pre-Approvals',
        badgeSubtext: settings.hero_badge_subtext || 'Fast & hassle-free',
        mobileGradientEnabled: settings.hero_mobile_gradient_enabled ?? true,
      },
      featuredLoans: {
        eyebrow: settings.featured_loans_eyebrow,
        headlineLine1: settings.featured_loans_headline_line1,
        headlineLine2: settings.featured_loans_headline_line2,
      },
      dpa: {
        enabled: settings.dpa_enabled ?? true,
        headline: settings.dpa_headline,
        feature1: settings.dpa_feature1,
        feature2: settings.dpa_feature2,
        feature3: settings.dpa_feature3,
        buttonText: settings.dpa_button_text,
        buttonUrl: settings.dpa_button_url,
        reassuranceText: settings.dpa_reassurance_text,
        backgroundStyle: settings.dpa_background_style || 'blue',
      },
      tools: {
        eyebrow: settings.tools_eyebrow,
        headlineLine1: settings.tools_headline_line1,
        headlineLine2: settings.tools_headline_line2,
        cards: settings.tools_cards ? (settings.tools_cards as any[]) : [
          {
            title: settings.tools_card1_title,
            description: settings.tools_card1_description,
            icon: settings.tools_card1_icon,
            url: settings.tools_card1_url,
          },
          {
            title: settings.tools_card2_title,
            description: settings.tools_card2_description,
            icon: settings.tools_card2_icon,
            url: settings.tools_card2_url,
          },
          {
            title: settings.tools_card3_title,
            description: settings.tools_card3_description,
            icon: settings.tools_card3_icon,
            url: settings.tools_card3_url,
          },
        ].filter(card => card.title || card.description || card.icon || card.url),
      },
      moreLoans: {
        enabled: settings.more_loans_enabled ?? true,
        text: settings.more_loans_text,
        linkText: settings.more_loans_link_text,
        linkUrl: settings.more_loans_link_url,
        style: settings.more_loans_style || 'red',
      },
      articles: {
        title: settings.articles_title,
        subtitle: settings.articles_subtitle,
      },
      whyChooseUs: settings.why_choose_us || null,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating homepage settings:', error)
    return errorResponse('Failed to update homepage settings')
  }
}
