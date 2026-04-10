export enum InvestmentType {
  PROPERTY_PURCHASE = 'PROPERTY_PURCHASE',
  RENOVATION = 'RENOVATION',
  EQUIPMENT = 'EQUIPMENT',
  EXTERNAL = 'EXTERNAL',
}

export interface PortfolioInvestment {
  id: string;
  ownerId: string;
  propertyId?: string;
  type: InvestmentType;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  investmentDate: string;
  expectedReturn?: number;
  actualReturn?: number;
  roi?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'SOLD' | 'WRITTEN_OFF';
  maturityDate?: string;
  notes?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}
