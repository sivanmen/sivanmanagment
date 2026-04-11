import { ApiError } from '../../utils/api-error';

interface TranslationKey {
  id: string;
  namespace: string;
  key: string;
  translations: Record<string, string>;
  description?: string;
  isVerified: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface TranslationNamespace {
  name: string;
  keyCount: number;
  completeness: Record<string, number>;
}

const SUPPORTED_LANGUAGES = ['en', 'el', 'he', 'de', 'fr', 'ru'];

const translationKeys: TranslationKey[] = [
  {
    id: 'tr-001',
    namespace: 'common',
    key: 'save',
    translations: { en: 'Save', el: 'Αποθήκευση', he: 'שמור', de: 'Speichern', fr: 'Enregistrer', ru: 'Сохранить' },
    isVerified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tr-002',
    namespace: 'common',
    key: 'cancel',
    translations: { en: 'Cancel', el: 'Ακύρωση', he: 'ביטול', de: 'Abbrechen', fr: 'Annuler', ru: 'Отмена' },
    isVerified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tr-003',
    namespace: 'common',
    key: 'delete',
    translations: { en: 'Delete', el: 'Διαγραφή', he: 'מחיקה', de: 'Löschen', fr: 'Supprimer', ru: 'Удалить' },
    isVerified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tr-004',
    namespace: 'properties',
    key: 'property_name',
    translations: { en: 'Property Name', el: 'Όνομα Ιδιοκτησίας', he: 'שם הנכס', de: 'Immobilienname', fr: 'Nom de la propriété', ru: 'Название объекта' },
    isVerified: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'tr-005',
    namespace: 'properties',
    key: 'nightly_rate',
    translations: { en: 'Nightly Rate', el: 'Τιμή ανά Νύχτα', he: 'מחיר ללילה', de: 'Nachtpreis', fr: 'Tarif par nuit', ru: 'Цена за ночь' },
    isVerified: true,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'tr-006',
    namespace: 'bookings',
    key: 'check_in',
    translations: { en: 'Check-in', el: 'Άφιξη', he: 'צ\'ק-אין', de: 'Anreise', fr: 'Arrivée', ru: 'Заезд' },
    isVerified: true,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'tr-007',
    namespace: 'bookings',
    key: 'check_out',
    translations: { en: 'Check-out', el: 'Αναχώρηση', he: 'צ\'ק-אאוט', de: 'Abreise', fr: 'Départ', ru: 'Выезд' },
    isVerified: true,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'tr-008',
    namespace: 'bookings',
    key: 'booking_confirmed',
    translations: { en: 'Booking Confirmed', el: 'Κράτηση Επιβεβαιωμένη', he: 'ההזמנה אושרה', de: 'Buchung bestätigt', fr: 'Réservation confirmée' },
    description: 'Missing Russian translation',
    isVerified: false,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'tr-009',
    namespace: 'guest_experience',
    key: 'welcome_message',
    translations: { en: 'Welcome to your stay in Crete!', el: 'Καλώς ήλθατε στην Κρήτη!', he: 'ברוכים הבאים לכרתים!' },
    description: 'Missing DE, FR, RU translations',
    isVerified: false,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'tr-010',
    namespace: 'maintenance',
    key: 'request_submitted',
    translations: { en: 'Maintenance request submitted', el: 'Το αίτημα συντήρησης υποβλήθηκε', he: 'בקשת תחזוקה הוגשה', de: 'Wartungsanfrage eingereicht', fr: 'Demande de maintenance soumise', ru: 'Заявка на обслуживание подана' },
    isVerified: true,
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2025-03-15T00:00:00Z',
  },
];

export class TranslationsService {
  async getNamespaces() {
    const nsMap = new Map<string, TranslationKey[]>();
    for (const tk of translationKeys) {
      if (!nsMap.has(tk.namespace)) nsMap.set(tk.namespace, []);
      nsMap.get(tk.namespace)!.push(tk);
    }

    const namespaces: TranslationNamespace[] = [];
    for (const [name, keys] of nsMap.entries()) {
      const completeness: Record<string, number> = {};
      for (const lang of SUPPORTED_LANGUAGES) {
        const translated = keys.filter((k) => k.translations[lang]).length;
        completeness[lang] = Math.round((translated / keys.length) * 100);
      }
      namespaces.push({ name, keyCount: keys.length, completeness });
    }

    return { namespaces, supportedLanguages: SUPPORTED_LANGUAGES };
  }

