/**
 * Notification Services
 *
 * This module provides email and SMS notification capabilities for the giveaway system.
 *
 * Current Status: STUB MODE
 * - All notifications are logged to console and database
 * - No actual emails or SMS are sent
 *
 * To enable real notifications:
 * 1. Configure SendGrid for emails (see email.ts)
 * 2. Configure Twilio for SMS (see sms.ts)
 * 3. Update the stub functions with actual API calls
 */

// Email exports
export {
  sendEmail,
  sendEntryConfirmation,
  sendWinnerNotification,
  sendClaimConfirmation,
  sendClaimReminder,
  sendPrizeShipped,
  EMAIL_TEMPLATES,
} from './email';

// SMS exports
export {
  sendSms,
  sendEntryConfirmationSms,
  sendWinnerNotificationSms,
  sendClaimReminderSms,
  sendPrizeShippedSms,
  isPhoneOptedOut,
  recordSmsOptOut,
  SMS_TYPES,
} from './sms';

// Combined notification function for convenience
export async function sendWinnerNotifications(params: {
  email: string;
  phone: string;
  firstName: string;
  giveawayTitle: string;
  prizeTitle: string;
  claimUrl: string;
  claimDeadline: string;
  giveawayId: number;
  entryId: number;
  winnerId: number;
  smsOptIn: boolean;
}): Promise<{ email: boolean; sms: boolean }> {
  const { sendWinnerNotification } = await import('./email');
  const { sendWinnerNotificationSms, isPhoneOptedOut } = await import('./sms');

  // Send email notification
  const emailResult = await sendWinnerNotification({
    email: params.email,
    firstName: params.firstName,
    giveawayTitle: params.giveawayTitle,
    prizeTitle: params.prizeTitle,
    claimUrl: params.claimUrl,
    claimDeadline: params.claimDeadline,
    giveawayId: params.giveawayId,
    entryId: params.entryId,
    winnerId: params.winnerId,
  });

  // Send SMS if opted in and not unsubscribed
  let smsResult = { success: false };
  if (params.smsOptIn) {
    const optedOut = await isPhoneOptedOut(params.phone, params.giveawayId);
    if (!optedOut) {
      smsResult = await sendWinnerNotificationSms({
        phone: params.phone,
        firstName: params.firstName,
        prizeTitle: params.prizeTitle,
        claimUrl: params.claimUrl,
        giveawayId: params.giveawayId,
        entryId: params.entryId,
        winnerId: params.winnerId,
      });
    }
  }

  return {
    email: emailResult.success,
    sms: smsResult.success,
  };
}
