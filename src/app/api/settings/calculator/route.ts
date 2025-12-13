import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface LoanType {
  name: string
  label: string
  minDownPayment: number
  enabled: boolean
}

const defaultLoanTypes: LoanType[] = [
  { name: 'FHA', label: 'FHA', minDownPayment: 3.5, enabled: true },
  { name: 'Conventional', label: 'Conventional', minDownPayment: 3, enabled: true },
  { name: 'USDA', label: 'USDA', minDownPayment: 0, enabled: true },
  { name: 'VA', label: 'VA', minDownPayment: 0, enabled: true },
  { name: 'Non-QM', label: 'Non-QM / Investor', minDownPayment: 10, enabled: true },
]

const defaultLabels = {
  resultsTitle: 'Estimated Monthly Payment',
  resultsSubtext: 'Principal, interest, taxes, and insurance based on your inputs.',
  piLabel: 'Principal & Interest',
  piSubtext: 'Based on {rate}% interest rate',
  insuranceLabel: 'Property Insurance',
  insuranceSubtext: 'Estimated monthly insurance ({rate}% annually)',
  taxesLabel: 'Property Taxes',
  taxesSubtext: 'Estimated monthly taxes ({rate}% annually)',
  mipLabel: 'FHA Mortgage Insurance (MIP)',
  mipSubtext: 'Required for FHA loans ({rate}% annually)',
  pmiLabel: 'Private Mortgage Insurance (PMI)',
  pmiSubtext: 'Required until 20% equity ({rate}% annually)',
}

