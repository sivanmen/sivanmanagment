import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Lock,
  Unlock,
  Thermometer,
  Wifi,
  WifiOff,
  BatteryLow,
  BatteryWarning,
  BatteryFull,
  BatteryMedium,
  Camera,
  Activity,
  Droplets,
  Flame,
  Zap,
  Eye,
  EyeOff,
  Plus,
  Search,
  RefreshCw,
  Settings2,
  Trash2,
  Copy,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  ChevronRight,
  X,
  Bell,
  Volume2,
  CalendarClock,
  ToggleLeft,
  ToggleRight,
  Key,
  Sparkles,
  Map,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type DeviceType = 'SMART_LOCK' | 'THERMOSTAT' | 'NOISE_MONITOR' | 'CAMERA' | 'MOTION_SENSOR' | 'SMOKE_DETECTOR' | 'WATER_LEAK' | 'ENERGY_METER';
type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'LOW_BATTERY' | 'ERROR';
type CodeType = 'GUEST' | 'CLEANER' | 'OWNER' | 'MASTER' | 'MAINTENANCE';
type CodeStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SCHEDULED';
type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
type TabKey = 'devices' | 'locks' | 'alerts' | 'map' | 'automations';

interface IoTDevice {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: DeviceStatus;
  batteryLevel?: number;
  lastReading?: Record<string, any>;
  lastSeenAt: string;
  isActive: boolean;
}

interface SmartLockCode {
  id: string;
  deviceId: string;
  deviceName: string;
  propertyName: string;
  codeName: string;
  codeValue: string;
  type: CodeType;
  status: CodeStatus;
  validFrom: string;
  validTo: string;
  usageCount: number;
  maxUsages?: number;
  assignedTo?: string;
  bookingId?: string;
  createdAt: string;
}

interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  propertyName: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  deviceTypes: DeviceType[];
  isActive: boolean;
  lastTriggered?: string;
  executionCount: number;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DEVICES: IoTDevice[] = [
  {
    id: 'iot-001', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    name: 'Front Door Lock', type: 'SMART_LOCK', manufacturer: 'Nuki', model: 'Smart Lock 4.0 Pro',
    serialNumber: 'NK-2026-001', status: 'ONLINE', batteryLevel: 85,
    lastReading: { locked: true, lastUnlock: '2026-04-10T16:30:00Z' },
    lastSeenAt: '2026-04-12T09:00:00Z', isActive: true,
  },
  {
    id: 'iot-002', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    name: 'Back Gate Lock', type: 'SMART_LOCK', manufacturer: 'Nuki', model: 'Smart Lock 4.0 Pro',
    serialNumber: 'NK-2026-002', status: 'ONLINE', batteryLevel: 62,
    lastReading: { locked: true, lastUnlock: '2026-04-11T08:15:00Z' },
    lastSeenAt: '2026-04-12T09:02:00Z', isActive: true,
  },
  {
    id: 'iot-003', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    name: 'Living Room Thermostat', type: 'THERMOSTAT', manufacturer: 'Tado', model: 'Smart Thermostat V3+',
    serialNumber: 'TD-2026-001', status: 'ONLINE',
    lastReading: { currentTemp: 23.5, targetTemp: 24, mode: 'COOL', humidity: 55 },
    lastSeenAt: '2026-04-12T09:05:00Z', isActive: true,
  },
  {
    id: 'iot-004', propertyId: 'prop-001', propertyName: 'Villa Elounda Seafront',
    name: 'Bedroom Thermostat', type: 'THERMOSTAT', manufacturer: 'Tado', model: 'Smart Thermostat V3+',
    serialNumber: 'TD-2026-002', status: 'ONLINE',
    lastReading: { currentTemp: 22.0, targetTemp: 22, mode: 'AUTO', humidity: 48 },
    lastSeenAt: '2026-04-12T09:04:00Z', isActive: true,
  },
  {
    id: 'iot-005', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    name: 'Noise Monitor', type: 'NOISE_MONITOR', manufacturer: 'Minut', model: 'Minut Point 2',
    serialNumber: 'MN-2026-001', status: 'ONLINE', batteryLevel: 72,
    lastReading: { noiseLevel: 42, threshold: 70, alert: false },
    lastSeenAt: '2026-04-12T09:10:00Z', isActive: true,
  },
  {
    id: 'iot-006', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    name: 'Front Door Lock', type: 'SMART_LOCK', manufacturer: 'Yale', model: 'Linus Smart Lock',
    serialNumber: 'YL-2026-001', status: 'ONLINE', batteryLevel: 91,
    lastReading: { locked: false, lastUnlock: '2026-04-12T07:45:00Z' },
    lastSeenAt: '2026-04-12T09:08:00Z', isActive: true,
  },
  {
    id: 'iot-007', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    name: 'Kitchen Smoke Detector', type: 'SMOKE_DETECTOR', manufacturer: 'Nest', model: 'Protect 2nd Gen',
    serialNumber: 'NP-2026-001', status: 'LOW_BATTERY', batteryLevel: 12,
    lastReading: { smokeDetected: false, coDetected: false },
    lastSeenAt: '2026-04-12T08:45:00Z', isActive: true,
  },
  {
    id: 'iot-008', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    name: 'Front Door Lock', type: 'SMART_LOCK', manufacturer: 'Nuki', model: 'Smart Lock 3.0',
    serialNumber: 'NK-2026-003', status: 'OFFLINE', batteryLevel: 0,
    lastReading: { locked: true },
    lastSeenAt: '2026-04-10T14:00:00Z', isActive: true,
  },
  {
    id: 'iot-009', propertyId: 'prop-002', propertyName: 'Chania Old Town Apt',
    name: 'Bathroom Water Leak Sensor', type: 'WATER_LEAK', manufacturer: 'Aqara', model: 'Water Leak Sensor T1',
    serialNumber: 'AQ-2026-001', status: 'OFFLINE', batteryLevel: 0,
    lastReading: { leakDetected: false },
    lastSeenAt: '2026-04-09T12:00:00Z', isActive: true,
  },
  {
    id: 'iot-010', propertyId: 'prop-004', propertyName: 'Heraklion Harbor Suite',
    name: 'Outdoor Camera', type: 'CAMERA', manufacturer: 'Ring', model: 'Stick Up Cam Pro',
    serialNumber: 'RG-2026-001', status: 'ONLINE', batteryLevel: 78,
    lastReading: { recording: true, motionDetected: false },
    lastSeenAt: '2026-04-12T09:12:00Z', isActive: true,
  },
  {
    id: 'iot-011', propertyId: 'prop-004', propertyName: 'Heraklion Harbor Suite',
    name: 'Entry Motion Sensor', type: 'MOTION_SENSOR', manufacturer: 'Philips Hue', model: 'Motion Sensor',
    serialNumber: 'PH-2026-001', status: 'ONLINE', batteryLevel: 55,
    lastReading: { motionDetected: false, lux: 320 },
    lastSeenAt: '2026-04-12T09:11:00Z', isActive: true,
  },
  {
    id: 'iot-012', propertyId: 'prop-004', propertyName: 'Heraklion Harbor Suite',
    name: 'Main Door Lock', type: 'SMART_LOCK', manufacturer: 'August', model: 'Wi-Fi Smart Lock',
    serialNumber: 'AG-2026-001', status: 'ERROR', batteryLevel: 34,
    lastReading: { locked: true, error: 'MOTOR_JAM' },
    lastSeenAt: '2026-04-12T08:30:00Z', isActive: true,
  },
  {
    id: 'iot-013', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Penthouse',
    name: 'Smart Lock', type: 'SMART_LOCK', manufacturer: 'Nuki', model: 'Smart Lock 4.0 Pro',
    serialNumber: 'NK-2026-004', status: 'ONLINE', batteryLevel: 95,
    lastReading: { locked: true, lastUnlock: '2026-04-11T20:00:00Z' },
    lastSeenAt: '2026-04-12T09:15:00Z', isActive: true,
  },
  {
    id: 'iot-014', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Penthouse',
    name: 'Energy Meter', type: 'ENERGY_METER', manufacturer: 'Shelly', model: 'Pro 3EM',
    serialNumber: 'SH-2026-001', status: 'ONLINE',
    lastReading: { powerW: 1250, todayKwh: 8.4, monthKwh: 124.5 },
    lastSeenAt: '2026-04-12T09:14:00Z', isActive: true,
  },
  {
    id: 'iot-015', propertyId: 'prop-003', propertyName: 'Rethymno Beach House',
    name: 'Pool Area Camera', type: 'CAMERA', manufacturer: 'Ring', model: 'Floodlight Cam Plus',
    serialNumber: 'RG-2026-002', status: 'ONLINE', batteryLevel: undefined,
    lastReading: { recording: true, motionDetected: true, lastMotion: '2026-04-12T08:55:00Z' },
    lastSeenAt: '2026-04-12T09:13:00Z', isActive: true,
  },
  {
    id: 'iot-016', propertyId: 'prop-005', propertyName: 'Agios Nikolaos Penthouse',
    name: 'Living Room Noise Monitor', type: 'NOISE_MONITOR', manufacturer: 'NoiseAware', model: 'Indoor Sensor',
    serialNumber: 'NA-2026-001', status: 'LOW_BATTERY', batteryLevel: 8,
    lastReading: { noiseLevel: 38, threshold: 70, alert: false },
    lastSeenAt: '2026-04-12T08:50:00Z', isActive: true,
  },
];

