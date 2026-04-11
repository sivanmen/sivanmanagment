import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Plus,
  Zap,
  Play,
  Trash2,
  Edit3,
  ChevronRight,
  Check,
  X,
  ArrowRight,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter as FilterIcon,
  ToggleLeft,
  ToggleRight,
  FlaskConical,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type TriggerType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'PAYMENT_RECEIVED'
  | 'EXPENSE_CREATED'
  | 'MAINTENANCE_CREATED'
  | 'GUEST_CREATED'
  | 'DOCUMENT_EXPIRING'
  | 'OCCUPANCY_DROP'
  | 'REVIEW_RECEIVED'
  | 'SCHEDULE';

type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in';

type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_WHATSAPP'
  | 'CREATE_TASK'
  | 'CREATE_NOTIFICATION'
  | 'UPDATE_STATUS'
  | 'ASSIGN_TO'
  | 'ADD_TAG'
  | 'CALCULATE_FEE'
  | 'SEND_WEBHOOK'
  | 'DELAY'
  | 'CREATE_EXPENSE';

interface AutomationTrigger {
  type: TriggerType;
  config?: Record<string, unknown>;
}

interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

interface AutomationAction {
  type: ActionType;
  config: Record<string, string>;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
  lastExecution?: string;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  result: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  details: string;
  timestamp: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const triggerGroups: { label: string; color: string; borderColor: string; triggers: { type: TriggerType; label: string }[] }[] = [
  {
    label: 'Bookings',
    color: 'bg-blue-500/10 text-blue-600',
    borderColor: 'border-s-blue-500',
    triggers: [
      { type: 'BOOKING_CREATED', label: 'Booking Created' },
      { type: 'BOOKING_CONFIRMED', label: 'Booking Confirmed' },
      { type: 'BOOKING_CANCELLED', label: 'Booking Cancelled' },
      { type: 'CHECK_IN', label: 'Check-in' },
      { type: 'CHECK_OUT', label: 'Check-out' },
    ],
  },
  {
    label: 'Finance',
    color: 'bg-success/10 text-success',
    borderColor: 'border-s-success',
    triggers: [
      { type: 'PAYMENT_RECEIVED', label: 'Payment Received' },
      { type: 'EXPENSE_CREATED', label: 'Expense Created' },
    ],
  },
  {
    label: 'Operations',
    color: 'bg-warning/10 text-warning',
    borderColor: 'border-s-warning',
    triggers: [
      { type: 'MAINTENANCE_CREATED', label: 'Maintenance Created' },
      { type: 'DOCUMENT_EXPIRING', label: 'Document Expiring' },
      { type: 'GUEST_CREATED', label: 'Guest Created' },
    ],
  },
  {
    label: 'Other',
    color: 'bg-secondary/10 text-secondary',
    borderColor: 'border-s-secondary',
    triggers: [
      { type: 'OCCUPANCY_DROP', label: 'Occupancy Drop' },
      { type: 'REVIEW_RECEIVED', label: 'Review Received' },
      { type: 'SCHEDULE', label: 'Schedule (Cron)' },
    ],
  },
];

const allTriggers = triggerGroups.flatMap((g) => g.triggers);

const triggerColorMap: Record<string, { badge: string; border: string }> = {};
triggerGroups.forEach((g) =>
  g.triggers.forEach((t) => {
    triggerColorMap[t.type] = { badge: g.color, border: g.borderColor };
  }),
);

const conditionFields = [
  { value: 'booking.totalAmount', label: 'Booking Total Amount' },
  { value: 'booking.nights', label: 'Booking Nights' },
  { value: 'property.city', label: 'Property City' },
  { value: 'guest.totalStays', label: 'Guest Total Stays' },
  { value: 'expense.amount', label: 'Expense Amount' },
  { value: 'expense.category', label: 'Expense Category' },
  { value: 'maintenance.priority', label: 'Maintenance Priority' },
  { value: 'booking.source', label: 'Booking Source' },
];

const operatorLabels: Record<ConditionOperator, string> = {
  equals: '=',
  not_equals: '\u2260',
  greater_than: '>',
  less_than: '<',
  contains: 'contains',
  in: 'in',
};

const actionOptions: { type: ActionType; label: string; color: string }[] = [
  { type: 'SEND_EMAIL', label: 'Send Email', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'SEND_WHATSAPP', label: 'Send WhatsApp', color: 'bg-success/10 text-success' },
  { type: 'CREATE_TASK', label: 'Create Task', color: 'bg-warning/10 text-warning' },
  { type: 'CREATE_NOTIFICATION', label: 'Create Notification', color: 'bg-secondary/10 text-secondary' },
  { type: 'UPDATE_STATUS', label: 'Update Status', color: 'bg-blue-500/10 text-blue-600' },
  { type: 'ASSIGN_TO', label: 'Assign To', color: 'bg-warning/10 text-warning' },
  { type: 'ADD_TAG', label: 'Add Tag', color: 'bg-secondary/10 text-secondary' },
  { type: 'CALCULATE_FEE', label: 'Calculate Fee', color: 'bg-success/10 text-success' },
  { type: 'SEND_WEBHOOK', label: 'Send Webhook', color: 'bg-outline-variant/20 text-on-surface-variant' },
  { type: 'DELAY', label: 'Delay', color: 'bg-warning/10 text-warning' },
  { type: 'CREATE_EXPENSE', label: 'Create Expense', color: 'bg-error/10 text-error' },
];

const actionColorMap: Record<string, string> = {};
actionOptions.forEach((a) => (actionColorMap[a.type] = a.color));

const resultStyles: Record<string, string> = {
  SUCCESS: 'bg-success/10 text-success',
  FAILED: 'bg-error/10 text-error',
  SIMULATED: 'bg-secondary/10 text-secondary',
};

// ── Demo data ───────────────────────────────────────────────────────────────

const initialRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Auto-create cleaning task',
    description: 'Automatically create a cleaning task when a guest checks out.',
    isActive: true,
    trigger: { type: 'CHECK_OUT' },
    conditions: [],
    actions: [{ type: 'CREATE_TASK', config: { taskType: 'CLEANING', title: 'Post-checkout cleaning', dueDateOffset: '1', dueDateUnit: 'days', priority: 'HIGH' } }],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
    lastExecution: '2026-04-10T14:30:00Z',
  },
  {
    id: 'rule-2',
    name: 'Send booking confirmation',
    description: 'Send a confirmation email to the guest when a booking is confirmed.',
    isActive: true,
    trigger: { type: 'BOOKING_CONFIRMED' },
    conditions: [],
    actions: [{ type: 'SEND_EMAIL', config: { template: 'booking_confirmed', recipient: 'guest.email', subject: 'Your booking is confirmed!' } }],
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
    lastExecution: '2026-04-10T12:15:00Z',
  },
  {
    id: 'rule-3',
    name: 'Alert high-value booking',
    description: 'Send a notification when a booking over 2000 EUR is created.',
    isActive: true,
    trigger: { type: 'BOOKING_CREATED' },
    conditions: [{ field: 'booking.totalAmount', operator: 'greater_than', value: '2000' }],
    actions: [{ type: 'CREATE_NOTIFICATION', config: { title: 'High-value booking received', message: 'A booking over \u20AC2,000 has been created.', priority: 'HIGH' } }],
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
    lastExecution: '2026-04-09T18:42:00Z',
  },
  {
    id: 'rule-4',
    name: 'Auto-approve small expenses',
    description: 'Automatically approve expenses under 50 EUR.',
    isActive: false,
    trigger: { type: 'EXPENSE_CREATED' },
    conditions: [{ field: 'expense.amount', operator: 'less_than', value: '50' }],
    actions: [{ type: 'UPDATE_STATUS', config: { entity: 'expense', newStatus: 'AUTO_APPROVED' } }],
    createdAt: '2026-03-08T00:00:00Z',
    updatedAt: '2026-03-08T00:00:00Z',
  },
  {
    id: 'rule-5',
    name: 'Welcome returning guest',
    description: 'Send a WhatsApp welcome-back message for returning guests with 3+ stays.',
    isActive: true,
    trigger: { type: 'BOOKING_CREATED' },
    conditions: [{ field: 'guest.totalStays', operator: 'greater_than', value: '2' }],
    actions: [{ type: 'SEND_WHATSAPP', config: { template: 'welcome_back', phoneField: 'guest.phone', message: 'Welcome back! We are glad to have you again.' } }],
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    lastExecution: '2026-04-09T10:05:00Z',
  },
];

