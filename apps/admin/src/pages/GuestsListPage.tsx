import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

type ScreeningStatus = 'APPROVED' | 'PENDING' | 'FLAGGED' | 'REJECTED';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  totalStays: number;
  totalRevenue: number | string;
  screeningStatus: ScreeningStatus | null;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  _count?: {
    bookings: number;
    screenings: number;
  };
}

interface GuestsResponse {
  data: Guest[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

const screeningStyles: Record<ScreeningStatus | 'NONE', { bg: string; text: string; icon: typeof Shield }> = {
  APPROVED: { bg: 'bg-success/10', text: 'text-success', icon: ShieldCheck },
  PENDING: { bg: 'bg-warning/10', text: 'text-warning', icon: Shield },
  FLAGGED: { bg: 'bg-error/10', text: 'text-error', icon: ShieldAlert },
  REJECTED: { bg: 'bg-error/10', text: 'text-error', icon: ShieldX },
  NONE: { bg: 'bg-outline-variant/20', text: 'text-on-surface-variant', icon: Shield },
};

/** Convert a 2-letter ISO country code to its flag emoji. */
function countryCodeToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export default function GuestsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [screeningFilter, setScreeningFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch guests from API
  const { data: guestsData, isLoading, isError, error } = useQuery<GuestsResponse>({
    queryKey: ['guests', { search, screeningStatus: screeningFilter, nationality: nationalityFilter, page, limit: pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (screeningFilter !== 'all') params.screeningStatus = screeningFilter;
      if (nationalityFilter !== 'all') params.nationality = nationalityFilter;
      params.sortBy = 'createdAt';
      params.sortOrder = 'desc';
      const res = await apiClient.get('/guests', { params });
      return res.data;
    },
  });

  // Fetch all guests once for the nationality filter dropdown
  const { data: allGuestsForFilters } = useQuery<GuestsResponse>({
    queryKey: ['guests-nationalities'],
    queryFn: async () => {
      const res = await apiClient.get('/guests', { params: { limit: 100 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Delete guest mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/guests/${id}`),
    onSuccess: () => {
      toast.success(t('guests.deleteSuccess', 'Guest deleted successfully'));
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
    onError: () => {
      toast.error(t('guests.deleteError', 'Failed to delete guest'));
    },
  });

  const guests = guestsData?.data ?? [];
  const meta = guestsData?.meta;
  const totalPages = meta?.totalPages ?? 1;

  // Extract unique nationalities for filter dropdown
  const nationalities = useMemo(() => {
    const all = allGuestsForFilters?.data ?? [];
    return Array.from(new Set(all.map((g) => g.nationality).filter(Boolean) as string[])).sort();
  }, [allGuestsForFilters]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleScreeningChange = (val: string) => {
    setScreeningFilter(val);
    setPage(1);
  };
  const handleNationalityChange = (val: string) => {
    setNationalityFilter(val);
    setPage(1);
  };

  const handleDelete = (e: React.MouseEvent, guestId: string) => {
    e.stopPropagation();
    if (window.confirm(t('guests.confirmDelete', 'Are you sure you want to delete this guest?'))) {
      deleteMutation.mutate(guestId);
    }
  };

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
          {meta && (
            <p className="text-xs text-on-surface-variant mt-1">
              {meta.total} {t('guests.totalGuests', 'guests total')}
            </p>
          )}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={screeningFilter}
          onChange={(e) => handleScreeningChange(e.target.value)}
          className={inputClass}
        >
          <option value="all">All Screening</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="FLAGGED">Flagged</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={nationalityFilter}
          onChange={(e) => handleNationalityChange(e.target.value)}
          className={inputClass}
        >
          <option value="all">All Nationalities</option>
          {nationalities.map((n) => (
            <option key={n} value={n}>{countryCodeToFlag(n)} {n.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Loader2 className="w-10 h-10 mx-auto text-secondary animate-spin mb-4" />
          <p className="text-sm text-on-surface-variant">{t('common.loading', 'Loading...')}</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-error/60 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('common.error', 'Error')}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {(error as any)?.response?.data?.error?.message || t('guests.loadError', 'Failed to load guests. Please try again.')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && guests.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <Users className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            No Guests Found
          </h3>
          <p className="text-sm text-on-surface-variant">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Guest Grid */}
      {!isLoading && !isError && guests.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {guests.map((guest) => {
              const status = guest.screeningStatus || 'NONE';
              const screening = screeningStyles[status] || screeningStyles.NONE;
              const ScreeningIcon = screening.icon;
              const fullName = `${guest.firstName} ${guest.lastName}`;
              const initials = `${guest.firstName?.[0] ?? ''}${guest.lastName?.[0] ?? ''}`.toUpperCase();
              const flag = countryCodeToFlag(guest.nationality);
              const revenue = typeof guest.totalRevenue === 'string' ? parseFloat(guest.totalRevenue) : guest.totalRevenue;
              return (
                <div
                  key={guest.id}
                  onClick={() => navigate(`/guests/${guest.id}`)}
                  className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer group relative"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, guest.id)}
                    disabled={deleteMutation.isPending}
                    className="absolute top-3 end-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-error/10 text-on-surface-variant hover:text-error transition-all"
                    title={t('common.delete', 'Delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-lg flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface truncate">{fullName}</p>
                      {guest.nationality && (
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <span>{flag}</span>
                          <span>{guest.nationality.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5 mb-4">
                    {guest.email && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    {!guest.email && !guest.phone && (
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant/50">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{t('guests.noContact', 'No contact info')}</span>
                      </div>
                    )}
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
                        {'\u20AC'}{revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Screening Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${screening.bg} ${screening.text}`}>
                      <ScreeningIcon className="w-3 h-3" />
                      {status}
                    </span>
                    {guest.createdAt && (
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(guest.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-surface-container-lowest ambient-shadow disabled:opacity-40 hover:bg-surface-container-low transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-on-surface-variant">
                {t('common.pageOf', 'Page {{page}} of {{total}}', { page, total: totalPages })}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-surface-container-lowest ambient-shadow disabled:opacity-40 hover:bg-surface-container-low transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
