import crypto from 'crypto';
import { env } from '../config/environment';

// Derive 32-byte key from SESSION_SECRET
const SECRET_SEED = env.security.sessionSecret || 'khatabook-vault-secure-key-2026';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET_SEED).digest();
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Output format: enc:<iv-hex>:<tag-hex>:<ciphertext-hex>
 */
export function encryptText(plainText: string | null | undefined): string | null {
  if (!plainText) return null;
  // If already encrypted, avoid double encryption
  if (plainText.startsWith('enc:')) return plainText;

  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.error('Failed to encrypt text:', err);
    return plainText;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If input does not start with 'enc:', returns as-is for backwards compatibility.
 */
export function decryptText(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;
  if (!cipherText.startsWith('enc:')) {
    // Backwards compatible with legacy plaintext entries
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;

    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = Buffer.from(parts[3], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Failed to decrypt text:', err);
    return null;
  }
}
