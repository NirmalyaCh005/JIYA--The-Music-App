import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit, saveOtpRecord } from '@/lib/auth/otpStore';
import { sendOtpEmail } from '@/lib/auth/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.email || body.phone || '').trim().toLowerCase();

    if (!identifier) {
      return NextResponse.json({ error: 'Email address or phone number is required' }, { status: 400 });
    }

    // 1. Rate Limiting Check (Max 3 requests per 10 minutes)
    const rateLimit = checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting again.`,
        },
        { status: 429 }
      );
    }

    // 2. Cryptographically secure 6-digit numeric OTP generation
    const plainOtp = crypto.randomInt(100000, 999999).toString();

    // 3. Hash the OTP with bcryptjs (salt rounds: 10)
    const otpHash = await bcrypt.hash(plainOtp, 10);

    // 4. Save record with 5-minute expiry & attempts: 0
    saveOtpRecord(identifier, otpHash, plainOtp);

    // 5. Send plain OTP via Nodemailer
    await sendOtpEmail(identifier, plainOtp);

    console.log(`[AUTH] OTP Generated for ${identifier}`);

    const isSmtpConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      identifier,
      ...(isSmtpConfigured ? {} : { otpDemo: plainOtp }),
    });
  } catch (error) {
    console.error('[AUTH API ERROR] send-otp:', error);
    return NextResponse.json({ error: 'Failed to process OTP request' }, { status: 500 });
  }
}
