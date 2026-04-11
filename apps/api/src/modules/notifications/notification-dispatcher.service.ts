import { NotificationChannelType } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { emailService, EmailChannelConfig } from './channels/email.service';
import { whatsappService, WhatsAppChannelConfig } from './channels/whatsapp.service';
import { smsService, SmsChannelConfig } from './channels/sms.service';

export interface NotificationEvent {
  type: string;         // e.g. 'booking.confirmed', 'maintenance.created', 'payment.received'
  category: string;     // 'booking' | 'maintenance' | 'payment' | 'system' | 'marketing'
  userId: string;
  title: string;
  body: string;
  htmlBody?: string;
  data?: Record<string, unknown>;
  recipientEmail?: string;
  recipientPhone?: string;
  forceChannels?: NotificationChannelType[];
}

export interface DispatchResult {
  channel: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'booking.confirmed': 'booking',
  'booking.cancelled': 'booking',
  'booking.modified': 'booking',
  'booking.checkin': 'booking',
  'booking.checkout': 'booking',
  'maintenance.created': 'maintenance',
  'maintenance.updated': 'maintenance',
  'maintenance.completed': 'maintenance',
  'payment.received': 'payment',
  'payment.due': 'payment',
  'payment.overdue': 'payment',
  'system.alert': 'system',
  'system.update': 'system',
  'marketing.campaign': 'marketing',
  'marketing.offer': 'marketing',
};

export class NotificationDispatcher {
  /**
   * Dispatch a notification to all of the user's enabled channels.
   */
  async dispatch(event: NotificationEvent): Promise<DispatchResult[]> {
    const results: DispatchResult[] = [];

    // Determine which channels to use
    const enabledChannels = await this.getEnabledChannels(event);

    // Always create an in-app notification
    await this.createInAppNotification(event);

    // Dispatch to each enabled external channel
    for (const channelType of enabledChannels) {
      const result = await this.dispatchToChannel(channelType, event);
      results.push(result);
    }

    return results;
  }

  /**
   * Send a direct notification (admin-triggered) without looking up user preferences.
   */
  async sendDirect(
    channelType: NotificationChannelType,
    event: NotificationEvent,
  ): Promise<DispatchResult> {
    return this.dispatchToChannel(channelType, event);
  }

  /**
   * Determine which external channels are enabled for this user + category.
   */
  private async getEnabledChannels(event: NotificationEvent): Promise<NotificationChannelType[]> {
    // If specific channels are forced, use those
    if (event.forceChannels && event.forceChannels.length > 0) {
      return event.forceChannels;
    }

    const category = event.category || CATEGORY_MAP[event.type] || 'system';

    // Look up user's per-category settings
    const userSetting = await prisma.userNotificationSetting.findUnique({
      where: {
        userId_category: {
          userId: event.userId,
          category,
        },
      },
    });

    const enabledChannels: NotificationChannelType[] = [];

    if (userSetting) {
      if (userSetting.email) enabledChannels.push('EMAIL');
      if (userSetting.whatsapp) enabledChannels.push('WHATSAPP');
      if (userSetting.sms) enabledChannels.push('SMS');
      if (userSetting.push) enabledChannels.push('PUSH');
    } else {
      // Fall back to the legacy NotificationPreference model
      const legacyPref = await prisma.notificationPreference.findUnique({
        where: { userId: event.userId },
      });

      if (legacyPref) {
        if (legacyPref.channelEmail) enabledChannels.push('EMAIL');
        if (legacyPref.channelWhatsapp) enabledChannels.push('WHATSAPP');
        if (legacyPref.channelSms) enabledChannels.push('SMS');
      } else {
        // Default: email only
        enabledChannels.push('EMAIL');
      }
    }

    // Filter out channels that don't have an active configuration
    const activeChannels = await prisma.notificationChannelConfig.findMany({
      where: {
        isActive: true,
        type: { in: enabledChannels },
      },
      select: { type: true },
    });

    const activeTypes = new Set(activeChannels.map((c) => c.type));
    return enabledChannels.filter((ch) => activeTypes.has(ch));
  }

