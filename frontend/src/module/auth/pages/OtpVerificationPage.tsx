import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { requestSignupOtp } from '../services/auth.service';
import { useAuth } from '../../../core/context/AuthContext';
import { useTranslation } from '../../../core/hooks/useTranslation';
import { ArtisticBackground, ActivityCounter } from '../../../shared/components/auth/AuthLayoutComponents';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface LocationState {
    mode: 'login' | 'signup';
    phoneNumber: string;
    signupData?: any; // Full payload for signup resend
}

export const OtpVerificationPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const state = location.state as LocationState;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!state?.phoneNumber || !state?.mode) {
            navigate('/login');
            return;
        }

        // OTP AUTO-BYPASS FOR TEST NUMBERS
        const bypassNumbers = ['911234567899', '911234567895'];
        if (bypassNumbers.includes(state.phoneNumber)) {
            console.log('🛡️ Bypass number detected, auto-filling OTP...');
            setOtp(['1', '2', '3', '4', '5', '6']);
            return;
        }

        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [state, navigate]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            prev?.focus();
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setIsLoading(true);
        setError(null);
        try {
            if (state.mode === 'login') {
                await axios.post(`${API_URL}/auth/login-request`, { phoneNumber: state.phoneNumber });
            } else {
                if (state.signupData) {
                    await requestSignupOtp(state.signupData);
                } else {
                    console.warn("Resend not available for signup without persistent data.");
                    setError("Please go back and try signing up again to resend OTP.");
                    return;
                }
            }

            setTimer(60);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return;

        setIsLoading(true);
        setError(null);

        try {
            // OTP BYPASS (123456) - Active for development
            // Current validation logic is maintained in the backend

            const endpoint = state.mode === 'login'
                ? `${API_URL}/auth/login-verify`
                : `${API_URL}/auth/signup-verify`;

            const payload = {
                phoneNumber: state.phoneNumber,
                otp: code
            };

            const response = await axios.post(endpoint, payload);

            if (response.data.token && response.data.data.user) {
                // CRITICAL: Clear all old user data from localStorage before login
                const savedLanguage = localStorage.getItem('user_language');
                localStorage.clear();
                if (savedLanguage) {
                    localStorage.setItem('user_language', savedLanguage); // Preserve language preference
                }

                login(response.data.token, response.data.data.user);

                // Respect the 'from' location if it exists
                const from = (state as any)?.from?.pathname;
                if (from) {
                    navigate(from, { replace: true });
                    return;
                }

                // Navigation based on role
                const user = response.data.data.user;
                if (user.role === 'female') {
                    if (user.approvalStatus !== 'approved') {
                        navigate('/verification-pending');
                    } else {
                        navigate('/female/dashboard');
                    }
                } else if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/male/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('invalidOTP'));
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-verify effect for bypass numbers
    useEffect(() => {
        const bypassNumbers = ['911234567899', '911234567895'];
        if (state?.phoneNumber && bypassNumbers.includes(state.phoneNumber) && !isLoading && !error) {
            console.log('⚡ Auto-verifying for bypass number');
            const bypassTimeout = setTimeout(() => {
                const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
                handleVerify(fakeEvent);
            }, 500);
            return () => clearTimeout(bypassTimeout);
        }
    }, [state?.phoneNumber, isLoading, error]);

    return (
        <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <ArtisticBackground />

            <div className="relative z-10 max-w-md w-full">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-2">
                        <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full animate-gold-pulse" />
                        <img 
                            src="/Hetnaz.png" 
                            alt="HETNAZ Logo" 
                            className="relative w-36 h-36 object-contain" 
                        />
                    </div>
                    

                    <ActivityCounter />
                </div>

                {/* glass-card wrapper */}
                <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl border border-white/40">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('verifyYourPhone')}</h2>
                        <p className="text-gray-500 text-sm font-medium">
                            {t('enterOTPSentTo')} <span className="text-pink-600 font-black">
                                +91 {state?.phoneNumber?.startsWith('91') ? state.phoneNumber.slice(2) : state?.phoneNumber}
                            </span>
                        </p>
                    </div>
                        <form className="space-y-10" onSubmit={handleVerify}>
                            <div className="flex flex-col items-center">
                                <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">
                                    {t('Enter 6-digit code')}
                                </label>
                                <div className="flex justify-center gap-1.5 xs:gap-2 sm:gap-3">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleChange(e.target, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className={`w-9 h-11 xs:w-10 xs:h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl border-2 transition-all duration-300 bg-white/50 focus:outline-none ${digit 
                                                ? 'border-pink-500 text-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.2)]' 
                                                : 'border-gray-100 text-gray-900 focus:border-pink-300'
                                            }`}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center justify-center gap-2 p-3 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-1">
                                    <MaterialSymbol name="warning" size={18} className="text-red-500" filled />
                                    <p className="text-xs font-bold text-red-600 leading-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                <button
                                    type="submit"
                                    disabled={isLoading || otp.join('').length !== 6}
                                    className="relative w-full py-3 sm:py-4 bg-premium-pink text-white font-black text-base sm:text-lg rounded-2xl shadow-[0_10px_25px_-5px_rgba(255,77,109,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(255,77,109,0.5)] transform hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine transition-transform" />
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <MaterialSymbol name="sync" size={24} className="animate-spin" />
                                            {t('loading')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            {t('verify')}
                                            <MaterialSymbol name="verified" size={20} />
                                        </span>
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={timer > 0 || isLoading}
                                        className={`group relative inline-flex flex-col items-center gap-1 transition-all duration-300 ${timer > 0 ? 'opacity-60 grayscale' : 'hover:scale-105'}`}
                                    >
                                        <span className={`text-sm font-black ${timer > 0 ? 'text-gray-400' : 'text-pink-600'}`}>
                                            {timer > 0 ? `${t('resendIn')} ${timer}s` : t('resendOTP')}
                                        </span>
                                        <div className={`h-1 rounded-full bg-pink-500 transition-all duration-500 ${timer > 0 ? 'w-0' : 'w-full scale-x-0 group-hover:scale-x-100'}`} />
                                    </button>
                                </div>
                            </div>
                        </form>
                </div>
            </div>
        </div>
    );
};
