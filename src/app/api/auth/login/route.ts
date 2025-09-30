import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyPassword, generateToken } from '@/lib/auth';
import { LoginRequest } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, email, password_hash, is_verified FROM app_users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or password'
        }, { status: 401 });
      }

      const user = result.rows[0];

      if (!user.is_verified) {
        return NextResponse.json({
          success: false,
          message: 'Please verify your email address first'
        }, { status: 401 });
      }

      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or password'
        }, { status: 401 });
      }

      await client.query(
        'UPDATE app_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const userForToken = {
        id: user.id,
        email: user.email,
        is_verified: true,
        created_at: '',
        updated_at: ''
      };

      const token = await generateToken(userForToken);

      const response = NextResponse.json({
        success: true,
        message: 'Login successful!',
        user: {
          id: user.id,
          email: user.email,
          is_verified: true
        }
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60
      });

      return response;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}

