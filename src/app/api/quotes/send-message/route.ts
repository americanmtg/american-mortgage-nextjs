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

// Replace placeholders in template text
function replacePlaceholders(text: string, data: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// Build email HTML from template settings
function buildEmailHtml(
  templateSettings: {
    greeting: string;
    introText: string;
    bodyText: string;
    buttonText: string;
    showApplyButton: boolean;
    applyButtonText: string;
    closingText: string;
    signatureText: string;
    primaryColor: string;
    buttonColor: string;
  },
  quoteData: {
    firstName: string;
    quoteId: string;
    loanType: string;
    purchasePrice: string;
    loanAmount: string;
    interestRate: string;
    loanTerm: number;
    totalMonthlyPayment: string;
    quoteUrl: string;
    applyUrl: string;
  },
  companyInfo: {
    company_name: string;
    phone: string;
    email: string;
    nmls_id: string;
  }
): string {
  const placeholders = {
    firstName: quoteData.firstName,
    quoteId: quoteData.quoteId,
    loanType: quoteData.loanType,
    purchasePrice: quoteData.purchasePrice,
    loanAmount: quoteData.loanAmount,
    interestRate: quoteData.interestRate,
    loanTerm: String(quoteData.loanTerm),
    totalMonthlyPayment: quoteData.totalMonthlyPayment,
  };

  const greeting = replacePlaceholders(templateSettings.greeting, placeholders);
  const introText = replacePlaceholders(templateSettings.introText, placeholders);
  const bodyText = replacePlaceholders(templateSettings.bodyText, placeholders);
  const closingText = replacePlaceholders(templateSettings.closingText, placeholders);

  const applyButtonHtml = templateSettings.showApplyButton
    ? `<a href="${quoteData.applyUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">${templateSettings.applyButtonText}</a>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: ${templateSettings.primaryColor}; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${companyInfo.company_name}</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px;">${greeting}</p>

          <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px;">${introText}</p>

          <!-- Quote Details Box -->
          <div style="background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px; font-size: 18px; color: ${templateSettings.primaryColor}; border-bottom: 2px solid ${templateSettings.primaryColor}; padding-bottom: 10px;">
              Quote #${quoteData.quoteId}
            </h2>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Loan Type:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quoteData.loanType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Purchase Price:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quoteData.purchasePrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Loan Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quoteData.loanAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Interest Rate:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quoteData.interestRate}%</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Loan Term:</td>
                <td style="padding: 8px 0; font-weight: bold; text-align: right;">${quoteData.loanTerm} years</td>
              </tr>
              <tr style="border-top: 2px solid #ddd;">
                <td style="padding: 12px 0; color: #333; font-weight: bold; font-size: 16px;">Est. Monthly Payment:</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 20px; text-align: right; color: ${templateSettings.primaryColor};">${quoteData.totalMonthlyPayment}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">${bodyText}</p>

          <!-- Buttons -->
          <div style="text-align: center; margin: 25px 0;">
            <a href="${quoteData.quoteUrl}" style="display: inline-block; background: ${templateSettings.buttonColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: ${templateSettings.showApplyButton ? '10px' : '0'};">${templateSettings.buttonText}</a>
            ${applyButtonHtml}
          </div>

          <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 20px 0;">${closingText}</p>

          <p style="font-size: 14px; color: #333; margin: 20px 0 5px;">
            ${templateSettings.signatureText}<br>
            <strong>${companyInfo.company_name} Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5;">
          <p style="margin: 0 0 5px;">${companyInfo.company_name} | ${companyInfo.nmls_id}</p>
          <p style="margin: 0 0 5px;">${companyInfo.phone} | ${companyInfo.email}</p>
          <p style="margin: 0;">Equal Housing Opportunity</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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

    // Get email template settings
    const templateResult = await pool.query(
      'SELECT * FROM quote_email_settings WHERE id = 1'
    );
    const templateSettings = templateResult.rows[0] || {
      subject: 'Your Loan Estimate - Quote #{quoteId}',
      greeting: 'Hi {firstName},',
      intro_text: 'Thank you for using our mortgage calculator! Here are the details of your personalized loan estimate:',
      body_text: 'Ready to take the next step? Click the button below to view your full quote with additional details, or apply now to get started on your home loan journey.',
      button_text: 'View Your Quote',
      show_apply_button: true,
      apply_button_text: 'Apply Now',
      closing_text: "If you have any questions, feel free to reach out. We're here to help you every step of the way.",
      signature_text: 'Best regards,',
      primary_color: '#0f2e71',
      button_color: '#0f2e71',
    };

    // Get from address
    const fromEmail = process.env.SENDGRID_QUOTES_FROM_EMAIL || 'preston@americanmtg.com';
    const fromName = process.env.SENDGRID_QUOTES_FROM_NAME || 'Preston Million';

    // Send email if requested
    if ((channel === 'email' || channel === 'both') && quote.email) {
      try {
        const quoteData = {
          firstName: quote.first_name,
          quoteId: quote.quote_id,
          loanType: quote.loan_type,
          purchasePrice: formatCurrency(parseFloat(quote.purchase_price)),
          loanAmount: formatCurrency(parseFloat(quote.loan_amount)),
          interestRate: parseFloat(quote.interest_rate).toFixed(3),
          loanTerm: quote.loan_term,
          totalMonthlyPayment: formatCurrency(parseFloat(quote.total_monthly_payment)),
          quoteUrl,
          applyUrl: `${baseUrl}/apply`,
        };

        // If custom message provided, send custom email
        if (customMessage) {
          const customHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: ${templateSettings.primary_color}; color: white; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">${companyInfo.company_name}</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${quote.first_name},</p>
                  <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px;">${customMessage.replace(/\n/g, '<br>')}</p>
                  <div style="text-align: center; margin: 25px 0;">
                    <a href="${quoteUrl}" style="display: inline-block; background: ${templateSettings.button_color}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">${templateSettings.button_text}</a>
                  </div>
                  <p style="font-size: 14px; color: #333; margin: 20px 0 5px;">
                    ${templateSettings.signature_text}<br>
                    <strong>${companyInfo.company_name} Team</strong>
                  </p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5;">
                  <p style="margin: 0 0 5px;">${companyInfo.company_name} | ${companyInfo.nmls_id}</p>
                  <p style="margin: 0;">Equal Housing Opportunity</p>
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
          // Build email from template settings
          const emailHtml = buildEmailHtml(
            {
              greeting: templateSettings.greeting,
              introText: templateSettings.intro_text,
              bodyText: templateSettings.body_text,
              buttonText: templateSettings.button_text,
              showApplyButton: templateSettings.show_apply_button,
              applyButtonText: templateSettings.apply_button_text,
              closingText: templateSettings.closing_text,
              signatureText: templateSettings.signature_text,
              primaryColor: templateSettings.primary_color,
              buttonColor: templateSettings.button_color,
            },
            quoteData,
            companyInfo
          );

          // Build subject with placeholders
          const subject = replacePlaceholders(templateSettings.subject, {
            quoteId: quote.quote_id,
            firstName: quote.first_name,
          });

          const emailResult = await sendEmail({
            to: quote.email,
            subject,
            template: EMAIL_TEMPLATES.QUOTE_CONFIRMATION,
            fromEmail,
            fromName,
            html: emailHtml,
            data: {},
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
