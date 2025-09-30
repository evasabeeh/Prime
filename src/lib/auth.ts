import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import nodemailer from 'nodemailer';
import { User } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashOTP(otp: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export async function generateToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  return await new SignJWT({ 
    userId: user.id, 
    email: user.email,
    isVerified: user.is_verified 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string; isVerified: boolean }> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number; email: string; isVerified: boolean };
  } catch {
    throw new Error('Invalid token');
  }
}

const createTransporter = () => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email sending will be simulated.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`\nOTP for ${email}: ${otp}\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"School Management System" <${SMTP_USER}>`,
      to: email,
      subject: 'Your OTP for School Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your OTP Code</h2>
          <p>Hello,</p>
          <p>Your One-Time Password (OTP) for the School Management System is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">School Management System</p>
        </div>
      `,
    });

    console.log('OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export function isOTPExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}
