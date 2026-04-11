import { ApiError } from '../../utils/api-error';
import { whatsappService as evolutionWhatsApp, WhatsAppChannelConfig } from '../notifications/channels/whatsapp.service';
import { expensesService } from './expenses.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PendingApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

interface ExpenseApprovalRequest {
  id: string;
  expenseId: string;
  ownerId: string;
  ownerPhone: string;
  ownerName: string;
  status: PendingApprovalStatus;
  sentAt: string;
  respondedAt?: string;
  reminderSentAt?: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// In-memory stores  (mirrors the codebase pattern)
// ---------------------------------------------------------------------------

const approvalRequests: ExpenseApprovalRequest[] = [];
const auditEntries: AuditEntry[] = [];
let approvalCounter = 1;
let auditCounter = 1;

// Owner data (mirrors the mock data pattern used throughout the codebase)
const ownerLookup: Record<string, { ownerId: string; ownerName: string; ownerPhone: string; expenseApprovalThreshold: number }> = {
  'prop-001': { ownerId: 'owner-001', ownerName: 'Dimitris Papadopoulos', ownerPhone: '+306971234567', expenseApprovalThreshold: 500 },
  'prop-002': { ownerId: 'owner-002', ownerName: 'Eleni Katsarou', ownerPhone: '+306981234567', expenseApprovalThreshold: 300 },
  'prop-003': { ownerId: 'owner-003', ownerName: 'Nikos Stavridis', ownerPhone: '+306991234567', expenseApprovalThreshold: 400 },
  p1: { ownerId: 'owner-001', ownerName: 'Dimitris Papadopoulos', ownerPhone: '+306971234567', expenseApprovalThreshold: 500 },
  p2: { ownerId: 'owner-002', ownerName: 'Eleni Katsarou', ownerPhone: '+306981234567', expenseApprovalThreshold: 300 },
  p3: { ownerId: 'owner-003', ownerName: 'Nikos Stavridis', ownerPhone: '+306991234567', expenseApprovalThreshold: 400 },
  p4: { ownerId: 'owner-002', ownerName: 'Eleni Katsarou', ownerPhone: '+306981234567', expenseApprovalThreshold: 300 },
  p5: { ownerId: 'owner-003', ownerName: 'Nikos Stavridis', ownerPhone: '+306991234567', expenseApprovalThreshold: 400 },
};

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
   * Check if an expense requires owner approval based on the property's
   * owner threshold.  Returns the threshold amount if approval is needed,
   * or null if auto-approved.
   */
  getApprovalThreshold(propertyId: string): number | null {
    const owner = ownerLookup[propertyId];
    if (!owner) return null;
    return owner.expenseApprovalThreshold;
  }

  /**
   * Determine whether a given expense amount needs owner approval.
   */
  needsApproval(propertyId: string, amount: number): boolean {
    const threshold = this.getApprovalThreshold(propertyId);
    if (threshold === null) return false;
    return amount > threshold;
  }

