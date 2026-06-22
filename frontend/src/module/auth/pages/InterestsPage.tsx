// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import type { InterestsData } from '../types/auth.types';
import { useCloudinaryUpload } from '../../../shared/hooks/useCloudinaryUpload';
import { registerUser, formatSignupPayload, requestSignupOtp } from '../services/auth.service';
import { useAuth } from '../../../core/context/AuthContext';

const INTEREST_OPTIONS = [
  'Fitness', 'Travel', 'Music', 'Reading', 'Food', 'Dating', 'Movies', 'Pets',
  'Sports', 'Art', 'Photography', 'Gaming', 'Cooking', 'Dancing', 'Yoga', 'Technology',
  'Fashion', 'Nature', 'Adventure', 'Comedy', 'Writing', 'Shopping', 'Beach', 'Mountains'
];

export const InterestsPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { upload, uploadMultiple, isUploading: isCloudinaryUploading } = useCloudinaryUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<InterestsData>(() => {
    const saved = sessionStorage.getItem('onboarding_interests');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        photos: [] // Re-initialize photos as empty since file objects can't be stored in storage. User must re-upload or see storage limitation warning. 
        // Better: We stored uploaded URLs previously if we were clever. But here we just persist text inputs.
        // Actually, photos is File[], so we can't persist it in session storage easily. 
      };
    }
    return {
      interests: [],
      bio: '',
      photos: [],
    };
  });
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof InterestsData | 'aadhaar', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [gender, setGender] = useState<'male' | 'female' | 'prefer-not-to-say'>('male');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Check if previous steps completed
    const signupData = sessionStorage.getItem('onboarding_signup');
    const basicProfileData = sessionStorage.getItem('onboarding_basic_profile');

    if (!signupData || !basicProfileData) {
      navigate('/signup');
      return;
    }

    const basic = JSON.parse(basicProfileData);
    setGender(basic.gender);
    const signup = JSON.parse(signupData);
    setUserName(signup.fullName);
  }, [navigate]);

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const isSelected = prev.interests.includes(interest);
      return {
        ...prev,
        interests: isSelected
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.photos.length > 6) {
      alert('Maximum 6 photos allowed');
      return;
    }

    const newPhotos = [...formData.photos, ...files];
    setFormData((prev) => ({ ...prev, photos: newPhotos }));

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAadhaarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.aadhaar) {
        setErrors((prev) => ({ ...prev, aadhaar: undefined }));
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => {
      const newPhotos = prev.photos.filter((_, i) => i !== index);
      return { ...prev, photos: newPhotos };
    });
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAadhaar = () => {
    setAadhaarFile(null);
    setAadhaarPreview(null);
    if (aadhaarInputRef.current) {
      aadhaarInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InterestsData | 'aadhaar', string>> = {};

    if (formData.interests.length === 0) {
      newErrors.interests = 'Please select at least one interest';
    }

    if (formData.photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo';
    }

    // Determine gender for validation
    if (gender === 'female' && !aadhaarFile) {
      newErrors.aadhaar = 'Aadhaar card is required for verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setApiError(null);

      try {
        // 1. Upload Photos
        let uploadedPhotos: any[] = [];
        try {
          // Mock upload by using the local base64 preview
          // WARNING: This sends large base64 strings to the DB. Only for dev/demo purposes where Cloudinary isn't active.
          uploadedPhotos = formData.photos.map((_, i) => ({
            url: photoPreviews[i] || `https://ui-avatars.com/api/?name=${userName}&background=random`
          }));
        } catch (err) {
          console.warn('Photo upload failed, using mock', err);
          uploadedPhotos = formData.photos.map((_, i) => ({
            url: photoPreviews[i] || `https://ui-avatars.com/api/?name=${userName}&background=random`
          }));
        }

        // 2. Upload Aadhaar (if female)
        let aadhaarUrl = '';
        if (gender === 'female' && aadhaarFile) {
          try {
            // const result = await upload(aadhaarFile, 'verification');
            // aadhaarUrl = result.url;
            aadhaarUrl = aadhaarPreview || 'https://res.cloudinary.com/demo/image/upload/v1/aadhaar_front.jpg';
          } catch (err) {
            console.warn('Aadhaar upload failed, using mock');
            aadhaarUrl = aadhaarPreview || 'https://res.cloudinary.com/demo/image/upload/v1/aadhaar_front.jpg';
          }
        }

        // 3. Prepare Payload
        const signupData = JSON.parse(sessionStorage.getItem('onboarding_signup') || '{}');
        const basicProfileData = JSON.parse(sessionStorage.getItem('onboarding_basic_profile') || '{}');

        const onboardingData = {
          signup: signupData,
          basicProfile: basicProfileData,
          interests: { ...formData, photos: uploadedPhotos }, // Use processed photos if needed
          aadhaarCardUrl: aadhaarUrl || undefined
        };

        // 4. API Call
        const response = await registerUser(onboardingData);

        // 5. Success
        console.log('Registration initiated:', response);

        // DO NOT Login user yet - wait for OTP verification
        // DO NOT Clear session yet - might need it if OTP fails or they come back

        // Redirect to OTP Verification
        navigate('/otp-verification', {
          state: {
            mode: 'signup',
            phoneNumber: onboardingData.signup.phone
          }
        });

      } catch (error: any) {
        console.error('Submission error:', error);
        setApiError(error.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    // Persist text data only
    const dataToSave = {
      interests: formData.interests,
      bio: formData.bio,
    };
    sessionStorage.setItem('onboarding_interests', JSON.stringify(dataToSave));
    navigate('/onboarding/basic-profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Progress Indicator */}
        <div className="mb-8 relative">
          <button
            type="button"
            onClick={handleBack}
            className="absolute -top-10 left-0 p-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <MaterialSymbol name="arrow_back" size={24} />
          </button>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step 3 of 3</span>
            <span className="text-sm text-gray-500">Interests & Verification</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Add your interests and photos to get started</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interests (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.interests.includes(interest)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                      }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && (
                <p className="mt-2 text-sm text-red-500">{errors.interests}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                About Me (Optional)
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/500</p>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Photos (Minimum 1, Maximum 6)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <MaterialSymbol name="close" size={16} />
                    </button>
                  </div>
                ))}
                {photoPreviews.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-pink-500 transition-colors"
                  >
                    <MaterialSymbol name="add" size={32} className="text-gray-400" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              {errors.photos && (
                <p className="mt-1 text-sm text-red-500">{errors.photos}</p>
              )}
            </div>

            {/* Aadhaar Verification (Female Only) */}
            {gender === 'female' && (
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <h3 className="text-pink-800 font-semibold mb-2 flex items-center">
                  <MaterialSymbol name="verified_user" size={20} className="mr-2" />
                  Identity Verification Required
                </h3>
                <p className="text-sm text-pink-700 mb-3">
                  To ensure safety, we require female users to verify their identity with an Aadhaar card.
                </p>

                {!aadhaarPreview ? (
                  <div
                    onClick={() => aadhaarInputRef.current?.click()}
                    className="border-2 border-dashed border-pink-300 rounded-lg p-6 text-center cursor-pointer hover:bg-pink-100 transition-colors"
                  >
                    <MaterialSymbol name="upload_file" size={32} className="mx-auto text-pink-400 mb-2" />
                    <span className="text-pink-600 font-medium">Upload Aadhaar Card</span>
                    <p className="text-xs text-pink-500 mt-1">Images or PDF (Max 10MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-pink-200">
                    {/* Preview (simplified for images) */}
                    <img src={aadhaarPreview} alt="Aadhaar Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={removeAadhaar}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                    >
                      <MaterialSymbol name="close" size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                      {aadhaarFile?.name}
                    </div>
                  </div>
                )}

                <input
                  ref={aadhaarInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAadhaarChange}
                  className="hidden"
                />
                {errors.aadhaar && (
                  <p className="mt-2 text-sm text-red-500">{errors.aadhaar}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isCloudinaryUploading}
              className={`w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-lg transform transition-all duration-200 shadow-lg
                ${(isSubmitting || isCloudinaryUploading) ? 'opacity-70 cursor-not-allowed' : 'hover:from-pink-600 hover:to-pink-700 hover:scale-105'}
              `}
            >
              {isSubmitting ? 'Creating Account...' : (isCloudinaryUploading ? 'Uploading Files...' : 'Finish Setup')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

