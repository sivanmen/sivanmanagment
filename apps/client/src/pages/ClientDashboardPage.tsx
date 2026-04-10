import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  AlertTriangle,
  CalendarCheck,
  MapPin,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

const kpiCards = [
  {
    key: 'monthlyIncome',
    value: '$18,420',
    change: '+6.2%',
    trend: 'up' as const,
    color: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    key: 'monthlyExpenses',
    value: '$4,280',
    change: '-2.1%',
    trend: 'down' as const,
    color: 'bg-error/10',
    iconColor: 'text-error',
  },
  {
    key: 'netIncome',
    value: '$14,140',
    change: '+8.4%',
    trend: 'up' as const,
    color: 'bg-secondary/10',
    iconColor: 'text-secondary',
  },
  {
    key: 'occupancyRate',
    value: '96.7%',
    change: '+1.3%',
    trend: 'up' as const,
    color: 'bg-warning/10',
    iconColor: 'text-warning',
  },
];

const recentBookings = [
  {
    id: 'BK-2024-0891',
    guestName: 'David Cohen',
    property: 'Rothschild Residence 45',
    checkIn: 'Oct 15, 2024',
    checkOut: 'Oct 19, 2024',
    amount: '$1,280',
    status: 'confirmed',
  },
  {
    id: 'BK-2024-0888',
    guestName: 'Sarah Miller',
    property: 'Carmel Vista Suite',
    checkIn: 'Oct 18, 2024',
    checkOut: 'Oct 22, 2024',
    amount: '$960',
    status: 'confirmed',
  },
  {
    id: 'BK-2024-0885',
    guestName: 'James Wilson',
    property: 'Rothschild Residence 45',
    checkIn: 'Oct 22, 2024',
    checkOut: 'Oct 25, 2024',
    amount: '$840',
    status: 'pending',
  },
  {
    id: 'BK-2024-0882',
    guestName: 'Maya Levi',
    property: 'Jaffa Heritage Loft',
    checkIn: 'Oct 24, 2024',
    checkOut: 'Oct 28, 2024',
    amount: '$1,120',
    status: 'confirmed',
  },
];

const pendingApprovals = [
  {
    title: 'HVAC Maintenance - Rothschild 45',
    description: 'Annual HVAC servicing and filter replacement. Vendor: CoolTech Ltd.',
    cost: '$650',
    urgency: 'medium',
    daysAgo: 2,
  },
  {
    title: 'Plumbing Repair - Carmel Vista',
    description: 'Bathroom faucet replacement and pipe inspection required.',
    cost: '$320',
    urgency: 'high',
    daysAgo: 1,
  },
];

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const firstName = user?.firstName || 'Owner';
  const propertyScore = 87;
  const loyaltyTier = 'Gold';
  const loyaltyStars = 4;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('dashboard.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('dashboard.welcomeBack')}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Loyalty Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-fixed ambient-shadow">
            <Award className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-[10px] text-secondary/70 uppercase tracking-wider font-semibold">{t('dashboard.loyaltyTier')}</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-headline font-bold text-secondary">{loyaltyTier}</span>
                <div className="flex items-center gap-0.5 ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < loyaltyStars ? 'text-warning fill-warning' : 'text-outline-variant'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.key}
            className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {t(`dashboard.${card.key}`)}
              </p>
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                {card.trend === 'up' ? (
                  <TrendingUp className={`w-4 h-4 ${card.iconColor}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${card.iconColor}`} />
                )}
              </div>
            </div>
            <p className="font-headline text-2xl font-bold text-on-surface mb-1">
              {card.value}
            </p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${card.trend === 'up' ? 'text-success' : 'text-error'}`}>
                {card.change}
              </span>
              <span className="text-xs text-on-surface-variant">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Property Score + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Property Score */}
        <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow flex flex-col items-center justify-center">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            {t('dashboard.propertyScore')}
          </p>
          {/* Score gauge */}
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e7e8e9"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(propertyScore / 100) * 314} 314`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6b38d4" />
                  <stop offset="100%" stopColor="#8455ef" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-4xl font-bold text-on-surface">{propertyScore}</span>
              <span className="text-xs text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-on-surface-variant">Excellent Standing</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.pendingApprovals')}
            </h3>
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning">
              {pendingApprovals.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingApprovals.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-on-surface">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{item.description}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.urgency === 'high'
                        ? 'bg-error/10 text-error'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">{item.cost}</span>
                    <span>{item.daysAgo} day{item.daysAgo > 1 ? 's' : ''} ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-error bg-error/5 hover:bg-error/10 transition-colors">
                      Decline
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-secondary gradient-accent hover:opacity-90 transition-opacity">
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-secondary" />
            <h3 className="font-headline text-lg font-semibold text-on-surface">
              {t('dashboard.recentBookings')}
            </h3>
          </div>
          <button className="flex items-center gap-1 text-sm text-secondary font-medium hover:text-secondary-container transition-colors">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-container-high">
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Booking ID</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Guest</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Property</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Check-in</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Check-out</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3">
                    <span className="text-xs font-mono font-medium text-secondary">{booking.id}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-on-surface-variant" />
                      </div>
                      <span className="text-sm text-on-surface font-medium">{booking.guestName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <MapPin className="w-3 h-3" />
                      <span>{booking.property}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <span className="text-xs text-on-surface-variant">{booking.checkIn}</span>
                  </td>
                  <td className="py-3 px-3 hidden lg:table-cell">
                    <span className="text-xs text-on-surface-variant">{booking.checkOut}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm font-semibold text-on-surface">{booking.amount}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === 'confirmed'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {booking.status === 'confirmed' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
