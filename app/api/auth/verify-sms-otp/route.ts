import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOtpRecord, deleteOtpRecord, incrementAttempts } from '@/lib/auth/otpStore';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let phoneNumber = (body.phoneNumber || body.phone || '').trim();
    const submittedOtp = (body.otp || '').trim();
    const customName = (body.name || '').trim();

    if (!phoneNumber || !submittedOtp) {
      return NextResponse.json({ error: 'Phone number and OTP code are required' }, { status: 400 });
    }

    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }

    // 1. Fetch Stored OTP Record
    const record = getOtpRecord(phoneNumber);

    if (!record) {
      return NextResponse.json(
        { error: 'No active SMS verification code found for this phone number. Please request a new code.' },
        { status: 400 }
      );
    }

    // 2. Check Expiration Timestamp (5 minutes)
    if (Date.now() > record.expiresAt) {
      deleteOtpRecord(phoneNumber);
      return NextResponse.json(
        { error: 'SMS verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // 3. Check Failed Attempt Limit (Max 3 failed attempts)
    if (record.attempts >= 3) {
      deleteOtpRecord(phoneNumber);
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded (3/3). This OTP has been invalidated.' },
        { status: 429 }
      );
    }

    // 4. Compare Submitted OTP with Stored bcrypt otpHash or direct demo match
    const isDirectDemoMatch = record.plainOtpForDemo && record.plainOtpForDemo === submittedOtp;
    const isBcryptMatch = await bcrypt.compare(submittedOtp, record.otpHash);
    const isMatch = Boolean(isDirectDemoMatch || isBcryptMatch);

    if (!isMatch) {
      const currentAttempts = incrementAttempts(phoneNumber);
      const remainingAttempts = 3 - currentAttempts;

      if (currentAttempts >= 3) {
        deleteOtpRecord(phoneNumber);
        return NextResponse.json(
          { error: 'Maximum verification attempts exceeded. OTP invalidated.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid SMS verification code. ${remainingAttempts} ${
            remainingAttempts === 1 ? 'attempt' : 'attempts'
          } remaining.`,
        },
        { status: 400 }
      );
    }

    // 5. On Valid OTP: Delete Record Immediately (Replay Attack Prevention)
    deleteOtpRecord(phoneNumber);

    const displayName = customName || `User ${phoneNumber.slice(-4)}`;

    // 6. Save or Update User Record in Database with custom Username
    let dbUser = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { phone: phoneNumber },
        update: { name: displayName, updatedAt: new Date() },
        create: {
          phone: phoneNumber,
          name: displayName,
          email: `user${phoneNumber.slice(-4)}@jiya.music`,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          isPro: true,
        },
      });
    } catch (dbErr) {
      console.error('[DATABASE UPSERT NOTICE]', dbErr);
    }

    // 7. Generate signed JWT session token containing { phoneNumber, userId, name }
    const jwtSecret = process.env.JWT_SECRET || 'jiya_super_secret_jwt_key_2026_production';
    const token = jwt.sign(
      {
        userId: dbUser?.id,
        phoneNumber,
        name: displayName,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: dbUser?.id,
      name: displayName,
      phone: phoneNumber,
      email: dbUser?.email || `user${phoneNumber.slice(-4)}@jiya.music`,
      avatarUrl: dbUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isPro: true,
    };

    return NextResponse.json({
      success: true,
      token,
      user: userProfile,
      message: 'Phone number verified successfully',
    });
  } catch (error) {
    console.error('[SMS AUTH API ERROR] verify-sms-otp:', error);
    return NextResponse.json({ error: 'Failed to verify SMS OTP' }, { status: 500 });
  }
}
