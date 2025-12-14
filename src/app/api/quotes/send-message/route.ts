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

// Get the correct mortgage insurance label based on loan type
function getMortgageInsuranceLabel(loanType: string): string {
  switch (loanType?.toUpperCase()) {
    case 'FHA':
      return 'MIP';
    case 'VA':
      return 'VA Funding Fee';
    case 'USDA':
      return 'Guarantee Fee';
    default: // Conventional, Jumbo, etc.
      return 'PMI';
  }
}

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
    senderName: string;
    senderTitle: string;
    senderPhone: string;
    senderEmail: string;
    senderNmls: string;
    senderWebsite: string;
  },
  quoteData: {
    firstName: string;
    quoteId: string;
    loanType: string;
    purchasePrice: string;
    downPayment: string;
    downPaymentPercent: string;
    loanAmount: string;
    interestRate: string;
    loanTerm: number;
    principalInterest: string;
    mortgageInsurance: string;
    mortgageInsuranceLabel: string;
    propertyTaxes: string;
    homeInsurance: string;
    totalMonthlyPayment: string;
    quoteUrl: string;
    applyUrl: string;
  },
  companyInfo: {
    company_name: string;
    phone: string;
    email: string;
    nmls_id: string;
  },
  baseUrl: string,
  logoWhiteUrl: string | null
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

  const logoUrl = `${baseUrl}/cms-media/png-01.png`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header - Grey with Logo -->
        <div style="background: ${templateSettings.primaryColor}; padding: 12px 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: left; vertical-align: middle;">
                <img src="${logoUrl}" alt="${companyInfo.company_name}" style="height: 36px; width: auto; display: block;">
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <span style="font-size: 11px; color: #666; font-weight: 500;">Quote #${quoteData.quoteId}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Content -->
        <div style="padding: 24px 24px 20px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 16px;">${greeting}</p>

          <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 16px;">${introText}</p>

          <!-- Quote Details Box -->
          <div style="background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #666;">Loan Type:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.loanType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Purchase Price:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.purchasePrice}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Down Payment:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.downPayment} (${quoteData.downPaymentPercent}%)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Loan Amount:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.loanAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Interest Rate:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.interestRate}%</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Loan Term:</td>
                <td style="padding: 6px 0; font-weight: 600; text-align: right;">${quoteData.loanTerm} years</td>
              </tr>
              <tr style="border-top: 1px solid #ddd;">
                <td colspan="2" style="padding: 10px 0 6px; color: #333; font-weight: 600; font-size: 13px;">Monthly Payment Breakdown:</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Principal & Interest:</td>
                <td style="padding: 4px 0; font-weight: 500; text-align: right;">${quoteData.principalInterest}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">${quoteData.mortgageInsuranceLabel}:</td>
                <td style="padding: 4px 0; font-weight: 500; text-align: right;">${quoteData.mortgageInsurance}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Property Taxes:</td>
                <td style="padding: 4px 0; font-weight: 500; text-align: right;">${quoteData.propertyTaxes}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Homeowner's Insurance:</td>
                <td style="padding: 4px 0; font-weight: 500; text-align: right;">${quoteData.homeInsurance}</td>
              </tr>
              <tr style="border-top: 2px solid #ddd;">
                <td style="padding: 10px 0 0; color: #333; font-weight: 600; font-size: 14px;">Est. Monthly Payment:</td>
                <td style="padding: 10px 0 0; font-weight: bold; font-size: 18px; text-align: right; color: #dc2626;">${quoteData.totalMonthlyPayment}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 16px 0;">${bodyText}</p>

          <!-- Buttons -->
          <div style="text-align: center; margin: 20px 0;">
            <a href="${quoteData.quoteUrl}" style="display: inline-block; background: ${templateSettings.buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: ${templateSettings.showApplyButton ? '10px' : '0'};">${templateSettings.buttonText}</a>
            ${templateSettings.showApplyButton ? `<a href="${quoteData.applyUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${templateSettings.applyButtonText}</a>` : ''}
          </div>

          <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 16px 0;">${closingText}</p>

          <!-- Personalized Signature -->
          <div style="margin: 20px 0 0; padding-top: 16px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #333; margin: 0 0 12px;">${templateSettings.signatureText}</p>
            <p style="font-size: 14px; color: #333; margin: 0 0 2px;"><strong>${templateSettings.senderName}</strong> | ${templateSettings.senderTitle}</p>
            <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${companyInfo.company_name}</p>
            <p style="font-size: 11px; color: #888; margin: 0 0 2px;">${templateSettings.senderNmls}</p>
            <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${templateSettings.senderPhone}</p>
            <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${templateSettings.senderEmail}</p>
            <p style="font-size: 12px; color: #0f2e71; margin: 0;">${templateSettings.senderWebsite}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 14px 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e5e5;">
          <p style="margin: 0 0 8px; font-size: 10px; color: #888; line-height: 1.4;">This is an estimate only. Actual rates, terms, and fees may vary based on credit qualifications, property details, and current market conditions.</p>
          <p style="margin: 0;">${companyInfo.company_name}</p>
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
      `SELECT s.company_name, s.phone, s.email, s.logo_white_id, m.url as logo_white_url
       FROM site_settings s
       LEFT JOIN media m ON s.logo_white_id = m.id
       LIMIT 1`
    );
    const footerResult = await pool.query(
      'SELECT nmls_info FROM footer LIMIT 1'
    );

    const site = siteResult.rows[0] || {};
    const footerData = footerResult.rows[0] || {};
    const logoWhiteUrl = site.logo_white_url ? `${baseUrl}${site.logo_white_url}` : null;

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
      apply_url: '/apply',
      closing_text: "If you have any questions, feel free to reach out. I'm here to help you every step of the way.",
      signature_text: 'Best regards,',
      primary_color: '#f5f5f5',
      button_color: '#0f2e71',
      sender_name: 'Preston Million',
      sender_title: 'Managing Partner',
      sender_phone: '(870) 926-4052',
      sender_email: 'preston@americanmtg.com',
      sender_nmls: 'NMLS #123456',
      sender_website: 'americanmtg.com',
    };

    // Get from address
    const fromEmail = process.env.SENDGRID_QUOTES_FROM_EMAIL || 'preston@americanmtg.com';
    const fromName = process.env.SENDGRID_QUOTES_FROM_NAME || 'Preston Million';

    // Send email if requested
    if ((channel === 'email' || channel === 'both') && quote.email) {
      try {
        // Build apply URL - use full URL if starts with http, otherwise prepend baseUrl
        const configuredApplyUrl = templateSettings.apply_url || '/apply';
        const applyUrl = configuredApplyUrl.startsWith('http')
          ? configuredApplyUrl
          : `${baseUrl}${configuredApplyUrl.startsWith('/') ? '' : '/'}${configuredApplyUrl}`;

        // Calculate mortgage insurance (MIP for FHA, PMI for conventional)
        const monthlyMip = parseFloat(quote.monthly_mip || 0);
        const monthlyPmi = parseFloat(quote.monthly_pmi || 0);
        const mortgageInsurance = monthlyMip > 0 ? monthlyMip : monthlyPmi;

        const quoteData = {
          firstName: quote.first_name,
          quoteId: quote.quote_id,
          loanType: quote.loan_type,
          purchasePrice: formatCurrency(parseFloat(quote.purchase_price)),
          downPayment: formatCurrency(parseFloat(quote.down_payment_amount || 0)),
          downPaymentPercent: parseFloat(quote.down_payment_percent || 0).toFixed(1),
          loanAmount: formatCurrency(parseFloat(quote.loan_amount)),
          interestRate: parseFloat(quote.interest_rate).toFixed(3),
          loanTerm: quote.loan_term,
          principalInterest: formatCurrency(parseFloat(quote.monthly_pi || 0)),
          mortgageInsurance: formatCurrency(mortgageInsurance),
          mortgageInsuranceLabel: getMortgageInsuranceLabel(quote.loan_type),
          propertyTaxes: formatCurrency(parseFloat(quote.monthly_taxes || 0)),
          homeInsurance: formatCurrency(parseFloat(quote.monthly_insurance || 0)),
          totalMonthlyPayment: formatCurrency(parseFloat(quote.total_monthly_payment)),
          quoteUrl,
          applyUrl,
        };

        // If custom message provided, send custom email
        if (customMessage) {
          const logoUrlCustom = `${baseUrl}/cms-media/png-01.png`;
          const senderName = templateSettings.sender_name || 'Preston Million';
          const senderTitle = templateSettings.sender_title || 'Managing Partner';
          const senderPhone = templateSettings.sender_phone || '(870) 926-4052';
          const senderEmail = templateSettings.sender_email || 'preston@americanmtg.com';
          const senderNmls = templateSettings.sender_nmls || 'NMLS #123456';
          const senderWebsite = templateSettings.sender_website || 'americanmtg.com';

          const customHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header - Grey with Logo -->
                <div style="background: ${templateSettings.primary_color}; padding: 12px 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="text-align: left; vertical-align: middle;">
                        <img src="${logoUrlCustom}" alt="${companyInfo.company_name}" style="height: 36px; width: auto; display: block;">
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <span style="font-size: 11px; color: #666; font-weight: 500;">Quote #${quote.quote_id}</span>
                      </td>
                    </tr>
                  </table>
                </div>
                <div style="padding: 24px 24px 20px;">
                  <p style="font-size: 14px; color: #333; margin: 0 0 16px;">Hi ${quote.first_name},</p>
                  <p style="font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 16px;">${customMessage.replace(/\n/g, '<br>')}</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${quoteUrl}" style="display: inline-block; background: ${templateSettings.button_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${templateSettings.button_text}</a>
                  </div>
                  <!-- Personalized Signature -->
                  <div style="margin: 20px 0 0; padding-top: 16px; border-top: 1px solid #eee;">
                    <p style="font-size: 13px; color: #333; margin: 0 0 12px;">${templateSettings.signature_text}</p>
                    <p style="font-size: 14px; color: #333; margin: 0 0 2px;"><strong>${senderName}</strong> | ${senderTitle}</p>
                    <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${companyInfo.company_name}</p>
                    <p style="font-size: 11px; color: #888; margin: 0 0 2px;">${senderNmls}</p>
                    <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${senderPhone}</p>
                    <p style="font-size: 12px; color: #666; margin: 0 0 2px;">${senderEmail}</p>
                    <p style="font-size: 12px; color: #0f2e71; margin: 0;">${senderWebsite}</p>
                  </div>
                </div>
                <div style="background: #f8f9fa; padding: 14px 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #e5e5e5;">
                  <p style="margin: 0 0 8px; font-size: 10px; color: #888; line-height: 1.4;">This is an estimate only. Actual rates, terms, and fees may vary based on credit qualifications, property details, and current market conditions.</p>
                  <p style="margin: 0;">${companyInfo.company_name}</p>
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
              senderName: templateSettings.sender_name || 'Preston Million',
              senderTitle: templateSettings.sender_title || 'Managing Partner',
              senderPhone: templateSettings.sender_phone || '(870) 926-4052',
              senderEmail: templateSettings.sender_email || 'preston@americanmtg.com',
              senderNmls: templateSettings.sender_nmls || 'NMLS #123456',
              senderWebsite: templateSettings.sender_website || 'americanmtg.com',
            },
            quoteData,
            companyInfo,
            baseUrl,
            logoWhiteUrl
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
