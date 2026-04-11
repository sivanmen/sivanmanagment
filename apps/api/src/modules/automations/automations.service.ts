import { ApiError } from '../../utils/api-error';
import { randomUUID } from 'crypto';

// ── Types ───────────────────────────────────────────────────────────────────

export type TriggerType =
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

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in';

export type ActionType =
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

export interface AutomationTrigger {
  type: TriggerType;
  config?: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  result: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  details: string;
  timestamp: Date;
}

export type CreateRuleInput = Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRuleInput = Partial<Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>>;

// ── Seed data ───────────────────────────────────────────────────────────────

const seedRules: AutomationRule[] = [
  {
    id: randomUUID(),
    name: 'Auto-create cleaning task',
    description: 'Automatically create a cleaning task when a guest checks out.',
    isActive: true,
    trigger: { type: 'CHECK_OUT' },
    conditions: [],
    actions: [
      {
        type: 'CREATE_TASK',
        config: {
          taskType: 'CLEANING',
          title: 'Post-checkout cleaning',
          dueDateOffset: 1,
          dueDateUnit: 'days',
          priority: 'HIGH',
        },
      },
    ],
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-15'),
  },
  {
    id: randomUUID(),
    name: 'Send booking confirmation',
    description: 'Send a confirmation email to the guest when a booking is confirmed.',
    isActive: true,
    trigger: { type: 'BOOKING_CONFIRMED' },
    conditions: [],
    actions: [
      {
        type: 'SEND_EMAIL',
        config: {
          template: 'booking_confirmed',
          recipient: 'guest.email',
          subject: 'Your booking is confirmed!',
        },
      },
    ],
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-03-10'),
  },
  {
    id: randomUUID(),
    name: 'Alert high-value booking',
    description: 'Send a notification when a booking over 2000 EUR is created.',
    isActive: true,
    trigger: { type: 'BOOKING_CREATED' },
    conditions: [
      { field: 'booking.totalAmount', operator: 'greater_than', value: 2000 },
    ],
    actions: [
      {
        type: 'CREATE_NOTIFICATION',
        config: {
          title: 'High-value booking received',
          message: 'A booking over \u20AC2,000 has been created.',
          priority: 'HIGH',
        },
      },
    ],
    createdAt: new Date('2026-03-05'),
    updatedAt: new Date('2026-03-12'),
  },
  {
    id: randomUUID(),
    name: 'Auto-approve small expenses',
    description: 'Automatically approve expenses under 50 EUR.',
    isActive: false,
    trigger: { type: 'EXPENSE_CREATED' },
    conditions: [
      { field: 'expense.amount', operator: 'less_than', value: 50 },
    ],
    actions: [
      {
        type: 'UPDATE_STATUS',
        config: {
          entity: 'expense',
          newStatus: 'AUTO_APPROVED',
        },
      },
    ],
    createdAt: new Date('2026-03-08'),
    updatedAt: new Date('2026-03-08'),
  },
  {
    id: randomUUID(),
    name: 'Welcome returning guest',
    description: 'Send a WhatsApp welcome-back message for returning guests with 3+ stays.',
    isActive: true,
    trigger: { type: 'BOOKING_CREATED' },
    conditions: [
      { field: 'guest.totalStays', operator: 'greater_than', value: 2 },
    ],
    actions: [
      {
        type: 'SEND_WHATSAPP',
        config: {
          template: 'welcome_back',
          phoneField: 'guest.phone',
          message: 'Welcome back! We are glad to have you again.',
        },
      },
    ],
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-04-01'),
  },
];

// ── Service ─────────────────────────────────────────────────────────────────

export class AutomationsService {
  private rules: AutomationRule[] = [...seedRules];
  private logs: ExecutionLog[] = [
    {
      id: randomUUID(),
      ruleId: seedRules[0].id,
      ruleName: seedRules[0].name,
      triggerEvent: 'CHECK_OUT',
      result: 'SUCCESS',
      details: 'Created cleaning task for Elounda Breeze Villa',
      timestamp: new Date('2026-04-10T14:30:00'),
    },
    {
      id: randomUUID(),
      ruleId: seedRules[1].id,
      ruleName: seedRules[1].name,
      triggerEvent: 'BOOKING_CONFIRMED',
      result: 'SUCCESS',
      details: 'Sent confirmation email to maria.p@gmail.com',
      timestamp: new Date('2026-04-10T12:15:00'),
    },
    {
      id: randomUUID(),
      ruleId: seedRules[2].id,
      ruleName: seedRules[2].name,
      triggerEvent: 'BOOKING_CREATED',
      result: 'SUCCESS',
      details: 'Notification created: High-value booking \u20AC2,450 for Elounda Breeze Villa',
      timestamp: new Date('2026-04-09T18:42:00'),
    },
    {
      id: randomUUID(),
      ruleId: seedRules[4].id,
      ruleName: seedRules[4].name,
      triggerEvent: 'BOOKING_CREATED',
      result: 'FAILED',
      details: 'WhatsApp delivery failed: phone number not verified',
      timestamp: new Date('2026-04-09T10:05:00'),
    },
    {
      id: randomUUID(),
      ruleId: seedRules[0].id,
      ruleName: seedRules[0].name,
      triggerEvent: 'CHECK_OUT',
      result: 'SUCCESS',
      details: 'Created cleaning task for Rethymno Sunset Apartment',
      timestamp: new Date('2026-04-08T11:00:00'),
    },
  ];

