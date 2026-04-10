export enum IncomeCategory {
  RENTAL = 'RENTAL',
  CLEANING_FEE = 'CLEANING_FEE',
  EXTRA_SERVICES = 'EXTRA_SERVICES',
  DAMAGE_DEPOSIT = 'DAMAGE_DEPOSIT',
  LATE_CHECKOUT = 'LATE_CHECKOUT',
  OTHER = 'OTHER',
}

export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  UTILITIES = 'UTILITIES',
  CLEANING = 'CLEANING',
  SUPPLIES = 'SUPPLIES',
  INSURANCE = 'INSURANCE',
  TAXES = 'TAXES',
  MANAGEMENT_FEE = 'MANAGEMENT_FEE',
  MARKETING = 'MARKETING',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER',
}

export enum ExpenseApprovalStatus {
  AUTO_APPROVED = 'AUTO_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IncomeRecord {
  id: string;
  propertyId: string;
  bookingId?: string;
  category: IncomeCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  receivedAt?: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  propertyId: string;
  ownerId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  receiptUrl?: string;
  approvalStatus: ExpenseApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagementFeeCalculation {
  id: string;
  propertyId: string;
  ownerId: string;
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  feePercent: number;
  calculatedFee: number;
  minimumFee: number;
  appliedFee: number;
  currency: string;
  status: 'DRAFT' | 'INVOICED' | 'PAID';
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeRequest {
  propertyId: string;
  bookingId?: string;
  category: IncomeCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface CreateExpenseRequest {
  propertyId: string;
  ownerId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}