const MOCK_CODES: SmartLockCode[] = [
  {
    id: 'code-001', deviceId: 'iot-001', deviceName: 'Front Door Lock', propertyName: 'Villa Elounda Seafront',
    codeName: 'Guest - Schmidt Family', codeValue: '7291', type: 'GUEST', status: 'ACTIVE',
    validFrom: '2026-04-10T14:00:00Z', validTo: '2026-04-17T11:00:00Z',
    usageCount: 8, assignedTo: 'Hans Schmidt', bookingId: 'bk-042', createdAt: '2026-04-09T10:00:00Z',
  },
  {
    id: 'code-002', deviceId: 'iot-001', deviceName: 'Front Door Lock', propertyName: 'Villa Elounda Seafront',
    codeName: 'Cleaner - Maria P.', codeValue: '3847', type: 'CLEANER', status: 'ACTIVE',
    validFrom: '2026-01-01T00:00:00Z', validTo: '2026-12-31T23:59:00Z',
    usageCount: 45, assignedTo: 'Maria Papadopoulos', createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'code-003', deviceId: 'iot-006', deviceName: 'Front Door Lock', propertyName: 'Chania Old Town Apt',
    codeName: 'Guest - Dubois', codeValue: '5163', type: 'GUEST', status: 'ACTIVE',
    validFrom: '2026-04-11T15:00:00Z', validTo: '2026-04-15T10:00:00Z',
    usageCount: 3, assignedTo: 'Pierre Dubois', bookingId: 'bk-044', createdAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 'code-004', deviceId: 'iot-008', deviceName: 'Front Door Lock', propertyName: 'Rethymno Beach House',
    codeName: 'Owner Master', codeValue: '1024', type: 'MASTER', status: 'ACTIVE',
    validFrom: '2025-01-01T00:00:00Z', validTo: '2027-12-31T23:59:00Z',
    usageCount: 112, assignedTo: 'Sivan Menahem', createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'code-005', deviceId: 'iot-013', deviceName: 'Smart Lock', propertyName: 'Agios Nikolaos Penthouse',
    codeName: 'Guest - Tanaka', codeValue: '8842', type: 'GUEST', status: 'SCHEDULED',
    validFrom: '2026-04-18T14:00:00Z', validTo: '2026-04-25T11:00:00Z',
    usageCount: 0, assignedTo: 'Yuki Tanaka', bookingId: 'bk-048', createdAt: '2026-04-11T09:00:00Z',
  },
  {
    id: 'code-006', deviceId: 'iot-012', deviceName: 'Main Door Lock', propertyName: 'Heraklion Harbor Suite',
    codeName: 'Guest - Johnson (expired)', codeValue: '2290', type: 'GUEST', status: 'EXPIRED',
    validFrom: '2026-04-01T14:00:00Z', validTo: '2026-04-08T11:00:00Z',
    usageCount: 14, assignedTo: 'Emily Johnson', bookingId: 'bk-039', createdAt: '2026-03-30T10:00:00Z',
  },
  {
    id: 'code-007', deviceId: 'iot-002', deviceName: 'Back Gate Lock', propertyName: 'Villa Elounda Seafront',
    codeName: 'Maintenance - Dimitri', codeValue: '4450', type: 'MAINTENANCE', status: 'ACTIVE',
    validFrom: '2026-04-12T08:00:00Z', validTo: '2026-04-12T18:00:00Z',
    usageCount: 1, maxUsages: 3, assignedTo: 'Dimitri Repairs', createdAt: '2026-04-11T16:00:00Z',
  },
  {
    id: 'code-008', deviceId: 'iot-006', deviceName: 'Front Door Lock', propertyName: 'Chania Old Town Apt',
    codeName: 'Owner Access', codeValue: '9911', type: 'OWNER', status: 'ACTIVE',
    validFrom: '2025-06-01T00:00:00Z', validTo: '2027-06-01T00:00:00Z',
    usageCount: 67, assignedTo: 'Giorgos Alexiou', createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'code-009', deviceId: 'iot-001', deviceName: 'Front Door Lock', propertyName: 'Villa Elounda Seafront',
    codeName: 'Prev Guest - Revoked', codeValue: '6673', type: 'GUEST', status: 'REVOKED',
    validFrom: '2026-04-03T14:00:00Z', validTo: '2026-04-10T11:00:00Z',
    usageCount: 11, assignedTo: 'Marco Rossi', bookingId: 'bk-040', createdAt: '2026-04-02T10:00:00Z',
  },
];

const MOCK_ALERTS: DeviceAlert[] = [
  {
    id: 'alert-001', deviceId: 'iot-012', deviceName: 'Main Door Lock', propertyName: 'Heraklion Harbor Suite',
    type: 'DEVICE_ERROR', message: 'Motor jam detected - lock mechanism may be obstructed',
    severity: 'CRITICAL', timestamp: '2026-04-12T08:30:00Z', acknowledged: false,
  },
  {
    id: 'alert-002', deviceId: 'iot-008', deviceName: 'Front Door Lock', propertyName: 'Rethymno Beach House',
    type: 'DEVICE_OFFLINE', message: 'Device has been offline for 48+ hours - battery depleted',
    severity: 'CRITICAL', timestamp: '2026-04-10T14:00:00Z', acknowledged: false,
  },
  {
    id: 'alert-003', deviceId: 'iot-007', deviceName: 'Kitchen Smoke Detector', propertyName: 'Rethymno Beach House',
    type: 'LOW_BATTERY', message: 'Battery level critical at 12% - replace immediately',
    severity: 'WARNING', timestamp: '2026-04-12T08:45:00Z', acknowledged: false,
  },
  {
    id: 'alert-004', deviceId: 'iot-016', deviceName: 'Living Room Noise Monitor', propertyName: 'Agios Nikolaos Penthouse',
    type: 'LOW_BATTERY', message: 'Battery level critical at 8% - replace soon',
    severity: 'WARNING', timestamp: '2026-04-12T08:50:00Z', acknowledged: false,
  },
  {
    id: 'alert-005', deviceId: 'iot-009', deviceName: 'Bathroom Water Leak Sensor', propertyName: 'Chania Old Town Apt',
    type: 'DEVICE_OFFLINE', message: 'Device offline since April 9 - check connection',
    severity: 'WARNING', timestamp: '2026-04-09T14:00:00Z', acknowledged: true,
  },
  {
    id: 'alert-006', deviceId: 'iot-005', deviceName: 'Noise Monitor', propertyName: 'Chania Old Town Apt',
    type: 'NOISE_ALERT', message: 'Noise level exceeded threshold (78dB) at 23:15 - lasted 15 minutes',
    severity: 'WARNING', timestamp: '2026-04-09T23:15:00Z', acknowledged: true,
  },
  {
    id: 'alert-007', deviceId: 'iot-006', deviceName: 'Front Door Lock', propertyName: 'Chania Old Town Apt',
    type: 'DOOR_UNLOCKED', message: 'Door has been unlocked for over 30 minutes',
    severity: 'INFO', timestamp: '2026-04-12T08:15:00Z', acknowledged: false,
  },
  {
    id: 'alert-008', deviceId: 'iot-003', deviceName: 'Living Room Thermostat', propertyName: 'Villa Elounda Seafront',
    type: 'TEMP_OUT_OF_RANGE', message: 'Temperature 28.5C exceeds comfort range during unoccupied hours',
    severity: 'INFO', timestamp: '2026-04-11T13:30:00Z', acknowledged: true,
  },
];

