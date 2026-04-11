import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Mail,
  Smartphone,
  MessageCircle,
  Bell,
  Send,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
type ThreadStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
type MessageDirection = 'INBOUND' | 'OUTBOUND';

interface Message {
  id: string;
  direction: MessageDirection;
  content: string;
  timestamp: string;
  senderName: string;
}

interface Thread {
  id: string;
  subject: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  propertyId: string;
  channel: Channel;
  status: ThreadStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  unread: boolean;
  lastMessagePreview: string;
  lastMessageAt: string;
  messages: Message[];
}

const channelIcons: Record<Channel, typeof Mail> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageCircle,
  IN_APP: Bell,
};

const channelLabels: Record<Channel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'In-App',
};

const statusStyles: Record<ThreadStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-600',
  PENDING: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  CLOSED: 'bg-outline-variant/20 text-on-surface-variant',
};

const priorityStyles: Record<string, string> = {
  LOW: 'bg-outline-variant/20 text-on-surface-variant',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-error/10 text-error',
};

const demoThreads: Thread[] = [
  {
    id: 'thread-001',
    subject: 'Check-in instructions request',
    guestName: 'Maria Papadopoulos',
    guestEmail: 'maria.p@gmail.com',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    channel: 'EMAIL',
    status: 'OPEN',
    priority: 'HIGH',
    unread: true,
    lastMessagePreview: 'Could you please send me the check-in instructions and directions?',
    lastMessageAt: '2026-04-11T10:30:00Z',
    messages: [
      {
        id: 'msg-001-1',
        direction: 'INBOUND',
        content: 'Hello! I am looking forward to my stay at Elounda Breeze Villa. Could you please send me the check-in instructions and directions to the property?',
        timestamp: '2026-04-11T10:30:00Z',
        senderName: 'Maria Papadopoulos',
      },
      {
        id: 'msg-001-2',
        direction: 'OUTBOUND',
        content: 'Hi Maria! Welcome! We are excited to host you. The check-in time is 3:00 PM. I will send you the full instructions with the door code and directions 24 hours before your arrival.',
        timestamp: '2026-04-11T11:00:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-001-3',
        direction: 'INBOUND',
        content: 'Thank you! Is it possible to do a late check-in around 10 PM? Our flight arrives at 8:30 PM.',
        timestamp: '2026-04-11T11:15:00Z',
        senderName: 'Maria Papadopoulos',
      },
      {
        id: 'msg-001-4',
        direction: 'OUTBOUND',
        content: 'Absolutely, late check-in is no problem at all. The property has a smart lock so you can arrive at any time. I will make sure the lights are on for you.',
        timestamp: '2026-04-11T11:30:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-001-5',
        direction: 'INBOUND',
        content: 'Perfect, that sounds great! One more thing - is there parking available at the property?',
        timestamp: '2026-04-11T12:00:00Z',
        senderName: 'Maria Papadopoulos',
      },
    ],
  },
  {
    id: 'thread-002',
    subject: 'AC not working - urgent',
    guestName: 'Hans Mueller',
    guestEmail: 'h.mueller@outlook.de',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    channel: 'WHATSAPP',
    status: 'PENDING',
    priority: 'HIGH',
    unread: true,
    lastMessagePreview: 'The AC unit is still not working. Room temperature is 28C.',
    lastMessageAt: '2026-04-11T09:45:00Z',
    messages: [
      {
        id: 'msg-002-1',
        direction: 'INBOUND',
        content: 'Hi, the air conditioning in the bedroom is not cooling at all. It is running but the room stays very warm.',
        timestamp: '2026-04-10T22:00:00Z',
        senderName: 'Hans Mueller',
      },
      {
        id: 'msg-002-2',
        direction: 'OUTBOUND',
        content: 'Hello Hans, I am very sorry about this issue. I have contacted our HVAC technician and they will come tomorrow morning. In the meantime, there is a portable fan in the storage closet.',
        timestamp: '2026-04-10T22:30:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-002-3',
        direction: 'INBOUND',
        content: 'The AC unit is still not working. Room temperature is 28C. When will the technician arrive?',
        timestamp: '2026-04-11T09:45:00Z',
        senderName: 'Hans Mueller',
      },
    ],
  },
  {
    id: 'thread-003',
    subject: 'Booking confirmation',
    guestName: 'Sophie Laurent',
    guestEmail: 'sophie.l@yahoo.fr',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    channel: 'EMAIL',
    status: 'RESOLVED',
    priority: 'LOW',
    unread: false,
    lastMessagePreview: 'Thank you for confirming! See you soon.',
    lastMessageAt: '2026-04-09T16:00:00Z',
    messages: [
      {
        id: 'msg-003-1',
        direction: 'OUTBOUND',
        content: 'Dear Sophie, your booking at Chania Old Town Residence has been confirmed for April 10-14. Please find the confirmation details attached.',
        timestamp: '2026-04-09T14:00:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-003-2',
        direction: 'INBOUND',
        content: 'Thank you for confirming! We are very excited. Just to confirm - we will be arriving with our small dog. Is that still okay?',
        timestamp: '2026-04-09T15:30:00Z',
        senderName: 'Sophie Laurent',
      },
      {
        id: 'msg-003-3',
        direction: 'OUTBOUND',
        content: 'Yes, absolutely! Dogs are welcome at the property. We will prepare a pet-friendly setup for you. See you soon!',
        timestamp: '2026-04-09T15:45:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-003-4',
        direction: 'INBOUND',
        content: 'Thank you for confirming! See you soon.',
        timestamp: '2026-04-09T16:00:00Z',
        senderName: 'Sophie Laurent',
      },
    ],
  },
  {
    id: 'thread-004',
    subject: 'Early check-out request',
    guestName: 'James Thompson',
    guestEmail: 'j.thompson@gmail.com',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    channel: 'SMS',
    status: 'CLOSED',
    priority: 'LOW',
    unread: false,
    lastMessagePreview: 'All done. Safe travels!',
    lastMessageAt: '2026-04-09T08:00:00Z',
    messages: [
      {
        id: 'msg-004-1',
        direction: 'INBOUND',
        content: 'Hi, I need to check out early tomorrow morning around 6 AM instead of 11 AM. Is that okay?',
        timestamp: '2026-04-08T20:00:00Z',
        senderName: 'James Thompson',
      },
      {
        id: 'msg-004-2',
        direction: 'OUTBOUND',
        content: 'No problem at all, James. You can leave the keys on the kitchen counter. Have a safe trip!',
        timestamp: '2026-04-08T20:15:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-004-3',
        direction: 'INBOUND',
        content: 'All done. Keys on the counter. Thank you for the wonderful stay!',
        timestamp: '2026-04-09T06:15:00Z',
        senderName: 'James Thompson',
      },
      {
        id: 'msg-004-4',
        direction: 'OUTBOUND',
        content: 'All done. Safe travels! Thank you for staying with us. Hope to see you again!',
        timestamp: '2026-04-09T08:00:00Z',
        senderName: 'Sivan M.',
      },
    ],
  },
  {
    id: 'thread-005',
    subject: 'Pool heating request',
    guestName: 'Elena Ivanova',
    guestEmail: 'e.ivanova@mail.ru',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    channel: 'IN_APP',
    status: 'OPEN',
    priority: 'MEDIUM',
    unread: true,
    lastMessagePreview: 'Is it possible to heat the pool before our arrival?',
    lastMessageAt: '2026-04-11T08:00:00Z',
    messages: [
      {
        id: 'msg-005-1',
        direction: 'INBOUND',
        content: 'Hello, we are arriving on April 25th. Is it possible to heat the pool before our arrival? We would like it to be ready when we get there.',
        timestamp: '2026-04-11T08:00:00Z',
        senderName: 'Elena Ivanova',
      },
    ],
  },
  {
    id: 'thread-006',
    subject: 'Maintenance follow-up',
    guestName: 'Marco Rossi',
    guestEmail: 'm.rossi@libero.it',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    channel: 'WHATSAPP',
    status: 'PENDING',
    priority: 'MEDIUM',
    unread: false,
    lastMessagePreview: 'Was the window latch fixed? We arrive next week.',
    lastMessageAt: '2026-04-10T14:30:00Z',
    messages: [
      {
        id: 'msg-006-1',
        direction: 'INBOUND',
        content: 'Hi, I saw in the reviews that there was a window latch issue. Has this been fixed before our stay? We arrive on April 20th.',
        timestamp: '2026-04-10T14:00:00Z',
        senderName: 'Marco Rossi',
      },
      {
        id: 'msg-006-2',
        direction: 'OUTBOUND',
        content: 'Hello Marco! Yes, our maintenance team is currently fixing it. It will be fully repaired well before your arrival.',
        timestamp: '2026-04-10T14:15:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-006-3',
        direction: 'INBOUND',
        content: 'Was the window latch fixed? We arrive next week. Just want to make sure everything is ready.',
        timestamp: '2026-04-10T14:30:00Z',
        senderName: 'Marco Rossi',
      },
    ],
  },
  {
    id: 'thread-007',
    subject: 'Invoice request',
    guestName: 'Anna Schmidt',
    guestEmail: 'anna.s@web.de',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    channel: 'EMAIL',
    status: 'RESOLVED',
    priority: 'LOW',
    unread: false,
    lastMessagePreview: 'Received, thank you!',
    lastMessageAt: '2026-04-08T12:00:00Z',
    messages: [
      {
        id: 'msg-007-1',
        direction: 'INBOUND',
        content: 'Hello, could you please send me an invoice for my cancelled stay? I need it for my travel insurance claim.',
        timestamp: '2026-04-07T10:00:00Z',
        senderName: 'Anna Schmidt',
      },
      {
        id: 'msg-007-2',
        direction: 'OUTBOUND',
        content: 'Of course, Anna. I have prepared the invoice and attached it to this email. Let me know if you need any changes.',
        timestamp: '2026-04-07T11:00:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-007-3',
        direction: 'INBOUND',
        content: 'Received, thank you! That is exactly what I needed.',
        timestamp: '2026-04-08T12:00:00Z',
        senderName: 'Anna Schmidt',
      },
    ],
  },
  {
    id: 'thread-008',
    subject: 'Wi-Fi password not working',
    guestName: 'David Chen',
    guestEmail: 'd.chen@gmail.com',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    channel: 'SMS',
    status: 'OPEN',
    priority: 'MEDIUM',
    unread: false,
    lastMessagePreview: 'Try the new password: SunsetCrete2026',
    lastMessageAt: '2026-04-10T19:00:00Z',
    messages: [
      {
        id: 'msg-008-1',
        direction: 'INBOUND',
        content: 'Hi, the Wi-Fi password in the welcome book is not working. Can you help?',
        timestamp: '2026-04-10T18:30:00Z',
        senderName: 'David Chen',
      },
      {
        id: 'msg-008-2',
        direction: 'OUTBOUND',
        content: 'Sorry about that, David! The password was recently changed. Try the new password: SunsetCrete2026',
        timestamp: '2026-04-10T19:00:00Z',
        senderName: 'Sivan M.',
      },
      {
        id: 'msg-008-3',
        direction: 'INBOUND',
        content: 'That worked, thanks!',
        timestamp: '2026-04-10T19:05:00Z',
        senderName: 'David Chen',
      },
    ],
  },
];

