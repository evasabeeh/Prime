import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { generateOTP, hashOTP, hashPassword, sendOTPEmail } from '@/lib/auth';
import { SignupRequest } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { email, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {

      const existingUser = await client.query(
        'SELECT id, email, is_verified FROM app_users WHERE email = $1',
        [email.toLowerCase()]
      );

      let userId: number;

      if (existingUser.rows.length > 0) {

        if (existingUser.rows[0].is_verified) {
          return NextResponse.json({
            success: false,
            message: 'User already exists and is verified. Please login instead.'
          }, { status: 400 });
        }
        userId = existingUser.rows[0].id;
      } else {

        const passwordHash = await hashPassword(password);
        
        const newUser = await client.query(
          'INSERT INTO app_users (email, password_hash, is_verified) VALUES ($1, $2, $3) RETURNING id',
          [email.toLowerCase(), passwordHash, false]
        );
        userId = newUser.rows[0].id;
      }

      const otp = generateOTP();
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await client.query(
        'DELETE FROM otp_verifications WHERE user_id = $1',
        [userId]
      );

      await client.query(
        'INSERT INTO otp_verifications (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)',
        [userId, otpHash, expiresAt]
      );

      const emailSent = await sendOTPEmail(email, otp);
      
      if (!emailSent) {
        return NextResponse.json({
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email address. Please check your inbox.'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}
