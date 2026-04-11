import { ApiError } from '../../utils/api-error';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  avatar?: string;
  language: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  {
    id: 'u-001',
    email: 'sivan@sivanmanagement.com',
    firstName: 'Sivan',
    lastName: 'Menahem',
    role: 'SUPER_ADMIN',
    phone: '+30-694-000-0001',
    language: 'he',
    isActive: true,
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
    language: 'el',
    isActive: true,
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
    language: 'el',
    isActive: true,
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
    isActive: true,
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
    language: 'el',
    isActive: false,
    createdAt: '2025-05-20T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

export class UsersService {
  async getAllUsers(filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { search, role, isActive, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    let filtered = [...users];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q),
      );
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
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
    return user;
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
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    return user;
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
    }>,
  ) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    return users[idx];
  }

  async deleteUser(id: string) {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw ApiError.notFound('User');
    }

    users[idx].isActive = false;
    users[idx].updatedAt = new Date().toISOString();
    return { message: 'User deactivated successfully' };
  }
}

export const usersService = new UsersService();
