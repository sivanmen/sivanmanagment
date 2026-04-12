import type { Request, Response, NextFunction } from 'express';
import { systemSettingsService } from './system-settings.service';

export async function listSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { category } = req.query;
    const settings = await systemSettingsService.list(
      typeof category === 'string' ? category : undefined,
    );
    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
}

export async function getSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await systemSettingsService.getByKey(req.params.key as string);
    res.json({ data: setting });
  } catch (error) {
    next(error);
  }
}

export async function setSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, value, category, label, isSecret } = req.body;
    const setting = await systemSettingsService.set({
      key,
      value,
      category,
      label,
      isSecret,
      updatedBy: req.user?.userId,
    });
    res.json({ data: setting, message: 'Setting updated' });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { settings } = req.body;
    const results = await systemSettingsService.bulkUpdate(settings, req.user?.userId);
    res.json({ data: results, message: `${results.length} settings updated` });
  } catch (error) {
    next(error);
  }
}

export async function deleteSetting(req: Request, res: Response, next: NextFunction) {
  try {
    await systemSettingsService.delete(req.params.key as string);
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await systemSettingsService.getCategories();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}