const MOCK_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-001', name: 'Lock all doors at midnight',
    description: 'Automatically lock all smart locks across properties at 00:00 daily',
    trigger: 'SCHEDULE: Every day at 00:00', action: 'LOCK all smart locks',
    deviceTypes: ['SMART_LOCK'], isActive: true, lastTriggered: '2026-04-12T00:00:00Z', executionCount: 102,
  },
  {
    id: 'auto-002', name: 'Pre-arrival temperature',
    description: 'Set thermostats to 24C two hours before guest check-in time',
    trigger: 'EVENT: 2 hours before check-in', action: 'SET temperature to 24C',
    deviceTypes: ['THERMOSTAT'], isActive: true, lastTriggered: '2026-04-10T12:00:00Z', executionCount: 38,
  },
  {
    id: 'auto-003', name: 'Post-checkout energy save',
    description: 'Turn off AC and set to eco mode after checkout confirmed',
    trigger: 'EVENT: Guest checkout confirmed', action: 'SET temperature to 28C (eco)',
    deviceTypes: ['THERMOSTAT'], isActive: true, lastTriggered: '2026-04-10T11:30:00Z', executionCount: 35,
  },
  {
    id: 'auto-004', name: 'Auto-generate guest code',
    description: 'Generate a unique door code for each confirmed booking',
    trigger: 'EVENT: Booking confirmed', action: 'GENERATE access code valid check-in to check-out',
    deviceTypes: ['SMART_LOCK'], isActive: true, lastTriggered: '2026-04-11T09:00:00Z', executionCount: 67,
  },
  {
    id: 'auto-005', name: 'Revoke expired codes',
    description: 'Automatically revoke access codes 1 hour after checkout time',
    trigger: 'EVENT: 1 hour after check-out', action: 'REVOKE guest access code',
    deviceTypes: ['SMART_LOCK'], isActive: true, lastTriggered: '2026-04-10T12:00:00Z', executionCount: 61,
  },
  {
    id: 'auto-006', name: 'Noise alert notification',
    description: 'Send WhatsApp notification to manager when noise exceeds threshold',
    trigger: 'EVENT: Noise level > threshold for 10 min', action: 'SEND WhatsApp alert to manager',
    deviceTypes: ['NOISE_MONITOR'], isActive: true, lastTriggered: '2026-04-09T23:25:00Z', executionCount: 4,
  },
  {
    id: 'auto-007', name: 'Low battery reminder',
    description: 'Send daily email digest of devices with battery below 20%',
    trigger: 'SCHEDULE: Every day at 08:00', action: 'SEND email with low battery device list',
    deviceTypes: ['SMART_LOCK', 'NOISE_MONITOR', 'SMOKE_DETECTOR', 'MOTION_SENSOR'],
    isActive: false, lastTriggered: '2026-04-11T08:00:00Z', executionCount: 28,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date('2026-04-12T09:20:00Z');
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function maskCode(code: string): string {
  if (code.length <= 2) return '**';
  return code[0] + '*'.repeat(code.length - 2) + code[code.length - 1];
}

const DEVICE_ICONS: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  SMART_LOCK: Lock,
  THERMOSTAT: Thermometer,
  NOISE_MONITOR: Volume2,
  CAMERA: Camera,
  MOTION_SENSOR: Activity,
  SMOKE_DETECTOR: Flame,
  WATER_LEAK: Droplets,
  ENERGY_METER: Zap,
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  SMART_LOCK: 'Smart Lock',
  THERMOSTAT: 'Thermostat',
  NOISE_MONITOR: 'Noise Monitor',
  CAMERA: 'Camera',
  MOTION_SENSOR: 'Motion Sensor',
  SMOKE_DETECTOR: 'Smoke Detector',
  WATER_LEAK: 'Water Leak',
  ENERGY_METER: 'Energy Meter',
};

const STATUS_STYLES: Record<DeviceStatus, { bg: string; text: string; dot: string; label: string }> = {
  ONLINE: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success', label: 'Online' },
  OFFLINE: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error', label: 'Offline' },
  LOW_BATTERY: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', label: 'Low Battery' },
  ERROR: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error animate-pulse', label: 'Error' },
};

const CODE_TYPE_STYLES: Record<CodeType, string> = {
  GUEST: 'bg-secondary/10 text-secondary',
  CLEANER: 'bg-blue-500/10 text-blue-600',
  OWNER: 'bg-success/10 text-success',
  MASTER: 'bg-warning/10 text-warning',
  MAINTENANCE: 'bg-outline-variant/20 text-on-surface-variant',
};

const CODE_STATUS_STYLES: Record<CodeStatus, string> = {
  ACTIVE: 'bg-success/10 text-success',
  EXPIRED: 'bg-outline-variant/20 text-on-surface-variant',
  REVOKED: 'bg-error/10 text-error',
  SCHEDULED: 'bg-blue-500/10 text-blue-600',
};

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  CRITICAL: { bg: 'bg-error/10', text: 'text-error', icon: AlertCircle },
  WARNING: { bg: 'bg-warning/10', text: 'text-warning', icon: AlertTriangle },
  INFO: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: Bell },
};

