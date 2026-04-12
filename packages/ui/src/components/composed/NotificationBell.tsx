import * as React from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { cn } from '../../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-[#6b38d4] bg-[#e9ddff]',
  warning: 'text-[#ed6c02] bg-[#fff3e0]',
  success: 'text-[#2e7d32] bg-[#e8f5e9]',
  error: 'text-[#ba1a1a] bg-[#ffdad6]',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  className,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#46464c] transition-colors hover:bg-[#f3f4f5]"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-[16px] bg-white shadow-xl ring-1 ring-[#c7c5cd]/20 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#c7c5cd]/20 px-4 py-3">
            <h3 className="font-headline text-sm font-semibold text-[#191c1d]">
              Notifications
            </h3>
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                }}
                className="inline-flex items-center gap-1 text-xs text-[#6b38d4] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f5]">
                  <Inbox className="h-6 w-6 text-[#46464c]" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-[#191c1d]">No notifications</p>
                <p className="text-xs text-[#46464c]">You&apos;re all caught up</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => {
                      onNotificationClick?.(notification);
                      if (!notification.read) {
                        onMarkAsRead?.(notification.id);
                      }
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f3f4f5]',
                      !notification.read && 'bg-[#f8f5ff]',
                    )}
                  >
                    {/* Type icon */}
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        typeColors[notification.type],
                      )}
                    >
                      <TypeIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm',
                          notification.read
                            ? 'font-normal text-[#46464c]'
                            : 'font-medium text-[#191c1d]',
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#46464c]">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[#78767e]">
                        {timeAgo(notification.timestamp)}
                      </p>
                    </div>

                    {/* Unread dot / mark read */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead?.(notification.id);
                        }}
                        className="mt-1 shrink-0 rounded-full p-1 text-[#6b38d4] hover:bg-[#e9ddff]"
                        aria-label="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
