import { ApiError } from '../../utils/api-error';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  language: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  isActive: boolean;
  twoFactorEnabled: boolean;
  timezone: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSetting {
  id: string;
  userId: string;
  category: string;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
}

interface QuietHours {
  userId: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
  exceptUrgent: boolean;
}

interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface SessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

const NOTIFICATION_CATEGORIES = ['booking', 'payment', 'maintenance', 'system', 'reports', 'marketing'];

const users: User[] = [
  {
    id: 'u-001',
    email: 'sivan@sivanmanagement.com',
    firstName: 'Sivan',
    lastName: 'Menahem',
    role: 'SUPER_ADMIN',
    phone: '+30-694-000-0001',
    language: 'he',
    status: 'ACTIVE',
    isActive: true,
    twoFactorEnabled: true,
    timezone: 'Europe/Athens',
    lastLoginAt: '2026-04-11T08:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-04-11T08:00:00Z',
  },
  {
    id: 'u-002',
    email: 'maria@sivanmanagement.com',
    firstName: 'Maria',
    lastName: 'Papadaki',
    role: 'PROPERTY_MANAGER',
    phone: '+30-694-000-0002',
    language: 'en',
    status: 'ACTIVE',
    isActive: true,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    lastLoginAt: '2026-04-10T14:30:00Z',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2026-04-10T14:30:00Z',
  },
  {
    id: 'u-003',
    email: 'nikos@sivanmanagement.com',
    firstName: 'Nikos',
    lastName: 'Stavrakis',
    role: 'MAINTENANCE',
    phone: '+30-694-000-0003',
    language: 'en',
    status: 'ACTIVE',
    isActive: true,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    lastLoginAt: '2026-04-09T10:00:00Z',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-04-09T10:00:00Z',
  },
  {
    id: 'u-004',
    email: 'owner.george@gmail.com',
    firstName: 'George',
    lastName: 'Alexiou',
    role: 'OWNER',
    phone: '+30-694-000-0004',
    language: 'en',
    status: 'ACTIVE',
    isActive: true,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    lastLoginAt: '2026-04-08T18:00:00Z',
    createdAt: '2025-04-10T00:00:00Z',
    updatedAt: '2026-04-08T18:00:00Z',
  },
  {
    id: 'u-005',
    email: 'elena@sivanmanagement.com',
    firstName: 'Elena',
    lastName: 'Katsarou',
    role: 'PROPERTY_MANAGER',
    phone: '+30-694-000-0005',
    language: 'en',
    status: 'INACTIVE',
    isActive: false,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    createdAt: '2025-05-20T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'u-006',
    email: 'dimitris@gmail.com',
    firstName: 'Dimitris',
    lastName: 'Kosta',
    role: 'OWNER',
    phone: '+30-694-000-0006',
    language: 'en',
    status: 'PENDING',
    isActive: false,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
  },
  {
    id: 'u-007',
    email: 'anna@sivanmanagement.com',
    firstName: 'Anna',
    lastName: 'Petridou',
    role: 'PROPERTY_MANAGER',
    phone: '+30-694-000-0007',
    language: 'en',
    status: 'SUSPENDED',
    isActive: false,
    twoFactorEnabled: false,
    timezone: 'Europe/Athens',
    lastLoginAt: '2026-03-20T09:00:00Z',
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2026-03-25T00:00:00Z',
  },
];

