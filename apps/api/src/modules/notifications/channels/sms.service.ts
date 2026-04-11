import Twilio from 'twilio';

export interface SmsChannelConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SendSmsOptions {
  to: string;
  body: string;
}

export class SmsService {
  private createClient(config: SmsChannelConfig): Twilio.Twilio {
    return Twilio(config.accountSid, config.authToken);
  }

  async sendSms(config: SmsChannelConfig, options: SendSmsOptions): Promise<{ messageId: string; status: string }> {
    const client = this.createClient(config);

    const message = await client.messages.create({
      to: options.to,
      from: config.fromNumber,
      body: options.body,
    });

    return {
      messageId: message.sid,
      status: message.status,
    };
  }

  async testConnection(config: SmsChannelConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.createClient(config);

      // Verify the account by fetching account info
      const account = await client.api.accounts(config.accountSid).fetch();

      if (account.status === 'active') {
        return { success: true };
      }

      return {
        success: false,
        error: `Twilio account status: ${account.status}. Expected "active".`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Twilio',
      };
    }
  }
}

export const smsService = new SmsService();
