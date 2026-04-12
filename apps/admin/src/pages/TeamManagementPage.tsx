import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  UserPlus,
  ChevronRight,
  ChevronDown,
  Building2,
  Search,
  Crown,
  User,
  Check,
  X,
  Clock,
  Calendar,
  Star,
  MessageSquare,
  Send,
  Phone,
  Mail,
  MapPin,
  Activity,
  Award,
  BarChart3,
  Briefcase,
  CheckCircle,
  Circle,
  Wifi,
  WifiOff,
  Timer,
  TrendingUp,
  Zap,
  Wrench,
  Sparkles,
  ArrowUpDown,
  Eye,
  Megaphone,
  CalendarDays,
  Palmtree,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

type StaffRole = 'super_admin' | 'property_manager' | 'staff' | 'maintenance' | 'cleaner';
type StaffStatus = 'online' | 'offline' | 'away';
type TabId = 'overview' | 'roles' | 'assignments' | 'schedule' | 'performance' | 'communications';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: StaffRole;
  status: StaffStatus;
  assignedProperties: string[];
  activeTasks: number;
  completedTasks: number;
  performanceScore: number;
  avgResponseTime: number; // minutes
  guestSatisfaction: number; // 0-5
  attendanceRate: number; // percentage
  lastActive: string;
  joinedAt: string;
  location: string;
  weeklyAvailability: Record<string, { start: string; end: string } | null>;
  onCall: boolean;
  leaveSchedule: { date: string; type: 'holiday' | 'sick' | 'personal' }[];
}

interface PropertyAssignment {
  propertyId: string;
  propertyName: string;
  primaryManager: string;
  backupManager: string;
  cleaners: string[];
  maintenanceStaff: string[];
}

interface Announcement {
  id: string;
  from: string;
  to: string; // 'all' | role | memberId
  message: string;
  timestamp: string;
  read: boolean;
}

// ── Role Hierarchy & Permissions ───────────────────────────────────────────────

const ROLE_HIERARCHY: { role: StaffRole; label: string; level: number; color: string; icon: typeof Crown }[] = [
  { role: 'super_admin', label: 'Super Admin', level: 5, color: 'text-amber-400', icon: Crown },
  { role: 'property_manager', label: 'Property Manager', level: 4, color: 'text-secondary', icon: Briefcase },
  { role: 'staff', label: 'Staff', level: 3, color: 'text-blue-400', icon: User },
  { role: 'maintenance', label: 'Maintenance', level: 2, color: 'text-orange-400', icon: Wrench },
  { role: 'cleaner', label: 'Cleaner', level: 1, color: 'text-emerald-400', icon: Sparkles },
];

const PERMISSION_MODULES = [
  'properties', 'bookings', 'calendar', 'guests', 'finance', 'maintenance',
  'communications', 'documents', 'tasks', 'reports', 'channels', 'settings', 'team_management',
] as const;

const PERMISSION_MATRIX: Record<StaffRole, Record<string, ('read' | 'create' | 'update' | 'delete')[]>> = {
  super_admin: Object.fromEntries(PERMISSION_MODULES.map(m => [m, ['read', 'create', 'update', 'delete']])),
  property_manager: {
    properties: ['read', 'create', 'update'],
    bookings: ['read', 'create', 'update', 'delete'],
    calendar: ['read', 'create', 'update'],
    guests: ['read', 'create', 'update'],
    finance: ['read', 'create'],
    maintenance: ['read', 'create', 'update', 'delete'],
    communications: ['read', 'create', 'update'],
    documents: ['read', 'create', 'update'],
    tasks: ['read', 'create', 'update', 'delete'],
    reports: ['read'],
    channels: ['read', 'update'],
    settings: ['read'],
    team_management: ['read'],
  },
  staff: {
    properties: ['read'],
    bookings: ['read', 'create', 'update'],
    calendar: ['read', 'update'],
    guests: ['read', 'update'],
    finance: [],
    maintenance: ['read', 'create'],
    communications: ['read', 'create'],
    documents: ['read'],
    tasks: ['read', 'update'],
    reports: [],
    channels: ['read'],
    settings: [],
    team_management: [],
  },
  maintenance: {
    properties: ['read'],
    bookings: [],
    calendar: ['read'],
    guests: [],
    finance: [],
    maintenance: ['read', 'create', 'update'],
    communications: ['read', 'create'],
    documents: ['read'],
    tasks: ['read', 'update'],
    reports: [],
    channels: [],
    settings: [],
    team_management: [],
  },
  cleaner: {
    properties: ['read'],
    bookings: [],
    calendar: ['read'],
    guests: [],
    finance: [],
    maintenance: ['read'],
    communications: ['read'],
    documents: [],
    tasks: ['read', 'update'],
    reports: [],
    channels: [],
    settings: [],
    team_management: [],
  },
};

