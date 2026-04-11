export interface WhatsAppChannelConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

export interface SendWhatsAppMessageOptions {
  phone: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
}

interface EvolutionApiResponse {
  key?: { id: string };
  message?: { message: string };
  status?: string;
  error?: string;
}

export class WhatsAppService {
  private getHeaders(config: WhatsAppChannelConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      apikey: config.apiKey,
    };
  }

  private formatPhone(phone: string): string {
    // Strip all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // If it starts with +, it was already stripped; if not, assume it's already a full number
    return cleaned;
  }

  async sendMessage(
    config: WhatsAppChannelConfig,
    options: SendWhatsAppMessageOptions,
  ): Promise<{ messageId: string }> {
    const phone = this.formatPhone(options.phone);

    if (options.mediaUrl) {
      return this.sendMediaMessage(config, phone, options);
    }

    return this.sendTextMessage(config, phone, options.message);
  }

  private async sendTextMessage(
    config: WhatsAppChannelConfig,
    phone: string,
    message: string,
  ): Promise<{ messageId: string }> {
    const url = `${config.apiUrl}/message/sendText/${config.instanceName}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(config),
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Evolution API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as EvolutionApiResponse;
    return { messageId: data.key?.id || 'sent' };
  }

  private async sendMediaMessage(
    config: WhatsAppChannelConfig,
    phone: string,
    options: SendWhatsAppMessageOptions,
  ): Promise<{ messageId: string }> {
    const mediaType = options.mediaType || 'image';
    const url = `${config.apiUrl}/message/sendMedia/${config.instanceName}`;

    const body: Record<string, unknown> = {
      number: phone,
      mediatype: mediaType,
      media: options.mediaUrl,
      caption: options.message,
    };

    if (options.fileName) {
      body.fileName = options.fileName;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(config),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Evolution API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as EvolutionApiResponse;
    return { messageId: data.key?.id || 'sent' };
  }

  async testConnection(config: WhatsAppChannelConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${config.apiUrl}/instance/connectionState/${config.instanceName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(config),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Evolution API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as { instance?: { state?: string } };
      const state = data.instance?.state;

      if (state === 'open') {
        return { success: true };
      }

      return {
        success: false,
        error: `WhatsApp instance state: ${state || 'unknown'}. Expected "open".`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Evolution API',
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
