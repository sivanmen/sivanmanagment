import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

interface OwnerFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class OwnersService {
  async getAllOwners(filters: OwnerFilters) {
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.OwnerWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: Record<string, Prisma.OwnerOrderByWithRelationInput> = {
      createdAt: { createdAt: sortOrder },
      companyName: { companyName: sortOrder },
      name: { user: { firstName: sortOrder } },
    };

    const orderBy = allowedSortFields[sortBy] || { createdAt: sortOrder };

    const [owners, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              avatarUrl: true,
              lastLoginAt: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.owner.count({ where }),
    ]);

    return { owners, total, page, limit };
  }

  async getOwnerById(id: string) {
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
            preferredLocale: true,
            timezone: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        properties: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            internalCode: true,
            propertyType: true,
            status: true,
            city: true,
            country: true,
            baseNightlyRate: true,
            managementFeePercent: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            properties: true,
            incomeRecords: true,
            expenseRecords: true,
            documents: true,
          },
        },
      },
    });

    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    return owner;
  }

  async createOwner(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    companyName?: string;
    taxId?: string;
    billingAddress?: any;
    defaultManagementFeePercent?: number;
    defaultMinimumMonthlyFee?: number;
    expenseApprovalThreshold?: number;
    preferredPaymentMethod?: string;
    bankDetails?: any;
    stripeAccountId?: string;
    paypalEmail?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    notes?: string;
    metadata?: any;
  }) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw ApiError.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    // Create user and owner in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with a temporary password (they'll reset it)
      const bcrypt = await import('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          preferredLocale: data.locale || 'en',
          timezone: data.timezone || 'Europe/Athens',
          role: 'OWNER',
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      });

      const owner = await tx.owner.create({
        data: {
          userId: user.id,
          companyName: data.companyName,
          taxId: data.taxId,
          billingAddress: data.billingAddress,
          defaultManagementFeePercent: data.defaultManagementFeePercent ?? 25,
          defaultMinimumMonthlyFee: data.defaultMinimumMonthlyFee ?? 0,
          expenseApprovalThreshold: data.expenseApprovalThreshold ?? 100,
          preferredPaymentMethod: (data.preferredPaymentMethod as any) || 'BANK_TRANSFER',
          bankDetails: data.bankDetails,
          stripeAccountId: data.stripeAccountId,
          paypalEmail: data.paypalEmail,
          contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
          contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
          notes: data.notes,
          metadata: data.metadata,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
            },
          },
        },
      });

      return { owner, tempPassword };
    });

    return result;
  }

  async updateOwner(
    id: string,
    data: Partial<{
      companyName: string | null;
      taxId: string | null;
      billingAddress: any;
      defaultManagementFeePercent: number;
      defaultMinimumMonthlyFee: number;
      expenseApprovalThreshold: number;
      preferredPaymentMethod: string;
      bankDetails: any;
      stripeAccountId: string | null;
      paypalEmail: string | null;
      contractStartDate: string | null;
      contractEndDate: string | null;
      notes: string | null;
      metadata: any;
      // User fields
      firstName: string;
      lastName: string;
      phone: string | null;
      locale: string;
      timezone: string;
    }>,
  ) {
    const existing = await prisma.owner.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    // Separate user fields from owner fields
    const { firstName, lastName, phone, locale, timezone, ...ownerData } = data;

    const updateData: any = { ...ownerData };

    // Convert date strings
    if (ownerData.contractStartDate !== undefined) {
      updateData.contractStartDate = ownerData.contractStartDate
        ? new Date(ownerData.contractStartDate)
        : null;
    }
    if (ownerData.contractEndDate !== undefined) {
      updateData.contractEndDate = ownerData.contractEndDate
        ? new Date(ownerData.contractEndDate)
        : null;
    }

    // Convert payment method
    if (ownerData.preferredPaymentMethod) {
      updateData.preferredPaymentMethod = ownerData.preferredPaymentMethod as any;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user fields if provided
      const userUpdate: any = {};
      if (firstName !== undefined) userUpdate.firstName = firstName;
      if (lastName !== undefined) userUpdate.lastName = lastName;
      if (phone !== undefined) userUpdate.phone = phone;
      if (locale !== undefined) userUpdate.preferredLocale = locale;
      if (timezone !== undefined) userUpdate.timezone = timezone;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }

      // Update owner
      const owner = await tx.owner.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              preferredLocale: true,
              timezone: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
      });

      return owner;
    });

    return result;
  }

  async deleteOwner(id: string) {
    const existing = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: {
          where: { deletedAt: null, status: { in: ['ACTIVE', 'MAINTENANCE'] } },
        },
      },
    });

    if (!existing || existing.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    if (existing.properties.length > 0) {
      throw ApiError.badRequest(
        'Cannot delete owner with active properties. Archive or reassign properties first.',
        'OWNER_HAS_ACTIVE_PROPERTIES',
      );
    }

    // Soft delete owner and suspend user
    await prisma.$transaction(async (tx) => {
      await tx.owner.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: { status: 'SUSPENDED', deletedAt: new Date() },
      });
    });

    return { message: 'Owner deleted successfully' };
  }

  async getOwnerFinancialSummary(id: string) {
    const owner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!owner || owner.deletedAt) {
      throw ApiError.notFound('Owner');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalIncome,
      monthlyIncome,
      yearlyIncome,
      totalExpenses,
      monthlyExpenses,
      yearlyExpenses,
      propertyCount,
    ] = await Promise.all([
      prisma.incomeRecord.aggregate({
        where: { ownerId: id },
        _sum: { amount: true },
      }),
      prisma.incomeRecord.aggregate({
        where: { ownerId: id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.incomeRecord.aggregate({
        where: { ownerId: id, date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.expenseRecord.aggregate({
        where: { ownerId: id },
        _sum: { amount: true },
      }),
      prisma.expenseRecord.aggregate({
        where: { ownerId: id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expenseRecord.aggregate({
        where: { ownerId: id, date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      prisma.property.count({
        where: { ownerId: id, deletedAt: null },
      }),
    ]);

    return {
      ownerId: id,
      propertyCount,
      income: {
        total: totalIncome._sum.amount?.toNumber() || 0,
        thisMonth: monthlyIncome._sum.amount?.toNumber() || 0,
        thisYear: yearlyIncome._sum.amount?.toNumber() || 0,
      },
      expenses: {
        total: totalExpenses._sum.amount?.toNumber() || 0,
        thisMonth: monthlyExpenses._sum.amount?.toNumber() || 0,
        thisYear: yearlyExpenses._sum.amount?.toNumber() || 0,
      },
      netIncome: {
        total: (totalIncome._sum.amount?.toNumber() || 0) - (totalExpenses._sum.amount?.toNumber() || 0),
        thisMonth: (monthlyIncome._sum.amount?.toNumber() || 0) - (monthlyExpenses._sum.amount?.toNumber() || 0),
        thisYear: (yearlyIncome._sum.amount?.toNumber() || 0) - (yearlyExpenses._sum.amount?.toNumber() || 0),
      },
      feeConfig: {
        managementFeePercent: owner.defaultManagementFeePercent.toNumber(),
        minimumMonthlyFee: owner.defaultMinimumMonthlyFee.toNumber(),
        expenseApprovalThreshold: owner.expenseApprovalThreshold.toNumber(),
      },
    };
  }
}

export const ownersService = new OwnersService();
