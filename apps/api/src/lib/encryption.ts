/**
 * Field-level AES-256-GCM encryption helpers.
 *
 * Use these to encrypt PII at rest — primarily IBAN, passport scans, and
 * any other field that must NOT appear in plaintext if the DB leaks.
 *
 * Key source: `config.encryption.key`. Production fail-fast on missing
 * key is enforced by `config/index.ts` (see P0 security batch).
 *
 * Output format: `enc:v1:<iv_base64>:<authTag_base64>:<ciphertext_base64>`
 *   - prefix `enc:v1:` lets us detect "is this value encrypted?" without
 *     attempting decryption, and lets us version the scheme cleanly.
 *   - IV is 12 bytes (GCM recommendation), random per encryption.
 *   - Auth tag is 16 bytes.
 *
 * Caller responsibility: this module does NOT auto-encrypt fields in the
 * DB layer. The bank-IBAN and passport fields must be passed through
 * `encrypt()` before write and `decrypt()` after read. A future Prisma
 * extension could automate this; for now keep it explicit so we can
 * tell at a glance what's encrypted.
 */

import crypto from 'crypto';
import { config } from '../config';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV size
const VERSION = 'v1';
const PREFIX = `enc:${VERSION}:`;

/** Derive a 32-byte key from the ENCRYPTION_KEY env var via SHA-256. */
function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(config.encryption.key).digest();
}

export function encrypt(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === '') return null;
  if (typeof plain !== 'string') {
    throw new Error('[encryption] encrypt() expects a string');
  }
  if (isEncrypted(plain)) {
    // Already encrypted — don't double-encrypt.
    return plain;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

export function decrypt(cipherText: string | null | undefined): string | null {
  if (cipherText === null || cipherText === undefined || cipherText === '') return null;
  if (typeof cipherText !== 'string') return null;
  if (!isEncrypted(cipherText)) {
    // Not encrypted — return as-is so callers can transparently handle
    // legacy plaintext values during a gradual migration.
    return cipherText;
  }

  const parts = cipherText.slice(PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('[encryption] Malformed ciphertext (expected iv:tag:ct)');
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64!, 'base64');
  const tag = Buffer.from(tagB64!, 'base64');
  const ct = Buffer.from(ctB64!, 'base64');

  const key = deriveKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/** Mask middle of an IBAN/account number for display in logs / UI. */
export function maskIban(iban: string | null | undefined): string {
  if (!iban) return '';
  if (iban.length <= 8) return iban;
  return `${iban.slice(0, 4)}…${iban.slice(-4)}`;
}