// ── Mock Data ──────────────────────────────────────────────────────────────────

const PROPERTIES = [
  { id: 'p1', name: 'Villa Elounda Royale' },
  { id: 'p2', name: 'Chania Harbor Suite' },
  { id: 'p3', name: 'Rethymno Beach House' },
  { id: 'p4', name: 'Heraklion City Loft' },
  { id: 'p5', name: 'Agios Nikolaos Villa' },
  { id: 'p6', name: 'Plakias Seaside' },
  { id: 'p7', name: 'Sitia Countryside' },
];

const defaultAvailability: Record<string, { start: string; end: string } | null> = {
  Mon: { start: '08:00', end: '18:00' },
  Tue: { start: '08:00', end: '18:00' },
  Wed: { start: '08:00', end: '18:00' },
  Thu: { start: '08:00', end: '18:00' },
  Fri: { start: '08:00', end: '16:00' },
  Sat: null,
  Sun: null,
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'u1', name: 'Sivan Menahem', email: 'sivan@sivanmanagement.com', phone: '+30 694 123 4567',
    role: 'super_admin', status: 'online', assignedProperties: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
    activeTasks: 5, completedTasks: 312, performanceScore: 98, avgResponseTime: 8,
    guestSatisfaction: 4.9, attendanceRate: 100, lastActive: '2026-04-12T10:30:00',
    joinedAt: '2024-01-01', location: 'Heraklion, Crete',
    weeklyAvailability: { ...defaultAvailability, Sat: { start: '09:00', end: '14:00' } },
    onCall: true,
    leaveSchedule: [],
  },
  {
    id: 'u2', name: 'Maya Cohen', email: 'maya@sivanmanagement.com', phone: '+30 694 234 5678',
    role: 'property_manager', status: 'online', assignedProperties: ['p1', 'p2', 'p3'],
    activeTasks: 8, completedTasks: 245, performanceScore: 94, avgResponseTime: 12,
    guestSatisfaction: 4.8, attendanceRate: 97, lastActive: '2026-04-12T10:15:00',
    joinedAt: '2024-02-01', location: 'Chania, Crete',
    weeklyAvailability: defaultAvailability,
    onCall: false,
    leaveSchedule: [{ date: '2026-04-20', type: 'holiday' }],
  },
  {
    id: 'u3', name: 'Nikos Papadopoulos', email: 'nikos@sivanmanagement.com', phone: '+30 694 345 6789',
    role: 'property_manager', status: 'away', assignedProperties: ['p4', 'p5', 'p6', 'p7'],
    activeTasks: 6, completedTasks: 198, performanceScore: 91, avgResponseTime: 15,
    guestSatisfaction: 4.7, attendanceRate: 95, lastActive: '2026-04-12T09:45:00',
    joinedAt: '2024-03-15', location: 'Rethymno, Crete',
    weeklyAvailability: { ...defaultAvailability, Wed: null },
    onCall: true,
    leaveSchedule: [{ date: '2026-04-15', type: 'personal' }],
  },
  {
    id: 'u4', name: 'Elena Stavrou', email: 'elena@sivanmanagement.com', phone: '+30 694 456 7890',
    role: 'staff', status: 'online', assignedProperties: ['p1', 'p2'],
    activeTasks: 4, completedTasks: 156, performanceScore: 88, avgResponseTime: 18,
    guestSatisfaction: 4.6, attendanceRate: 93, lastActive: '2026-04-12T10:25:00',
    joinedAt: '2024-06-01', location: 'Chania, Crete',
    weeklyAvailability: { ...defaultAvailability, Mon: null, Sat: { start: '09:00', end: '17:00' } },
    onCall: false,
    leaveSchedule: [],
  },
  {
    id: 'u5', name: 'Daniel Levy', email: 'daniel@sivanmanagement.com', phone: '+30 694 567 8901',
    role: 'staff', status: 'offline', assignedProperties: ['p3', 'p4'],
    activeTasks: 3, completedTasks: 134, performanceScore: 85, avgResponseTime: 22,
    guestSatisfaction: 4.4, attendanceRate: 90, lastActive: '2026-04-11T18:30:00',
    joinedAt: '2024-04-01', location: 'Heraklion, Crete',
    weeklyAvailability: defaultAvailability,
    onCall: false,
    leaveSchedule: [{ date: '2026-04-14', type: 'sick' }],
  },
  {
    id: 'u6', name: 'Yiannis Katsarakis', email: 'yiannis@sivanmanagement.com', phone: '+30 694 678 9012',
    role: 'maintenance', status: 'online', assignedProperties: ['p1', 'p2', 'p3', 'p4'],
    activeTasks: 7, completedTasks: 289, performanceScore: 92, avgResponseTime: 25,
    guestSatisfaction: 4.5, attendanceRate: 96, lastActive: '2026-04-12T10:10:00',
    joinedAt: '2024-03-01', location: 'Heraklion, Crete',
    weeklyAvailability: { ...defaultAvailability, Sat: { start: '08:00', end: '13:00' } },
    onCall: true,
    leaveSchedule: [],
  },
  {
    id: 'u7', name: 'Maria Alexiou', email: 'maria@sivanmanagement.com', phone: '+30 694 789 0123',
    role: 'maintenance', status: 'away', assignedProperties: ['p5', 'p6', 'p7'],
    activeTasks: 5, completedTasks: 203, performanceScore: 87, avgResponseTime: 30,
    guestSatisfaction: 4.3, attendanceRate: 91, lastActive: '2026-04-12T08:50:00',
    joinedAt: '2024-05-10', location: 'Agios Nikolaos, Crete',
    weeklyAvailability: defaultAvailability,
    onCall: false,
    leaveSchedule: [{ date: '2026-04-18', type: 'holiday' }, { date: '2026-04-19', type: 'holiday' }],
  },
  {
    id: 'u8', name: 'Katerina Dimitriou', email: 'katerina@sivanmanagement.com', phone: '+30 694 890 1234',
    role: 'cleaner', status: 'online', assignedProperties: ['p1', 'p2', 'p3'],
    activeTasks: 2, completedTasks: 410, performanceScore: 96, avgResponseTime: 10,
    guestSatisfaction: 4.8, attendanceRate: 98, lastActive: '2026-04-12T10:28:00',
    joinedAt: '2024-02-15', location: 'Chania, Crete',
    weeklyAvailability: { ...defaultAvailability, Sat: { start: '07:00', end: '15:00' }, Sun: { start: '08:00', end: '12:00' } },
    onCall: false,
    leaveSchedule: [],
  },
  {
    id: 'u9', name: 'Georgios Manolis', email: 'georgios@sivanmanagement.com', phone: '+30 694 901 2345',
    role: 'cleaner', status: 'offline', assignedProperties: ['p4', 'p5', 'p6', 'p7'],
    activeTasks: 1, completedTasks: 378, performanceScore: 93, avgResponseTime: 14,
    guestSatisfaction: 4.6, attendanceRate: 94, lastActive: '2026-04-11T17:00:00',
    joinedAt: '2024-04-20', location: 'Rethymno, Crete',
    weeklyAvailability: defaultAvailability,
    onCall: false,
    leaveSchedule: [],
  },
  {
    id: 'u10', name: 'Ruth Goldstein', email: 'ruth@sivanmanagement.com', phone: '+30 694 012 3456',
    role: 'staff', status: 'online', assignedProperties: ['p5', 'p6', 'p7'],
    activeTasks: 4, completedTasks: 167, performanceScore: 89, avgResponseTime: 16,
    guestSatisfaction: 4.5, attendanceRate: 92, lastActive: '2026-04-12T10:05:00',
    joinedAt: '2024-07-01', location: 'Sitia, Crete',
    weeklyAvailability: defaultAvailability,
    onCall: false,
    leaveSchedule: [{ date: '2026-04-22', type: 'personal' }],
  },
];

