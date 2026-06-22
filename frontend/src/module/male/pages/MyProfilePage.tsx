import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { useMaleNavigation } from '../hooks/useMaleNavigation';
import { useSocket } from '../../../core/context/SocketContext';
import { MaterialSymbol } from '../../../shared/components/MaterialSymbol';
import { ProfileHeader } from '../components/ProfileHeader';
import { WalletBalance } from '../components/WalletBalance';
import { useGlobalState } from '../../../core/context/GlobalStateContext';
import { useTranslation } from '../../../core/hooks/useTranslation';

import { StatsGrid } from '../components/StatsGrid';
import { BadgeDisplay } from '../../../shared/components/BadgeDisplay';
import userService from '../../../core/services/user.service';
import { MeshBackground } from '../../../shared/components/auth/AuthLayoutComponents';

const mockProfile = {
  id: 'me',
  name: 'John Doe',
  age: 28,
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoS_YLtV4hpNVbbyf0nrVmbQX6vzgn-xGLdye-t2gBz0LRib9HX4PeYJIj364IRM63hBRKmTLtWfuVOfikvNIryKKMjql6Ig1suPsbWoA45Vt8rO0N-wt7qwqIwMBV4Gaw6j7ooJER4L9QExcc20SNkyk1schLm-swXJOgx5ez3objGGhUPZpOMLYRY2W5WgHwClZhJ-JaWw470QybQVyCQD-hZYfamq_iJqx0EAJE0UNaa6Ee3_FbUUYSuUIIViQ_QxI6ytCepxc',
  bio: 'Love traveling and exploring new places. Looking for someone to share adventures with!',
  occupation: 'Software Developer',
  city: 'Mumbai',
  interests: ['Technology', 'Music', 'Gaming'],
  photos: [] as string[],
};

