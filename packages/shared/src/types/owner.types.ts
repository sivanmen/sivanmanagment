export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
}

export interface Owner {
  id: string;
  userId: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: string;
  defaultManagementFeePercent: number;
  defaultMinimumMonthlyFee: number;
  expenseApprovalThreshold: number;
  preferredPaymentMethod: PaymentMethod;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOwnerRequest {
  userId: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: string;
  defaultManagementFeePercent: number;
  defaultMinimumMonthlyFee?: number;
  expenseApprovalThreshold?: number;
  preferredPaymentMethod?: PaymentMethod;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface UpdateOwnerRequest extends Partial<CreateOwnerRequest> {
  id: string;
}
