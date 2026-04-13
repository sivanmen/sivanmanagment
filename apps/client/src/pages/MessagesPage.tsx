import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  Check,
  CheckCheck,
  Building2,
  Plus,
  ChevronLeft,
  Image,
  File,
  Download,
  Wrench,
  DollarSign,
  CalendarCheck,
  Bell,
  MoreVertical,
  Phone,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '../hooks/useApi';

// ── Types ────────────────────────────────────────
type ThreadType = 'admin' | 'maintenance' | 'booking' | 'finance' | 'general';

interface Thread {
  id: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  unreadCount: number;
  type: ThreadType;
  propertyName?: string;
  participants: { id: string; name: string }[];
  priority?: 'high' | 'normal' | 'low';
}

interface Message {
  id: string;
  sender: 'owner' | 'admin' | 'system';
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  read: boolean;
  attachments?: { name: string; type: string; size: string; url: string }[];
  replyTo?: string;
}

// ── Helpers ──────────────────────────────────────
function getTypeIcon(type: ThreadType) {
  switch (type) {
    case 'maintenance': return Wrench;
    case 'booking': return CalendarCheck;
    case 'finance': return DollarSign;
    case 'admin': return Bell;
    default: return MessageSquare;
  }
}

function getTypeColor(type: ThreadType) {
  switch (type) {
    case 'maintenance': return 'bg-warning/10 text-warning';
    case 'booking': return 'bg-success/10 text-success';
    case 'finance': return 'bg-secondary/10 text-secondary';
    case 'admin': return 'bg-error/10 text-error';
    default: return 'bg-surface-container-high text-on-surface-variant';
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ThreadType | 'all'>('all');
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadCategory, setNewThreadCategory] = useState('general');
  const [newThreadProperty, setNewThreadProperty] = useState('');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch threads ──
  const {
    data: threadsResponse,
    isLoading: threadsLoading,
    isError: threadsError,
    refetch: refetchThreads,
  } = useApiQuery<Thread[]>(
    ['communication-threads'],
    '/communications/threads',
  );

  const threads: Thread[] = threadsResponse?.data ?? [];

  // ── Fetch messages for selected thread ──
  const {
    data: messagesResponse,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useApiQuery<Message[]>(
    ['communication-messages', selectedThread ?? ''],
    `/communications/threads/${selectedThread}/messages`,
    undefined,
    { enabled: !!selectedThread },
  );

  const currentMessages: Message[] = messagesResponse?.data ?? [];

  // ── Send message mutation ──
  const sendMessageMutation = useApiMutation<Message, { threadId: string; text: string }>(
    'post',
    (vars) => `/communications/threads/${vars.threadId}/messages`,
    {
      invalidateKeys: [
        ['communication-messages', selectedThread ?? ''],
        ['communication-threads'],
      ],
    },
  );

  // ── Create thread mutation ──
  const createThreadMutation = useApiMutation<Thread, { subject: string; type: string; propertyId?: string; message: string }>(
    'post',
    '/communications/threads',
    {
      invalidateKeys: [['communication-threads']],
      successMessage: 'Message sent',
      onSuccess: (data) => {
        setShowNewThread(false);
        setNewThreadSubject('');
        setNewThreadMessage('');
        setNewThreadCategory('general');
        setNewThreadProperty('');
        if (data?.data?.id) {
          setSelectedThread(data.data.id);
          setShowMobileThread(true);
        }
      },
    },
  );

  // ── Filtering ──
  const filteredThreads = threads.filter((th) => {
    const matchesSearch = searchQuery === '' ||
      th.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      th.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || th.type === filterType;
    return matchesSearch && matchesType;
  });

  const currentThread = threads.find((t) => t.id === selectedThread);
  const totalUnread = threads.reduce((s, t) => s + (t.unreadCount || 0), 0);

  // Auto-select first thread when loaded
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      setSelectedThread(threads[0].id);
    }
  }, [threads, selectedThread]);

  const handleSelectThread = (id: string) => {
    setSelectedThread(id);
    setShowMobileThread(true);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread) return;
    sendMessageMutation.mutate({ threadId: selectedThread, text: newMessage.trim() });
    setNewMessage('');
  };

  const handleCreateThread = () => {
    if (!newThreadSubject.trim() || !newThreadMessage.trim()) return;
    createThreadMutation.mutate({
      subject: newThreadSubject.trim(),
      type: newThreadCategory,
      propertyId: newThreadProperty || undefined,
      message: newThreadMessage.trim(),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // ── Loading state ──
  if (threadsLoading) {
    return (
      <div className="p-4 lg:p-6 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-3" />
          <p className="text-sm text-on-surface-variant">Loading messages...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (threadsError) {
    return (
      <div className="p-4 lg:p-6 h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <p className="text-sm font-medium text-on-surface">Failed to load messages</p>
          <p className="text-xs text-on-surface-variant mt-1">Please check your connection and try again.</p>
          <button
            onClick={() => refetchThreads()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-80px)]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-headline text-xl font-bold text-on-surface">Messages</h1>
            <p className="text-xs text-on-surface-variant">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            New Message
          </button>
        </div>

        {/* Chat Layout */}
        <div className="flex-1 flex gap-4 min-h-0 bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          {/* Thread List */}
          <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col border-e border-outline-variant/10 ${showMobileThread ? 'hidden lg:flex' : 'flex'}`}>
            {/* Search & Filter */}
            <div className="p-3 border-b border-outline-variant/10">
              <div className="relative mb-2">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-secondary/30"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                {(['all', 'booking', 'finance', 'maintenance', 'admin', 'general'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors
                      ${filterType === type ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:bg-surface-container-high/60'}`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread items */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 && (
                <div className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-on-surface-variant/20 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant">No conversations found</p>
                </div>
              )}
              {filteredThreads.map((thread) => {
                const TypeIcon = getTypeIcon(thread.type);
                const isActive = selectedThread === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`w-full text-start p-3 border-b border-outline-variant/5 transition-colors
                      ${isActive ? 'bg-secondary/5' : 'hover:bg-surface-container-low'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(thread.type)}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs truncate ${thread.unread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                            {thread.subject}
                          </p>
                          {(thread.unreadCount ?? 0) > 0 && (
                            <span className="ms-2 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">{thread.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-on-surface-variant/60">{formatTime(thread.lastMessageAt)}</span>
                          {thread.propertyName && (
                            <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />{thread.propertyName}
                            </span>
                          )}
                          {thread.priority === 'high' && (
                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-error/10 text-error">URGENT</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Area */}
          <div className={`flex-1 flex flex-col min-w-0 ${!showMobileThread && !selectedThread ? 'hidden lg:flex' : showMobileThread ? 'flex' : 'hidden lg:flex'}`}>
            {currentThread ? (
              <>
                {/* Thread Header */}
                <div className="flex items-center gap-3 p-4 border-b border-outline-variant/10">
                  <button
                    onClick={() => setShowMobileThread(false)}
                    className="lg:hidden p-1 rounded-lg hover:bg-surface-container-high/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
                  </button>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(currentThread.type)}`}>
                    {(() => { const Icon = getTypeIcon(currentThread.type); return <Icon className="w-4 h-4" />; })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-on-surface truncate">{currentThread.subject}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-on-surface-variant">
                        {currentThread.participants?.map((p) => p.name || p).join(', ')}
                      </p>
                      {currentThread.propertyName && (
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                          · <Building2 className="w-2.5 h-2.5" /> {currentThread.propertyName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-surface-container-high/60 transition-colors text-on-surface-variant">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface-container-high/60 transition-colors text-on-surface-variant">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                    </div>
                  )}
                  {!messagesLoading && currentMessages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <p className="text-xs text-on-surface-variant">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {currentMessages.map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="px-3 py-1.5 rounded-full bg-surface-container-high/60 text-[10px] text-on-surface-variant">
                            {msg.text}
                          </div>
                        </div>
                      );
                    }

                    const isOwner = msg.sender === 'owner';
                    return (
                      <div key={msg.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'} gap-2`}>
                        {!isOwner && (
                          <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-[10px] font-bold flex-shrink-0 mt-1">
                            {msg.senderName?.split(' ').map(n => n[0]).join('') || '?'}
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isOwner ? 'items-end' : 'items-start'}`}>
                          {!isOwner && (
                            <p className="text-[10px] text-on-surface-variant mb-1 ps-2">{msg.senderName}</p>
                          )}
                          <div className={`rounded-2xl px-4 py-2.5 ${
                            isOwner
                              ? 'bg-secondary text-white rounded-ee-md'
                              : 'bg-surface-container-low text-on-surface rounded-es-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {msg.attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/10">
                                  <File className="w-4 h-4 text-secondary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-on-surface truncate">{att.name}</p>
                                    <p className="text-[10px] text-on-surface-variant">{att.size}</p>
                                  </div>
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-surface-container-high transition-colors">
                                    <Download className="w-3.5 h-3.5 text-secondary" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${isOwner ? 'justify-end' : 'justify-start'} px-2`}>
                            <span className="text-[9px] text-on-surface-variant/50">{formatTime(msg.createdAt)}</span>
                            {isOwner && (
                              msg.read
                                ? <CheckCheck className="w-3 h-3 text-secondary" />
                                : <Check className="w-3 h-3 text-on-surface-variant/30" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-outline-variant/10">
                  <div className="flex items-end gap-2">
                    <button className="p-2 rounded-lg hover:bg-surface-container-high/60 transition-colors text-on-surface-variant flex-shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface-container-high/60 transition-colors text-on-surface-variant flex-shrink-0">
                      <Image className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-secondary/30 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                        newMessage.trim()
                          ? 'gradient-accent text-white hover:opacity-90'
                          : 'bg-surface-container-high/60 text-on-surface-variant/30'
                      }`}
                    >
                      {sendMessageMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-on-surface-variant">Select a conversation</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Choose a thread to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowNewThread(false)} />
          <div className="fixed top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 bg-surface-container-lowest rounded-2xl ambient-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-semibold text-on-surface">New Message</h3>
              <button onClick={() => setShowNewThread(false)} className="p-1 rounded-lg hover:bg-surface-container-high/60 transition-colors">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Category</label>
                <select
                  value={newThreadCategory}
                  onChange={(e) => setNewThreadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30"
                >
                  <option value="general">General Inquiry</option>
                  <option value="finance">Financial Question</option>
                  <option value="maintenance">Maintenance Request</option>
                  <option value="booking">Booking Related</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Property (optional)</label>
                <input
                  type="text"
                  value={newThreadProperty}
                  onChange={(e) => setNewThreadProperty(e.target.value)}
                  placeholder="Property ID (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-1 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Subject</label>
                <input
                  type="text"
                  value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Message</label>
                <textarea
                  value={newThreadMessage}
                  onChange={(e) => setNewThreadMessage(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-container-high/60 text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attach File
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowNewThread(false)}
                  className="px-4 py-2 rounded-lg text-xs text-on-surface-variant hover:bg-surface-container-high/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={!newThreadSubject.trim() || !newThreadMessage.trim() || createThreadMutation.isPending}
                  className="px-4 py-2 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createThreadMutation.isPending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
