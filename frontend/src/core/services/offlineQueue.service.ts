/**
 * Offline Queue Service
 * Handles message queuing when offline and auto-retry when back online
 * CRITICAL: Coins are deducted immediately, never refunded
 */

interface QueuedMessage {
    id: string;
    type: 'message' | 'hi' | 'gift';
    timestamp: number;
    data: any;
    coinCost: number;
    retryCount: number;
    maxRetries: number;
}

class OfflineQueueService {
    private readonly QUEUE_KEY = 'dil_mate_message_queue';
    private readonly MAX_RETRIES = 3;
    private isProcessing = false;
    private onlineCallback: (() => void) | null = null;

    constructor() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * Check if user is online
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Add message to queue
     * IMPORTANT: Coins should already be deducted before calling this
     */
    queueMessage(type: 'message' | 'hi' | 'gift', data: any, coinCost: number): string {
        const message: QueuedMessage = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: Date.now(),
            data,
            coinCost,
            retryCount: 0,
            maxRetries: this.MAX_RETRIES,
        };

        const queue = this.getQueue();
        queue.push(message);
        this.saveQueue(queue);

        console.log(`[OfflineQueue] Queued ${type} message:`, message.id);
        return message.id;
    }

    /**
     * Get all queued messages
     */
    private getQueue(): QueuedMessage[] {
        try {
            const stored = localStorage.getItem(this.QUEUE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (err) {
            console.error('[OfflineQueue] Failed to get queue:', err);
            return [];
        }
    }

    /**
     * Save queue to localStorage
     */
    private saveQueue(queue: QueuedMessage[]): void {
        try {
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
        } catch (err) {
            console.error('[OfflineQueue] Failed to save queue:', err);
        }
    }

    /**
     * Remove message from queue
     */
    private removeFromQueue(messageId: string): void {
        const queue = this.getQueue();
        const filtered = queue.filter(m => m.id !== messageId);
        this.saveQueue(filtered);
    }

    /**
     * Get queue size
     */
    getQueueSize(): number {
        return this.getQueue().length;
    }

    /**
     * Process queued messages
     * Called when back online
     */
    async processQueue(sendFunction: (message: QueuedMessage) => Promise<boolean>): Promise<void> {
        if (this.isProcessing) {
            console.log('[OfflineQueue] Already processing queue');
            return;
        }

        const queue = this.getQueue();
        if (queue.length === 0) {
            console.log('[OfflineQueue] Queue is empty');
            return;
        }

        console.log(`[OfflineQueue] Processing ${queue.length} queued messages`);
        this.isProcessing = true;

        for (const message of queue) {
            try {
                console.log(`[OfflineQueue] Attempting to send ${message.type} (retry ${message.retryCount}/${message.maxRetries})`);

                const success = await sendFunction(message);

                if (success) {
                    console.log(`[OfflineQueue] Successfully sent ${message.type}:`, message.id);
                    this.removeFromQueue(message.id);
                } else {
                    // Increment retry count
                    message.retryCount++;

                    if (message.retryCount >= message.maxRetries) {
                        console.error(`[OfflineQueue] Max retries reached for ${message.type}:`, message.id);
                        // IMPORTANT: Coins were already deducted, so we just remove from queue
                        this.removeFromQueue(message.id);
                    } else {
                        // Update retry count in queue
                        const updatedQueue = this.getQueue().map(m =>
                            m.id === message.id ? message : m
                        );
                        this.saveQueue(updatedQueue);
                    }
                }
            } catch (err) {
                console.error(`[OfflineQueue] Error processing ${message.type}:`, err);
                message.retryCount++;

                if (message.retryCount >= message.maxRetries) {
                    this.removeFromQueue(message.id);
                } else {
                    const updatedQueue = this.getQueue().map(m =>
                        m.id === message.id ? message : m
                    );
                    this.saveQueue(updatedQueue);
                }
            }

            // Small delay between retries
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.isProcessing = false;
        console.log('[OfflineQueue] Queue processing complete');
    }

    /**
     * Handle online event
     */
    private handleOnline(): void {
        console.log('[OfflineQueue] Back online! Queue size:', this.getQueueSize());
        if (this.onlineCallback) {
            this.onlineCallback();
        }
    }

    /**
     * Handle offline event
     */
    private handleOffline(): void {
        console.log('[OfflineQueue] Gone offline');
    }

    /**
     * Set callback for when back online
     */
    setOnlineCallback(callback: () => void): void {
        this.onlineCallback = callback;
    }

    /**
     * Clear entire queue (use with caution)
     */
    clearQueue(): void {
        localStorage.removeItem(this.QUEUE_KEY);
        console.log('[OfflineQueue] Queue cleared');
    }
}

// Singleton instance
const offlineQueueService = new OfflineQueueService();

export default offlineQueueService;
export type { QueuedMessage };
