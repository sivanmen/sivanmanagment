/**
 * AI module — real Prisma-backed sessions + real Anthropic Claude calls.
 *
 * Rewritten 2026-05-25 from a 251-line in-memory mock that returned hardcoded
 * keyword-based "responses". Now uses:
 *   - `AiConversation` (Prisma) for session storage + history
 *   - `lib/ai.service.ts` (Anthropic SDK) for the actual completion calls
 *   - Graceful fallback: when ANTHROPIC_API_KEY is missing the assistant
 *     replies with a clear "AI is not configured yet" message instead of
 *     pretending to answer.
 *
 * Recommendations remain stubbed for now — they require an analytics
 * pipeline (revenue/occupancy trend → recommendation engine) which is a
 * separate roadmap item.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';
import { aiClient } from '../../lib/ai.service';

type SessionContext = 'GENERAL' | 'BOOKING' | 'MAINTENANCE' | 'FINANCE' | 'GUEST';

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const CONTEXT_SYSTEM_PROMPTS: Record<SessionContext, string> = {
  GENERAL:
    'You are an AI assistant inside Sivan Management, a Property Management System for short-term rentals in Crete, Greece. Be concise, practical, and oriented towards small-operator workflows. Reply in the same language as the user.',
  FINANCE:
    'You are a finance advisor inside a Property Management System for short-term rentals in Crete, Greece. Help with pricing, revenue analysis, expense categorization, and owner statements. Be concise and practical. Reply in the same language as the user.',
  BOOKING:
    'You are a booking operations assistant inside a Property Management System for short-term rentals in Crete, Greece. Help with reservation management, calendar conflicts, channel sync, and guest communication. Reply in the same language as the user.',
  MAINTENANCE:
    'You are a maintenance operations assistant inside a Property Management System for short-term rentals in Crete, Greece. Help with work orders, preventive schedules, vendor management, and cost tracking. Reply in the same language as the user.',
  GUEST:
    'You are a guest experience assistant inside a Property Management System for short-term rentals in Crete, Greece. Help with messaging templates, review responses, check-in/out flow, and personalization. Reply in the same language as the user.',
};

const FALLBACK_MESSAGE =
  'AI assistant is not yet configured on this server. Set ANTHROPIC_API_KEY in Railway variables to enable real responses.';

export class AIService {
  // ─── Sessions ────────────────────────────────────────────────────────

  async getSessions(
    userId: string,
    filters: { context?: string; page?: number; limit?: number },
  ) {
    const { context, page = 1, limit = 20 } = filters;

    const where: Prisma.AiConversationWhereInput = { userId };
    if (context) where.contextType = context;

    const [rows, total] = await Promise.all([
      prisma.aiConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aiConversation.count({ where }),
    ]);

    return {
      sessions: rows.map((r) => this.projectSession(r)),
      total,
      page,
      limit,
    };
  }

  async getSessionMessages(sessionId: string, userId: string) {
    const session = await prisma.aiConversation.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw ApiError.notFound('Chat session');

    const messages = this.readMessages(session.messages);
    return { session: this.projectSession(session), messages };
  }

  /**
   * Send a message. Creates a new session if `sessionId` is omitted.
   * Replies via Anthropic when configured, otherwise returns the FALLBACK_MESSAGE
   * so the UX always degrades visibly.
   */
  async chat(
    userId: string,
    data: { sessionId?: string; message: string; context?: string },
  ) {
    const contextType = (data.context as SessionContext) || 'GENERAL';
    const now = new Date();

    // Load or create session
    let session;
    if (data.sessionId) {
      session = await prisma.aiConversation.findFirst({
        where: { id: data.sessionId, userId },
      });
      if (!session) throw ApiError.notFound('Chat session');
    } else {
      session = await prisma.aiConversation.create({
        data: {
          userId,
          contextType,
          provider: 'ANTHROPIC',
          model: 'claude-sonnet-4-20250514',
          messages: [] as Prisma.InputJsonValue,
        },
      });
    }

    const history = this.readMessages(session.messages);
    const userMsg: StoredMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: data.message,
      timestamp: now.toISOString(),
    };

    // Build chat history for the model (user + assistant turns only)
    const modelMessages = [...history, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const completion = await aiClient.complete({
      messages: modelMessages,
      system: CONTEXT_SYSTEM_PROMPTS[contextType] ?? CONTEXT_SYSTEM_PROMPTS.GENERAL,
      maxTokens: 1024,
    });

    let assistantText: string;
    let assistantMetadata: Record<string, unknown> = {};

    if (completion.ok && completion.text) {
      assistantText = completion.text;
      assistantMetadata = {
        provider: completion.provider,
        model: completion.model,
        tokensUsed: completion.usage,
      };
    } else if (completion.skipped) {
      assistantText = FALLBACK_MESSAGE;
      assistantMetadata = { provider: completion.provider, skipped: true };
    } else {
      assistantText = `AI service error: ${completion.error ?? 'unknown'}. Please try again later.`;
      assistantMetadata = { provider: completion.provider, error: completion.error };
    }

    const assistantMsg: StoredMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: assistantText,
      timestamp: new Date().toISOString(),
      metadata: assistantMetadata,
    };

    const newHistory = [...history, userMsg, assistantMsg];
    const totalTokens =
      Number(session.tokensUsed ?? 0) +
      (completion.usage ? completion.usage.input + completion.usage.output : 0);

    const updated = await prisma.aiConversation.update({
      where: { id: session.id },
      data: {
        messages: newHistory as unknown as Prisma.InputJsonValue,
        tokensUsed: totalTokens,
      },
    });

    return {
      session: this.projectSession(updated),
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }

  async deleteSession(sessionId: string, userId: string) {
    const existing = await prisma.aiConversation.findFirst({
      where: { id: sessionId, userId },
    });
    if (!existing) throw ApiError.notFound('Chat session');
    await prisma.aiConversation.delete({ where: { id: sessionId } });
    return { message: 'Session deleted successfully' };
  }

  // ─── Recommendations (stubbed — analytics pipeline pending) ──────────
  // Returns an empty list with a clear shape so the UI doesn't break. A
  // future pass will wire this to a real recommendation engine that reads
  // PropertyScore + analytics aggregates and asks the AI to summarise.

  async getRecommendations(_filters: {
    propertyId?: string;
    type?: string;
    status?: string;
    impact?: string;
    page?: number;
    limit?: number;
  }) {
    return {
      recommendations: [],
      total: 0,
      page: _filters.page ?? 1,
      limit: _filters.limit ?? 20,
      _note:
        'AI recommendations require a wired analytics → recommender pipeline. Returning empty list for now.',
    };
  }

  async updateRecommendation(id: string, _data: { status: string }) {
    throw ApiError.notFound(`Recommendation ${id} (recommendations engine not yet implemented)`);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private readMessages(jsonValue: Prisma.JsonValue | null): StoredMessage[] {
    if (!Array.isArray(jsonValue)) return [];
    const out: StoredMessage[] = [];
    for (const m of jsonValue) {
      if (
        typeof m === 'object' &&
        m !== null &&
        !Array.isArray(m) &&
        'role' in m &&
        'content' in m &&
        typeof (m as any).content === 'string'
      ) {
        const obj = m as Record<string, unknown>;
        out.push({
          id: typeof obj.id === 'string' ? obj.id : `msg-${out.length}`,
          role: obj.role === 'assistant' ? 'assistant' : 'user',
          content: obj.content as string,
          timestamp:
            typeof obj.timestamp === 'string' ? obj.timestamp : new Date().toISOString(),
          metadata:
            typeof obj.metadata === 'object' && obj.metadata !== null
              ? (obj.metadata as Record<string, unknown>)
              : undefined,
        });
      }
    }
    return out;
  }

  private projectSession(session: any) {
    const messages = this.readMessages(session.messages);
    return {
      id: session.id,
      userId: session.userId,
      title: this.deriveTitle(messages),
      context: (session.contextType as SessionContext) || 'GENERAL',
      messageCount: messages.length,
      provider: session.provider,
      model: session.model,
      tokensUsed: session.tokensUsed,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private deriveTitle(messages: StoredMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user');
    if (!firstUser) return 'New conversation';
    return firstUser.content.slice(0, 80);
  }
}

export const aiService = new AIService();
