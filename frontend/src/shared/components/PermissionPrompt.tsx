import { useState } from 'react';

interface PermissionPromptProps {
    onRequestPermissions: () => void;
    onDismiss: () => void;
}

export const PermissionPrompt = ({ onRequestPermissions, onDismiss }: PermissionPromptProps) => {
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState('');

    const handleRequest = async () => {
        setIsRequesting(true);
        setError('');

        try {
            // Request camera and microphone - this triggers Android system dialog
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Stop tracks immediately
            stream.getTracks().forEach(track => track.stop());

            // Also request location
            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve(),
                    () => resolve(), // Continue even if location denied
                    { timeout: 5000 }
                );
            });

            // Mark as requested
            localStorage.setItem('dil_mate_permissions_requested', 'true');

            onRequestPermissions();
        } catch (err: any) {
            console.error('Permission error:', err);
            setError('Please enable camera and microphone permissions to use video calls');
            setIsRequesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#342d18] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-4">
                        <img src="/DilMatelogo.jpg" alt="Dil Mate" className="w-16 h-16 shadow-lg object-cover" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Dil Mate Permissions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        To use video calls and find nearby users, please allow access to your camera, microphone, and location.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <button
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
                    >
                        {isRequesting ? 'Requesting...' : 'Allow Permissions'}
                    </button>
                    <button
                        onClick={onDismiss}
                        disabled={isRequesting}
                        className="w-full py-2 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};
