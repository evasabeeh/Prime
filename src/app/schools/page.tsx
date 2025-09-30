'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { School } from '@/types/school';
import { showToast } from '@/lib/toast';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async (showLoadingToast = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (showLoadingToast) {
        showToast.loading('Loading schools...');
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/api/schools`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Schools API endpoint not found');
        } else if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else if (response.status >= 400) {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        if (!Array.isArray(result.data)) {
          throw new Error('Invalid data format received from server');
        }
        setSchools(result.data);
        setError(null);
        setRetryCount(0);
        
        if (showLoadingToast) {
          showToast.success(`Loaded ${result.data.length} schools successfully!`);
        }
      } else {
        const errorMessage = result.error || result.message || 'Failed to fetch schools';
        setError(errorMessage);
        showToast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      showToast.error(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolId: number) => {

    if (!schoolId || schoolId <= 0) {
      showToast.error('Invalid school ID');
      return;
    }

    if (!user) {
      showToast.error('You must be logged in to delete schools');
      router.push('/login');
      return;
    }

    const schoolToDelete = schools.find(school => school.id === schoolId);
    if (!schoolToDelete) {
      showToast.error('School not found');
      return;
    }

    if (schoolToDelete.created_by_email !== user.email) {
      showToast.error('You can only delete schools you created');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${schoolToDelete.name}"?\n\nThis action cannot be undone and will permanently remove all school data.`)) {
      return;
    }

    try {
      setDeleteLoading(schoolId);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for delete

      const response = await fetch(`${API_BASE_URL}/api/schools/${schoolId}`, {
        method: 'DELETE',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You are not authorized to delete this school');
        } else if (response.status === 404) {
          throw new Error('School not found or already deleted');
        } else if (response.status === 403) {
          throw new Error('You can only delete schools you created');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error(`Delete failed with status ${response.status}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        setSchools(prevSchools => prevSchools.filter(school => school.id !== schoolId));
        showToast.success(`"${schoolToDelete.name}" deleted successfully!`);
      } else {
        const errorMessage = result.error || result.message || 'Failed to delete school';
        showToast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      
      let errorMessage = 'An unexpected error occurred while deleting the school';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Delete operation timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast.error(errorMessage);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditSchool = (schoolId: number) => {
    // Input validation
    if (!schoolId || schoolId <= 0) {
      showToast.error('Invalid school ID');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      showToast.error('You must be logged in to edit schools');
      router.push('/login');
      return;
    }

    // Find the school to validate ownership
    const schoolToEdit = schools.find(school => school.id === schoolId);
    if (!schoolToEdit) {
      showToast.error('School not found');
      return;
    }

    // Check ownership
    if (schoolToEdit.created_by_email !== user.email) {
      showToast.error('You can only edit schools you created');
      return;
    }

    try {
      router.push(`/edit-school/${schoolId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      showToast.error('Failed to navigate to edit page');
    }
  };

  // Validate and sanitize search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent XSS by limiting length and sanitizing input
    if (value.length > 100) {
      showToast.error('Search query too long. Maximum 100 characters allowed.');
      return;
    }

    // Basic sanitization - remove potentially harmful characters
    const sanitizedValue = value.replace(/[<>'"]/g, '');
    setSearchQuery(sanitizedValue);
  };

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) {
      return schools;
    }

    try {
      const query = searchQuery.toLowerCase().trim();
      
      // Additional validation
      if (query.length < 1) {
        return schools;
      }

      return schools.filter((school) => {
        try {
          return (
            school.name?.toLowerCase().includes(query) ||
            school.address?.toLowerCase().includes(query) ||
            school.city?.toLowerCase().includes(query) ||
            school.state?.toLowerCase().includes(query) ||
            school.email_id?.toLowerCase().includes(query) ||
            school.contact?.toString().includes(query) ||
            (school.created_by_email && school.created_by_email.toLowerCase().includes(query))
          );
        } catch (error) {
          console.error('Error filtering school:', school, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error during filtering:', error);
      showToast.error('Search error occurred');
      return schools;
    }
  }, [schools, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-light flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                showToast.promise(
                  fetchSchools(),
                  {
                    loading: 'Retrying to load schools...',
                    success: 'Schools loaded successfully! ??',
                    error: 'Failed to load schools',
                  }
                );
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-light">
      <Navigation />
      <div className="py-8">
        <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Schools Directory</h1>
            <p className="text-gray-600">Discover and explore schools in your area</p>
          </div>
          {user && (
            <Link
              href="/add-school"
              className="mt-4 md:mt-0 btn-primary flex items-center gap-2 py-3 px-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New School
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search schools by name, location, email, contact, or creator..."
              value={searchQuery}
              onChange={handleSearchChange}
              maxLength={100}
              className="w-full pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {schools.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Schools Found</h3>
              {user ? (
                <>
                  <p className="text-gray-500 mb-6">Be the first to add a school to the directory!</p>
                  <Link
                    href="/add-school"
                    className="btn-primary inline-flex items-center gap-2 py-3 px-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add First School
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-6">Sign up to add schools to the directory!</p>
                  <Link
                    href="/signup"
                    className="btn-primary inline-flex items-center gap-2 py-3 px-6"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Schools Match Your Search</h3>
              <p className="text-gray-500 mb-6">
                No schools found for &quot;{searchQuery}&quot;. Try adjusting your search terms.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn-primary inline-flex items-center gap-2 py-3 px-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="card-primary rounded-xl overflow-hidden group"
              >

                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {school.image ? (
                    <Image
                      src={school.image}
                      alt={school.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary-dark">
                      <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {school.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-gray-600 line-clamp-2">{school.address}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm text-gray-600">{school.city}, {school.state}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{school.contact}</span>
                      </div>
                      
                      <a
                        href={`mailto:${school.email_id}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact
                      </a>
                    </div>
                    
                    {school.created_by_email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs text-gray-500">Added by {school.created_by_email}</span>
                      </div>
                    )}
                  </div>

                  {user && user.email === school.created_by_email && (
                    <div className="mt-3 pt-3 flex gap-1 border-t border-gray-100">
                      <button
                        onClick={() => handleEditSchool(school.id!)}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSchool(school.id!)}
                        disabled={deleteLoading === school.id}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        title="Delete"
                      >
                        {deleteLoading === school.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
