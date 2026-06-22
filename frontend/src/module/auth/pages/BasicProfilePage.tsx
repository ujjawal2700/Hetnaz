import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import type { BasicProfileData } from '../types/auth.types';

export const BasicProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BasicProfileData>(() => {
    const saved = sessionStorage.getItem('onboarding_basic_profile');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      dateOfBirth: '',
      gender: 'male',
      location: '',
    };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BasicProfileData, string>>>({});

  useEffect(() => {
    // Check if signup data exists
    const signupData = sessionStorage.getItem('onboarding_signup');
    if (!signupData) {
      navigate('/signup');
    }
  }, [navigate]);

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BasicProfileData, string>> = {};

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Store basic profile data
      sessionStorage.setItem('onboarding_basic_profile', JSON.stringify(formData));
      navigate('/onboarding/interests');
    }
  };

  const handleBack = () => {
    sessionStorage.setItem('onboarding_basic_profile', JSON.stringify(formData));
    navigate('/signup');
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
            <span className="text-sm font-medium text-gray-700">Step 2 of 3</span>
            <span className="text-sm text-gray-500">Basic Profile</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-pink-500 h-2 rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tell Us About Yourself</h2>
          <p className="text-gray-600">Help us understand you better</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }));
                  if (errors.dateOfBirth) {
                    setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                  }
                }}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender
              </label>
              <div className="space-y-2">
                {(['male', 'female', 'prefer-not-to-say'] as const).map((gender) => (
                  <label
                    key={gender}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${formData.gender === gender
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-300 hover:border-pink-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, gender: e.target.value as BasicProfileData['gender'] }));
                        if (errors.gender) {
                          setErrors((prev) => ({ ...prev, gender: undefined }));
                        }
                      }}
                      className="mr-3 w-4 h-4 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-gray-700 capitalize">
                      {gender === 'prefer-not-to-say' ? 'Prefer not to say' : gender}
                    </span>
                  </label>
                ))}
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, location: e.target.value }));
                  if (errors.location) {
                    setErrors((prev) => ({ ...prev, location: undefined }));
                  }
                }}
                placeholder="City, Area"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Google Maps location selection coming soon.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

