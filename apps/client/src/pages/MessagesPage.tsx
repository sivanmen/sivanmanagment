import { useState } from 'react';
import {
  MessageSquare, Send, Search, Paperclip, Clock,
  Check, CheckCheck, User, Building2,
} from 'lucide-react';

type Thread = {
  id: string;
  subject: string;
  lastMessage: string;
  date: string;
  unread: boolean;
  type: 'admin' | 'maintenance' | 'booking' | 'general';
  property?: string;
};

type Message = {
  id: string;
  sender: 'owner' | 'admin';
  senderName: string;
  text: string;
  time: string;
  read: boolean;
};

const demoThreads: Thread[] = [
  {
    id: 't1',
    subject: 'March Statement Ready',
    lastMessage: 'Your March financial statement is now available for download.',
    date: '2026-04-10',
    unread: true,
    type: 'admin',
  },
  {
    id: 't2',
    subject: 'Villa Athena - Plumbing Issue Update',
    lastMessage: 'The plumber replaced the faucet cartridge. All fixed now.',
    date: '2026-04-08',
    unread: false,
    type: 'maintenance',
    property: 'Villa Athena',
  },
  {
    id: 't3',
    subject: 'New Booking - Schmidt Family',
    lastMessage: 'A new 10-night booking confirmed for July 5-15. Revenue: €3,200.',
    date: '2026-04-05',
    unread: true,
    type: 'booking',
    property: 'Villa Athena',
  },
  {
    id: 't4',
    subject: 'Cleaning Schedule Update',
    lastMessage: 'We updated the cleaning schedule for April. Please review attached.',
    date: '2026-04-02',
    unread: false,
    type: 'admin',
  },
  {
    id: 't5',
    subject: 'Sunset Suite - Guest Checkout Review',
    lastMessage: 'Guest left a 5-star review! Property is in great condition.',
    date: '2026-03-28',
    unread: false,
    type: 'booking',
    property: 'Sunset Suite',
  },
  {
    id: 't6',
    subject: 'Insurance Renewal Reminder',
    lastMessage: 'Your property insurance expires on May 15. Please renew.',
    date: '2026-03-25',
    unread: false,
    type: 'general',
  },
];

const demoMessages: Message[] = [
  {
    id: 'm1',
    sender: 'admin',
    senderName: 'Sivan Management',
    text: 'Hi David, your March financial statement is now ready. Total revenue: €4,250 | Net to you: €3,612.50 after management fees. You can download the full PDF from the Statements page.',
    time: '10:30 AM',
    read: true,
  },
  {
    id: 'm2',
    sender: 'owner',
    senderName: 'You',
    text: 'Thanks! Can you also send me the breakdown per property?',
    time: '10:45 AM',
    read: true,
  },
  {
    id: 'm3',
    sender: 'admin',
    senderName: 'Sivan Management',
    text: 'Of course! Villa Athena: €2,800 (3 bookings) | Sunset Suite: €1,450 (2 bookings). The detailed breakdown is in the PDF. Let me know if you need anything else!',
    time: '11:02 AM',
    read: true,
  },
  {
    id: 'm4',
    sender: 'owner',
    senderName: 'You',
    text: 'Perfect, thank you. Also, any update on the plumbing issue at Villa Athena?',
    time: '11:15 AM',
    read: true,
  },
  {
    id: 'm5',
    sender: 'admin',
    senderName: 'Sivan Management',
    text: 'Yes! The plumber came yesterday and fixed it. Replaced the faucet cartridge — cost was €85. I added it to the April expenses. The next guest checks in tomorrow, everything is ready.',
    time: '11:30 AM',
    read: false,
  },
];

const typeIcons: Record<string, { icon: typeof MessageSquare; color: string }> = {
  admin: { icon: User, color: 'bg-secondary/10 text-secondary' },
  maintenance: { icon: Building2, color: 'bg-amber-500/10 text-amber-400' },
  booking: { icon: Check, color: 'bg-emerald-500/10 text-emerald-400' },
  general: { icon: MessageSquare, color: 'bg-blue-500/10 text-blue-400' },
};

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState<string>('t1');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = demoThreads.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Messages</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Communicate with your property management team
        </p>
      </div>

      <div className="flex rounded-xl bg-surface-container-lowest border border-outline/5 ambient-shadow overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Thread List */}
        <div className="w-80 border-r border-outline/5 flex flex-col flex-shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-outline/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.map((thread) => {
              const typeInfo = typeIcons[thread.type];
              const TypeIcon = typeInfo.icon;
              return (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full p-3 text-left border-b border-outline/5 transition-colors ${
                    selectedThread === thread.id
                      ? 'bg-secondary/5'
                      : 'hover:bg-surface-container-low/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${thread.unread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {thread.subject}
                        </p>
                        {thread.unread && (
                          <span className="w-2 h-2 rounded-full bg-secondary flex-shrink-0 ml-2" />
                        )}
                      </div>
                      {thread.property && (
                        <p className="text-[10px] text-secondary mt-0.5">{thread.property}</p>
                      )}
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{thread.lastMessage}</p>
                      <p className="text-[10px] text-on-surface-variant/50 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {thread.date}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col">
          {/* Thread Header */}
          <div className="p-4 border-b border-outline/5">
            <h3 className="text-sm font-semibold text-on-surface">
              {demoThreads.find((t) => t.id === selectedThread)?.subject}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              with Sivan Management Team
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {demoMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'owner'
                      ? 'bg-secondary/20 text-on-surface rounded-br-md'
                      : 'bg-surface-container-low text-on-surface rounded-bl-md'
                  }`}
                >
                  <p className="text-xs font-semibold text-on-surface-variant mb-1">
                    {msg.senderName}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[10px] text-on-surface-variant">{msg.time}</span>
                    {msg.sender === 'owner' && (
                      msg.read
                        ? <CheckCheck className="w-3 h-3 text-blue-400" />
                        : <Check className="w-3 h-3 text-on-surface-variant" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-outline/5">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
              <button
                onClick={handleSend}
                className="p-2.5 rounded-lg gradient-accent text-white hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
