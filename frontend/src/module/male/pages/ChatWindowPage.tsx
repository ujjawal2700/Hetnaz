import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatWindowHeader } from '../components/ChatWindowHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { ChatMoreOptionsModal } from '../components/ChatMoreOptionsModal';
import { ChatGiftSelectorModal } from '../components/ChatGiftSelectorModal';
import { LevelUpModal } from '../components/LevelUpModal';
import { InsufficientBalanceModal } from '../components/InsufficientBalanceModal';
import { ImageModal } from '../../../shared/components/ImageModal';
import { ReportModal } from '../../../shared/components/ReportModal';
import { MeshBackground } from '../../../shared/components/auth/AuthLayoutComponents';
import apiClient from '../../../core/api/client';
import { compressImage } from '../../../core/utils/image';

import { useGlobalState } from '../../../core/context/GlobalStateContext';
import { useVideoCall } from '../../../core/context/VideoCallContextXState';
import chatService from '../../../core/services/chat.service';
import userService from '../../../core/services/user.service';
import socketService from '../../../core/services/socket.service';
import offlineQueueService from '../../../core/services/offlineQueue.service';
import type { Chat as ApiChat, Message as ApiMessage, IntimacyInfo } from '../../../core/types/chat.types';
import { useTranslation } from '../../../core/hooks/useTranslation';

import { useQueryClient } from '@tanstack/react-query';
import { CHAT_KEYS } from '../../../core/queries/useChatQuery';
import { MaterialSymbol } from '../types/material-symbol';

// Message cost constant
const MESSAGE_COST = 50;
const IMAGE_MESSAGE_COST = 100;