  /**
   * Request approval from the property owner via WhatsApp.
   *
   * 1. Look up expense, property, and owner
   * 2. Check if expense amount > owner's expenseApprovalThreshold
   * 3. Send WhatsApp message to owner with expense details
   * 4. Store a pending approval reference
   * 5. Schedule a 24-hour reminder timeout
   */
  async requestApproval(expenseId: string): Promise<ExpenseApprovalRequest> {
    const expense = await expensesService.getExpenseById(expenseId);

    const ownerInfo = ownerLookup[expense.propertyId];
    if (!ownerInfo) {
      throw ApiError.badRequest(`No owner found for property ${expense.propertyId}`);
    }

    // Check threshold
    if (expense.amount <= ownerInfo.expenseApprovalThreshold) {
      throw ApiError.badRequest(
        `Expense amount (${expense.amount}) does not exceed threshold (${ownerInfo.expenseApprovalThreshold})`,
      );
    }

    // Check for existing pending approval
    const existing = approvalRequests.find(
      (r) => r.expenseId === expenseId && r.status === 'PENDING',
    );
    if (existing) {
      throw ApiError.conflict('An approval request is already pending for this expense');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const approvalRequest: ExpenseApprovalRequest = {
      id: `ear-${String(approvalCounter++).padStart(3, '0')}`,
      expenseId,
      ownerId: ownerInfo.ownerId,
      ownerPhone: ownerInfo.ownerPhone,
      ownerName: ownerInfo.ownerName,
      status: 'PENDING',
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    approvalRequests.push(approvalRequest);

    // Build WhatsApp message
    const message = this.buildApprovalMessage(expense, ownerInfo.ownerName);

    // Attempt to send via WhatsApp (catch errors so approval record is still created)
    try {
      const config = getWhatsAppConfig();
      if (config.apiKey) {
        const result = await evolutionWhatsApp.sendMessage(config, {
          phone: ownerInfo.ownerPhone,
          message,
        });
        approvalRequest.metadata = { whatsappMessageId: result.messageId };
      }
    } catch (err: any) {
      console.error('[ExpenseApproval] Failed to send WhatsApp message:', err.message);
      // We still keep the approval request so it can be approved via the web UI
    }

    // Schedule reminder after 24 hours (in production this would use a job queue)
    this.scheduleReminder(approvalRequest.id, 24 * 60 * 60 * 1000);

    // Audit log
    this.addAuditEntry(
      'APPROVAL_REQUESTED',
      'expense',
      expenseId,
      'system',
      `Approval requested from ${ownerInfo.ownerName} (${ownerInfo.ownerPhone}) for expense ${formatCurrency(expense.amount, expense.currency)}`,
    );

    return approvalRequest;
  }

  /**
   * Process an approval or rejection.
   *
   * 1. Update expense status to APPROVED or REJECTED
   * 2. Send confirmation WhatsApp to owner
   * 3. Send notification to the submitter
   * 4. Create audit log entry
   */
  async processApproval(
    expenseId: string,
    approved: boolean,
    approvedBy: string,
  ): Promise<{ expense: any; approvalRequest: ExpenseApprovalRequest }> {
    const request = approvalRequests.find(
      (r) => r.expenseId === expenseId && r.status === 'PENDING',
    );
    if (!request) {
      throw ApiError.notFound('Pending approval request');
    }

    const now = new Date().toISOString();
    request.status = approved ? 'APPROVED' : 'REJECTED';
    request.respondedAt = now;
    request.updatedAt = now;

    // Update the expense
    let expense: any;
    if (approved) {
      expense = await expensesService.approveExpense(expenseId, approvedBy);
    } else {
      expense = await expensesService.rejectExpense(expenseId, `Rejected by owner via WhatsApp`);
    }

    // Send confirmation to owner via WhatsApp
    try {
      const config = getWhatsAppConfig();
      if (config.apiKey) {
        const confirmMsg = approved
          ? `*Expense Approved* \u2705\n\nYou approved the expense of ${formatCurrency(expense.amount, expense.currency)} for ${expense.propertyName}.\n\n_${expense.description}_`
          : `*Expense Rejected* \u274C\n\nYou rejected the expense of ${formatCurrency(expense.amount, expense.currency)} for ${expense.propertyName}.\n\n_${expense.description}_`;

        await evolutionWhatsApp.sendMessage(config, {
          phone: request.ownerPhone,
          message: confirmMsg,
        });
      }
    } catch (err: any) {
      console.error('[ExpenseApproval] Failed to send confirmation WhatsApp:', err.message);
    }

    // Audit log
    this.addAuditEntry(
      approved ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
      'expense',
      expenseId,
      approvedBy,
      `Expense ${approved ? 'approved' : 'rejected'} by ${approvedBy}: ${formatCurrency(expense.amount, expense.currency)} - ${expense.description}`,
    );

    return { expense, approvalRequest: request };
  }

  /**
   * Send a reminder for a pending approval that hasn't been responded to.
   */
  async sendReminder(approvalRequestId: string): Promise<void> {
    const request = approvalRequests.find((r) => r.id === approvalRequestId);
    if (!request || request.status !== 'PENDING') return;

    let expense: any;
    try {
      expense = await expensesService.getExpenseById(request.expenseId);
    } catch {
      return; // Expense deleted
    }

    const reminderMsg =
      `\u23F0 *Reminder: Expense Approval Pending*\n\n` +
      `You have not yet responded to the expense approval request:\n\n` +
      `Property: ${expense.propertyName}\n` +
      `Amount: ${formatCurrency(expense.amount, expense.currency)}\n` +
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

    request.reminderSentAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
  }

  /**
   * Find a pending approval request by the owner's phone number.
   * Used by the webhook to match incoming WhatsApp responses.
   */
  findPendingByPhone(phone: string): ExpenseApprovalRequest | undefined {
    // Normalize phone for comparison
    const normalizedPhone = phone.replace(/\D/g, '');

    return approvalRequests.find((r) => {
      const reqPhone = r.ownerPhone.replace(/\D/g, '');
      return r.status === 'PENDING' && (reqPhone === normalizedPhone || normalizedPhone.endsWith(reqPhone) || reqPhone.endsWith(normalizedPhone));
    });
  }

  /**
   * Get all approval requests, optionally filtered.
   */
  getApprovalRequests(filters: {
    status?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, ownerId, page = 1, limit = 20 } = filters;

    let filtered = [...approvalRequests];
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (ownerId) filtered = filtered.filter((r) => r.ownerId === ownerId);

    filtered.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { approvalRequests: items, total, page, limit };
  }

  /**
   * Get a single approval request by ID.
   */
  getApprovalRequestById(id: string): ExpenseApprovalRequest {
    const request = approvalRequests.find((r) => r.id === id);
    if (!request) throw ApiError.notFound('Approval request');
    return request;
  }

  /**
   * Get all pending approvals for a specific owner.
   */
  getPendingForOwner(ownerId: string) {
    return approvalRequests.filter(
      (r) => r.ownerId === ownerId && r.status === 'PENDING',
    );
  }

  /**
   * Get approval history for a specific owner (approved + rejected + expired).
   */
  getHistoryForOwner(ownerId: string) {
    return approvalRequests.filter(
      (r) => r.ownerId === ownerId && r.status !== 'PENDING',
    );
  }

  /**
   * Expire requests that have passed their expiresAt time.
   */
  expireOldRequests(): number {
    const now = new Date().toISOString();
    let count = 0;
    for (const req of approvalRequests) {
      if (req.status === 'PENDING' && req.expiresAt < now) {
        req.status = 'EXPIRED';
        req.updatedAt = now;
        count++;
      }
    }
    return count;
  }

  /**
   * Get audit entries for an expense.
   */
  getAuditEntries(entityId: string) {
    return auditEntries.filter((e) => e.entityId === entityId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildApprovalMessage(
    expense: any,
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

  private scheduleReminder(requestId: string, delayMs: number): void {
    // In production this would use a proper job scheduler (bull, agenda, etc.)
    setTimeout(async () => {
      try {
        await this.sendReminder(requestId);
      } catch (err: any) {
        console.error('[ExpenseApproval] Reminder failed:', err.message);
      }
    }, delayMs);
  }

  private addAuditEntry(
    action: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    details: string,
  ): void {
    auditEntries.push({
      id: `audit-${String(auditCounter++).padStart(3, '0')}`,
      action,
      entityType,
      entityId,
      performedBy,
      details,
      createdAt: new Date().toISOString(),
    });
  }
}

export const expenseApprovalService = new ExpenseApprovalService();