const notificationSettings: NotificationSetting[] = [
  // Sivan - all enabled
  { id: 'ns-001', userId: 'u-001', category: 'booking', email: true, whatsapp: true, sms: false, push: true },
  { id: 'ns-002', userId: 'u-001', category: 'payment', email: true, whatsapp: false, sms: false, push: true },
  { id: 'ns-003', userId: 'u-001', category: 'maintenance', email: true, whatsapp: true, sms: true, push: true },
  { id: 'ns-004', userId: 'u-001', category: 'system', email: true, whatsapp: true, sms: true, push: true },
  { id: 'ns-005', userId: 'u-001', category: 'reports', email: true, whatsapp: false, sms: false, push: false },
  { id: 'ns-006', userId: 'u-001', category: 'marketing', email: false, whatsapp: false, sms: false, push: false },
  // Maria - email + whatsapp
  { id: 'ns-007', userId: 'u-002', category: 'booking', email: true, whatsapp: true, sms: false, push: false },
  { id: 'ns-008', userId: 'u-002', category: 'payment', email: true, whatsapp: false, sms: false, push: false },
  { id: 'ns-009', userId: 'u-002', category: 'maintenance', email: true, whatsapp: true, sms: false, push: false },
  { id: 'ns-010', userId: 'u-002', category: 'system', email: true, whatsapp: false, sms: false, push: false },
  { id: 'ns-011', userId: 'u-002', category: 'reports', email: true, whatsapp: false, sms: false, push: false },
  { id: 'ns-012', userId: 'u-002', category: 'marketing', email: false, whatsapp: false, sms: false, push: false },
];

const quietHoursMap: Record<string, QuietHours> = {
  'u-001': {
    userId: 'u-001',
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    exceptUrgent: true,
  },
};

const activityLogs: ActivityLogEntry[] = [
  { id: 'al-001', userId: 'u-001', action: 'LOGIN', entityType: 'session', ipAddress: '192.168.1.1', userAgent: 'Chrome/122 (Windows)', createdAt: '2026-04-11T08:00:00Z' },
  { id: 'al-002', userId: 'u-001', action: 'UPDATE', entityType: 'property', entityId: 'p-001', ipAddress: '192.168.1.1', userAgent: 'Chrome/122 (Windows)', createdAt: '2026-04-11T07:45:00Z' },
  { id: 'al-003', userId: 'u-001', action: 'CREATE', entityType: 'booking', entityId: 'b-015', ipAddress: '192.168.1.1', userAgent: 'Chrome/122 (Windows)', createdAt: '2026-04-10T16:30:00Z' },
  { id: 'al-004', userId: 'u-001', action: 'VIEW', entityType: 'report', entityId: 'r-003', ipAddress: '10.0.0.5', userAgent: 'Safari/17 (Mac)', createdAt: '2026-04-10T14:00:00Z' },
  { id: 'al-005', userId: 'u-001', action: 'UPDATE', entityType: 'user', entityId: 'u-003', ipAddress: '192.168.1.1', userAgent: 'Chrome/122 (Windows)', createdAt: '2026-04-10T11:20:00Z' },
  { id: 'al-006', userId: 'u-002', action: 'LOGIN', entityType: 'session', ipAddress: '10.0.0.22', userAgent: 'Firefox/120 (Linux)', createdAt: '2026-04-10T14:30:00Z' },
  { id: 'al-007', userId: 'u-002', action: 'CREATE', entityType: 'maintenance', entityId: 'm-008', ipAddress: '10.0.0.22', userAgent: 'Firefox/120 (Linux)', createdAt: '2026-04-10T15:10:00Z' },
  { id: 'al-008', userId: 'u-003', action: 'LOGIN', entityType: 'session', ipAddress: '10.0.0.50', userAgent: 'Chrome/122 (Android)', createdAt: '2026-04-09T10:00:00Z' },
  { id: 'al-009', userId: 'u-004', action: 'LOGIN', entityType: 'session', ipAddress: '85.73.122.45', userAgent: 'Safari/17 (iPhone)', createdAt: '2026-04-08T18:00:00Z' },
  { id: 'al-010', userId: 'u-001', action: 'DELETE', entityType: 'document', entityId: 'd-005', ipAddress: '192.168.1.1', userAgent: 'Chrome/122 (Windows)', createdAt: '2026-04-09T09:15:00Z' },
];

