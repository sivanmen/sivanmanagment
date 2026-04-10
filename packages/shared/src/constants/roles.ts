import { UserRole } from '../types/auth.types';

export type Permission =
  | 'dashboard:view'
  | 'properties:view'
  | 'properties:create'
  | 'properties:edit'
  | 'properties:delete'
  | 'bookings:view'
  | 'bookings:create'
  | 'bookings:edit'
  | 'bookings:cancel'
  | 'guests:view'
  | 'guests:edit'
  | 'guests:screen'
  | 'finance:view'
  | 'finance:create'
  | 'finance:edit'
  | 'finance:approve'
  | 'finance:reports'
  | 'maintenance:view'
  | 'maintenance:create'
  | 'maintenance:edit'
  | 'maintenance:assign'
  | 'maintenance:complete'
  | 'owners:view'
  | 'owners:create'
  | 'owners:edit'
  | 'owners:reports'
  | 'channels:view'
  | 'channels:manage'
  | 'tasks:view'
  | 'tasks:create'
  | 'tasks:assign'
  | 'tasks:complete'
  | 'communications:view'
  | 'communications:send'
  | 'communications:templates'
  | 'loyalty:view'
  | 'loyalty:manage'
  | 'affiliates:view'
  | 'affiliates:manage'
  | 'marketing:view'
  | 'marketing:manage'
  | 'portfolio:view'
  | 'portfolio:manage'
  | 'documents:view'
  | 'documents:upload'
  | 'documents:delete'
  | 'settings:view'
  | 'settings:manage'
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'reports:view'
  | 'reports:export';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'dashboard:view',
    'properties:view', 'properties:create', 'properties:edit', 'properties:delete',
    'bookings:view', 'bookings:create', 'bookings:edit', 'bookings:cancel',
    'guests:view', 'guests:edit', 'guests:screen',
    'finance:view', 'finance:create', 'finance:edit', 'finance:approve', 'finance:reports',
    'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:assign', 'maintenance:complete',
    'owners:view', 'owners:create', 'owners:edit', 'owners:reports',
    'channels:view', 'channels:manage',
    'tasks:view', 'tasks:create', 'tasks:assign', 'tasks:complete',
    'communications:view', 'communications:send', 'communications:templates',
    'loyalty:view', 'loyalty:manage',
    'affiliates:view', 'affiliates:manage',
    'marketing:view', 'marketing:manage',
    'portfolio:view', 'portfolio:manage',
    'documents:view', 'documents:upload', 'documents:delete',
    'settings:view', 'settings:manage',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'reports:view', 'reports:export',
  ],
  [UserRole.PROPERTY_MANAGER]: [
    'dashboard:view',
    'properties:view', 'properties:create', 'properties:edit',
    'bookings:view', 'bookings:create', 'bookings:edit', 'bookings:cancel',
    'guests:view', 'guests:edit', 'guests:screen',
    'finance:view', 'finance:create', 'finance:edit', 'finance:approve', 'finance:reports',
    'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:assign',
    'owners:view', 'owners:reports',
    'channels:view', 'channels:manage',
    'tasks:view', 'tasks:create', 'tasks:assign', 'tasks:complete',
    'communications:view', 'communications:send', 'communications:templates',
    'loyalty:view', 'loyalty:manage',
    'affiliates:view',
    'marketing:view', 'marketing:manage',
    'documents:view', 'documents:upload',
    'settings:view',
    'reports:view', 'reports:export',
  ],
  [UserRole.MAINTENANCE]: [
    'dashboard:view',
    'properties:view',
    'maintenance:view', 'maintenance:create', 'maintenance:edit', 'maintenance:complete',
    'tasks:view', 'tasks:complete',
    'documents:view', 'documents:upload',
  ],
  [UserRole.OWNER]: [
    'dashboard:view',
    'properties:view',
    'bookings:view',
    'finance:view', 'finance:reports',
    'maintenance:view', 'maintenance:create',
    'owners:view',
    'documents:view',
    'reports:view', 'reports:export',
    'portfolio:view',
  ],
  [UserRole.VIP_STAR]: [
    'dashboard:view',
    'bookings:view',
    'loyalty:view',
  ],
  [UserRole.AFFILIATE]: [
    'dashboard:view',
    'affiliates:view',
    'reports:view',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}