const PROPERTY_ASSIGNMENTS: PropertyAssignment[] = [
  { propertyId: 'p1', propertyName: 'Villa Elounda Royale', primaryManager: 'u2', backupManager: 'u3', cleaners: ['u8'], maintenanceStaff: ['u6'] },
  { propertyId: 'p2', propertyName: 'Chania Harbor Suite', primaryManager: 'u2', backupManager: 'u1', cleaners: ['u8'], maintenanceStaff: ['u6'] },
  { propertyId: 'p3', propertyName: 'Rethymno Beach House', primaryManager: 'u2', backupManager: 'u3', cleaners: ['u8'], maintenanceStaff: ['u6'] },
  { propertyId: 'p4', propertyName: 'Heraklion City Loft', primaryManager: 'u3', backupManager: 'u2', cleaners: ['u9'], maintenanceStaff: ['u6'] },
  { propertyId: 'p5', propertyName: 'Agios Nikolaos Villa', primaryManager: 'u3', backupManager: 'u1', cleaners: ['u9'], maintenanceStaff: ['u7'] },
  { propertyId: 'p6', propertyName: 'Plakias Seaside', primaryManager: 'u3', backupManager: 'u2', cleaners: ['u9'], maintenanceStaff: ['u7'] },
  { propertyId: 'p7', propertyName: 'Sitia Countryside', primaryManager: 'u3', backupManager: 'u1', cleaners: ['u9'], maintenanceStaff: ['u7'] },
];

const ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', from: 'u1', to: 'all', message: 'Team meeting this Thursday at 10:00. Please prepare your weekly reports.', timestamp: '2026-04-12T09:00:00', read: true },
  { id: 'a2', from: 'u1', to: 'property_manager', message: 'New check-in procedure starting next week. Review the updated guide in Documents.', timestamp: '2026-04-11T14:30:00', read: true },
  { id: 'a3', from: 'u2', to: 'cleaner', message: 'Turnover schedule updated for the weekend. Check the calendar for your assigned properties.', timestamp: '2026-04-11T11:00:00', read: false },
  { id: 'a4', from: 'u3', to: 'u6', message: 'Pool pump at Agios Nikolaos Villa needs inspection before the weekend guests arrive.', timestamp: '2026-04-10T16:45:00', read: true },
  { id: 'a5', from: 'u1', to: 'all', message: 'Great job everyone! April occupancy is at 92%. Keep up the excellent work!', timestamp: '2026-04-09T10:00:00', read: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMemberName(id: string): string {
  return TEAM_MEMBERS.find(m => m.id === id)?.name ?? id;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function statusColor(status: StaffStatus): string {
  return status === 'online' ? 'bg-emerald-400' : status === 'away' ? 'bg-amber-400' : 'bg-zinc-500';
}

function statusLabel(status: StaffStatus): string {
  return status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline';
}

function roleInfo(role: StaffRole) {
  return ROLE_HIERARCHY.find(r => r.role === role)!;
}

function timeAgo(isoDate: string): string {
  const now = new Date('2026-04-12T10:30:00');
  const d = new Date(isoDate);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function scoreColor(score: number): string {
  if (score >= 95) return 'text-emerald-400';
  if (score >= 85) return 'text-blue-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

// ── Tab Components ─────────────────────────────────────────────────────────────

/* ── 1. Team Overview ─────────────────────────────────────────────────────── */

function TeamOverviewTab({
  members,
  search,
  roleFilter,
  statusFilter,
}: {
  members: TeamMember[];
  search: string;
  roleFilter: StaffRole | 'all';
  statusFilter: StaffStatus | 'all';
}) {
  const filtered = useMemo(() => {
    return members.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [members, search, roleFilter, statusFilter]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map(member => {
        const ri = roleInfo(member.role);
        const RoleIcon = ri.icon;
        return (
          <div key={member.id} className="glass-card p-5 rounded-xl hover:ring-1 hover:ring-secondary/20 transition-all group">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-sm font-bold text-secondary">
                  {getInitials(member.name)}
                </div>
                <span className={`absolute -bottom-0.5 -end-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${statusColor(member.status)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold truncate">{member.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleIcon className={`w-3 h-3 ${ri.color}`} />
                  <span className={`text-xs font-medium ${ri.color}`}>{ri.label}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {member.location}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                member.status === 'online' ? 'bg-emerald-500/15 text-emerald-400' :
                member.status === 'away' ? 'bg-amber-500/15 text-amber-400' :
                'bg-zinc-500/15 text-zinc-400'
              }`}>
                {statusLabel(member.status)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  <Building2 className="w-3 h-3" />
                  <span className="text-[10px]">Properties</span>
                </div>
                <p className="text-lg font-headline font-bold">{member.assignedProperties.length}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[10px]">Active Tasks</span>
                </div>
                <p className="text-lg font-headline font-bold">{member.activeTasks}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  <Star className="w-3 h-3" />
                  <span className="text-[10px]">Performance</span>
                </div>
                <p className={`text-lg font-headline font-bold ${scoreColor(member.performanceScore)}`}>
                  {member.performanceScore}%
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  <Timer className="w-3 h-3" />
                  <span className="text-[10px]">Avg Response</span>
                </div>
                <p className="text-lg font-headline font-bold">{member.avgResponseTime}m</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Last active {timeAgo(member.lastActive)}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant transition-colors" title="Message">
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-on-surface-variant transition-colors" title="Edit">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="col-span-full glass-card p-12 rounded-xl text-center">
          <Users className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant">No team members match your filters</p>
        </div>
      )}
    </div>
  );
}

/* ── 2. Role Management ───────────────────────────────────────────────────── */

function RoleManagementTab({ members }: { members: TeamMember[] }) {
  const [expandedRole, setExpandedRole] = useState<StaffRole | null>('super_admin');

  return (
    <div className="space-y-6">
      {/* Role Hierarchy Visual */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary" />
          Role Hierarchy
        </h3>
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          {ROLE_HIERARCHY.map((r, i) => {
            const Icon = r.icon;
            const count = members.filter(m => m.role === r.role).length;
            return (
              <div key={r.role} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-14 h-14 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${expandedRole === r.role ? 'ring-2 ring-secondary/40' : ''}`}>
                    <Icon className={`w-6 h-6 ${r.color}`} />
                  </div>
                  <span className="text-[10px] font-semibold text-on-surface-variant">{r.label}</span>
                  <span className="text-[10px] text-on-surface-variant/60">{count} {count === 1 ? 'member' : 'members'}</span>
                </div>
                {i < ROLE_HIERARCHY.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-on-surface-variant/30 mb-8" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix per Role */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-secondary" />
          Permission Matrix
        </h3>
        <div className="space-y-2">
          {ROLE_HIERARCHY.map(r => {
            const Icon = r.icon;
            const isExpanded = expandedRole === r.role;
            const perms = PERMISSION_MATRIX[r.role];
            return (
              <div key={r.role} className="rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedRole(isExpanded ? null : r.role)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${r.color}`} />
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs text-on-surface-variant">Level {r.level}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-start px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Module</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Read</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Create</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Update</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PERMISSION_MODULES.map(mod => {
                            const actions = perms[mod] ?? [];
                            return (
                              <tr key={mod} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="px-3 py-2 font-medium capitalize">{mod.replace('_', ' ')}</td>
                                {(['read', 'create', 'update', 'delete'] as const).map(action => (
                                  <td key={action} className="px-3 py-2 text-center">
                                    {actions.includes(action) ? (
                                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <X className="w-4 h-4 text-white/10 mx-auto" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Role Creation */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-secondary" />
            Custom Roles
          </h3>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Create Custom Role
          </button>
        </div>
        <div className="bg-white/[0.02] rounded-lg p-8 text-center border border-dashed border-white/10">
          <Zap className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">No custom roles defined yet</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Create custom roles with specific permissions tailored to your team structure</p>
        </div>
      </div>
    </div>
  );
}

/* ── 3. Property Assignments ──────────────────────────────────────────────── */

function PropertyAssignmentsTab({ members, assignments }: { members: TeamMember[]; assignments: PropertyAssignment[] }) {
  return (
    <div className="space-y-6">
      {/* Assignment Matrix */}
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-secondary" />
            Property Assignment Matrix
          </h3>
          <button className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Reassign
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-start px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase">Property</th>
                <th className="text-start px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase">Primary Manager</th>
                <th className="text-start px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase">Backup Manager</th>
                <th className="text-start px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase">Cleaners</th>
                <th className="text-start px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase">Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.propertyId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-secondary" />
                      <span className="font-medium">{a.propertyName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <PersonBadge member={members.find(m => m.id === a.primaryManager)!} isPrimary />
                  </td>
                  <td className="px-3 py-3">
                    <PersonBadge member={members.find(m => m.id === a.backupManager)!} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {a.cleaners.map(cid => (
                        <PersonBadge key={cid} member={members.find(m => m.id === cid)!} compact />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {a.maintenanceStaff.map(mid => (
                        <PersonBadge key={mid} member={members.find(m => m.id === mid)!} compact />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs text-on-surface-variant mb-3">Manager Coverage</h4>
          {members.filter(m => m.role === 'property_manager').map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{m.name}</span>
              <span className="text-xs text-on-surface-variant">
                {assignments.filter(a => a.primaryManager === m.id).length} primary /
                {' '}{assignments.filter(a => a.backupManager === m.id).length} backup
              </span>
            </div>
          ))}
        </div>
        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs text-on-surface-variant mb-3">Cleaner Coverage</h4>
          {members.filter(m => m.role === 'cleaner').map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{m.name}</span>
              <span className="text-xs text-on-surface-variant">
                {assignments.filter(a => a.cleaners.includes(m.id)).length} properties
              </span>
            </div>
          ))}
        </div>
        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs text-on-surface-variant mb-3">Maintenance Coverage</h4>
          {members.filter(m => m.role === 'maintenance').map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{m.name}</span>
              <span className="text-xs text-on-surface-variant">
                {assignments.filter(a => a.maintenanceStaff.includes(m.id)).length} properties
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonBadge({ member, isPrimary, compact }: { member: TeamMember; isPrimary?: boolean; compact?: boolean }) {
  if (!member) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-default`}>
      <div className="relative">
        <div className={`${compact ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]'} rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary`}>
          {getInitials(member.name)}
        </div>
        <span className={`absolute -bottom-px -end-px ${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full border border-surface ${statusColor(member.status)}`} />
      </div>
      <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium`}>{member.name.split(' ')[0]}</span>
      {isPrimary && <Crown className="w-3 h-3 text-amber-400" />}
    </div>
  );
}

/* ── 4. Shift Scheduling ──────────────────────────────────────────────────── */

function ShiftScheduleTab({ members }: { members: TeamMember[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedWeek] = useState('Apr 7 - Apr 13, 2026');

  return (
    <div className="space-y-6">
      {/* Week Header */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="text-center">
          <h3 className="text-sm font-semibold flex items-center gap-2 justify-center">
            <CalendarDays className="w-4 h-4 text-secondary" />
            {selectedWeek}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Weekly shift schedule</p>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Schedule Grid */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-start px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase sticky start-0 bg-surface z-10 min-w-[160px]">
                  Team Member
                </th>
                {days.map(day => (
                  <th key={day} className="text-center px-3 py-3 text-xs font-semibold text-on-surface-variant uppercase min-w-[110px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const ri = roleInfo(member.role);
                return (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 sticky start-0 bg-surface z-10">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                            {getInitials(member.name)}
                          </div>
                          <span className={`absolute -bottom-px -end-px w-2 h-2 rounded-full border border-surface ${statusColor(member.status)}`} />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{member.name}</p>
                          <p className={`text-[10px] ${ri.color}`}>{ri.label}</p>
                        </div>
                        {member.onCall && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">ON-CALL</span>
                        )}
                      </div>
                    </td>
                    {days.map(day => {
                      const slot = member.weeklyAvailability[day];
                      const leaveOnDay = member.leaveSchedule.find(l => {
                        const d = new Date(l.date);
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        return dayNames[d.getDay()] === day;
                      });
                      if (leaveOnDay) {
                        const leaveColors = {
                          holiday: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
                          sick: 'bg-red-500/15 text-red-400 border-red-500/20',
                          personal: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
                        };
                        const leaveIcons = {
                          holiday: Palmtree,
                          sick: AlertCircle,
                          personal: User,
                        };
                        const LeaveIcon = leaveIcons[leaveOnDay.type];
                        return (
                          <td key={day} className="px-2 py-3 text-center">
                            <div className={`rounded-lg px-2 py-2 border ${leaveColors[leaveOnDay.type]}`}>
                              <LeaveIcon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                              <p className="text-[10px] capitalize font-medium">{leaveOnDay.type}</p>
                            </div>
                          </td>
                        );
                      }
                      if (!slot) {
                        return (
                          <td key={day} className="px-2 py-3 text-center">
                            <div className="rounded-lg px-2 py-2 bg-white/[0.02] border border-white/5">
                              <p className="text-[10px] text-on-surface-variant/40">Off</p>
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={day} className="px-2 py-3 text-center">
                          <div className="rounded-lg px-2 py-2 bg-emerald-500/10 border border-emerald-500/15">
                            <p className="text-[10px] font-medium text-emerald-400">{slot.start}</p>
                            <p className="text-[8px] text-emerald-400/60">to</p>
                            <p className="text-[10px] font-medium text-emerald-400">{slot.end}</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/15" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/[0.02] border border-white/5" /> Off</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/15 border border-purple-500/20" /> Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/15 border border-red-500/20" /> Sick</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/15 border border-blue-500/20" /> Personal</span>
        <span className="flex items-center gap-1.5"><span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">ON-CALL</span> On-call duty</span>
      </div>
    </div>
  );
}

/* ── 5. Performance Metrics ───────────────────────────────────────────────── */

function PerformanceTab({ members }: { members: TeamMember[] }) {
  const [selectedMember, setSelectedMember] = useState<string>(members[0]?.id ?? '');
  const member = members.find(m => m.id === selectedMember);

  const teamBarData = useMemo(() => members.map(m => ({
    name: m.name.split(' ')[0],
    completed: m.completedTasks,
    active: m.activeTasks,
    score: m.performanceScore,
  })), [members]);

  const radarData = useMemo(() => {
    if (!member) return [];
    return [
      { metric: 'Task Completion', value: Math.round((member.completedTasks / (member.completedTasks + member.activeTasks)) * 100) },
      { metric: 'Response Time', value: Math.max(0, 100 - member.avgResponseTime * 2) },
      { metric: 'Guest Satisfaction', value: member.guestSatisfaction * 20 },
      { metric: 'Attendance', value: member.attendanceRate },
      { metric: 'Performance', value: member.performanceScore },
    ];
  }, [member]);

  const monthlyTrend = useMemo(() => {
    if (!member) return [];
    const base = member.performanceScore;
    return [
      { month: 'Nov', score: Math.max(60, base - 12 + Math.round(Math.random() * 6)) },
      { month: 'Dec', score: Math.max(60, base - 8 + Math.round(Math.random() * 6)) },
      { month: 'Jan', score: Math.max(60, base - 5 + Math.round(Math.random() * 4)) },
      { month: 'Feb', score: Math.max(60, base - 3 + Math.round(Math.random() * 4)) },
      { month: 'Mar', score: Math.max(60, base - 1 + Math.round(Math.random() * 2)) },
      { month: 'Apr', score: base },
    ];
  }, [member]);

  return (
    <div className="space-y-6">
      {/* Team Comparison Bar Chart */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-secondary" />
          Team Comparison - Tasks
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" name="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Selector */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-semibold text-on-surface-variant mb-3">Select Team Member</h4>
            {members.map(m => {
              const ri = roleInfo(m.role);
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`w-full text-start p-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedMember === m.id ? 'bg-secondary/10 ring-1 ring-secondary/30' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.name}</p>
                    <p className={`text-[10px] ${ri.color}`}>{ri.label}</p>
                  </div>
                  <span className={`text-sm font-bold ${scoreColor(m.performanceScore)}`}>{m.performanceScore}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance Details */}
        <div className="lg:col-span-2 space-y-4">
          {member && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass-card p-4 rounded-xl text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xl font-headline font-bold">{member.completedTasks}</p>
                  <p className="text-[10px] text-on-surface-variant">Completed Tasks</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <Timer className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xl font-headline font-bold">{member.avgResponseTime}m</p>
                  <p className="text-[10px] text-on-surface-variant">Avg Response</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-xl font-headline font-bold">{member.guestSatisfaction}</p>
                  <p className="text-[10px] text-on-surface-variant">Guest Rating</p>
                </div>
                <div className="glass-card p-4 rounded-xl text-center">
                  <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-xl font-headline font-bold">{member.attendanceRate}%</p>
                  <p className="text-[10px] text-on-surface-variant">Attendance</p>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="glass-card p-6 rounded-xl">
                <h4 className="text-sm font-semibold mb-4">Performance Radar - {member.name}</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                      <Radar
                        name={member.name}
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="glass-card p-6 rounded-xl">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  Performance Trend (6 Months)
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis domain={[50, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 6. Team Communications ───────────────────────────────────────────────── */

function CommunicationsTab({ members, announcements }: { members: TeamMember[]; announcements: Announcement[] }) {
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('all');

  const recipientLabel = (to: string) => {
    if (to === 'all') return 'Everyone';
    const roleMatch = ROLE_HIERARCHY.find(r => r.role === to);
    if (roleMatch) return `All ${roleMatch.label}s`;
    return getMemberName(to);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Compose */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-secondary" />
            Send Message
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">To</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm"
              >
                <option value="all">Everyone</option>
                <optgroup label="By Role">
                  {ROLE_HIERARCHY.map(r => (
                    <option key={r.role} value={r.role}>All {r.label}s</option>
                  ))}
                </optgroup>
                <optgroup label="Individual">
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-xs text-on-surface-variant mb-1 block">Message</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                placeholder="Type your message..."
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm placeholder:text-on-surface-variant/50 resize-none"
              />
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5 rounded-xl">
          <h4 className="text-xs font-semibold text-on-surface-variant mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full text-start p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center gap-2 text-xs">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Start Group Call
            </button>
            <button className="w-full text-start p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center gap-2 text-xs">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              Send Email to Team
            </button>
            <button className="w-full text-start p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center gap-2 text-xs">
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="lg:col-span-2">
        <div className="glass-card p-5 rounded-xl">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            Recent Messages & Announcements
          </h3>
          <div className="space-y-3">
            {announcements.map(a => {
              const sender = members.find(m => m.id === a.from);
              return (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border ${a.read ? 'bg-white/[0.02] border-white/5' : 'bg-secondary/5 border-secondary/20'} transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary flex-shrink-0">
                      {sender ? getInitials(sender.name) : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{sender?.name ?? 'Unknown'}</span>
                        <ChevronRight className="w-3 h-3 text-on-surface-variant/40" />
                        <span className="text-xs text-on-surface-variant">{recipientLabel(a.to)}</span>
                        {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </div>
                      <p className="text-sm text-on-surface/80 leading-relaxed">{a.message}</p>
                      <p className="text-[10px] text-on-surface-variant mt-2 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(a.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Team Overview', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'assignments', label: 'Property Assignments', icon: Building2 },
  { id: 'schedule', label: 'Shift Schedule', icon: CalendarDays },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
];

export default function TeamManagementPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all');

  const onlineCount = TEAM_MEMBERS.filter(m => m.status === 'online').length;
  const awayCount = TEAM_MEMBERS.filter(m => m.status === 'away').length;
  const avgPerformance = Math.round(TEAM_MEMBERS.reduce((s, m) => s + m.performanceScore, 0) / TEAM_MEMBERS.length);
  const totalActiveTasks = TEAM_MEMBERS.reduce((s, m) => s + m.activeTasks, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-secondary" />
            Team Management
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage your team, roles, schedules, and performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm hover:bg-secondary/90 transition-colors">
          <UserPlus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant">Total Members</p>
          <p className="text-2xl font-headline font-bold mt-1">{TEAM_MEMBERS.length}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-400" /> Online Now
          </p>
          <p className="text-2xl font-headline font-bold mt-1 text-emerald-400">{onlineCount}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <Circle className="w-3 h-3 text-amber-400" /> Away
          </p>
          <p className="text-2xl font-headline font-bold mt-1 text-amber-400">{awayCount}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <Award className="w-3 h-3 text-secondary" /> Avg Performance
          </p>
          <p className={`text-2xl font-headline font-bold mt-1 ${scoreColor(avgPerformance)}`}>{avgPerformance}%</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" /> Active Tasks
          </p>
          <p className="text-2xl font-headline font-bold mt-1">{totalActiveTasks}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/10">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/[0.06] text-secondary border-b-2 border-secondary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters (for overview tab) */}
      {activeTab === 'overview' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full ps-9 pe-3 py-2 rounded-lg border border-white/10 bg-surface text-sm placeholder:text-on-surface-variant/50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')}
            className="px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm"
          >
            <option value="all">All Roles</option>
            {ROLE_HIERARCHY.map(r => (
              <option key={r.role} value={r.role}>{r.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StaffStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-white/10 bg-surface text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="online">Online</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <TeamOverviewTab members={TEAM_MEMBERS} search={search} roleFilter={roleFilter} statusFilter={statusFilter} />
      )}
      {activeTab === 'roles' && (
        <RoleManagementTab members={TEAM_MEMBERS} />
      )}
      {activeTab === 'assignments' && (
        <PropertyAssignmentsTab members={TEAM_MEMBERS} assignments={PROPERTY_ASSIGNMENTS} />
      )}
      {activeTab === 'schedule' && (
        <ShiftScheduleTab members={TEAM_MEMBERS} />
      )}
      {activeTab === 'performance' && (
        <PerformanceTab members={TEAM_MEMBERS} />
      )}
      {activeTab === 'communications' && (
        <CommunicationsTab members={TEAM_MEMBERS} announcements={ANNOUNCEMENTS} />
      )}
    </div>
  );
}
