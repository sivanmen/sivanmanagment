import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────

interface CreateInstanceInput {
  name: string;
  provider?: string;
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  phoneNumber?: string;
  webhookUrl?: string;
  isDefault?: boolean;
  config?: Record<string, string | number | boolean | null>;
}

interface UpdateInstanceInput {
  name?: string;
  instanceName?: string;
  apiUrl?: string;
  apiKey?: string;
  phoneNumber?: string;
  webhookUrl?: string;
  isDefault?: boolean;
  isActive?: boolean;
  config?: Record<string, string | number | boolean | null>;
}

// ─── Service ─────────────────────────────────────────────────────────

class MessagingInstancesService {
  /**
   * Get all messaging instances.
   */
  async list(filters?: { isActive?: boolean; provider?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.provider) where.provider = filters.provider;

    const instances = await prisma.messagingInstance.findMany({
      where,
      include: {
        propertyAssignments: {
          include: {
            property: { select: { id: true, name: true, internalCode: true } },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // Mask API keys in response
    return instances.map((inst: typeof instances[number]) => ({
      ...inst,
      apiKey: inst.apiKey ? `${inst.apiKey.substring(0, 8)}...${inst.apiKey.substring(inst.apiKey.length - 4)}` : '',
    }));
  }

  /**
   * Get a single instance by ID.
   */
  async getById(id: string) {
    const instance = await prisma.messagingInstance.findUnique({
      where: { id },
      include: {
        propertyAssignments: {
          include: {
            property: { select: { id: true, name: true, internalCode: true } },
          },
        },
      },
    });

    if (!instance) {
      throw ApiError.notFound('Messaging instance');
    }

    return {
      ...instance,
      apiKey: instance.apiKey ? `${instance.apiKey.substring(0, 8)}...${instance.apiKey.substring(instance.apiKey.length - 4)}` : '',
    };
  }

  /**
   * Create a new messaging instance.
   */
  async create(input: CreateInstanceInput) {
    // If this is set as default, unset any existing defaults
    if (input.isDefault) {
      await prisma.messagingInstance.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const instance = await prisma.messagingInstance.create({
      data: {
        name: input.name,
        provider: (input.provider as 'EVOLUTION_API' | 'WHATSAPP_BUSINESS' | 'TWILIO' | 'CUSTOM') || 'EVOLUTION_API',
        instanceName: input.instanceName,
        apiUrl: input.apiUrl.replace(/\/+$/, ''), // Remove trailing slash
        apiKey: input.apiKey,
        phoneNumber: input.phoneNumber,
        webhookUrl: input.webhookUrl,
        isDefault: input.isDefault || false,
        config: input.config || {},
        status: 'MSG_DISCONNECTED',
      },
    });

    return instance;
  }

  /**
   * Update an existing instance.
   */
  async update(id: string, input: UpdateInstanceInput) {
    const existing = await prisma.messagingInstance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Messaging instance');

    // If setting as default, unset others
    if (input.isDefault) {
      await prisma.messagingInstance.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.instanceName !== undefined) data.instanceName = input.instanceName;
    if (input.apiUrl !== undefined) data.apiUrl = input.apiUrl.replace(/\/+$/, '');
    if (input.apiKey !== undefined) data.apiKey = input.apiKey;
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.webhookUrl !== undefined) data.webhookUrl = input.webhookUrl;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.config !== undefined) data.config = input.config;

    const updated = await prisma.messagingInstance.update({
      where: { id },
      data: data as any,
    });

    return updated;
  }

  /**
   * Delete an instance.
   */
  async delete(id: string) {
    const existing = await prisma.messagingInstance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Messaging instance');

    await prisma.messagingInstance.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Test connection to an Evolution API instance.
   */
  async testConnection(id: string) {
    const instance = await prisma.messagingInstance.findUnique({ where: { id } });
    if (!instance) throw ApiError.notFound('Messaging instance');

    try {
      const response = await axios.get(
        `${instance.apiUrl}/instance/connectionState/${instance.instanceName}`,
        {
          headers: { apikey: instance.apiKey },
          timeout: 10000,
        },
      );

      const state = response.data?.instance?.state || response.data?.state || 'unknown';
      const isConnected = state === 'open' || state === 'connected';

      // Update status in DB
      await prisma.messagingInstance.update({
        where: { id },
        data: {
          status: isConnected ? 'MSG_ACTIVE' : 'MSG_DISCONNECTED',
          lastConnectedAt: isConnected ? new Date() : instance.lastConnectedAt,
          lastErrorMsg: isConnected ? null : `Connection state: ${state}`,
        },
      });

      return {
        connected: isConnected,
        state,
        instanceName: instance.instanceName,
        phoneNumber: instance.phoneNumber,
        details: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';

      // Update status to error
      await prisma.messagingInstance.update({
        where: { id },
        data: {
          status: 'MSG_ERROR',
          lastErrorMsg: errorMessage,
        },
      });

      return {
        connected: false,
        state: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Get QR code for pairing a new WhatsApp number.
   */
  async getQrCode(id: string) {
    const instance = await prisma.messagingInstance.findUnique({ where: { id } });
    if (!instance) throw ApiError.notFound('Messaging instance');

    try {
      // First, try to create the instance in Evolution API if it doesn't exist
      try {
        await axios.post(
          `${instance.apiUrl}/instance/create`,
          {
            instanceName: instance.instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
          {
            headers: { apikey: instance.apiKey },
            timeout: 15000,
          },
        );
      } catch {
        // Instance may already exist — that's fine
      }

      // Get the QR code
      const response = await axios.get(
        `${instance.apiUrl}/instance/connect/${instance.instanceName}`,
        {
          headers: { apikey: instance.apiKey },
          timeout: 15000,
        },
      );

      const qrCode = response.data?.base64 || response.data?.qrcode?.base64 || null;

      if (qrCode) {
        await prisma.messagingInstance.update({
          where: { id },
          data: { qrCode, status: 'MSG_PAIRING' },
        });
      }

      return {
        qrCode,
        instanceName: instance.instanceName,
        status: qrCode ? 'pairing' : 'already_connected',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      return {
        qrCode: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Send a message through a specific instance or the default one.
   */
  async sendMessage(params: {
    instanceId?: string;
    propertyId?: string;
    to: string;
    message: string;
    mediaUrl?: string;
  }) {
    // Find the right instance
    let instance;

    if (params.instanceId) {
      instance = await prisma.messagingInstance.findUnique({
        where: { id: params.instanceId },
      });
    } else if (params.propertyId) {
      // Find instance assigned to this property
      const assignment = await prisma.messagingPropertyAssignment.findFirst({
        where: { propertyId: params.propertyId },
        include: { instance: true },
      });
      instance = assignment?.instance;
    }

    // Fallback to default instance
    if (!instance) {
      instance = await prisma.messagingInstance.findFirst({
        where: { isDefault: true, isActive: true, status: 'MSG_ACTIVE' },
      });
    }

    // Last resort: any active instance
    if (!instance) {
      instance = await prisma.messagingInstance.findFirst({
        where: { isActive: true, status: 'MSG_ACTIVE' },
      });
    }

    if (!instance) {
      throw new ApiError(503, 'NO_INSTANCE', 'No active messaging instance available');
    }

    try {
      const payload: Record<string, unknown> = {
        number: params.to.replace(/[^0-9]/g, ''),
        text: params.message,
      };

      if (params.mediaUrl) {
        payload.mediaMessage = { mediatype: 'image', media: params.mediaUrl, caption: params.message };
      }

      const endpoint = params.mediaUrl
        ? `${instance.apiUrl}/message/sendMedia/${instance.instanceName}`
        : `${instance.apiUrl}/message/sendText/${instance.instanceName}`;

      const response = await axios.post(endpoint, payload, {
        headers: { apikey: instance.apiKey, 'Content-Type': 'application/json' },
        timeout: 30000,
      });

      // Update message count
      await prisma.messagingInstance.update({
        where: { id: instance.id },
        data: { messagesSent: { increment: 1 } },
      });

      return {
        success: true,
        instanceId: instance.id,
        instanceName: instance.name,
        messageId: response.data?.key?.id,
        details: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Send failed';
      throw new ApiError(502, 'SEND_FAILED', `Failed to send message via ${instance.name}: ${errorMessage}`);
    }
  }

  /**
   * Assign properties to an instance.
   */
  async assignProperties(instanceId: string, propertyIds: string[]) {
    const instance = await prisma.messagingInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw ApiError.notFound('Messaging instance');

    // Remove existing assignments for these properties from other instances
    await prisma.messagingPropertyAssignment.deleteMany({
      where: { propertyId: { in: propertyIds } },
    });

    // Create new assignments
    const assignments = await Promise.all(
      propertyIds.map((propertyId: string) =>
        prisma.messagingPropertyAssignment.create({
          data: { instanceId, propertyId },
        }),
      ),
    );

    return { count: assignments.length };
  }

  /**
   * Get the default instance (for use by other services).
   */
  async getDefaultInstance() {
    const instance = await prisma.messagingInstance.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!instance) {
      // Fallback to any active instance
      return prisma.messagingInstance.findFirst({
        where: { isActive: true, status: 'MSG_ACTIVE' },
      });
    }

    return instance;
  }

  /**
   * Logout / disconnect a WhatsApp instance.
   */
  async disconnect(id: string) {
    const instance = await prisma.messagingInstance.findUnique({ where: { id } });
    if (!instance) throw ApiError.notFound('Messaging instance');

    try {
      await axios.delete(
        `${instance.apiUrl}/instance/logout/${instance.instanceName}`,
        { headers: { apikey: instance.apiKey }, timeout: 10000 },
      );
    } catch {
      // Ignore logout errors
    }

    await prisma.messagingInstance.update({
      where: { id },
      data: { status: 'MSG_DISCONNECTED', qrCode: null },
    });

    return { success: true };
  }
}

export const messagingInstancesService = new MessagingInstancesService();
