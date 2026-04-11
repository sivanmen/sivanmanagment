import { ApiError } from '../../utils/api-error';

interface IoTDevice {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  type: 'SMART_LOCK' | 'THERMOSTAT' | 'NOISE_MONITOR' | 'CAMERA' | 'MOTION_SENSOR' | 'SMOKE_DETECTOR' | 'WATER_LEAK' | 'ENERGY_METER';
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'LOW_BATTERY' | 'ERROR';
  batteryLevel?: number;
  lastReading?: Record<string, any>;
  lastSeenAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeviceEvent {
  id: string;
  deviceId: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

const devices: IoTDevice[] = [
  {
    id: 'iot-001',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    name: 'Front Door Lock',
    type: 'SMART_LOCK',
    manufacturer: 'Nuki',
    model: 'Smart Lock 4.0 Pro',
    serialNumber: 'NK-2026-001',
    status: 'ONLINE',
    batteryLevel: 85,
    lastReading: { locked: true, lastUnlock: '2026-04-10T16:30:00Z', accessCode: '****' },
    lastSeenAt: '2026-04-11T09:00:00Z',
    isActive: true,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-04-11T09:00:00Z',
  },
  {
    id: 'iot-002',
    propertyId: 'prop-001',
    propertyName: 'Villa Elounda Seafront',
    name: 'Living Room Thermostat',
    type: 'THERMOSTAT',
    manufacturer: 'Tado',
    model: 'Smart Thermostat V3+',
    serialNumber: 'TD-2026-001',
    status: 'ONLINE',
    lastReading: { currentTemp: 23.5, targetTemp: 24, mode: 'COOL', humidity: 55 },
    lastSeenAt: '2026-04-11T09:05:00Z',
    isActive: true,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-04-11T09:05:00Z',
  },
  {
    id: 'iot-003',
    propertyId: 'prop-002',
    propertyName: 'Chania Old Town Apt',
    name: 'Noise Monitor',
    type: 'NOISE_MONITOR',
    manufacturer: 'Minut',
    model: 'Minut Point 2',
    serialNumber: 'MN-2026-001',
    status: 'ONLINE',
    batteryLevel: 72,
    lastReading: { noiseLevel: 42, threshold: 70, alert: false },
    lastSeenAt: '2026-04-11T09:10:00Z',
    isActive: true,
    createdAt: '2025-07-15T00:00:00Z',
    updatedAt: '2026-04-11T09:10:00Z',
  },
  {
    id: 'iot-004',
    propertyId: 'prop-003',
    propertyName: 'Rethymno Beach House',
    name: 'Kitchen Smoke Detector',
    type: 'SMOKE_DETECTOR',
    manufacturer: 'Nest',
    model: 'Protect 2nd Gen',
    serialNumber: 'NP-2026-001',
    status: 'LOW_BATTERY',
    batteryLevel: 12,
    lastReading: { smokeDetected: false, coDetected: false },
    lastSeenAt: '2026-04-11T08:45:00Z',
    isActive: true,
    createdAt: '2025-08-01T00:00:00Z',
    updatedAt: '2026-04-11T08:45:00Z',
  },
  {
    id: 'iot-005',
    propertyId: 'prop-002',
    propertyName: 'Chania Old Town Apt',
    name: 'Bathroom Water Leak Sensor',
    type: 'WATER_LEAK',
    manufacturer: 'Aqara',
    model: 'Water Leak Sensor T1',
    serialNumber: 'AQ-2026-001',
    status: 'OFFLINE',
    batteryLevel: 0,
    lastReading: { leakDetected: false },
    lastSeenAt: '2026-04-09T12:00:00Z',
    isActive: true,
    createdAt: '2025-09-10T00:00:00Z',
    updatedAt: '2026-04-09T12:00:00Z',
  },
];

const events: DeviceEvent[] = [
  { id: 'evt-001', deviceId: 'iot-001', type: 'UNLOCK', data: { method: 'code', codeSlot: 1 }, timestamp: '2026-04-10T16:30:00Z' },
  { id: 'evt-002', deviceId: 'iot-001', type: 'LOCK', data: { method: 'auto' }, timestamp: '2026-04-10T16:30:30Z' },
  { id: 'evt-003', deviceId: 'iot-003', type: 'NOISE_ALERT', data: { noiseLevel: 78, duration: 15 }, timestamp: '2026-04-09T23:15:00Z' },
  { id: 'evt-004', deviceId: 'iot-004', type: 'LOW_BATTERY', data: { batteryLevel: 12 }, timestamp: '2026-04-11T08:45:00Z' },
  { id: 'evt-005', deviceId: 'iot-005', type: 'OFFLINE', data: { lastSeen: '2026-04-09T12:00:00Z' }, timestamp: '2026-04-09T14:00:00Z' },
];

export class IoTService {
  async getAllDevices(filters: {
    propertyId?: string;
    type?: string;
    status?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { propertyId, type, status, isActive, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    let filtered = [...devices];

    if (propertyId) filtered = filtered.filter((d) => d.propertyId === propertyId);
    if (type) filtered = filtered.filter((d) => d.type === type);
    if (status) filtered = filtered.filter((d) => d.status === status);
    if (isActive !== undefined) filtered = filtered.filter((d) => d.isActive === isActive);

    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy] || '';
      const bVal = (b as any)[sortBy] || '';
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { devices: items, total, page, limit };
  }

  async getDeviceById(id: string) {
    const device = devices.find((d) => d.id === id);
    if (!device) throw ApiError.notFound('IoT Device');
    return device;
  }

  async createDevice(data: {
    propertyId: string;
    propertyName?: string;
    name: string;
    type: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
  }) {
    const now = new Date().toISOString();
    const device: IoTDevice = {
      id: `iot-${String(devices.length + 1).padStart(3, '0')}`,
      propertyId: data.propertyId,
      propertyName: data.propertyName || data.propertyId,
      name: data.name,
      type: data.type as IoTDevice['type'],
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      status: 'OFFLINE',
      isActive: true,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };
    devices.push(device);
    return device;
  }

  async updateDevice(
    id: string,
    data: Partial<{
      name: string;
      isActive: boolean;
    }>,
  ) {
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) throw ApiError.notFound('IoT Device');

    devices[idx] = { ...devices[idx], ...data, updatedAt: new Date().toISOString() };
    return devices[idx];
  }

  async deleteDevice(id: string) {
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) throw ApiError.notFound('IoT Device');

    devices[idx].isActive = false;
    devices[idx].updatedAt = new Date().toISOString();
    return { message: 'Device deactivated successfully' };
  }

  async getDeviceEvents(deviceId: string, filters: { page?: number; limit?: number }) {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) throw ApiError.notFound('IoT Device');

    const { page = 1, limit = 50 } = filters;
    const filtered = events.filter((e) => e.deviceId === deviceId);
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return { events: items, total, page, limit };
  }

