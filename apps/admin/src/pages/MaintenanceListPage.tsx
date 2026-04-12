import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import apiClient from '../lib/api-client';

type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'CLEANING' | 'PEST_CONTROL' | 'PEST' | 'LANDSCAPING' | 'OTHER';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  propertyId: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  estimatedCost?: number | string | null;
  actualCost?: number | string | null;
  scheduledDate?: string | null;
  completedAt?: string | null;
  images?: unknown;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
    city?: string;
    internalCode?: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    unitType: string;
  } | null;
  reportedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface MaintenanceListResponse {
  success: boolean;
  data: MaintenanceRequest[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

interface MaintenanceStatsResponse {
  success: boolean;
  data: {
    byStatus: { status: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    byCategory: { category: string; count: number }[];
    monthlyRequests: number;
    pendingEstimatedCost: number | string;
    monthlyActualCost: number | string;
    overdueCount: number;
  };
}

interface PropertyOption {
  id: string;
  name: string;
}

interface PropertiesResponse {
  success: boolean;
  data: PropertyOption[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const statusStyles: Record<MaintenanceStatus, string> = {
  OPEN: 'bg-error/10 text-error',
  ASSIGNED: 'bg-blue-500/10 text-blue-600',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  WAITING_PARTS: 'bg-secondary/10 text-secondary',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-outline-variant/20 text-on-surface-variant',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-outline-variant/20 text-on-surface-variant',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-error/10 text-error',
};

const categoryStyles: Record<string, string> = {
  PLUMBING: 'bg-blue-500/10 text-blue-600',
  ELECTRICAL: 'bg-warning/10 text-warning',
  HVAC: 'bg-secondary/10 text-secondary',
  APPLIANCE: 'bg-success/10 text-success',
  STRUCTURAL: 'bg-error/10 text-error',
  CLEANING: 'bg-success/10 text-success',
  PEST: 'bg-warning/10 text-warning',
  PEST_CONTROL: 'bg-warning/10 text-warning',
  LANDSCAPING: 'bg-success/10 text-success',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const statuses: MaintenanceStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const maintenanceCategories: string[] = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'PEST', 'LANDSCAPING', 'OTHER'];

function getStatusCount(byStatus: { status: string; count: number }[], ...statusNames: string[]): number {
  return byStatus
    .filter((s) => statusNames.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);
}

function formatUserName(user?: { firstName: string; lastName: string } | null): string {
  if (!user) return '-';
  return `${user.firstName} ${user.lastName}`.trim() || '-';
}

function toNumber(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? null : n;
}

export default function MaintenanceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch maintenance requests
  const { data: listData, isLoading } = useQuery<MaintenanceListResponse>({
    queryKey: ['maintenance', { search, propertyId: propertyFilter, status: statusFilter, priority: priorityFilter, category: categoryFilter, page, limit: pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize, sortBy: 'createdAt', sortOrder: 'desc' };
      if (search) params.search = search;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      const res = await apiClient.get('/maintenance', { params });
      return res.data;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery<MaintenanceStatsResponse>({
    queryKey: ['maintenance', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance/stats');
      return res.data;
    },
    staleTime: 60_000,
  });

  // Fetch properties for filter dropdown
  const { data: propertiesData } = useQuery<PropertiesResponse>({
    queryKey: ['properties', 'all-for-filter'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 120_000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaintenanceStatus }) =>
      apiClient.put(`/maintenance/${id}`, { status }),
    onSuccess: () => {
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/maintenance/${id}`),
    onSuccess: () => {
      toast.success(t('common.deleted'));
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete request');
    },
  });

  const requests = listData?.data ?? [];
  const total = listData?.meta?.total ?? 0;
  const totalPages = listData?.meta?.totalPages ?? 1;

  const properties: PropertyOption[] = (propertiesData?.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  // Stats
  const byStatus = statsData?.data?.byStatus ?? [];
  const openCount = getStatusCount(byStatus, 'OPEN');
  const inProgressCount = getStatusCount(byStatus, 'IN_PROGRESS', 'ASSIGNED');
  const completedThisMonth = statsData?.data?.monthlyRequests ?? 0;
  const overdueCount = statsData?.data?.overdueCount ?? 0;

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const stats = [
    {
      label: 'Open Requests',
      value: openCount,
      icon: AlertTriangle,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: Wrench,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'This Month',
      value: completedThisMonth,
      icon: CheckCircle,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Overdue',
      value: overdueCount,
      icon: Clock,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];

  const handleStatusChange = (e: React.MouseEvent, requestId: string, newStatus: MaintenanceStatus) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ id: requestId, status: newStatus });
  };

  const handleDelete = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    if (window.confirm(t('common.confirmDelete'))) {
      deleteMutation.mutate(requestId);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('maintenance.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Maintenance Requests
          </h1>
        </div>
        <button
          onClick={() => navigate('/maintenance/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('maintenance.newRequest')}</span>
        </button>
      </div>

      {/* Stats Row */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={propertyFilter}
          onChange={(e) => {
            setPropertyFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Priorities</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Categories</option>
          {maintenanceCategories.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Title
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Property
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Category
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('maintenance.priority')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Status
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Reported By
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('maintenance.assignedTo')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Scheduled
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('maintenance.estimatedCost')}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/maintenance/${req.id}`)}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-on-surface">{req.title}</td>
                    <td className="px-4 py-3 text-on-surface">{req.property?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryStyles[req.category] ?? categoryStyles.OTHER}`}
                      >
                        {req.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[req.priority]}`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={req.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: req.id, status: e.target.value as MaintenanceStatus });
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border-0 cursor-pointer ${statusStyles[req.status]}`}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatUserName(req.reportedBy)}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatUserName(req.assignedTo)}</td>
                    <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                      {req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                      {toNumber(req.estimatedCost) !== null
                        ? `\u20AC${toNumber(req.estimatedCost)!.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/maintenance/${req.id}`);
                          }}
                          className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, req.id)}
                          className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-on-surface-variant">
                      {t('common.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Total count footer */}
      {total > 0 && (
        <p className="text-center text-xs text-on-surface-variant">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} requests
        </p>
      )}
    </div>
  );
}