  async getTranslations(filters: {
    namespace?: string;
    language?: string;
    search?: string;
    isVerified?: boolean;
    missing?: string;
    page?: number;
    limit?: number;
  }) {
    const { namespace, language, search, isVerified, missing, page = 1, limit = 50 } = filters;

    let filtered = [...translationKeys];

    if (namespace) filtered = filtered.filter((t) => t.namespace === namespace);
    if (isVerified !== undefined) filtered = filtered.filter((t) => t.isVerified === isVerified);
    if (missing) {
      filtered = filtered.filter((t) => !t.translations[missing]);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          Object.values(t.translations).some((v) => v.toLowerCase().includes(q)),
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    // If language is specified, return flat key:value format
    if (language) {
      const flat: Record<string, string> = {};
      for (const item of items) {
        flat[`${item.namespace}.${item.key}`] = item.translations[language] || '';
      }
      return { translations: flat, total, page, limit, language };
    }

    return { translations: items, total, page, limit };
  }

  async getTranslationById(id: string) {
    const entry = translationKeys.find((t) => t.id === id);
    if (!entry) throw ApiError.notFound('Translation key');
    return entry;
  }

  async createTranslation(data: {
    namespace: string;
    key: string;
    translations: Record<string, string>;
    description?: string;
  }) {
    const exists = translationKeys.find(
      (t) => t.namespace === data.namespace && t.key === data.key,
    );
    if (exists) {
      throw ApiError.conflict('Translation key already exists in this namespace', 'KEY_EXISTS');
    }

    const now = new Date().toISOString();
    const entry: TranslationKey = {
      id: `tr-${String(translationKeys.length + 1).padStart(3, '0')}`,
      namespace: data.namespace,
      key: data.key,
      translations: data.translations,
      description: data.description,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    translationKeys.push(entry);
    return entry;
  }

  async updateTranslation(
    id: string,
    data: Partial<{
      translations: Record<string, string>;
      description: string | null;
      isVerified: boolean;
    }>,
    updatedBy?: string,
  ) {
    const idx = translationKeys.findIndex((t) => t.id === id);
    if (idx === -1) throw ApiError.notFound('Translation key');

    if (data.translations) {
      translationKeys[idx].translations = {
        ...translationKeys[idx].translations,
        ...data.translations,
      };
    }
    if (data.description !== undefined) {
      translationKeys[idx].description = data.description || undefined;
    }
    if (data.isVerified !== undefined) {
      translationKeys[idx].isVerified = data.isVerified;
    }
    translationKeys[idx].updatedBy = updatedBy;
    translationKeys[idx].updatedAt = new Date().toISOString();

    return translationKeys[idx];
  }

  async deleteTranslation(id: string) {
    const idx = translationKeys.findIndex((t) => t.id === id);
    if (idx === -1) throw ApiError.notFound('Translation key');

    translationKeys.splice(idx, 1);
    return { message: 'Translation key deleted successfully' };
  }

  async exportNamespace(namespace: string, language: string) {
    const keys = translationKeys.filter((t) => t.namespace === namespace);
    if (keys.length === 0) throw ApiError.notFound('Namespace');

    const result: Record<string, string> = {};
    for (const key of keys) {
      result[key.key] = key.translations[language] || '';
    }

    return { namespace, language, translations: result, keyCount: keys.length };
  }

  async importTranslations(data: {
    namespace: string;
    language: string;
    translations: Record<string, string>;
  }) {
    let created = 0;
    let updated = 0;

    for (const [key, value] of Object.entries(data.translations)) {
      const existing = translationKeys.find(
        (t) => t.namespace === data.namespace && t.key === key,
      );

      if (existing) {
        existing.translations[data.language] = value;
        existing.updatedAt = new Date().toISOString();
        updated++;
      } else {
        const now = new Date().toISOString();
        translationKeys.push({
          id: `tr-${String(translationKeys.length + 1).padStart(3, '0')}`,
          namespace: data.namespace,
          key,
          translations: { [data.language]: value },
          isVerified: false,
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { namespace: data.namespace, language: data.language, created, updated };
  }

  async getStats() {
    const total = translationKeys.length;
    const verified = translationKeys.filter((t) => t.isVerified).length;

    const completeness: Record<string, { translated: number; total: number; percentage: number }> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      const translated = translationKeys.filter((t) => t.translations[lang]).length;
      completeness[lang] = {
        translated,
        total,
        percentage: Math.round((translated / total) * 100),
      };
    }

    const namespaces = [...new Set(translationKeys.map((t) => t.namespace))];

    return {
      totalKeys: total,
      verifiedKeys: verified,
      unverifiedKeys: total - verified,
      supportedLanguages: SUPPORTED_LANGUAGES,
      namespaceCount: namespaces.length,
      completeness,
    };
  }
}

export const translationsService = new TranslationsService();
