import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Percent,
  DollarSign,
  Users,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

interface Owner {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  propertyCount: number;
  managementFee: number;
  totalRevenue: number;
  status: 'active' | 'inactive';
}

interface OwnersResponse {
  data: Owner[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const statusStyles = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-outline-variant/20 text-on-surface-variant',
};

export default function OwnersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery<OwnersResponse>({
    queryKey: ['owners', { search, status: statusFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiClient.get('/owners', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/owners/${id}`),
    onSuccess: () => {
      toast.success(t('owners.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['owners'] });
    },
    onError: () => {
      toast.error(t('owners.deleteError'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('owners.confirmDelete', { name }))) {
      deleteMutation.mutate(id);
    }
  };

  const owners = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, pageSize, totalPages: 1 };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('owners.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('owners.title')}
          </h1>
        </div>
        <button
          onClick={() => navigate('/owners/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('owners.addOwner')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t('owners.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          <option value="all">{t('owners.allStatuses')}</option>
          <option value="active">{t('owners.statusActive')}</option>
          <option value="inactive">{t('owners.statusInactive')}</option>
        </select>
      </div>

      {/* Owners List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                  <div className="h-3 bg-surface-container-high rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <UserCircle className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('owners.emptyTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">
            {t('owners.emptyDescription')}
          </p>
          <button
            onClick={() => navigate('/owners/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('owners.addOwner')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.ownerName')}
                  </th>
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.contact')}
                  </th>
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.properties')}
                  </th>
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.managementFee')}
                  </th>
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.totalRevenue')}
                  </th>
                  <th className="text-start px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.status')}
                  </th>
                  <th className="text-end px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('owners.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/owners/${owner.id}`)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface text-sm">{owner.name}</p>
                          {owner.company && (
                            <p className="text-xs text-on-surface-variant">{owner.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Mail className="w-3 h-3" />
                          <span>{owner.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                          <Phone className="w-3 h-3" />
                          <span>{owner.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-semibold text-on-surface">
                          {owner.propertyCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-warning" />
                        <span className="text-sm font-semibold text-on-surface">
                          {owner.managementFee}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-on-surface">
                        ${owner.totalRevenue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[owner.status]}`}
                      >
                        {t(`owners.status${owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}`)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`/owners/${owner.id}`)}
                          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(owner.id, owner.name)}
                          className="p-2 rounded-lg text-error/70 hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {owners.map((owner) => (
              <div
                key={owner.id}
                onClick={() => navigate(`/owners/${owner.id}`)}
                className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow hover:shadow-ambient-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold">
                      {owner.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface">{owner.name}</p>
                      {owner.company && (
                        <p className="text-xs text-on-surface-variant">{owner.company}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[owner.status]}`}
                  >
                    {t(`owners.status${owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}`)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {t('owners.properties')}
                    </p>
                    <p className="text-sm font-semibold text-on-surface">{owner.propertyCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {t('owners.fee')}
                    </p>
                    <p className="text-sm font-semibold text-on-surface">{owner.managementFee}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {t('owners.revenue')}
                    </p>
                    <p className="text-sm font-semibold text-on-surface">
                      ${(owner.totalRevenue / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{owner.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{owner.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'gradient-accent text-white'
                  : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
