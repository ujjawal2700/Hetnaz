/**
 * Language Selection Page
 * First screen for new users to choose their language
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../core/hooks/useTranslation';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useAuth } from '../../../core/context/AuthContext';
import { isLanguageSelected } from '../../../core/utils/auth';

type Language = 'en' | 'hi';

export const LanguageSelectionPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { changeLanguage, currentLanguage } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);

    useEffect(() => {
        if (isAuthLoading) return;

        if (isLanguageSelected()) {
            if (isAuthenticated && user) {
                // Navigate to dashboard based on role
                if (user.role === 'female') {
                    navigate('/female/dashboard');
                } else if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/male/dashboard', { replace: true });
                }
            } else {
                navigate('/login');
            }
        }
    }, [isAuthLoading, isAuthenticated, user, navigate]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    const languages = [
        {
            code: 'en' as Language,
            name: 'English',
            nativeName: 'English',
            icon: '🇬🇧',
        },
        {
            code: 'hi' as Language,
            name: 'Hindi',
            nativeName: 'हिंदी',
            icon: '🇮🇳',
        },
    ];

    const handleContinue = () => {
        changeLanguage(selectedLanguage);
        // Navigate to login page
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 dark:from-[#1a0f14] dark:via-[#2d1a24] dark:to-[#0a0a0a] flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img src="/DilMatelogo.jpg" alt="Dil Mate Logo" className="w-24 h-24 shadow-2xl object-cover" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
                        Dil Mate
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                        {selectedLanguage === 'en' ? 'Choose Your Language' : 'अपनी भाषा चुनें'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {selectedLanguage === 'en'
                            ? 'Select your preferred language to continue'
                            : 'जारी रखने के लिए अपनी पसंदीदा भाषा चुनें'}
                    </p>
                </div>

                {/* Language Cards */}
                <div className="bg-white dark:bg-[#342d18] rounded-2xl shadow-xl p-6 mb-6">
                    <div className="space-y-3">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLanguage(lang.code)}
                                className={`w-full p-4 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${selectedLanguage === lang.code
                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{lang.icon}</div>
                                    <div className="flex-1 text-left">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                                            {lang.nativeName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {lang.name}
                                        </p>
                                    </div>
                                    {selectedLanguage === lang.code && (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-500">
                                            <MaterialSymbol name="check" size={20} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                >
                    <span>{selectedLanguage === 'en' ? 'Continue' : 'जारी रखें'}</span>
                    <MaterialSymbol name="arrow_forward" size={20} />
                </button>

                {/* Info Text */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    {selectedLanguage === 'en'
                        ? 'You can change this later in settings'
                        : 'आप इसे बाद में सेटिंग्स में बदल सकते हैं'}
                </p>
            </div>
        </div>
    );
};
