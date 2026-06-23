/**
 * IndexedDB Cache Service
 * @purpose: High-performance cache storage for chat messages and other data
 * 
 * IndexedDB has much higher storage limits than localStorage:
 * - localStorage: 5-10 MB limit
 * - IndexedDB: 50% of available disk space (typically hundreds of MB to GB)
 * 
 * This provides WhatsApp-like performance for chat caching.
 */

const DB_NAME = 'dil_mate_cache';
const DB_VERSION = 1;

// Store names
const STORES = {
    CHAT_MESSAGES: 'chat_messages',
    CHAT_LIST: 'chat_list',
    USER_PROFILES: 'user_profiles',
};

// Cache limits
const MAX_MESSAGES_PER_CHAT = 100;
const MAX_CACHED_CHATS = 50;

class IndexedDBCache {
    private db: IDBDatabase | null = null;
    private dbReady: Promise<IDBDatabase> | null = null;

    /**
     * Initialize the IndexedDB database (lazy initialization)
     */
    private initDB(): Promise<IDBDatabase> {
        // Return existing promise if already initializing/initialized
        if (this.dbReady) return this.dbReady;

        this.dbReady = new Promise((resolve, reject) => {
            // Check if we're in a browser environment
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn('IndexedDB not supported, falling back to memory-only cache');
                reject(new Error('IndexedDB not supported'));
                return;
            }

            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => {
                    console.error('Failed to open IndexedDB:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    console.log('✅ IndexedDB cache initialized');
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;

                    // Chat messages store - keyed by chatId with message array
                    if (!db.objectStoreNames.contains(STORES.CHAT_MESSAGES)) {
                        const chatStore = db.createObjectStore(STORES.CHAT_MESSAGES, { keyPath: 'chatId' });
                        chatStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
                    }

                    // Chat list cache
                    if (!db.objectStoreNames.contains(STORES.CHAT_LIST)) {
                        db.createObjectStore(STORES.CHAT_LIST, { keyPath: 'id' });
                    }

                    // User profiles cache
                    if (!db.objectStoreNames.contains(STORES.USER_PROFILES)) {
                        db.createObjectStore(STORES.USER_PROFILES, { keyPath: 'userId' });
                    }

                    console.log('📦 IndexedDB stores created');
                };
            } catch (error) {
                console.error('Error initializing IndexedDB:', error);
                reject(error);
            }
        });

        return this.dbReady;
    }

    /**
     * Wait for DB to be ready
     */
    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        return this.initDB();
    }


    // ==================== CHAT MESSAGES ====================

    /**
     * Save messages for a specific chat
     */
    async saveChatMessages(chatId: string, messages: any[]): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_MESSAGES, 'readwrite');
            const store = tx.objectStore(STORES.CHAT_MESSAGES);

            // Keep only the most recent messages
            const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_CHAT);

            await new Promise<void>((resolve, reject) => {
                const request = store.put({
                    chatId,
                    messages: trimmedMessages,
                    lastUpdated: Date.now(),
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Prune old chats if we have too many
            await this.pruneChatCache();
        } catch (error) {
            console.warn('Failed to save to IndexedDB:', error);
        }
    }

    /**
     * Get messages for a specific chat
     */
    async getChatMessages(chatId: string): Promise<any[]> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_MESSAGES, 'readonly');
            const store = tx.objectStore(STORES.CHAT_MESSAGES);

            return new Promise((resolve, reject) => {
                const request = store.get(chatId);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result?.messages || []);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Failed to read from IndexedDB:', error);
            return [];
        }
    }

    /**
     * Remove old chats to prevent unlimited growth
     */
    private async pruneChatCache(): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_MESSAGES, 'readwrite');
            const store = tx.objectStore(STORES.CHAT_MESSAGES);
            const index = store.index('lastUpdated');

            // Get all entries sorted by lastUpdated
            const allChats: { chatId: string; lastUpdated: number }[] = await new Promise((resolve, reject) => {
                const request = index.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            // If we have more than the limit, remove oldest ones
            if (allChats.length > MAX_CACHED_CHATS) {
                const sortedChats = allChats.sort((a, b) => a.lastUpdated - b.lastUpdated);
                const toRemove = sortedChats.slice(0, allChats.length - MAX_CACHED_CHATS);

                for (const chat of toRemove) {
                    store.delete(chat.chatId);
                }

                console.log(`🗑️ Pruned ${toRemove.length} old chats from cache`);
            }
        } catch (error) {
            console.warn('Failed to prune chat cache:', error);
        }
    }

    // ==================== CHAT LIST ====================

    /**
     * Save chat list
     */
    async saveChatList(chats: any[]): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_LIST, 'readwrite');
            const store = tx.objectStore(STORES.CHAT_LIST);

            // Clear existing and add new
            await new Promise<void>((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = () => reject(clearRequest.error);
            });

            for (const chat of chats) {
                store.put({ ...chat, id: chat._id || chat.id });
            }
        } catch (error) {
            console.warn('Failed to save chat list:', error);
        }
    }

    /**
     * Get cached chat list
     */
    async getChatList(): Promise<any[]> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_LIST, 'readonly');
            const store = tx.objectStore(STORES.CHAT_LIST);

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Failed to read chat list:', error);
            return [];
        }
    }

    // ==================== USER PROFILES ====================

    /**
     * Cache a user profile
     */
    async cacheUserProfile(userId: string, profile: any): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.USER_PROFILES, 'readwrite');
            const store = tx.objectStore(STORES.USER_PROFILES);

            await new Promise<void>((resolve, reject) => {
                const request = store.put({ userId, ...profile, cachedAt: Date.now() });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Failed to cache user profile:', error);
        }
    }

    /**
     * Get cached user profile
     */
    async getUserProfile(userId: string): Promise<any | null> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.USER_PROFILES, 'readonly');
            const store = tx.objectStore(STORES.USER_PROFILES);

            return new Promise((resolve, reject) => {
                const request = store.get(userId);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Failed to get user profile:', error);
            return null;
        }
    }

    // ==================== UTILITIES ====================

    /**
     * Clear all cached data
     */
    async clearAll(): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction([STORES.CHAT_MESSAGES, STORES.CHAT_LIST, STORES.USER_PROFILES], 'readwrite');

            tx.objectStore(STORES.CHAT_MESSAGES).clear();
            tx.objectStore(STORES.CHAT_LIST).clear();
            tx.objectStore(STORES.USER_PROFILES).clear();

            console.log('🗑️ All IndexedDB cache cleared');
        } catch (error) {
            console.warn('Failed to clear IndexedDB:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ chatCount: number; messageCount: number }> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORES.CHAT_MESSAGES, 'readonly');
            const store = tx.objectStore(STORES.CHAT_MESSAGES);

            const allChats: any[] = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const messageCount = allChats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);

            return {
                chatCount: allChats.length,
                messageCount,
            };
        } catch (error) {
            return { chatCount: 0, messageCount: 0 };
        }
    }
}

// Singleton instance
const indexedDBCache = new IndexedDBCache();

export default indexedDBCache;
