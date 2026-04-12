import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Plus,
  Zap,
  Play,
  Pause,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  ArrowRight,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Workflow,
  GitBranch,
  Mail,
  MessageSquare,
  ClipboardList,
  FileText,
  Bell,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Timer,
  TrendingUp,
  BarChart3,
  Eye,
  Copy,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

type TriggerType =
  | 'NEW_BOOKING'
  | 'BOOKING_MODIFIED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'MAINTENANCE_REQUEST'
  | 'OWNER_APPROVAL'
  | 'SCHEDULED_CRON'
  | 'NEW_EXPENSE'
  | 'PAYMENT_RECEIVED'
  | 'GUEST_CREATED'
  | 'DOCUMENT_EXPIRING'
  | 'REVIEW_RECEIVED';

type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_WHATSAPP'
  | 'CREATE_TASK'
  | 'UPDATE_STATUS'
  | 'NOTIFY_OWNER'
  | 'GENERATE_DOCUMENT'
  | 'CREATE_NOTIFICATION'
  | 'ASSIGN_TO'
  | 'ADD_TAG'
  | 'SEND_WEBHOOK'
  | 'DELAY'
  | 'APPROVE_EXPENSE';

type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';

type RunStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

interface AutomationAction {
  type: ActionType;
  config: Record<string, string>;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerCategory: 'booking' | 'schedule' | 'condition' | 'operations' | 'finance';
  isActive: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  lastRunAt: string | null;
  successRate: number;
  runCount: number;
  createdAt: string;
}

interface AutomationRun {
  id: string;
  automationId: string;
  automationName: string;
  triggerEvent: string;
  timestamp: string;
  status: RunStatus;
  duration: number; // ms
  actionsExecuted: number;
  errorMessage?: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerCategory: 'booking' | 'schedule' | 'condition' | 'operations' | 'finance';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  icon: string;
  popular: boolean;
}

// ── Wizard State ──────────────────────────────────────────────────────────────