// GET - Get calculator settings (public for frontend)
export async function GET() {
  try {
    const settings = await prisma.calculator_settings.findFirst()

    if (!settings) {
      // Return defaults if no settings exist
      return successResponse({
        loanTypes: defaultLoanTypes,
        propertyInsuranceRate: 1.0,
        propertyTaxRate: 1.0,
        minPurchasePrice: 50000,
        maxPurchasePrice: 2000000,
        defaultPurchasePrice: 300000,
        minInterestRate: 3.0,
        maxInterestRate: 10.0,
        defaultInterestRate: 6.5,
        ctaTitle: 'Take the First Step Towards Your New Home',
        ctaText: 'With our simple home loan calculator, you can estimate your monthly payments and start your journey towards owning a new home.',
        ctaButtonText: 'Get Pre-Approved Now',
        ctaButtonUrl: '/apply',
        ctaButtonColor: '#181F53',
        ctaButtonTextColor: '#ffffff',
        pageTitle: 'Home Loan Calculator',
        sliderThumbSize: 60,
        sliderTrackHeight: 20,
        // MIP/PMI rates
        fhaMipRateHigh: 0.55,
        fhaMipRateLow: 0.50,
        fhaMipLtvThreshold: 95.0,
        conventionalPmiRate: 0.75,
        pmiLtvCutoff: 80.0,
        // Labels
        ...defaultLabels,
      })
    }

    return successResponse({
      id: settings.id,
      loanTypes: (settings.loan_types as unknown as LoanType[]) || defaultLoanTypes,
      propertyInsuranceRate: Number(settings.property_insurance_rate) || 1.0,
      propertyTaxRate: Number(settings.property_tax_rate) || 1.0,
      minPurchasePrice: settings.min_purchase_price || 50000,
      maxPurchasePrice: settings.max_purchase_price || 2000000,
      defaultPurchasePrice: settings.default_purchase_price || 300000,
      minInterestRate: Number(settings.min_interest_rate) || 3.0,
      maxInterestRate: Number(settings.max_interest_rate) || 10.0,
      defaultInterestRate: Number(settings.default_interest_rate) || 6.5,
      ctaTitle: settings.cta_title || 'Take the First Step Towards Your New Home',
      ctaText: settings.cta_text || 'With our simple home loan calculator, you can estimate your monthly payments and start your journey towards owning a new home.',
      ctaButtonText: settings.cta_button_text || 'Get Pre-Approved Now',
      ctaButtonUrl: settings.cta_button_url || '/apply',
      ctaButtonColor: settings.cta_button_color || '#181F53',
      ctaButtonTextColor: settings.cta_button_text_color || '#ffffff',
      pageTitle: settings.page_title || 'Home Loan Calculator',
      sliderThumbSize: settings.slider_thumb_size || 60,
      sliderTrackHeight: settings.slider_track_height || 20,
      // MIP/PMI rates
      fhaMipRateHigh: Number(settings.fha_mip_rate_high) || 0.55,
      fhaMipRateLow: Number(settings.fha_mip_rate_low) || 0.50,
      fhaMipLtvThreshold: Number(settings.fha_mip_ltv_threshold) || 95.0,
      conventionalPmiRate: Number(settings.conventional_pmi_rate) || 0.75,
      pmiLtvCutoff: Number(settings.pmi_ltv_cutoff) || 80.0,
      // Labels
      resultsTitle: settings.results_title || defaultLabels.resultsTitle,
      resultsSubtext: settings.results_subtext || defaultLabels.resultsSubtext,
      piLabel: settings.pi_label || defaultLabels.piLabel,
      piSubtext: settings.pi_subtext || defaultLabels.piSubtext,
      insuranceLabel: settings.insurance_label || defaultLabels.insuranceLabel,
      insuranceSubtext: settings.insurance_subtext || defaultLabels.insuranceSubtext,
      taxesLabel: settings.taxes_label || defaultLabels.taxesLabel,
      taxesSubtext: settings.taxes_subtext || defaultLabels.taxesSubtext,
      mipLabel: settings.mip_label || defaultLabels.mipLabel,
      mipSubtext: settings.mip_subtext || defaultLabels.mipSubtext,
      pmiLabel: settings.pmi_label || defaultLabels.pmiLabel,
      pmiSubtext: settings.pmi_subtext || defaultLabels.pmiSubtext,
      // Quote settings
      quotePhoneRequired: settings.quote_phone_required ?? true,
      quoteEmailRequired: settings.quote_email_required ?? true,
      // New fields
      homesteadTaxCredit: Number(settings.homestead_tax_credit) || 600,
      disclaimerText: settings.disclaimer_text || 'This calculator provides estimates for informational purposes only and does not constitute a loan offer or commitment to lend. Actual rates, payments, and terms may vary based on your credit profile, property location, loan program, and other factors. Property taxes and insurance amounts are estimates based on average rates and may differ from actual costs. Mortgage insurance (MIP/PMI) calculations are approximations. Contact us for a personalized quote and accurate figures. All loans subject to credit approval.',
      disclaimerCollapsible: settings.disclaimer_collapsible ?? true,
      ctaTextEnabled: settings.cta_text_enabled ?? true,
      sliderColor: settings.slider_color || '#181F53',
      sliderMaxPurchasePrice: settings.slider_max_purchase_price || 1000000,
      downloadQuoteButtonText: settings.download_quote_button_text || 'Download Quote',
      downloadQuoteButtonColor: settings.download_quote_button_color || '#DC2626',
      downloadQuoteButtonFullWidth: settings.download_quote_button_full_width ?? true,
      quoteFormButtonColor: settings.quote_form_button_color || '#181F53',
      faqItems: settings.faq_items || [],
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching calculator settings:', error)
    return errorResponse('Failed to fetch calculator settings')
  }
}

// PUT - Update calculator settings (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      loanTypes,
      propertyInsuranceRate,
      propertyTaxRate,
      minPurchasePrice,
      maxPurchasePrice,
      defaultPurchasePrice,
      minInterestRate,
      maxInterestRate,
      defaultInterestRate,
      ctaTitle,
      ctaText,
      ctaButtonText,
      ctaButtonUrl,
      ctaButtonColor,
      ctaButtonTextColor,
      pageTitle,
      sliderThumbSize,
      sliderTrackHeight,
      // MIP/PMI rates
      fhaMipRateHigh,
      fhaMipRateLow,
      fhaMipLtvThreshold,
      conventionalPmiRate,
      pmiLtvCutoff,
      // Labels
      resultsTitle,
      resultsSubtext,
      piLabel,
      piSubtext,
      insuranceLabel,
      insuranceSubtext,
      taxesLabel,
      taxesSubtext,
      mipLabel,
      mipSubtext,
      pmiLabel,
      pmiSubtext,
      // Quote settings
      quotePhoneRequired,
      quoteEmailRequired,
      // New fields
      homesteadTaxCredit,
      disclaimerText,
      disclaimerCollapsible,
      ctaTextEnabled,
      sliderColor,
      sliderMaxPurchasePrice,
      downloadQuoteButtonText,
      downloadQuoteButtonColor,
      downloadQuoteButtonFullWidth,
      quoteFormButtonColor,
      faqItems,
    } = body

    // Find existing settings or create new
    const existing = await prisma.calculator_settings.findFirst()

    const data = {
      ...(loanTypes !== undefined && { loan_types: loanTypes }),
      ...(propertyInsuranceRate !== undefined && { property_insurance_rate: propertyInsuranceRate }),
      ...(propertyTaxRate !== undefined && { property_tax_rate: propertyTaxRate }),
      ...(minPurchasePrice !== undefined && { min_purchase_price: minPurchasePrice }),
      ...(maxPurchasePrice !== undefined && { max_purchase_price: maxPurchasePrice }),
      ...(defaultPurchasePrice !== undefined && { default_purchase_price: defaultPurchasePrice }),
      ...(minInterestRate !== undefined && { min_interest_rate: minInterestRate }),
      ...(maxInterestRate !== undefined && { max_interest_rate: maxInterestRate }),
      ...(defaultInterestRate !== undefined && { default_interest_rate: defaultInterestRate }),
      ...(ctaTitle !== undefined && { cta_title: ctaTitle }),
      ...(ctaText !== undefined && { cta_text: ctaText }),
      ...(ctaButtonText !== undefined && { cta_button_text: ctaButtonText }),
      ...(ctaButtonUrl !== undefined && { cta_button_url: ctaButtonUrl }),
      ...(ctaButtonColor !== undefined && { cta_button_color: ctaButtonColor }),
      ...(ctaButtonTextColor !== undefined && { cta_button_text_color: ctaButtonTextColor }),
      ...(pageTitle !== undefined && { page_title: pageTitle }),
      ...(sliderThumbSize !== undefined && { slider_thumb_size: sliderThumbSize }),
      ...(sliderTrackHeight !== undefined && { slider_track_height: sliderTrackHeight }),
      // MIP/PMI rates
      ...(fhaMipRateHigh !== undefined && { fha_mip_rate_high: fhaMipRateHigh }),
      ...(fhaMipRateLow !== undefined && { fha_mip_rate_low: fhaMipRateLow }),
      ...(fhaMipLtvThreshold !== undefined && { fha_mip_ltv_threshold: fhaMipLtvThreshold }),
      ...(conventionalPmiRate !== undefined && { conventional_pmi_rate: conventionalPmiRate }),
      ...(pmiLtvCutoff !== undefined && { pmi_ltv_cutoff: pmiLtvCutoff }),
      // Labels
      ...(resultsTitle !== undefined && { results_title: resultsTitle }),
      ...(resultsSubtext !== undefined && { results_subtext: resultsSubtext }),
      ...(piLabel !== undefined && { pi_label: piLabel }),
      ...(piSubtext !== undefined && { pi_subtext: piSubtext }),
      ...(insuranceLabel !== undefined && { insurance_label: insuranceLabel }),
      ...(insuranceSubtext !== undefined && { insurance_subtext: insuranceSubtext }),
      ...(taxesLabel !== undefined && { taxes_label: taxesLabel }),
      ...(taxesSubtext !== undefined && { taxes_subtext: taxesSubtext }),
      ...(mipLabel !== undefined && { mip_label: mipLabel }),
      ...(mipSubtext !== undefined && { mip_subtext: mipSubtext }),
      ...(pmiLabel !== undefined && { pmi_label: pmiLabel }),
      ...(pmiSubtext !== undefined && { pmi_subtext: pmiSubtext }),
      // Quote settings
      ...(quotePhoneRequired !== undefined && { quote_phone_required: quotePhoneRequired }),
      ...(quoteEmailRequired !== undefined && { quote_email_required: quoteEmailRequired }),
      // New fields
      ...(homesteadTaxCredit !== undefined && { homestead_tax_credit: homesteadTaxCredit }),
      ...(disclaimerText !== undefined && { disclaimer_text: disclaimerText }),
      ...(disclaimerCollapsible !== undefined && { disclaimer_collapsible: disclaimerCollapsible }),
      ...(ctaTextEnabled !== undefined && { cta_text_enabled: ctaTextEnabled }),
      ...(sliderColor !== undefined && { slider_color: sliderColor }),
      ...(sliderMaxPurchasePrice !== undefined && { slider_max_purchase_price: sliderMaxPurchasePrice }),
      ...(downloadQuoteButtonText !== undefined && { download_quote_button_text: downloadQuoteButtonText }),
      ...(downloadQuoteButtonColor !== undefined && { download_quote_button_color: downloadQuoteButtonColor }),
      ...(downloadQuoteButtonFullWidth !== undefined && { download_quote_button_full_width: downloadQuoteButtonFullWidth }),
      ...(quoteFormButtonColor !== undefined && { quote_form_button_color: quoteFormButtonColor }),
      ...(faqItems !== undefined && { faq_items: faqItems }),
      updated_at: new Date(),
    }

    let settings
    if (existing) {
      settings = await prisma.calculator_settings.update({
        where: { id: existing.id },
        data,
      })
    } else {
      settings = await prisma.calculator_settings.create({
        data: {
          ...data,
          created_at: new Date(),
        },
      })
    }

    return successResponse({
      id: settings.id,
      loanTypes: (settings.loan_types as unknown as LoanType[]) || defaultLoanTypes,
      propertyInsuranceRate: Number(settings.property_insurance_rate) || 1.0,
      propertyTaxRate: Number(settings.property_tax_rate) || 1.0,
      minPurchasePrice: settings.min_purchase_price || 50000,
      maxPurchasePrice: settings.max_purchase_price || 2000000,
      defaultPurchasePrice: settings.default_purchase_price || 300000,
      minInterestRate: Number(settings.min_interest_rate) || 3.0,
      maxInterestRate: Number(settings.max_interest_rate) || 10.0,
      defaultInterestRate: Number(settings.default_interest_rate) || 6.5,
      ctaTitle: settings.cta_title || 'Take the First Step Towards Your New Home',
      ctaText: settings.cta_text || 'With our simple home loan calculator, you can estimate your monthly payments and start your journey towards owning a new home.',
      ctaButtonText: settings.cta_button_text || 'Get Pre-Approved Now',
      ctaButtonUrl: settings.cta_button_url || '/apply',
      ctaButtonColor: settings.cta_button_color || '#181F53',
      ctaButtonTextColor: settings.cta_button_text_color || '#ffffff',
      pageTitle: settings.page_title || 'Home Loan Calculator',
      sliderThumbSize: settings.slider_thumb_size || 60,
      sliderTrackHeight: settings.slider_track_height || 20,
      // MIP/PMI rates
      fhaMipRateHigh: Number(settings.fha_mip_rate_high) || 0.55,
      fhaMipRateLow: Number(settings.fha_mip_rate_low) || 0.50,
      fhaMipLtvThreshold: Number(settings.fha_mip_ltv_threshold) || 95.0,
      conventionalPmiRate: Number(settings.conventional_pmi_rate) || 0.75,
      pmiLtvCutoff: Number(settings.pmi_ltv_cutoff) || 80.0,
      // Labels
      resultsTitle: settings.results_title || defaultLabels.resultsTitle,
      resultsSubtext: settings.results_subtext || defaultLabels.resultsSubtext,
      piLabel: settings.pi_label || defaultLabels.piLabel,
      piSubtext: settings.pi_subtext || defaultLabels.piSubtext,
      insuranceLabel: settings.insurance_label || defaultLabels.insuranceLabel,
      insuranceSubtext: settings.insurance_subtext || defaultLabels.insuranceSubtext,
      taxesLabel: settings.taxes_label || defaultLabels.taxesLabel,
      taxesSubtext: settings.taxes_subtext || defaultLabels.taxesSubtext,
      mipLabel: settings.mip_label || defaultLabels.mipLabel,
      mipSubtext: settings.mip_subtext || defaultLabels.mipSubtext,
      pmiLabel: settings.pmi_label || defaultLabels.pmiLabel,
      pmiSubtext: settings.pmi_subtext || defaultLabels.pmiSubtext,
      // Quote settings
      quotePhoneRequired: settings.quote_phone_required ?? true,
      quoteEmailRequired: settings.quote_email_required ?? true,
      // New fields
      homesteadTaxCredit: Number(settings.homestead_tax_credit) || 600,
      disclaimerText: settings.disclaimer_text || '',
      disclaimerCollapsible: settings.disclaimer_collapsible ?? true,
      ctaTextEnabled: settings.cta_text_enabled ?? true,
      sliderColor: settings.slider_color || '#181F53',
      sliderMaxPurchasePrice: settings.slider_max_purchase_price || 1000000,
      downloadQuoteButtonText: settings.download_quote_button_text || 'Download Quote',
      downloadQuoteButtonColor: settings.download_quote_button_color || '#DC2626',
      downloadQuoteButtonFullWidth: settings.download_quote_button_full_width ?? true,
      quoteFormButtonColor: settings.quote_form_button_color || '#181F53',
      faqItems: settings.faq_items || [],
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating calculator settings:', error)
    return errorResponse('Failed to update calculator settings')
  }
}
