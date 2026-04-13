import { useMemo } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import {
  Bell,
  BellOff,
  Calendar,
  DollarSign,
  Wrench,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Check,
  Loader2,
} from 'lucide-react';

type NotificationType = 'booking' | 'payment' | 'maintenance' | 'message' | 'alert' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  booking: { icon: Calendar, color: 'text-secondary', bgColor: 'bg-secondary/10' },
  payment: { icon: DollarSign, color: 'text-success', bgColor: 'bg-success/10' },
  maintenance: { icon: Wrench, color: 'text-warning', bgColor: 'bg-warning/10' },
  message: { icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  alert: { icon: AlertTriangle, color: 'text-error', bgColor: 'bg-error/10' },
  system: { icon: CheckCircle, color: 'text-on-surface-variant', bgColor: 'bg-outline-variant/20' },
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterRead, setFilterRead] = useState<'all' | 'unread'>('all');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

  // Fetch notifications from API
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data.data as Notification[];
    },
  });

  const notifications = notificationsData ?? [];

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterRead === 'unread' && n.read) return false;
      if (filterType !== 'all' && n.type !== filterType) return false;
      return true;
    });
  }, [notifications, filterRead, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleToggleRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('notifications.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('notifications.title')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{t('notifications.markAllRead')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterRead('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRead === 'all'
                ? 'gradient-accent text-white'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {t('notifications.all')}
          </button>
          <button
            onClick={() => setFilterRead('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterRead === 'unread'
                ? 'gradient-accent text-white'
                : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {t('notifications.unreadOnly')}
          </button>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
          className={inputClass}
        >
          <option value="all">{t('notifications.allTypes')}</option>
          <option value="booking">{t('notifications.typeBooking')}</option>
          <option value="payment">{t('notifications.typePayment')}</option>
          <option value="maintenance">{t('notifications.typeMaintenance')}</option>
          <option value="message">{t('notifications.typeMessage')}</option>
          <option value="alert">{t('notifications.typeAlert')}</option>
          <option value="system">{t('notifications.typeSystem')}</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      )}

      {/* Notification List */}
      {!isLoading && (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            return (
              <div
                key={notification.id}
                onClick={() => handleToggleRead(notification.id)}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                  notification.read
                    ? 'bg-surface-container-lowest ambient-shadow'
                    : 'bg-secondary/5 border border-secondary/10 shadow-ambient-lg'
                } hover:bg-surface-container-low`}
              >
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-sm font-semibold text-on-surface truncate ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{notification.message}</p>
                    </div>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap flex-shrink-0">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
