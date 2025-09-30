'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOTP } from '@/lib/authClient';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function VerifyOTPContent() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [type, setType] = useState('signup');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const typeParam = searchParams.get('type');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (typeParam) {
      setType(typeParam);
    }
    
    if (!emailParam) {
      router.push('/signup');
    }
  }, [searchParams, router]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error('OTP must be a 6-digit number');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otp);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the auth context to get the updated user state
        await refreshUser();
        router.push('/schools');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {

      toast.error('Please try signing up again to get a new OTP');
      router.push('/signup');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;ve sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  className="appearance-none relative block w-full px-3 py-4 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-center text-2xl tracking-widest font-bold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push(type === 'login' ? '/login' : '/signup')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ? Back
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-primary hover:text-primary-dark disabled:opacity-50 transition-colors duration-200"
              >
                Resend OTP
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Didn&apos;t receive the code? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
