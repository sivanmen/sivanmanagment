import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  Clock,
  Check,
  CheckCheck,
  User,
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
  Star,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────
type ThreadType = 'admin' | 'maintenance' | 'booking' | 'finance' | 'general';

interface Thread {
  id: string;
  subject: string;
  lastMessage: string;
  date: string;
  time: string;
  unread: boolean;
  unreadCount: number;
  type: ThreadType;
  property?: string;
  participants: string[];
  priority?: 'high' | 'normal' | 'low';
}

interface Message {
  id: string;
  sender: 'owner' | 'admin' | 'system';
  senderName: string;
  senderAvatar?: string;
  text: string;
  time: string;
  date: string;
  read: boolean;
  attachments?: { name: string; type: string; size: string; url: string }[];
  replyTo?: string;
}

// ── Demo Data ────────────────────────────────────
const demoThreads: Thread[] = [
  {
    id: 't1',
    subject: 'March Financial Statement Ready',
    lastMessage: 'Your March financial statement is now available. Net payout: €6,450.',
    date: '2026-04-10',
    time: '14:32',
    unread: true,
    unreadCount: 2,
    type: 'finance',
    participants: ['Sivan Admin', 'Elena Papadopoulou'],
    priority: 'normal',
  },
  {
    id: 't2',
    subject: 'Aegean Sunset Villa - AC Unit Repair',
    lastMessage: 'The technician replaced the compressor. AC now works perfectly in all rooms.',
    date: '2026-04-08',
    time: '11:15',
    unread: false,
    unreadCount: 0,
    type: 'maintenance',
    property: 'Aegean Sunset Villa',
    participants: ['Nikos Stavropoulos', 'Elena Papadopoulou'],
    priority: 'high',
  },
  {
    id: 't3',
    subject: 'New Booking - Klaus Weber (Apr 18-25)',
    lastMessage: 'Confirmed! Guest arrives from Munich, 2 adults + 2 children. Airport transfer arranged.',
    date: '2026-04-06',
    time: '09:45',
    unread: true,
    unreadCount: 1,
    type: 'booking',
    property: 'Aegean Sunset Villa',
    participants: ['Sivan Admin'],
    priority: 'normal',
  },
  {
    id: 't4',
    subject: 'Property Insurance Renewal',
    lastMessage: 'Please review and approve the insurance renewal documents attached.',
    date: '2026-04-04',
    time: '16:20',
    unread: false,
    unreadCount: 0,
    type: 'admin',
    participants: ['Sivan Admin'],
    priority: 'normal',
  },
  {
    id: 't5',
    subject: 'Summer Rate Adjustment Proposal',
    lastMessage: 'Based on market analysis, I recommend increasing rates by 15% for Jul-Aug. See attached comparison.',
    date: '2026-04-02',
    time: '10:30',
    unread: false,
    unreadCount: 0,
    type: 'finance',
    participants: ['Elena Papadopoulou'],
    priority: 'high',
  },
  {
    id: 't6',
    subject: 'Venetian Harbor Loft - Guest Review Response',
    lastMessage: 'I drafted a response for the 4-star review. Please review before I post it.',
    date: '2026-03-30',
    time: '13:00',
    unread: false,
    unreadCount: 0,
    type: 'general',
    property: 'Venetian Harbor Loft',
    participants: ['Sivan Admin'],
    priority: 'low',
  },
  {
    id: 't7',
    subject: 'Pool Maintenance Schedule Update',
    lastMessage: 'New pool maintenance schedule starts May 1st. Twice weekly instead of once.',
    date: '2026-03-28',
    time: '08:15',
    unread: false,
    unreadCount: 0,
    type: 'maintenance',
    property: 'Aegean Sunset Villa',
    participants: ['Nikos Stavropoulos'],
    priority: 'normal',
  },
  {
    id: 't8',
    subject: 'Tax Documentation Request',
    lastMessage: 'We need your updated tax ID for the annual reporting. Please upload at your earliest convenience.',
    date: '2026-03-25',
    time: '11:00',
    unread: false,
    unreadCount: 0,
    type: 'admin',
    participants: ['Sivan Admin'],
    priority: 'normal',
  },
];

