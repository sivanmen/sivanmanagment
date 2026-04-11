import { ApiError } from '../../utils/api-error';

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  context: 'GENERAL' | 'BOOKING' | 'MAINTENANCE' | 'FINANCE' | 'GUEST';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Recommendation {
  id: string;
  propertyId: string;
  propertyName: string;
  type: 'PRICING' | 'MAINTENANCE' | 'MARKETING' | 'REVENUE' | 'GUEST_EXPERIENCE';
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED';
  confidence: number;
  data?: Record<string, any>;
  createdAt: string;
}

const sessions: ChatSession[] = [
  {
    id: 'chat-001',
    userId: 'u-001',
    title: 'Pricing strategy for summer 2026',
    context: 'FINANCE',
    messageCount: 4,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-10T10:30:00Z',
  },
  {
    id: 'chat-002',
    userId: 'u-001',
    title: 'Maintenance schedule optimization',
    context: 'MAINTENANCE',
    messageCount: 6,
    createdAt: '2026-04-09T14:00:00Z',
    updatedAt: '2026-04-09T14:45:00Z',
  },
];

const messages: ChatMessage[] = [
  { id: 'msg-001', sessionId: 'chat-001', role: 'user', content: 'What pricing should I set for Villa Elounda for July-August?', timestamp: '2026-04-10T10:00:00Z' },
  { id: 'msg-002', sessionId: 'chat-001', role: 'assistant', content: 'Based on your historical data, Villa Elounda Seafront achieved an average nightly rate of EUR 280 during July-August 2025 with 92% occupancy. Given current market trends in Elounda and a 5% year-over-year increase in demand, I recommend setting the rate at EUR 295-310/night for weekdays and EUR 340-360/night for weekends. Consider a 7-night minimum stay for peak weeks.', metadata: { model: 'gpt-4', tokensUsed: 320 }, timestamp: '2026-04-10T10:00:15Z' },
  { id: 'msg-003', sessionId: 'chat-001', role: 'user', content: 'What about early booking discounts?', timestamp: '2026-04-10T10:05:00Z' },
  { id: 'msg-004', sessionId: 'chat-001', role: 'assistant', content: 'I recommend a tiered early booking discount: 15% for bookings made 90+ days in advance, 10% for 60-89 days, and 5% for 30-59 days. Last year, 40% of your July bookings came in before May, so early discounts would help lock in revenue sooner.', metadata: { model: 'gpt-4', tokensUsed: 280 }, timestamp: '2026-04-10T10:05:12Z' },
];

const recommendations: Recommendation[] = [
  {
    id: 'rec-001',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    type: 'PRICING',
    title: 'Increase weekend rates for June',
    description: 'Demand for Elounda properties in June is trending 12% higher than last year. Consider increasing weekend rates by EUR 25-35/night to capture additional revenue.',
    impact: 'HIGH',
    status: 'PENDING',
    confidence: 0.87,
    data: { currentRate: 260, suggestedRate: 290, projectedRevenue: 4350 },
    createdAt: '2026-04-11T06:00:00Z',
  },
  {
    id: 'rec-002',
    propertyId: 'prop-002',
    propertyName: 'Chania Old Town Apt',
    type: 'MAINTENANCE',
    title: 'Schedule AC servicing before peak season',
    description: 'The AC system was last serviced 11 months ago. Based on usage patterns and seasonal needs, schedule preventive maintenance before June to avoid mid-season breakdowns.',
    impact: 'MEDIUM',
    status: 'PENDING',
    confidence: 0.92,
    data: { lastService: '2025-05-15', estimatedCost: 150 },
    createdAt: '2026-04-11T06:00:00Z',
  },
  {
    id: 'rec-003',
    propertyId: 'prop-003',
    propertyName: 'Rethymno Beach House',
    type: 'MARKETING',
    title: 'Optimize listing photos',
    description: 'Properties with professional photos in the Rethymno area receive 35% more views. Consider updating the listing photos for the pool area and sunset view.',
    impact: 'MEDIUM',
    status: 'ACCEPTED',
    confidence: 0.78,
    data: { currentViews: 450, projectedViews: 608 },
    createdAt: '2026-04-10T06:00:00Z',
  },
  {
    id: 'rec-004',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    type: 'GUEST_EXPERIENCE',
    title: 'Add welcome basket for repeat guests',
    description: 'You have 3 repeat guests booked for summer. Adding a personalized welcome basket (EUR 25-40 per guest) significantly increases review scores and loyalty program engagement.',
    impact: 'LOW',
    status: 'PENDING',
    confidence: 0.71,
    data: { repeatGuests: 3, estimatedCost: 105 },
    createdAt: '2026-04-11T06:00:00Z',
  },
];

