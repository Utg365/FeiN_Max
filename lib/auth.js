import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.FEIN_JWT_SECRET || "fein_trade_super_secret_key_change_me_in_prod_2024";
const JWT_EXPIRY_HOURS = 72; // 3 days

/**
 * Hash password using PBKDF2-HMAC-SHA256, matching Python's backend output.
 * Base64(16-byte random salt + 32-byte derived key)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.pbkdf2Sync(password, salt, 260000, 32, 'sha256');
  const combined = Buffer.concat([salt, dk]);
  return combined.toString('base64');
}

/**
 * Verify password against stored hash by reproducing the PBKDF2 derivation.
 */
export function verifyPassword(storedHash, candidate) {
  try {
    const raw = Buffer.from(storedHash, 'base64');
    if (raw.length !== 48) {
      return false; // 16 bytes salt + 32 bytes key length mismatch
    }
    const salt = raw.subarray(0, 16);
    const dk = raw.subarray(16);
    const candidateDk = crypto.pbkdf2Sync(candidate, salt, 260000, 32, 'sha256');
    return crypto.timingSafeEqual(dk, candidateDk);
  } catch (err) {
    return false;
  }
}

/**
 * Generate a JWT token containing user id and username.
 */
export function createToken(userId, username) {
  return jwt.sign(
    { sub: userId, usr: username },
    JWT_SECRET,
    { expiresIn: `${JWT_EXPIRY_HOURS}h` }
  );
}

/**
 * Decode and verify JWT token. Returns payload or null if invalid.
 */
export function decodeToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Get user authentication info from Next.js request headers.
 */
export function getAuthUser(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return decodeToken(token);
}
