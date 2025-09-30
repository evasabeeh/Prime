export interface User {
  id: number;
  email: string;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface OTPVerification {
  id: number;
  user_id: number;
  otp_hash: string;
  expires_at: string;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
