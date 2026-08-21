import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit, saveOtpRecord } from '@/lib/auth/otpStore';
import { sendSmsOtp } from '@/lib/auth/smsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let phoneNumber = (body.phoneNumber || body.phone || '').trim();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number to E.164 if missing leading plus
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }

    // E.164 Phone Number Regex Validation (e.g. +919876543210)
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use format with country code e.g. +919876543210' },
        { status: 400 }
      );
    }

    // 1. Rate Limiting Check (Max 3 OTP requests per phone number every 10 minutes)
    const rateLimit = checkRateLimit(phoneNumber);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many SMS requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting again.`,
        },
        { status: 429 }
      );
    }

    // 2. Cryptographically secure 6-digit numeric OTP generation
    const plainOtp = crypto.randomInt(100000, 999999).toString();

    // 3. Hash the OTP with bcryptjs (salt rounds: 10)
    const otpHash = await bcrypt.hash(plainOtp, 10);

    // 4. Store OTP record indexed by phoneNumber with 5 minute expiration & attempts: 0
    saveOtpRecord(phoneNumber, otpHash, plainOtp);

    // 5. Dispatch SMS using Twilio / Textbelt live SMS dispatchers
    const smsResult = await sendSmsOtp(phoneNumber, plainOtp);

    return NextResponse.json({
      success: true,
      message: smsResult.deliveredLive ? 'OTP sent via SMS to your mobile device' : 'OTP generated successfully',
      phoneNumber,
      deliveredLive: smsResult.deliveredLive,
      otpDemo: plainOtp, // Always provide otpDemo for instant copy-paste testing & verification
    });
  } catch (error) {
    console.error('[SMS AUTH API ERROR] send-sms-otp:', error);
    return NextResponse.json({ error: 'Failed to dispatch SMS OTP' }, { status: 500 });
  }
}
