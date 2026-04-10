import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LOCALES = ['en', 'he', 'es', 'fr', 'de', 'ru'];
const DEFAULT_LOCALE = 'en';

export function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Priority: query param > header > user preference > default
  let locale = req.query.lang as string | undefined;

  if (!locale) {
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase();
      if (preferred && SUPPORTED_LOCALES.includes(preferred)) {
        locale = preferred;
      }
    }
  }

  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  req.locale = locale;
  next();
}
