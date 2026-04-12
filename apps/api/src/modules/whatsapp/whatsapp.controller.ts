import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { whatsAppService } from './whatsapp.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { expenseApprovalService } from '../expenses/expense-approval.service';

const contactsQuerySchema = z.object({
  tag: z.string().optional(),
  search: z.string().optional(),
  propertyId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional(),
  guestId: z.string().optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  propertyId: z.string().optional(),
  propertyName: z.string().optional(),
});

const threadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const messageHistoryQuerySchema = z.object({
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  direction: z.enum(['OUTBOUND', 'INBOUND']).optional(),
  status: z.enum(['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
  templateType: z.enum(['CHECK_IN', 'CHECKOUT', 'WELCOME', 'REVIEW_REQUEST', 'PAYMENT_REMINDER', 'BOOKING_CONFIRMATION', 'CUSTOM']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const sendMessageSchema = z.object({
  contactId: z.string(),
  content: z.string().min(1).max(4096),
  templateType: z.enum(['CHECK_IN', 'CHECKOUT', 'WELCOME', 'REVIEW_REQUEST', 'PAYMENT_REMINDER', 'BOOKING_CONFIRMATION', 'CUSTOM']).optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  mediaUrl: z.string().url().optional(),
});

const sendTemplateSchema = z.object({
  contactId: z.string(),
  templateId: z.string(),
  variables: z.record(z.string()),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED']),
});

const templatesQuerySchema = z.object({
  type: z.enum(['CHECK_IN', 'CHECKOUT', 'WELCOME', 'REVIEW_REQUEST', 'PAYMENT_REMINDER', 'BOOKING_CONFIRMATION', 'CUSTOM']).optional(),
  isActive: z.coerce.boolean().optional(),
});

const createTemplateSchema = z.object({
  type: z.enum(['CHECK_IN', 'CHECKOUT', 'WELCOME', 'REVIEW_REQUEST', 'PAYMENT_REMINDER', 'BOOKING_CONFIRMATION', 'CUSTOM']),
  name: z.string().min(1).max(200),
  language: z.string().min(2).max(5),
  content: z.string().min(1).max(4096),
  variables: z.array(z.string()),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(4096).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export class WhatsAppController {
  // ── Contacts ──

  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = contactsQuerySchema.parse(req.query);
      const { contacts, total, page, limit } = await whatsAppService.getContacts(filters);
      sendPaginated(res, contacts, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async getContactById(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await whatsAppService.getContactById(req.params.id as string);
      sendSuccess(res, contact);
    } catch (error) {
      next(error);
    }
  }

  async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createContactSchema.parse(req.body);
      const contact = await whatsAppService.createContact(data);
      sendSuccess(res, contact, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateContactSchema.parse(req.body);
      const contact = await whatsAppService.updateContact(req.params.id as string, data);
      sendSuccess(res, contact);
    } catch (error) {
      next(error);
    }
  }

  // ── Messages ──

  async getThread(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = threadQuerySchema.parse(req.query);
      const result = await whatsAppService.getMessageThread(req.params.contactId as string, filters);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = messageHistoryQuerySchema.parse(req.query);
      const { messages, total, page, limit } = await whatsAppService.getMessageHistory(filters);
      sendPaginated(res, messages, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendMessageSchema.parse(req.body);
      const message = await whatsAppService.sendMessage(data, req.user!.userId);
      sendSuccess(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  async sendTemplateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendTemplateSchema.parse(req.body);
      const message = await whatsAppService.sendTemplateMessage(data, req.user!.userId);
      sendSuccess(res, message, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMessageStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      const message = await whatsAppService.updateMessageStatus(req.params.id as string, status);
      sendSuccess(res, message);
    } catch (error) {
      next(error);
    }
  }

  // ── Templates ──

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = templatesQuerySchema.parse(req.query);
      const data = await whatsAppService.getTemplates(filters);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await whatsAppService.getTemplateById(req.params.id as string);
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTemplateSchema.parse(req.body);
      const template = await whatsAppService.createTemplate(data);
      sendSuccess(res, template, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTemplateSchema.parse(req.body);
      const template = await whatsAppService.updateTemplate(req.params.id as string, data);
      sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  // ── Stats ──

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await whatsAppService.getStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  // ── Webhook (Evolution API) ──

  /**
   * POST /api/v1/whatsapp/webhook
   *
   * Receives incoming WhatsApp messages from Evolution API.
   * Parses the message text and checks for expense approval responses.
   *
   * Accepted responses:
   *   Approve: "approve", "approved", "yes", "1", Hebrew: "\u05D0\u05E9\u05E8"
   *   Reject:  "reject", "rejected", "no", "2", Hebrew: "\u05D3\u05D7\u05D4"
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body;

      // Evolution API sends different event types; we only care about messages
      const event = body.event || body.type;
      if (event && event !== 'messages.upsert' && event !== 'message') {
        // Acknowledge non-message events silently
        return sendSuccess(res, { acknowledged: true, event });
      }

      // Extract the message text from Evolution API payload
      // Evolution API v2 format:
      //   body.data.message.conversation (plain text)
      //   body.data.message.extendedTextMessage.text (quoted reply / extended)
      //   body.data.key.remoteJid (sender's phone@s.whatsapp.net)
      const data = body.data || body;
      const messageObj = data.message || {};
      const messageText: string =
        messageObj.conversation ||
        messageObj.extendedTextMessage?.text ||
        data.body ||
        '';

      const remoteJid: string = data.key?.remoteJid || data.from || '';
      const senderPhone = remoteJid.replace(/@.*$/, ''); // Strip @s.whatsapp.net

      if (!messageText || !senderPhone) {
        return sendSuccess(res, { acknowledged: true, reason: 'no_text_or_sender' });
      }

      // Normalize the message for matching
      const normalized = messageText.trim().toLowerCase();

      // Define approval/rejection patterns
      const approvePatterns = ['1', 'approve', 'approved', 'yes', '\u05D0\u05E9\u05E8'];
      const rejectPatterns = ['2', 'reject', 'rejected', 'no', '\u05D3\u05D7\u05D4'];

      let isApproval: boolean | null = null;
      if (approvePatterns.includes(normalized)) {
        isApproval = true;
      } else if (rejectPatterns.includes(normalized)) {
        isApproval = false;
      }

      if (isApproval === null) {
        // Not an approval response -- could be a regular conversation message
        return sendSuccess(res, { acknowledged: true, reason: 'not_approval_response' });
      }

      // Look up a pending approval request for this phone number
      const pendingRequest = await expenseApprovalService.findPendingByPhone(senderPhone);

      if (!pendingRequest) {
        return sendSuccess(res, {
          acknowledged: true,
          reason: 'no_pending_approval',
          phone: senderPhone,
        });
      }

      // Process the approval/rejection
      const result = await expenseApprovalService.processApproval(
        pendingRequest.expenseId,
        isApproval,
        `whatsapp:${senderPhone}`,
      );

      return sendSuccess(res, {
        acknowledged: true,
        processed: true,
        expenseId: pendingRequest.expenseId,
        action: isApproval ? 'APPROVED' : 'REJECTED',
        expense: result.expense,
      });
    } catch (error) {
      // Always acknowledge webhooks to prevent retries
      console.error('[WhatsApp Webhook] Error processing webhook:', error);
      next(error);
    }
  }
}

export const whatsAppController = new WhatsAppController();