interface WizardState {
  step: number; // 1-4
  name: string;
  description: string;
  triggerType: TriggerType | null;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  cronExpression: string;
  triggerConfig: Record<string, string>;
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type TabView = 'automations' | 'templates' | 'history' | 'analytics';

// ── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS: {
  type: TriggerType;
  label: string;
  description: string;
  category: 'booking' | 'schedule' | 'condition' | 'operations' | 'finance';
  icon: string;
  color: string;
}[] = [
  { type: 'NEW_BOOKING', label: 'New Booking', description: 'Fires when a new booking is created', category: 'booking', icon: 'calendar', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { type: 'BOOKING_MODIFIED', label: 'Booking Modified', description: 'Fires when a booking is updated', category: 'booking', icon: 'edit', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { type: 'CHECK_IN', label: 'Check-in', description: 'Fires on guest check-in day', category: 'booking', icon: 'login', color: 'bg-success/10 text-success border-success/20' },
  { type: 'CHECK_OUT', label: 'Check-out', description: 'Fires on guest check-out day', category: 'booking', icon: 'logout', color: 'bg-success/10 text-success border-success/20' },
  { type: 'MAINTENANCE_REQUEST', label: 'Maintenance Request', description: 'Fires when maintenance is requested', category: 'operations', icon: 'wrench', color: 'bg-warning/10 text-warning border-warning/20' },
  { type: 'OWNER_APPROVAL', label: 'Owner Approval', description: 'Fires when owner approval is needed', category: 'operations', icon: 'user-check', color: 'bg-warning/10 text-warning border-warning/20' },
  { type: 'SCHEDULED_CRON', label: 'Scheduled / Cron', description: 'Runs on a recurring schedule', category: 'schedule', icon: 'clock', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  { type: 'NEW_EXPENSE', label: 'New Expense', description: 'Fires when an expense is created', category: 'finance', icon: 'dollar', color: 'bg-error/10 text-error border-error/20' },
  { type: 'PAYMENT_RECEIVED', label: 'Payment Received', description: 'Fires when payment is received', category: 'finance', icon: 'credit-card', color: 'bg-success/10 text-success border-success/20' },
  { type: 'GUEST_CREATED', label: 'Guest Created', description: 'Fires when a new guest is added', category: 'booking', icon: 'user-plus', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { type: 'DOCUMENT_EXPIRING', label: 'Document Expiring', description: 'Fires before document expiration', category: 'condition', icon: 'file-warning', color: 'bg-error/10 text-error border-error/20' },
  { type: 'REVIEW_RECEIVED', label: 'Review Received', description: 'Fires when a guest review is received', category: 'booking', icon: 'star', color: 'bg-warning/10 text-warning border-warning/20' },
];

const ACTION_OPTIONS: { type: ActionType; label: string; color: string }[] = [
  { type: 'SEND_EMAIL', label: 'Send Email', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'SEND_WHATSAPP', label: 'Send WhatsApp', color: 'bg-success/10 text-success' },
  { type: 'CREATE_TASK', label: 'Create Task', color: 'bg-warning/10 text-warning' },
  { type: 'UPDATE_STATUS', label: 'Update Status', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'NOTIFY_OWNER', label: 'Notify Owner', color: 'bg-secondary/10 text-secondary' },
  { type: 'GENERATE_DOCUMENT', label: 'Generate Document', color: 'bg-outline-variant/20 text-on-surface-variant' },
  { type: 'CREATE_NOTIFICATION', label: 'Create Notification', color: 'bg-secondary/10 text-secondary' },
  { type: 'ASSIGN_TO', label: 'Assign To', color: 'bg-warning/10 text-warning' },
  { type: 'ADD_TAG', label: 'Add Tag', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'SEND_WEBHOOK', label: 'Send Webhook', color: 'bg-outline-variant/20 text-on-surface-variant' },
  { type: 'DELAY', label: 'Delay', color: 'bg-warning/10 text-warning' },
  { type: 'APPROVE_EXPENSE', label: 'Approve Expense', color: 'bg-success/10 text-success' },
];

const CONDITION_FIELDS = [
  { value: 'property.id', label: 'Property' },
  { value: 'property.city', label: 'Property City' },
  { value: 'booking.totalAmount', label: 'Booking Amount' },
  { value: 'booking.nights', label: 'Booking Nights' },
  { value: 'booking.source', label: 'Booking Source' },
  { value: 'guest.type', label: 'Guest Type' },
  { value: 'guest.totalStays', label: 'Guest Stay Count' },
  { value: 'expense.amount', label: 'Expense Amount' },
  { value: 'expense.category', label: 'Expense Category' },
  { value: 'maintenance.priority', label: 'Maintenance Priority' },
];

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: '=',
  not_equals: '\u2260',
  greater_than: '>',
  less_than: '<',
  contains: 'contains',
  in: 'in',
};

// ── Mock Automations ──────────────────────────────────────────────────────────

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-001',
    name: 'Welcome Guest Before Check-in',
    description: 'Send a WhatsApp welcome message 24 hours before guest check-in with property details and local tips.',
    triggerType: 'CHECK_IN',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [],
    actions: [{ type: 'SEND_WHATSAPP', config: { template: 'welcome_checkin', message: 'Welcome to your stay!', offset: '-24h' } }],
    lastRunAt: '2026-04-12T08:00:00Z',
    successRate: 96,
    runCount: 142,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'auto-002',
    name: 'Notify Owner of New Booking',
    description: 'Email and WhatsApp the property owner when a new booking is confirmed.',
    triggerType: 'NEW_BOOKING',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [],
    actions: [
      { type: 'SEND_EMAIL', config: { template: 'owner_new_booking', recipient: 'owner.email' } },
      { type: 'SEND_WHATSAPP', config: { template: 'owner_booking_alert', phoneField: 'owner.phone' } },
    ],
    lastRunAt: '2026-04-11T16:22:00Z',
    successRate: 100,
    runCount: 89,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'auto-003',
    name: 'Create Cleaning Task After Checkout',
    description: 'Automatically create a high-priority cleaning task when a guest checks out.',
    triggerType: 'CHECK_OUT',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [],
    actions: [{ type: 'CREATE_TASK', config: { title: 'Post-checkout deep cleaning', taskType: 'CLEANING', priority: 'HIGH', dueDateOffset: '4', dueDateUnit: 'hours' } }],
    lastRunAt: '2026-04-12T10:00:00Z',
    successRate: 100,
    runCount: 156,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'auto-004',
    name: 'Payment Reminder',
    description: 'Send email reminder 3 days before payment is due.',
    triggerType: 'SCHEDULED_CRON',
    triggerCategory: 'schedule',
    isActive: true,
    conditions: [{ field: 'booking.totalAmount', operator: 'greater_than', value: '0' }],
    actions: [{ type: 'SEND_EMAIL', config: { template: 'payment_reminder', recipient: 'guest.email', subject: 'Payment reminder for your upcoming stay' } }],
    lastRunAt: '2026-04-12T06:00:00Z',
    successRate: 92,
    runCount: 67,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'auto-005',
    name: 'Auto-Approve Small Expenses',
    description: 'Automatically approve expenses under 100 EUR threshold.',
    triggerType: 'NEW_EXPENSE',
    triggerCategory: 'finance',
    isActive: true,
    conditions: [{ field: 'expense.amount', operator: 'less_than', value: '100' }],
    actions: [{ type: 'APPROVE_EXPENSE', config: { reason: 'Auto-approved: under threshold' } }],
    lastRunAt: '2026-04-11T14:05:00Z',
    successRate: 100,
    runCount: 34,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'auto-006',
    name: 'VIP Guest Welcome Package',
    description: 'Create a task to prepare a VIP welcome package for returning guests with 3+ stays.',
    triggerType: 'NEW_BOOKING',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [{ field: 'guest.totalStays', operator: 'greater_than', value: '2' }],
    actions: [
      { type: 'CREATE_TASK', config: { title: 'Prepare VIP welcome package', taskType: 'GUEST_RELATED', priority: 'HIGH' } },
      { type: 'SEND_WHATSAPP', config: { template: 'vip_welcome_back', phoneField: 'guest.phone' } },
    ],
    lastRunAt: '2026-04-10T11:30:00Z',
    successRate: 88,
    runCount: 24,
    createdAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'auto-007',
    name: 'Maintenance Alert to Owner',
    description: 'Notify property owner via email when a maintenance request is created.',
    triggerType: 'MAINTENANCE_REQUEST',
    triggerCategory: 'operations',
    isActive: false,
    conditions: [{ field: 'maintenance.priority', operator: 'in', value: 'HIGH,URGENT' }],
    actions: [
      { type: 'NOTIFY_OWNER', config: { method: 'email', template: 'maintenance_alert' } },
      { type: 'CREATE_NOTIFICATION', config: { title: 'Urgent Maintenance', priority: 'HIGH' } },
    ],
    lastRunAt: '2026-04-08T09:12:00Z',
    successRate: 75,
    runCount: 12,
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'auto-008',
    name: 'Post-Stay Review Request',
    description: 'Send a review request email 2 days after guest check-out.',
    triggerType: 'CHECK_OUT',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [],
    actions: [
      { type: 'DELAY', config: { duration: '2', unit: 'days' } },
      { type: 'SEND_EMAIL', config: { template: 'review_request', recipient: 'guest.email', subject: 'How was your stay?' } },
    ],
    lastRunAt: '2026-04-10T10:00:00Z',
    successRate: 94,
    runCount: 108,
    createdAt: '2026-01-25T00:00:00Z',
  },
  {
    id: 'auto-009',
    name: 'Document Expiry Warning',
    description: 'Send notification 30 days before property documents expire.',
    triggerType: 'DOCUMENT_EXPIRING',
    triggerCategory: 'condition',
    isActive: true,
    conditions: [],
    actions: [
      { type: 'CREATE_NOTIFICATION', config: { title: 'Document expiring soon', priority: 'HIGH' } },
      { type: 'SEND_EMAIL', config: { template: 'doc_expiry_warning', recipient: 'admin.email' } },
    ],
    lastRunAt: '2026-04-05T07:00:00Z',
    successRate: 100,
    runCount: 8,
    createdAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'auto-010',
    name: 'High-Value Booking Alert',
    description: 'Send immediate notification for bookings over 3,000 EUR.',
    triggerType: 'NEW_BOOKING',
    triggerCategory: 'booking',
    isActive: true,
    conditions: [{ field: 'booking.totalAmount', operator: 'greater_than', value: '3000' }],
    actions: [{ type: 'CREATE_NOTIFICATION', config: { title: 'High-value booking received', message: 'Booking exceeds 3,000 EUR', priority: 'HIGH' } }],
    lastRunAt: '2026-04-09T18:42:00Z',
    successRate: 100,
    runCount: 15,
    createdAt: '2026-02-10T00:00:00Z',
  },
];

// ── Mock Run History ──────────────────────────────────────────────────────────

const MOCK_RUNS: AutomationRun[] = [
  { id: 'run-001', automationId: 'auto-003', automationName: 'Create Cleaning Task After Checkout', triggerEvent: 'CHECK_OUT - Elounda Breeze Villa', timestamp: '2026-04-12T10:00:00Z', status: 'SUCCESS', duration: 245, actionsExecuted: 1 },
  { id: 'run-002', automationId: 'auto-001', automationName: 'Welcome Guest Before Check-in', triggerEvent: 'CHECK_IN - Heraklion Harbor Suite (tomorrow)', timestamp: '2026-04-12T08:00:00Z', status: 'SUCCESS', duration: 1820, actionsExecuted: 1 },
  { id: 'run-003', automationId: 'auto-004', automationName: 'Payment Reminder', triggerEvent: 'CRON - Daily 06:00', timestamp: '2026-04-12T06:00:00Z', status: 'SUCCESS', duration: 3450, actionsExecuted: 3 },
  { id: 'run-004', automationId: 'auto-002', automationName: 'Notify Owner of New Booking', triggerEvent: 'NEW_BOOKING - Chania Old Town Residence', timestamp: '2026-04-11T16:22:00Z', status: 'SUCCESS', duration: 890, actionsExecuted: 2 },
  { id: 'run-005', automationId: 'auto-005', automationName: 'Auto-Approve Small Expenses', triggerEvent: 'NEW_EXPENSE - Cleaning supplies (45 EUR)', timestamp: '2026-04-11T14:05:00Z', status: 'SUCCESS', duration: 120, actionsExecuted: 1 },
  { id: 'run-006', automationId: 'auto-006', automationName: 'VIP Guest Welcome Package', triggerEvent: 'NEW_BOOKING - Maria P. (4th stay)', timestamp: '2026-04-10T11:30:00Z', status: 'FAILED', duration: 2100, actionsExecuted: 1, errorMessage: 'WhatsApp delivery failed: phone number not verified for template messages' },
  { id: 'run-007', automationId: 'auto-008', automationName: 'Post-Stay Review Request', triggerEvent: 'CHECK_OUT - Rethymno Sunset Apartment', timestamp: '2026-04-10T10:00:00Z', status: 'SUCCESS', duration: 310, actionsExecuted: 2 },
  { id: 'run-008', automationId: 'auto-003', automationName: 'Create Cleaning Task After Checkout', triggerEvent: 'CHECK_OUT - Rethymno Sunset Apartment', timestamp: '2026-04-10T10:00:00Z', status: 'SUCCESS', duration: 198, actionsExecuted: 1 },
  { id: 'run-009', automationId: 'auto-002', automationName: 'Notify Owner of New Booking', triggerEvent: 'NEW_BOOKING - Elounda Breeze Villa', timestamp: '2026-04-09T18:42:00Z', status: 'SUCCESS', duration: 920, actionsExecuted: 2 },
  { id: 'run-010', automationId: 'auto-010', automationName: 'High-Value Booking Alert', triggerEvent: 'NEW_BOOKING - Elounda Breeze Villa (3,250 EUR)', timestamp: '2026-04-09T18:42:00Z', status: 'SUCCESS', duration: 85, actionsExecuted: 1 },
  { id: 'run-011', automationId: 'auto-001', automationName: 'Welcome Guest Before Check-in', triggerEvent: 'CHECK_IN - Chania Old Town Residence', timestamp: '2026-04-09T08:00:00Z', status: 'SKIPPED', duration: 12, actionsExecuted: 0, errorMessage: 'Guest opted out of WhatsApp notifications' },
  { id: 'run-012', automationId: 'auto-007', automationName: 'Maintenance Alert to Owner', triggerEvent: 'MAINTENANCE_REQUEST - Plumbing issue, Elounda', timestamp: '2026-04-08T09:12:00Z', status: 'FAILED', duration: 5200, actionsExecuted: 0, errorMessage: 'Owner email bounced: mailbox full' },
  { id: 'run-013', automationId: 'auto-004', automationName: 'Payment Reminder', triggerEvent: 'CRON - Daily 06:00', timestamp: '2026-04-08T06:00:00Z', status: 'SUCCESS', duration: 2800, actionsExecuted: 2 },
  { id: 'run-014', automationId: 'auto-009', automationName: 'Document Expiry Warning', triggerEvent: 'DOCUMENT_EXPIRING - Fire Safety Certificate', timestamp: '2026-04-05T07:00:00Z', status: 'SUCCESS', duration: 450, actionsExecuted: 2 },
  { id: 'run-015', automationId: 'auto-003', automationName: 'Create Cleaning Task After Checkout', triggerEvent: 'CHECK_OUT - Heraklion Harbor Suite', timestamp: '2026-04-04T11:00:00Z', status: 'SUCCESS', duration: 210, actionsExecuted: 1 },
];

// ── Mock Templates ────────────────────────────────────────────────────────────

const MOCK_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Welcome guest 24h before check-in',
    description: 'Automatically send a WhatsApp welcome message with property details, WiFi info, and local recommendations 24 hours before guest check-in.',
    triggerType: 'CHECK_IN',
    triggerCategory: 'booking',
    conditions: [],
    actions: [{ type: 'SEND_WHATSAPP', config: { template: 'welcome_checkin', message: 'Welcome! Here is everything you need for your stay.', offset: '-24h' } }],
    icon: 'message-square',
    popular: true,
  },
  {
    id: 'tpl-002',
    name: 'Notify owner of new booking',
    description: 'Send both an email and WhatsApp notification to the property owner when a new booking is confirmed.',
    triggerType: 'NEW_BOOKING',
    triggerCategory: 'booking',
    conditions: [],
    actions: [
      { type: 'SEND_EMAIL', config: { template: 'owner_new_booking', recipient: 'owner.email' } },
      { type: 'SEND_WHATSAPP', config: { template: 'owner_booking_alert', phoneField: 'owner.phone' } },
    ],
    icon: 'bell',
    popular: true,
  },
  {
    id: 'tpl-003',
    name: 'Create cleaning task after checkout',
    description: 'Automatically create a high-priority cleaning task assigned to the maintenance team when a guest checks out.',
    triggerType: 'CHECK_OUT',
    triggerCategory: 'booking',
    conditions: [],
    actions: [{ type: 'CREATE_TASK', config: { title: 'Post-checkout deep cleaning', taskType: 'CLEANING', priority: 'HIGH', dueDateOffset: '4', dueDateUnit: 'hours' } }],
    icon: 'clipboard-list',
    popular: true,
  },
  {
    id: 'tpl-004',
    name: 'Send payment reminder',
    description: 'Email guests 3 days before their payment is due with a friendly reminder and payment link.',
    triggerType: 'SCHEDULED_CRON',
    triggerCategory: 'schedule',
    conditions: [{ field: 'booking.totalAmount', operator: 'greater_than', value: '0' }],
    actions: [{ type: 'SEND_EMAIL', config: { template: 'payment_reminder', recipient: 'guest.email', subject: 'Friendly payment reminder' } }],
    icon: 'dollar-sign',
    popular: true,
  },
  {
    id: 'tpl-005',
    name: 'Auto-approve expenses under threshold',
    description: 'Automatically approve expense claims below a configurable amount (default 100 EUR) to speed up operations.',
    triggerType: 'NEW_EXPENSE',
    triggerCategory: 'finance',
    conditions: [{ field: 'expense.amount', operator: 'less_than', value: '100' }],
    actions: [{ type: 'APPROVE_EXPENSE', config: { reason: 'Auto-approved: under threshold' } }],
    icon: 'check-circle',
    popular: false,
  },
  {
    id: 'tpl-006',
    name: 'Post-stay review request',
    description: 'Send a review request email 2 days after checkout, asking guests to share their experience.',
    triggerType: 'CHECK_OUT',
    triggerCategory: 'booking',
    conditions: [],
    actions: [
      { type: 'DELAY', config: { duration: '2', unit: 'days' } },
      { type: 'SEND_EMAIL', config: { template: 'review_request', recipient: 'guest.email' } },
    ],
    icon: 'star',
    popular: false,
  },
  {
    id: 'tpl-007',
    name: 'Urgent maintenance escalation',
    description: 'Immediately notify the owner and create a high-priority notification for urgent maintenance requests.',
    triggerType: 'MAINTENANCE_REQUEST',
    triggerCategory: 'operations',
    conditions: [{ field: 'maintenance.priority', operator: 'in', value: 'HIGH,URGENT' }],
    actions: [
      { type: 'NOTIFY_OWNER', config: { method: 'email', template: 'maintenance_alert' } },
      { type: 'CREATE_NOTIFICATION', config: { title: 'Urgent Maintenance Required', priority: 'HIGH' } },
    ],
    icon: 'alert-triangle',
    popular: false,
  },
  {
    id: 'tpl-008',
    name: 'High-value booking alert',
    description: 'Get instant notification for bookings over a configurable amount to ensure premium service.',
    triggerType: 'NEW_BOOKING',
    triggerCategory: 'booking',
    conditions: [{ field: 'booking.totalAmount', operator: 'greater_than', value: '3000' }],
    actions: [{ type: 'CREATE_NOTIFICATION', config: { title: 'High-value booking received', priority: 'HIGH' } }],
    icon: 'trending-up',
    popular: false,
  },
];

