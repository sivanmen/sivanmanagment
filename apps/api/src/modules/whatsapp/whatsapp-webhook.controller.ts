import { Request, Response } from 'express';
import { expenseApprovalService } from '../expenses/expense-approval.service';

// ---------------------------------------------------------------------------
// Evolution API Webhook Payload Types
// ---------------------------------------------------------------------------

interface EvolutionWebhookPayload {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
    };
    messageType?: string;
    pushName?: string;
  };
}

// ---------------------------------------------------------------------------
// Approval / Rejection keyword sets (case-insensitive)
// ---------------------------------------------------------------------------

const APPROVE_KEYWORDS = new Set([
  '1',
  'approve',
  'approved',
  'yes',
  'אישור',
  'כן',
  'אשר',
]);

const REJECT_KEYWORDS = new Set([
  '2',
  'reject',
  'rejected',
  'no',
  'דחייה',
  'לא',
  'דחה',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the bare phone number from a WhatsApp JID like "306971234567@s.whatsapp.net" */
function extractPhoneFromJid(remoteJid: string): string {
  return remoteJid.replace(/@.*$/, '');
}

/** Extract readable message text from the Evolution API message object */
function extractMessageText(
  messageObj: { conversation?: string; extendedTextMessage?: { text?: string } } | undefined,
): string {
  if (!messageObj) return '';
  return (
    messageObj.conversation ||
    messageObj.extendedTextMessage?.text ||
    ''
  );
}

/** Classify message text as approval (true), rejection (false), or unrecognized (null) */
function classifyResponse(text: string): boolean | null {
  const normalized = text.trim().toLowerCase();
  if (APPROVE_KEYWORDS.has(normalized)) return true;
  if (REJECT_KEYWORDS.has(normalized)) return false;
  return null;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

export class WhatsAppWebhookController {
  /**
   * GET /api/v1/webhooks/whatsapp
   *
   * Verification endpoint. Evolution API (and some webhook registrars) may
   * issue a GET to confirm the URL is reachable before sending events.
   */
  verify(req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'sivan-pms-whatsapp-webhook',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /api/v1/webhooks/whatsapp
   *
   * Receives incoming WhatsApp messages from Evolution API.
   *
   * Flow:
   *  1. Validate that the event is a message event.
   *  2. Extract sender phone and message text.
   *  3. Classify the message as approve / reject / unrelated.
   *  4. Look up a pending expense-approval request by phone.
   *  5. Process the approval or rejection.
   *  6. Always return 200 quickly so the webhook does not time out.
   */
  async handleIncoming(req: Request, res: Response): Promise<void> {
    const payload: EvolutionWebhookPayload = req.body ?? {};

    const event = payload.event;
    const instance = payload.instance;

    console.log(
      `[WhatsApp Webhook] Received event="${event ?? 'unknown'}" instance="${instance ?? 'unknown'}"`,
    );

    // ── 1. Only process message events ──────────────────────────────────
    if (event && event !== 'messages.upsert') {
      console.log(`[WhatsApp Webhook] Ignoring non-message event: ${event}`);
      res.status(200).json({ acknowledged: true, event });
      return;
    }

    const data = payload.data;
    if (!data) {
      console.log('[WhatsApp Webhook] No data in payload, ignoring');
      res.status(200).json({ acknowledged: true, reason: 'no_data' });
      return;
    }

    // ── 2. Extract sender phone & message text ──────────────────────────
    const remoteJid = data.key?.remoteJid ?? '';
    const fromMe = data.key?.fromMe ?? false;
    const messageId = data.key?.id ?? '';
    const pushName = data.pushName ?? '';
    const messageText = extractMessageText(data.message);

    // Ignore messages sent by us (fromMe) or missing essential fields
    if (fromMe) {
      console.log('[WhatsApp Webhook] Ignoring outgoing message (fromMe=true)');
      res.status(200).json({ acknowledged: true, reason: 'from_me' });
      return;
    }

    const senderPhone = extractPhoneFromJid(remoteJid);

    if (!senderPhone || !messageText) {
      console.log(
        `[WhatsApp Webhook] Missing sender or text. phone="${senderPhone}" text="${messageText}"`,
      );
      res.status(200).json({ acknowledged: true, reason: 'no_text_or_sender' });
      return;
    }

    console.log(
      `[WhatsApp Webhook] Message from ${pushName} (${senderPhone}): "${messageText}" [msgId=${messageId}]`,
    );

    // ── 3. Classify the response ────────────────────────────────────────
    const isApproval = classifyResponse(messageText);

    if (isApproval === null) {
      console.log(
        `[WhatsApp Webhook] Message "${messageText}" is not an approval/rejection keyword — ignoring`,
      );
      res.status(200).json({ acknowledged: true, reason: 'not_approval_response' });
      return;
    }

    // ── 4. Find pending approval by phone ───────────────────────────────
    const pendingRequest = await expenseApprovalService.findPendingByPhone(senderPhone);

    if (!pendingRequest) {
      console.log(
        `[WhatsApp Webhook] No pending approval found for phone ${senderPhone}`,
      );
      res.status(200).json({
        acknowledged: true,
        reason: 'no_pending_approval',
        phone: senderPhone,
      });
      return;
    }

    // ── 5. Process the approval / rejection ─────────────────────────────
    try {
      const result = await expenseApprovalService.processApproval(
        pendingRequest.expenseId,
        isApproval,
        `whatsapp:${senderPhone}`,
      );

      const action = isApproval ? 'APPROVED' : 'REJECTED';

      console.log(
        `[WhatsApp Webhook] Expense ${pendingRequest.expenseId} ${action} by ${pushName} (${senderPhone})`,
      );

      res.status(200).json({
        acknowledged: true,
        processed: true,
        expenseId: pendingRequest.expenseId,
        action,
        expense: result.expense,
      });
    } catch (error: any) {
      // Even on processing error, return 200 to prevent Evolution API retries.
      // The error is logged for debugging.
      console.error(
        `[WhatsApp Webhook] Error processing approval for expense ${pendingRequest.expenseId}:`,
        error.message ?? error,
      );

      res.status(200).json({
        acknowledged: true,
        processed: false,
        error: error.message ?? 'Internal processing error',
        expenseId: pendingRequest.expenseId,
      });
    }
  }
}

export const whatsappWebhookController = new WhatsAppWebhookController();
