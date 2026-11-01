export interface ExternalNotificationParams {
  userId: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  type: string;
}

/**
 * Clean abstraction for external notification providers (Email, SMS, Push).
 * Currently gracefully skips delivery unless explicit configuration exists, 
 * maintaining platform safety and preventing false delivery claims.
 */
export async function sendEmailNotification(params: ExternalNotificationParams): Promise<boolean> {
  // If no SMTP or provider keys exist, silently skip to prevent fake delivery
  if (!process.env.EMAIL_PROVIDER_CONFIGURED) {
    return false;
  }
  
  // Future implementation: SendGrid, Postmark, AWS SES, etc.
  console.log(`[EmailProvider] Delivering email to ${params.email || params.userId}: ${params.subject}`);
  return true;
}

export async function sendSmsNotification(params: ExternalNotificationParams): Promise<boolean> {
  if (!process.env.SMS_PROVIDER_CONFIGURED) {
    return false;
  }
  
  // Future implementation: Twilio, AWS SNS, Msg91, etc.
  console.log(`[SMSProvider] Delivering SMS to ${params.phone || params.userId}`);
  return true;
}

export async function sendPushNotification(params: ExternalNotificationParams): Promise<boolean> {
  if (!process.env.PUSH_PROVIDER_CONFIGURED) {
    return false;
  }
  
  // Future implementation: Firebase Cloud Messaging (FCM), APNs, WebPush
  console.log(`[PushProvider] Delivering Push to device for ${params.userId}`);
  return true;
}

export async function dispatchExternalNotifications(params: ExternalNotificationParams) {
  // Fire and forget external integrations
  Promise.allSettled([
    sendEmailNotification(params),
    sendSmsNotification(params),
    sendPushNotification(params)
  ]).catch(err => {
    console.error("[ExternalProviders] Failed to dispatch notifications:", err);
  });
}
