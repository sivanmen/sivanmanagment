import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

type ScreeningStatus = 'VERIFIED' | 'PENDING' | 'FLAGGED' | 'NONE';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  nationalityFlag: string;
  totalStays: number;
  totalRevenue: number;
  screeningStatus: ScreeningStatus;
  lastStay: string;
}

const screeningStyles: Record<ScreeningStatus, { bg: string; text: string; icon: typeof Shield }> = {
  VERIFIED: { bg: 'bg-success/10', text: 'text-success', icon: ShieldCheck },
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', icon: Shield },
  FLAGGED: { bg: 'bg-error/10', text: 'text-error', icon: ShieldAlert },
  NONE: { bg: 'bg-outline-variant/20', text: 'text-on-surface-variant', icon: Shield },
};

const demoGuests: Guest[] = [
  {
    id: 'guest-001',
    name: 'Maria Papadopoulos',
    email: 'maria.p@gmail.com',
    phone: '+30 694 123 4567',
    nationality: 'Greece',
    nationalityFlag: '\uD83C\uDDEC\uD83C\uDDF7',
    totalStays: 5,
    totalRevenue: 8400,
    screeningStatus: 'VERIFIED',
    lastStay: '2026-04-22',
  },
  {
    id: 'guest-002',
    name: 'Hans Mueller',
    email: 'h.mueller@outlook.de',
    phone: '+49 170 987 6543',
    nationality: 'Germany',
    nationalityFlag: '\uD83C\uDDE9\uD83C\uDDEA',
    totalStays: 1,
    totalRevenue: 1890,
    screeningStatus: 'PENDING',
    lastStay: '2026-04-25',
  },
  {
    id: 'guest-003',
    name: 'Sophie Laurent',
    email: 'sophie.l@yahoo.fr',
    phone: '+33 6 12 34 56 78',
    nationality: 'France',
    nationalityFlag: '\uD83C\uDDEB\uD83C\uDDF7',
    totalStays: 2,
    totalRevenue: 3200,
    screeningStatus: 'VERIFIED',
    lastStay: '2026-04-14',
  },
  {
    id: 'guest-004',
    name: 'James Thompson',
    email: 'j.thompson@gmail.com',
    phone: '+44 7700 900123',
    nationality: 'United Kingdom',
    nationalityFlag: '\uD83C\uDDEC\uD83C\uDDE7',
    totalStays: 3,
    totalRevenue: 4500,
    screeningStatus: 'VERIFIED',
    lastStay: '2026-04-09',
  },
  {
    id: 'guest-005',
    name: 'Elena Ivanova',
    email: 'e.ivanova@mail.ru',
    phone: '+7 916 123 4567',
    nationality: 'Russia',
    nationalityFlag: '\uD83C\uDDF7\uD83C\uDDFA',
    totalStays: 0,
    totalRevenue: 0,
    screeningStatus: 'NONE',
    lastStay: '',
  },
  {
    id: 'guest-006',
    name: 'Marco Rossi',
    email: 'm.rossi@libero.it',
    phone: '+39 333 456 7890',
    nationality: 'Italy',
    nationalityFlag: '\uD83C\uDDEE\uD83C\uDDF9',
    totalStays: 2,
    totalRevenue: 3800,
    screeningStatus: 'VERIFIED',
    lastStay: '2026-04-27',
  },
  {
    id: 'guest-007',
    name: 'Anna Schmidt',
    email: 'anna.s@web.de',
    phone: '+49 176 234 5678',
    nationality: 'Germany',
    nationalityFlag: '\uD83C\uDDE9\uD83C\uDDEA',
    totalStays: 1,
    totalRevenue: 1350,
    screeningStatus: 'FLAGGED',
    lastStay: '2026-04-02',
  },
  {
    id: 'guest-008',
    name: 'David Chen',
    email: 'd.chen@gmail.com',
    phone: '+1 415 555 0123',
    nationality: 'United States',
    nationalityFlag: '\uD83C\uDDFA\uD83C\uDDF8',
    totalStays: 1,
    totalRevenue: 1100,
    screeningStatus: 'VERIFIED',
    lastStay: '2026-04-17',
  },
];

export default function GuestsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [screeningFilter, setScreeningFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');

  const nationalities = useMemo(
    () => Array.from(new Set(demoGuests.map((g) => g.nationality))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    return demoGuests.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.name.toLowerCase().includes(q) &&
          !g.email.toLowerCase().includes(q) &&
          !g.phone.includes(q)
        )
          return false;
      }
      if (screeningFilter !== 'all' && g.screeningStatus !== screeningFilter) return false;
      if (nationalityFilter !== 'all' && g.nationality !== nationalityFilter) return false;
      return true;
    });
  }, [search, screeningFilter, nationalityFilter]);

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('guests.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('guests.title')}
          </h1>
        </div>
        <button
          onClick={() => navigate('/guests/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('guests.addGuest')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={screeningFilter}
          onChange={(e) => setScreeningFilter(e.target.value)}
          className={inputClass}
        >
          <option value="all">All Screening</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="FLAGGED">Flagged</option>
          <option value="NONE">Not Screened</option>
        </select>
        <select
          value={nationalityFilter}
          onChange={(e) => setNationalityFilter(e.target.value)}
          className={inputClass}
        >
          <option value="all">All Nationalities</option>
          {nationalities.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* Guest Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Users className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            No Guests Found
          </h3>
          <p className="text-sm text-on-surface-variant">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((guest) => {
            const screening = screeningStyles[guest.screeningStatus];
            const ScreeningIcon = screening.icon;
            return (
              <div
                key={guest.id}
                onClick={() => navigate(`/guests/${guest.id}`)}
                className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group"
              >
                {/* Avatar & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-lg flex-shrink-0">
                    {guest.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{guest.name}</p>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <span>{guest.nationalityFlag}</span>
                      <span>{guest.nationality}</span>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{guest.phone}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {t('guests.totalStays')}
                    </p>
                    <p className="text-sm font-semibold text-on-surface">{guest.totalStays}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container-low">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {t('guests.totalRevenue')}
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      {'\u20AC'}{guest.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Screening Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${screening.bg} ${screening.text}`}>
                    <ScreeningIcon className="w-3 h-3" />
                    {guest.screeningStatus}
                  </span>
                  {guest.lastStay && (
                    <span className="text-[10px] text-on-surface-variant">
                      Last: {new Date(guest.lastStay).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
