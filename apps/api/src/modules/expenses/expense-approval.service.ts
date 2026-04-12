import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import { whatsappService as evolutionWhatsApp, WhatsAppChannelConfig } from '../notifications/channels/whatsapp.service';

// Default WhatsApp config (will be overridden by environment variables in production)
function getWhatsAppConfig(): WhatsAppChannelConfig {
  return {
    apiUrl: process.env.EVOLUTION_API_URL || 'https://evo.sivanmanagement.com',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'sivan-pms',
  };
}

// ---------------------------------------------------------------------------
// Helper to format currency
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3', ILS: '\u20AA' };
  return `${symbols[currency] || currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Expense Approval Service
// ---------------------------------------------------------------------------

export class ExpenseApprovalService {
  /**
   * Look up the owner of a property via the Property -> Owner -> User chain.
   * Returns owner details including phone from the User record.
   */
  private async getPropertyOwner(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!property) {
      throw ApiError.notFound('Property');
    }

    if (!property.owner) {
      throw ApiError.badRequest(`No owner found for property ${propertyId}`);
    }

    const owner = property.owner;
    const user = owner.user;

    return {
      ownerId: owner.id,
      ownerName: `${user.firstName} ${user.lastName}`,
      ownerPhone: user.phone || '',
      expenseApprovalThreshold: Number(owner.expenseApprovalThreshold),
      propertyName: property.name,
    };
  }

  /**
   * Check if an expense requires owner approval based on the property's
   * owner threshold. Returns the threshold amount if approval is needed,
   * or null if auto-approved.
   */
  async getApprovalThreshold(propertyId: string): Promise<number | null> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true,
      },
    });

    if (!property?.owner) return null;
    return Number(property.owner.expenseApprovalThreshold);
  }

  /**
   * Determine whether a given expense amount needs owner approval.
   */
  async needsApproval(propertyId: string, amount: number): Promise<boolean> {
    const threshold = await this.getApprovalThreshold(propertyId);
    if (threshold === null) return false;
    return amount > threshold;
  }

  /**
   * Request approval from the property owner via WhatsApp.
   *
   * 1. Look up expense, property, and owner from DB
   * 2. Check if expense amount > owner's expenseApprovalThreshold
   * 3. Send WhatsApp message to owner with expense details
   * 4. Store a pending approval request in DB
   * 5. Schedule a 24-hour reminder timeout
   */
  async requestApproval(expenseId: string) {
    const expense = await prisma.expenseRecord.findUnique({
      where: { id: expenseId },
      include: { property: true },
    });

    if (!expense) {
      throw ApiError.notFound('Expense');
    }

    if (!expense.propertyId) {
      throw ApiError.badRequest('Expense has no associated property');
    }

    const ownerInfo = await this.getPropertyOwner(expense.propertyId);

    if (!ownerInfo.ownerPhone) {
      throw ApiError.badRequest(`Owner ${ownerInfo.ownerName} has no phone number configured`);
    }

    // Check threshold
    const expenseAmount = Number(expense.amount);
    if (expenseAmount <= ownerInfo.expenseApprovalThreshold) {
      throw ApiError.badRequest(
        `Expense amount (${expenseAmount}) does not exceed threshold (${ownerInfo.expenseApprovalThreshold})`,
      );
    }

    // Check for existing pending approval
    const existing = await prisma.expenseApprovalRequest.findFirst({
      where: {
        expenseId,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw ApiError.conflict('An approval request is already pending for this expense');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Create the approval request in DB
    const approvalRequest = await prisma.expenseApprovalRequest.create({
      data: {
        expenseId,
        ownerId: ownerInfo.ownerId,
        ownerPhone: ownerInfo.ownerPhone,
        status: 'PENDING',
        sentAt: now,
        expiresAt,
      },
    });

    // Update expense status to PENDING
    await prisma.expenseRecord.update({
      where: { id: expenseId },
      data: { approvalStatus: 'PENDING' },
    });

    // Build WhatsApp message
    const message = this.buildApprovalMessage(
      {
        propertyName: ownerInfo.propertyName,
        category: expense.category,
        amount: expenseAmount,
        currency: expense.currency,
        description: expense.description,
        vendor: expense.vendor,
        date: expense.date,
      },
      ownerInfo.ownerName,
    );

    // Attempt to send via WhatsApp (catch errors so approval record is still created)
    try {
      const config = getWhatsAppConfig();
      if (config.apiKey) {
        const result = await evolutionWhatsApp.sendMessage(config, {
          phone: ownerInfo.ownerPhone,
          message,
        });
        // Store the WhatsApp message ID in the approval request metadata
        await prisma.expenseApprovalRequest.update({
          where: { id: approvalRequest.id },
          data: {
            metadata: { whatsappMessageId: result.messageId },
          },
        });
        // Also store on the expense record itself
        await prisma.expenseRecord.update({
          where: { id: expenseId },
          data: { whatsappApprovalMsgId: result.messageId },
        });
      }
    } catch (err: any) {
      console.error('[ExpenseApproval] Failed to send WhatsApp message:', err.message);
      // We still keep the approval request so it can be approved via the web UI
    }

    // TODO: Migrate to BullMQ for production-grade scheduled reminders
    // Schedule reminder after 24 hours (using setTimeout for now)
    this.scheduleReminder(approvalRequest.id, 24 * 60 * 60 * 1000);

    // Audit log
    await this.addAuditEntry(
      'APPROVAL_REQUESTED',
      'expense',
      expenseId,
      null,
      `Approval requested from ${ownerInfo.ownerName} (${ownerInfo.ownerPhone}) for expense ${formatCurrency(expenseAmount, expense.currency)}`,
    );

    return approvalRequest;
  }

  /**
   * Process an approval or rejection.
   *
   * 1. Find the pending request in DB
   * 2. Update expense status to APPROVED or REJECTED
   * 3. Update the approval request status
   * 4. Send confirmation WhatsApp to owner
   * 5. Create audit log entry
   */
  async processApproval(
    expenseId: string,
    approved: boolean,
    approvedBy: string,
  ) {
    const request = await prisma.expenseApprovalRequest.findFirst({
      where: {
        expenseId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw ApiError.notFound('Pending approval request');
    }

    const now = new Date();

    // Update the approval request status
    const updatedRequest = await prisma.expenseApprovalRequest.update({
      where: { id: request.id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        respondedAt: now,
      },
    });

    // Update the expense record
    const expense = await prisma.expenseRecord.update({
      where: { id: expenseId },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        approvedById: approved ? approvedBy : undefined,
        approvedAt: approved ? now : undefined,
        notes: approved ? undefined : `Rejected by owner via WhatsApp`,
      },
      include: { property: true },
    });

    const expenseAmount = Number(expense.amount);
    const propertyName = expense.property?.name || 'Unknown Property';

    // Send confirmation to owner via WhatsApp
    try {
      const config = getWhatsAppConfig();
      if (config.apiKey) {
        const confirmMsg = approved
          ? `*Expense Approved* \u2705\n\nYou approved the expense of ${formatCurrency(expenseAmount, expense.currency)} for ${propertyName}.\n\n_${expense.description}_`
          : `*Expense Rejected* \u274C\n\nYou rejected the expense of ${formatCurrency(expenseAmount, expense.currency)} for ${propertyName}.\n\n_${expense.description}_`;

        await evolutionWhatsApp.sendMessage(config, {
          phone: request.ownerPhone,
          message: confirmMsg,
        });
      }
    } catch (err: any) {
      console.error('[ExpenseApproval] Failed to send confirmation WhatsApp:', err.message);
    }

    // Audit log
    await this.addAuditEntry(
      approved ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
      'expense',
      expenseId,
      approvedBy,
      `Expense ${approved ? 'approved' : 'rejected'} by ${approvedBy}: ${formatCurrency(expenseAmount, expense.currency)} - ${expense.description}`,
    );

    return { expense, approvalRequest: updatedRequest };
  }

  /**
   * Send a reminder for a pending approval that hasn't been responded to.
   */
  async sendReminder(approvalRequestId: string): Promise<void> {
    const request = await prisma.expenseApprovalRequest.findUnique({
      where: { id: approvalRequestId },
    });

    if (!request || request.status !== 'PENDING') return;

    const expense = await prisma.expenseRecord.findUnique({
      where: { id: request.expenseId },
      include: { property: true },
    });

    if (!expense) return; // Expense deleted

    const expenseAmount = Number(expense.amount);
    const propertyName = expense.property?.name || 'Unknown Property';

    const reminderMsg =
      `\u23F0 *Reminder: Expense Approval Pending*\n\n` +
      `You have not yet responded to the expense approval request:\n\n` +
      `Property: ${propertyName}\n` +
      `Amount: ${formatCurrency(expenseAmount, expense.currency)}\n` +
      `Description: ${expense.description}\n\n` +
      `Reply:\n` +
      `\u2705 *1* or *Approve* to approve\n` +
      `\u274C *2* or *Reject* to reject`;

    try {
      const config = getWhatsAppConfig();
      if (config.apiKey) {
        await evolutionWhatsApp.sendMessage(config, {
          phone: request.ownerPhone,
          message: reminderMsg,
        });
      }
    } catch (err: any) {
      console.error('[ExpenseApproval] Failed to send reminder:', err.message);
    }

    await prisma.expenseApprovalRequest.update({
      where: { id: approvalRequestId },
      data: { reminderSentAt: new Date() },
    });
  }

  /**
   * Find a pending approval request by the owner's phone number.
   * Used by the webhook to match incoming WhatsApp responses.
   */
  async findPendingByPhone(phone: string) {
    // Normalize phone for comparison
    const normalizedPhone = phone.replace(/\D/g, '');

    // Query all pending requests and match by normalized phone
    // We use contains/endsWith matching to handle format differences (e.g. with/without country code prefix)
    const pendingRequests = await prisma.expenseApprovalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests.find((r) => {
      const reqPhone = r.ownerPhone.replace(/\D/g, '');
      return (
        reqPhone === normalizedPhone ||
        normalizedPhone.endsWith(reqPhone) ||
        reqPhone.endsWith(normalizedPhone)
      );
    }) || null;
  }

  /**
   * Get all approval requests, optionally filtered.
   */
  async getApprovalRequests(filters: {
    status?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, ownerId, page = 1, limit = 20 } = filters;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;

    const [approvalRequests, total] = await Promise.all([
      prisma.expenseApprovalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expenseApprovalRequest.count({ where }),
    ]);

    return { approvalRequests, total, page, limit };
  }

  /**
   * Get a single approval request by ID.
   */
  async getApprovalRequestById(id: string) {
    const request = await prisma.expenseApprovalRequest.findUnique({
      where: { id },
    });
    if (!request) throw ApiError.notFound('Approval request');
    return request;
  }

  /**
   * Get all pending approvals for a specific owner.
   */
  async getPendingForOwner(ownerId: string) {
    return prisma.expenseApprovalRequest.findMany({
      where: {
        ownerId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get approval history for a specific owner (approved + rejected + expired).
   */
  async getHistoryForOwner(ownerId: string) {
    return prisma.expenseApprovalRequest.findMany({
      where: {
        ownerId,
        status: { not: 'PENDING' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Expire requests that have passed their expiresAt time.
   * Returns the number of expired requests.
   */
  async expireOldRequests(): Promise<number> {
    const result = await prisma.expenseApprovalRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }

  /**
   * Get audit entries for an expense.
   */
  async getAuditEntries(entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entityType: 'expense',
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildApprovalMessage(
    expense: {
      propertyName: string;
      category: string;
      amount: number;
      currency: string;
      description: string;
      vendor?: string | null;
      date: Date | string;
    },
    ownerName: string,
  ): string {
    const date = typeof expense.date === 'string'
      ? expense.date.split('T')[0]
      : new Date(expense.date).toISOString().split('T')[0];

    return (
      `\uD83D\uDD14 *Expense Approval Required*\n\n` +
      `Property: ${expense.propertyName}\n` +
      `Category: ${expense.category}\n` +
      `Amount: ${formatCurrency(expense.amount, expense.currency)}\n` +
      `Description: ${expense.description}\n` +
      `${expense.vendor ? `Vendor: ${expense.vendor}\n` : ''}` +
      `Date: ${date}\n\n` +
      `Reply:\n` +
      `\u2705 *1* or *Approve* to approve\n` +
      `\u274C *2* or *Reject* to reject`
    );
  }

  // TODO: Migrate to BullMQ for production-grade scheduled reminders
  // setTimeout is acceptable for MVP but will not survive server restarts.
  private scheduleReminder(requestId: string, delayMs: number): void {
    setTimeout(async () => {
      try {
        await this.sendReminder(requestId);
      } catch (err: any) {
        console.error('[ExpenseApproval] Reminder failed:', err.message);
      }
    }, delayMs);
  }

  private async addAuditEntry(
    action: string,
    entityType: string,
    entityId: string,
    userId: string | null,
    details: string,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        newValues: { details },
      },
    });
  }
}

export const expenseApprovalService = new ExpenseApprovalService();
