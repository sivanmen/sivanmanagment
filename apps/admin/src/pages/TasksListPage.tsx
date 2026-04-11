import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  LayoutGrid,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskType = 'CLEANING' | 'INSPECTION' | 'CHECK_IN' | 'CHECK_OUT' | 'MAINTENANCE' | 'INVENTORY' | 'COMMUNICATION' | 'ADMIN' | 'OTHER';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Task {
  id: string;
  title: string;
  type: TaskType;
  propertyName: string;
  propertyId: string;
  assignedTo: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
}

const statusStyles: Record<TaskStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-outline-variant/20 text-on-surface-variant',
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-outline-variant/20 text-on-surface-variant',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-error/10 text-error',
};

const typeStyles: Record<TaskType, string> = {
  CLEANING: 'bg-success/10 text-success',
  INSPECTION: 'bg-blue-500/10 text-blue-600',
  CHECK_IN: 'bg-secondary/10 text-secondary',
  CHECK_OUT: 'bg-secondary/10 text-secondary',
  MAINTENANCE: 'bg-warning/10 text-warning',
  INVENTORY: 'bg-outline-variant/20 text-on-surface-variant',
  COMMUNICATION: 'bg-blue-500/10 text-blue-600',
  ADMIN: 'bg-outline-variant/20 text-on-surface-variant',
  OTHER: 'bg-outline-variant/20 text-on-surface-variant',
};

const today = '2026-04-11';

const demoTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Pre-arrival deep clean',
    type: 'CLEANING',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'SparkClean Crete',
    dueDate: '2026-04-14',
    priority: 'HIGH',
    status: 'PENDING',
  },
  {
    id: 'task-002',
    title: 'Guest check-in - Maria P.',
    type: 'CHECK_IN',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-15',
    priority: 'HIGH',
    status: 'PENDING',
  },
  {
    id: 'task-003',
    title: 'Monthly property inspection',
    type: 'INSPECTION',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-11',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
  },
  {
    id: 'task-004',
    title: 'Restock bathroom supplies',
    type: 'INVENTORY',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-10',
    priority: 'LOW',
    status: 'PENDING',
  },
  {
    id: 'task-005',
    title: 'Guest checkout - Sophie L.',
    type: 'CHECK_OUT',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-14',
    priority: 'MEDIUM',
    status: 'PENDING',
  },
  {
    id: 'task-006',
    title: 'Fix AC unit - guest complaint',
    type: 'MAINTENANCE',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    assignedTo: 'Cool Air Services',
    dueDate: '2026-04-12',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
  },
  {
    id: 'task-007',
    title: 'Send welcome email - Hans M.',
    type: 'COMMUNICATION',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-17',
    priority: 'LOW',
    status: 'PENDING',
  },
  {
    id: 'task-008',
    title: 'Update listing photos',
    type: 'ADMIN',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-09',
    priority: 'LOW',
    status: 'COMPLETED',
  },
  {
    id: 'task-009',
    title: 'Pool chemical balance check',
    type: 'INSPECTION',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'Pool Masters GR',
    dueDate: '2026-04-13',
    priority: 'MEDIUM',
    status: 'PENDING',
  },
  {
    id: 'task-010',
    title: 'Garden maintenance - weekly',
    type: 'MAINTENANCE',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Green Garden Co.',
    dueDate: '2026-04-08',
    priority: 'LOW',
    status: 'COMPLETED',
  },
  {
    id: 'task-011',
    title: 'End-of-season inventory check',
    type: 'INVENTORY',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-20',
    priority: 'LOW',
    status: 'PENDING',
  },
  {
    id: 'task-012',
    title: 'Post-checkout deep clean',
    type: 'CLEANING',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'SparkClean Crete',
    dueDate: '2026-04-11',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  },
];

const taskStatuses: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const taskTypes: TaskType[] = ['CLEANING', 'INSPECTION', 'CHECK_IN', 'CHECK_OUT', 'MAINTENANCE', 'INVENTORY', 'COMMUNICATION', 'ADMIN', 'OTHER'];
const prioritiesList: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TasksListPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const properties = useMemo(() => {
    return Array.from(
      new Set(demoTasks.map((t) => JSON.stringify({ id: t.propertyId, name: t.propertyName }))),
    ).map((s) => JSON.parse(s) as { id: string; name: string });
  }, []);

  const assignees = useMemo(() => {
    return Array.from(new Set(demoTasks.map((t) => t.assignedTo)));
  }, []);

  const filtered = useMemo(() => {
    return demoTasks.filter((task) => {
      if (search) {
        const q = search.toLowerCase();
        if (!task.title.toLowerCase().includes(q)) return false;
      }
      if (propertyFilter !== 'all' && task.propertyId !== propertyFilter) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (typeFilter !== 'all' && task.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (assignedFilter !== 'all' && task.assignedTo !== assignedFilter) return false;
      return true;
    });
  }, [search, propertyFilter, statusFilter, typeFilter, priorityFilter, assignedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalCount = demoTasks.length;
  const pendingCount = demoTasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = demoTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueCount = demoTasks.filter(
    (t) => t.dueDate < today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  ).length;
  const dueTodayCount = demoTasks.filter(
    (t) => t.dueDate === today && t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  ).length;

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const stats = [
    {
      label: 'Total Tasks',
      value: totalCount,
      icon: ClipboardList,
      color: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock,
      color: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: ClipboardList,
      color: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      label: t('tasks.overdue'),
      value: overdueCount,
      icon: AlertTriangle,
      color: 'bg-error/10',
      iconColor: 'text-error',
    },
    {
      label: t('tasks.dueToday'),
      value: dueTodayCount,
      icon: Calendar,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
  ];

  const kanbanColumns: { status: TaskStatus; label: string }[] = [
    { status: 'PENDING', label: 'Pending' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('tasks.title')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('tasks.title')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-container-lowest rounded-lg ambient-shadow p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'gradient-accent text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'gradient-accent text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => toast.success('New task form coming soon')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('tasks.newTask')}</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select value={propertyFilter} onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="all">All Statuses</option>
          {taskStatuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="all">All Types</option>
          {taskTypes.map((tt) => (
            <option key={tt} value={tt}>{tt.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="all">All Priorities</option>
          {prioritiesList.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }} className={inputClass}>
          <option value="all">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Title</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('tasks.type')}</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Assigned To</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{t('tasks.dueDate')}</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Priority</th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((task) => {
                    const isOverdue = task.dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${isOverdue ? 'bg-error/[0.03]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-on-surface">{task.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${typeStyles[task.type]}`}>
                            {task.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">{task.propertyName}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{task.assignedTo}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={isOverdue ? 'text-error font-semibold' : 'text-on-surface'}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span className="ms-1 text-[10px] text-error font-semibold uppercase">
                              {t('tasks.overdue')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusStyles[task.status]}`}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                              <button
                                onClick={() => toast.success(`Task "${task.title}" completed`)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
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
        </>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline text-sm font-semibold text-on-surface">{col.label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-lowest text-on-surface-variant">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => {
                    const isOverdue = task.dueDate < today && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                    return (
                      <div
                        key={task.id}
                        className={`bg-surface-container-lowest rounded-lg p-3 ambient-shadow ${isOverdue ? 'ring-1 ring-error/30' : ''}`}
                      >
                        <p className="text-sm font-medium text-on-surface mb-2">{task.title}</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${typeStyles[task.type]}`}>
                            {task.type.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-1">{task.propertyName}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-on-surface-variant">{task.assignedTo}</p>
                          <p className={`text-xs ${isOverdue ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4">No tasks</p>
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
