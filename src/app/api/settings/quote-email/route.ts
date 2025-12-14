import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import pool from '@/lib/db'

// GET - Get quote email settings
export async function GET() {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const result = await pool.query(
      'SELECT * FROM quote_email_settings WHERE id = 1'
    )

    if (result.rows.length === 0) {
      // Return defaults if no settings exist
      return successResponse({
        subject: 'Your Loan Estimate - Quote #{quoteId}',
        greeting: 'Hi {firstName},',
        introText: 'Thank you for using our mortgage calculator! Here are the details of your personalized loan estimate:',
        bodyText: 'Ready to take the next step? Click the button below to view your full quote with additional details, or apply now to get started on your home loan journey.',
        buttonText: 'View Your Quote',
        showApplyButton: true,
        applyButtonText: 'Apply Now',
        applyUrl: '/apply',
        closingText: "If you have any questions, feel free to reach out. I'm here to help you every step of the way.",
        signatureText: 'Best regards,',
        primaryColor: '#f5f5f5',
        buttonColor: '#0f2e71',
        senderName: 'Preston Million',
        senderTitle: 'Managing Partner',
        senderPhone: '(870) 926-4052',
        senderEmail: 'preston@americanmtg.com',
        senderNmls: 'NMLS #123456',
        senderWebsite: 'americanmtg.com',
      })
    }

    const settings = result.rows[0]
    return successResponse({
      subject: settings.subject,
      greeting: settings.greeting,
      introText: settings.intro_text,
      bodyText: settings.body_text,
      buttonText: settings.button_text,
      showApplyButton: settings.show_apply_button,
      applyButtonText: settings.apply_button_text,
      applyUrl: settings.apply_url || '/apply',
      closingText: settings.closing_text,
      signatureText: settings.signature_text,
      primaryColor: settings.primary_color,
      buttonColor: settings.button_color,
      senderName: settings.sender_name || 'Preston Million',
      senderTitle: settings.sender_title || 'Managing Partner',
      senderPhone: settings.sender_phone || '(870) 926-4052',
      senderEmail: settings.sender_email || 'preston@americanmtg.com',
      senderNmls: settings.sender_nmls || 'NMLS #123456',
      senderWebsite: settings.sender_website || 'americanmtg.com',
    })
  } catch (error) {
    console.error('Error fetching quote email settings:', error)
    return errorResponse('Failed to fetch quote email settings')
  }
}

// PUT - Update quote email settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      subject,
      greeting,
      introText,
      bodyText,
      buttonText,
      showApplyButton,
      applyButtonText,
      applyUrl,
      closingText,
      signatureText,
      primaryColor,
      buttonColor,
      senderName,
      senderTitle,
      senderPhone,
      senderEmail,
      senderNmls,
      senderWebsite,
    } = body

    const result = await pool.query(
      `INSERT INTO quote_email_settings (
        id, subject, greeting, intro_text, body_text, button_text,
        show_apply_button, apply_button_text, apply_url, closing_text, signature_text,
        primary_color, button_color, sender_name, sender_title, sender_phone,
        sender_email, sender_nmls, sender_website, updated_at
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject,
        greeting = EXCLUDED.greeting,
        intro_text = EXCLUDED.intro_text,
        body_text = EXCLUDED.body_text,
        button_text = EXCLUDED.button_text,
        show_apply_button = EXCLUDED.show_apply_button,
        apply_button_text = EXCLUDED.apply_button_text,
        apply_url = EXCLUDED.apply_url,
        closing_text = EXCLUDED.closing_text,
        signature_text = EXCLUDED.signature_text,
        primary_color = EXCLUDED.primary_color,
        button_color = EXCLUDED.button_color,
        sender_name = EXCLUDED.sender_name,
        sender_title = EXCLUDED.sender_title,
        sender_phone = EXCLUDED.sender_phone,
        sender_email = EXCLUDED.sender_email,
        sender_nmls = EXCLUDED.sender_nmls,
        sender_website = EXCLUDED.sender_website,
        updated_at = NOW()
      RETURNING *`,
      [
        subject || 'Your Loan Estimate - Quote #{quoteId}',
        greeting || 'Hi {firstName},',
        introText || 'Thank you for using our mortgage calculator!',
        bodyText || 'Ready to take the next step?',
        buttonText || 'View Your Quote',
        showApplyButton !== false,
        applyButtonText || 'Apply Now',
        applyUrl || '/apply',
        closingText || "If you have any questions, feel free to reach out.",
        signatureText || 'Best regards,',
        primaryColor || '#f5f5f5',
        buttonColor || '#0f2e71',
        senderName || 'Preston Million',
        senderTitle || 'Managing Partner',
        senderPhone || '(870) 926-4052',
        senderEmail || 'preston@americanmtg.com',
        senderNmls || 'NMLS #123456',
        senderWebsite || 'americanmtg.com',
      ]
    )

    const settings = result.rows[0]
    return successResponse({
      subject: settings.subject,
      greeting: settings.greeting,
      introText: settings.intro_text,
      bodyText: settings.body_text,
      buttonText: settings.button_text,
      showApplyButton: settings.show_apply_button,
      applyButtonText: settings.apply_button_text,
      applyUrl: settings.apply_url,
      closingText: settings.closing_text,
      signatureText: settings.signature_text,
      primaryColor: settings.primary_color,
      buttonColor: settings.button_color,
      senderName: settings.sender_name,
      senderTitle: settings.sender_title,
      senderPhone: settings.sender_phone,
      senderEmail: settings.sender_email,
      senderNmls: settings.sender_nmls,
      senderWebsite: settings.sender_website,
    })
  } catch (error) {
    console.error('Error updating quote email settings:', error)
    return errorResponse('Failed to update quote email settings')
  }
}
