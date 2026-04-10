/**
 * Common validation regular expressions for the Property Management System.
 */

/** Validates an email address */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Validates an international phone number (E.164 format) */
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/** Validates a phone number (flexible: with or without country code) */
export const PHONE_FLEXIBLE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;

/** Validates a UUID v4 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validates a URL */
export const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

/** Validates a slug (lowercase letters, numbers, hyphens) */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates a 2-letter ISO country code */
export const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

/** Validates a 3-letter currency code */
export const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

/** Validates a date in YYYY-MM-DD format */
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Validates a time in HH:MM format (24-hour) */
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Validates a hex color code */
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/** Validates a postal/zip code (flexible for multiple countries) */
export const POSTAL_CODE_REGEX = /^[A-Z0-9\s-]{3,10}$/i;

/** Password must have at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Validates a value against a regex pattern.
 */
export function isValid(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * Validates an email address.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates a phone number (E.164 format).
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Validates a UUID v4.
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Validates a URL.
 */
export function isValidURL(url: string): boolean {
  return URL_REGEX.test(url);
}

/**
 * Validates a password meets strength requirements.
 */
export function isStrongPassword(password: string): boolean {
  return STRONG_PASSWORD_REGEX.test(password);
}
