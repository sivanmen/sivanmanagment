import { NotificationChannelType } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import { emailService, EmailChannelConfig } from './channels/email.service';
import { whatsappService, WhatsAppChannelConfig } from './channels/whatsapp.service';
import { smsService, SmsChannelConfig } from './channels/sms.service';

interface CreateChannelData {
  type: NotificationChannelType;
  name: string;
  isActive?: boolean;
  isDefault?: boolean;
  config: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface UpdateChannelData {
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface UserPreferenceInput {
  category: string;
  email?: boolean;
  whatsapp?: boolean;
  sms?: boolean;
  push?: boolean;
}

const VALID_CATEGORIES = ['booking', 'maintenance', 'payment', 'system', 'marketing'];

export class NotificationChannelsService {
  // ==========================================
  // Channel CRUD
  // ==========================================

  async listChannels() {
    const channels = await prisma.notificationChannelConfig.findMany({
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // Mask sensitive config values in the response
    return channels.map((ch) => ({
      ...ch,
      config: this.maskConfig(ch.type, ch.config as Record<string, unknown>),
    }));
  }

  async createChannel(data: CreateChannelData) {
    // Validate config fields for the channel type
    this.validateConfigForType(data.type, data.config);

    // If setting as default, unset other defaults for this type
    if (data.isDefault) {
      await prisma.notificationChannelConfig.updateMany({
        where: { type: data.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const channel = await prisma.notificationChannelConfig.create({
      data: {
        type: data.type,
        name: data.name,
        isActive: data.isActive ?? false,
        isDefault: data.isDefault ?? false,
        config: data.config as any,
        metadata: data.metadata as any,
      },
    });

    return {
      ...channel,
      config: this.maskConfig(channel.type, channel.config as Record<string, unknown>),
    };
  }

  async updateChannel(id: string, data: UpdateChannelData) {
    const existing = await prisma.notificationChannelConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('NotificationChannelConfig');
    }

    // If config is provided, merge with existing config
    let mergedConfig = existing.config as Record<string, unknown>;
    if (data.config) {
      mergedConfig = { ...mergedConfig, ...data.config };
      this.validateConfigForType(existing.type, mergedConfig);
    }

    // If setting as default, unset other defaults for this type
    if (data.isDefault) {
      await prisma.notificationChannelConfig.updateMany({
        where: { type: existing.type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const channel = await prisma.notificationChannelConfig.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
        isDefault: data.isDefault,
        config: mergedConfig as any,
        metadata: data.metadata as any,
      },
    });

    return {
      ...channel,
      config: this.maskConfig(channel.type, channel.config as Record<string, unknown>),
    };
  }

  async deleteChannel(id: string) {
    const existing = await prisma.notificationChannelConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw ApiError.notFound('NotificationChannelConfig');
    }

    await prisma.notificationChannelConfig.delete({ where: { id } });

    return { message: 'Channel configuration deleted successfully' };
  }

  // ==========================================
  // Channel testing
  // ==========================================

  async testChannel(id: string) {
    const channel = await prisma.notificationChannelConfig.findUnique({
      where: { id },
    });

    if (!channel) {
      throw ApiError.notFound('NotificationChannelConfig');
    }

    const config = channel.config as Record<string, unknown>;
    let testResult: { success: boolean; error?: string };

    switch (channel.type) {
      case 'EMAIL':
        testResult = await emailService.testConnection(config as unknown as EmailChannelConfig);
        break;
      case 'WHATSAPP':
        testResult = await whatsappService.testConnection(config as unknown as WhatsAppChannelConfig);
        break;
      case 'SMS':
        testResult = await smsService.testConnection(config as unknown as SmsChannelConfig);
        break;
      case 'PUSH':
        testResult = { success: false, error: 'Push notification testing not yet implemented' };
        break;
      default:
        testResult = { success: false, error: `Unknown channel type: ${channel.type}` };
    }

    // Update the test status on the channel
    await prisma.notificationChannelConfig.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        testStatus: testResult.success ? 'success' : 'failed',
        testError: testResult.error || null,
      },
    });

    return {
      channelId: id,
      channelType: channel.type,
      channelName: channel.name,
      ...testResult,
      testedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // User notification preferences
  // ==========================================

  async getUserPreferences(userId: string) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Get existing settings
    const settings = await prisma.userNotificationSetting.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    // Build a complete response with all categories (fill in defaults for missing ones)
    const settingsMap = new Map(settings.map((s) => [s.category, s]));
    const completeSettings = VALID_CATEGORIES.map((category) => {
      const existing = settingsMap.get(category);
      if (existing) {
        return {
          id: existing.id,
          category: existing.category,
          email: existing.email,
          whatsapp: existing.whatsapp,
          sms: existing.sms,
          push: existing.push,
        };
      }
      return {
        id: null,
        category,
        email: true,
        whatsapp: false,
        sms: false,
        push: false,
      };
    });

    // Get available channels
    const activeChannels = await prisma.notificationChannelConfig.findMany({
      where: { isActive: true },
      select: { type: true, name: true },
    });

    return {
      userId,
      preferences: completeSettings,
      availableChannels: activeChannels,
    };
  }

  async updateUserPreferences(userId: string, preferences: UserPreferenceInput[]) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw ApiError.notFound('User');
    }

    // Validate categories
    for (const pref of preferences) {
      if (!VALID_CATEGORIES.includes(pref.category)) {
        throw ApiError.badRequest(`Invalid category: ${pref.category}. Valid: ${VALID_CATEGORIES.join(', ')}`);
      }
    }

    // Upsert each preference
    const results = await Promise.all(
      preferences.map((pref) =>
        prisma.userNotificationSetting.upsert({
          where: {
            userId_category: {
              userId,
              category: pref.category,
            },
          },
          create: {
            userId,
            category: pref.category,
            email: pref.email ?? true,
            whatsapp: pref.whatsapp ?? false,
            sms: pref.sms ?? false,
            push: pref.push ?? false,
          },
          update: {
            email: pref.email,
            whatsapp: pref.whatsapp,
            sms: pref.sms,
            push: pref.push,
          },
        }),
      ),
    );

    return { updated: results.length, preferences: results };
  }

  // ==========================================
  // Helpers
  // ==========================================

  private validateConfigForType(type: NotificationChannelType, config: Record<string, unknown>): void {
    switch (type) {
      case 'EMAIL': {
        const required = ['host', 'port', 'user', 'pass', 'from'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw ApiError.badRequest(`Missing required EMAIL config fields: ${missing.join(', ')}`);
        }
        break;
      }
      case 'WHATSAPP': {
        const required = ['apiUrl', 'apiKey', 'instanceName'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw ApiError.badRequest(`Missing required WHATSAPP config fields: ${missing.join(', ')}`);
        }
        break;
      }
      case 'SMS': {
        const required = ['accountSid', 'authToken', 'fromNumber'];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw ApiError.badRequest(`Missing required SMS config fields: ${missing.join(', ')}`);
        }
        break;
      }
      case 'PUSH':
        // No validation yet
        break;
    }
  }

  private maskConfig(type: NotificationChannelType, config: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...config };

    switch (type) {
      case 'EMAIL':
        if (masked.pass) masked.pass = '••••••••';
        break;
      case 'WHATSAPP':
        if (masked.apiKey) masked.apiKey = this.maskString(masked.apiKey as string);
        break;
      case 'SMS':
        if (masked.authToken) masked.authToken = this.maskString(masked.authToken as string);
        if (masked.accountSid) masked.accountSid = this.maskString(masked.accountSid as string);
        break;
    }

    return masked;
  }

  private maskString(value: string): string {
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••' + value.slice(-4);
  }
}

export const notificationChannelsService = new NotificationChannelsService();
