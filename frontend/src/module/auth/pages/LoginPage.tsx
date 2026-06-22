import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useTranslation } from '../../../core/hooks/useTranslation';
import { normalizePhoneNumber } from '../../../core/utils/phoneNumber';
import { loginWithOtp } from '../services/auth.service';
import { useAuth } from '../../../core/context/AuthContext';

import { ArtisticBackground, ActivityCounter } from '../../../shared/components/auth/AuthLayoutComponents';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState<{ phone: string }>({
    phone: '',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname ||
        (user.role === 'female' ? '/female/dashboard' :
          user.role === 'admin' ? '/admin/dashboard' : '/male/dashboard');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { phone?: string } = {};

    if (!formData.phone?.trim()) {
      newErrors.phone = t('Phone number is required');
    } else {
      try {
        normalizePhoneNumber(formData.phone);
      } catch (error: any) {
        newErrors.phone = t('Please enter a valid phone number');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      setApiError(null);
      try {
        const normalizedPhone = normalizePhoneNumber(formData.phone);
        await loginWithOtp(normalizedPhone);
        navigate('/otp-verification', {
          state: {
            mode: 'login',
            phoneNumber: normalizedPhone,
            from: (location.state as any)?.from
          }
        });
      } catch (err: any) {
        const rawError = err.message || '';
        const userFriendlyError = getUserFriendlyLoginError(rawError, t);
        setApiError(userFriendlyError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    setFormData({ phone: cleaned });
    if (errors.phone) setErrors({});
    if (apiError) setApiError(null);
  };

  const getUserFriendlyLoginError = (errorMessage: string, t: (key: string) => string): string => {
    const lowerError = errorMessage.toLowerCase();
    if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('fetch')) return t('loginErrorNetwork');
    if (lowerError.includes('not found') || lowerError.includes('not registered')) return t('loginErrorNotFound');
    if (lowerError.includes('too many') || lowerError.includes('rate')) return t('loginErrorTooManyAttempts');
    return t('loginErrorGeneric');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-x-hidden">
      <ArtisticBackground />

      <div className="max-w-md w-full z-20 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center w-full">
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full scale-150 animate-pulse-soft" />
            <img 
              src="/Hetnaz.png" 
              alt="HETNAZ Logo" 
              className="w-32 h-32 object-contain relative z-10" 
            />
          </div>
          
          <ActivityCounter />
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 w-full border-t border-white/60">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('Welcome Back')}</h2>
            <p className="text-gray-500 font-medium text-sm">{t('Login to continue your journey')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone Input */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-xs font-black text-pink-600 uppercase tracking-widest ml-1">
                {t('Phone Number')}
              </label>
              <div className="relative group">
                <div className={`flex items-center glass-input rounded-2xl overflow-hidden transition-all duration-300 ${errors.phone ? 'ring-2 ring-red-400 border-transparent' : 'focus-within:ring-2 focus-within:ring-pink-500'}`}>
                  <div className="flex items-center shrink-0 gap-1.5 pl-3 pr-2 py-3 sm:pl-4 sm:pr-3 sm:py-4 bg-white/20 border-r border-white/40">
                    <img
                      src="https://flagcdn.com/w40/in.png"
                      srcSet="https://flagcdn.com/w80/in.png 2x"
                      width="20"
                      className="rounded-sm shadow-sm"
                      alt="India Flag"
                    />
                    <span className="text-gray-900 font-black text-sm sm:text-base tracking-tight">+91</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full px-3 py-3 sm:px-4 sm:py-4 bg-transparent text-gray-900 text-base sm:text-lg font-bold placeholder:text-gray-400 focus:outline-none"
                    placeholder="Mobile"
                    maxLength={10}
                  />
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => setFormData({ phone: '' })}
                      className="pr-3 sm:pr-4 text-gray-400 hover:text-pink-500 transition-colors"
                    >
                      <MaterialSymbol name="cancel" size={20} className="sm:scale-110" filled />
                    </button>
                  )}
                </div>
                {errors.phone && (
                  <div className="flex items-center gap-1.5 mt-2 ml-1 text-red-500 animate-in fade-in slide-in-from-top-1">
                    <MaterialSymbol name="error" size={16} filled />
                    <p className="text-xs font-bold leading-none">{errors.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Text */}
            <p className="text-xs text-gray-400 text-center font-medium">
              {t('We will send you a verification code to continue')}
            </p>

            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50/50 backdrop-blur-sm border border-red-200/50 rounded-xl animate-in fade-in zoom-in">
                <MaterialSymbol name="error" size={20} className="text-red-500 flex-shrink-0" filled />
                <p className="text-xs text-red-600 font-bold">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 sm:py-4 bg-premium-pink text-white font-black text-base sm:text-lg rounded-2xl hover:shadow-[0_10px_20px_-5px_rgba(244,63,94,0.4)] transition-all duration-300 transform active:scale-95 group relative overflow-hidden ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('Continue')}
                    <MaterialSymbol name="arrow_forward" size={20} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm font-medium">
              {t('Do not have an account?')}{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-pink-600 font-black hover:text-pink-700 underline underline-offset-4 decoration-pink-300 hover:decoration-pink-500 transition-all"
              >
                {t('Sign Up')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

