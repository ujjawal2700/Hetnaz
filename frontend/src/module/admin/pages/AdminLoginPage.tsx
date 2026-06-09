import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizePhoneNumber } from '../../../core/utils/phoneNumber';
import { loginWithOtp } from '../../auth/services/auth.service';
import { useAuth } from '../../../core/context/AuthContext';

export const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [formData, setFormData] = useState<{ phone: string }>({
        phone: '',
    });

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);
    const [errors, setErrors] = useState<{ phone?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const validateForm = (): boolean => {
        const newErrors: { phone?: string } = {};

        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone number is required';
        } else {
            try {
                // Attempt to normalize - will throw if invalid
                normalizePhoneNumber(formData.phone);
            } catch (error: any) {
                newErrors.phone = 'Please enter a valid phone number';
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
                // Normalize phone number (handles +91, 91, or 10-digit input)
                const normalizedPhone = normalizePhoneNumber(formData.phone);
                await loginWithOtp(normalizedPhone);
                navigate('/otp-verification', {
                    state: { mode: 'login', phoneNumber: normalizedPhone }
                });
            } catch (err: any) {
                setApiError(err.message || 'Login request failed. Ensure you are an admin.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChange = (value: string) => {
        // Allow user to type freely, we'll validate on submit
        // Remove non-digit characters except +
        const cleaned = value.replace(/[^\d+]/g, '');
        setFormData({ phone: cleaned });
        if (errors.phone) {
            setErrors({});
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 text-white">
                        Admin Portal
                    </h1>
                    <p className="text-gray-400">Restricted Access Only</p>
                </div>

                {/* Form */}
                <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Input */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                Admin Phone Number
                            </label>
                            <div className="flex">
                                <div className="px-4 py-3 bg-gray-700 border border-r-0 border-gray-600 rounded-l-lg flex items-center">
                                    <span className="text-gray-300 font-medium">+91</span>
                                </div>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange(e.target.value)}
                                    className={`flex-1 px-4 py-3 bg-gray-700 text-white border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-600'
                                        }`}
                                    placeholder="9876543210"
                                    maxLength={10}
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                            )}
                        </div>

                        {apiError && (
                            <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded">
                                {apiError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Sending Code...' : 'Login'}
                        </button>
                    </form>

                    {/* Back link */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-500 text-sm hover:text-gray-400"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
