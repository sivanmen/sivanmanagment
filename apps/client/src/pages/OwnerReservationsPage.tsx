import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarHeart,
  Users,
  Home,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  CalendarDays,
  ArrowRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type ReservationType = 'OWNER_STAY' | 'FRIENDS_FAMILY';
type ReservationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface OwnerReservation {
  id: string;
  propertyId: string;
  propertyName: string;
  type: ReservationType;
  guestName?: string;
  guestRelation?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  notes?: string;
  status: ReservationStatus;
  createdAt: string;
}

const statusConfig: Record<ReservationStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING_APPROVAL: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-success/10 text-success', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-error/10 text-error', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-outline-variant/20 text-on-surface-variant', icon: Ban },
};

const demoProperties = [
  { id: 'prop-1', name: 'Aegean Sunset Villa' },
  { id: 'prop-2', name: 'Heraklion Harbor Suite' },
  { id: 'prop-3', name: 'Chania Old Town Residence' },
];

const demoReservations: OwnerReservation[] = [
  {
    id: 'or-1', propertyId: 'prop-1', propertyName: 'Aegean Sunset Villa',
    type: 'OWNER_STAY', checkIn: '2026-05-10', checkOut: '2026-05-17', nights: 7,
    notes: 'Summer vacation with family', status: 'APPROVED', createdAt: '2026-04-01',
  },
  {
    id: 'or-2', propertyId: 'prop-2', propertyName: 'Heraklion Harbor Suite',
    type: 'FRIENDS_FAMILY', guestName: 'Nikos Papadopoulos', guestRelation: 'Brother',
    checkIn: '2026-06-01', checkOut: '2026-06-05', nights: 4,
    notes: 'Brother visiting from Athens', status: 'PENDING_APPROVAL', createdAt: '2026-04-05',
  },
  {
    id: 'or-3', propertyId: 'prop-3', propertyName: 'Chania Old Town Residence',
    type: 'OWNER_STAY', checkIn: '2026-04-20', checkOut: '2026-04-25', nights: 5,
    status: 'APPROVED', createdAt: '2026-03-28',
  },
  {
    id: 'or-4', propertyId: 'prop-1', propertyName: 'Aegean Sunset Villa',
    type: 'FRIENDS_FAMILY', guestName: 'Eleni Alexiou', guestRelation: 'Friend',
    checkIn: '2026-07-01', checkOut: '2026-07-08', nights: 7,
    status: 'REJECTED', createdAt: '2026-04-02',
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OwnerReservationsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReservationType>('OWNER_STAY');
  const [reservations, setReservations] = useState(demoReservations);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formProperty, setFormProperty] = useState('prop-1');
  const [formCheckIn, setFormCheckIn] = useState('');
  const [formCheckOut, setFormCheckOut] = useState('');
  const [formGuestName, setFormGuestName] = useState('');
  const [formGuestRelation, setFormGuestRelation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => r.type === activeTab);
  }, [reservations, activeTab]);

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === 'PENDING_APPROVAL').length,
    approved: reservations.filter((r) => r.status === 'APPROVED').length,
    totalNights: reservations.filter((r) => r.status === 'APPROVED').reduce((sum, r) => sum + r.nights, 0),
  };

  const handleSubmit = () => {
    if (!formCheckIn || !formCheckOut) {
      toast.error(t('ownerReservations.datesRequired'));
      return;
    }
    if (activeTab === 'FRIENDS_FAMILY' && !formGuestName) {
      toast.error(t('ownerReservations.guestNameRequired'));
      return;
    }
    const checkInDate = new Date(formCheckIn);
    const checkOutDate = new Date(formCheckOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const property = demoProperties.find((p) => p.id === formProperty);

    const newRes: OwnerReservation = {
      id: `or-${Date.now()}`,
      propertyId: formProperty,
      propertyName: property?.name || '',
      type: activeTab,
      guestName: activeTab === 'FRIENDS_FAMILY' ? formGuestName : undefined,
      guestRelation: activeTab === 'FRIENDS_FAMILY' ? formGuestRelation : undefined,
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      nights,
      notes: formNotes || undefined,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setReservations([newRes, ...reservations]);
    setShowForm(false);
    setFormCheckIn('');
    setFormCheckOut('');
    setFormGuestName('');
    setFormGuestRelation('');
    setFormNotes('');
    toast.success(t('ownerReservations.created'));
  };

  const handleCancel = (id: string) => {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: 'CANCELLED' as ReservationStatus } : r));
    toast.success(t('ownerReservations.cancelled'));
  };

  const tabs = [
    { key: 'OWNER_STAY' as ReservationType, label: t('ownerReservations.bookForMyself'), icon: Home },
    { key: 'FRIENDS_FAMILY' as ReservationType, label: t('ownerReservations.bookForFF'), icon: Users },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('ownerReservations.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('ownerReservations.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('ownerReservations.newReservation')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
            <CalendarDays className="w-4 h-4 text-secondary" />
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.total}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('ownerReservations.totalReservations')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.pending}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('ownerReservations.pendingApproval')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.approved}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('ownerReservations.approved')}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
            <CalendarHeart className="w-4 h-4 text-secondary" />
          </div>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.totalNights}</p>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t('ownerReservations.blockedNights')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'gradient-accent text-on-secondary'
                  : 'bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow border border-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              {activeTab === 'OWNER_STAY' ? t('ownerReservations.bookForMyself') : t('ownerReservations.bookForFF')}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-surface-container-high">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('bookings.property')}</label>
              <select value={formProperty} onChange={(e) => setFormProperty(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/30">
                {demoProperties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('bookings.checkIn')}</label>
              <input type="date" value={formCheckIn} onChange={(e) => setFormCheckIn(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('bookings.checkOut')}</label>
              <input type="date" value={formCheckOut} onChange={(e) => setFormCheckOut(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
            {activeTab === 'FRIENDS_FAMILY' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('ownerReservations.guestName')} *</label>
                  <input type="text" value={formGuestName} onChange={(e) => setFormGuestName(e.target.value)} placeholder={t('ownerReservations.guestNamePlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('ownerReservations.guestRelation')}</label>
                  <input type="text" value={formGuestRelation} onChange={(e) => setFormGuestRelation(e.target.value)} placeholder={t('ownerReservations.guestRelationPlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{t('ownerReservations.notes')}</label>
              <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder={t('ownerReservations.notesPlaceholder')} className="w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface resize-none placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-high">{t('common.cancel')}</button>
            <button onClick={handleSubmit} className="px-5 py-2 rounded-lg text-sm font-medium text-white gradient-accent">{t('ownerReservations.submitRequest')}</button>
          </div>
        </div>
      )}

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.map((res) => {
          const cfg = statusConfig[res.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={res.id} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-secondary" />
                    <span className="font-headline font-semibold text-on-surface">{res.propertyName}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  {res.type === 'FRIENDS_FAMILY' && res.guestName && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-sm text-on-surface">{res.guestName}</span>
                      {res.guestRelation && <span className="text-xs text-on-surface-variant">({res.guestRelation})</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formatDate(res.checkIn)}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{formatDate(res.checkOut)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-semibold">
                      {res.nights} {res.nights === 1 ? 'night' : 'nights'}
                    </span>
                  </div>
                  {res.notes && (
                    <p className="text-xs text-on-surface-variant mt-2 italic">{res.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(res.status === 'PENDING_APPROVAL' || res.status === 'APPROVED') && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-error bg-error/10 hover:bg-error/20 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredReservations.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
            <CalendarHeart className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium">{t('ownerReservations.noReservations')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
