import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  X,
  User,
  Building2,
  Flag,
  Tag,
  FileText,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';

// ─── API-aligned types ───────────────────────────────────────────────

type TaskStatus = 'TASK_PENDING' | 'ASSIGNED' | 'TASK_IN_PROGRESS' | 'TASK_COMPLETED' | 'TASK_CANCELLED' | 'SKIPPED';
type TaskType = 'CLEANING' | 'INSPECTION' | 'CHECK_IN' | 'CHECK_OUT' | 'TASK_MAINTENANCE' | 'LAUNDRY' | 'SUPPLY_RESTOCK' | 'CUSTOM';
type Priority = 'TASK_LOW' | 'TASK_MEDIUM' | 'TASK_HIGH' | 'TASK_URGENT';

interface TaskAssignment {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  estimatedDurationMin: number | null;
  actualDurationMin: number | null;
  notes: string | null;
  checklist: unknown;
  propertyId: string | null;
  unitId: string | null;
  bookingId: string | null;
  property: { id: string; name: string; city: string | null; internalCode: string | null } | null;
  unit: { id: string; unitNumber: string; unitType: string } | null;
  booking: { id: string; guestName: string; checkIn: string; checkOut: string } | null;
  createdBy: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  assignments: TaskAssignment[];
}

interface TasksResponse {
  success: boolean;
  data: Task[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface TaskStatsResponse {
  success: boolean;
  data: {
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    overdue: number;
    dueSoon: number;
  };
}

// ─── Display config ──────────────────────────────────────────────────

const statusConfig: Record<TaskStatus, { label: string; style: string; dotColor: string }> = {
  TASK_PENDING: { label: 'Pending', style: 'bg-warning/10 text-warning', dotColor: 'bg-warning' },
  ASSIGNED: { label: 'Assigned', style: 'bg-secondary/10 text-secondary', dotColor: 'bg-secondary' },
  TASK_IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/10 text-blue-600', dotColor: 'bg-blue-500' },
  TASK_COMPLETED: { label: 'Completed', style: 'bg-success/10 text-success', dotColor: 'bg-success' },
  TASK_CANCELLED: { label: 'Cancelled', style: 'bg-error/10 text-error', dotColor: 'bg-error' },
  SKIPPED: { label: 'Skipped', style: 'bg-outline-variant/20 text-on-surface-variant', dotColor: 'bg-outline-variant' },
};

const priorityStyles: Record<Priority, string> = {
  TASK_LOW: 'bg-outline-variant/20 text-on-surface-variant',
  TASK_MEDIUM: 'bg-blue-500/10 text-blue-600',
  TASK_HIGH: 'bg-warning/10 text-warning',
  TASK_URGENT: 'bg-error/10 text-error',
};

const priorityLabels: Record<Priority, string> = {
  TASK_LOW: 'Low',
  TASK_MEDIUM: 'Medium',
  TASK_HIGH: 'High',
  TASK_URGENT: 'Urgent',
};

const typeStyles: Record<TaskType, string> = {
  CLEANING: 'bg-success/10 text-success',
  INSPECTION: 'bg-blue-500/10 text-blue-600',
  CHECK_IN: 'bg-secondary/10 text-secondary',
  CHECK_OUT: 'bg-secondary/10 text-secondary',
  TASK_MAINTENANCE: 'bg-warning/10 text-warning',
  LAUNDRY: 'bg-outline-variant/20 text-on-surface-variant',
  SUPPLY_RESTOCK: 'bg-outline-variant/20 text-on-surface-variant',
  CUSTOM: 'bg-outline-variant/20 text-on-surface-variant',
};

const typeLabels: Record<TaskType, string> = {
  CLEANING: 'Cleaning',
  INSPECTION: 'Inspection',
  CHECK_IN: 'Check-In',
  CHECK_OUT: 'Check-Out',
  TASK_MAINTENANCE: 'Maintenance',
  LAUNDRY: 'Laundry',
  SUPPLY_RESTOCK: 'Supply Restock',
  CUSTOM: 'Custom',
};

/** Statuses shown in kanban columns (active workflow) */
const kanbanStatuses: TaskStatus[] = ['TASK_PENDING', 'ASSIGNED', 'TASK_IN_PROGRESS', 'TASK_COMPLETED'];
const prioritiesList: Priority[] = ['TASK_LOW', 'TASK_MEDIUM', 'TASK_HIGH', 'TASK_URGENT'];
const typesList: TaskType[] = ['CLEANING', 'INSPECTION', 'CHECK_IN', 'CHECK_OUT', 'TASK_MAINTENANCE', 'LAUNDRY', 'SUPPLY_RESTOCK', 'CUSTOM'];
const allStatuses: TaskStatus[] = ['TASK_PENDING', 'ASSIGNED', 'TASK_IN_PROGRESS', 'TASK_COMPLETED', 'TASK_CANCELLED', 'SKIPPED'];

// ─── Helpers ─────────────────────────────────────────────────────────

function getAssigneeName(task: Task): string {
  if (task.assignments.length === 0) return '\u2014';
  const a = task.assignments[0];
  const first = a.user.firstName ?? '';
  const last = a.user.lastName ?? '';
  const full = `${first} ${last}`.trim();
  return full || a.user.email;
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'TASK_COMPLETED' || task.status === 'TASK_CANCELLED' || task.status === 'SKIPPED') return false;
  return new Date(task.dueDate) < new Date();
}

// ─── Create Task Form ────────────────────────────────────────────────

interface NewTaskForm {
  title: string;
  description: string;
  priority: Priority;
  type: TaskType;
  dueDate: string;
  propertyId: string;
  notes: string;
  estimatedDurationMin: string;
  assignUserId: string;
}

const emptyForm: NewTaskForm = {
  title: '',
  description: '',
  priority: 'TASK_MEDIUM',
  type: 'CUSTOM',
  dueDate: '',
  propertyId: '',
  notes: '',
  estimatedDurationMin: '',
  assignUserId: '',
};

export default function TasksListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewTaskForm>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewTaskForm, string>>>({});

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  // ── Fetch properties for filter & create modal ──
  const { data: propertiesData } = useQuery<{ data: { id: string; name: string }[] }>({
    queryKey: ['properties-list-minimal'],
    queryFn: async () => {
      const res = await apiClient.get('/properties', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const properties = propertiesData?.data ?? [];

  // ── Fetch users for assignee dropdown ──
  const { data: usersData } = useQuery<{ data: { id: string; email: string; firstName: string | null; lastName: string | null; role: string }[] }>({
    queryKey: ['users-list-minimal'],
    queryFn: async () => {
      const res = await apiClient.get('/users', { params: { pageSize: 200 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const users = usersData?.data ?? [];

  // ── Fetch tasks with server-side filtering + pagination ──
  const { data: tasksData, isLoading } = useQuery<TasksResponse>({
    queryKey: ['tasks', { search, propertyId: propertyFilter, status: statusFilter, priority: priorityFilter, type: typeFilter, page, limit: pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize, sortBy: 'dueDate', sortOrder: 'asc' };
      if (search) params.search = search;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await apiClient.get('/tasks', { params });
      return res.data;
    },
  });

  const tasks = tasksData?.data ?? [];
  const totalPages = tasksData?.meta?.totalPages ?? 1;
  const totalRecords = tasksData?.meta?.total ?? 0;

  // ── Fetch stats ──
  const { data: statsData } = useQuery<TaskStatsResponse>({
    queryKey: ['tasks-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/tasks/stats');
      return res.data;
    },
  });

  const statsRaw = statsData?.data;
  const totalCount = statsRaw ? statsRaw.byStatus.reduce((sum, s) => sum + s.count, 0) : 0;
  const pendingCount = statsRaw?.byStatus.find((s) => s.status === 'TASK_PENDING')?.count ?? 0;
  const inProgressCount = statsRaw?.byStatus.find((s) => s.status === 'TASK_IN_PROGRESS')?.count ?? 0;
  const overdueCount = statsRaw?.overdue ?? 0;
  const dueSoonCount = statsRaw?.dueSoon ?? 0;

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
      value: dueSoonCount,
      icon: Calendar,
      color: 'bg-success/10',
      iconColor: 'text-success',
    },
  ];

  // ── Create mutation ──
  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await apiClient.post('/tasks', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
      closeCreateModal();
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  // ── Complete (mark done) mutation ──
  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/tasks/${id}/complete`),
    onSuccess: () => {
      toast.success('Task marked as completed');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
    onError: () => {
      toast.error('Failed to complete task');
    },
  });

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-stats'] });
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  // ── For kanban, fetch all tasks without pagination ──
  const { data: kanbanData } = useQuery<TasksResponse>({
    queryKey: ['tasks-kanban', { search, propertyId: propertyFilter, priority: priorityFilter, type: typeFilter }],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 100, sortBy: 'dueDate', sortOrder: 'asc' };
      if (search) params.search = search;
      if (propertyFilter !== 'all') params.propertyId = propertyFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await apiClient.get('/tasks', { params });
      return res.data;
    },
    enabled: viewMode === 'kanban',
  });

  const kanbanTasks = kanbanData?.data ?? [];

  // ── Modal handlers ──
  const openCreateModal = useCallback(() => {
    setForm({ ...emptyForm });
    setFormErrors({});
    setShowCreateModal(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setForm({ ...emptyForm });
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof NewTaskForm, string>> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    if (!form.propertyId) errors.propertyId = 'Property is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      propertyId: form.propertyId || undefined,
      notes: form.notes.trim() || undefined,
      estimatedDurationMin: form.estimatedDurationMin ? parseInt(form.estimatedDurationMin) : undefined,
    };

    if (form.assignUserId) {
      payload.assignments = [{ userId: form.assignUserId }];
    }

    createMutation.mutate(payload);
  }, [form, validateForm, createMutation]);

  const handleDelete = useCallback((id: string, title: string) => {
    if (window.confirm(`Delete task "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

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
            onClick={openCreateModal}
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
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {statusConfig[s].label}
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
          {prioritiesList.map((p) => (
            <option key={p} value={p}>
              {priorityLabels[p]}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Types</option>
          {typesList.map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && viewMode === 'table' && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
          <span className="ms-2 text-sm text-on-surface-variant">Loading tasks...</span>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && !isLoading && (
        <>
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Title
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Type
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Property
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Assigned To
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {t('tasks.dueDate')}
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Priority
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${overdue ? 'bg-error/[0.03]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-on-surface">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${typeStyles[task.type] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                          >
                            {typeLabels[task.type] ?? task.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">
                          {task.property?.name ?? '\u2014'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">
                          {getAssigneeName(task)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {task.dueDate ? (
                            <>
                              <span
                                className={
                                  overdue ? 'text-error font-semibold' : 'text-on-surface'
                                }
                              >
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              {overdue && (
                                <span className="ms-1 text-[10px] text-error font-semibold uppercase">
                                  {t('tasks.overdue')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-on-surface-variant">{'\u2014'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                          >
                            {priorityLabels[task.priority] ?? task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusConfig[task.status]?.style ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                          >
                            {statusConfig[task.status]?.label ?? task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {task.status !== 'TASK_COMPLETED' && task.status !== 'TASK_CANCELLED' && task.status !== 'SKIPPED' && (
                              <button
                                onClick={() => completeMutation.mutate(task.id)}
                                disabled={completeMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Done
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(task.id, task.title)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-on-surface-variant"
                      >
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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'gradient-accent text-white'
                        : 'text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Total count */}
          <p className="text-center text-xs text-on-surface-variant">
            Showing {tasks.length} of {totalRecords} tasks
          </p>
        </>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanStatuses.map((status) => {
            const colTasks = kanbanTasks.filter((t) => t.status === status);
            const config = statusConfig[status];
            return (
              <div key={status} className="bg-surface-container-low rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                    <h3 className="font-headline text-sm font-semibold text-on-surface">
                      {config.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-lowest text-on-surface-variant">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map((task) => {
                    const overdue = isOverdue(task);
                    return (
                      <div
                        key={task.id}
                        className={`bg-surface-container-lowest rounded-lg p-3 ambient-shadow ${overdue ? 'ring-1 ring-error/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-on-surface leading-snug">
                            {task.title}
                          </p>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                          >
                            {priorityLabels[task.priority] ?? task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${typeStyles[task.type] ?? 'bg-outline-variant/20 text-on-surface-variant'}`}
                          >
                            {typeLabels[task.type] ?? task.type}
                          </span>
                        </div>
                        {task.property && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 className="w-3 h-3 text-on-surface-variant shrink-0" />
                            <p className="text-xs text-on-surface-variant truncate">
                              {task.property.name}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-on-surface-variant" />
                            <p className="text-xs text-on-surface-variant">{getAssigneeName(task)}</p>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-on-surface-variant" />
                              <p
                                className={`text-xs ${overdue ? 'text-error font-semibold' : 'text-on-surface-variant'}`}
                              >
                                {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-6">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCreateModal}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-surface rounded-2xl ambient-shadow border border-outline/5">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface z-10 flex items-center justify-between p-6 pb-4 border-b border-outline/5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
                  New Task
                </p>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  Create Task
                </h2>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, title: e.target.value }));
                    if (formErrors.title) setFormErrors((e) => ({ ...e, title: undefined }));
                  }}
                  className={`w-full ${inputClass} ${formErrors.title ? 'ring-2 ring-error/40' : ''}`}
                />
                {formErrors.title && (
                  <p className="text-xs text-error mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Description
                </label>
                <textarea
                  placeholder="Describe the task..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={`w-full ${inputClass} resize-none`}
                />
              </div>

              {/* Priority & Type Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    <Flag className="w-3.5 h-3.5" />
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value as Priority }))
                    }
                    className={`w-full ${inputClass}`}
                  >
                    {prioritiesList.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabels[p]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as TaskType,
                      }))
                    }
                    className={`w-full ${inputClass}`}
                  >
                    {typesList.map((c) => (
                      <option key={c} value={c}>
                        {typeLabels[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <User className="w-3.5 h-3.5" />
                  Assignee
                </label>
                <select
                  value={form.assignUserId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, assignUserId: e.target.value }));
                  }}
                  className={`w-full ${inputClass}`}
                >
                  <option value="">No assignee</option>
                  {users.map((u) => {
                    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;
                    return (
                      <option key={u.id} value={u.id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Due Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, dueDate: e.target.value }));
                    if (formErrors.dueDate)
                      setFormErrors((e) => ({ ...e, dueDate: undefined }));
                  }}
                  className={`w-full ${inputClass} ${formErrors.dueDate ? 'ring-2 ring-error/40' : ''}`}
                />
                {formErrors.dueDate && (
                  <p className="text-xs text-error mt-1">{formErrors.dueDate}</p>
                )}
              </div>

              {/* Property */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Property <span className="text-error">*</span>
                </label>
                <select
                  value={form.propertyId}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, propertyId: e.target.value }));
                    if (formErrors.propertyId)
                      setFormErrors((e) => ({ ...e, propertyId: undefined }));
                  }}
                  className={`w-full ${inputClass} ${formErrors.propertyId ? 'ring-2 ring-error/40' : ''}`}
                >
                  <option value="">Select property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.propertyId && (
                  <p className="text-xs text-error mt-1">{formErrors.propertyId}</p>
                )}
              </div>

              {/* Estimated Duration */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 60"
                  value={form.estimatedDurationMin}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedDurationMin: e.target.value }))}
                  className={`w-full ${inputClass}`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                </label>
                <textarea
                  placeholder="Additional notes..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`w-full ${inputClass} resize-none`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-surface z-10 flex items-center justify-end gap-3 p-6 pt-4 border-t border-outline/5">
              <button
                onClick={closeCreateModal}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