const initialLogs: ExecutionLog[] = [
  { id: 'log-1', ruleId: 'rule-1', ruleName: 'Auto-create cleaning task', triggerEvent: 'CHECK_OUT', result: 'SUCCESS', details: 'Created cleaning task for Elounda Breeze Villa', timestamp: '2026-04-10T14:30:00Z' },
  { id: 'log-2', ruleId: 'rule-2', ruleName: 'Send booking confirmation', triggerEvent: 'BOOKING_CONFIRMED', result: 'SUCCESS', details: 'Sent confirmation email to maria.p@gmail.com', timestamp: '2026-04-10T12:15:00Z' },
  { id: 'log-3', ruleId: 'rule-3', ruleName: 'Alert high-value booking', triggerEvent: 'BOOKING_CREATED', result: 'SUCCESS', details: 'Notification created: High-value booking \u20AC2,450 for Elounda Breeze Villa', timestamp: '2026-04-09T18:42:00Z' },
  { id: 'log-4', ruleId: 'rule-5', ruleName: 'Welcome returning guest', triggerEvent: 'BOOKING_CREATED', result: 'FAILED', details: 'WhatsApp delivery failed: phone number not verified', timestamp: '2026-04-09T10:05:00Z' },
  { id: 'log-5', ruleId: 'rule-1', ruleName: 'Auto-create cleaning task', triggerEvent: 'CHECK_OUT', result: 'SUCCESS', details: 'Created cleaning task for Rethymno Sunset Apartment', timestamp: '2026-04-08T11:00:00Z' },
  { id: 'log-6', ruleId: 'rule-2', ruleName: 'Send booking confirmation', triggerEvent: 'BOOKING_CONFIRMED', result: 'SUCCESS', details: 'Sent confirmation email to h.mueller@outlook.de', timestamp: '2026-04-07T09:30:00Z' },
  { id: 'log-7', ruleId: 'rule-3', ruleName: 'Alert high-value booking', triggerEvent: 'BOOKING_CREATED', result: 'SUCCESS', details: 'Notification created: High-value booking \u20AC2,650 for Elounda Breeze Villa', timestamp: '2026-04-06T16:20:00Z' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTriggerLabel(type: TriggerType): string {
  return allTriggers.find((t) => t.type === type)?.label ?? type;
}

function getActionLabel(type: ActionType): string {
  return actionOptions.find((a) => a.type === type)?.label ?? type;
}

function timeAgo(dateStr: string): string {
  const now = new Date('2026-04-11T10:00:00Z');
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// ── Empty builder state ─────────────────────────────────────────────────────

function emptyRule(): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    description: '',
    isActive: true,
    trigger: { type: 'BOOKING_CREATED' },
    conditions: [],
    actions: [{ type: 'SEND_EMAIL', config: { template: '', recipient: '' } }],
  };
}

// ── Component ───────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'builder' | 'logs';

export default function AutomationsPage() {
  const { t } = useTranslation();

  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [view, setView] = useState<ViewMode>('list');
  const [editingRule, setEditingRule] = useState<Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ ruleId: string; results: string[] } | null>(null);

  // Stats
  const totalRules = rules.length;
  const activeRules = rules.filter((r) => r.isActive).length;
  const executionsToday = logs.filter((l) => l.timestamp.startsWith('2026-04-11') || l.timestamp.startsWith('2026-04-10')).length;
  const successRate = logs.length > 0 ? Math.round((logs.filter((l) => l.result === 'SUCCESS').length / logs.filter((l) => l.result !== 'SIMULATED').length) * 100) : 100;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive, updatedAt: new Date().toISOString() } : r)),
    );
    toast.success(t('automations.ruleToggled'));
  }, [t]);

  const handleDelete = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success(t('automations.ruleDeleted'));
  }, [t]);

  const handleEdit = useCallback((rule: AutomationRule) => {
    setEditingRule({
      name: rule.name,
      description: rule.description,
      isActive: rule.isActive,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
    });
    setEditingId(rule.id);
    setView('builder');
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRule(emptyRule());
    setEditingId(null);
    setView('builder');
  }, []);

  const handleSave = useCallback(() => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) {
      toast.error(t('automations.nameRequired'));
      return;
    }
    if (editingRule.actions.length === 0) {
      toast.error(t('automations.actionsRequired'));
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, ...editingRule, updatedAt: now }
            : r,
        ),
      );
      toast.success(t('automations.ruleUpdated'));
    } else {
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        ...editingRule,
        createdAt: now,
        updatedAt: now,
      };
      setRules((prev) => [newRule, ...prev]);
      toast.success(t('automations.ruleCreated'));
    }

    setEditingRule(null);
    setEditingId(null);
    setView('list');
  }, [editingRule, editingId, t]);

  const handleCancelEdit = useCallback(() => {
    setEditingRule(null);
    setEditingId(null);
    setView('list');
  }, []);

  const handleTest = useCallback((rule: AutomationRule) => {
    const results: string[] = [];
    if (rule.conditions.length > 0) {
      results.push(`Evaluating ${rule.conditions.length} condition(s): ${rule.conditions.map((c) => `${c.field} ${operatorLabels[c.operator]} ${c.value}`).join(' AND ')}`);
      results.push('Conditions evaluated: PASS (simulated)');
    } else {
      results.push('No conditions - trigger fires unconditionally');
    }
    for (const action of rule.actions) {
      const label = getActionLabel(action.type);
      const configStr = Object.entries(action.config)
        .map(([k, v]) => `${k}="${v}"`)
        .join(', ');
      results.push(`Would execute: ${label} (${configStr})`);
    }
    setTestResults({ ruleId: rule.id, results });

    const newLog: ExecutionLog = {
      id: `log-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: rule.trigger.type,
      result: 'SIMULATED',
      details: results.join('; '),
      timestamp: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
    toast.success(t('automations.testComplete'));
  }, [t]);

  // ── Builder field updaters ──────────────────────────────────────────────

  type RuleFields = Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>;

  const updateField = <K extends keyof RuleFields>(field: K, value: RuleFields[K]) => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, [field]: value });
  };

  const addCondition = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, { field: 'booking.totalAmount', operator: 'greater_than', value: '' }],
    });
  };

  const removeCondition = (idx: number) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter((_, i) => i !== idx),
    });
  };

  const updateCondition = (idx: number, patch: Partial<AutomationCondition>) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    });
  };

  const addAction = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: [...editingRule.actions, { type: 'CREATE_NOTIFICATION', config: { title: '', message: '' } }],
    });
  };

  const removeAction = (idx: number) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.filter((_, i) => i !== idx),
    });
  };

  const updateAction = (idx: number, patch: Partial<AutomationAction>) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    });
  };

  const updateActionConfig = (idx: number, key: string, value: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.map((a, i) =>
        i === idx ? { ...a, config: { ...a.config, [key]: value } } : a,
      ),
    });
  };

  // ── Render helpers ────────────────────────────────────────────────────

  const inputClass =
    'px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  const stats = [
    { label: t('automations.totalRules'), value: totalRules, icon: Zap, color: 'bg-secondary/10', iconColor: 'text-secondary' },
    { label: t('automations.activeRules'), value: activeRules, icon: Activity, color: 'bg-success/10', iconColor: 'text-success' },
    { label: t('automations.executionsRecent'), value: executionsToday, icon: Play, color: 'bg-blue-500/10', iconColor: 'text-blue-600' },
    { label: t('automations.successRate'), value: `${successRate}%`, icon: CheckCircle, color: 'bg-warning/10', iconColor: 'text-warning' },
  ];

  // ── Action config fields based on type ────────────────────────────────

  function renderActionConfig(action: AutomationAction, idx: number) {
    switch (action.type) {
      case 'SEND_EMAIL':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Template name" value={action.config.template ?? ''} onChange={(e) => updateActionConfig(idx, 'template', e.target.value)} />
            <input className={inputClass} placeholder="Recipient field (e.g. guest.email)" value={action.config.recipient ?? ''} onChange={(e) => updateActionConfig(idx, 'recipient', e.target.value)} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Subject" value={action.config.subject ?? ''} onChange={(e) => updateActionConfig(idx, 'subject', e.target.value)} />
          </div>
        );
      case 'SEND_WHATSAPP':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Template name" value={action.config.template ?? ''} onChange={(e) => updateActionConfig(idx, 'template', e.target.value)} />
            <input className={inputClass} placeholder="Phone field (e.g. guest.phone)" value={action.config.phoneField ?? ''} onChange={(e) => updateActionConfig(idx, 'phoneField', e.target.value)} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Message" value={action.config.message ?? ''} onChange={(e) => updateActionConfig(idx, 'message', e.target.value)} />
          </div>
        );
      case 'CREATE_TASK':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <input className={inputClass} placeholder="Task title" value={action.config.title ?? ''} onChange={(e) => updateActionConfig(idx, 'title', e.target.value)} />
            <select className={inputClass} value={action.config.taskType ?? ''} onChange={(e) => updateActionConfig(idx, 'taskType', e.target.value)}>
              <option value="">Task type...</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INSPECTION">Inspection</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="OTHER">Other</option>
            </select>
            <select className={inputClass} value={action.config.priority ?? ''} onChange={(e) => updateActionConfig(idx, 'priority', e.target.value)}>
              <option value="">Priority...</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input className={inputClass} placeholder="Due date offset (e.g. 1)" value={action.config.dueDateOffset ?? ''} onChange={(e) => updateActionConfig(idx, 'dueDateOffset', e.target.value)} />
            <select className={inputClass} value={action.config.dueDateUnit ?? 'days'} onChange={(e) => updateActionConfig(idx, 'dueDateUnit', e.target.value)}>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        );
      case 'CREATE_NOTIFICATION':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Title" value={action.config.title ?? ''} onChange={(e) => updateActionConfig(idx, 'title', e.target.value)} />
            <select className={inputClass} value={action.config.priority ?? ''} onChange={(e) => updateActionConfig(idx, 'priority', e.target.value)}>
              <option value="">Priority...</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <input className={`${inputClass} sm:col-span-2`} placeholder="Message" value={action.config.message ?? ''} onChange={(e) => updateActionConfig(idx, 'message', e.target.value)} />
          </div>
        );
      case 'UPDATE_STATUS':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Entity (e.g. expense, booking)" value={action.config.entity ?? ''} onChange={(e) => updateActionConfig(idx, 'entity', e.target.value)} />
            <input className={inputClass} placeholder="New status" value={action.config.newStatus ?? ''} onChange={(e) => updateActionConfig(idx, 'newStatus', e.target.value)} />
          </div>
        );
      case 'SEND_WEBHOOK':
        return (
          <div className="grid grid-cols-1 gap-3 mt-3">
            <input className={inputClass} placeholder="Webhook URL" value={action.config.url ?? ''} onChange={(e) => updateActionConfig(idx, 'url', e.target.value)} />
            <input className={inputClass} placeholder="Payload template (JSON)" value={action.config.payload ?? ''} onChange={(e) => updateActionConfig(idx, 'payload', e.target.value)} />
          </div>
        );
      case 'DELAY':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Duration" value={action.config.duration ?? ''} onChange={(e) => updateActionConfig(idx, 'duration', e.target.value)} />
            <select className={inputClass} value={action.config.unit ?? 'minutes'} onChange={(e) => updateActionConfig(idx, 'unit', e.target.value)}>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        );
      case 'CREATE_EXPENSE':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input className={inputClass} placeholder="Category" value={action.config.category ?? ''} onChange={(e) => updateActionConfig(idx, 'category', e.target.value)} />
            <input className={inputClass} placeholder="Amount field" value={action.config.amountField ?? ''} onChange={(e) => updateActionConfig(idx, 'amountField', e.target.value)} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Description" value={action.config.description ?? ''} onChange={(e) => updateActionConfig(idx, 'description', e.target.value)} />
          </div>
        );
      default:
        return (
          <div className="mt-3">
            <input className={inputClass + ' w-full'} placeholder="Config (JSON)" value={action.config.raw ?? ''} onChange={(e) => updateActionConfig(idx, 'raw', e.target.value)} />
          </div>
        );
    }
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            {t('automations.label')}
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            {t('automations.title')}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t('automations.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View tabs */}
          <div className="flex bg-surface-container-lowest rounded-lg ambient-shadow overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'gradient-accent text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              {t('automations.rules')}
            </button>
            <button
              onClick={() => setView('logs')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'logs' ? 'gradient-accent text-white' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              {t('automations.logs')}
            </button>
          </div>

          {view !== 'builder' && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('automations.createRule')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {view !== 'builder' && (
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
      )}

      {/* ── List View ────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const tc = triggerColorMap[rule.trigger.type] ?? { badge: 'bg-outline-variant/20 text-on-surface-variant', border: 'border-s-outline-variant' };
            return (
              <div
                key={rule.id}
                className={`bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden border-s-4 ${tc.border} transition-all hover:shadow-ambient-lg`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-headline font-bold text-on-surface text-base truncate">
                          {rule.name}
                        </h3>
                        {!rule.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-outline-variant/20 text-on-surface-variant flex-shrink-0">
                            {t('automations.inactive')}
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2">
                          {rule.description}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className="flex-shrink-0 mt-0.5"
                      title={rule.isActive ? t('automations.deactivate') : t('automations.activate')}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="w-8 h-8 text-secondary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-on-surface-variant/40" />
                      )}
                    </button>
                  </div>

                  {/* Trigger + meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${tc.badge}`}>
                      <Zap className="w-3 h-3" />
                      {getTriggerLabel(rule.trigger.type)}
                    </span>
                    {rule.conditions.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-outline-variant/15 text-on-surface-variant">
                        <FilterIcon className="w-3 h-3" />
                        {rule.conditions.length} {rule.conditions.length === 1 ? 'condition' : 'conditions'}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-outline-variant/15 text-on-surface-variant">
                      <ArrowRight className="w-3 h-3" />
                      {rule.actions.length} {rule.actions.length === 1 ? 'action' : 'actions'}
                    </span>
                  </div>

                  {/* Last execution */}
                  {rule.lastExecution && (
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mb-3">
                      <Clock className="w-3 h-3" />
                      {t('automations.lastRun')}: {timeAgo(rule.lastExecution)}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/10">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant bg-surface-container-high/40 hover:bg-surface-container-high transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleTest(rule)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20 transition-colors"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      {t('automations.test')}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-error bg-error/10 hover:bg-error/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Test results panel */}
                {testResults?.ruleId === rule.id && (
                  <div className="bg-secondary/5 border-t border-secondary/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" />
                        {t('automations.testResults')}
                      </p>
                      <button onClick={() => setTestResults(null)} className="text-on-surface-variant hover:text-on-surface">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {testResults.results.map((result, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-on-surface leading-relaxed">{result}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {rules.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest rounded-xl ambient-shadow p-12 text-center">
              <Zap className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
              <h3 className="font-headline font-bold text-on-surface text-lg mb-2">{t('automations.emptyTitle')}</h3>
              <p className="text-sm text-on-surface-variant mb-4">{t('automations.emptyDescription')}</p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                {t('automations.createRule')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Builder View ─────────────────────────────────────────────────── */}
      {view === 'builder' && editingRule && (
        <div className="space-y-6 max-w-4xl">
          {/* Rule name & description */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6">
            <h2 className="font-headline font-bold text-on-surface text-lg mb-4">
              {editingId ? t('automations.editRule') : t('automations.newRule')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  {t('automations.ruleName')}
                </label>
                <input
                  className={inputClass + ' w-full'}
                  placeholder={t('automations.ruleNamePlaceholder')}
                  value={editingRule.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  {t('automations.ruleDescription')}
                </label>
                <input
                  className={inputClass + ' w-full'}
                  placeholder={t('automations.ruleDescriptionPlaceholder')}
                  value={editingRule.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Visual flow connector */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-outline-variant/30" />
          </div>

          {/* Step 1: Trigger */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border-s-4 border-s-secondary">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center text-white text-[10px] font-bold">1</div>
              <h3 className="font-headline font-bold text-on-surface text-sm">
                {t('automations.whenThisHappens')}
              </h3>
            </div>
            <div className="space-y-3">
              {triggerGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.triggers.map((trigger) => (
                      <button
                        key={trigger.type}
                        onClick={() => updateField('trigger', { type: trigger.type })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          editingRule.trigger.type === trigger.type
                            ? 'gradient-accent text-white shadow-ambient'
                            : `${group.color} hover:opacity-80`
                        }`}
                      >
                        {trigger.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {editingRule.trigger.type === 'SCHEDULE' && (
                <div className="mt-3">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Cron Expression
                  </label>
                  <input
                    className={inputClass + ' w-full sm:w-64'}
                    placeholder="0 9 * * * (daily at 9am)"
                    value={(editingRule.trigger.config?.cron as string) ?? ''}
                    onChange={(e) =>
                      updateField('trigger', { ...editingRule.trigger, config: { cron: e.target.value } })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-outline-variant/30" />
              <ChevronRight className="w-4 h-4 text-on-surface-variant/40 rotate-90" />
              <div className="w-px h-4 bg-outline-variant/30" />
            </div>
          </div>

          {/* Step 2: Conditions */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border-s-4 border-s-warning">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-[10px] font-bold">2</div>
                <h3 className="font-headline font-bold text-on-surface text-sm">
                  {t('automations.onlyIf')}
                </h3>
                <span className="text-[10px] text-on-surface-variant">({t('automations.optional')})</span>
              </div>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-warning bg-warning/10 hover:bg-warning/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('automations.addCondition')}
              </button>
            </div>

            {editingRule.conditions.length === 0 && (
              <p className="text-xs text-on-surface-variant italic py-2">
                {t('automations.noConditions')}
              </p>
            )}

            <div className="space-y-3">
              {editingRule.conditions.map((cond, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-surface-container-low/50">
                  {idx > 0 && (
                    <span className="text-[10px] font-semibold text-warning uppercase tracking-wider">AND</span>
                  )}
                  <select
                    className={inputClass + ' flex-1 min-w-[160px]'}
                    value={cond.field}
                    onChange={(e) => updateCondition(idx, { field: e.target.value })}
                  >
                    {conditionFields.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    className={inputClass + ' w-32'}
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, { operator: e.target.value as ConditionOperator })}
                  >
                    {Object.entries(operatorLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v} ({k.replace('_', ' ')})</option>
                    ))}
                  </select>
                  <input
                    className={inputClass + ' flex-1 min-w-[100px]'}
                    placeholder={t('automations.value')}
                    value={cond.value}
                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                  />
                  <button
                    onClick={() => removeCondition(idx)}
                    className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-outline-variant/30" />
              <ChevronRight className="w-4 h-4 text-on-surface-variant/40 rotate-90" />
              <div className="w-px h-4 bg-outline-variant/30" />
            </div>
          </div>

          {/* Step 3: Actions */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border-s-4 border-s-success">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">3</div>
                <h3 className="font-headline font-bold text-on-surface text-sm">
                  {t('automations.thenDo')}
                </h3>
              </div>
              <button
                onClick={addAction}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('automations.addAction')}
              </button>
            </div>

            <div className="space-y-4">
              {editingRule.actions.map((action, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        {t('automations.action')} {idx + 1}
                      </span>
                      {idx > 0 && (
                        <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider">
                          then
                        </span>
                      )}
                    </div>
                    {editingRule.actions.length > 1 && (
                      <button
                        onClick={() => removeAction(idx)}
                        className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <select
                    className={inputClass + ' w-full mt-2'}
                    value={action.type}
                    onChange={(e) => updateAction(idx, { type: e.target.value as ActionType, config: {} })}
                  >
                    {actionOptions.map((a) => (
                      <option key={a.type} value={a.type}>{a.label}</option>
                    ))}
                  </select>
                  {renderActionConfig(action, idx)}
                </div>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
            >
              <X className="w-4 h-4" />
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:shadow-ambient-lg transition-all"
            >
              <Check className="w-4 h-4" />
              {editingId ? t('automations.saveChanges') : t('automations.createRule')}
            </button>
          </div>
        </div>
      )}

      {/* ── Logs View ────────────────────────────────────────────────────── */}
      {view === 'logs' && (
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('automations.timestamp')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('automations.ruleName')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('automations.trigger')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('automations.result')}
                  </th>
                  <th className="text-start px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    {t('automations.details')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">{log.ruleName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${triggerColorMap[log.triggerEvent]?.badge ?? 'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {log.triggerEvent.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${resultStyles[log.result]}`}>
                        {log.result === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                        {log.result === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {log.result === 'SIMULATED' && <FlaskConical className="w-3 h-3" />}
                        {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-on-surface-variant">
                      {t('common.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
