import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  Archive,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import apiClient from '../lib/api-client';

type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'AIRBNB' | 'BOOKING_COM';
type ThreadStatus = 'OPEN' | 'AWAITING_REPLY' | 'RESOLVED' | 'CLOSED';
type SenderType = 'GUEST' | 'STAFF' | 'SYSTEM' | 'AI';

interface MessageSender {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface GuestMessage {
  id: string;
  threadId: string;
  senderType: SenderType;
  senderId: string | null;
  content: string;
  contentType: string;
  attachments: unknown;
  isRead: boolean;
  aiSuggestedReply: string | null;
  sentAt: string;
  createdAt: string;
  sender: MessageSender | null;
}

interface ThreadProperty {
  id: string;
  name: string;
  city: string;
  internalCode: string;
}

interface ThreadGuest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ThreadBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

interface Thread {
  id: string;
  propertyId: string | null;
  bookingId: string | null;
  guestId: string | null;
  ownerId: string | null;
  channel: Channel;
  subject: string | null;
  status: ThreadStatus;
  assignedToId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  property: ThreadProperty | null;
  booking: ThreadBooking | null;
  guest: ThreadGuest | null;
  assignedTo: MessageSender | null;
  _count: { messages: number };
  // Only present on detail endpoint
  messages?: GuestMessage[];
}

interface ThreadsResponse {
  data: Thread[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface ThreadDetailResponse {
  data: Thread;
}

const channelIcons: Record<Channel, typeof Mail> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageCircle,
  IN_APP: Bell,
  AIRBNB: MessageCircle,
  BOOKING_COM: MessageCircle,
};

const channelLabels: Record<Channel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  IN_APP: 'In-App',
  AIRBNB: 'Airbnb',
  BOOKING_COM: 'Booking.com',
};

const statusStyles: Record<ThreadStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-600',
  AWAITING_REPLY: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  CLOSED: 'bg-outline-variant/20 text-on-surface-variant',
};