// ── Analytics Mock Data ───────────────────────────────────────────────────────

const RUNS_PER_DAY = [
  { date: 'Apr 1', runs: 8, success: 7, failed: 1 },
  { date: 'Apr 2', runs: 12, success: 11, failed: 1 },
  { date: 'Apr 3', runs: 6, success: 6, failed: 0 },
  { date: 'Apr 4', runs: 10, success: 9, failed: 1 },
  { date: 'Apr 5', runs: 14, success: 13, failed: 1 },
  { date: 'Apr 6', runs: 5, success: 5, failed: 0 },
  { date: 'Apr 7', runs: 9, success: 8, failed: 1 },
  { date: 'Apr 8', runs: 11, success: 9, failed: 2 },
  { date: 'Apr 9', runs: 13, success: 12, failed: 1 },
  { date: 'Apr 10', runs: 15, success: 14, failed: 1 },
  { date: 'Apr 11', runs: 10, success: 9, failed: 1 },
  { date: 'Apr 12', runs: 7, success: 7, failed: 0 },
];

const SUCCESS_RATE_OVER_TIME = [
  { date: 'Week 1', rate: 87 },
  { date: 'Week 2', rate: 91 },
  { date: 'Week 3', rate: 89 },
  { date: 'Week 4', rate: 94 },
  { date: 'Week 5', rate: 93 },
  { date: 'Week 6', rate: 96 },
];