const demoMessages: Record<string, Message[]> = {
  t1: [
    {
      id: 'm1', sender: 'admin', senderName: 'Sivan Admin', text: 'Hi David, your March financial statement has been generated.', time: '14:00', date: '2026-04-10', read: true,
    },
    {
      id: 'm2', sender: 'admin', senderName: 'Elena Papadopoulou', text: 'Here are the key highlights:\n\n• Total income: €12,400\n• Expenses: €3,200\n• Management fee: €3,100\n• Net payout: €6,450\n\nThe payout will be transferred to your bank account within 3 business days.', time: '14:15', date: '2026-04-10', read: true,
      attachments: [
        { name: 'March_2026_Statement.pdf', type: 'pdf', size: '245 KB', url: '#' },
        { name: 'Expense_Receipts.zip', type: 'zip', size: '1.2 MB', url: '#' },
      ],
    },
    {
      id: 'm3', sender: 'owner', senderName: 'David Cohen', text: 'Thank you! The revenue looks great. Can you explain the AC repair expense of €280?', time: '14:28', date: '2026-04-10', read: true,
    },
    {
      id: 'm4', sender: 'admin', senderName: 'Elena Papadopoulou', text: 'The AC unit in bedroom 2 had a faulty compressor. We got 3 quotes and went with the most reasonable option. The repair receipt is in the attached ZIP file.', time: '14:32', date: '2026-04-10', read: false,
    },
  ],
  t2: [
    {
      id: 'm5', sender: 'system', senderName: 'System', text: '🔧 Maintenance request created: AC not cooling in bedroom 2 at Aegean Sunset Villa', time: '08:00', date: '2026-04-06', read: true,
    },
    {
      id: 'm6', sender: 'admin', senderName: 'Nikos Stavropoulos', text: 'I\'ll check this today. Scheduling a technician for tomorrow morning.', time: '09:30', date: '2026-04-06', read: true,
    },
    {
      id: 'm7', sender: 'admin', senderName: 'Nikos Stavropoulos', text: 'Technician diagnosed the issue — faulty compressor. Replacement part needed. Estimated cost: €280. Shall I proceed?', time: '14:00', date: '2026-04-07', read: true,
    },
    {
      id: 'm8', sender: 'owner', senderName: 'David Cohen', text: 'Yes, go ahead. Please make sure it\'s fixed before the next guest arrives on the 18th.', time: '15:30', date: '2026-04-07', read: true,
    },
    {
      id: 'm9', sender: 'admin', senderName: 'Nikos Stavropoulos', text: 'The technician replaced the compressor. AC now works perfectly in all rooms. Here\'s the receipt.', time: '11:15', date: '2026-04-08', read: true,
      attachments: [
        { name: 'AC_Repair_Receipt.pdf', type: 'pdf', size: '89 KB', url: '#' },
      ],
    },
  ],
  t3: [
    {
      id: 'm10', sender: 'system', senderName: 'System', text: '📅 New booking confirmed: Klaus Weber, Apr 18-25, €1,995 via Airbnb', time: '09:00', date: '2026-04-06', read: true,
    },
    {
      id: 'm11', sender: 'admin', senderName: 'Sivan Admin', text: 'Great news! New booking for your Aegean Sunset Villa.\n\nGuest: Klaus Weber (Munich, Germany)\nDates: April 18-25 (7 nights)\nGuests: 2 adults + 2 children\nTotal: €1,995\nSource: Airbnb\n\nAirport transfer has been arranged for April 18 at 14:00.', time: '09:45', date: '2026-04-06', read: false,
    },
  ],
};

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

export default function MessagesPage() {
  const { t } = useTranslation();
  const [selectedThread, setSelectedThread] = useState<string | null>('t1');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ThreadType | 'all'>('all');
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredThreads = demoThreads.filter((th) => {
    const matchesSearch = searchQuery === '' ||
      th.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      th.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || th.type === filterType;
    return matchesSearch && matchesType;
  });

  const currentThread = demoThreads.find((t) => t.id === selectedThread);
  const currentMessages = selectedThread ? (demoMessages[selectedThread] || []) : [];

  const totalUnread = demoThreads.reduce((s, t) => s + t.unreadCount, 0);

  const handleSelectThread = (id: string) => {
    setSelectedThread(id);
    setShowMobileThread(true);
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    // In a real app, this would send via API
    setNewMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread]);

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
                          {thread.unreadCount > 0 && (
                            <span className="ms-2 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">{thread.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-on-surface-variant/60">{thread.time}</span>
                          {thread.property && (
                            <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />{thread.property}
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
                      <p className="text-[10px] text-on-surface-variant">{currentThread.participants.join(', ')}</p>
                      {currentThread.property && (
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                          · <Building2 className="w-2.5 h-2.5" /> {currentThread.property}
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
                            {msg.senderName.split(' ').map(n => n[0]).join('')}
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
                                  <button className="p-1 rounded hover:bg-surface-container-high transition-colors">
                                    <Download className="w-3.5 h-3.5 text-secondary" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${isOwner ? 'justify-end' : 'justify-start'} px-2`}>
                            <span className="text-[9px] text-on-surface-variant/50">{msg.time}</span>
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
                      disabled={!newMessage.trim()}
                      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                        newMessage.trim()
                          ? 'gradient-accent text-white hover:opacity-90'
                          : 'bg-surface-container-high/60 text-on-surface-variant/30'
                      }`}
                    >
                      <Send className="w-4 h-4" />
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
                <select className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30">
                  <option value="general">General Inquiry</option>
                  <option value="finance">Financial Question</option>
                  <option value="maintenance">Maintenance Request</option>
                  <option value="booking">Booking Related</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Property (optional)</label>
                <select className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30">
                  <option value="">All Properties</option>
                  <option value="1">Aegean Sunset Villa</option>
                  <option value="2">Venetian Harbor Loft</option>
                  <option value="3">Spinalonga View Suite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface outline-none focus:ring-1 focus:ring-secondary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Message</label>
                <textarea
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
                <button className="px-4 py-2 rounded-lg gradient-accent text-white text-xs font-medium hover:opacity-90 transition-opacity">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
