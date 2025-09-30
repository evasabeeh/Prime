'use client';

import Link from "next/link";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-light via-secondary to-secondary-dark">
      <Navigation />

      <section className="flex flex-col justify-center items-center min-h-screen px-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Welcome to <span className="text-primary">SchoolConnect</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {user 
              ? `Welcome back, ${user.email}! Discover schools in your area and add new institutions to build a connected educational community.`
              : 'Your comprehensive school management system. Sign up to add schools and build a connected educational community.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/schools"
              className="btn-primary flex items-center gap-2 min-w-[200px] justify-center py-4 px-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Explore Schools
            </Link>
            
            {user ? (
              <Link
                href="/add-school"
                className="btn-secondary flex items-center gap-2 min-w-[200px] justify-center py-4 px-8"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New School
              </Link>
            ) : (
              <Link
                href="/signup"
                className="btn-secondary flex items-center gap-2 min-w-[200px] justify-center py-4 px-8"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