  /**
   * Create an in-app notification record.
   */
  private async createInAppNotification(event: NotificationEvent): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: event.type,
        title: event.title,
        body: event.body,
        data: event.data as any,
        channel: 'NOTIF_IN_APP',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Dispatch to a specific channel, looking up its active config.
   */
  private async dispatchToChannel(
    channelType: NotificationChannelType,
    event: NotificationEvent,
  ): Promise<DispatchResult> {
    try {
      // Find the active, default config for this channel type
      const channelConfig = await prisma.notificationChannelConfig.findFirst({
        where: {
          type: channelType,
          isActive: true,
        },
        orderBy: { isDefault: 'desc' },
      });

      if (!channelConfig) {
        return {
          channel: channelType,
          success: false,
          error: `No active configuration found for channel ${channelType}`,
        };
      }

      const config = channelConfig.config as Record<string, any>;

      switch (channelType) {
        case 'EMAIL':
          return await this.sendEmail(config as unknown as EmailChannelConfig, event);
        case 'WHATSAPP':
          return await this.sendWhatsApp(config as unknown as WhatsAppChannelConfig, event);
        case 'SMS':
          return await this.sendSms(config as unknown as SmsChannelConfig, event);
        case 'PUSH':
          return {
            channel: 'PUSH',
            success: false,
            error: 'Push notifications not yet implemented',
          };
        default:
          return {
            channel: channelType,
            success: false,
            error: `Unknown channel type: ${channelType}`,
          };
      }
    } catch (error: any) {
      return {
        channel: channelType,
        success: false,
        error: error.message || 'Unknown dispatch error',
      };
    }
  }

  private async sendEmail(config: EmailChannelConfig, event: NotificationEvent): Promise<DispatchResult> {
    // Look up user email if not provided
    let recipientEmail = event.recipientEmail;
    if (!recipientEmail) {
      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        select: { email: true },
      });
      recipientEmail = user?.email;
    }

    if (!recipientEmail) {
      return { channel: 'EMAIL', success: false, error: 'No recipient email address found' };
    }

    const result = await emailService.sendMail(config, {
      to: recipientEmail,
      subject: event.title,
      html: event.htmlBody || this.generateDefaultHtml(event),
      text: event.body,
    });

    // Log the sent notification
    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: event.type,
        title: event.title,
        body: event.body,
        data: event.data as any,
        channel: 'NOTIF_EMAIL',
        sentAt: new Date(),
      },
    });

    return { channel: 'EMAIL', success: true, messageId: result.messageId };
  }

  private async sendWhatsApp(config: WhatsAppChannelConfig, event: NotificationEvent): Promise<DispatchResult> {
    let recipientPhone = event.recipientPhone;
    if (!recipientPhone) {
      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        select: { phone: true },
      });
      recipientPhone = user?.phone || undefined;
    }

    if (!recipientPhone) {
      return { channel: 'WHATSAPP', success: false, error: 'No recipient phone number found' };
    }

    const messageText = `*${event.title}*\n\n${event.body}`;
    const result = await whatsappService.sendMessage(config, {
      phone: recipientPhone,
      message: messageText,
    });

    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: event.type,
        title: event.title,
        body: event.body,
        data: event.data as any,
        channel: 'NOTIF_WHATSAPP',
        sentAt: new Date(),
      },
    });

    return { channel: 'WHATSAPP', success: true, messageId: result.messageId };
  }

  private async sendSms(config: SmsChannelConfig, event: NotificationEvent): Promise<DispatchResult> {
    let recipientPhone = event.recipientPhone;
    if (!recipientPhone) {
      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        select: { phone: true },
      });
      recipientPhone = user?.phone || undefined;
    }

    if (!recipientPhone) {
      return { channel: 'SMS', success: false, error: 'No recipient phone number found' };
    }

    // SMS is limited to 160 chars for single-part; keep it concise
    const smsBody = `${event.title}: ${event.body}`.slice(0, 1600);
    const result = await smsService.sendSms(config, {
      to: recipientPhone,
      body: smsBody,
    });

    await prisma.notification.create({
      data: {
        userId: event.userId,
        type: event.type,
        title: event.title,
        body: event.body,
        data: event.data as any,
        channel: 'NOTIF_SMS',
        sentAt: new Date(),
      },
    });

    return { channel: 'SMS', success: true, messageId: result.messageId };
  }

  private generateDefaultHtml(event: NotificationEvent): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background: #1a1a2e; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 24px; color: #333333; line-height: 1.6; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .footer { padding: 16px 24px; background: #f4f4f7; text-align: center; font-size: 12px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sivan Management</h1>
    </div>
    <div class="content">
      <h2>${event.title}</h2>
      <p>${event.body}</p>
    </div>
    <div class="footer">
      <p>&copy; Sivan Management. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }
}

export const notificationDispatcher = new NotificationDispatcher();
