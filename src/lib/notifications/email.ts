/**
 * Email Notification Service
 *
 * Uses SendGrid for sending transactional emails for the giveaway system.
 */

import sgMail from '@sendgrid/mail';
import prisma from '@/lib/prisma';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'giveaways@americanmtg.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'American Mortgage Giveaways';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Email templates
export const EMAIL_TEMPLATES = {
  ENTRY_CONFIRMATION: 'entry_confirmation',
  WINNER_NOTIFICATION: 'winner_notification',
  CLAIM_CONFIRMATION: 'claim_confirmation',
  CLAIM_REMINDER: 'claim_reminder',
  PRIZE_SHIPPED: 'prize_shipped',
} as const;

type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

interface EmailParams {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  html?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Generate HTML email content based on template
 */
function generateEmailHtml(template: EmailTemplate, data: Record<string, unknown>): string {
  const baseStyles = `
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f5f5f5; color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #0f2e71; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; background: #0f2e71; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
      .highlight { background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0f2e71; }
      h1 { margin: 0; font-size: 28px; color: #0f2e71; }
      h2 { color: #0f2e71; }
    </style>
  `;

  switch (template) {
    case EMAIL_TEMPLATES.ENTRY_CONFIRMATION:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Entered!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>Great news! Your entry for <strong>${data.giveawayTitle}</strong> has been received.</p>
              <div class="highlight">
                <h2>Prize: ${data.prizeTitle}</h2>
                <p>Drawing ends: ${data.endDate}</p>
              </div>
              <p>We'll notify you by email if you're selected as a winner. Good luck!</p>
              <p>Best regards,<br>American Mortgage Team</p>
            </div>
            <div class="footer">
              <p>American Mortgage | Arkansas's Trusted Home Loan Experts</p>
              <p>You received this email because you entered a giveaway at americanmtg.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case EMAIL_TEMPLATES.WINNER_NOTIFICATION:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congratulations, You Won!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>Amazing news! You've been selected as a winner in the <strong>${data.giveawayTitle}</strong>!</p>
              <div class="highlight">
                <h2>Your Prize: ${data.prizeTitle}</h2>
                <p><strong>Claim Deadline:</strong> ${data.claimDeadline}</p>
              </div>
              <p>To claim your prize, click the button below and complete the required information:</p>
              <p style="text-align: center;">
                <a href="${data.claimUrl}" class="button">Claim Your Prize</a>
              </p>
              <p><strong>Important:</strong> You must claim your prize before the deadline or it may be forfeited to an alternate winner.</p>
              <p>Congratulations again!<br>American Mortgage Team</p>
            </div>
            <div class="footer">
              <p>American Mortgage | Arkansas's Trusted Home Loan Experts</p>
              <p>Questions? Reply to this email for assistance.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case EMAIL_TEMPLATES.CLAIM_CONFIRMATION:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prize Claim Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>We've received your prize claim for <strong>${data.prizeTitle}</strong>!</p>
              <div class="highlight">
                <h2>Shipping Address</h2>
                <p>${data.shippingAddress}</p>
              </div>
              <p>We're processing your claim and will ship your prize soon. You'll receive a tracking number once it's on its way.</p>
              <p>Thank you for participating!<br>American Mortgage Team</p>
            </div>
            <div class="footer">
              <p>American Mortgage | Arkansas's Trusted Home Loan Experts</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case EMAIL_TEMPLATES.CLAIM_REMINDER:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header" style="background: linear-gradient(135deg, #d93c37 0%, #b32d29 100%);">
              <h1>Don't Forget Your Prize!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>This is a friendly reminder that you have <strong>${data.hoursRemaining} hours</strong> left to claim your prize!</p>
              <div class="highlight" style="background: #ffebee;">
                <h2>Prize: ${data.prizeTitle}</h2>
                <p><strong>Deadline:</strong> ${data.claimDeadline}</p>
              </div>
              <p style="text-align: center;">
                <a href="${data.claimUrl}" class="button">Claim Now</a>
              </p>
              <p><strong>Don't miss out!</strong> If you don't claim by the deadline, your prize will be given to an alternate winner.</p>
              <p>American Mortgage Team</p>
            </div>
            <div class="footer">
              <p>American Mortgage | Arkansas's Trusted Home Loan Experts</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case EMAIL_TEMPLATES.PRIZE_SHIPPED:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Prize is On Its Way!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>Great news! Your prize has shipped and is on its way to you!</p>
              <div class="highlight">
                <h2>${data.prizeTitle}</h2>
                <p><strong>Carrier:</strong> ${data.carrier}</p>
                <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
              </div>
              <p>You can track your package using the tracking number above on the carrier's website.</p>
              <p>Enjoy your prize!<br>American Mortgage Team</p>
            </div>
            <div class="footer">
              <p>American Mortgage | Arkansas's Trusted Home Loan Experts</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `<p>${JSON.stringify(data)}</p>`;
  }
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const { to, subject, template, data } = params;
  const html = params.html || generateEmailHtml(template, data);

  // Check if SendGrid is configured
  if (!SENDGRID_API_KEY) {
    console.log('[EMAIL] SendGrid not configured, logging to database only:', {
      to,
      subject,
      template,
    });

    // Log to database as pending
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data.giveawayId as number | null,
          entry_id: data.entryId as number | null,
          winner_id: data.winnerId as number | null,
          notification_type: template,
          channel: 'email',
          recipient: to,
          subject: subject,
          body: html,
          template_id: template,
          status: 'pending',
        },
      });
    } catch (dbError) {
      console.error('[EMAIL] Failed to log to database:', dbError);
    }

    return {
      success: false,
      error: 'SendGrid not configured',
    };
  }

  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject,
      html,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0]?.headers?.['x-message-id'] || `sg-${Date.now()}`;

    console.log('[EMAIL] Sent successfully:', {
      to,
      subject,
      messageId,
    });

    // Log successful send to database
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data.giveawayId as number | null,
          entry_id: data.entryId as number | null,
          winner_id: data.winnerId as number | null,
          notification_type: template,
          channel: 'email',
          recipient: to,
          subject: subject,
          body: html,
          template_id: template,
          status: 'sent',
          sent_at: new Date(),
          external_id: messageId,
        },
      });
    } catch (dbError) {
      console.error('[EMAIL] Failed to log to database:', dbError);
    }

    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send:', error.response?.body || error.message);

    // Log failed send to database
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data.giveawayId as number | null,
          entry_id: data.entryId as number | null,
          winner_id: data.winnerId as number | null,
          notification_type: template,
          channel: 'email',
          recipient: to,
          subject: subject,
          body: html,
          template_id: template,
          status: 'failed',
          error_message: error.response?.body?.errors?.[0]?.message || error.message,
        },
      });
    } catch (dbError) {
      console.error('[EMAIL] Failed to log error to database:', dbError);
    }

    return {
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message,
    };
  }
}

