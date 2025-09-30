import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    const client = await pool.connect();
    
    try {

      const result = await client.query(
        'SELECT id, email, is_verified, created_at, last_login FROM app_users WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }

      const user = result.rows[0];

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      success: false,
      message: 'Invalid token'
    }, { status: 401 });
  }
}
