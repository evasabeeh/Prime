import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyTokenEdge(token: string): Promise<{ userId: number; email: string; isVerified: boolean }> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number; email: string; isVerified: boolean };
  } catch {
    throw new Error('Invalid token');
  }
}