// ── Sub-Components ───────────────────────────────────────────────────────────

function BatteryIndicator({ level }: { level?: number }) {
  if (level === undefined || level === null) return null;
  const color = level <= 15 ? 'text-error' : level <= 30 ? 'text-warning' : level <= 60 ? 'text-on-surface-variant' : 'text-success';
  const bgColor = level <= 15 ? 'bg-error' : level <= 30 ? 'bg-warning' : level <= 60 ? 'bg-on-surface-variant' : 'bg-success';
  const Icon = level <= 15 ? BatteryLow : level <= 30 ? BatteryWarning : level <= 60 ? BatteryMedium : BatteryFull;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex-1 min-w-[60px]">
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className={`h-full rounded-full ${bgColor} transition-all duration-500`}
            style={{ width: `${Math.max(level, 3)}%` }}
          />
        </div>
      </div>
      <span className={`text-xs font-medium ${color}`}>{level}%</span>
    </div>
  );
}

function DeviceCard({ device, onAction }: { device: IoTDevice; onAction: (deviceId: string, action: string, params?: Record<string, any>) => void }) {
  const Icon = DEVICE_ICONS[device.type];
  const statusStyle = STATUS_STYLES[device.status];
  const isLock = device.type === 'SMART_LOCK';
  const isThermostat = device.type === 'THERMOSTAT';
  const isLocked = isLock && device.lastReading?.locked;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${statusStyle.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${statusStyle.text}`} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-on-surface truncate">{device.name}</h4>
            <p className="text-xs text-on-surface-variant truncate">{DEVICE_LABELS[device.type]}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusStyle.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Property */}
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3">
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{device.propertyName}</span>
      </div>

      {/* Device-specific info */}
      {isLock && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-surface-container-low">
          {isLocked ? (
            <Lock className="w-4 h-4 text-success" />
          ) : (
            <Unlock className="w-4 h-4 text-warning" />
          )}
          <span className={`text-xs font-medium ${isLocked ? 'text-success' : 'text-warning'}`}>
            {isLocked ? 'Locked' : 'Unlocked'}
          </span>
          {device.lastReading?.lastUnlock && (
            <span className="text-[10px] text-on-surface-variant ms-auto">
              Last unlock: {timeAgo(device.lastReading.lastUnlock)}
            </span>
          )}
        </div>
      )}

      {isThermostat && device.lastReading && (
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-surface-container-low">
          <div className="text-center">
            <p className="text-lg font-headline font-bold text-on-surface">{device.lastReading.currentTemp}°</p>
            <p className="text-[10px] text-on-surface-variant">Current</p>
          </div>
          <div className="w-px h-8 bg-surface-container-high" />
          <div className="text-center">
            <p className="text-lg font-headline font-bold text-secondary">{device.lastReading.targetTemp}°</p>
            <p className="text-[10px] text-on-surface-variant">Target</p>
          </div>
          <div className="ms-auto flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">
              {device.lastReading.mode}
            </span>
            {device.lastReading.humidity !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                {device.lastReading.humidity}%
              </span>
            )}
          </div>
        </div>
      )}

      {device.type === 'NOISE_MONITOR' && device.lastReading && (
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-surface-container-low">
          <Volume2 className={`w-4 h-4 ${device.lastReading.noiseLevel > device.lastReading.threshold ? 'text-error' : 'text-success'}`} />
          <span className="text-sm font-medium text-on-surface">{device.lastReading.noiseLevel} dB</span>
          <span className="text-[10px] text-on-surface-variant">/ {device.lastReading.threshold} dB threshold</span>
        </div>
      )}

      {device.type === 'ENERGY_METER' && device.lastReading && (
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-surface-container-low">
          <Zap className="w-4 h-4 text-warning" />
          <div>
            <span className="text-sm font-medium text-on-surface">{device.lastReading.powerW}W</span>
            <span className="text-[10px] text-on-surface-variant ms-2">
              {device.lastReading.todayKwh} kWh today
            </span>
          </div>
        </div>
      )}

      {device.type === 'CAMERA' && device.lastReading && (
        <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-surface-container-low">
          <Camera className={`w-4 h-4 ${device.lastReading.recording ? 'text-success' : 'text-on-surface-variant'}`} />
          <span className="text-xs text-on-surface-variant">
            {device.lastReading.recording ? 'Recording' : 'Idle'}
            {device.lastReading.motionDetected && ' - Motion detected'}
          </span>
        </div>
      )}

      {/* Battery */}
      {device.batteryLevel !== undefined && (
        <div className="mb-3">
          <BatteryIndicator level={device.batteryLevel} />
        </div>
      )}

      {/* Last seen */}
      <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant mb-3">
        <Clock className="w-3 h-3" />
        <span>Last active: {timeAgo(device.lastSeenAt)}</span>
      </div>

      {/* Quick Actions */}
      {device.status !== 'OFFLINE' && (
        <div className="flex items-center gap-2 pt-3 border-t border-surface-container-high">
          {isLock && (
            <>
              <button
                onClick={() => onAction(device.id, isLocked ? 'UNLOCK' : 'LOCK')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isLocked
                    ? 'bg-warning/10 text-warning hover:bg-warning/20'
                    : 'bg-success/10 text-success hover:bg-success/20'
                }`}
              >
                {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isLocked ? 'Unlock' : 'Lock'}
              </button>
              <button
                onClick={() => onAction(device.id, 'GENERATE_CODE')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                Code
              </button>
            </>
          )}
          {isThermostat && (
            <>
              <button
                onClick={() => onAction(device.id, 'SET_TEMP', { temp: (device.lastReading?.targetTemp || 24) - 1 })}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-sm font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-sm font-headline font-bold text-on-surface">
                {device.lastReading?.targetTemp || 24}°C
              </span>
              <button
                onClick={() => onAction(device.id, 'SET_TEMP', { temp: (device.lastReading?.targetTemp || 24) + 1 })}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors text-sm font-bold"
              >
                +
              </button>
            </>
          )}
          {!isLock && !isThermostat && (
            <button
              onClick={() => onAction(device.id, 'REFRESH')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Generate Code Modal ──────────────────────────────────────────────────────

function GenerateCodeModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (data: any) => void }) {
  const [form, setForm] = useState({
    property: '',
    codeType: 'GUEST' as CodeType,
    assignedTo: '',
    validFrom: '2026-04-18T14:00',
    validTo: '2026-04-25T11:00',
    maxUsages: '',
  });

  const properties = [...new Set(MOCK_DEVICES.filter(d => d.type === 'SMART_LOCK').map(d => d.propertyName))];

  const handleSubmit = () => {
    if (!form.property || !form.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }
    const code = String(Math.floor(1000 + Math.random() * 9000));
    onGenerate({ ...form, codeValue: code });
    toast.success(`Access code ${code} generated successfully`);
    onClose();
  };

  const inputClasses = 'w-full px-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg ambient-shadow space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Generate Access Code</h3>
              <p className="text-xs text-on-surface-variant">Create a new smart lock access code</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
              Property *
            </label>
            <select
              value={form.property}
              onChange={(e) => setForm(prev => ({ ...prev, property: e.target.value }))}
              className={inputClasses}
            >
              <option value="">Select property...</option>
              {properties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
              Code Type *
            </label>
            <select
              value={form.codeType}
              onChange={(e) => setForm(prev => ({ ...prev, codeType: e.target.value as CodeType }))}
              className={inputClasses}
            >
              <option value="GUEST">Guest</option>
              <option value="CLEANER">Cleaner</option>
              <option value="OWNER">Owner</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="MASTER">Master</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
              Assign To *
            </label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
              placeholder="Person or booking name..."
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                Valid From
              </label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm(prev => ({ ...prev, validFrom: e.target.value }))}
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
                Valid To
              </label>
              <input
                type="datetime-local"
                value={form.validTo}
                onChange={(e) => setForm(prev => ({ ...prev, validTo: e.target.value }))}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1.5">
              Max Usages (optional)
            </label>
            <input
              type="number"
              value={form.maxUsages}
              onChange={(e) => setForm(prev => ({ ...prev, maxUsages: e.target.value }))}
              placeholder="Unlimited"
              className={inputClasses}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Generate Code
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function IoTDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('devices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<DeviceType | 'ALL'>('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeVisibility, setCodeVisibility] = useState<Record<string, boolean>>({});
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [automations, setAutomations] = useState(MOCK_AUTOMATIONS);

  // ---- Computed ----
  const properties = useMemo(() => [...new Set(MOCK_DEVICES.map(d => d.propertyName))], []);

  const filteredDevices = useMemo(() => {
    return MOCK_DEVICES.filter(d => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
      if (propertyFilter !== 'ALL' && d.propertyName !== propertyFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.propertyName.toLowerCase().includes(q) || d.manufacturer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [statusFilter, typeFilter, propertyFilter, searchQuery]);

  const kpis = useMemo(() => ({
    total: MOCK_DEVICES.length,
    online: MOCK_DEVICES.filter(d => d.status === 'ONLINE').length,
    offline: MOCK_DEVICES.filter(d => d.status === 'OFFLINE' || d.status === 'ERROR').length,
    batteryCritical: MOCK_DEVICES.filter(d => d.batteryLevel !== undefined && d.batteryLevel <= 20).length,
  }), []);

  const unacknowledgedAlerts = useMemo(() => alerts.filter(a => !a.acknowledged).length, [alerts]);

  // ---- Handlers ----
  const handleDeviceAction = useCallback((deviceId: string, action: string, params?: Record<string, any>) => {
    const device = MOCK_DEVICES.find(d => d.id === deviceId);
    if (!device) return;
    if (action === 'LOCK' || action === 'UNLOCK') {
      toast.success(`${action === 'LOCK' ? 'Locking' : 'Unlocking'} ${device.name}...`);
    } else if (action === 'SET_TEMP') {
      toast.success(`Setting ${device.name} to ${params?.temp}°C`);
    } else if (action === 'GENERATE_CODE') {
      setShowCodeModal(true);
    } else {
      toast.success(`Refreshing ${device.name}...`);
    }
  }, []);

  const handleAcknowledge = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    toast.success('Alert acknowledged');
  }, []);

  const handleRevokeCode = useCallback((codeId: string) => {
    toast.success('Access code revoked');
  }, []);

  const toggleCodeVisibility = useCallback((codeId: string) => {
    setCodeVisibility(prev => ({ ...prev, [codeId]: !prev[codeId] }));
  }, []);

  const toggleAutomation = useCallback((autoId: string) => {
    setAutomations(prev => prev.map(a => a.id === autoId ? { ...a, isActive: !a.isActive } : a));
    const automation = automations.find(a => a.id === autoId);
    toast.success(`${automation?.name} ${automation?.isActive ? 'disabled' : 'enabled'}`);
  }, [automations]);

  // ---- Tab config ----
  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: 'devices', label: 'Devices', icon: Wifi },
    { key: 'locks', label: 'Access Codes', icon: Key, badge: MOCK_CODES.filter(c => c.status === 'ACTIVE').length },
    { key: 'alerts', label: 'Alerts', icon: Bell, badge: unacknowledgedAlerts },
    { key: 'map', label: 'Map', icon: Map },
    { key: 'automations', label: 'Automations', icon: Zap },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
            Smart Property
          </p>
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface">
            IoT & Smart Locks
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync All</span>
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Devices</p>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-on-surface mb-1">{kpis.total}</p>
          <p className="text-xs text-on-surface-variant">across {properties.length} properties</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Online</p>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-success mb-1">{kpis.online}</p>
          <p className="text-xs text-on-surface-variant">{Math.round((kpis.online / kpis.total) * 100)}% connected</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Offline / Errors</p>
            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-error" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-error mb-1">{kpis.offline}</p>
          <p className="text-xs text-on-surface-variant">need attention</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-5 ambient-shadow hover:shadow-ambient-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Battery Critical</p>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <BatteryLow className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="font-headline text-2xl font-bold text-warning mb-1">{kpis.batteryCritical}</p>
          <p className="text-xs text-on-surface-variant">below 20%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-xl ambient-shadow overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'gradient-accent text-white shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-error/10 text-error'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================= DEVICES TAB ========================= */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search devices..."
                className="w-full ps-10 pe-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="ALL">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="LOW_BATTERY">Low Battery</option>
              <option value="ERROR">Error</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="ALL">All Types</option>
              {Object.entries(DEVICE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg bg-surface-container-lowest ambient-shadow text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            >
              <option value="ALL">All Properties</option>
              {properties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Results count */}
          <p className="text-xs text-on-surface-variant">
            Showing {filteredDevices.length} of {MOCK_DEVICES.length} devices
          </p>

          {/* Device Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDevices.map(device => (
              <DeviceCard key={device.id} device={device} onAction={handleDeviceAction} />
            ))}
          </div>

          {filteredDevices.length === 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-12 ambient-shadow text-center">
              <WifiOff className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
              <p className="text-sm text-on-surface-variant">No devices match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* ========================= LOCKS / ACCESS CODES TAB ========================= */}
      {activeTab === 'locks' && (
        <div className="space-y-6">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">Smart Lock Access Codes</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {MOCK_CODES.filter(c => c.status === 'ACTIVE').length} active codes, {MOCK_CODES.filter(c => c.status === 'SCHEDULED').length} scheduled
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success('Auto-generating codes for 2 upcoming bookings...');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Auto-Generate
              </button>
              <button
                onClick={() => setShowCodeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                New Code
              </button>
            </div>
          </div>

          {/* Codes Table */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Code Name</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Code</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Type</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Property</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Valid Period</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Uses</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="text-start py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CODES.map(code => (
                    <tr key={code.id} className="border-b border-surface-container-high/50 hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                            <Key className="w-3.5 h-3.5 text-secondary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate">{code.codeName}</p>
                            {code.assignedTo && (
                              <p className="text-[10px] text-on-surface-variant truncate">{code.assignedTo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-on-surface bg-surface-container-low px-2 py-0.5 rounded">
                            {codeVisibility[code.id] ? code.codeValue : maskCode(code.codeValue)}
                          </code>
                          <button
                            onClick={() => toggleCodeVisibility(code.id)}
                            className="p-1 rounded hover:bg-surface-container-high transition-colors"
                          >
                            {codeVisibility[code.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-on-surface-variant" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(code.codeValue);
                              toast.success('Code copied to clipboard');
                            }}
                            className="p-1 rounded hover:bg-surface-container-high transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CODE_TYPE_STYLES[code.type]}`}>
                          {code.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[140px]">{code.propertyName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-on-surface-variant">
                          <p>{formatDateShort(code.validFrom)}</p>
                          <p className="text-[10px]">to {formatDateShort(code.validTo)}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-on-surface">
                          {code.usageCount}
                          {code.maxUsages && <span className="text-on-surface-variant">/{code.maxUsages}</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CODE_STATUS_STYLES[code.status]}`}>
                          {code.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {(code.status === 'ACTIVE' || code.status === 'SCHEDULED') && (
                            <button
                              onClick={() => handleRevokeCode(code.id)}
                              title="Revoke code"
                              className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================= ALERTS TAB ========================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">Device Alerts</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {unacknowledgedAlerts} unacknowledged alert{unacknowledgedAlerts !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
                toast.success('All alerts acknowledged');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant bg-surface-container-lowest ambient-shadow hover:bg-surface-container-low transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Acknowledge All
            </button>
          </div>

          <div className="space-y-3">
            {alerts.map(alert => {
              const severityStyle = SEVERITY_STYLES[alert.severity];
              const SeverityIcon = severityStyle.icon;
              return (
                <div
                  key={alert.id}
                  className={`bg-surface-container-lowest rounded-xl p-4 ambient-shadow transition-all ${
                    !alert.acknowledged ? 'border-s-4' : 'opacity-60'
                  }`}
                  style={!alert.acknowledged ? {
                    borderInlineStartColor: alert.severity === 'CRITICAL' ? '#dc2626' : alert.severity === 'WARNING' ? '#f59e0b' : '#3b82f6',
                  } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${severityStyle.bg} flex items-center justify-center flex-shrink-0`}>
                      <SeverityIcon className={`w-4.5 h-4.5 ${severityStyle.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{alert.deviceName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-on-surface-variant" />
                            <span className="text-xs text-on-surface-variant">{alert.propertyName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${severityStyle.bg} ${severityStyle.text}`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">{timeAgo(alert.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1.5">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-low text-on-surface-variant`}>
                          {alert.type.replace(/_/g, ' ')}
                        </span>
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-secondary hover:bg-secondary/10 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Acknowledge
                          </button>
                        )}
                        {alert.acknowledged && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-on-surface-variant">
                            <CheckCircle className="w-3 h-3" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================= MAP TAB ========================= */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">Device Map</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Device locations across all properties</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl ambient-shadow overflow-hidden">
            {/* Map placeholder */}
            <div className="relative h-[500px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              {/* Simulated map background */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6b38d4" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Property pins */}
              <div className="absolute" style={{ top: '20%', left: '35%' }}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-2 py-1 rounded bg-white shadow text-[10px] font-medium text-on-surface whitespace-nowrap">
                    Villa Elounda (4)
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ top: '45%', left: '20%' }}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-2 py-1 rounded bg-white shadow text-[10px] font-medium text-on-surface whitespace-nowrap">
                    Chania Old Town (3)
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ top: '35%', left: '55%' }}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-2 py-1 rounded bg-white shadow text-[10px] font-medium text-on-surface whitespace-nowrap">
                    Rethymno Beach (3)
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ top: '60%', left: '65%' }}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-2 py-1 rounded bg-white shadow text-[10px] font-medium text-on-surface whitespace-nowrap">
                    Heraklion Harbor (3)
                  </div>
                </div>
              </div>

              <div className="absolute" style={{ top: '25%', left: '75%' }}>
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-1 px-2 py-1 rounded bg-white shadow text-[10px] font-medium text-on-surface whitespace-nowrap">
                    Agios Nikolaos (3)
                  </div>
                </div>
              </div>

              {/* Legend overlay */}
              <div className="absolute bottom-4 start-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Legend</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full gradient-accent" />
                    <span className="text-on-surface-variant">All devices online</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-on-surface-variant">Mostly online</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-on-surface-variant">Some issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <span className="text-on-surface-variant">Offline devices</span>
                  </div>
                </div>
              </div>

              {/* Integration note */}
              <div className="absolute top-4 end-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <Map className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold text-on-surface">Map View</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">
                  Interactive map with Google Maps / Mapbox integration. Click a pin to view property devices.
                </p>
              </div>
            </div>
          </div>

          {/* Property device summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(property => {
              const propertyDevices = MOCK_DEVICES.filter(d => d.propertyName === property);
              const online = propertyDevices.filter(d => d.status === 'ONLINE').length;
              const total = propertyDevices.length;
              return (
                <div key={property} className="bg-surface-container-lowest rounded-xl p-4 ambient-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-on-surface truncate">{property}</h4>
                      <p className="text-[10px] text-on-surface-variant">{online}/{total} online</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {propertyDevices.map(d => {
                      const DIcon = DEVICE_ICONS[d.type];
                      const sStyle = STATUS_STYLES[d.status];
                      return (
                        <div
                          key={d.id}
                          title={`${d.name} - ${sStyle.label}`}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg ${sStyle.bg}`}
                        >
                          <DIcon className={`w-3 h-3 ${sStyle.text}`} />
                          <span className={`text-[10px] font-medium ${sStyle.text}`}>{DEVICE_LABELS[d.type].split(' ')[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================= AUTOMATIONS TAB ========================= */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-semibold text-on-surface">Automation Rules</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {automations.filter(a => a.isActive).length} active rules
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white gradient-accent hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </button>
          </div>

          <div className="space-y-3">
            {automations.map(rule => (
              <div
                key={rule.id}
                className={`bg-surface-container-lowest rounded-xl p-5 ambient-shadow transition-all ${
                  !rule.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleAutomation(rule.id)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-8 h-8 text-success" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-on-surface-variant" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">{rule.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">{rule.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {/* Trigger */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10">
                        <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-medium text-blue-600">{rule.trigger}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                      {/* Action */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10">
                        <Zap className="w-3.5 h-3.5 text-success" />
                        <span className="text-[10px] font-medium text-success">{rule.action}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {/* Device types */}
                      <div className="flex items-center gap-1.5">
                        {rule.deviceTypes.map(dt => {
                          const DTIcon = DEVICE_ICONS[dt];
                          return (
                            <div key={dt} className="w-6 h-6 rounded bg-surface-container-low flex items-center justify-center" title={DEVICE_LABELS[dt]}>
                              <DTIcon className="w-3.5 h-3.5 text-on-surface-variant" />
                            </div>
                          );
                        })}
                      </div>

                      {rule.lastTriggered && (
                        <span className="text-[10px] text-on-surface-variant">
                          Last: {timeAgo(rule.lastTriggered)}
                        </span>
                      )}
                      <span className="text-[10px] text-on-surface-variant">
                        {rule.executionCount} executions
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Code Modal */}
      {showCodeModal && (
        <GenerateCodeModal
          onClose={() => setShowCodeModal(false)}
          onGenerate={(data) => {
            // In a real app, this would call the API
            console.log('Generated code:', data);
          }}
        />
      )}
    </div>
  );
}
