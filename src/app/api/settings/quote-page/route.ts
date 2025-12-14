import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import pool from '@/lib/db'

// Force dynamic to support PUT method
export const dynamic = 'force-dynamic'

// GET - Get quote page settings (public for the quote page to use)
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM quote_page_settings WHERE id = 1'
    )

    if (result.rows.length === 0) {
      // Return defaults if no settings exist
      return successResponse({
        applyButtonText: 'Apply Now',
        applyButtonColor: '#181F53',
        applyButtonTextColor: '#ffffff',
        applyButtonUrl: '/apply',
      })
    }

    const settings = result.rows[0]
    return successResponse({
      applyButtonText: settings.apply_button_text || 'Apply Now',
      applyButtonColor: settings.apply_button_color || '#181F53',
      applyButtonTextColor: settings.apply_button_text_color || '#ffffff',
      applyButtonUrl: settings.apply_button_url || '/apply',
    })
  } catch (error) {
    console.error('Error fetching quote page settings:', error)
    return errorResponse('Failed to fetch quote page settings')
  }
}

// PUT - Update quote page settings (requires auth)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { applyButtonText, applyButtonColor, applyButtonTextColor, applyButtonUrl } = body

    // Add text color column if it doesn't exist
    await pool.query(`
      ALTER TABLE quote_page_settings
      ADD COLUMN IF NOT EXISTS apply_button_text_color VARCHAR(20) DEFAULT '#ffffff'
    `).catch(() => {
      // Column might already exist, ignore error
    })

    const result = await pool.query(
      `INSERT INTO quote_page_settings (id, apply_button_text, apply_button_color, apply_button_text_color, apply_button_url, updated_at)
       VALUES (1, $1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET
         apply_button_text = EXCLUDED.apply_button_text,
         apply_button_color = EXCLUDED.apply_button_color,
         apply_button_text_color = EXCLUDED.apply_button_text_color,
         apply_button_url = EXCLUDED.apply_button_url,
         updated_at = NOW()
       RETURNING *`,
      [
        applyButtonText || 'Apply Now',
        applyButtonColor || '#181F53',
        applyButtonTextColor || '#ffffff',
        applyButtonUrl || '/apply',
      ]
    )

    const settings = result.rows[0]
    return successResponse({
      applyButtonText: settings.apply_button_text,
      applyButtonColor: settings.apply_button_color,
      applyButtonTextColor: settings.apply_button_text_color,
      applyButtonUrl: settings.apply_button_url,
    })
  } catch (error) {
    console.error('Error updating quote page settings:', error)
    return errorResponse('Failed to update quote page settings')
  }
}
