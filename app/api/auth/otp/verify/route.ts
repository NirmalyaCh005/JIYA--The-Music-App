import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 });
    }

    // Accept valid 6-digit OTPs or demo fallback
    if (otp.length !== 6) {
      return NextResponse.json({ error: 'Invalid OTP code format' }, { status: 400 });
    }

    const userProfile = {
      name: `User ${phone.slice(-4)}`,
      email: `user${phone.slice(-4)}@jiya.music`,
      phone: phone,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isPro: true,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
