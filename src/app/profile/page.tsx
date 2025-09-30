'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary-light">
      <Navigation />
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-24 h-24 bg-primary text-white rounded-full mx-auto mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-primary mb-2">My Profile</h1>
            </div>

            <div className="card-primary rounded-2xl p-8">
              <div className="space-y-6">
                
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Information</h2>
                  
                  <div className="grid grid-cols-1 gap-6">

                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">
                        Email Address
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}