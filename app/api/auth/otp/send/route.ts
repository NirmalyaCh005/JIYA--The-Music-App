import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory OTP store for verification
const otpStore = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const fullPhone = `${countryCode || '+91'}${phone.replace(/\D/g, '')}`;
    
    // Generate 6-digit random OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(fullPhone, generatedOtp);

    console.log(`[AUTH API] OTP generated for ${fullPhone}: ${generatedOtp}`);

    return NextResponse.json({
      success: true,
      phone: fullPhone,
      otpDemo: generatedOtp, // Sent back for easy demo testing
      message: `OTP sent successfully to ${fullPhone}`,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
