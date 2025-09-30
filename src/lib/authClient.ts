import { User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL}/api/auth`;

export async function signup(email: string, password: string) {
  const response = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return { success: response.ok, ...data };
}

export async function verifyOTP(email: string, otp: string) {
  const response = await fetch(`${API_BASE}/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();
  return { success: response.ok, ...data };
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return { success: response.ok, ...data };
}

export async function logout() {
  const response = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
  });

  const data = await response.json();
  return { success: response.ok, ...data };
}

export async function getCurrentUser(): Promise<{ success: boolean; user?: User; message?: string }> {
  const response = await fetch(`${API_BASE}/me`);
  const data = await response.json();
  return { success: response.ok, ...data };
}