  async sendCommand(deviceId: string, command: { action: string; params?: Record<string, any> }) {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) throw ApiError.notFound('IoT Device');
    if (device.status === 'OFFLINE') throw ApiError.badRequest('Device is offline', 'DEVICE_OFFLINE');

    const event: DeviceEvent = {
      id: `evt-${String(events.length + 1).padStart(3, '0')}`,
      deviceId,
      type: `COMMAND_${command.action.toUpperCase()}`,
      data: { action: command.action, params: command.params, result: 'sent' },
      timestamp: new Date().toISOString(),
    };
    events.push(event);

    return { message: 'Command sent successfully', event };
  }

  async getDashboard() {
    const total = devices.length;
    const online = devices.filter((d) => d.status === 'ONLINE').length;
    const offline = devices.filter((d) => d.status === 'OFFLINE').length;
    const lowBattery = devices.filter((d) => d.status === 'LOW_BATTERY').length;
    const error = devices.filter((d) => d.status === 'ERROR').length;
    const alerts = events.filter(
      (e) =>
        e.type.includes('ALERT') ||
        e.type === 'LOW_BATTERY' ||
        e.type === 'OFFLINE',
    ).slice(0, 10);

    return {
      summary: { total, online, offline, lowBattery, error },
      recentAlerts: alerts,
      byType: devices.reduce(
        (acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}

export const iotService = new IoTService();