export class AIService {
  async getSessions(userId: string, filters: { context?: string; page?: number; limit?: number }) {
    const { context, page = 1, limit = 20 } = filters;

    let filtered = sessions.filter((s) => s.userId === userId);
    if (context) filtered = filtered.filter((s) => s.context === context);

    filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { sessions: items, total, page, limit };
  }

  async getSessionMessages(sessionId: string, userId: string) {
    const session = sessions.find((s) => s.id === sessionId && s.userId === userId);
    if (!session) throw ApiError.notFound('Chat session');

    const msgs = messages.filter((m) => m.sessionId === sessionId);
    msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return { session, messages: msgs };
  }

  async chat(userId: string, data: { sessionId?: string; message: string; context?: string }) {
    let session: ChatSession;

    if (data.sessionId) {
      const existing = sessions.find((s) => s.id === data.sessionId && s.userId === userId);
      if (!existing) throw ApiError.notFound('Chat session');
      session = existing;
    } else {
      session = {
        id: `chat-${String(sessions.length + 1).padStart(3, '0')}`,
        userId,
        title: data.message.substring(0, 60),
        context: (data.context as ChatSession['context']) || 'GENERAL',
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      sessions.push(session);
    }

    const userMsg: ChatMessage = {
      id: `msg-${String(messages.length + 1).padStart(3, '0')}`,
      sessionId: session.id,
      role: 'user',
      content: data.message,
      timestamp: new Date().toISOString(),
    };
    messages.push(userMsg);

    // Simulated AI response
    const aiResponse = this.generateResponse(data.message, session.context);
    const assistantMsg: ChatMessage = {
      id: `msg-${String(messages.length + 1).padStart(3, '0')}`,
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse,
      metadata: { model: 'gpt-4', tokensUsed: Math.floor(Math.random() * 400) + 100 },
      timestamp: new Date().toISOString(),
    };
    messages.push(assistantMsg);

    session.messageCount += 2;
    session.updatedAt = new Date().toISOString();

    return { session, userMessage: userMsg, assistantMessage: assistantMsg };
  }

  async deleteSession(sessionId: string, userId: string) {
    const idx = sessions.findIndex((s) => s.id === sessionId && s.userId === userId);
    if (idx === -1) throw ApiError.notFound('Chat session');

    sessions.splice(idx, 1);
    return { message: 'Session deleted successfully' };
  }

  async getRecommendations(filters: {
    propertyId?: string;
    type?: string;
    status?: string;
    impact?: string;
    page?: number;
    limit?: number;
  }) {
    const { propertyId, type, status, impact, page = 1, limit = 20 } = filters;

    let filtered = [...recommendations];
    if (propertyId) filtered = filtered.filter((r) => r.propertyId === propertyId);
    if (type) filtered = filtered.filter((r) => r.type === type);
    if (status) filtered = filtered.filter((r) => r.status === status);
    if (impact) filtered = filtered.filter((r) => r.impact === impact);

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { recommendations: items, total, page, limit };
  }

  async updateRecommendation(id: string, data: { status: string }) {
    const rec = recommendations.find((r) => r.id === id);
    if (!rec) throw ApiError.notFound('Recommendation');

    rec.status = data.status as Recommendation['status'];
    return rec;
  }

  private generateResponse(message: string, context: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('price') || lower.includes('rate') || lower.includes('pricing')) {
      return 'Based on market analysis for Crete properties, current demand trends suggest maintaining competitive pricing. I recommend reviewing your seasonal pricing rules and comparing with similar properties in the area. Would you like me to run a detailed competitive analysis?';
    }
    if (lower.includes('maintenance') || lower.includes('repair')) {
      return 'I can help optimize your maintenance schedule. Based on historical data, preventive maintenance reduces emergency repair costs by 40%. I suggest scheduling AC servicing, plumbing checks, and exterior maintenance before the peak season starts in June.';
    }
    if (lower.includes('booking') || lower.includes('reservation') || lower.includes('occupancy')) {
      return 'Your current occupancy rate across all properties is 78% for the upcoming month. I notice some gaps in mid-week bookings. Consider offering a mid-week discount of 10-15% or creating a special package to fill these gaps.';
    }
    if (lower.includes('guest') || lower.includes('review')) {
      return 'Guest satisfaction across your properties averages 4.6/5. The most common positive mentions are location and cleanliness. Areas for improvement include check-in communication speed and kitchen equipment. I recommend updating your welcome guides with more local restaurant recommendations.';
    }

    return `I understand your question about ${context.toLowerCase()} management. Based on your property portfolio in Crete, I can provide data-driven insights and recommendations. Could you provide more specific details about what you would like to analyze?`;
  }
}

export const aiService = new AIService();