  // ── CRUD ────────────────────────────────────────────────────────────────

  async getAllRules(): Promise<AutomationRule[]> {
    return [...this.rules].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async getRuleById(id: string): Promise<AutomationRule> {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) {
      throw ApiError.notFound('AutomationRule');
    }
    return rule;
  }

  async createRule(data: CreateRuleInput): Promise<AutomationRule> {
    const now = new Date();
    const rule: AutomationRule = {
      id: randomUUID(),
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      trigger: data.trigger,
      conditions: data.conditions ?? [],
      actions: data.actions ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.rules.push(rule);
    return rule;
  }

  async updateRule(id: string, data: UpdateRuleInput): Promise<AutomationRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('AutomationRule');
    }

    this.rules[idx] = {
      ...this.rules[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.rules[idx];
  }

  async deleteRule(id: string): Promise<{ message: string }> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('AutomationRule');
    }
    this.rules.splice(idx, 1);
    return { message: 'Automation rule deleted successfully' };
  }

  async toggleRule(id: string): Promise<AutomationRule> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw ApiError.notFound('AutomationRule');
    }

    this.rules[idx].isActive = !this.rules[idx].isActive;
    this.rules[idx].updatedAt = new Date();
    return this.rules[idx];
  }

  // ── Execution ───────────────────────────────────────────────────────────

  async testRule(id: string): Promise<{ simulated: boolean; results: string[] }> {
    const rule = await this.getRuleById(id);

    const results: string[] = [];

    // Simulate condition evaluation
    if (rule.conditions.length > 0) {
      results.push(
        `Evaluating ${rule.conditions.length} condition(s): ${rule.conditions.map((c) => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`).join(' AND ')}`,
      );
      results.push('Conditions evaluated: PASS (simulated)');
    } else {
      results.push('No conditions to evaluate - trigger fires unconditionally');
    }

    // Simulate each action
    for (const action of rule.actions) {
      switch (action.type) {
        case 'SEND_EMAIL':
          results.push(
            `Would send email: template="${action.config.template}", to="${action.config.recipient}"`,
          );
          break;
        case 'SEND_WHATSAPP':
          results.push(
            `Would send WhatsApp: template="${action.config.template}", to="${action.config.phoneField}"`,
          );
          break;
        case 'CREATE_TASK':
          results.push(
            `Would create task: type="${action.config.taskType}", title="${action.config.title}", due in ${action.config.dueDateOffset} ${action.config.dueDateUnit}`,
          );
          break;
        case 'CREATE_NOTIFICATION':
          results.push(
            `Would create notification: "${action.config.title}" (priority: ${action.config.priority})`,
          );
          break;
        case 'UPDATE_STATUS':
          results.push(
            `Would update ${action.config.entity} status to "${action.config.newStatus}"`,
          );
          break;
        case 'ASSIGN_TO':
          results.push(`Would assign to user: "${action.config.userId}"`);
          break;
        case 'ADD_TAG':
          results.push(`Would add tag: "${action.config.tag}"`);
          break;
        case 'CALCULATE_FEE':
          results.push(`Would calculate fee with config: ${JSON.stringify(action.config)}`);
          break;
        case 'SEND_WEBHOOK':
          results.push(`Would send webhook to: "${action.config.url}"`);
          break;
        case 'DELAY':
          results.push(
            `Would delay ${action.config.duration} ${action.config.unit} before next action`,
          );
          break;
        case 'CREATE_EXPENSE':
          results.push(
            `Would create expense: category="${action.config.category}", description="${action.config.description}"`,
          );
          break;
        default:
          results.push(`Would execute action: ${action.type}`);
      }
    }

    // Add a simulated log entry
    this.logs.unshift({
      id: randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: rule.trigger.type,
      result: 'SIMULATED',
      details: results.join('; '),
      timestamp: new Date(),
    });

    return { simulated: true, results };
  }

  async executeRule(
    ruleId: string,
    _triggerData: Record<string, unknown>,
  ): Promise<ExecutionLog> {
    const rule = await this.getRuleById(ruleId);

    // In a real implementation this would evaluate conditions and run actions.
    // For now we just log what would happen.
    const log: ExecutionLog = {
      id: randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      triggerEvent: rule.trigger.type,
      result: 'SUCCESS',
      details: `Executed ${rule.actions.length} action(s) for trigger ${rule.trigger.type}`,
      timestamp: new Date(),
    };

    this.logs.unshift(log);
    return log;
  }

  async getExecutionLog(ruleId?: string): Promise<ExecutionLog[]> {
    if (ruleId) {
      return this.logs.filter((l) => l.ruleId === ruleId);
    }
    return [...this.logs].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}

export const automationsService = new AutomationsService();
