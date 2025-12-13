import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/notifications/email';
import { sendSms, SMS_TYPES } from '@/lib/notifications/sms';

// Format currency with accounting format: $1,234.56
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// POST - Send email/SMS to a quote recipient (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { quoteId, channel, customMessage, loanOfficerId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    if (!channel || !['email', 'sms', 'both'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be "email", "sms", or "both"' },
        { status: 400 }
      );
    }

    // Get quote from database
    const result = await pool.query(
      'SELECT * FROM quotes WHERE quote_id = $1 OR id = $2',
      [quoteId, parseInt(quoteId) || 0]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = result.rows[0];
    const results: { email?: { success: boolean; error?: string }; sms?: { success: boolean; error?: string } } = {};

    // Get base URL for quote link
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'dev.americanmtg.com';
    const baseUrl = `${protocol}://${host}`;
    const quoteUrl = `${baseUrl}/quote/${quote.quote_id}`;

    // Get company info for email
    const siteResult = await pool.query(
      'SELECT company_name, phone, email FROM site_settings LIMIT 1'
    );
    const footerResult = await pool.query(
      'SELECT nmls_info FROM footer LIMIT 1'
    );

    const site = siteResult.rows[0] || {};
    const footerData = footerResult.rows[0] || {};

    const companyInfo = {
      company_name: site.company_name || 'American Mortgage',
      phone: site.phone || '(870) 926-4052',
      email: site.email || 'hello@americanmtg.com',
      nmls_id: footerData.nmls_info || 'NMLS ID #2676687'
    };

    // Get loan officer info if provided (for custom from address)
    let fromEmail = process.env.SENDGRID_QUOTES_FROM_EMAIL || 'quotes@americanmtg.com';
    let fromName = process.env.SENDGRID_QUOTES_FROM_NAME || 'American Mortgage';

    if (loanOfficerId) {
      const officerResult = await pool.query(
        'SELECT name, email FROM loan_officers WHERE id = $1 AND is_active = true',
        [loanOfficerId]
      );
      if (officerResult.rows.length > 0) {
        const officer = officerResult.rows[0];
        fromEmail = officer.email;
        fromName = officer.name;
      }
    }

    // Send email if requested
    if ((channel === 'email' || channel === 'both') && quote.email) {
      try {
        // If custom message provided, send custom email
        if (customMessage) {
          const customHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f5f5f5; color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #0f2e71; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #0f2e71; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                h1 { margin: 0; font-size: 28px; color: #0f2e71; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${companyInfo.company_name}</h1>
                </div>
                <div class="content">
                  <p>Hi ${quote.first_name},</p>
                  <p>${customMessage.replace(/\n/g, '<br>')}</p>
                  <p style="text-align: center;">
                    <a href="${quoteUrl}" class="button">View Your Quote</a>
                  </p>
                  <p>Best regards,<br>${companyInfo.company_name} Team</p>
                </div>
                <div class="footer">
                  <p>${companyInfo.company_name} | ${companyInfo.nmls_id}</p>
                  <p>Equal Housing Opportunity</p>
                </div>
              </div>
            </body>
            </html>
          `;

          const emailResult = await sendEmail({
            to: quote.email,
            subject: `Message from ${fromName} - Quote #${quote.quote_id}`,
            template: EMAIL_TEMPLATES.QUOTE_CONFIRMATION,
            fromEmail,
            fromName,
            html: customHtml,
            data: {},
          });
          results.email = { success: emailResult.success, error: emailResult.error };
        } else {
          // Send standard quote confirmation email
          const { sendQuoteConfirmation } = await import('@/lib/notifications/email');
          const emailResult = await sendQuoteConfirmation({
            email: quote.email,
            firstName: quote.first_name,
            quoteId: quote.quote_id,
            loanType: quote.loan_type,
            purchasePrice: formatCurrency(parseFloat(quote.purchase_price)),
            loanAmount: formatCurrency(parseFloat(quote.loan_amount)),
            interestRate: parseFloat(quote.interest_rate),
            loanTerm: quote.loan_term,
            totalMonthlyPayment: formatCurrency(parseFloat(quote.total_monthly_payment)),
            quoteUrl,
            applyUrl: `${baseUrl}/apply`,
            companyName: companyInfo.company_name,
            companyPhone: companyInfo.phone,
            companyEmail: companyInfo.email,
            companyNmls: companyInfo.nmls_id,
            fromEmail,
            fromName,
          });
          results.email = { success: emailResult.success, error: emailResult.error };
        }
      } catch (err) {
        results.email = { success: false, error: err instanceof Error ? err.message : 'Failed to send email' };
      }
    } else if (channel === 'email' || channel === 'both') {
      results.email = { success: false, error: 'No email address on file' };
    }

    // Send SMS if requested
    if ((channel === 'sms' || channel === 'both') && quote.phone) {
      try {
        const message = customMessage
          ? `${customMessage}\n\nView your quote: ${quoteUrl} - American Mortgage`
          : `Hi ${quote.first_name}! Your loan estimate is ready. Est. monthly payment: ${formatCurrency(parseFloat(quote.total_monthly_payment))}. View your quote: ${quoteUrl} - American Mortgage`;

        const smsResult = await sendSms({
          to: quote.phone,
          message,
          type: SMS_TYPES.QUOTE_CONFIRMATION,
          data: {
            firstName: quote.first_name,
            quoteId: quote.quote_id,
            quoteUrl,
          },
        });
        results.sms = { success: smsResult.success, error: smsResult.error };
      } catch (err) {
        results.sms = { success: false, error: err instanceof Error ? err.message : 'Failed to send SMS' };
      }
    } else if (channel === 'sms' || channel === 'both') {
      results.sms = { success: false, error: 'No phone number on file' };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
