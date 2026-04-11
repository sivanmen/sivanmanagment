import { useState, useMemo, useCallback } from 'react';
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
  X,
  User,
  Building2,
  Flag,
  Tag,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'DONE';
type TaskCategory = 'CLEANING' | 'MAINTENANCE' | 'INSPECTION' | 'ADMINISTRATIVE' | 'GUEST_RELATED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  propertyName: string;
  propertyId: string;
  assignedTo: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; style: string; dotColor: string }> = {
  TODO: { label: 'To Do', style: 'bg-warning/10 text-warning', dotColor: 'bg-warning' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/10 text-blue-600', dotColor: 'bg-blue-500' },
  UNDER_REVIEW: { label: 'Under Review', style: 'bg-secondary/10 text-secondary', dotColor: 'bg-secondary' },
  DONE: { label: 'Done', style: 'bg-success/10 text-success', dotColor: 'bg-success' },
};

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-outline-variant/20 text-on-surface-variant',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-warning/10 text-warning',
  URGENT: 'bg-error/10 text-error',
};

const categoryStyles: Record<TaskCategory, string> = {
  CLEANING: 'bg-success/10 text-success',
  MAINTENANCE: 'bg-warning/10 text-warning',
  INSPECTION: 'bg-blue-500/10 text-blue-600',
  ADMINISTRATIVE: 'bg-outline-variant/20 text-on-surface-variant',
  GUEST_RELATED: 'bg-secondary/10 text-secondary',
};

const categoryLabels: Record<TaskCategory, string> = {
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
  INSPECTION: 'Inspection',
  ADMINISTRATIVE: 'Administrative',
  GUEST_RELATED: 'Guest Related',
};

const today = '2026-04-11';

const demoProperties = [
  { id: 'prop-001', name: 'Elounda Breeze Villa' },
  { id: 'prop-002', name: 'Heraklion Harbor Suite' },
  { id: 'prop-003', name: 'Chania Old Town Residence' },
  { id: 'prop-004', name: 'Rethymno Sunset Apartment' },
];

const demoAssignees = [
  'Sivan M.',
  'Elena K.',
  'SparkClean Crete',
  'Cool Air Services',
  'Pool Masters GR',
  'Green Garden Co.',
];

const initialTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Pre-arrival deep clean',
    description: 'Full deep cleaning before next guest arrival including kitchen, bathrooms, bedrooms, and outdoor areas.',
    category: 'CLEANING',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'SparkClean Crete',
    dueDate: '2026-04-14',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    id: 'task-002',
    title: 'Guest check-in preparation',
    description: 'Prepare welcome package, verify key lockbox code, and ensure property is ready for guest Maria P.',
    category: 'GUEST_RELATED',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-15',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    id: 'task-003',
    title: 'Monthly property inspection',
    description: 'Conduct a thorough inspection of all rooms, check appliances, plumbing, and note any maintenance needs.',
    category: 'INSPECTION',
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
    description: 'Purchase and restock shampoo, conditioner, body wash, towels, and toilet paper.',
    category: 'ADMINISTRATIVE',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-10',
    priority: 'LOW',
    status: 'TODO',
  },
  {
    id: 'task-005',
    title: 'Guest checkout follow-up',
    description: 'Follow up with Sophie L. after checkout, request review, check for any damage or missing items.',
    category: 'GUEST_RELATED',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-14',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    id: 'task-006',
    title: 'Fix AC unit - guest complaint',
    description: 'Guest reported AC not cooling properly. Contact Cool Air Services for urgent repair.',
    category: 'MAINTENANCE',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    assignedTo: 'Cool Air Services',
    dueDate: '2026-04-12',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
  },
  {
    id: 'task-007',
    title: 'Review listing copy updates',
    description: 'Elena updated the listing descriptions. Review the new copy and approve for publishing.',
    category: 'ADMINISTRATIVE',
    propertyName: 'Heraklion Harbor Suite',
    propertyId: 'prop-002',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-17',
    priority: 'LOW',
    status: 'UNDER_REVIEW',
  },
  {
    id: 'task-008',
    title: 'Update listing photos',
    description: 'Upload new professional photos taken last week to all OTA channels.',
    category: 'ADMINISTRATIVE',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'Elena K.',
    dueDate: '2026-04-09',
    priority: 'LOW',
    status: 'DONE',
  },
  {
    id: 'task-009',
    title: 'Pool chemical balance check',
    description: 'Test pool water pH, chlorine levels, and alkalinity. Adjust chemicals as needed.',
    category: 'INSPECTION',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'Pool Masters GR',
    dueDate: '2026-04-13',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    id: 'task-010',
    title: 'Garden maintenance - weekly',
    description: 'Mow lawn, trim hedges, water plants, and clean outdoor furniture.',
    category: 'MAINTENANCE',
    propertyName: 'Chania Old Town Residence',
    propertyId: 'prop-003',
    assignedTo: 'Green Garden Co.',
    dueDate: '2026-04-08',
    priority: 'LOW',
    status: 'DONE',
  },
  {
    id: 'task-011',
    title: 'End-of-season inventory check',
    description: 'Complete inventory of all furnishings, linens, kitchenware, and amenities before off-season.',
    category: 'INSPECTION',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-20',
    priority: 'LOW',
    status: 'TODO',
  },
  {
    id: 'task-012',
    title: 'Post-checkout deep clean',
    description: 'Full deep cleaning after guest departure including laundry and restocking.',
    category: 'CLEANING',
    propertyName: 'Rethymno Sunset Apartment',
    propertyId: 'prop-004',
    assignedTo: 'SparkClean Crete',
    dueDate: '2026-04-11',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  },
  {
    id: 'task-013',
    title: 'Verify insurance renewal documents',
    description: 'Review and approve the annual property insurance renewal documents before the deadline.',
    category: 'ADMINISTRATIVE',
    propertyName: 'Elounda Breeze Villa',
    propertyId: 'prop-001',
    assignedTo: 'Sivan M.',
    dueDate: '2026-04-16',
    priority: 'MEDIUM',
    status: 'UNDER_REVIEW',
  },
];

const kanbanStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE'];
const prioritiesList: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const categoriesList: TaskCategory[] = ['CLEANING', 'MAINTENANCE', 'INSPECTION', 'ADMINISTRATIVE', 'GUEST_RELATED'];

interface NewTaskForm {
  title: string;
  description: string;
  priority: Priority;
  assignedTo: string;
  dueDate: string;
  propertyId: string;
  category: TaskCategory;
}

const emptyForm: NewTaskForm = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  assignedTo: '',
  dueDate: '',
  propertyId: '',
  category: 'MAINTENANCE',
};

export default function TasksListPage() {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewTaskForm>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewTaskForm, string>>>({});
  const pageSize = 10;

  const properties = demoProperties;
  const assignees = demoAssignees;

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (propertyFilter !== 'all' && task.propertyId !== propertyFilter) return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (assignedFilter !== 'all' && task.assignedTo !== assignedFilter) return false;
      return true;
    });
  }, [tasks, search, propertyFilter, statusFilter, priorityFilter, assignedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueCount = tasks.filter(
    (t) => t.dueDate < today && t.status !== 'DONE',
  ).length;
  const dueTodayCount = tasks.filter(
    (t) => t.dueDate === today && t.status !== 'DONE',
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
      label: 'To Do',
      value: todoCount,
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
    if (!form.assignedTo) errors.assignedTo = 'Assignee is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const property = demoProperties.find((p) => p.id === form.propertyId);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      propertyName: property?.name ?? '',
      propertyId: form.propertyId,
      assignedTo: form.assignedTo,
      dueDate: form.dueDate,
      priority: form.priority,
      status: 'TODO',
    };

    setTasks((prev) => [newTask, ...prev]);
    closeCreateModal();
    toast.success('Task created successfully', {
      description: `"${newTask.title}" has been added to the task list.`,
    });
  }, [form, validateForm, closeCreateModal]);

  const markTaskDone = useCallback((taskId: string, taskTitle: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'DONE' as TaskStatus } : t)),
    );
    toast.success(`Task "${taskTitle}" marked as done`);
  }, []);

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
          {kanbanStatuses.map((s) => (
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
              {p}
            </option>
          ))}
        </select>
        <select
          value={assignedFilter}
          onChange={(e) => {
            setAssignedFilter(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="all">All Assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
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
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Title
                    </th>
                    <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Category
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
                  {paginated.map((task) => {
                    const isOverdue =
                      task.dueDate < today && task.status !== 'DONE';
                    return (
                      <tr
                        key={task.id}
                        className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${isOverdue ? 'bg-error/[0.03]' : ''}`}
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
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryStyles[task.category]}`}
                          >
                            {categoryLabels[task.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface">{task.propertyName}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{task.assignedTo}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={
                              isOverdue ? 'text-error font-semibold' : 'text-on-surface'
                            }
                          >
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span className="ms-1 text-[10px] text-error font-semibold uppercase">
                              {t('tasks.overdue')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusConfig[task.status].style}`}
                          >
                            {statusConfig[task.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {task.status !== 'DONE' && (
                              <button
                                onClick={() => markTaskDone(task.id, task.title)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanStatuses.map((status) => {
            const colTasks = filtered.filter((t) => t.status === status);
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
                    const isOverdue =
                      task.dueDate < today && task.status !== 'DONE';
                    return (
                      <div
                        key={task.id}
                        className={`bg-surface-container-lowest rounded-lg p-3 ambient-shadow ${isOverdue ? 'ring-1 ring-error/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-on-surface leading-snug">
                            {task.title}
                          </p>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${priorityStyles[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${categoryStyles[task.category]}`}
                          >
                            {categoryLabels[task.category]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 className="w-3 h-3 text-on-surface-variant shrink-0" />
                          <p className="text-xs text-on-surface-variant truncate">
                            {task.propertyName}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-on-surface-variant" />
                            <p className="text-xs text-on-surface-variant">{task.assignedTo}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-on-surface-variant" />
                            <p
                              className={`text-xs ${isOverdue ? 'text-error font-semibold' : 'text-on-surface-variant'}`}
                            >
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          </div>
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

              {/* Priority & Category Row */}
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
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    <Tag className="w-3.5 h-3.5" />
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        category: e.target.value as TaskCategory,
                      }))
                    }
                    className={`w-full ${inputClass}`}
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabels[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  <User className="w-3.5 h-3.5" />
                  Assignee <span className="text-error">*</span>
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, assignedTo: e.target.value }));
                    if (formErrors.assignedTo)
                      setFormErrors((e) => ({ ...e, assignedTo: undefined }));
                  }}
                  className={`w-full ${inputClass} ${formErrors.assignedTo ? 'ring-2 ring-error/40' : ''}`}
                >
                  <option value="">Select assignee...</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {formErrors.assignedTo && (
                  <p className="text-xs text-error mt-1">{formErrors.assignedTo}</p>
                )}
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
                  {demoProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.propertyId && (
                  <p className="text-xs text-error mt-1">{formErrors.propertyId}</p>
                )}
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
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