export default function MessagesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Queries ---

  const { data: threadsData, isLoading: threadsLoading } = useQuery<ThreadsResponse>({
    queryKey: ['threads', { search, status: statusFilter, channel: channelFilter, page }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 30, sortBy: 'lastMessageAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (channelFilter !== 'all') params.channel = channelFilter;
      const res = await apiClient.get('/communications', { params });
      return res.data;
    },
  });

  const threads = threadsData?.data ?? [];
  const meta = threadsData?.meta;

  const { data: threadDetailData, isLoading: detailLoading } = useQuery<ThreadDetailResponse>({
    queryKey: ['threads', selectedThreadId],
    queryFn: async () => {
      const res = await apiClient.get(`/communications/${selectedThreadId}`);
      return res.data;
    },
    enabled: !!selectedThreadId,
  });

  const selectedThread = threadDetailData?.data ?? null;

  // --- Mutations ---

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const res = await apiClient.post(`/communications/${threadId}/messages`, {
        content,
        senderType: 'STAFF',
        contentType: 'TEXT',
      });
      return res.data;
    },
    onSuccess: () => {
      setComposeText('');
      queryClient.invalidateQueries({ queryKey: ['threads', selectedThreadId] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: () => {
      toast.error(t('messages.sendError', 'Failed to send message'));
    },
  });

  const resolveThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiClient.post(`/communications/${threadId}/resolve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('messages.resolved', 'Thread resolved'));
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads', selectedThreadId] });
    },
    onError: () => {
      toast.error(t('messages.resolveError', 'Failed to resolve thread'));
    },
  });

  const archiveThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await apiClient.put(`/communications/${threadId}`, { status: 'CLOSED' });
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('messages.archived', 'Thread closed'));
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads', selectedThreadId] });
    },
    onError: () => {
      toast.error(t('messages.archiveError', 'Failed to close thread'));
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      await Promise.all(
        messageIds.map((id) => apiClient.put(`/communications/messages/${id}/read`)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['threads', selectedThreadId] });
    },
  });

  // --- Effects ---

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  // Mark unread messages as read when selecting a thread
  useEffect(() => {
    if (selectedThread?.messages) {
      const unreadIds = selectedThread.messages
        .filter((m) => !m.isRead && m.senderType === 'GUEST')
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markReadMutation.mutate(unreadIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id, selectedThread?.messages?.length]);

  // --- Handlers ---

  const handleSend = () => {
    if (!composeText.trim() || !selectedThreadId) return;
    sendMessageMutation.mutate({ threadId: selectedThreadId, content: composeText.trim() });
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  // --- Helpers ---

  const getParticipantName = (thread: Thread): string => {
    if (thread.guest) {
      return `${thread.guest.firstName} ${thread.guest.lastName}`.trim();
    }
    if (thread.booking) {
      return thread.booking.guestName;
    }
    return t('messages.unknownParticipant', 'Unknown');
  };

  const getLastMessagePreview = (thread: Thread): string => {
    return thread.subject || '';
  };

  const getMessageSenderName = (msg: GuestMessage): string => {
    if (msg.sender) {
      return `${msg.sender.firstName} ${msg.sender.lastName}`.trim();
    }
    if (msg.senderType === 'GUEST') return t('messages.guest', 'Guest');
    if (msg.senderType === 'SYSTEM') return t('messages.system', 'System');
    if (msg.senderType === 'AI') return 'AI';
    return t('messages.staff', 'Staff');
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
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
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full ps-10 pe-4 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="AWAITING_REPLY">Awaiting Reply</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <select
                  value={channelFilter}
                  onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                >
                  <option value="all">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_APP">In-App</option>
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING_COM">Booking.com</option>
                </select>
              </div>
            </div>

            {/* Thread Cards */}
            <div className="flex-1 overflow-y-auto">
              {threadsLoading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
                </div>
              )}
              {!threadsLoading && threads.map((thread) => {
                const ChannelIcon = channelIcons[thread.channel] ?? MessageCircle;
                const isSelected = selectedThreadId === thread.id;
                const participantName = getParticipantName(thread);
                const hasUnread = thread.unreadCount > 0;
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`w-full text-start p-4 border-b border-outline-variant/10 transition-colors ${
                      isSelected
                        ? 'bg-secondary/5'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                        {participantName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                            {participantName}
                          </p>
                          <span className="text-[10px] text-on-surface-variant whitespace-nowrap flex-shrink-0">
                            {formatTime(thread.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ChannelIcon className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                          <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}`}>
                            {thread.subject || t('messages.noSubject', 'No subject')}
                          </p>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {thread.property?.name || ''}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${statusStyles[thread.status]}`}
                          >
                            {thread.status.replace('_', ' ')}
                          </span>
                          {hasUnread && (
                            <span className="min-w-[18px] h-[18px] rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-white px-1 flex-shrink-0">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-on-surface-variant flex-shrink-0 mt-3 md:hidden" />
                    </div>
                  </button>
                );
              })}
              {!threadsLoading && threads.length === 0 && (
                <div className="p-8 text-center text-on-surface-variant text-sm">
                  No conversations found
                </div>
              )}
              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-3 border-t border-outline-variant/10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-xs rounded-lg bg-surface-container-low text-on-surface-variant disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-on-surface-variant">
                    {page} / {meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page >= meta.totalPages}
                    className="px-3 py-1 text-xs rounded-lg bg-surface-container-low text-on-surface-variant disabled:opacity-40"
                  >
                    Next
                  </button>
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
            {selectedThreadId && detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-on-surface-variant" />
              </div>
            ) : selectedThread ? (
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
                          {selectedThread.subject || t('messages.noSubject', 'No subject')}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${statusStyles[selectedThread.status]}`}
                        >
                          {selectedThread.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
                        <span>{getParticipantName(selectedThread)}</span>
                        {selectedThread.property && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-outline-variant" />
                            <span>{selectedThread.property.name}</span>
                          </>
                        )}
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        {(() => {
                          const Icon = channelIcons[selectedThread.channel] ?? MessageCircle;
                          return (
                            <span className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {channelLabels[selectedThread.channel] ?? selectedThread.channel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Thread actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {selectedThread.status === 'OPEN' || selectedThread.status === 'AWAITING_REPLY' ? (
                        <button
                          onClick={() => resolveThreadMutation.mutate(selectedThread.id)}
                          disabled={resolveThreadMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-40"
                          title="Resolve"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Resolve</span>
                        </button>
                      ) : null}
                      {selectedThread.status !== 'CLOSED' && (
                        <button
                          onClick={() => archiveThreadMutation.mutate(selectedThread.id)}
                          disabled={archiveThreadMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant bg-outline-variant/10 hover:bg-outline-variant/20 transition-colors disabled:opacity-40"
                          title="Close"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Close</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedThread.messages?.map((msg) => {
                    const isOutbound = msg.senderType === 'STAFF' || msg.senderType === 'SYSTEM' || msg.senderType === 'AI';
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
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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
                              {getMessageSenderName(msg)}
                            </span>
                            <span
                              className={`text-[10px] ${
                                isOutbound ? 'text-white/50' : 'text-on-surface-variant/50'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
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
                {selectedThread.status !== 'CLOSED' && (
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
                        disabled={!composeText.trim() || sendMessageMutation.isPending}
                        className="flex items-center justify-center w-10 h-10 rounded-lg gradient-accent text-white hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
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