export default function MessagesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return demoThreads.filter((thread) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !thread.subject.toLowerCase().includes(q) &&
          !thread.guestName.toLowerCase().includes(q) &&
          !thread.lastMessagePreview.toLowerCase().includes(q)
        )
          return false;
      }
      if (statusFilter !== 'all' && thread.status !== statusFilter) return false;
      if (channelFilter !== 'all' && thread.channel !== channelFilter) return false;
      return true;
    });
  }, [search, statusFilter, channelFilter]);

  const selectedThread = selectedThreadId
    ? demoThreads.find((t) => t.id === selectedThreadId) ?? null
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThreadId]);

  const handleSend = () => {
    if (!composeText.trim()) return;
    setComposeText('');
  };

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('messages.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('messages.title')}
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('messages.newThread')}</span>
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Thread List - Left Panel */}
          <div
            className={`${
              selectedThread ? 'hidden md:flex' : 'flex'
            } flex-col w-full md:w-[40%] lg:w-[38%] border-e border-outline-variant/20 h-full`}
          >
            {/* Thread Filters */}
            <div className="p-3 border-b border-outline-variant/20 space-y-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                >
                  <option value="all">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>
            </div>

            {/* Thread Cards */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((thread) => {
                const ChannelIcon = channelIcons[thread.channel];
                const isSelected = selectedThreadId === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-start p-4 border-b border-outline-variant/10 transition-colors ${
                      isSelected
                        ? 'bg-secondary/5'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                        {thread.guestName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${thread.unread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                            {thread.guestName}
                          </p>
                          <span className="text-[10px] text-on-surface-variant whitespace-nowrap flex-shrink-0">
                            {formatTime(thread.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ChannelIcon className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                          <p className={`text-xs truncate ${thread.unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                            {thread.subject}
                          </p>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {thread.lastMessagePreview}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${statusStyles[thread.status]}`}
                          >
                            {thread.status}
                          </span>
                          {thread.priority !== 'LOW' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${priorityStyles[thread.priority]}`}
                            >
                              {thread.priority}
                            </span>
                          )}
                          {thread.unread && (
                            <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-3 md:hidden" />
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-on-surface-variant text-sm">
                  No conversations found
                </div>
              )}
            </div>
          </div>

          {/* Message View - Right Panel */}
          <div
            className={`${
              selectedThread ? 'flex' : 'hidden md:flex'
            } flex-col flex-1 h-full`}
          >
            {selectedThread ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-outline-variant/20 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedThreadId(null)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container-low transition-colors md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-headline text-base font-semibold text-on-surface truncate">
                          {selectedThread.subject}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${statusStyles[selectedThread.status]}`}
                        >
                          {selectedThread.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                        <span>{selectedThread.guestName}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{selectedThread.propertyName}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        {(() => {
                          const Icon = channelIcons[selectedThread.channel];
                          return (
                            <span className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {channelLabels[selectedThread.channel]}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedThread.messages.map((msg) => {
                    const isOutbound = msg.direction === 'OUTBOUND';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-3 ${
                            isOutbound
                              ? 'gradient-accent text-white rounded-ee-sm'
                              : 'bg-surface-container-low text-on-surface rounded-es-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <div
                            className={`flex items-center gap-2 mt-2 ${
                              isOutbound ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                isOutbound ? 'text-white/70' : 'text-on-surface-variant'
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            <span
                              className={`text-[10px] ${
                                isOutbound ? 'text-white/50' : 'text-on-surface-variant/50'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose Area */}
                <div className="p-4 border-t border-outline-variant/20 flex-shrink-0">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      placeholder={t('messages.compose')}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none border border-outline-variant/30"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!composeText.trim()}
                      className="flex items-center justify-center w-10 h-10 rounded-lg gradient-accent text-white hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                  <p className="text-sm text-on-surface-variant">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
