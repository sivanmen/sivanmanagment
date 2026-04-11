import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type MaintenanceCategory = 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'CLEANING' | 'PEST_CONTROL' | 'LANDSCAPING' | 'OTHER';

interface MaintenanceRequest {
  id: string;
  title: string;
  propertyName: string;
  propertyId: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedTo?: string;
  scheduledDate?: string;
  estimatedCost?: number;
  createdAt: string;
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

const categoryStyles: Record<MaintenanceCategory, string> = {
  PLUMBING: 'bg-blue-500/10 text-blue-600',
  ELECTRICAL: 'bg-warning/10 text-warning',
  HVAC: 'bg-secondary/10 text-secondary',
  APPLIANCE: 'bg-success/10 text-success',
  STRUCTURAL: 'bg-error/10 text-error',
  CLEANING: 'bg-success/10 text-success',
  PEST_CONTROL: 'bg-warning/10 text-warning',
  LANDSCAPING: 'bg-success/10 text-success',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const demoRequests: MaintenanceRequest[] = [
  {
    id: 'mnt-001',
    title: 'Kitchen faucet leaking',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'PLUMBING',
    priority: 'HIGH',
    status: 'OPEN',
    reportedBy: 'Maria Papadopoulos',
    estimatedCost: 180,
    createdAt: '2026-04-10',
  },
  {
    id: 'mnt-002',
    title: 'AC unit not cooling properly',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    category: 'HVAC',
    priority: 'URGENT',
    status: 'ASSIGNED',
    reportedBy: 'Hans Mueller',
    assignedTo: 'Cool Air Services',
    scheduledDate: '2026-04-12',
    estimatedCost: 350,
    createdAt: '2026-04-09',
  },
  {
    id: 'mnt-003',
    title: 'Broken window latch - bedroom 2',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    category: 'STRUCTURAL',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    reportedBy: 'Sophie Laurent',
    assignedTo: 'Dimitri Repairs',
    scheduledDate: '2026-04-11',
    estimatedCost: 90,
    createdAt: '2026-04-08',
  },
  {
    id: 'mnt-004',
    title: 'Pool pump replacement needed',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'APPLIANCE',
    priority: 'HIGH',
    status: 'WAITING_PARTS',
    reportedBy: 'Sivan M.',
    assignedTo: 'Pool Masters GR',
    scheduledDate: '2026-04-18',
    estimatedCost: 780,
    createdAt: '2026-04-05',
  },
  {
    id: 'mnt-005',
    title: 'Monthly pest control - scheduled',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    category: 'PEST_CONTROL',
    priority: 'LOW',
    status: 'COMPLETED',
    reportedBy: 'Sivan M.',
    assignedTo: 'PestGuard Crete',
    scheduledDate: '2026-04-02',
    estimatedCost: 60,
    createdAt: '2026-03-28',
  },
  {
    id: 'mnt-006',
    title: 'Electrical outlet not working - kitchen',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    category: 'ELECTRICAL',
    priority: 'HIGH',
    status: 'OPEN',
    reportedBy: 'Guest (David Chen)',
    estimatedCost: 120,
    createdAt: '2026-04-11',
  },
  {
    id: 'mnt-007',
    title: 'Garden irrigation system repair',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    category: 'LANDSCAPING',
    priority: 'LOW',
    status: 'ASSIGNED',
    reportedBy: 'Sivan M.',
    assignedTo: 'Green Garden Co.',
    scheduledDate: '2026-04-15',
    estimatedCost: 200,
    createdAt: '2026-04-07',
  },
  {
    id: 'mnt-008',
    title: 'Washing machine error code E3',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    category: 'APPLIANCE',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    reportedBy: 'Elena K.',
    assignedTo: 'Appliance Pro',
    scheduledDate: '2026-04-03',
    estimatedCost: 150,
    createdAt: '2026-04-01',
  },
  {
    id: 'mnt-009',
    title: 'Deep cleaning before guest arrival',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    category: 'CLEANING',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    reportedBy: 'Sivan M.',
    assignedTo: 'SparkClean Crete',
    scheduledDate: '2026-04-14',
    estimatedCost: 120,
    createdAt: '2026-04-10',
  },
  {
    id: 'mnt-010',
    title: 'Replace broken bathroom tiles',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    category: 'STRUCTURAL',
    priority: 'LOW',
    status: 'CANCELLED',
    reportedBy: 'Sivan M.',
    createdAt: '2026-03-20',
  },
];

const statuses: MaintenanceStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const maintenanceCategories: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'CLEANING', 'PEST_CONTROL', 'LANDSCAPING', 'OTHER'];

export default function MaintenanceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const properties = useMemo(() => {
    return Array.from(
      new Set(demoRequests.map((r) => JSON.stringify({ id: r.propertyId, name: r.propertyName }))),
    ).map((s) => JSON.parse(s) as { id: string; name: string });
  }, []);

  const filtered = useMemo(() => {
    return demoRequests.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.title.toLowerCase().includes(q)) return false;
      }
      if (propertyFilter !== 'all' && r.propertyId !== propertyFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [search, propertyFilter, statusFilter, priorityFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCount = demoRequests.filter((r) => r.status === 'OPEN').length;
  const inProgressCount = demoRequests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const completedThisMonth = demoRequests.filter(
    (r) => r.status === 'COMPLETED' && r.createdAt.startsWith('2026-04'),
  ).length;
  const avgResolution = '3.2 days';

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
      label: 'Completed This Month',
      value: completedThisMonth,
      icon: CheckCircle,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Avg Resolution',
      value: avgResolution,
      icon: Clock,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
  ];

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
              {paginated.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/maintenance/${req.id}`)}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-on-surface">{req.title}</td>
                  <td className="px-4 py-3 text-on-surface">{req.propertyName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryStyles[req.category]}`}
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
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[req.status]}`}
                    >
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{req.reportedBy}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{req.assignedTo ?? '-'}</td>
                  <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                    {req.scheduledDate ? new Date(req.scheduledDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                    {req.estimatedCost ? `\u20AC${req.estimatedCost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/maintenance/${req.id}`);
                      }}
                      className="flex items-center justify-center p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-on-surface-variant">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
