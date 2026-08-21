import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOtpRecord, deleteOtpRecord, incrementAttempts } from '@/lib/auth/otpStore';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.email || body.phone || '').trim().toLowerCase();
    const submittedOtp = (body.otp || '').trim();
    const customName = (body.name || '').trim();

    if (!identifier || !submittedOtp) {
      return NextResponse.json({ error: 'Email/identifier and OTP code are required' }, { status: 400 });
    }

    // 1. Fetch OTP Record
    const record = getOtpRecord(identifier);

    if (!record) {
      return NextResponse.json(
        { error: 'No active OTP verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // 2. Check Expiration Timestamp (5 minutes)
    if (Date.now() > record.expiresAt) {
      deleteOtpRecord(identifier);
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // 3. Check Attempt Limit (Max 3 failed attempts)
    if (record.attempts >= 3) {
      deleteOtpRecord(identifier);
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded (3/3). This OTP has been invalidated for security.' },
        { status: 429 }
      );
    }

    // 4. Compare submitted OTP with stored bcrypt otpHash or direct demo match
    const isDirectDemoMatch = record.plainOtpForDemo && record.plainOtpForDemo === submittedOtp;
    const isBcryptMatch = await bcrypt.compare(submittedOtp, record.otpHash);
    const isMatch = Boolean(isDirectDemoMatch || isBcryptMatch);

    if (!isMatch) {
      const currentAttempts = incrementAttempts(identifier);
      const remainingAttempts = 3 - currentAttempts;

      if (currentAttempts >= 3) {
        deleteOtpRecord(identifier);
        return NextResponse.json(
          { error: 'Maximum verification attempts exceeded. OTP invalidated.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid OTP code. ${remainingAttempts} ${
            remainingAttempts === 1 ? 'attempt' : 'attempts'
          } remaining before lockout.`,
        },
        { status: 400 }
      );
    }

    // 5. On Success: Delete OTP record immediately to prevent replay attacks
    deleteOtpRecord(identifier);

    const displayName = customName || (identifier.includes('@') ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`);

    // 6. Save or Update User Record in Database
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { email: identifier },
        update: { name: displayName, updatedAt: new Date() },
        create: {
          email: identifier,
          name: displayName,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          isPro: true,
        },
      });
    } catch (dbErr) {
      console.error('[DATABASE UPSERT NOTICE]', dbErr);
    }

    // 7. Generate signed JWT token (expires in 7 days)
    const jwtSecret = process.env.JWT_SECRET || 'jiya_super_secret_jwt_key_2026_production';
    const token = jwt.sign(
      {
        userId: dbUser?.id,
        email: identifier,
        name: displayName,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: dbUser?.id,
      name: displayName,
      email: identifier,
      avatarUrl: dbUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isPro: true,
    };

    return NextResponse.json({
      success: true,
      token,
      user: userProfile,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('[AUTH API ERROR] verify-otp:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
