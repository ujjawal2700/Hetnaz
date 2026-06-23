import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { useAuth } from '../../../core/context/AuthContext';
import { calculateDistance, formatDistance, areCoordinatesValid } from '../../../utils/distanceCalculator';
import { useTranslation } from '../../../core/hooks/useTranslation';
import userService from '../../../core/services/user.service';
import { MeshBackground } from '../../../shared/components/auth/AuthLayoutComponents';
import { useVideoCall } from '../../../core/context/VideoCallContextXState';
import { ReportModal } from '../../../shared/components/ReportModal';
import { useGlobalState } from '../../../core/context/GlobalStateContext';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';

import { extractCityFromAddress } from '../../../core/utils/auth';

interface UserProfile {
  _id: string;
  name: string;
  bio?: string;
  age?: number;
  location?: string;
  occupation?: string;
  photos: { url: string; isPrimary: boolean }[];
  isOnline?: boolean;
  isVerified?: boolean;
  interests?: string[];
  distance?: string;
  latitude?: number;
  longitude?: number;
  role?: string;
}

export const UserProfilePage = () => {
  const { t } = useTranslation();
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coinBalance } = useGlobalState();
  const { requestCall, callPrice, isInCall } = useVideoCall();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Options Menu State
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  
  // Balance Modal
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [requiredCoinsModal, setRequiredCoinsModal] = useState(0);
  const [modalAction, setModalAction] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProfile();
  }, [profileId]);

  const fetchProfile = async () => {
    if (!profileId) {
      setError(t('noUserId'));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await userService.getUserProfile(profileId);

      const profileLat = data.profile?.location?.coordinates?.[1] || data.latitude;
      const profileLng = data.profile?.location?.coordinates?.[0] || data.longitude;

      let distanceStr = undefined;
      const userCoord = { lat: user?.latitude || 0, lng: user?.longitude || 0 };
      const profileCoord = { lat: profileLat || 0, lng: profileLng || 0 };

      if (areCoordinatesValid(userCoord) && areCoordinatesValid(profileCoord)) {
        const dist = calculateDistance(userCoord, profileCoord);
        distanceStr = formatDistance(dist);
      }

      // Format location 
      const rawCity = data.profile?.location?.city || data.city || data.location || '';
      const city = rawCity.includes(',') && rawCity.split(',').length > 3 ? extractCityFromAddress(rawCity) : rawCity;
      const state = data.profile?.location?.state || '';
      const formattedLocation = [city, state].filter(Boolean).join(', ');

      const mappedProfile: UserProfile = {
        _id: data.id || data._id,
        name: data.name || data.profile?.name,
        bio: data.bio || data.profile?.bio,
        age: data.age || data.profile?.age,
        location: formattedLocation,
        occupation: data.occupation || data.profile?.occupation,
        photos: data.photos || data.profile?.photos || [],
        interests: data.interests || data.profile?.interests || [],
        isOnline: data.isOnline,
        isVerified: data.isVerified,
        distance: distanceStr,
        latitude: profileLat,
        longitude: profileLng,
        role: data.role
      };

      setProfile(mappedProfile);
    } catch (err: any) {
      console.error('[UserProfilePage] Error fetching profile:', err);
      setError(err.response?.data?.message || err.message || t('errorLoadingProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `Check out ${profile.name}'s profile on Dil Mate`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('User cancelled share or API error', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('linkCopied') || 'Link copied to clipboard!');
    }
  };

  const handleBlockUser = async () => {
    if (!profileId) return;
    try {
      setIsBlocking(true);
      await userService.blockUser(profileId);
      alert(t('userBlockedSuccessfully') || 'User blocked.');
      navigate(-1);
    } catch (err: any) {
      alert(err.response?.data?.message || t('failedToBlockUser'));
    } finally {
      setIsBlocking(false);
      setIsOptionsOpen(false);
    }
  };

  const handleVideoCall = async () => {
    if (!profile) return;
    
    if (isInCall) {
        alert(t('errorAlreadyInCall') || 'You are already in a call.');
        return;
    }
    
    if (coinBalance < callPrice) {
      setRequiredCoinsModal(callPrice);
      setModalAction(t('actionVideoCall') || 'Video Call');
      setIsBalanceModalOpen(true);
      return;
    }

    if (!profile.isOnline) {
      alert(t('errorUserOffline') || 'User is offline.');
      return;
    }

    try {
      await requestCall(
        profile._id,
        profile.name,
        profile.photos?.[0]?.url || '',
        `new_${profile._id}`, // Generate temp chat ID if none exists, VideoCallContext handles the rest
        user?.name || 'User',
        user?.photos?.[0] || ''
      );
    } catch (err: any) {
      alert(err.message || t('errorFailedToStartCall'));
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark p-4">
        <MaterialSymbol name="error" size={48} className="text-red-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error || t('profileNotFound')}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg"
        >
          {t('goBack')}
        </button>
      </div>
    );
  }

  const photos = profile.photos || [];
  const primaryPhoto = photos.find(p => p.isPrimary) || photos[0];
  
  // Decide gender colors
  const isFemale = profile.role === 'female';
  const badgeBg = isFemale ? 'bg-primary' : 'bg-blue-500';
  const badgeIcon = isFemale ? '♀' : '♂';

  return (
    <div className="flex flex-col min-h-screen bg-[#fffcfd] dark:bg-[#0a0a0a] pb-24 relative overflow-hidden font-display antialiased">
      <MeshBackground />

      {/* Profile Decor Blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-blob-shift" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full animate-blob-shift" style={{ animationDelay: '-6s' }} />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10 max-w-md mx-auto w-full">
        {/* Top Banner (Hero Photo) */}
        <div className="relative w-full h-[52vh] bg-gray-100 dark:bg-black/20">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={profile.name}
              className="w-full h-full object-cover"
              onClick={() => setSelectedPhotoIndex(photos.findIndex(p => p.isPrimary) || 0)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MaterialSymbol name="person" size={64} />
            </div>
          )}

          {/* Floated Header Controls */}
          <div className="absolute top-0 left-0 w-full p-5 pt-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={() => navigate(-1)}
              className="skeuo-button w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-black/20 backdrop-blur-md active:scale-90 transition-all border-white/20"
            >
              <MaterialSymbol name="arrow_back_ios_new" size={18} />
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="skeuo-button w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-black/20 backdrop-blur-md active:scale-90 transition-all border-white/20"
              >
                <MaterialSymbol name="share" size={20} />
              </button>
              <button
                onClick={() => setIsOptionsOpen(true)}
                className="skeuo-button w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-black/20 backdrop-blur-md active:scale-90 transition-all border-white/20"
              >
                <MaterialSymbol name="more_horiz" size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Cinematic Card Overlay */}
        <div className="relative -mt-10 rounded-t-[3rem] bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-t border-white/30 dark:border-white/5 px-7 py-8 pb-32 min-h-[50vh] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
          
          {/* Main Info Section */}
          <div className="flex flex-col gap-5 mb-10">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <h1 className="text-[28px] font-black tracking-tighter text-slate-900 dark:text-white leading-none">{profile.name}</h1>
                    {profile.isVerified && <MaterialSymbol name="verified" filled size={20} className="text-blue-500 drop-shadow-sm" />}
                 </div>
                 <div className="flex items-center gap-3">
                    {profile.isOnline && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Online</span>
                      </div>
                    )}
                    {profile.distance && (
                       <div className="flex items-center gap-1 opacity-60">
                          <MaterialSymbol name="location_on" size={14} className="text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{profile.distance} AWAY</span>
                       </div>
                    )}
                 </div>
               </div>
               
               {/* Fixed Balanced Social Badge */}
               {profile.age && (
                  <div className={`skeuo-card flex items-center justify-center gap-1.5 px-4 h-10 rounded-2xl text-white ${badgeBg} shadow-lg shadow-pink-500/20`}>
                     <span className="text-sm font-black tracking-tight">{profile.age}</span>
                     <span className="text-[15px] font-bold leading-none">{badgeIcon}</span>
                  </div>
               )}
            </div>
          </div>

          <div className="space-y-10">
            {/* Bio Section */}
            {profile.bio && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-[.25em] text-primary opacity-60">THE JOURNEY</h3>
                <div className="glass-card rounded-[2rem] p-6 border-white/60 dark:border-white/10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-10">
                      <MaterialSymbol name="format_quote" size={48} filled />
                   </div>
                   <p className="text-[14px] leading-relaxed text-slate-900 dark:text-slate-200 font-medium">
                    {profile.bio}
                   </p>
                </div>
              </div>
            )}

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[.25em] text-primary opacity-60">MOMENTS</h3>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{photos.length} PHOTOS</span>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className="group relative aspect-square rounded-[1.5rem] overflow-hidden skeuo-card p-1 bg-white/40 dark:bg-black/10 transition-all hover:scale-105 active:scale-95"
                    >
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-[1.25rem] border border-white/40"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Details Vault */}
            <div className="space-y-3 pb-10">
               <h3 className="text-[11px] font-black uppercase tracking-[.25em] text-primary opacity-60 px-1">THE DETAILS</h3>
               <div className="grid grid-cols-2 gap-3">
                  <div className="skeuo-inset bg-gray-50/50 dark:bg-black/20 rounded-[1.75rem] p-4 flex items-center gap-3">
                     <div className="skeuo-card size-10 rounded-xl flex items-center justify-center bg-white dark:bg-black p-2">
                        <MaterialSymbol name="work" size={18} className="text-primary" filled />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-900 dark:text-white truncate tracking-tight">{profile.occupation || 'Explorer'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('occupation')}</p>
                     </div>
                  </div>
                  <div className="skeuo-inset bg-gray-50/50 dark:bg-black/20 rounded-[1.75rem] p-4 flex items-center gap-3">
                     <div className="skeuo-card size-10 rounded-xl flex items-center justify-center bg-white dark:bg-black p-2">
                        <MaterialSymbol name="push_pin" size={18} className="text-primary" filled />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-900 dark:text-white truncate tracking-tight">{profile.location || 'Roaming'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('location')}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Symmetric Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 p-6 pb-8 flex items-center justify-center gap-4 bg-gradient-to-t from-[#fffcfd]/90 dark:from-black to-transparent pointer-events-none">
          {/* Tactical Video Call */}
          <button 
             onClick={handleVideoCall}
             className="pointer-events-auto flex-1 h-[60px] glass-card rounded-2xl flex items-center justify-center gap-2 border-white/60 dark:border-white/10 active:scale-95 transition-all group overflow-hidden"
          >
             <MaterialSymbol name="videocam" size={22} className="text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
             <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Video</span>
          </button>
          
          {/* Primary Chat Action */}
          <button 
             onClick={() => navigate(`/male/chat/new_${profileId}`)}
             className="pointer-events-auto flex-1 h-[60px] skeuo-button-bold rounded-2xl flex items-center justify-center gap-2 bg-primary active:scale-95 transition-all shadow-xl shadow-primary/20 z-10 group relative"
          >
             <div className="absolute inset-0 bg-mesh-glass opacity-20" />
             <MaterialSymbol name="chat_bubble" size={22} className="text-white relative z-10 group-hover:scale-110 transition-transform" filled />
             <span className="text-[11px] font-black uppercase tracking-widest text-white relative z-10">Live Chat</span>
          </button>
      </div>


      {/* Options Bottom Sheet */}
      {isOptionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-10" onClick={() => setIsOptionsOpen(false)}>
          <div 
             className="w-full max-w-sm skeuo-card bg-white dark:bg-black rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up"
             onClick={(e) => e.stopPropagation()}
          >
             <div className="p-5 border-b border-gray-100 dark:border-white/5 text-center">
                 <div className="w-12 h-1.25 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4" />
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">{t('Options')}</h3>
             </div>
             
             <div className="p-2 space-y-1">
                <button 
                  className="w-full p-4 flex items-center gap-3 text-red-500 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  onClick={handleBlockUser}
                  disabled={isBlocking}
                >
                  <MaterialSymbol name="block" filled size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">{isBlocking ? 'Blocking...' : 'Block User'}</span>
                </button>
                
                <button 
                  className="w-full p-4 flex items-center gap-3 text-amber-600 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                  onClick={() => { setIsOptionsOpen(false); setIsReportModalOpen(true); }}
                >
                  <MaterialSymbol name="report_gmailerrorred" filled size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Report Profile</span>
                </button>
                
                <button 
                  className="w-full p-5 flex items-center justify-center text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => setIsOptionsOpen(false)}
                >
                  {t('Cancel')}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Components */}
      <ReportModal
        isOpen={isReportModalOpen}
        reportedId={profileId!}
        userName={profile.name}
        onClose={() => setIsReportModalOpen(false)}
      />

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        requiredCoins={requiredCoinsModal}
        action={modalAction}
        currentBalance={coinBalance}
        onBuyCoins={() => navigate('/male/coins')}
      />

      {/* Fullscreen Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center" onClick={() => setSelectedPhotoIndex(null)}>
          <button onClick={() => setSelectedPhotoIndex(null)} className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-all border border-white/20">
            <MaterialSymbol name="close" size={28} />
          </button>
          
          {/* Photos Navigation */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex - 1); }}
              className="absolute left-6 w-14 h-14 rounded-full bg-black/40 flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <MaterialSymbol name="chevron_left" size={40} />
            </button>
          )}

          {selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(selectedPhotoIndex + 1); }}
              className="absolute right-6 w-14 h-14 rounded-full bg-black/40 flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <MaterialSymbol name="chevron_right" size={40} />
            </button>
          )}

          <img src={photos[selectedPhotoIndex].url} alt={`Photo ${selectedPhotoIndex + 1}`} className="max-w-[90vw] max-h-[80vh] object-contain rounded-3xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            EXPLORING {selectedPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
