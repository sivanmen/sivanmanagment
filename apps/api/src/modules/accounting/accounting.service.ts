import { ApiError } from '../../utils/api-error';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY';
  subType: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  propertyId?: string;
  propertyName?: string;
  ownerId?: string;
  ownerName?: string;
  bookingId?: string;
  lines: JournalLine[];
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  postedBy?: string;
  postedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

const accounts: Account[] = [
  { id: 'acc-001', code: '4000', name: 'Rental Revenue', type: 'REVENUE', subType: 'rental_income', description: 'Income from property rentals', isActive: true, balance: 28750, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-002', code: '4010', name: 'Cleaning Fees', type: 'REVENUE', subType: 'service_fees', description: 'Cleaning fees charged to guests', isActive: true, balance: 3200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-003', code: '4020', name: 'Late Checkout Fees', type: 'REVENUE', subType: 'service_fees', description: 'Late checkout charges', isActive: true, balance: 450, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-004', code: '5000', name: 'Maintenance Expense', type: 'EXPENSE', subType: 'maintenance', description: 'Property maintenance and repairs', isActive: true, balance: 4200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-005', code: '5010', name: 'Utilities Expense', type: 'EXPENSE', subType: 'utilities', description: 'Electricity, water, internet', isActive: true, balance: 2800, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-006', code: '5020', name: 'Cleaning Supplies', type: 'EXPENSE', subType: 'supplies', description: 'Cleaning and household supplies', isActive: true, balance: 1100, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-007', code: '5030', name: 'Insurance Expense', type: 'EXPENSE', subType: 'insurance', description: 'Property and liability insurance', isActive: true, balance: 3600, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-008', code: '5040', name: 'Property Tax', type: 'EXPENSE', subType: 'tax', description: 'Annual property taxes', isActive: true, balance: 2400, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-009', code: '5050', name: 'Management Fees', type: 'EXPENSE', subType: 'management', description: 'Property management commission', isActive: true, balance: 4312, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-010', code: '1000', name: 'Cash - Operating', type: 'ASSET', subType: 'cash', description: 'Main operating bank account', isActive: true, balance: 45200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-011', code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'receivable', description: 'Amounts owed by guests/platforms', isActive: true, balance: 8500, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-012', code: '1200', name: 'Security Deposits Held', type: 'ASSET', subType: 'deposits', description: 'Guest security deposits', isActive: true, balance: 3000, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-013', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'payable', description: 'Amounts owed to vendors', isActive: true, balance: 2200, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-014', code: '2100', name: 'Owner Payable', type: 'LIABILITY', subType: 'owner_payable', description: 'Net revenue owed to property owners', isActive: true, balance: 15800, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-015', code: '2200', name: 'VAT Payable', type: 'LIABILITY', subType: 'tax_payable', description: 'VAT collected, due to government', isActive: true, balance: 4600, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
  { id: 'acc-016', code: '3000', name: 'Retained Earnings', type: 'EQUITY', subType: 'retained', description: 'Accumulated net income', isActive: true, balance: 12500, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
];

const journalEntries: JournalEntry[] = [
  {
    id: 'je-001', entryNumber: 'JE-2026-001', date: '2026-01-15', description: 'Booking revenue - Villa Elounda Seafront (Jan stay)',
    propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', ownerId: 'owner-001', ownerName: 'Nikos Papadopoulos',
    lines: [
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 2500, credit: 0 },
      { accountId: 'acc-001', accountCode: '4000', accountName: 'Rental Revenue', debit: 0, credit: 2200 },
      { accountId: 'acc-002', accountCode: '4010', accountName: 'Cleaning Fees', debit: 0, credit: 150 },
      { accountId: 'acc-015', accountCode: '2200', accountName: 'VAT Payable', debit: 0, credit: 150 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-01-16T09:00:00Z',
    createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-16T09:00:00Z',
  },
  {
    id: 'je-002', entryNumber: 'JE-2026-002', date: '2026-01-20', description: 'Maintenance repair - Chania Old Town Apt plumbing',
    propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', ownerId: 'owner-002', ownerName: 'Elena Stavrou',
    lines: [
      { accountId: 'acc-004', accountCode: '5000', accountName: 'Maintenance Expense', debit: 380, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 380 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-01-21T08:00:00Z',
    createdAt: '2026-01-20T14:00:00Z', updatedAt: '2026-01-21T08:00:00Z',
  },
  {
    id: 'je-003', entryNumber: 'JE-2026-003', date: '2026-02-01', description: 'Monthly utilities - Villa Elounda Seafront',
    propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', ownerId: 'owner-001', ownerName: 'Nikos Papadopoulos',
    lines: [
      { accountId: 'acc-005', accountCode: '5010', accountName: 'Utilities Expense', debit: 420, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 420 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-02-02T09:00:00Z',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-02T09:00:00Z',
  },
  {
    id: 'je-004', entryNumber: 'JE-2026-004', date: '2026-02-10', description: 'Booking revenue - Rethymno Beach House (Feb stay)',
    propertyId: 'prop-003', propertyName: 'Rethymno Beach House', ownerId: 'owner-003', ownerName: 'Giorgos Manolis',
    lines: [
      { accountId: 'acc-011', accountCode: '1100', accountName: 'Accounts Receivable', debit: 1800, credit: 0 },
      { accountId: 'acc-001', accountCode: '4000', accountName: 'Rental Revenue', debit: 0, credit: 1600 },
      { accountId: 'acc-002', accountCode: '4010', accountName: 'Cleaning Fees', debit: 0, credit: 100 },
      { accountId: 'acc-015', accountCode: '2200', accountName: 'VAT Payable', debit: 0, credit: 100 },
    ],
    status: 'POSTED', postedBy: 'u-002', postedAt: '2026-02-11T10:00:00Z',
    createdAt: '2026-02-10T12:00:00Z', updatedAt: '2026-02-11T10:00:00Z',
  },
  {
    id: 'je-005', entryNumber: 'JE-2026-005', date: '2026-02-15', description: 'Insurance payment Q1 - all properties',
    lines: [
      { accountId: 'acc-007', accountCode: '5030', accountName: 'Insurance Expense', debit: 1200, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 1200 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-02-16T08:00:00Z',
    createdAt: '2026-02-15T09:00:00Z', updatedAt: '2026-02-16T08:00:00Z',
  },
  {
    id: 'je-006', entryNumber: 'JE-2026-006', date: '2026-02-28', description: 'Management fee - February all properties',
    lines: [
      { accountId: 'acc-009', accountCode: '5050', accountName: 'Management Fees', debit: 860, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 860 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-03-01T09:00:00Z',
    createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'je-007', entryNumber: 'JE-2026-007', date: '2026-03-05', description: 'Booking revenue - Chania Old Town Apt (Mar stay)',
    propertyId: 'prop-002', propertyName: 'Chania Old Town Apt', ownerId: 'owner-002', ownerName: 'Elena Stavrou',
    lines: [
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 1950, credit: 0 },
      { accountId: 'acc-001', accountCode: '4000', accountName: 'Rental Revenue', debit: 0, credit: 1700 },
      { accountId: 'acc-002', accountCode: '4010', accountName: 'Cleaning Fees', debit: 0, credit: 120 },
      { accountId: 'acc-015', accountCode: '2200', accountName: 'VAT Payable', debit: 0, credit: 130 },
    ],
    status: 'POSTED', postedBy: 'u-002', postedAt: '2026-03-06T10:00:00Z',
    createdAt: '2026-03-05T08:00:00Z', updatedAt: '2026-03-06T10:00:00Z',
  },
  {
    id: 'je-008', entryNumber: 'JE-2026-008', date: '2026-03-10', description: 'Cleaning supplies purchase - bulk order',
    lines: [
      { accountId: 'acc-006', accountCode: '5020', accountName: 'Cleaning Supplies', debit: 350, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 350 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-03-11T09:00:00Z',
    createdAt: '2026-03-10T11:00:00Z', updatedAt: '2026-03-11T09:00:00Z',
  },
  {
    id: 'je-009', entryNumber: 'JE-2026-009', date: '2026-03-20', description: 'Property tax payment Q1 - Villa Elounda',
    propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', ownerId: 'owner-001', ownerName: 'Nikos Papadopoulos',
    lines: [
      { accountId: 'acc-008', accountCode: '5040', accountName: 'Property Tax', debit: 800, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 800 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-03-21T08:00:00Z',
    createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-21T08:00:00Z',
  },
  {
    id: 'je-010', entryNumber: 'JE-2026-010', date: '2026-03-31', description: 'Owner payout - March net revenue to Nikos Papadopoulos',
    propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', ownerId: 'owner-001', ownerName: 'Nikos Papadopoulos',
    lines: [
      { accountId: 'acc-014', accountCode: '2100', accountName: 'Owner Payable', debit: 3200, credit: 0 },
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 0, credit: 3200 },
    ],
    status: 'POSTED', postedBy: 'u-001', postedAt: '2026-04-01T09:00:00Z',
    createdAt: '2026-03-31T14:00:00Z', updatedAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'je-011', entryNumber: 'JE-2026-011', date: '2026-04-05', description: 'Booking revenue - Villa Elounda Seafront (Apr stay)',
    propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront', ownerId: 'owner-001', ownerName: 'Nikos Papadopoulos',
    bookingId: 'book-050',
    lines: [
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 3200, credit: 0 },
      { accountId: 'acc-001', accountCode: '4000', accountName: 'Rental Revenue', debit: 0, credit: 2800 },
      { accountId: 'acc-002', accountCode: '4010', accountName: 'Cleaning Fees', debit: 0, credit: 200 },
      { accountId: 'acc-015', accountCode: '2200', accountName: 'VAT Payable', debit: 0, credit: 200 },
    ],
    status: 'DRAFT',
    createdAt: '2026-04-05T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'je-012', entryNumber: 'JE-2026-012', date: '2026-04-08', description: 'Security deposit received - Rethymno Beach House',
    propertyId: 'prop-003', propertyName: 'Rethymno Beach House', ownerId: 'owner-003', ownerName: 'Giorgos Manolis',
    lines: [
      { accountId: 'acc-010', accountCode: '1000', accountName: 'Cash - Operating', debit: 500, credit: 0 },
      { accountId: 'acc-012', accountCode: '1200', accountName: 'Security Deposits Held', debit: 0, credit: 500 },
    ],
    status: 'DRAFT',
    createdAt: '2026-04-08T15:00:00Z', updatedAt: '2026-04-08T15:00:00Z',
  },
];

let nextEntryNum = 13;

export class AccountingService {
  // ── Accounts (Chart of Accounts) ──

  async getAccounts(filters: {
    type?: string;
    subType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, subType, isActive, search, page = 1, limit = 50 } = filters;

    let filtered = [...accounts];
    if (type) filtered = filtered.filter((a) => a.type === type);
    if (subType) filtered = filtered.filter((a) => a.subType === subType);
    if (isActive !== undefined) filtered = filtered.filter((a) => a.isActive === isActive);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)),
      );
    }

    filtered.sort((a, b) => a.code.localeCompare(b.code));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { accounts: items, total, page, limit };
  }

  async getAccountById(id: string) {
    const account = accounts.find((a) => a.id === id);
    if (!account) throw ApiError.notFound('Account');
    return account;
  }

  async createAccount(data: Omit<Account, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) {
    const existing = accounts.find((a) => a.code === data.code);
    if (existing) throw ApiError.conflict('Account with this code already exists');

    const account: Account = {
      ...data,
      id: `acc-${String(accounts.length + 1).padStart(3, '0')}`,
      balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    accounts.push(account);
    return account;
  }

  async updateAccount(id: string, data: Partial<Account>) {
    const idx = accounts.findIndex((a) => a.id === id);
    if (idx === -1) throw ApiError.notFound('Account');

    accounts[idx] = { ...accounts[idx], ...data, updatedAt: new Date().toISOString() };
    return accounts[idx];
  }

  // ── Journal Entries ──

  async getJournalEntries(filters: {
    propertyId?: string;
    ownerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      propertyId, ownerId, status, startDate, endDate, search,
      page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc',
    } = filters;

    let filtered = [...journalEntries];
    if (propertyId) filtered = filtered.filter((e) => e.propertyId === propertyId);
    if (ownerId) filtered = filtered.filter((e) => e.ownerId === ownerId);
    if (status) filtered = filtered.filter((e) => e.status === status);
    if (startDate) filtered = filtered.filter((e) => e.date >= startDate);
    if (endDate) filtered = filtered.filter((e) => e.date <= endDate);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.entryNumber.toLowerCase().includes(q) ||
          (e.propertyName && e.propertyName.toLowerCase().includes(q)),
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

    return { entries: items, total, page, limit };
  }

  async getJournalEntryById(id: string) {
    const entry = journalEntries.find((e) => e.id === id);
    if (!entry) throw ApiError.notFound('Journal Entry');
    return entry;
  }

  async createJournalEntry(data: {
    date: string;
    description: string;
    propertyId?: string;
    propertyName?: string;
    ownerId?: string;
    ownerName?: string;
    bookingId?: string;
    lines: JournalLine[];
  }) {
    // Validate debits equal credits
    const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw ApiError.badRequest('Total debits must equal total credits');
    }

    const entry: JournalEntry = {
      ...data,
      id: `je-${String(nextEntryNum).padStart(3, '0')}`,
      entryNumber: `JE-2026-${String(nextEntryNum).padStart(3, '0')}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    nextEntryNum++;
    journalEntries.push(entry);
    return entry;
  }

  async postJournalEntry(id: string, postedBy: string) {
    const idx = journalEntries.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Journal Entry');
    if (journalEntries[idx].status !== 'DRAFT') throw ApiError.badRequest('Only DRAFT entries can be posted');

    journalEntries[idx].status = 'POSTED';
    journalEntries[idx].postedBy = postedBy;
    journalEntries[idx].postedAt = new Date().toISOString();
    journalEntries[idx].updatedAt = new Date().toISOString();

    return journalEntries[idx];
  }

  async voidJournalEntry(id: string) {
    const idx = journalEntries.findIndex((e) => e.id === id);
    if (idx === -1) throw ApiError.notFound('Journal Entry');
    if (journalEntries[idx].status === 'VOIDED') throw ApiError.badRequest('Entry is already voided');

    journalEntries[idx].status = 'VOIDED';
    journalEntries[idx].updatedAt = new Date().toISOString();

    return journalEntries[idx];
  }

  // ── Reports ──

  async getTrialBalance() {
    const rows = accounts
      .filter((a) => a.isActive)
      .map((a) => ({
        accountId: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        debit: ['ASSET', 'EXPENSE'].includes(a.type) ? a.balance : 0,
        credit: ['LIABILITY', 'EQUITY', 'REVENUE'].includes(a.type) ? a.balance : 0,
      }));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return { rows, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }

  async getProfitAndLoss(filters: { propertyId?: string; ownerId?: string; startDate?: string; endDate?: string }) {
    const { propertyId, ownerId, startDate, endDate } = filters;

    let filtered = journalEntries.filter((e) => e.status === 'POSTED');
    if (propertyId) filtered = filtered.filter((e) => e.propertyId === propertyId);
    if (ownerId) filtered = filtered.filter((e) => e.ownerId === ownerId);
    if (startDate) filtered = filtered.filter((e) => e.date >= startDate);
    if (endDate) filtered = filtered.filter((e) => e.date <= endDate);

    let totalRevenue = 0;
    let totalExpenses = 0;
    const revenueBreakdown: Record<string, number> = {};
    const expenseBreakdown: Record<string, number> = {};

    for (const entry of filtered) {
      for (const line of entry.lines) {
        const account = accounts.find((a) => a.id === line.accountId);
        if (!account) continue;
        if (account.type === 'REVENUE') {
          const amt = line.credit - line.debit;
          totalRevenue += amt;
          revenueBreakdown[account.name] = (revenueBreakdown[account.name] || 0) + amt;
        } else if (account.type === 'EXPENSE') {
          const amt = line.debit - line.credit;
          totalExpenses += amt;
          expenseBreakdown[account.name] = (expenseBreakdown[account.name] || 0) + amt;
        }
      }
    }

    return {
      period: { startDate: startDate || 'all', endDate: endDate || 'all' },
      revenue: { total: totalRevenue, breakdown: revenueBreakdown },
      expenses: { total: totalExpenses, breakdown: expenseBreakdown },
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async getBalanceSheet() {
    const assets = accounts.filter((a) => a.type === 'ASSET' && a.isActive);
    const liabilities = accounts.filter((a) => a.type === 'LIABILITY' && a.isActive);
    const equity = accounts.filter((a) => a.type === 'EQUITY' && a.isActive);

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    return {
      assets: { items: assets.map((a) => ({ code: a.code, name: a.name, balance: a.balance })), total: totalAssets },
      liabilities: { items: liabilities.map((a) => ({ code: a.code, name: a.name, balance: a.balance })), total: totalLiabilities },
      equity: { items: equity.map((a) => ({ code: a.code, name: a.name, balance: a.balance })), total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async getTaxReport(filters: { year?: number }) {
    const year = filters.year || 2026;
    const posted = journalEntries.filter((e) => e.status === 'POSTED' && e.date.startsWith(String(year)));

    let totalIncome = 0;
    let totalDeductions = 0;
    let totalVat = 0;

    for (const entry of posted) {
      for (const line of entry.lines) {
        const account = accounts.find((a) => a.id === line.accountId);
        if (!account) continue;
        if (account.type === 'REVENUE') totalIncome += line.credit - line.debit;
        if (account.type === 'EXPENSE') totalDeductions += line.debit - line.credit;
        if (account.subType === 'tax_payable') totalVat += line.credit - line.debit;
      }
    }

    return {
      year,
      totalIncome,
      totalDeductions,
      taxableIncome: totalIncome - totalDeductions,
      vatCollected: totalVat,
      entriesCount: posted.length,
    };
  }
}

export const accountingService = new AccountingService();
