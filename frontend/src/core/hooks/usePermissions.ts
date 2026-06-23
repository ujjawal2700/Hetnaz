import { useState, useEffect, useCallback } from 'react';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionState {
    camera: PermissionStatus;
    microphone: PermissionStatus;
    location: PermissionStatus;
}

// LocalStorage keys for permission states
const PERMISSION_KEYS = {
    CAMERA: 'dil_mate_camera_permission',
    MICROPHONE: 'dil_mate_microphone_permission',
    LOCATION: 'dil_mate_location_permission',
    REQUESTED: 'dil_mate_permissions_requested',
};

export const usePermissions = () => {
    const [permissions, setPermissions] = useState<PermissionState>({
        camera: 'unknown',
        microphone: 'unknown',
        location: 'unknown',
    });

    const [isChecking, setIsChecking] = useState(false);

    // Load permission states from localStorage
    const loadStoredPermissions = useCallback(() => {
        const stored: PermissionState = {
            camera: (localStorage.getItem(PERMISSION_KEYS.CAMERA) as PermissionStatus) || 'prompt',
            microphone: (localStorage.getItem(PERMISSION_KEYS.MICROPHONE) as PermissionStatus) || 'prompt',
            location: (localStorage.getItem(PERMISSION_KEYS.LOCATION) as PermissionStatus) || 'prompt',
        };
        setPermissions(stored);
        return stored;
    }, []);

    // Save permission state to localStorage
    const savePermissionState = useCallback((type: 'camera' | 'microphone' | 'location', status: PermissionStatus) => {
        const key = PERMISSION_KEYS[type.toUpperCase() as keyof typeof PERMISSION_KEYS];
        localStorage.setItem(key, status);
        setPermissions(prev => ({ ...prev, [type]: status }));
    }, []);

    // Check current permission status from browser API
    const checkPermissions = useCallback(async () => {
        setIsChecking(true);
        const newState: PermissionState = { ...permissions };

        try {
            if (navigator.permissions) {
                // Check camera
                try {
                    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    newState.camera = cameraPermission.state as PermissionStatus;
                    savePermissionState('camera', cameraPermission.state as PermissionStatus);
                } catch (e) {
                    // Fallback to stored state
                    newState.camera = (localStorage.getItem(PERMISSION_KEYS.CAMERA) as PermissionStatus) || 'prompt';
                }

                // Check microphone
                try {
                    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    newState.microphone = micPermission.state as PermissionStatus;
                    savePermissionState('microphone', micPermission.state as PermissionStatus);
                } catch (e) {
                    newState.microphone = (localStorage.getItem(PERMISSION_KEYS.MICROPHONE) as PermissionStatus) || 'prompt';
                }

                // Check location
                try {
                    const locationPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                    newState.location = locationPermission.state as PermissionStatus;
                    savePermissionState('location', locationPermission.state as PermissionStatus);
                } catch (e) {
                    newState.location = (localStorage.getItem(PERMISSION_KEYS.LOCATION) as PermissionStatus) || 'prompt';
                }
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
        }

        setPermissions(newState);
        setIsChecking(false);
        return newState;
    }, [savePermissionState]);

    // Request location permission - triggers system prompt
    const requestLocationPermission = useCallback(async (): Promise<PermissionStatus> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                savePermissionState('location', 'denied');
                resolve('denied');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                () => {
                    savePermissionState('location', 'granted');
                    resolve('granted');
                },
                (error) => {
                    const status = error.code === 1 ? 'denied' : 'denied';
                    savePermissionState('location', status);
                    resolve(status);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        });
    }, [savePermissionState]);

    // Request camera and microphone permissions - triggers system prompt
    const requestMediaPermissions = useCallback(async (): Promise<{ camera: PermissionStatus; microphone: PermissionStatus }> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // Stop all tracks immediately
            stream.getTracks().forEach(track => track.stop());

            savePermissionState('camera', 'granted');
            savePermissionState('microphone', 'granted');

            return { camera: 'granted', microphone: 'granted' };
        } catch (error: any) {
            console.error('Media permission error:', error);

            const status: PermissionStatus = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
                ? 'denied'
                : 'denied';

            savePermissionState('camera', status);
            savePermissionState('microphone', status);

            return { camera: status, microphone: status };
        }
    }, [savePermissionState]);

    // Request all permissions in sequence - triggers system prompts
    const requestAllPermissions = useCallback(async (): Promise<{
        location: PermissionStatus;
        camera: PermissionStatus;
        microphone: PermissionStatus;
    }> => {
        // Request location first
        const locationStatus = await requestLocationPermission();

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        // Request camera and microphone
        const mediaStatus = await requestMediaPermissions();

        // Mark that we've requested permissions
        localStorage.setItem(PERMISSION_KEYS.REQUESTED, 'true');

        return {
            location: locationStatus,
            camera: mediaStatus.camera,
            microphone: mediaStatus.microphone,
        };
    }, [requestLocationPermission, requestMediaPermissions]);

    // Check if permissions have been requested before
    const hasRequestedPermissions = useCallback(() => {
        return localStorage.getItem(PERMISSION_KEYS.REQUESTED) === 'true';
    }, []);

    // Load stored permissions on mount
    useEffect(() => {
        loadStoredPermissions();
    }, [loadStoredPermissions]);

    return {
        permissions,
        isChecking,
        checkPermissions,
        requestLocationPermission,
        requestMediaPermissions,
        requestAllPermissions,
        hasRequestedPermissions,
        savePermissionState,
    };
};
