import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('jiya_auth_token')?.value;

    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No authentication token provided' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'jiya_super_secret_jwt_key_2026_production';
    const decoded = jwt.verify(token, jwtSecret) as { email: string; name: string };

    return NextResponse.json({
      success: true,
      user: {
        name: decoded.name || decoded.email.split('@')[0],
        email: decoded.email,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isPro: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 });
  }
}