export const ChatWindowPage = () => {
  const { t } = useTranslation();
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { coinBalance, updateBalance, user, chatCache, saveToChatCache, appSettings } = useGlobalState();
  const { requestCall, isInCall, callPrice } = useVideoCall();

  // Dynamic Costs from Admin Settings
  const currentMessageCost = appSettings?.messageCosts?.[user?.memberTier || 'basic'] || MESSAGE_COST;
  const currentImageCost = appSettings?.messageCosts?.imageMessage || IMAGE_MESSAGE_COST;

  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ApiMessage[]>(() => {
    // 1. Try React Query cache first (fastest)
    const queryData = queryClient.getQueryData<ApiMessage[]>(CHAT_KEYS.messages(chatId || ''));
    if (queryData) return queryData;

    // 2. Fallback to legacy GlobalState cache (if migrated from old version)
    return (chatId && chatCache[chatId]) ? chatCache[chatId] : [];
  });
  const [chatInfo, setChatInfo] = useState<ApiChat | null>(null);
  const [intimacy, setIntimacy] = useState<IntimacyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<IntimacyInfo | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [requiredCoinsModal, setRequiredCoinsModal] = useState(MESSAGE_COST);
  const [modalAction, setModalAction] = useState(t('actionPerform'));
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Typing indicator
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Block status
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);

  // Image modal and upload
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Pagination state
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const MESSAGES_PER_PAGE = 10;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = user?.id;

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch chat info and messages
  useEffect(() => {
    if (!chatId) {
      navigate('/male/chats');
      return;
    }

    const init = async () => {
      try {
        setIsLoading(true);

        let activeChatId = chatId;

        // If chatId is a discovery ID (new_USERID), resolve the real chatId first
        if (chatId.startsWith('new_')) {
          const targetUserId = chatId.replace('new_', '');
          const chat = await chatService.getOrCreateChat(targetUserId);
          if (chat && chat._id) {
            activeChatId = chat._id;
            // Update URL silently so refreshes work
            navigate(`/male/chat/${activeChatId}`, { replace: true });
          } else {
            throw new Error('Failed to create chat with this user');
          }
        }

        // Fetch chat info and messages IN PARALLEL — cuts load time by ~50%
        const [chat, messagesData] = await Promise.all([
          chatService.getChatById(activeChatId),
          chatService.getChatMessages(activeChatId, { limit: MESSAGES_PER_PAGE })
        ]);

        setChatInfo(chat);
        setIntimacy(chat.intimacy);
        setIsBlockedByMe(!!chat.isBlockedByMe);
        setIsBlockedByOther(!!chat.isBlockedByOther);

        const { messages: msgData, hasMore: moreAvailable } = messagesData;
        setMessages(msgData);
        setHasMore(moreAvailable);
        saveToChatCache(activeChatId, msgData);

        // Join chat room (socket already connected by SocketContext)
        socketService.joinChat(activeChatId);

        // Mark as read — fire-and-forget, UI does not depend on this result
        chatService.markChatAsRead(activeChatId)
          .then(() => queryClient.invalidateQueries({ queryKey: CHAT_KEYS.lists() }))
          .catch(() => { }); // Non-critical, silent fail

        setError(null);
      } catch (err: any) {
        console.error('Failed to load chat:', err);
        const status = err.response?.status;
        const backendMessage = err.response?.data?.message;

        if (status === 404) {
          setError(t('errorChatNotFound') || 'This chat is no longer available.');
        } else if (status === 403) {
          setError(backendMessage || t('errorAccessDenied') || 'You do not have permission to view this chat.');
        } else {
          setError(backendMessage || err.message || t('errorFailedToLoadChat'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
      }
    };
  }, [chatId, navigate, t]);

  // Check balance on load and show modal if insufficient
  useEffect(() => {
    if (!isLoading && coinBalance < currentMessageCost) {
      setRequiredCoinsModal(currentMessageCost);
      setModalAction(t('actionSendMessage'));
      setIsBalanceModalOpen(true);
    }
  }, [isLoading, coinBalance, currentMessageCost, t]);

  // Process offline queue when back online
  useEffect(() => {
    const processOfflineQueue = async () => {
      if (!chatId) return;

      await offlineQueueService.processQueue(async (queuedMsg) => {
        try {
          if (queuedMsg.data.chatId !== chatId) return false;

          if (queuedMsg.type === 'message') {
            const result = await chatService.sendMessage(queuedMsg.data.chatId, queuedMsg.data.content);

            setMessages(prev => prev.map(m =>
              m._id === queuedMsg.data.optimisticMessageId ? result.message : m
            ));
            return true;
          }

          if (queuedMsg.type === 'gift') {
            const result = await chatService.sendGift(queuedMsg.data.chatId, queuedMsg.data.giftIds);

            setMessages(prev => prev.map(m =>
              m._id === queuedMsg.data.optimisticMessageId ? result.message : m
            ));
            return true;
          }

          return false;
        } catch (err) {
          console.error('[QueueProcessor] Failed to send queued message:', err);
          return false;
        }
      });
    };

    offlineQueueService.setOnlineCallback(processOfflineQueue);

    if (offlineQueueService.getQueueSize() > 0) {
      processOfflineQueue();
    }
  }, [chatId]);

  // Socket listener for new messages - MUST be separate and early
  useEffect(() => {
    if (!chatId) return;

    const handleNewMessage = (data: { chatId: string; message: ApiMessage }) => {
      if (String(data.chatId) === String(chatId)) {
        setMessages(prev => {
          // 1. Permanent ID check - if real ID already exists, ignore
          if (prev.some(m => String(m._id) === String(data.message._id))) return prev;

          // 2. Identify and Deduplicate Optimistic messages for the Sender
          const senderIdVal = typeof data.message.senderId === 'object'
            ? (data.message.senderId as any)._id || (data.message.senderId as any).id
            : data.message.senderId;

          const isSender = String(senderIdVal) === String(currentUserId);

          if (isSender) {
            // Find if there is a temp message with matching content or type (for gifts/images)
            const optimisticMsg = prev.find(m => {
              const isTemp = String(m._id).startsWith('temp_');
              if (!isTemp) return false;
              
              // For gifts, match by type since content might be translated/different on server
              if (data.message.messageType === 'gift' && m.messageType === 'gift') {
                return true;
              }
              
              // For others, match by content and type
              return m.content === data.message.content && m.messageType === data.message.messageType;
            });

            if (optimisticMsg) {
              // Replace the temp message with the real one from socket
              return prev.map(m => String(m._id) === String(optimisticMsg._id) ? data.message : m);
            }
          }

          // 3. Normal addition for others or messages not yet optimistically rendered
          return [...prev, data.message];
        });
        scrollToBottom();

        // Mark incoming message as read if we are in this chat
        chatService.markChatAsRead(chatId);
      }
    };

    const handleLevelUp = (data: { chatId: string; levelInfo: IntimacyInfo }) => {
      if (data.chatId === chatId) {
        setIntimacy(data.levelInfo);
        setLevelUpInfo(data.levelInfo);
      }
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('chat:message', handleNewMessage);
    socketService.on('intimacy:levelup', handleLevelUp);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('chat:message', handleNewMessage);
      socketService.off('intimacy:levelup', handleLevelUp);
    };
  }, [chatId, currentUserId, scrollToBottom, queryClient]);

  // Socket listeners for user status, typing, blocking (requires chatInfo)
  useEffect(() => {
    if (!chatInfo) return;

    // Request real-time status when entering chat
    socketService.requestUserStatus(chatInfo.otherUser._id);

    const handleTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      if (data.chatId === chatId && data.userId !== currentUserId) {
        setIsOtherTyping(data.isTyping);
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === chatInfo.otherUser._id) {
        setChatInfo(prev => prev ? {
          ...prev,
          otherUser: { ...prev.otherUser, isOnline: true }
        } : null);
      }
    };

    const handleUserOffline = (data: { userId: string; lastSeen: string }) => {
      if (data.userId === chatInfo.otherUser._id) {
        setChatInfo(prev => prev ? {
          ...prev,
          otherUser: { ...prev.otherUser, isOnline: false, lastSeen: data.lastSeen }
        } : null);
      }
    };

    const handleUserStatusResponse = (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
      if (data.userId === chatInfo.otherUser._id) {
        setChatInfo(prev => prev ? {
          ...prev,
          otherUser: { ...prev.otherUser, isOnline: data.isOnline, lastSeen: data.lastSeen }
        } : null);
      }
    };

    const handleBlockedBy = (data: { blockedBy: string; blockedByName: string }) => {
      if (data.blockedBy === chatInfo.otherUser._id) {
        setIsBlockedByOther(true);
        setError(t('youHaveBeenBlockedBy', { name: data.blockedByName }));
      }
    };

    socketService.on('chat:typing', handleTyping);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);
    socketService.on('user:status:response', handleUserStatusResponse);
    socketService.on('user:blocked_by', handleBlockedBy);

    return () => {
      socketService.off('chat:typing', handleTyping);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
      socketService.off('user:status:response', handleUserStatusResponse);
      socketService.off('user:blocked_by', handleBlockedBy);
    };
  }, [chatId, chatInfo, currentUserId, t]);

  // Auto-scroll on new messages & Sync to Cache
  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0 && chatId) {
      // Sync local state to React Query cache for instant load next time
      queryClient.setQueryData(CHAT_KEYS.messages(chatId), messages);
    }
  }, [messages, scrollToBottom, chatId, queryClient]);

  // Send text message
  const handleSendMessage = async (content: string) => {
    setHasInteracted(true);
    if (!chatId || isSending) return;

    if (coinBalance < currentMessageCost) {
      setRequiredCoinsModal(currentMessageCost);
      setModalAction(t('actionSendMessage'));
      setIsBalanceModalOpen(true);
      return;
    }

    const newBalance = coinBalance - currentMessageCost;
    updateBalance(newBalance);
    setHasInteracted(true);

    const optimisticMessage: ApiMessage = {
      _id: `temp_${Date.now()}`,
      chatId: chatId,
      senderId: user?.id || '',
      content,
      messageType: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      setIsSending(true);
      setError(null);

      const result = await chatService.sendMessage(chatId, content);

      setMessages(prev => prev.map(m =>
        m._id === optimisticMessage._id ? result.message : m
      ));

      if (result.newBalance !== undefined) {
        updateBalance(result.newBalance);
      }

      if (result.levelUp) {
        setLevelUpInfo(result.levelUp);
        setIntimacy(result.intimacy);
      } else if (result.intimacy) {
        setIntimacy(result.intimacy);
      }

    } catch (err: any) {
      console.error('Failed to send message:', err);

      if (!offlineQueueService.isOnline() || err.code === 'ERR_NETWORK') {
        offlineQueueService.queueMessage('message', {
          chatId,
          content,
          optimisticMessageId: optimisticMessage._id,
        }, MESSAGE_COST);

        setMessages(prev => prev.map(m =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'queued' as any }
            : m
        ));

        setError(t('messageQueued'));
      } else {
        setError(err.response?.data?.message || t('errorFailedToSendMessage'));
        setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      }
    } finally {
      setIsSending(false);
    }
  };

  // Send gift
  const handleSendGift = async (giftIds: string[], totalCost: number) => {
    setHasInteracted(true);
    if (!chatId || isSending) return;
    setHasInteracted(true);

    const newBalance = coinBalance - totalCost;
    updateBalance(newBalance);

    const optimisticMessage: ApiMessage = {
      _id: `temp_gift_${Date.now()}`,
      chatId: chatId,
      senderId: user?.id || '',
      content: t('sentGift'),
      messageType: 'gift',
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gifts: giftIds.map(id => ({ giftId: id, giftName: 'Gift', giftImage: '', giftCost: 0 }))
    } as any;

    setMessages(prev => [...prev, optimisticMessage]);
    setIsGiftSelectorOpen(false);

    try {
      setIsSending(true);
      setError(null);

      const result = await chatService.sendGift(chatId, giftIds);

      setMessages(prev => prev.map(m =>
        m._id === optimisticMessage._id ? result.message : m
      ));

      if (result.newBalance !== undefined) {
        updateBalance(result.newBalance);
      }

      if (result.levelUp) {
        setLevelUpInfo(result.levelUp);
        setIntimacy(result.intimacy);
      } else if (result.intimacy) {
        setIntimacy(result.intimacy);
      }

    } catch (err: any) {
      console.error('Failed to send gift:', err);

      if (!offlineQueueService.isOnline() || err.code === 'ERR_NETWORK') {
        offlineQueueService.queueMessage('gift', {
          chatId,
          giftIds,
          optimisticMessageId: optimisticMessage._id,
        }, totalCost);

        setMessages(prev => prev.map(m =>
          m._id === optimisticMessage._id
            ? { ...m, status: 'queued' as any }
            : m
        ));

        setError(t('giftQueued'));
      } else {
        const errorMessage = err.response?.data?.message || '';
        if (errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('balance')) {
          setModalAction(t('actionSendGift'));
          setIsBalanceModalOpen(true);
        } else {
          setError(errorMessage || t('errorFailedToSendGift'));
        }
        setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      }
    } finally {
      setIsSending(false);
    }
  };

  // Send image
  const handleSendImage = async (base64Image: string) => {
    setHasInteracted(true);
    if (!chatId || isSending || isUploadingImage) return;

    if (coinBalance < currentImageCost) {
      setRequiredCoinsModal(currentImageCost);
      setModalAction(t('actionSendMessage'));
      setIsBalanceModalOpen(true);
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);

      // Compress image before upload
      const compressedBase64 = await compressImage(base64Image, { maxWidth: 1000, maxHeight: 1000, quality: 0.75 });

      // Upload to Cloudinary - increased timeout to 60s for direct upload
      const response = await apiClient.post('/upload/chat-image',
        { image: compressedBase64 },
        { timeout: 60000 }
      );
      const { url } = response.data.data;

      // Deduct balance
      const newBalance = coinBalance - currentImageCost;
      updateBalance(newBalance);

      // Create optimistic message
      const optimisticMessage: ApiMessage = {
        _id: `temp_image_${Date.now()}`,
        chatId: chatId,
        senderId: user?.id || '',
        content: '',
        messageType: 'image',
        status: 'sending',
        attachments: [{ type: 'image', url }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      setMessages(prev => [...prev, optimisticMessage]);
      setHasInteracted(true);

      // Send via chat service
      setIsSending(true);
      const result = await chatService.sendMessage(chatId, '', 'image', url);

      setMessages(prev => prev.map(m =>
        m._id === optimisticMessage._id ? result.message : m
      ));

      if (result.newBalance !== undefined) {
        updateBalance(result.newBalance);
      }

      if (result.levelUp) {
        setLevelUpInfo(result.levelUp);
        setIntimacy(result.intimacy);
      } else if (result.intimacy) {
        setIntimacy(result.intimacy);
      }

    } catch (err: any) {
      console.error('Failed to send image:', err);
      setError(err.response?.data?.message || t('errorFailedToSendImage'));
      // Refund coins on failure
      updateBalance(coinBalance);
    } finally {
      setIsUploadingImage(false);
      setIsSending(false);
    }
  };

  // Typing indicator
  const handleTypingStart = () => {
    if (chatId) {
      socketService.sendTyping(chatId, true);
    }
  };

  const handleTypingStop = () => {
    if (chatId) {
      socketService.sendTyping(chatId, false);
    }
  };

  const handleBlockUser = async () => {
    if (!chatInfo) return;
    try {
      await userService.blockUser(chatInfo.otherUser._id);
      setIsBlockedByMe(true);
      setError(t('userBlockedSuccessfully'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedToBlockUser'));
    }
  };

  const handleUnblockUser = async () => {
    if (!chatInfo) return;
    try {
      await userService.unblockUser(chatInfo.otherUser._id);
      setIsBlockedByMe(false);
      setError(t('userUnblockedSuccessfully'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedToUnblockUser'));
    }
  };

  const handleDeleteChat = async () => {
    if (!chatId) return;
    try {
      await userService.deleteChat(chatId);
      navigate('/male/chats');
    } catch (err: any) {
      setError(err.response?.data?.message || t('failedToDeleteChat'));
    }
  };

  if (isLoading) return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">{t('loadingChat') || 'Opening chat...'}</p>
    </div>
  );

  if (!chatInfo) {
    return (
      <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <MaterialSymbol name="chat_off" size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {error?.includes('permission') || error?.includes('blocked')
            ? (t('accessDeniedTitle') || 'Access Denied')
            : (t('chatNotAvailableTitle') || 'Chat Not Available')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
          {error || (t('chatNotAvailableDesc') || 'This chat might have been closed or is temporarily unavailable.')}
        </p>
        <button
          onClick={() => navigate('/male/chats')}
          className="w-full max-w-xs py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 active:scale-95 transition-all"
        >
          {t('goBackToChats') || 'Go Back to Chats'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent overflow-hidden font-display relative">
      <div className="max-w-md mx-auto w-full h-full flex flex-col relative">
      {/* Background with low opacity */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0">
        <MeshBackground />
      </div>

      <ChatWindowHeader
        userName={chatInfo.otherUser.name}
        userAvatar={chatInfo.otherUser.avatar || ''}
        isOnline={chatInfo.otherUser.isOnline}
        isVerified={chatInfo.otherUser.isVerified}
        coinBalance={coinBalance}
        intimacy={intimacy}
        onMoreClick={() => setIsMoreOptionsOpen(true)}
        onUserInfoClick={() => navigate(`/male/profile/${chatInfo.otherUser._id}`)}
        onBackClick={() => navigate('/male/chats')}
        showVideoCall={true}
        onVideoCall={async () => {
          if (isInCall) {
            setError(t('errorAlreadyInCall'));
            return;
          }
          if (isBlockedByMe || isBlockedByOther) {
            setError(isBlockedByMe ? t('unblockToCall') : t('youAreBlocked'));
            return;
          }
          if (coinBalance < callPrice) {
            setRequiredCoinsModal(callPrice);
            setModalAction(t('actionVideoCall'));
            setIsBalanceModalOpen(true);
            return;
          }

          if (!chatInfo.otherUser.isOnline) {
            setError(t('errorUserOffline'));
            return;
          }
          try {
            await requestCall(
              chatInfo.otherUser._id,
              chatInfo.otherUser.name,
              chatInfo.otherUser.avatar || '',
              chatId!,
              user?.name || 'User',
              user?.photos?.[0] || ''
            );
          } catch (err: any) {
            // Special handling for permission denied errors
            if (err.message === 'PERMISSION_DENIED_SETTINGS') {
              setError(
                'Camera and microphone access blocked. Please enable permissions in your browser settings:\n' +
                '1. Tap the lock icon in the address bar\n' +
                '2. Enable Camera and Microphone\n' +
                '3. Refresh the page and try again'
              );
            } else {
              setError(err.message || t('errorFailedToStartCall'));
            }
          }
        }}
      />

      {error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-start justify-between gap-2">
          <span className="whitespace-pre-line flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 shrink-0">✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 relative z-10">
        {/* Profile Centerpiece (Instagram style) */}
        {!isLoadingMore && (
          <div className="flex flex-col items-center pt-8 pb-10 px-6 text-center">
            <div className="relative mb-4 group cursor-pointer" onClick={() => navigate(`/male/profile/${chatInfo.otherUser._id}`)}>
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 rounded-full opacity-70 blur-[2px] group-hover:opacity-100 transition-opacity" />
              <img
                src={chatInfo.otherUser.avatar || 'https://via.placeholder.com/120'}
                alt={chatInfo.otherUser.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1a0f14] relative z-10"
              />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
              {chatInfo.otherUser.name}
              {chatInfo.otherUser.isVerified && (
                <MaterialSymbol name="verified" filled size={20} className="text-blue-500" />
              )}
            </h1>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-4 tracking-tight">
              Dil Mate User • {chatInfo.otherUser.isOnline ? 'Active Now' : 'Recently Active'}
            </p>
            
            {/* Stats row like Instagram */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Lv.{intimacy?.level || 1}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Level</span>
              </div>
              <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{messages.length}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Chats</span>
              </div>
            </div>

          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={async () => {
                if (!chatId || isLoadingMore) return;
                setIsLoadingMore(true);
                try {
                  const oldestMessage = messages[0];
                  const beforeDate = oldestMessage?.createdAt;
                  const { messages: olderMessages, hasMore: moreAvailable } = await chatService.getChatMessages(chatId, {
                    limit: MESSAGES_PER_PAGE,
                    before: beforeDate
                  });
                  setMessages(prev => [...olderMessages, ...prev]);
                  setHasMore(moreAvailable);
                } catch (err) {
                  console.error('Failed to load more messages:', err);
                } finally {
                  setIsLoadingMore(false);
                }
              }}
              disabled={isLoadingMore}
              className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? t('loading') : t('loadMore')}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            <p>{t('noMessagesYet')}</p>
          </div>
        )}

        {messages.map((message) => {
          let senderId;
          if (typeof message.senderId === 'string') {
            senderId = message.senderId;
          } else if (message.senderId) {
            senderId = message.senderId._id || (message.senderId as any).id;
          }

          const isSent = String(senderId) === String(currentUserId);
          const senderName = (typeof message.senderId === 'object' && message.senderId)
            ? message.senderId.profile?.name
            : 'User';

          return (
            <MessageBubble
              key={message._id}
              onImageClick={(url) => setSelectedImageModal(url)}
              onProfileClick={() => navigate(`/male/profile/${chatInfo.otherUser._id}`)}
              message={{
                id: message._id,
                chatId: message.chatId,
                senderId: String(senderId),
                senderName: senderName || 'User',
                content: message.content,
                timestamp: new Date(message.createdAt),
                type: message.messageType === 'video_call' ? 'text' : message.messageType as any,
                isSent,
                readStatus: message.status === 'failed' ? 'sent' : message.status as any,
                gifts: message.gifts as any,
                attachments: message.attachments as any,
                senderAvatar: isSent 
                  ? (user?.avatarUrl || user?.photos?.[0] || 'https://via.placeholder.com/40') 
                  : (chatInfo.otherUser.avatar || 'https://via.placeholder.com/40')
              }}
            />
          );
        })}

        {isOtherTyping && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">
              {t('typingIndicator', { name: chatInfo.otherUser.name })}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="relative">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendPhoto={handleSendImage}
          onSendGift={() => setIsGiftSelectorOpen(true)}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          placeholder={isBlockedByMe ? t('unblockToSendMessage') : isBlockedByOther ? t('youAreBlocked') : t('typeMessage')}
          coinCost={MESSAGE_COST}
          disabled={coinBalance < MESSAGE_COST || isSending || isUploadingImage || isBlockedByMe || isBlockedByOther}
          isSending={isSending || isUploadingImage}
          showQuickReplies={messages.length === 0 && !hasInteracted}
          onLowCoins={() => {
            setRequiredCoinsModal(currentMessageCost);
            setModalAction(t('actionSendMessage'));
            setIsBalanceModalOpen(true);
          }}
        />
      </div>

      <ChatMoreOptionsModal
        isOpen={isMoreOptionsOpen}
        onClose={() => setIsMoreOptionsOpen(false)}
        onViewProfile={() => navigate(`/male/profile/${chatInfo.otherUser._id}`)}
        onBlock={isBlockedByMe ? handleUnblockUser : handleBlockUser}
        isBlocked={isBlockedByMe}
        onReport={() => {
          setIsMoreOptionsOpen(false);
          setIsReportModalOpen(true);
        }}
        onDelete={handleDeleteChat}
        userName={chatInfo.otherUser.name}
      />

      <ChatGiftSelectorModal
        isOpen={isGiftSelectorOpen}
        onClose={() => setIsGiftSelectorOpen(false)}
        onSendGift={handleSendGift}
        coinBalance={coinBalance}
      />

      <InsufficientBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        onBuyCoins={() => navigate('/male/buy-coins')}
        requiredCoins={requiredCoinsModal}
        currentBalance={coinBalance || 0}
        action={modalAction}
      />

      <LevelUpModal
        isOpen={!!levelUpInfo}
        onClose={() => setLevelUpInfo(null)}
        levelInfo={levelUpInfo}
        userName={chatInfo.otherUser.name}
      />

      {/* Image Modal for full-screen view */}
      {selectedImageModal && (
        <ImageModal
          isOpen={!!selectedImageModal}
          imageUrl={selectedImageModal}
          onClose={() => setSelectedImageModal(null)}
        />
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportedId={chatInfo.otherUser._id}
        userName={chatInfo.otherUser.name}
        chatId={chatId}
        onSuccess={() => {
          setError(t('reportSubmittedSuccess') || 'Report submitted successfully');
        }}
      />
      </div>
    </div>
  );
};