export const MyProfilePage = () => {
  const { t, changeLanguage, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { coinBalance } = useGlobalState();
  const { isConnected } = useSocket();
  const { navigationItems, handleNavigationClick } = useMaleNavigation();
  const [stats, setStats] = useState({
    matches: 0,
    sent: 0,
    coinsSpent: 0
  });

  const [profile, setProfile] = useState(mockProfile);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await userService.getMeStats();
        if (data) setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (user) {
      const userProfile = {
        ...mockProfile,
        id: user.id || mockProfile.id,
        name: user.name || 'Anonymous',
        age: user.age || 0,
        occupation: user.occupation || '',
        city: user.city || (user.location ? user.location.split(',')[0] : '') || '',
        bio: user.bio || '',
        interests: user.interests || [],
        avatar: user.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        photos: (user.photos && user.photos.length > 0) ? user.photos : (user.avatarUrl ? [user.avatarUrl] : []),
      };
      setProfile(userProfile);
    }
  }, [user]);

  const handleTopUpClick = () => {
    navigate('/male/buy-coins');
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark relative overflow-hidden">
        <MeshBackground />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="text-slate-900 dark:text-white font-display antialiased min-h-screen relative overflow-x-hidden">
      <MeshBackground />
      
      <div className="relative z-10 max-w-md mx-auto w-full flex flex-col pb-32">
        
        {/* Header Hero */}
        <section className="pt-2 px-4 pb-2">
          <ProfileHeader
            user={{
              name: profile.name,
              avatar: profile.avatar,
              isPremium: user?.memberTier ? user.memberTier !== 'basic' : false,
              isOnline: isConnected,
              memberTier: user?.memberTier || 'basic',
              levelInfo: user?.levelInfo || null,
            }}
            onEditClick={() => navigate('/male/edit-profile')}
            showNotifications={false}
          />
          <div className="mt-4">
            <WalletBalance
              balance={coinBalance}
              onTopUpClick={handleTopUpClick}
            />
          </div>

          {user?.levelInfo && (
            <div className="mt-4 skeuo-card rounded-[2rem] bg-mesh-glass border-white/60 dark:border-white/5 p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-500">
                    <MaterialSymbol name="military_tech" size={18} className="text-violet-600 dark:text-violet-400" filled />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      Level Progression
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                      Lvl {user.levelInfo.level} • {user.levelInfo.badgeName}
                    </h4>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/male/leaderboard')}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-lg shadow-violet-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <MaterialSymbol name="leaderboard" size={14} />
                  Leaderboard
                </button>
              </div>

              {user.levelInfo.nextLevelThreshold !== null ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{t('levelProgress', { count: user.levelInfo.totalCoinsSpent, total: user.levelInfo.nextLevelThreshold, next: user.levelInfo.nextLevel })}</span>
                    <span>{user.levelInfo.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-black/40 p-[2px] border border-white/20 dark:border-white/5 skeuo-inset overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-1000"
                      style={{ width: `${user.levelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 text-center py-1 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/20">
                  🎉 {t('nextLevelReached')}
                </div>
              )}
            </div>
          )}
        </section>

        {/* About & Interests Section */}
        {(profile.bio || (profile.interests && profile.interests.length > 0)) && (
          <section className="px-4 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-transparent dark:bg-black/20 text-primary">
                <MaterialSymbol name="person_outline" size={18} />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('about')}</h3>
            </div>

            <div className="skeuo-card rounded-[2rem] bg-mesh-glass border-white/60 dark:border-white/5 p-5 shadow-2xl space-y-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
               
               {profile.bio && (
                 <div className="space-y-3 relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('bio')}</p>
                   <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                     "{profile.bio}"
                   </p>
                 </div>
               )}

               {profile.interests && profile.interests.length > 0 && (
                 <div className="space-y-4 relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('interests')}</p>
                   <div className="flex flex-wrap gap-2">
                     {profile.interests.map((interest, index) => (
                       <span
                         key={index}
                         className="px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm transition-all hover:scale-105 active:scale-95"
                       >
                         {interest}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="px-4 mb-2">
           <div className="flex items-center gap-3 px-1 mb-2">
            <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-transparent dark:bg-black/20">
              <MaterialSymbol name="insights" size={18} className="text-primary" />
            </div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 font-display">
              {t('yourStats')}
            </h2>
          </div>
          <StatsGrid stats={stats} />
        </section>

        {/* Badges Exhibition */}
        {user?.badges && user.badges.length > 0 && (
          <section className="px-4 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="skeuo-card rounded-[1.5rem] p-4 shadow-xl bg-mesh-glass border-white/60 dark:border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                      <MaterialSymbol name="workspace_premium" size={18} filled />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white leading-none mb-1">{t('achievementVault')}</h3>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {user.badges.filter(b => b.isUnlocked).length} / {user.badges.length} {t('collected')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/male/badges')}
                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:scale-105 transition-transform"
                  >
                    {t('exploreAll')}
                  </button>
                </div>
                
                <div className="skeuo-inset rounded-xl p-3 bg-transparent dark:bg-black/20 border border-white/20 dark:border-white/5">
                  <BadgeDisplay
                    badges={user.badges}
                    maxDisplay={6}
                    showUnlockedOnly={true}
                    compact={true}
                    onBadgeClick={() => navigate('/male/badges')}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Photo Portfolio Showcase */}
        {profile.photos && profile.photos.length > 0 && (
          <section className="px-4 mb-2">
            <div className="flex justify-between items-center mb-2 px-2">
               <div className="flex items-center gap-3">
                  <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-transparent dark:bg-black/20 text-primary">
                     <MaterialSymbol name="photo_library" size={18} />
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('galleryPortfolio')}</h3>
               </div>
               <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-none">{profile.photos.length} SLOTS</span>
            </div>
            
            <div className="grid grid-cols-6 gap-3">
              {profile.photos.map((photo, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className={`skeuo-card group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-mesh-glass border-white/60 dark:border-white/5 cursor-pointer active:scale-95 transition-all duration-500 ${index === 0 ? 'col-span-6 aspect-[16/9]' : 'col-span-2'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  
                  <img
                    src={photo}
                    alt={`${t('portfolio')} ${index + 1}`}
                    className="size-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {index === 0 && (
                     <div className="absolute top-4 left-4 skeuo-button h-8 px-4 rounded-full flex items-center gap-2 z-20">
                        <MaterialSymbol name="star" size={14} className="text-amber-500" filled />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-white">{t('featured')}</span>
                     </div>
                  )}

                  <div className="absolute bottom-6 right-6 skeuo-button size-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20">
                     <MaterialSymbol name="zoom_in" size={20} className="text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Global Vault Settings */}
        <section className="px-4 mb-2">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="skeuo-inset size-8 rounded-xl flex items-center justify-center bg-transparent dark:bg-black/20 text-primary">
              <MaterialSymbol name="tune" size={18} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{t('vaultSettings')}</h3>
          </div>
          
          <div className="skeuo-card rounded-[2rem] bg-mesh-glass border-white/60 dark:border-white/5 overflow-hidden divide-y divide-gray-100 dark:divide-white/5 shadow-2xl">
              
              <button
                onClick={() => navigate('/male/referral')}
                className="w-full h-16 flex items-center justify-between px-6 hover:bg-white/40 dark:hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="skeuo-inset size-10 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                    <MaterialSymbol name="diversity_3" size={22} filled />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-primary transition-colors">{t('referAndEarn')}</span>
                </div>
                <MaterialSymbol name="chevron_right" size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="p-6 space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="skeuo-inset size-10 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                     <MaterialSymbol name="translate" size={22} filled />
                   </div>
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('language')}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <button
                     onClick={() => changeLanguage('en')}
                     className={`h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${currentLanguage === 'en'
                       ? 'skeuo-button bg-primary text-white shadow-xl shadow-primary/20'
                       : 'skeuo-inset bg-gray-50/50 dark:bg-black/20 text-slate-400 dark:text-slate-600'
                       }`}
                   >
                     English
                   </button>
                   <button
                     onClick={() => changeLanguage('hi')}
                     className={`h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${currentLanguage === 'hi'
                       ? 'skeuo-button bg-primary text-white shadow-xl shadow-primary/20'
                       : 'skeuo-inset bg-gray-50/50 dark:bg-black/20 text-slate-400 dark:text-slate-600'
                       }`}
                   >
                     हिंदी
                   </button>
                 </div>
              </div>

              <button
                onClick={() => navigate('/male/faqs')}
                className="w-full h-16 flex items-center justify-between px-6 hover:bg-white/40 dark:hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="skeuo-inset size-10 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                    <MaterialSymbol name="help" size={22} filled />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-primary transition-colors">{t('faqs')}</span>
                </div>
                <MaterialSymbol name="chevron_right" size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/male/settings')}
                className="w-full h-16 flex items-center justify-between px-6 hover:bg-white/40 dark:hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="skeuo-inset size-10 rounded-2xl flex items-center justify-center bg-slate-500/10 text-slate-500 dark:text-slate-400">
                    <MaterialSymbol name="settings" size={22} filled />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-primary transition-colors">{t('settings')}</span>
                </div>
                <MaterialSymbol name="chevron_right" size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
        </section>
      </div>

      <BottomNavigation items={navigationItems} onItemClick={handleNavigationClick} />

      {/* Cinematic Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-500" onClick={() => setSelectedPhotoIndex(null)}>
          <div className="flex flex-col items-center gap-8" onClick={(e) => e.stopPropagation()}>
          
          <div className="relative w-full h-[70vh] flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
             <img src={profile.photos![selectedPhotoIndex]} alt={`${t('photo')} ${selectedPhotoIndex + 1}`} className="max-w-full max-h-full object-contain rounded-[2.5rem] shadow-2xl border border-white/10" />
             
             <div className="absolute inset-x-4 flex items-center justify-between pointer-events-none">
                <button
                  disabled={selectedPhotoIndex === 0}
                  onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                  className={`pointer-events-auto skeuo-button size-14 rounded-[1.5rem] flex items-center justify-center bg-white/10 text-white backdrop-blur-xl border-white/10 active:scale-90 transition-all ${selectedPhotoIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                >
                  <MaterialSymbol name="chevron_left" size={32} />
                </button>
                <button
                  disabled={selectedPhotoIndex === profile.photos!.length - 1}
                  onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                  className={`pointer-events-auto skeuo-button size-14 rounded-[1.5rem] flex items-center justify-center bg-white/10 text-white backdrop-blur-xl border-white/10 active:scale-90 transition-all ${selectedPhotoIndex === profile.photos!.length - 1 ? 'opacity-0' : 'opacity-100'}`}
                >
                  <MaterialSymbol name="chevron_right" size={32} />
                </button>
             </div>
          </div>
          <div className="flex flex-col items-center gap-6">
             <div className="p-1 rounded-2xl skeuo-inset bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex gap-2">
                   {profile.photos!.map((_, i) => (
                      <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i === selectedPhotoIndex ? 'w-8 bg-primary' : 'w-1.5 bg-white/20'}`} />
                   ))}
                </div>
             </div>

             <button
               onClick={() => setSelectedPhotoIndex(null)}
               className="skeuo-button size-14 rounded-full flex items-center justify-center text-white shadow-2xl"
             >
               <MaterialSymbol name="close" size={28} />
             </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

