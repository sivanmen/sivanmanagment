export interface MarketingJourney {
  id: string;
  guestId: string;
  journeyName: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyEvent {
  id: string;
  journeyId: string;
  guestId: string;
  eventType: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP' | 'IN_APP';
  templateId?: string;
  subject?: string;
  content?: string;
  status: 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
