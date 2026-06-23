import { useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useAuth } from '../../../core/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useGlobalState } from '../../../core/context/GlobalStateContext';
import axios from 'axios';
import { getAuthToken } from '../../../core/utils/auth';
import { useTranslation } from '../../../core/hooks/useTranslation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const VerificationPendingPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { addNotification } = useGlobalState();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
    const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // If user is approved, they shouldn't be here
    useEffect(() => {
        if (user && user.approvalStatus === 'approved') {
            if (user.role === 'female') navigate('/female/dashboard');
            else navigate('/male/dashboard');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        addNotification({
            title: 'logoutSuccess',
            message: 'logoutSuccessMessage',
            type: 'system'
        });
        logout();
        navigate('/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAadhaarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAadhaarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        }
    };

    const handleResubmit = async () => {
        if (!aadhaarFile) {
            setError(t('pleaseSelectDocument'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Upload to Cloudinary
            // Use local preview for dev/mock
            let aadhaarUrl = aadhaarPreview || 'https://res.cloudinary.com/demo/image/upload/v1/aadhaar_front.jpg';
            try {
                // Uncomment real upload when ready
                // const result = await upload(aadhaarFile, 'verification');
                // aadhaarUrl = result.url;
            } catch (err) {
                console.warn('Upload failed, using mock');
            }

            // Call backend to update verification doc
            // We need the token, which should be in axios interceptors if user is logged in context
            // But wait, if user is logged in, axios is set up? 
            // Assuming AuthContext sets defaults or we manually add header if needed.
            // If logged in via OtpVerificationPage, token is in localStorage and axios defaults.

            await axios.post(`${API_URL}/users/resubmit-verification`, {
                aadhaarCardUrl: aadhaarUrl
            }, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            });

            setSuccessMsg(t('verificationSubmittedSuccess'));
            setAadhaarFile(null);
            setAadhaarPreview(null);

        } catch (err: any) {
            console.error('Resubmission error:', err);
            setError(err.response?.data?.message || t('failedToSubmitDocument'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <img src="/DilMatelogo.jpg" alt="Dil Mate Logo" className="w-16 h-16 shadow-lg object-cover" />
                </div>

                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 mb-6">
                    <MaterialSymbol
                        name={user?.approvalStatus === 'rejected' ? 'block' : (user?.approvalStatus === 'resubmit_requested' ? 'error' : 'hourglass_empty')}
                        size={32}
                        className="text-pink-600"
                    />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {user?.approvalStatus === 'rejected'
                        ? t('accountRejected')
                        : (user?.approvalStatus === 'resubmit_requested' ? t('correctionRequired') : t('verificationPending'))}
                </h2>

                <p className="text-gray-600 mb-6">
                    {user?.approvalStatus === 'rejected'
                        ? t('accountRejectedMessage')
                        : (user?.approvalStatus === 'resubmit_requested'
                            ? t('correctionRequiredMessage')
                            : t('verificationPendingDesc'))}
                </p>

                {user?.rejectionReason && (
                    <div className={`${user.approvalStatus === 'rejected' ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-6 text-left`}>
                        <p className={`text-sm ${user.approvalStatus === 'rejected' ? 'text-gray-800' : 'text-red-800'} font-semibold mb-1`}>
                            {user.approvalStatus === 'rejected' ? t('rejectionReason') : t('reasonForCorrection')}
                        </p>
                        <p className={`text-sm ${user.approvalStatus === 'rejected' ? 'text-gray-700' : 'text-red-700'}`}>{user.rejectionReason}</p>
                    </div>
                )}

                {user?.approvalStatus === 'resubmit_requested' && !successMsg && (
                    <div className="mb-6">
                        {!aadhaarPreview ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-pink-300 rounded-lg p-6 cursor-pointer hover:bg-pink-100 transition-colors"
                            >
                                <MaterialSymbol name="upload_file" size={32} className="mx-auto text-pink-400 mb-2" />
                                <span className="text-pink-600 font-medium block">{t('uploadNewDocument')}</span>
                                <p className="text-xs text-pink-500 mt-1">{t('clearPhotoOfAadhaar')}</p>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-pink-200">
                                <img src={aadhaarPreview} alt={t('preview')} className="w-full h-48 object-cover" />
                                <button
                                    onClick={() => { setAadhaarFile(null); setAadhaarPreview(null); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                                >
                                    <MaterialSymbol name="close" size={16} />
                                </button>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                        <button
                            onClick={handleResubmit}
                            disabled={isSubmitting || !aadhaarFile}
                            className="mt-4 w-full py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
                        >
                            {isSubmitting ? t('submitting') : t('resubmitVerification')}
                        </button>
                    </div>
                )}

                {successMsg ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-800">
                        {successMsg}
                    </div>
                ) : (
                    user?.approvalStatus !== 'rejected' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
                            {t('cannotAccessDashboard')}
                        </div>
                    )
                )}

                <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center mx-auto"
                >
                    <MaterialSymbol name="logout" size={20} className="mr-2" />
                    {t('signOut')}
                </button>
            </div>
        </div>
    );
};
