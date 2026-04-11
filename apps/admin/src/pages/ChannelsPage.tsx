import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Link2,
  Unlink,
  ExternalLink,
  CheckCircle,
  XCircle,
  Hash,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

type ConnectionStatus = 'connected' | 'disconnected';

interface Channel {
  id: string;
  name: string;
  logo: string;
  status: ConnectionStatus;
  lastSync: string | null;
  listingCount: number;
  color: string;
  syncErrors: number;
}

const demoChannels: Channel[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: 'A',
    status: 'connected',
    lastSync: '2026-04-11T08:30:00Z',
    listingCount: 12,
    color: '#FF5A5F',
    syncErrors: 0,
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: 'B',
    status: 'connected',
    lastSync: '2026-04-11T07:45:00Z',
    listingCount: 8,
    color: '#003580',
    syncErrors: 1,
  },
  {
    id: 'vrbo',
    name: 'VRBO',
    logo: 'V',
    status: 'disconnected',
    lastSync: null,
    listingCount: 0,
    color: '#3B5998',
    syncErrors: 0,
  },
  {
    id: 'direct',
    name: 'Direct Bookings',
    logo: 'D',
    status: 'connected',
    lastSync: '2026-04-11T09:00:00Z',
    listingCount: 15,
    color: '#6b38d4',
    syncErrors: 0,
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChannelsPage() {
  const { t } = useTranslation();
  const [channels, setChannels] = useState(demoChannels);
  const [syncing, setSyncing] = useState<string | null>(null);

  const connected = channels.filter((c) => c.status === 'connected').length;
  const totalListings = channels.reduce((sum, c) => sum + c.listingCount, 0);
  const totalErrors = channels.reduce((sum, c) => sum + c.syncErrors, 0);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setChannels((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, lastSync: new Date().toISOString(), syncErrors: 0 }
            : c,
        ),
      );
      setSyncing(null);
      toast.success(`${channels.find((c) => c.id === id)?.name} synced successfully`);
    }, 1500);
  };

  const handleToggleConnection = (id: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'connected' ? 'disconnected' : 'connected',
              lastSync: c.status === 'disconnected' ? new Date().toISOString() : c.lastSync,
              listingCount: c.status === 'disconnected' ? 5 : 0,
            }
          : c,
      ),
    );
    const channel = channels.find((c) => c.id === id);
    if (channel) {
      toast.success(
        channel.status === 'connected'
          ? `${channel.name} disconnected`
          : `${channel.name} connected`,
      );
    }
  };

  const stats = [
    {
      label: t('channels.connectedChannels'),
      value: connected,
      icon: Wifi,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: t('channels.totalListings'),
      value: totalListings,
      icon: Hash,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: t('channels.totalChannels'),
      value: channels.length,
      icon: Link2,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: t('channels.syncErrors'),
      value: totalErrors,
      icon: XCircle,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('channels.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('channels.title')}
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {stat.label}
              </p>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="font-headline text-xl font-bold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow hover:shadow-ambient-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: channel.color }}
                >
                  {channel.logo}
                </div>
                <div>
                  <h3 className="font-headline text-lg font-semibold text-on-surface">
                    {channel.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {channel.status === 'connected' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs text-success font-medium">
                          {t('channels.connected')}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-error" />
                        <span className="text-xs text-error font-medium">
                          {t('channels.disconnected')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggleConnection(channel.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  channel.status === 'connected'
                    ? 'bg-error/10 text-error hover:bg-error/20'
                    : 'bg-success/10 text-success hover:bg-success/20'
                }`}
              >
                {channel.status === 'connected' ? (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    {t('channels.disconnect')}
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    {t('channels.connect')}
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('channels.listings')}
                </p>
                <p className="font-headline text-lg font-bold text-on-surface">
                  {channel.listingCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                  {t('channels.lastSync')}
                </p>
                <p className="text-xs font-medium text-on-surface">
                  {channel.lastSync ? formatDate(channel.lastSync) : '--'}
                </p>
              </div>
            </div>

            {channel.syncErrors > 0 && (
              <div className="p-3 rounded-lg bg-error/5 border border-error/10 mb-4">
                <p className="text-xs text-error font-medium">
                  {channel.syncErrors} {t('channels.syncErrorsLabel')}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {channel.status === 'connected' && (
                <button
                  onClick={() => handleSync(channel.id)}
                  disabled={syncing === channel.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncing === channel.id ? 'animate-spin' : ''}`}
                  />
                  {syncing === channel.id ? t('channels.syncing') : t('channels.syncNow')}
                </button>
              )}
              <button className="flex items-center justify-center p-2.5 rounded-lg text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
