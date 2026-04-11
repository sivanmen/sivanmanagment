import { ApiError } from '../../utils/api-error';

type ExpenseCategory = 'MAINTENANCE' | 'UTILITIES' | 'SUPPLIES' | 'CLEANING' | 'INSURANCE' | 'TAX' | 'MARKETING' | 'MANAGEMENT' | 'MISC';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

interface Expense {
  id: string;
  propertyId: string;
  propertyName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringSchedule?: {
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    nextDate: string;
    endDate?: string;
  };
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Budget {
  id: string;
  propertyId: string;
  propertyName: string;
  category: ExpenseCategory;
  year: number;
  month: number;
  budgetAmount: number;
  actualAmount: number;
  currency: string;
}

const expenses: Expense[] = [
  {
    id: 'exp-001', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'MAINTENANCE',
    description: 'Pool pump replacement', amount: 850, currency: 'EUR', date: '2026-01-15', vendor: 'Crete Pool Services',
    invoiceNumber: 'CPS-2026-142', receiptUrl: '/receipts/exp-001.pdf', isRecurring: false,
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-01-16T10:00:00Z', paidAt: '2026-01-18T08:00:00Z',
    tags: ['pool', 'repair'], createdBy: 'u-002', createdAt: '2026-01-15T09:00:00Z', updatedAt: '2026-01-18T08:00:00Z',
  },
  {
    id: 'exp-002', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'UTILITIES',
    description: 'Electricity bill - January', amount: 280, currency: 'EUR', date: '2026-01-31', vendor: 'DEI (PPC)',
    invoiceNumber: 'DEI-0125-EL', isRecurring: true,
    recurringSchedule: { frequency: 'MONTHLY', nextDate: '2026-02-28' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-02-01T09:00:00Z', paidAt: '2026-02-03T10:00:00Z',
    createdBy: 'u-002', createdAt: '2026-01-31T10:00:00Z', updatedAt: '2026-02-03T10:00:00Z',
  },
  {
    id: 'exp-003', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'MAINTENANCE',
    description: 'Plumbing repair - bathroom leak', amount: 380, currency: 'EUR', date: '2026-01-20', vendor: 'Yannis Plumbing',
    invoiceNumber: 'YP-2026-23', receiptUrl: '/receipts/exp-003.pdf', isRecurring: false,
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-01-21T08:00:00Z', paidAt: '2026-01-22T09:00:00Z',
    tags: ['plumbing', 'urgent'], createdBy: 'u-002', createdAt: '2026-01-20T14:00:00Z', updatedAt: '2026-01-22T09:00:00Z',
  },
  {
    id: 'exp-004', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'UTILITIES',
    description: 'Water bill - Q1 2026', amount: 95, currency: 'EUR', date: '2026-03-15', vendor: 'DEYAX Chania',
    invoiceNumber: 'DEYAX-Q1-26', isRecurring: true,
    recurringSchedule: { frequency: 'QUARTERLY', nextDate: '2026-06-15' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-03-16T08:00:00Z', paidAt: '2026-03-18T10:00:00Z',
    createdBy: 'u-002', createdAt: '2026-03-15T11:00:00Z', updatedAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'exp-005', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'CLEANING',
    description: 'Deep cleaning after guest checkout', amount: 180, currency: 'EUR', date: '2026-02-10', vendor: 'Sparkle Clean Crete',
    invoiceNumber: 'SCC-2026-055', isRecurring: false,
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-02-11T09:00:00Z', paidAt: '2026-02-12T10:00:00Z',
    createdBy: 'u-002', createdAt: '2026-02-10T16:00:00Z', updatedAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'exp-006', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'SUPPLIES',
    description: 'Guest welcome kit supplies (towels, soaps, coffee)', amount: 220, currency: 'EUR', date: '2026-02-20',
    vendor: 'METRO Cash & Carry', invoiceNumber: 'MCC-2026-1842', receiptUrl: '/receipts/exp-006.pdf', isRecurring: false,
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-02-21T09:00:00Z', paidAt: '2026-02-22T08:00:00Z',
    tags: ['supplies', 'guest-welcome'], createdBy: 'u-002', createdAt: '2026-02-20T15:00:00Z', updatedAt: '2026-02-22T08:00:00Z',
  },
  {
    id: 'exp-007', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'INSURANCE',
    description: 'Property insurance premium Q1 2026', amount: 1200, currency: 'EUR', date: '2026-01-05',
    vendor: 'Ethniki Insurance', invoiceNumber: 'ETH-2026-V001', isRecurring: true,
    recurringSchedule: { frequency: 'QUARTERLY', nextDate: '2026-04-05' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-01-06T08:00:00Z', paidAt: '2026-01-07T10:00:00Z',
    createdBy: 'u-001', createdAt: '2026-01-05T08:00:00Z', updatedAt: '2026-01-07T10:00:00Z',
  },
  {
    id: 'exp-008', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'TAX',
    description: 'ENFIA property tax 2026 - installment 1', amount: 800, currency: 'EUR', date: '2026-03-20',
    vendor: 'AADE Tax Authority', invoiceNumber: 'ENFIA-2026-01', isRecurring: true,
    recurringSchedule: { frequency: 'QUARTERLY', nextDate: '2026-06-20' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-03-20T09:00:00Z', paidAt: '2026-03-20T09:30:00Z',
    createdBy: 'u-001', createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-20T09:30:00Z',
  },
  {
    id: 'exp-009', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'MAINTENANCE',
    description: 'Garden maintenance and lawn mowing', amount: 150, currency: 'EUR', date: '2026-03-01',
    vendor: 'Green Thumb Crete', invoiceNumber: 'GTC-2026-018', isRecurring: true,
    recurringSchedule: { frequency: 'MONTHLY', nextDate: '2026-04-01' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-03-02T08:00:00Z', paidAt: '2026-03-03T10:00:00Z',
    tags: ['garden', 'recurring'], createdBy: 'u-002', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-03T10:00:00Z',
  },
  {
    id: 'exp-010', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'SUPPLIES',
    description: 'Replacement bed linens and pillows', amount: 340, currency: 'EUR', date: '2026-03-10',
    vendor: 'IKEA Greece Online', invoiceNumber: 'IKEA-2026-GR-5521', receiptUrl: '/receipts/exp-010.pdf', isRecurring: false,
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-03-11T09:00:00Z', paidAt: '2026-03-14T08:00:00Z',
    tags: ['linens', 'replacement'], createdBy: 'u-002', createdAt: '2026-03-10T12:00:00Z', updatedAt: '2026-03-14T08:00:00Z',
  },
  {
    id: 'exp-011', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'UTILITIES',
    description: 'Internet service - March 2026', amount: 35, currency: 'EUR', date: '2026-03-05',
    vendor: 'Cosmote', invoiceNumber: 'COS-2026-03-R003', isRecurring: true,
    recurringSchedule: { frequency: 'MONTHLY', nextDate: '2026-04-05' },
    approvalStatus: 'PAID', approvedBy: 'u-001', approvedAt: '2026-03-06T08:00:00Z', paidAt: '2026-03-07T10:00:00Z',
    createdBy: 'u-002', createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-03-07T10:00:00Z',
  },
  {
    id: 'exp-012', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'MANAGEMENT',
    description: 'Management commission - March 2026', amount: 430, currency: 'EUR', date: '2026-03-31',
    isRecurring: true, recurringSchedule: { frequency: 'MONTHLY', nextDate: '2026-04-30' },
    approvalStatus: 'APPROVED', approvedBy: 'u-001', approvedAt: '2026-04-01T09:00:00Z',
    createdBy: 'u-001', createdAt: '2026-03-31T14:00:00Z', updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'exp-013', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'CLEANING',
    description: 'AC filter cleaning and sanitization', amount: 120, currency: 'EUR', date: '2026-04-02',
    vendor: 'Cool Air Chania', invoiceNumber: 'CAC-2026-041', isRecurring: false,
    approvalStatus: 'APPROVED', approvedBy: 'u-001', approvedAt: '2026-04-03T08:00:00Z',
    tags: ['AC', 'seasonal'], createdBy: 'u-002', createdAt: '2026-04-02T10:00:00Z', updatedAt: '2026-04-03T08:00:00Z',
  },
  {
    id: 'exp-014', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'MAINTENANCE',
    description: 'Outdoor shower repair and tile replacement', amount: 520, currency: 'EUR', date: '2026-04-05',
    vendor: 'Kostas Construction', invoiceNumber: 'KC-2026-089', receiptUrl: '/receipts/exp-014.pdf', isRecurring: false,
    approvalStatus: 'PENDING', notes: 'Waiting for second quote before approval',
    tags: ['shower', 'tiles'], createdBy: 'u-002', createdAt: '2026-04-05T11:00:00Z', updatedAt: '2026-04-05T11:00:00Z',
  },
  {
    id: 'exp-015', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'MARKETING',
    description: 'Professional photography session - summer listing update', amount: 450, currency: 'EUR', date: '2026-04-08',
    vendor: 'Lens & Light Studios', invoiceNumber: 'LLS-2026-033', isRecurring: false,
    approvalStatus: 'PENDING', notes: 'Scheduled for April 15',
    tags: ['photography', 'listing'], createdBy: 'u-002', createdAt: '2026-04-08T14:00:00Z', updatedAt: '2026-04-08T14:00:00Z',
  },
  {
    id: 'exp-016', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'MISC',
    description: 'Smart lock battery replacement and spare keys', amount: 65, currency: 'EUR', date: '2026-04-10',
    vendor: 'KeyTech Crete', invoiceNumber: 'KTC-2026-012', isRecurring: false,
    approvalStatus: 'PENDING',
    tags: ['lock', 'access'], createdBy: 'u-002', createdAt: '2026-04-10T09:00:00Z', updatedAt: '2026-04-10T09:00:00Z',
  },
];

const budgets: Budget[] = [
  { id: 'bud-001', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'MAINTENANCE', year: 2026, month: 1, budgetAmount: 1000, actualAmount: 850, currency: 'EUR' },
  { id: 'bud-002', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'UTILITIES', year: 2026, month: 1, budgetAmount: 350, actualAmount: 280, currency: 'EUR' },
  { id: 'bud-003', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'CLEANING', year: 2026, month: 2, budgetAmount: 200, actualAmount: 180, currency: 'EUR' },
  { id: 'bud-004', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'MAINTENANCE', year: 2026, month: 1, budgetAmount: 500, actualAmount: 380, currency: 'EUR' },
  { id: 'bud-005', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', category: 'SUPPLIES', year: 2026, month: 3, budgetAmount: 400, actualAmount: 340, currency: 'EUR' },
  { id: 'bud-006', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'SUPPLIES', year: 2026, month: 2, budgetAmount: 250, actualAmount: 220, currency: 'EUR' },
  { id: 'bud-007', propertyId: 'prop-003', propertyName: 'Rethymno Beach House', category: 'MAINTENANCE', year: 2026, month: 3, budgetAmount: 200, actualAmount: 150, currency: 'EUR' },
  { id: 'bud-008', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', category: 'INSURANCE', year: 2026, month: 1, budgetAmount: 1200, actualAmount: 1200, currency: 'EUR' },
];

export class ExpensesService {
  async getAllExpenses(filters: {
    propertyId?: string;
    category?: string;
    approvalStatus?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    vendor?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      propertyId, category, approvalStatus, isRecurring,
      startDate, endDate, vendor, search,
      page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc',
    } = filters;

    let filtered = [...expenses];
    if (propertyId) filtered = filtered.filter((e) => e.propertyId === propertyId);
    if (category) filtered = filtered.filter((e) => e.category === category);
    if (approvalStatus) filtered = filtered.filter((e) => e.approvalStatus === approvalStatus);
    if (isRecurring !== undefined) filtered = filtered.filter((e) => e.isRecurring === isRecurring);
    if (startDate) filtered = filtered.filter((e) => e.date >= startDate);
    if (endDate) filtered = filtered.filter((e) => e.date <= endDate);
    if (vendor) {
      const v = vendor.toLowerCase();
      filtered = filtered.filter((e) => e.vendor && e.vendor.toLowerCase().includes(v));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.propertyName.toLowerCase().includes(q) ||
          (e.vendor && e.vendor.toLowerCase().includes(q)) ||
          (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))),
      );
    }

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { expenses: items, total, page, limit };
  }

  async getExpenseById(id: string) {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) throw ApiError.notFound('Expense');
    return expense;
  }

  async createExpense(data: Omit<Expense, 'id' | 'approvalStatus' | 'createdAt' | 'updatedAt'>, createdBy: string) {
    const expense: Expense = {
      ...data,
      id: `exp-${String(expenses.length + 1).padStart(3, '0')}`,
      approvalStatus: 'PENDING',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.push(expense);
    return expense;
  }

  async updateExpense(id: string, data: Partial<Expense>) {
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Expense');
    if (expenses[idx].approvalStatus === 'PAID') throw ApiError.badRequest('Cannot edit a paid expense');

    expenses[idx] = { ...expenses[idx], ...data, updatedAt: new Date().toISOString() };
    return expenses[idx];
  }

  async deleteExpense(id: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Expense');
    if (expenses[idx].approvalStatus === 'PAID') throw ApiError.badRequest('Cannot delete a paid expense');

    const removed = expenses.splice(idx, 1);
    return removed[0];
  }

  async approveExpense(id: string, approvedBy: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Expense');
    if (expenses[idx].approvalStatus !== 'PENDING') throw ApiError.badRequest('Only pending expenses can be approved');

    expenses[idx].approvalStatus = 'APPROVED';
    expenses[idx].approvedBy = approvedBy;
    expenses[idx].approvedAt = new Date().toISOString();
    expenses[idx].updatedAt = new Date().toISOString();

    return expenses[idx];
  }

  async rejectExpense(id: string, reason?: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Expense');
    if (expenses[idx].approvalStatus !== 'PENDING') throw ApiError.badRequest('Only pending expenses can be rejected');

    expenses[idx].approvalStatus = 'REJECTED';
    if (reason) expenses[idx].notes = reason;
    expenses[idx].updatedAt = new Date().toISOString();

    return expenses[idx];
  }

  async markAsPaid(id: string) {
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Expense');
    if (expenses[idx].approvalStatus !== 'APPROVED') throw ApiError.badRequest('Only approved expenses can be marked as paid');

    expenses[idx].approvalStatus = 'PAID';
    expenses[idx].paidAt = new Date().toISOString();
    expenses[idx].updatedAt = new Date().toISOString();

    return expenses[idx];
  }

  async getRecurringExpenses(filters: { propertyId?: string }) {
    let filtered = expenses.filter((e) => e.isRecurring);
    if (filters.propertyId) filtered = filtered.filter((e) => e.propertyId === filters.propertyId);

    return filtered.map((e) => ({
      id: e.id,
      propertyId: e.propertyId,
      propertyName: e.propertyName,
      category: e.category,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      vendor: e.vendor,
      schedule: e.recurringSchedule,
    }));
  }

  async getBudgetVsActual(filters: { propertyId?: string; year?: number; month?: number }) {
    const { propertyId, year, month } = filters;

    let filtered = [...budgets];
    if (propertyId) filtered = filtered.filter((b) => b.propertyId === propertyId);
    if (year) filtered = filtered.filter((b) => b.year === year);
    if (month) filtered = filtered.filter((b) => b.month === month);

    const totalBudget = filtered.reduce((s, b) => s + b.budgetAmount, 0);
    const totalActual = filtered.reduce((s, b) => s + b.actualAmount, 0);

    return {
      items: filtered,
      summary: {
        totalBudget,
        totalActual,
        variance: totalBudget - totalActual,
        utilizationRate: totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0,
      },
    };
  }

  async getStats(filters: { propertyId?: string; startDate?: string; endDate?: string }) {
    let filtered = [...expenses];
    if (filters.propertyId) filtered = filtered.filter((e) => e.propertyId === filters.propertyId);
    if (filters.startDate) filtered = filtered.filter((e) => e.date >= filters.startDate!);
    if (filters.endDate) filtered = filtered.filter((e) => e.date <= filters.endDate!);

    const total = filtered.reduce((s, e) => s + e.amount, 0);

    const byCategory = filtered.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byProperty = filtered.reduce(
      (acc, e) => {
        acc[e.propertyName] = (acc[e.propertyName] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = {
      pending: filtered.filter((e) => e.approvalStatus === 'PENDING').length,
      approved: filtered.filter((e) => e.approvalStatus === 'APPROVED').length,
      rejected: filtered.filter((e) => e.approvalStatus === 'REJECTED').length,
      paid: filtered.filter((e) => e.approvalStatus === 'PAID').length,
    };

    return {
      totalExpenses: total,
      count: filtered.length,
      averageExpense: filtered.length > 0 ? Math.round(total / filtered.length) : 0,
      byCategory,
      byProperty,
      byStatus,
    };
  }
}

export const expensesService = new ExpensesService();
