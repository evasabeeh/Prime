'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SchoolFormData } from '@/types/school';
import { showToast } from '@/lib/toast';
import Navigation from '@/components/Navigation';

export default function AddSchoolPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SchoolFormData>();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        showToast.validationError('Please select a valid image file (JPEG, PNG, GIF)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast.validationError('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);

    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true);

    const loadingToast = showToast.loading('Adding school...');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('contact', data.contact);
      formData.append('email_id', data.email_id);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/schools`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showToast.dismiss(loadingToast);
        showToast.schoolAdded();
        
        reset();
        removeImage();
        
        setTimeout(() => {
          router.push('/schools');
        }, 1500);
      } else {
        showToast.dismiss(loadingToast);
        if (result.error) {
          showToast.validationError(result.error);
        } else {
          showToast.serverError();
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    
      showToast.dismiss(loadingToast);
      showToast.networkError();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-light to-secondary">
      <Navigation />
      <div className="py-8">
        <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Add New School</h1>
            <p className="text-gray-600">Fill in the details to add a new school to the database</p>
          </div>

          <div className="card-primary rounded-2xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-primary mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { 
                    required: 'School name is required',
                    minLength: { value: 3, message: 'School name must be at least 3 characters' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                  placeholder="Enter school name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-primary mb-2">
                  Address *
                </label>
                <textarea
                  id="address"
                  rows={3}
                  {...register('address', { 
                    required: 'Address is required',
                    minLength: { value: 10, message: 'Address must be at least 10 characters' }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 resize-none"
                  placeholder="Enter complete address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-primary mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('city', { 
                      required: 'City is required',
                      minLength: { value: 2, message: 'City name must be at least 2 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-primary mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...register('state', { 
                      required: 'State is required',
                      minLength: { value: 2, message: 'State name must be at least 2 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact" className="block text-sm font-semibold text-primary mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contact"
                    {...register('contact', { 
                      required: 'Contact number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit Indian mobile number'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="Enter 10-digit number"
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email_id" className="block text-sm font-semibold text-primary mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email_id"
                    {...register('email_id', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                    placeholder="Enter email address"
                  />
                  {errors.email_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.email_id.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-2">
                  School Image (Optional)
                </label>
                
                {imagePreview ? (
                  <div className="border-2 border-primary rounded-lg p-4 bg-secondary-light/30">
                    <div className="relative">
                      <Image 
                        src={imagePreview} 
                        alt="School preview" 
                        width={800}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                        unoptimized={true}
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('image')?.click()}
                          className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition duration-200 shadow-lg"
                          title="Change image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-200 shadow-lg"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm text-primary font-medium">{selectedImage?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedImage && (selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="image" className="cursor-pointer block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition duration-200">
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-sm text-gray-600">Click to upload school image</p>
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF up to 5MB</p>
                      </div>
                    </div>
                  </label>
                )}
                
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:bg-primary/50 py-3 px-6 flex items-center justify-center"
                >
                  Add school
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/schools')}
                  className="btn-secondary px-6 py-3"
                >
                  View Schools
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
