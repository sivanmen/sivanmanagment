export enum TaskType {
  CLEANING = 'CLEANING',
  INSPECTION = 'INSPECTION',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  MAINTENANCE = 'MAINTENANCE',
  LAUNDRY = 'LAUNDRY',
  SUPPLY_RESTOCK = 'SUPPLY_RESTOCK',
  CUSTOM = 'CUSTOM',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  propertyId: string;
  unitId?: string;
  bookingId?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  notes?: string;
  photos: string[];
  checklistItems?: Array<{
    label: string;
    completed: boolean;
  }>;
  completedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  isActive: boolean;
}