const sessionsMap: Record<string, SessionInfo[]> = {
  'u-001': [
    { id: 's-001', deviceInfo: 'Chrome 122 on Windows 11', ipAddress: '192.168.1.1', createdAt: '2026-04-11T08:00:00Z', lastActive: '2026-04-11T10:30:00Z', isCurrent: true },
    { id: 's-002', deviceInfo: 'Safari 17 on macOS Sonoma', ipAddress: '10.0.0.5', createdAt: '2026-04-10T14:00:00Z', lastActive: '2026-04-10T16:45:00Z', isCurrent: false },
    { id: 's-003', deviceInfo: 'Chrome Mobile on Android 15', ipAddress: '85.73.44.12', createdAt: '2026-04-08T09:00:00Z', lastActive: '2026-04-08T11:30:00Z', isCurrent: false },
  ],
  'u-002': [
    { id: 's-004', deviceInfo: 'Firefox 120 on Ubuntu', ipAddress: '10.0.0.22', createdAt: '2026-04-10T14:30:00Z', lastActive: '2026-04-10T17:00:00Z', isCurrent: true },
  ],
};

export class UsersService {
  async getAllUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { search, role, status, isActive, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    let filtered = [...users];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q)),
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (status) {
      filtered = filtered.filter((u) => u.status === status);
    }

    if (isActive !== undefined) {
      filtered = filtered.filter((u) => u.isActive === isActive);
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

    return { users: items, total, page, limit };
  }

  async getUserById(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw ApiError.notFound('User');
    }

    const userNotifSettings = notificationSettings.filter((ns) => ns.userId === id);
    const userQuietHours = quietHoursMap[id] || {
      userId: id,
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      days: [],
      exceptUrgent: true,
    };

    // Fill missing categories with defaults
    const allSettings = NOTIFICATION_CATEGORIES.map((cat) => {
      const existing = userNotifSettings.find((s) => s.category === cat);
      if (existing) return existing;
      return {
        id: `ns-auto-${id}-${cat}`,
        userId: id,
        category: cat,
        email: cat === 'system',
        whatsapp: false,
        sms: false,
        push: false,
      };
    });

    return {
      ...user,
      notificationSettings: allSettings,
      quietHours: userQuietHours,
    };
  }

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    language?: string;
  }) {
    const exists = users.find((u) => u.email === data.email);
    if (exists) {
      throw ApiError.conflict('User with this email already exists', 'EMAIL_EXISTS');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: `u-${String(users.length + 1).padStart(3, '0')}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone,
      language: data.language || 'en',
      status: 'ACTIVE',
      isActive: true,
      twoFactorEnabled: false,
      timezone: 'Europe/Athens',
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);

    // Create default notification settings
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      notificationSettings.push({
        id: `ns-${Date.now()}-${cat}`,
        userId: user.id,
        category: cat,
        email: true,
        whatsapp: false,
        sms: false,
        push: false,
      });
    });

    return user;
  }

  async inviteUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    language?: string;
    sendEmail?: boolean;
    sendWhatsApp?: boolean;
    welcomeMessage?: string;
    notificationPreset?: string;
  }) {
    const exists = users.find((u) => u.email === data.email);
    if (exists) {
      throw ApiError.conflict('User with this email already exists', 'EMAIL_EXISTS');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: `u-${String(users.length + 1).padStart(3, '0')}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone,
      language: data.language || 'en',
      status: 'PENDING',
      isActive: false,
      twoFactorEnabled: false,
      timezone: 'Europe/Athens',
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);

    // Apply notification preset
    const preset = data.notificationPreset || 'emailOnly';
    NOTIFICATION_CATEGORIES.forEach((cat) => {
      let email = true;
      let whatsapp = false;
      let sms = false;

      if (preset === 'allChannels') {
        whatsapp = true;
        sms = true;
      } else if (preset === 'emailAndWhatsApp') {
        whatsapp = true;
      } else if (preset === 'minimal') {
        email = cat === 'system';
      } else if (preset === 'muteAll') {
        email = false;
      }

      notificationSettings.push({
        id: `ns-${Date.now()}-${cat}`,
        userId: user.id,
        category: cat,
        email,
        whatsapp,
        sms,
        push: false,
      });
    });

    return {
      user,
      invitationSent: true,
      channels: {
        email: data.sendEmail !== false,
        whatsapp: data.sendWhatsApp === true && !!data.phone,
      },
    };
  }

  async updateUser(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      role: string;
      phone: string | null;
      language: string;
      isActive: boolean;
      status: string;
      timezone: string;
      twoFactorEnabled: boolean;
    }>,
  ) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() } as any;
    return users[idx];
  }

  async deleteUser(id: string) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx].isActive = false;
    users[idx].status = 'INACTIVE';
    users[idx].updatedAt = new Date().toISOString();
    return { message: 'User deactivated successfully' };
  }

  async suspendUser(id: string) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx].status = 'SUSPENDED';
    users[idx].isActive = false;
    users[idx].updatedAt = new Date().toISOString();
    return users[idx];
  }

  async activateUser(id: string) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx].status = 'ACTIVE';
    users[idx].isActive = true;
    users[idx].updatedAt = new Date().toISOString();
    return users[idx];
  }

  async resetPassword(id: string) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx].updatedAt = new Date().toISOString();
    return { message: 'Password reset email sent successfully', userId: id };
  }

  async getActivity(id: string, filters: { page?: number; limit?: number }) {
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw ApiError.notFound('User');
    }

    const { page = 1, limit = 20 } = filters;
    const userLogs = activityLogs.filter((l) => l.userId === id);
    const total = userLogs.length;
    const start = (page - 1) * limit;
    const items = userLogs.slice(start, start + limit);

    return { activity: items, total, page, limit };
  }

  async getSessions(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) {
      throw ApiError.notFound('User');
    }

    return sessionsMap[id] || [];
  }

  async revokeSession(userId: string, sessionId: string) {
    const sessions = sessionsMap[userId];
    if (!sessions) {
      throw ApiError.notFound('Session');
    }

    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) {
      throw ApiError.notFound('Session');
    }

    sessions.splice(idx, 1);
    return { message: 'Session revoked successfully' };
  }

  async updateNotificationSettings(
    userId: string,
    settings: { category: string; email: boolean; whatsapp: boolean; sms: boolean; push: boolean }[],
  ) {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    for (const setting of settings) {
      const idx = notificationSettings.findIndex(
        (ns) => ns.userId === userId && ns.category === setting.category,
      );
      if (idx !== -1) {
        notificationSettings[idx] = { ...notificationSettings[idx], ...setting };
      } else {
        notificationSettings.push({
          id: `ns-${Date.now()}-${setting.category}`,
          userId,
          ...setting,
        });
      }
    }

    return notificationSettings.filter((ns) => ns.userId === userId);
  }

  async updateQuietHours(userId: string, data: Omit<QuietHours, 'userId'>) {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw ApiError.notFound('User');
    }

    quietHoursMap[userId] = { userId, ...data };
    return quietHoursMap[userId];
  }

  async getStats() {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const inactive = users.filter((u) => u.status === 'INACTIVE').length;
    const suspended = users.filter((u) => u.status === 'SUSPENDED').length;
    const pending = users.filter((u) => u.status === 'PENDING').length;
    const owners = users.filter((u) => u.role === 'OWNER').length;
    const staff = users.filter((u) => ['PROPERTY_MANAGER', 'MAINTENANCE'].includes(u.role)).length;
    const admins = users.filter((u) => u.role === 'SUPER_ADMIN').length;

    return {
      total,
      active,
      inactive,
      suspended,
      pending,
      owners,
      staff,
      admins,
      byRole: {
        SUPER_ADMIN: admins,
        PROPERTY_MANAGER: users.filter((u) => u.role === 'PROPERTY_MANAGER').length,
        MAINTENANCE: users.filter((u) => u.role === 'MAINTENANCE').length,
        OWNER: owners,
        VIP_STAR: users.filter((u) => u.role === 'VIP_STAR').length,
        AFFILIATE: users.filter((u) => u.role === 'AFFILIATE').length,
      },
    };
  }
}

export const usersService = new UsersService();
