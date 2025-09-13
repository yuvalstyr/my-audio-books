/**
 * Notification service for user feedback and toast messages
 * Provides a centralized way to show user notifications
 */

import { writable } from 'svelte/store';
import type { UserFriendlyError } from './error-logger';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    action?: {
        label: string;
        handler: () => void;
    };
    duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
    dismissible?: boolean;
    timestamp: Date;
}

export interface LoadingNotification extends Notification {
    type: 'loading';
    progress?: number; // 0-100 for progress bar
}

// Store for active notifications
export const notifications = writable<Notification[]>([]);

export class NotificationService {
    private static idCounter = 0;

    /**
     * Generate unique notification ID
     */
    private static generateId(): string {
        return `notification-${Date.now()}-${++this.idCounter}`;
    }

    /**
     * Add a notification to the store
     */
    private static addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
        const id = this.generateId();
        const fullNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date(),
            dismissible: notification.dismissible ?? true
        };

        notifications.update(current => [...current, fullNotification]);

        // Auto-dismiss if duration is set
        if (fullNotification.duration && fullNotification.duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, fullNotification.duration);
        }

        return id;
    }

    /**
     * Show success notification
     */
    static success(title: string, message: string, duration: number = 4000): string {
        return this.addNotification({
            type: 'success',
            title,
            message,
            duration
        });
    }

    /**
     * Show error notification
     */
    static error(title: string, message: string, action?: Notification['action']): string {
        return this.addNotification({
            type: 'error',
            title,
            message,
            action,
            duration: 0 // Errors don't auto-dismiss
        });
    }

    /**
     * Show error from UserFriendlyError
     */
    static errorFromUserError(userError: UserFriendlyError, actionHandler?: () => void): string {
        const action = userError.action && actionHandler ? {
            label: userError.action,
            handler: actionHandler
        } : undefined;

        return this.addNotification({
            type: userError.type as NotificationType,
            title: userError.title,
            message: userError.message,
            action,
            duration: userError.type === 'error' ? 0 : 5000
        });
    }

    /**
     * Show warning notification
     */
    static warning(title: string, message: string, duration: number = 6000): string {
        return this.addNotification({
            type: 'warning',
            title,
            message,
            duration
        });
    }

    /**
     * Show info notification
     */
    static info(title: string, message: string, duration: number = 4000): string {
        return this.addNotification({
            type: 'info',
            title,
            message,
            duration
        });
    }

    /**
     * Show loading notification
     */
    static loading(title: string, message: string, progress?: number): string {
        return this.addNotification({
            type: 'loading',
            title,
            message,
            progress,
            duration: 0,
            dismissible: false
        } as LoadingNotification);
    }

    /**
     * Update loading notification progress
     */
    static updateProgress(id: string, progress: number, message?: string): void {
        notifications.update(current =>
            current.map(notification =>
                notification.id === id && notification.type === 'loading'
                    ? {
                        ...notification,
                        progress,
                        message: message || notification.message
                    } as LoadingNotification
                    : notification
            )
        );
    }

    /**
     * Convert loading notification to success
     */
    static completeLoading(id: string, successTitle?: string, successMessage?: string): void {
        notifications.update(current =>
            current.map(notification =>
                notification.id === id && notification.type === 'loading'
                    ? {
                        ...notification,
                        type: 'success' as NotificationType,
                        title: successTitle || 'Completed',
                        message: successMessage || 'Operation completed successfully',
                        duration: 3000,
                        dismissible: true,
                        progress: undefined
                    }
                    : notification
            )
        );

        // Auto-dismiss the success notification
        setTimeout(() => {
            this.dismiss(id);
        }, 3000);
    }

    /**
     * Convert loading notification to error
     */
    static failLoading(id: string, errorTitle?: string, errorMessage?: string, action?: Notification['action']): void {
        notifications.update(current =>
            current.map(notification =>
                notification.id === id && notification.type === 'loading'
                    ? {
                        ...notification,
                        type: 'error' as NotificationType,
                        title: errorTitle || 'Failed',
                        message: errorMessage || 'Operation failed',
                        action,
                        duration: 0,
                        dismissible: true,
                        progress: undefined
                    }
                    : notification
            )
        );
    }

    /**
     * Dismiss a specific notification
     */
    static dismiss(id: string): void {
        notifications.update(current =>
            current.filter(notification => notification.id !== id)
        );
    }

    /**
     * Dismiss all notifications
     */
    static dismissAll(): void {
        notifications.set([]);
    }

    /**
     * Dismiss all notifications of a specific type
     */
    static dismissByType(type: NotificationType): void {
        notifications.update(current =>
            current.filter(notification => notification.type !== type)
        );
    }

    /**
     * Get current notifications count
     */
    static getCount(): number {
        let count = 0;
        notifications.subscribe(current => {
            count = current.length;
        })();
        return count;
    }

    /**
     * Check if there are any error notifications
     */
    static hasErrors(): boolean {
        let hasErrors = false;
        notifications.subscribe(current => {
            hasErrors = current.some(n => n.type === 'error');
        })();
        return hasErrors;
    }



    /**
     * Show operation feedback (for CRUD operations)
     */
    static operationFeedback(
        operation: 'create' | 'update' | 'delete' | 'import' | 'export',
        success: boolean,
        itemName?: string,
        error?: string
    ): string {
        const item = itemName || 'item';

        if (success) {
            const messages = {
                create: `${item} added successfully`,
                update: `${item} updated successfully`,
                delete: `${item} deleted successfully`,
                import: `Data imported successfully`,
                export: `Data exported successfully`
            };

            return this.success('Success', messages[operation]);
        } else {
            const messages = {
                create: `Failed to add ${item}`,
                update: `Failed to update ${item}`,
                delete: `Failed to delete ${item}`,
                import: `Failed to import data`,
                export: `Failed to export data`
            };

            return this.error('Error', error || messages[operation]);
        }
    }

    /**
     * Show validation errors
     */
    static validationError(field: string, message: string): string {
        return this.error('Validation Error', `${field}: ${message}`);
    }

    /**
     * Show network status
     */
    static networkStatus(online: boolean): string {
        if (online) {
            return this.success('Connected', 'Internet connection restored');
        } else {
            return this.warning('Offline', 'No internet connection - working offline');
        }
    }
}