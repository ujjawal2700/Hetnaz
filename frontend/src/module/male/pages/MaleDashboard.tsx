import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { DiscoverNearbyCard } from '../components/DiscoverNearbyCard';
import { ActiveChatsList } from '../components/ActiveChatsList';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProfileHeader } from '../components/ProfileHeader';
import { useMaleNavigation } from '../hooks/useMaleNavigation';
import { useTranslation } from '../../../core/hooks/useTranslation';
import { useOptimizedChatList } from '../../../core/hooks/useOptimizedChatList';
import { useDiscoveryProfiles } from '../../../core/queries/useDiscoveryQuery';
import { DailyRewardModal } from '../../../shared/components/DailyRewardModal';
import { useGlobalState } from '../../../core/context/GlobalStateContext';
import apiClient from '../../../core/api/client';
import { MeshBackground } from '../../../shared/components/auth/AuthLayoutComponents';


export const MaleDashboard = () => {
  const { t } = useTranslation();

  // Use optimized chat hook - loads from cache immediately
  const { chats: rawChats, isLoading: isChatsLoading, refreshChats } = useOptimizedChatList();
  const { updateBalance } = useGlobalState();


  const navigate = useNavigate();
  const { user } = useAuth();
  const { navigationItems, handleNavigationClick } = useMaleNavigation();

  // Daily Reward Modal
  const [isDailyRewardModalOpen, setIsDailyRewardModalOpen] = useState(false);
  const [dailyRewardData, setDailyRewardData] = useState({ amount: 0, newBalance: 0 });



  // PHASED BOOT: Check and claim daily reward 3 seconds AFTER dashboard mount
  // This ensures the initial paint and critical chat list fetch have priority
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkDailyReward = async () => {
      try {
        console.log('[DailyReward] Phase III: Background claim check...');
        const response = await apiClient.post('/rewards/daily/claim');
        const result = response.data.data;

        if (result.claimed) {
          setDailyRewardData({ amount: result.amount, newBalance: result.newBalance });
          setIsDailyRewardModalOpen(true);
          updateBalance(result.newBalance);
        }
      } catch (error) {
        // Silently fail - background task
      }
    };

    timeoutId = setTimeout(checkDailyReward, 3000);
    return () => clearTimeout(timeoutId);
  }, [updateBalance]);

  useEffect(() => {
    window.scrollTo(0, 0);
    refreshChats();
    // Nearby users fetched via hook automatically


  }, []);

  // Use optimized hooks which share cache
  const { data: nearbyUsersRaw = [] } = useDiscoveryProfiles('all');

  // Transform for dashboard display
  const nearbyUsers = useMemo(() => {
    return nearbyUsersRaw.slice(0, 10).map((p: any) => ({
      id: p.id,
      name: p.name || 'User',
      avatar: p.avatar || ''
    }));
  }, [nearbyUsersRaw]);

  // Loading state derived from hooks
  const isNearbyLoading = false; // Query handles background loading, we default to showing cached or empty

  // Note: We don't need manual fetchNearbyUsers anymore



  const formatTimestamp = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
      return t('yesterday');
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const activeChatsForDisplay = useMemo(() => {
    return rawChats.slice(0, 5).map((chat: any) => {
      const otherUser = chat.otherUser || {};

      return {
        id: chat._id,
        userId: otherUser._id,
        userName: otherUser.name || 'User',
        userAvatar: otherUser.avatar || '',
        lastMessage: chat.lastMessage?.content || t('startChatting'),
        timestamp: formatTimestamp(chat.lastMessageAt),
        isOnline: !!otherUser.isOnline,
        hasUnread: (chat.unreadCount || 0) > 0,
        distance: otherUser.distance // Use distance from backend
      };
    });
  }, [rawChats, t]);

  const handleChatClick = (chatId: string) => {
    navigate(`/male/chat/${chatId}`);
  };

  const handleSeeAllChatsClick = () => {
    navigate('/male/chats');
  };

  const handleExploreClick = () => {
    navigate('/male/discover');
  };


  // Only show full loading screen if we have NO chats and NO nearby users AND are loading both
  // This allows cached chats to show up even if nearby users are loading
  if (isChatsLoading && isNearbyLoading && rawChats.length === 0 && nearbyUsers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark overflow-hidden relative">
        <MeshBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-display text-slate-900 dark:text-white antialiased selection:bg-pink-500 selection:text-white min-h-screen relative overflow-x-hidden">
      <MeshBackground />
      
      {/* Scrollable Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen pb-24 max-w-md mx-auto w-full">
        {/* Header Removed */}
        
        <ProfileHeader 
          user={user ? { 
            name: user.name || '',
            avatar: user.avatarUrl || '',
            isPremium: user.memberTier ? user.memberTier !== 'basic' : false,
            isOnline: true,
            memberTier: user.memberTier || 'basic'
          } : { name: t('loading'), avatar: '', isPremium: false, isOnline: false }}
          onEditClick={() => navigate('/male/profile/edit')}
          showEdit={false}
        />



        <DiscoverNearbyCard
          nearbyUsers={nearbyUsers}
          onExploreClick={handleExploreClick}
        />

        <ActiveChatsList
          chats={activeChatsForDisplay}
          onChatClick={handleChatClick}
          onSeeAllClick={handleSeeAllChatsClick}
        />

        <BottomNavigation
          items={navigationItems}
          onItemClick={handleNavigationClick}
        />

        {/* Daily Reward Modal */}
        <DailyRewardModal
          isOpen={isDailyRewardModalOpen}
          onClose={() => setIsDailyRewardModalOpen(false)}
          coinsAwarded={dailyRewardData.amount}
          newBalance={dailyRewardData.newBalance}
        />
      </div>
    </div>
  );
};


