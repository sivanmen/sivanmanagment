export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCE = 'APPLIANCE',
  STRUCTURAL = 'STRUCTURAL',
  PEST = 'PEST',
  CLEANING = 'CLEANING',
  LANDSCAPING = 'LANDSCAPING',
  OTHER = 'OTHER',
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitId?: string;
  reportedBy: string;
  assignedTo?: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  title: string;
  description: string;
  photos: string[];
  estimatedCost?: number;
  actualCost?: number;
  currency: string;
  scheduledDate?: string;
  completedAt?: string;
  vendorName?: string;
  vendorPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
