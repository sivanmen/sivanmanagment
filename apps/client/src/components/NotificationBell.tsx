import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'New Booking',
    message: 'New booking confirmed for Villa Elounda - 5 nights starting Jun 15',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    read: false,
    link: '/bookings',
  },
  {
    id: '2',
    type: 'info',
    title: 'Monthly Statement',
    message: 'Your March 2026 owner statement is ready for review',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    link: '/statements',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Expense Approval',
    message: 'New expense of €320 pending your approval for plumbing repair',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false,
    link: '/approvals',
  },
  {
    id: '4',
    type: 'success',
    title: 'Review Received',
    message: '5-star review from guest at Apt. Chania Harbor',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: true,
    link: '/properties',
  },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeIcons = { info: Info, warning: AlertTriangle, error: AlertCircle, success: CheckCircle };
const typeColors = {
  info: 'text-blue-400 bg-blue-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  error: 'text-red-400 bg-red-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 end-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-2 w-96 rounded-2xl bg-surface border border-border shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-10 h-10 text-on-surface-variant/30 mb-3" />
                <p className="text-sm text-on-surface-variant">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`relative flex gap-3 px-4 py-3 border-b border-border/50 hover:bg-surface-variant/30 cursor-pointer transition-colors group ${
                      !notification.read ? 'bg-secondary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {!notification.read && (
                      <div className="absolute start-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-secondary" />
                    )}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[notification.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-on-surface' : 'font-medium text-on-surface/80'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap mt-0.5">
                          {timeAgo(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{notification.message}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="p-1 rounded-lg hover:bg-surface-variant" title="Mark as read">
                          <Check className="w-3.5 h-3.5 text-on-surface-variant" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }} className="p-1 rounded-lg hover:bg-surface-variant" title="Dismiss">
                        <X className="w-3.5 h-3.5 text-on-surface-variant" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
