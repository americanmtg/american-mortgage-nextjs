/**
 * Encryption Utility for PII (SSN, DOB)
 *
 * Uses AES-256-GCM with random IV per operation.
 * Storage format: <iv-hex>:<auth-tag-hex>:<ciphertext-hex>
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns format: <iv-hex>:<auth-tag-hex>:<ciphertext-hex>
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * Expects format: <iv-hex>:<auth-tag-hex>:<ciphertext-hex>
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Mask SSN for display: shows only last 4 digits
export function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return 'XXX-XX-XXXX';
  return 'XXX-XX-' + digits.slice(-4);
}

/**
 * Mask DOB for display. Shows only the year.
 */
export function maskDob(dob: string): string {
  // Try to extract year from various formats
  const match = dob.match(/(\d{4})/);
  const masked = 'XX/XX/';
  if (match) {
    return masked + match[1];
  }
  return masked + 'XXXX';
}

/**
 * Extract last 4 digits of SSN for storage/search
 */
export function getLastFourSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  return digits.slice(-4);
}