/**
 * Send entry confirmation email
 */
export async function sendEntryConfirmation(params: {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeTitle: string;
  endDate: string;
  giveawayId: number;
  entryId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.email,
    subject: `You're entered to win: ${params.prizeTitle}`,
    template: EMAIL_TEMPLATES.ENTRY_CONFIRMATION,
    data: {
      firstName: params.firstName,
      giveawayTitle: params.giveawayTitle,
      prizeTitle: params.prizeTitle,
      endDate: params.endDate,
      giveawayId: params.giveawayId,
      entryId: params.entryId,
    },
  });
}

/**
 * Send winner notification email
 */
export async function sendWinnerNotification(params: {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeTitle: string;
  claimUrl: string;
  claimDeadline: string;
  giveawayId: number;
  entryId: number;
  winnerId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.email,
    subject: `Congratulations! You won ${params.prizeTitle}!`,
    template: EMAIL_TEMPLATES.WINNER_NOTIFICATION,
    data: {
      firstName: params.firstName,
      giveawayTitle: params.giveawayTitle,
      prizeTitle: params.prizeTitle,
      claimUrl: params.claimUrl,
      claimDeadline: params.claimDeadline,
      giveawayId: params.giveawayId,
      entryId: params.entryId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Send claim confirmation email
 */
export async function sendClaimConfirmation(params: {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeTitle: string;
  shippingAddress: string;
  giveawayId: number;
  winnerId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.email,
    subject: `Your prize claim has been received - ${params.prizeTitle}`,
    template: EMAIL_TEMPLATES.CLAIM_CONFIRMATION,
    data: {
      firstName: params.firstName,
      giveawayTitle: params.giveawayTitle,
      prizeTitle: params.prizeTitle,
      shippingAddress: params.shippingAddress,
      giveawayId: params.giveawayId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Send claim reminder email
 */
export async function sendClaimReminder(params: {
  email: string;
  firstName: string;
  giveawayTitle: string;
  prizeTitle: string;
  claimUrl: string;
  claimDeadline: string;
  hoursRemaining: number;
  giveawayId: number;
  winnerId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.email,
    subject: `Reminder: Claim your ${params.prizeTitle} - ${params.hoursRemaining} hours left!`,
    template: EMAIL_TEMPLATES.CLAIM_REMINDER,
    data: {
      firstName: params.firstName,
      giveawayTitle: params.giveawayTitle,
      prizeTitle: params.prizeTitle,
      claimUrl: params.claimUrl,
      claimDeadline: params.claimDeadline,
      hoursRemaining: params.hoursRemaining,
      giveawayId: params.giveawayId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Send prize shipped notification
 */
export async function sendPrizeShipped(params: {
  email: string;
  firstName: string;
  prizeTitle: string;
  trackingNumber: string;
  carrier: string;
  giveawayId: number;
  winnerId: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.email,
    subject: `Your prize is on its way! - ${params.prizeTitle}`,
    template: EMAIL_TEMPLATES.PRIZE_SHIPPED,
    data: {
      firstName: params.firstName,
      prizeTitle: params.prizeTitle,
      trackingNumber: params.trackingNumber,
      carrier: params.carrier,
      giveawayId: params.giveawayId,
      winnerId: params.winnerId,
    },
  });
}
