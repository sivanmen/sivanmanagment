import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/api-error';

class SystemSettingsService {
  /**
   * Get all settings, optionally filtered by category.
   * Masks secret values in the response.
   */
  async list(category?: string) {
    const where = category ? { category } : {};
    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s) => ({
      ...s,
      value: s.isSecret ? '••••••••' : s.value,
    }));
  }

  /**
   * Get a single setting by key.
   */
  async getByKey(key: string) {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) throw ApiError.notFound('Setting');

    return {
      ...setting,
      value: setting.isSecret ? '••••••••' : setting.value,
    };
  }

  /**
   * Get the raw (unmasked) value of a setting.
   * Used internally by other services.
   */
  async getRawValue(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  /**
   * Set a setting value. Creates if not exists, updates if exists.
   */
  async set(data: {
    key: string;
    value: string;
    category?: string;
    label?: string;
    isSecret?: boolean;
    updatedBy?: string;
  }) {
    const setting = await prisma.systemSetting.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        ...(data.category !== undefined && { category: data.category }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.isSecret !== undefined && { isSecret: data.isSecret }),
        ...(data.updatedBy !== undefined && { updatedBy: data.updatedBy }),
      },
      create: {
        key: data.key,
        value: data.value,
        category: data.category || 'general',
        label: data.label,
        isSecret: data.isSecret || false,
        updatedBy: data.updatedBy,
      },
    });

    return {
      ...setting,
      value: setting.isSecret ? '••••••••' : setting.value,
    };
  }

  /**
   * Bulk update multiple settings at once.
   */
  async bulkUpdate(settings: Array<{ key: string; value: string }>, updatedBy?: string) {
    const results = await prisma.$transaction(
      settings.map((s) =>
        prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, updatedBy },
          create: { key: s.key, value: s.value, category: 'general', updatedBy },
        }),
      ),
    );

    return results.map((r) => ({
      ...r,
      value: r.isSecret ? '••••••••' : r.value,
    }));
  }

  /**
   * Delete a setting by key.
   */
  async delete(key: string) {
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) throw ApiError.notFound('Setting');

    await prisma.systemSetting.delete({ where: { key } });
    return { success: true };
  }

  /**
   * Get all unique categories.
   */
  async getCategories() {
    const settings = await prisma.systemSetting.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return settings.map((s) => s.category);
  }
}

export const systemSettingsService = new SystemSettingsService();
