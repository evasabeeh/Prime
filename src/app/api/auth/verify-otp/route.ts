import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyOTP, generateToken, isOTPExpired } from '@/lib/auth';
import { VerifyOTPRequest } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: VerifyOTPRequest = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({
        success: false,
        message: 'Email and OTP are required'
      }, { status: 400 });
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return NextResponse.json({
        success: false,
        message: 'OTP must be a 6-digit number'
      }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          u.id, u.email, u.is_verified,
          o.otp_hash, o.expires_at
        FROM app_users u
        JOIN otp_verifications o ON u.id = o.user_id
        WHERE u.email = $1
        ORDER BY o.created_at DESC
        LIMIT 1
      `, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or OTP not found. Please request a new OTP.'
        }, { status: 400 });
      }

      const user = result.rows[0];

      if (isOTPExpired(user.expires_at)) {

        await client.query(
          'DELETE FROM otp_verifications WHERE user_id = $1',
          [user.id]
        );

        return NextResponse.json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        }, { status: 400 });
      }

      const isValidOTP = await verifyOTP(otp, user.otp_hash);
      
      if (!isValidOTP) {
        return NextResponse.json({
          success: false,
          message: 'Invalid OTP. Please try again.'
        }, { status: 400 });
      }

      await client.query(
        'UPDATE app_users SET is_verified = $1, last_login = CURRENT_TIMESTAMP WHERE id = $2',
        [true, user.id]
      );

      await client.query(
        'DELETE FROM otp_verifications WHERE user_id = $1',
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
        message: 'Email verified successfully!',
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
    console.error('Verify OTP error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error. Please try again.'
    }, { status: 500 });
  }
}
