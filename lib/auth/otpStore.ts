export interface OtpRecord {
  otpHash: string;
  expiresAt: number;
  attempts: number;
  plainOtpForDemo?: string;
}

interface RateLimitRecord {
  timestamps: number[];
}

// Attach stores to globalThis to persist across Next.js API route re-evaluations
const globalForOtp = globalThis as unknown as {
  otpMap: Map<string, OtpRecord>;
  rateLimitMap: Map<string, RateLimitRecord>;
};

export const otpMap = globalForOtp.otpMap || new Map<string, OtpRecord>();
export const rateLimitMap = globalForOtp.rateLimitMap || new Map<string, RateLimitRecord>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpMap = otpMap;
  globalForOtp.rateLimitMap = rateLimitMap;
}

/**
 * Check if the email/identifier has exceeded rate limit (max 3 requests in 10 minutes)
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const normalizedKey = identifier.trim().toLowerCase().replace(/\s+/g, '');
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  const record = rateLimitMap.get(normalizedKey) || { timestamps: [] };
  const recentTimestamps = record.timestamps.filter((ts) => now - ts < TEN_MINUTES);

  if (recentTimestamps.length >= 3) {
    const oldest = recentTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + TEN_MINUTES - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  recentTimestamps.push(now);
  rateLimitMap.set(normalizedKey, { timestamps: recentTimestamps });
  return { allowed: true };
}

/**
 * Save hashed OTP record with 5 minute expiration
 */
export function saveOtpRecord(identifier: string, otpHash: string, plainOtpForDemo?: string): void {
  const normalizedKey = identifier.trim().toLowerCase().replace(/\s+/g, '');
  const FIVE_MINUTES = 5 * 60 * 1000;
  otpMap.set(normalizedKey, {
    otpHash,
    expiresAt: Date.now() + FIVE_MINUTES,
    attempts: 0,
    plainOtpForDemo,
  });
}

/**
 * Retrieve OTP record with key normalization
 */
export function getOtpRecord(identifier: string): OtpRecord | undefined {
  const normalizedKey = identifier.trim().toLowerCase().replace(/\s+/g, '');
  return otpMap.get(normalizedKey);
}

/**
 * Delete OTP record (for replay protection / expiration cleanup)
 */
export function deleteOtpRecord(identifier: string): void {
  const normalizedKey = identifier.trim().toLowerCase().replace(/\s+/g, '');
  otpMap.delete(normalizedKey);
}

/**
 * Increment failed attempt count for an OTP record
 */
export function incrementAttempts(identifier: string): number {
  const normalizedKey = identifier.trim().toLowerCase().replace(/\s+/g, '');
  const record = otpMap.get(normalizedKey);
  if (!record) return 0;

  record.attempts += 1;
  otpMap.set(normalizedKey, record);
  return record.attempts;
}
