/**
 * SMS Notification Service
 *
 * Uses Twilio for sending transactional SMS for the giveaway system.
 */

import twilio from 'twilio';
import prisma from '@/lib/prisma';

// Initialize Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client if configured
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

// SMS message types
export const SMS_TYPES = {
  ENTRY_CONFIRMATION: 'entry_confirmation',
  WINNER_NOTIFICATION: 'winner_notification',
  CLAIM_REMINDER: 'claim_reminder',
  PRIZE_SHIPPED: 'prize_shipped',
} as const;

type SmsType = typeof SMS_TYPES[keyof typeof SMS_TYPES];

interface SmsParams {
  to: string;
  message: string;
  type: SmsType;
  data?: Record<string, unknown>;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format phone number for Twilio (E.164 format)
 */
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Send an SMS using Twilio
 */
export async function sendSms(params: SmsParams): Promise<SmsResult> {
  const { to, message, type, data } = params;
  const formattedPhone = formatPhoneNumber(to);

  // Check if Twilio is configured
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log('[SMS] Twilio not configured, logging to database only:', {
      to: formattedPhone,
      message,
      type,
    });

    // Log to database as pending
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data?.giveawayId as number | null,
          entry_id: data?.entryId as number | null,
          winner_id: data?.winnerId as number | null,
          notification_type: type,
          channel: 'sms',
          recipient: formattedPhone,
          body: message,
          status: 'pending',
        },
      });
    } catch (dbError) {
      console.error('[SMS] Failed to log to database:', dbError);
    }

    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  try {
    // Send via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('[SMS] Sent successfully:', {
      to: formattedPhone,
      messageId: result.sid,
      status: result.status,
    });

    // Log successful send to database
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data?.giveawayId as number | null,
          entry_id: data?.entryId as number | null,
          winner_id: data?.winnerId as number | null,
          notification_type: type,
          channel: 'sms',
          recipient: formattedPhone,
          body: message,
          status: 'sent',
          sent_at: new Date(),
          external_id: result.sid,
        },
      });
    } catch (dbError) {
      console.error('[SMS] Failed to log to database:', dbError);
    }

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    console.error('[SMS] Failed to send:', error.message);

    // Log failed send to database
    try {
      await prisma.notifications_log.create({
        data: {
          giveaway_id: data?.giveawayId as number | null,
          entry_id: data?.entryId as number | null,
          winner_id: data?.winnerId as number | null,
          notification_type: type,
          channel: 'sms',
          recipient: formattedPhone,
          body: message,
          status: 'failed',
          error_message: error.message,
        },
      });
    } catch (dbError) {
      console.error('[SMS] Failed to log error to database:', dbError);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send entry confirmation SMS
 */
export async function sendEntryConfirmationSms(params: {
  phone: string;
  firstName: string;
  prizeTitle: string;
  giveawayId: number;
  entryId: number;
}): Promise<SmsResult> {
  const message = `Hi ${params.firstName}! You're entered to win ${params.prizeTitle} from American Mortgage. Good luck! Reply STOP to opt out.`;

  return sendSms({
    to: params.phone,
    message,
    type: SMS_TYPES.ENTRY_CONFIRMATION,
    data: {
      firstName: params.firstName,
      prizeTitle: params.prizeTitle,
      giveawayId: params.giveawayId,
      entryId: params.entryId,
    },
  });
}

/**
 * Send winner notification SMS
 */
export async function sendWinnerNotificationSms(params: {
  phone: string;
  firstName: string;
  prizeTitle: string;
  claimUrl: string;
  giveawayId: number;
  entryId: number;
  winnerId: number;
}): Promise<SmsResult> {
  const message = `Congratulations ${params.firstName}! You WON ${params.prizeTitle} from American Mortgage! Claim your prize here: ${params.claimUrl}`;

  return sendSms({
    to: params.phone,
    message,
    type: SMS_TYPES.WINNER_NOTIFICATION,
    data: {
      firstName: params.firstName,
      prizeTitle: params.prizeTitle,
      claimUrl: params.claimUrl,
      giveawayId: params.giveawayId,
      entryId: params.entryId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Send claim reminder SMS
 */
export async function sendClaimReminderSms(params: {
  phone: string;
  firstName: string;
  prizeTitle: string;
  claimUrl: string;
  hoursRemaining: number;
  giveawayId: number;
  winnerId: number;
}): Promise<SmsResult> {
  const message = `Reminder: ${params.firstName}, you have ${params.hoursRemaining} hours left to claim your ${params.prizeTitle}! Don't miss out: ${params.claimUrl}`;

  return sendSms({
    to: params.phone,
    message,
    type: SMS_TYPES.CLAIM_REMINDER,
    data: {
      firstName: params.firstName,
      prizeTitle: params.prizeTitle,
      claimUrl: params.claimUrl,
      hoursRemaining: params.hoursRemaining,
      giveawayId: params.giveawayId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Send prize shipped SMS
 */
export async function sendPrizeShippedSms(params: {
  phone: string;
  firstName: string;
  prizeTitle: string;
  trackingNumber: string;
  giveawayId: number;
  winnerId: number;
}): Promise<SmsResult> {
  const message = `Great news ${params.firstName}! Your ${params.prizeTitle} has shipped! Tracking: ${params.trackingNumber}`;

  return sendSms({
    to: params.phone,
    message,
    type: SMS_TYPES.PRIZE_SHIPPED,
    data: {
      firstName: params.firstName,
      prizeTitle: params.prizeTitle,
      trackingNumber: params.trackingNumber,
      giveawayId: params.giveawayId,
      winnerId: params.winnerId,
    },
  });
}

/**
 * Check if a phone number has opted out
 */
export async function isPhoneOptedOut(phone: string, giveawayId?: number): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phone);

  const unsubscribe = await prisma.giveaway_unsubscribes.findFirst({
    where: {
      phone: formattedPhone,
      channel: 'sms',
      OR: [
        { unsubscribe_type: 'global' },
        { giveaway_id: giveawayId },
      ],
    },
  });

  return !!unsubscribe;
}

/**
 * Record an SMS opt-out
 */
export async function recordSmsOptOut(params: {
  phone: string;
  giveawayId?: number;
  reason?: string;
}): Promise<void> {
  const formattedPhone = formatPhoneNumber(params.phone);

  await prisma.giveaway_unsubscribes.create({
    data: {
      phone: formattedPhone,
      unsubscribe_type: params.giveawayId ? 'giveaway' : 'global',
      giveaway_id: params.giveawayId || null,
      channel: 'sms',
      reason: params.reason,
    },
  });
}
