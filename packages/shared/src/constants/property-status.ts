import { PropertyStatus } from '../types/property.types';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const PROPERTY_STATUS_CONFIG: Record<PropertyStatus, StatusConfig> = {
  [PropertyStatus.ACTIVE]: {
    label: 'Active',
    color: '#059669',
    bgColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    icon: 'check-circle',
  },
  [PropertyStatus.INACTIVE]: {
    label: 'Inactive',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    icon: 'pause-circle',
  },
  [PropertyStatus.ONBOARDING]: {
    label: 'Onboarding',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
    icon: 'arrow-path',
  },
  [PropertyStatus.MAINTENANCE]: {
    label: 'Maintenance',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    icon: 'wrench-screwdriver',
  },
  [PropertyStatus.ARCHIVED]: {
    label: 'Archived',
    color: '#4B5563',
    bgColor: '#E5E7EB',
    borderColor: '#9CA3AF',
    icon: 'archive-box',
  },
};

export function getPropertyStatusConfig(status: PropertyStatus): StatusConfig {
  return PROPERTY_STATUS_CONFIG[status];
}
