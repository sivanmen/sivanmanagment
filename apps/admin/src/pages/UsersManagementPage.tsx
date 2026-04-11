import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Wrench,
  Building2,
  Eye,
  Edit3,
  Bell,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageCircle,
  Smartphone,
  Clock,
  SortAsc,
  SortDesc,
  Crown,
  Activity,
  UserCircle,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import InviteUserModal from '../components/InviteUserModal';

// ── Types ──────────────────────────────────────────────────────────────

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  language: string;
  status: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  data: UserItem[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

interface UserStats {
  data: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
    owners: number;
    staff: number;
    admins: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────

const ROLES = ['ALL', 'SUPER_ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE', 'OWNER', 'VIP_STAR', 'AFFILIATE'] as const;
const STATUSES = ['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const;
const SORT_OPTIONS = [
  { value: 'firstName', label: 'Name' },
  { value: 'lastLoginAt', label: 'Last Login' },
  { value: 'createdAt', label: 'Created' },
  { value: 'role', label: 'Role' },
] as const;

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/20',
  PROPERTY_MANAGER: 'bg-secondary/15 text-secondary border-secondary/20',
  MAINTENANCE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  OWNER: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  VIP_STAR: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  AFFILIATE: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROPERTY_MANAGER: 'Manager',
  MAINTENANCE: 'Maintenance',
  OWNER: 'Owner',
  VIP_STAR: 'VIP Star',
  AFFILIATE: 'Affiliate',
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: Crown,
  PROPERTY_MANAGER: Shield,
  MAINTENANCE: Wrench,
  OWNER: Building2,
  VIP_STAR: Crown,
  AFFILIATE: UserPlus,
};

const statusBadgeStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  INACTIVE: 'bg-zinc-500/15 text-zinc-400',
  SUSPENDED: 'bg-red-500/15 text-red-400',
  PENDING: 'bg-amber-500/15 text-amber-400',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending',
};

// ── Helpers ────────────────────────────────────────────────────────────

function relativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Component ──────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('OWNER');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [inlineRoleEditId, setInlineRoleEditId] = useState<string | null>(null);

  const addDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const pageSize = 10;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────

  const { data: statsData } = useQuery<UserStats>({
    queryKey: ['users-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/users/stats');
      return res.data;
    },
  });

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['users', { search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize, sortBy, sortOrder };
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await apiClient.get('/users', { params });
      return res.data;
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/suspend`),
    onSuccess: () => {
      toast.success(t('users.suspendSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    },
    onError: () => toast.error(t('users.suspendError')),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/activate`),
    onSuccess: () => {
      toast.success(t('users.activateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    },
    onError: () => toast.error(t('users.activateError')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/users/${id}/reset-password`),
    onSuccess: () => toast.success(t('users.resetPasswordSuccess')),
    onError: () => toast.error(t('users.resetPasswordError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success(t('users.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    },
    onError: () => toast.error(t('users.deleteError')),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiClient.put(`/users/${id}`, { role }),
    onSuccess: () => {
      toast.success(t('users.roleChanged'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      setInlineRoleEditId(null);
    },
    onError: () => toast.error(t('users.roleChangeError')),
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, perPage: pageSize, totalPages: 1 };
  const stats = statsData?.data;

  // ── Handlers ───────────────────────────────────────────────────────

  const handleAddUser = (role: string) => {
    setInviteRole(role);
    setShowAddDropdown(false);
    setShowInviteModal(true);
  };

  const handleSuspendToggle = (user: UserItem) => {
    if (user.status === 'SUSPENDED') {
      activateMutation.mutate(user.id);
    } else {
      if (window.confirm(t('users.confirmSuspend', { name: `${user.firstName} ${user.lastName}` }))) {
        suspendMutation.mutate(user.id);
      }
    }
    setActionMenuId(null);
  };

  const handleResetPassword = (user: UserItem) => {
    if (window.confirm(t('users.confirmResetPassword', { name: `${user.firstName} ${user.lastName}` }))) {
      resetPasswordMutation.mutate(user.id);
    }
    setActionMenuId(null);
  };

  const handleDelete = (user: UserItem) => {
    if (window.confirm(t('users.confirmDelete', { name: `${user.firstName} ${user.lastName}` }))) {
      deleteMutation.mutate(user.id);
    }
    setActionMenuId(null);
  };

  const handleStatusQuickToggle = (user: UserItem) => {
    if (user.status === 'ACTIVE') {
      suspendMutation.mutate(user.id);
    } else {
      activateMutation.mutate(user.id);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('users.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('users.title')}
          </h1>
        </div>
        <div className="relative" ref={addDropdownRef}>
          <button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('users.addUser')}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showAddDropdown && (
            <div className="absolute end-0 top-full mt-2 w-56 rounded-xl bg-surface-container-lowest border border-outline-variant/20 ambient-shadow-lg z-50 py-1.5 overflow-hidden">
              {[
                { role: 'SUPER_ADMIN', label: t('users.addAdmin'), icon: Crown, desc: t('users.addAdminDesc') },
                { role: 'PROPERTY_MANAGER', label: t('users.addManager'), icon: Shield, desc: t('users.addManagerDesc') },
                { role: 'MAINTENANCE', label: t('users.addStaff'), icon: Wrench, desc: t('users.addStaffDesc') },
                { role: 'OWNER', label: t('users.inviteOwner'), icon: Building2, desc: t('users.inviteOwnerDesc') },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleAddUser(item.role)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors text-start"
                >
                  <item.icon className="w-4 h-4 mt-0.5 text-on-surface-variant flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{item.label}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: t('users.totalUsers'), value: stats.total, icon: Users, color: 'text-on-surface' },
            { label: t('users.activeUsers'), value: stats.active, icon: Activity, color: 'text-emerald-400' },
            { label: t('users.ownersCount'), value: stats.owners, icon: Building2, color: 'text-blue-400' },
            { label: t('users.staffCount'), value: stats.staff, icon: Shield, color: 'text-secondary' },
            { label: t('users.pendingInvitations'), value: stats.pending, icon: Clock, color: 'text-amber-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r === 'ALL' ? t('users.allRoles') : roleLabels[r]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? t('users.allStatuses') : statusLabels[s]}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 rounded-lg bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 text-on-surface-variant" />
            ) : (
              <SortDesc className="w-4 h-4 text-on-surface-variant" />
            )}
          </button>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-surface-container-high" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                  <div className="h-3 bg-surface-container-high rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
          <UserCircle className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="font-headline text-lg font-semibold text-on-surface mb-1">
            {t('users.emptyTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant mb-6">{t('users.emptyDescription')}</p>
          <button
            onClick={() => handleAddUser('OWNER')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('users.inviteOwner')}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  {[
                    t('users.colUser'),
                    t('users.colRole'),
                    t('users.colStatus'),
                    t('users.colPhone'),
                    t('users.colLastLogin'),
                    t('users.colNotifications'),
                    t('users.colActions'),
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant ${i === 6 ? 'text-end' : 'text-start'}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role] || Users;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate(`/users/${user.id}`)}
                        >
                          <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-on-surface text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role - clickable for inline edit */}
                      <td className="px-5 py-4 relative">
                        <button
                          onClick={() => setInlineRoleEditId(inlineRoleEditId === user.id ? null : user.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all hover:opacity-80 ${roleBadgeStyles[user.role] || 'bg-zinc-500/15 text-zinc-400'}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleLabels[user.role] || user.role}
                        </button>
                        {inlineRoleEditId === user.id && (
                          <div className="absolute top-full start-5 mt-1 w-48 rounded-lg bg-surface-container-lowest border border-outline-variant/20 ambient-shadow-lg z-50 py-1">
                            {Object.entries(roleLabels).map(([key, label]) => (
                              <button
                                key={key}
                                onClick={() => changeRoleMutation.mutate({ id: user.id, role: key })}
                                className={`w-full text-start px-3 py-2 text-sm hover:bg-surface-container-low transition-colors ${user.role === key ? 'text-secondary font-medium' : 'text-on-surface'}`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status - clickable for quick toggle */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleStatusQuickToggle(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:opacity-80 ${statusBadgeStyles[user.status] || 'bg-zinc-500/15 text-zinc-400'}`}
                        >
                          {statusLabels[user.status] || user.status}
                        </button>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-on-surface-variant">{user.phone || '-'}</p>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-on-surface-variant">{relativeTime(user.lastLoginAt)}</p>
                      </td>

                      {/* Notification Channels */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/users/${user.id}?tab=notifications`)}
                            className="p-1 rounded hover:bg-surface-container-low transition-colors"
                            title="Email notifications"
                          >
                            <Mail className="w-3.5 h-3.5 text-secondary" />
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}?tab=notifications`)}
                            className="p-1 rounded hover:bg-surface-container-low transition-colors"
                            title="WhatsApp notifications"
                          >
                            <MessageCircle className={`w-3.5 h-3.5 ${user.phone ? 'text-emerald-400' : 'text-zinc-600'}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}?tab=notifications`)}
                            className="p-1 rounded hover:bg-surface-container-low transition-colors"
                            title="SMS notifications"
                          >
                            <Smartphone className={`w-3.5 h-3.5 ${user.phone ? 'text-blue-400' : 'text-zinc-600'}`} />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-end relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/users/${user.id}`)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                            title={t('users.viewProfile')}
                          >
                            <Eye className="w-4 h-4 text-on-surface-variant" />
                          </button>
                          <button
                            onClick={() => navigate(`/users/${user.id}?tab=profile`)}
                            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                            title={t('users.editUser')}
                          >
                            <Edit3 className="w-4 h-4 text-on-surface-variant" />
                          </button>
                          <div className="relative" ref={actionMenuId === user.id ? actionMenuRef : undefined}>
                            <button
                              onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                            </button>
                            {actionMenuId === user.id && (
                              <div className="absolute end-0 top-full mt-1 w-52 rounded-lg bg-surface-container-lowest border border-outline-variant/20 ambient-shadow-lg z-50 py-1">
                                <button
                                  onClick={() => { navigate(`/users/${user.id}?tab=notifications`); setActionMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-start"
                                >
                                  <Bell className="w-4 h-4 text-on-surface-variant" />
                                  {t('users.notificationSettings')}
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-start"
                                >
                                  <KeyRound className="w-4 h-4 text-on-surface-variant" />
                                  {t('users.resetPassword')}
                                </button>
                                <div className="my-1 border-t border-outline-variant/10" />
                                <button
                                  onClick={() => handleSuspendToggle(user)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-container-low transition-colors text-start"
                                >
                                  {user.status === 'SUSPENDED' ? (
                                    <>
                                      <UserCheck className="w-4 h-4 text-emerald-400" />
                                      <span className="text-emerald-400">{t('users.activateUser')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-4 h-4 text-amber-400" />
                                      <span className="text-amber-400">{t('users.suspendUser')}</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors text-start"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t('users.deleteUser')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role] || Users;
              return (
                <div
                  key={user.id}
                  className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <div className="w-11 h-11 rounded-full gradient-accent flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeStyles[user.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleLabels[user.role]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeStyles[user.status]}`}>
                        {statusLabels[user.status]}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{user.phone || t('users.noPhone')}</span>
                    <span>{relativeTime(user.lastLoginAt)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-outline-variant/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-secondary" />
                      <MessageCircle className={`w-3.5 h-3.5 ${user.phone ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <Smartphone className={`w-3.5 h-3.5 ${user.phone ? 'text-blue-400' : 'text-zinc-600'}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/users/${user.id}`)} className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                        <Eye className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <button onClick={() => navigate(`/users/${user.id}?tab=profile`)} className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors">
                        <Edit3 className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <button
                        onClick={() => handleSuspendToggle(user)}
                        className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                      >
                        {user.status === 'SUSPENDED' ? (
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <UserX className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                {t('users.showing', {
                  from: (meta.page - 1) * meta.perPage + 1,
                  to: Math.min(meta.page * meta.perPage, meta.total),
                  total: meta.total,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      p === page ? 'gradient-accent text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          defaultRole={inviteRole}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['users-stats'] });
          }}
        />
      )}
    </div>
  );
}