const TOP_AUTOMATIONS_DATA = [
  { name: 'Cleaning Task', runs: 156 },
  { name: 'Welcome Guest', runs: 142 },
  { name: 'Review Request', runs: 108 },
  { name: 'Owner Notify', runs: 89 },
  { name: 'Payment Remind', runs: 67 },
];

const ACTION_DISTRIBUTION = [
  { name: 'Send Email', value: 312, color: '#3b82f6' },
  { name: 'Send WhatsApp', value: 245, color: '#22c55e' },
  { name: 'Create Task', value: 189, color: '#f59e0b' },
  { name: 'Notification', value: 134, color: '#8455ef' },
  { name: 'Other', value: 76, color: '#94a3b8' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const now = new Date('2026-04-12T12:00:00Z');
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  return `${secs}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTriggerLabel(type: TriggerType): string {
  return TRIGGER_OPTIONS.find((t) => t.type === type)?.label ?? type;
}

function getTriggerColor(type: TriggerType): string {
  return TRIGGER_OPTIONS.find((t) => t.type === type)?.color ?? 'bg-outline-variant/20 text-on-surface-variant';
}

function getActionLabel(type: ActionType): string {
  return ACTION_OPTIONS.find((a) => a.type === type)?.label ?? type;
}

function getCategoryBorder(cat: string): string {
  switch (cat) {
    case 'booking': return 'border-s-blue-500';
    case 'schedule': return 'border-s-secondary';
    case 'condition': return 'border-s-error';
    case 'operations': return 'border-s-warning';
    case 'finance': return 'border-s-success';
    default: return 'border-s-outline-variant';
  }
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case 'booking': return 'bg-blue-500/10 text-blue-600';
    case 'schedule': return 'bg-secondary/10 text-secondary';
    case 'condition': return 'bg-error/10 text-error';
    case 'operations': return 'bg-warning/10 text-warning';
    case 'finance': return 'bg-success/10 text-success';
    default: return 'bg-outline-variant/20 text-on-surface-variant';
  }
}

const emptyWizard = (): WizardState => ({
  step: 1,
  name: '',
  description: '',
  triggerType: null,
  conditions: [],
  actions: [],
  cronExpression: '',
  triggerConfig: {},
});

// ── Input class ───────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

const selectClass =
  'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskAutomationsPage() {
  const { t } = useTranslation();

  // Main state
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [runs] = useState<AutomationRun[]>(MOCK_RUNS);
  const [activeTab, setActiveTab] = useState<TabView>('automations');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizard, setWizard] = useState<WizardState>(emptyWizard());
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────

  const filteredAutomations = useMemo(() => {
    return automations.filter((a) => {
      if (statusFilter === 'active' && !a.isActive) return false;
      if (statusFilter === 'inactive' && a.isActive) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [automations, statusFilter, searchQuery]);

  const totalRuns = automations.reduce((sum, a) => sum + a.runCount, 0);
  const activeCount = automations.filter((a) => a.isActive).length;
  const avgSuccessRate = automations.length > 0
    ? Math.round(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length)
    : 0;
  const failedRecent = runs.filter((r) => r.status === 'FAILED').length;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
    );
    toast.success('Automation status updated');
  }, []);

  const handleDelete = useCallback((id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    toast.success('Automation deleted');
  }, []);

  const handleEdit = useCallback((auto: Automation) => {
    setWizard({
      step: 1,
      name: auto.name,
      description: auto.description,
      triggerType: auto.triggerType,
      conditions: [...auto.conditions],
      actions: [...auto.actions],
      cronExpression: '',
      triggerConfig: {},
    });
    setEditingId(auto.id);
    setShowWizard(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    setWizard(emptyWizard());
    setEditingId(null);
    setShowWizard(true);
  }, []);

  const handleUseTemplate = useCallback((tpl: AutomationTemplate) => {
    setWizard({
      step: 4, // Go straight to review
      name: tpl.name,
      description: tpl.description,
      triggerType: tpl.triggerType,
      conditions: [...tpl.conditions],
      actions: [...tpl.actions],
      cronExpression: '',
      triggerConfig: {},
    });
    setEditingId(null);
    setShowWizard(true);
    toast.success('Template loaded - review and activate');
  }, []);

  const handleWizardSave = useCallback(() => {
    if (!wizard.name.trim()) {
      toast.error('Automation name is required');
      return;
    }
    if (!wizard.triggerType) {
      toast.error('Please select a trigger');
      return;
    }
    if (wizard.actions.length === 0) {
      toast.error('Please add at least one action');
      return;
    }

    const triggerOpt = TRIGGER_OPTIONS.find((t) => t.type === wizard.triggerType);
    const now = new Date().toISOString();

    if (editingId) {
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                name: wizard.name,
                description: wizard.description,
                triggerType: wizard.triggerType!,
                triggerCategory: triggerOpt?.category ?? 'booking',
                conditions: wizard.conditions,
                actions: wizard.actions,
              }
            : a,
        ),
      );
      toast.success('Automation updated successfully');
    } else {
      const newAuto: Automation = {
        id: `auto-${Date.now()}`,
        name: wizard.name,
        description: wizard.description,
        triggerType: wizard.triggerType!,
        triggerCategory: triggerOpt?.category ?? 'booking',
        isActive: true,
        conditions: wizard.conditions,
        actions: wizard.actions,
        lastRunAt: null,
        successRate: 0,
        runCount: 0,
        createdAt: now,
      };
      setAutomations((prev) => [newAuto, ...prev]);
      toast.success('Automation created and activated');
    }

    setShowWizard(false);
    setWizard(emptyWizard());
    setEditingId(null);
    setActiveTab('automations');
  }, [wizard, editingId]);

  const handleWizardCancel = useCallback(() => {
    setShowWizard(false);
    setWizard(emptyWizard());
    setEditingId(null);
  }, []);

  // ── Wizard helpers ───────────────────────────────────────────────────────

  const setWizardStep = (step: number) => setWizard((w) => ({ ...w, step }));
  const canGoNext = (): boolean => {
    switch (wizard.step) {
      case 1: return wizard.triggerType !== null;
      case 2: return true; // conditions are optional
      case 3: return wizard.actions.length > 0;
      default: return false;
    }
  };

  const addWizardCondition = () => {
    setWizard((w) => ({
      ...w,
      conditions: [...w.conditions, { field: 'property.id', operator: 'equals', value: '' }],
    }));
  };

  const removeWizardCondition = (idx: number) => {
    setWizard((w) => ({
      ...w,
      conditions: w.conditions.filter((_, i) => i !== idx),
    }));
  };

  const updateWizardCondition = (idx: number, patch: Partial<AutomationCondition>) => {
    setWizard((w) => ({
      ...w,
      conditions: w.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };

  const addWizardAction = () => {
    setWizard((w) => ({
      ...w,
      actions: [...w.actions, { type: 'SEND_EMAIL', config: {} }],
    }));
  };

  const removeWizardAction = (idx: number) => {
    setWizard((w) => ({
      ...w,
      actions: w.actions.filter((_, i) => i !== idx),
    }));
  };

  const updateWizardAction = (idx: number, type: ActionType) => {
    setWizard((w) => ({
      ...w,
      actions: w.actions.map((a, i) => (i === idx ? { ...a, type } : a)),
    }));
  };

  const updateWizardActionConfig = (idx: number, key: string, value: string) => {
    setWizard((w) => ({
      ...w,
      actions: w.actions.map((a, i) =>
        i === idx ? { ...a, config: { ...a.config, [key]: value } } : a,
      ),
    }));
  };

  // ── Stats Cards ──────────────────────────────────────────────────────────

  const statsCards = [
    { label: 'Total Automations', value: automations.length, icon: Zap, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: 'Active', value: activeCount, icon: Activity, color: 'bg-success/10', iconColor: 'text-success' },
    { label: 'Total Runs', value: totalRuns.toLocaleString(), icon: Play, color: 'bg-blue-500/10', iconColor: 'text-blue-600' },
    { label: 'Avg Success Rate', value: `${avgSuccessRate}%`, icon: CheckCircle, color: 'bg-warning/10', iconColor: 'text-warning' },
  ];

  // ── Render: Wizard ───────────────────────────────────────────────────────

  if (showWizard) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
              {editingId ? 'Edit Automation' : 'Create Automation'}
            </p>
            <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
              Automation Wizard
            </h1>
          </div>
          <button
            onClick={handleWizardCancel}
            className="p-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Trigger', icon: Zap },
              { step: 2, label: 'Conditions', icon: GitBranch },
              { step: 3, label: 'Actions', icon: Workflow },
              { step: 4, label: 'Review', icon: Eye },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center flex-1">
                <button
                  onClick={() => s.step <= wizard.step && setWizardStep(s.step)}
                  className={`flex items-center gap-2 ${s.step <= wizard.step ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      wizard.step === s.step
                        ? 'gradient-accent text-white shadow-lg'
                        : wizard.step > s.step
                        ? 'bg-success/20 text-success'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {wizard.step > s.step ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      wizard.step === s.step ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${
                      wizard.step > s.step ? 'bg-success/40' : 'bg-outline-variant/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Automation name/description - always visible */}
        {wizard.step === 1 && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 space-y-4">
            <h2 className="font-headline font-bold text-on-surface text-lg">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Automation Name *
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g., Welcome guest before check-in"
                  value={wizard.name}
                  onChange={(e) => setWizard((w) => ({ ...w, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Description
                </label>
                <input
                  className={inputClass}
                  placeholder="What does this automation do?"
                  value={wizard.description}
                  onChange={(e) => setWizard((w) => ({ ...w, description: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Choose Trigger */}
        {wizard.step === 1 && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 space-y-4">
            <h2 className="font-headline font-bold text-on-surface text-lg">Choose Trigger</h2>
            <p className="text-sm text-on-surface-variant">Select the event that will start this automation.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRIGGER_OPTIONS.map((trigger) => (
                <button
                  key={trigger.type}
                  onClick={() => setWizard((w) => ({ ...w, triggerType: trigger.type }))}
                  className={`p-4 rounded-xl border-2 text-start transition-all ${
                    wizard.triggerType === trigger.type
                      ? 'border-secondary bg-secondary/5 shadow-lg'
                      : 'border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${trigger.color.split(' ').slice(0, 1).join(' ')}`}>
                      <Zap className={`w-4 h-4 ${trigger.color.split(' ').slice(1, 2).join(' ')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface">{trigger.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{trigger.description}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getCategoryColor(trigger.category)}`}>
                        {trigger.category}
                      </span>
                    </div>
                  </div>
                  {wizard.triggerType === trigger.type && (
                    <div className="mt-2 flex justify-end">
                      <Check className="w-5 h-5 text-secondary" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {wizard.triggerType === 'SCHEDULED_CRON' && (
              <div className="mt-4 p-4 rounded-lg bg-surface-container-low">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Cron Expression
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g., 0 6 * * * (daily at 6 AM)"
                  value={wizard.cronExpression}
                  onChange={(e) => setWizard((w) => ({ ...w, cronExpression: e.target.value }))}
                />
                <p className="text-xs text-on-surface-variant mt-1.5">Use standard cron syntax. Common: 0 6 * * * (daily 6am), 0 */2 * * * (every 2h)</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Conditions */}
        {wizard.step === 2 && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-on-surface text-lg">Add Conditions</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Optionally filter when this automation should run. Leave empty to run for all events.
                </p>
              </div>
              <button
                onClick={addWizardCondition}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>

            {wizard.conditions.length === 0 && (
              <div className="text-center py-12 bg-surface-container-low rounded-xl">
                <GitBranch className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant">No conditions added. The automation will fire for every trigger event.</p>
                <button
                  onClick={addWizardCondition}
                  className="mt-3 text-sm text-secondary font-medium hover:underline"
                >
                  + Add a condition to filter
                </button>
              </div>
            )}

            <div className="space-y-3">
              {wizard.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 rounded-lg bg-surface-container-low">
                  {idx > 0 && (
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">AND</span>
                  )}
                  <select
                    className={selectClass}
                    value={cond.field}
                    onChange={(e) => updateWizardCondition(idx, { field: e.target.value })}
                  >
                    {CONDITION_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    className={selectClass}
                    value={cond.operator}
                    onChange={(e) => updateWizardCondition(idx, { operator: e.target.value as ConditionOperator })}
                  >
                    {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Value"
                    value={cond.value}
                    onChange={(e) => updateWizardCondition(idx, { value: e.target.value })}
                  />
                  <button
                    onClick={() => removeWizardCondition(idx)}
                    className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Define Actions */}
        {wizard.step === 3 && (
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-on-surface text-lg">Define Actions</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  What should happen when this automation triggers? Actions execute in order.
                </p>
              </div>
              <button
                onClick={addWizardAction}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>

            {wizard.actions.length === 0 && (
              <div className="text-center py-12 bg-surface-container-low rounded-xl">
                <Workflow className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant">No actions added yet. Add at least one action.</p>
              </div>
            )}

            <div className="space-y-4">
              {wizard.actions.map((action, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                    <select
                      className={`${selectClass} flex-1`}
                      value={action.type}
                      onChange={(e) => updateWizardAction(idx, e.target.value as ActionType)}
                    >
                      {ACTION_OPTIONS.map((a) => (
                        <option key={a.type} value={a.type}>{a.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeWizardAction(idx)}
                      className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action config fields */}
                  {renderWizardActionConfig(action, idx)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {wizard.step === 4 && (
          <div className="space-y-4">
            {/* Name + Description edit */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 space-y-4">
              <h2 className="font-headline font-bold text-on-surface text-lg">Review & Activate</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Name *</label>
                  <input
                    className={inputClass}
                    value={wizard.name}
                    onChange={(e) => setWizard((w) => ({ ...w, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Description</label>
                  <input
                    className={inputClass}
                    value={wizard.description}
                    onChange={(e) => setWizard((w) => ({ ...w, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trigger */}
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-3">Trigger</p>
                  <div className={`p-3 rounded-lg ${getTriggerColor(wizard.triggerType!)}`}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-semibold">{getTriggerLabel(wizard.triggerType!)}</span>
                    </div>
                  </div>
                  {wizard.cronExpression && (
                    <p className="text-xs text-on-surface-variant mt-2">Cron: {wizard.cronExpression}</p>
                  )}
                </div>

                {/* Conditions */}
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-3">
                    Conditions ({wizard.conditions.length})
                  </p>
                  {wizard.conditions.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic">No conditions - fires for all events</p>
                  ) : (
                    <div className="space-y-1.5">
                      {wizard.conditions.map((c, i) => (
                        <div key={i} className="text-xs bg-surface-container-low rounded-lg px-3 py-2 text-on-surface">
                          {CONDITION_FIELDS.find((f) => f.value === c.field)?.label ?? c.field}{' '}
                          <span className="font-bold text-secondary">{OPERATOR_LABELS[c.operator]}</span>{' '}
                          {c.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-3">
                    Actions ({wizard.actions.length})
                  </p>
                  <div className="space-y-1.5">
                    {wizard.actions.map((a, i) => {
                      const opt = ACTION_OPTIONS.find((o) => o.type === a.type);
                      return (
                        <div key={i} className={`text-xs rounded-lg px-3 py-2 ${opt?.color ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                          <span className="font-semibold">{i + 1}.</span> {opt?.label ?? a.type}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={wizard.step === 1 ? handleWizardCancel : () => setWizardStep(wizard.step - 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-surface-container-lowest ambient-shadow text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {wizard.step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            {wizard.step < 4 ? (
              <button
                onClick={() => canGoNext() && setWizardStep(wizard.step + 1)}
                disabled={!canGoNext()}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  canGoNext()
                    ? 'text-white gradient-accent hover:shadow-ambient-lg'
                    : 'bg-outline-variant/20 text-on-surface-variant cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleWizardSave}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Check className="w-4 h-4" />
                {editingId ? 'Update Automation' : 'Activate Automation'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Action Config Fields ─────────────────────────────────────────

  function renderWizardActionConfig(action: AutomationAction, idx: number) {
    switch (action.type) {
      case 'SEND_EMAIL':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Email template name" value={action.config.template ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'template', e.target.value)} />
            <input className={inputClass} placeholder="Recipient (e.g. guest.email)" value={action.config.recipient ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'recipient', e.target.value)} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Subject line" value={action.config.subject ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'subject', e.target.value)} />
          </div>
        );
      case 'SEND_WHATSAPP':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Template name" value={action.config.template ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'template', e.target.value)} />
            <input className={inputClass} placeholder="Phone field (e.g. guest.phone)" value={action.config.phoneField ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'phoneField', e.target.value)} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Message body" value={action.config.message ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'message', e.target.value)} />
          </div>
        );
      case 'CREATE_TASK':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="Task title" value={action.config.title ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'title', e.target.value)} />
            <select className={selectClass} value={action.config.taskType ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'taskType', e.target.value)}>
              <option value="">Task type...</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INSPECTION">Inspection</option>
              <option value="GUEST_RELATED">Guest Related</option>
              <option value="ADMINISTRATIVE">Administrative</option>
            </select>
            <select className={selectClass} value={action.config.priority ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'priority', e.target.value)}>
              <option value="">Priority...</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        );
      case 'UPDATE_STATUS':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Entity (e.g. expense, booking)" value={action.config.entity ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'entity', e.target.value)} />
            <input className={inputClass} placeholder="New status" value={action.config.newStatus ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'newStatus', e.target.value)} />
          </div>
        );
      case 'NOTIFY_OWNER':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className={selectClass} value={action.config.method ?? 'email'} onChange={(e) => updateWizardActionConfig(idx, 'method', e.target.value)}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="both">Email + WhatsApp</option>
            </select>
            <input className={inputClass} placeholder="Template name" value={action.config.template ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'template', e.target.value)} />
          </div>
        );
      case 'GENERATE_DOCUMENT':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Document template" value={action.config.template ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'template', e.target.value)} />
            <select className={selectClass} value={action.config.format ?? 'pdf'} onChange={(e) => updateWizardActionConfig(idx, 'format', e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
            </select>
          </div>
        );
      case 'CREATE_NOTIFICATION':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Notification title" value={action.config.title ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'title', e.target.value)} />
            <select className={selectClass} value={action.config.priority ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'priority', e.target.value)}>
              <option value="">Priority...</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input className={`${inputClass} sm:col-span-2`} placeholder="Message" value={action.config.message ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'message', e.target.value)} />
          </div>
        );
      case 'APPROVE_EXPENSE':
        return (
          <div className="grid grid-cols-1 gap-3">
            <input className={inputClass} placeholder="Approval reason" value={action.config.reason ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'reason', e.target.value)} />
          </div>
        );
      case 'DELAY':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Duration (number)" value={action.config.duration ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'duration', e.target.value)} />
            <select className={selectClass} value={action.config.unit ?? 'hours'} onChange={(e) => updateWizardActionConfig(idx, 'unit', e.target.value)}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        );
      case 'SEND_WEBHOOK':
        return (
          <div className="grid grid-cols-1 gap-3">
            <input className={inputClass} placeholder="Webhook URL" value={action.config.url ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'url', e.target.value)} />
          </div>
        );
      default:
        return (
          <div>
            <input className={inputClass} placeholder="Configuration (JSON)" value={action.config.raw ?? ''} onChange={(e) => updateWizardActionConfig(idx, 'raw', e.target.value)} />
          </div>
        );
    }
  }

  // ── Main Page Render ─────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            System
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            Task Automations
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Create, manage, and monitor automated workflows for your properties.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Automation</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
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

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-lowest rounded-lg ambient-shadow overflow-hidden p-1">
        {[
          { key: 'automations' as TabView, label: 'Automations', icon: Zap },
          { key: 'templates' as TabView, label: 'Templates', icon: Sparkles },
          { key: 'history' as TabView, label: 'Run History', icon: Clock },
          { key: 'analytics' as TabView, label: 'Analytics', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? 'gradient-accent text-white shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Automations Grid ──────────────────────────────────────────────── */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                className={`${inputClass} ps-10`}
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    statusFilter === s
                      ? 'gradient-accent text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {s === 'all' ? `All (${automations.length})` : s === 'active' ? `Active (${activeCount})` : `Inactive (${automations.length - activeCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAutomations.map((auto) => (
              <div
                key={auto.id}
                className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border-s-4 ${getCategoryBorder(auto.triggerCategory)} transition-all hover:shadow-ambient-lg ${
                  !auto.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-headline font-bold text-on-surface text-base truncate">
                          {auto.name}
                        </h3>
                        {!auto.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-outline-variant/20 text-on-surface-variant uppercase">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{auto.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(auto.id)}
                      className={`flex-shrink-0 transition-colors ${auto.isActive ? 'text-success' : 'text-on-surface-variant'}`}
                      title={auto.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {auto.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>

                  {/* Trigger badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getTriggerColor(auto.triggerType)}`}>
                      <Zap className="w-3 h-3" />
                      {getTriggerLabel(auto.triggerType)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getCategoryColor(auto.triggerCategory)}`}>
                      {auto.triggerCategory}
                    </span>
                  </div>

                  {/* Conditions preview */}
                  {auto.conditions.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <GitBranch className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                      {auto.conditions.map((c, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                          {CONDITION_FIELDS.find((f) => f.value === c.field)?.label ?? c.field} {OPERATOR_LABELS[c.operator]} {c.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions preview */}
                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    <ArrowRight className="w-3 h-3 text-on-surface-variant flex-shrink-0" />
                    {auto.actions.map((a, i) => {
                      const opt = ACTION_OPTIONS.find((o) => o.type === a.type);
                      return (
                        <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${opt?.color ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                          {opt?.label ?? a.type}
                        </span>
                      );
                    })}
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-surface-container-low">
                    <div className="text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Last Run</p>
                      <p className="text-xs font-semibold text-on-surface">{timeAgo(auto.lastRunAt)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Success</p>
                      <p className={`text-xs font-semibold ${auto.successRate >= 90 ? 'text-success' : auto.successRate >= 70 ? 'text-warning' : 'text-error'}`}>
                        {auto.successRate}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Runs</p>
                      <p className="text-xs font-semibold text-on-surface">{auto.runCount}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(auto)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(auto.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAutomations.length === 0 && (
            <div className="text-center py-16 bg-surface-container-lowest rounded-xl ambient-shadow">
              <Zap className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-lg font-semibold text-on-surface mb-1">No automations found</p>
              <p className="text-sm text-on-surface-variant mb-4">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Create your first automation to get started.'}
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                New Automation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Templates ─────────────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-on-surface text-lg">Automation Templates</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Pre-built automations you can deploy with one click. Customize after activation.
              </p>
            </div>
          </div>

          {/* Popular Templates */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-3">
              Popular Templates
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_TEMPLATES.filter((t) => t.popular).map((tpl) => (
                <div
                  key={tpl.id}
                  className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border-s-4 ${getCategoryBorder(tpl.triggerCategory)} hover:shadow-ambient-lg transition-all`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(tpl.triggerCategory)}`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h3 className="font-headline font-bold text-on-surface text-sm">{tpl.name}</h3>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">{tpl.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning uppercase">
                        Popular
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTriggerColor(tpl.triggerType)}`}>
                        <Zap className="w-2.5 h-2.5" />
                        {getTriggerLabel(tpl.triggerType)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-on-surface-variant" />
                      {tpl.actions.map((a, i) => {
                        const opt = ACTION_OPTIONS.find((o) => o.type === a.type);
                        return (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${opt?.color ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                            {opt?.label ?? a.type}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleUseTemplate(tpl)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Templates */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-3">
              All Templates
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_TEMPLATES.filter((t) => !t.popular).map((tpl) => (
                <div
                  key={tpl.id}
                  className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border-s-4 ${getCategoryBorder(tpl.triggerCategory)} hover:shadow-ambient-lg transition-all`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getCategoryColor(tpl.triggerCategory)}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-headline font-bold text-on-surface text-sm flex-1 truncate">{tpl.name}</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{tpl.description}</p>

                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getTriggerColor(tpl.triggerType)}`}>
                        {getTriggerLabel(tpl.triggerType)}
                      </span>
                      {tpl.conditions.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                          {tpl.conditions.length} condition{tpl.conditions.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-secondary/30 text-secondary hover:bg-secondary/5 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Run History ───────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-on-surface text-lg">Run History</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Recent automation executions and their results.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" /> {runs.filter((r) => r.status === 'SUCCESS').length} success
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error" /> {runs.filter((r) => r.status === 'FAILED').length} failed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" /> {runs.filter((r) => r.status === 'SKIPPED').length} skipped
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Automation</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Trigger Event</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Timestamp</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Duration</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                    <th className="text-start p-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-on-surface">{run.automationName}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-on-surface-variant max-w-[200px] truncate">{run.triggerEvent}</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-xs text-on-surface">{formatDate(run.timestamp)}</p>
                          <p className="text-[10px] text-on-surface-variant">{timeAgo(run.timestamp)}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          run.status === 'SUCCESS'
                            ? 'bg-success/10 text-success'
                            : run.status === 'FAILED'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {run.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                          {run.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                          {run.status === 'SKIPPED' && <AlertTriangle className="w-3 h-3" />}
                          {run.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-on-surface font-mono">{formatDuration(run.duration)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-on-surface">{run.actionsExecuted}</span>
                      </td>
                      <td className="p-4">
                        {run.errorMessage ? (
                          <p className="text-xs text-error max-w-[250px] truncate" title={run.errorMessage}>
                            {run.errorMessage}
                          </p>
                        ) : (
                          <span className="text-xs text-on-surface-variant">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics ─────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline font-bold text-on-surface text-lg">Automation Analytics</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Performance metrics and insights across all your automations.
            </p>
          </div>

          {/* Top metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Total Runs (30d)</p>
              <p className="font-headline text-2xl font-bold text-on-surface">{totalRuns.toLocaleString()}</p>
              <p className="text-xs text-success mt-1">+12% vs last month</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Success Rate</p>
              <p className="font-headline text-2xl font-bold text-success">{avgSuccessRate}%</p>
              <p className="text-xs text-success mt-1">+3% improvement</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Failed Runs</p>
              <p className="font-headline text-2xl font-bold text-error">{failedRecent}</p>
              <p className="text-xs text-on-surface-variant mt-1">Last 30 days</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Avg Duration</p>
              <p className="font-headline text-2xl font-bold text-on-surface">1.2s</p>
              <p className="text-xs text-success mt-1">-15% faster</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Runs per Day */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-4">Runs Per Day</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={RUNS_PER_DAY}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} name="Success" />
                    <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Success Rate Over Time */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-4">Success Rate Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SUCCESS_RATE_OVER_TIME}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Success Rate']}
                    />
                    <defs>
                      <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8455ef" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8455ef" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="rate" stroke="#8455ef" strokeWidth={2} fill="url(#successGrad)" name="Success %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Active Automations */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-4">Most Active Automations</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TOP_AUTOMATIONS_DATA} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="runs" fill="#8455ef" radius={[0, 4, 4, 0]} name="Total Runs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Distribution */}
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
              <h3 className="font-headline font-bold text-on-surface text-sm mb-4">Action Type Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ACTION_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {ACTION_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Automation Performance Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
            <h3 className="font-headline font-bold text-on-surface text-sm mb-4">Automation Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Automation</th>
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Trigger</th>
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Runs</th>
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Success Rate</th>
                    <th className="text-start p-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {automations
                    .sort((a, b) => b.runCount - a.runCount)
                    .map((auto) => (
                      <tr key={auto.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-semibold text-on-surface">{auto.name}</p>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getTriggerColor(auto.triggerType)}`}>
                            {getTriggerLabel(auto.triggerType)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${auto.isActive ? 'text-success' : 'text-on-surface-variant'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${auto.isActive ? 'bg-success' : 'bg-outline-variant'}`} />
                            {auto.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-semibold text-on-surface">{auto.runCount}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-surface-container-low max-w-[80px]">
                              <div
                                className={`h-full rounded-full ${auto.successRate >= 90 ? 'bg-success' : auto.successRate >= 70 ? 'bg-warning' : 'bg-error'}`}
                                style={{ width: `${auto.successRate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${auto.successRate >= 90 ? 'text-success' : auto.successRate >= 70 ? 'text-warning' : 'text-error'}`}>
                              {auto.successRate}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-on-surface-variant">{timeAgo(auto.lastRunAt)}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
