/**
 * Tests for NotificationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService, notifications } from '../notification-service';
import { get } from 'svelte/store';

describe('NotificationService', () => {
    beforeEach(() => {
        // Clear all notifications before each test
        NotificationService.dismissAll();
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('basic notifications', () => {
        it('should create success notification', () => {
            const id = NotificationService.success('Success', 'Operation completed');

            const currentNotifications = get(notifications);
            expect(currentNotifications).toHaveLength(1);
            expect(currentNotifications[0].type).toBe('success');
            expect(currentNotifications[0].title).toBe('Success');
            expect(currentNotifications[0].message).toBe('Operation completed');
            expect(currentNotifications[0].id).toBe(id);
        });

        it('should create error notification', () => {
            const id = NotificationService.error('Error', 'Something went wrong');

            const currentNotifications = get(notifications);
            expect(currentNotifications).toHaveLength(1);
            expect(currentNotifications[0].type).toBe('error');
            expect(currentNotifications[0].title).toBe('Error');
            expect(currentNotifications[0].message).toBe('Something went wrong');
            expect(currentNotifications[0].duration).toBe(0); // Errors don't auto-dismiss
        });

        it('should create warning notification', () => {
            const id = NotificationService.warning('Warning', 'Be careful');

            const currentNotifications = get(notifications);
            expect(currentNotifications).toHaveLength(1);
            expect(currentNotifications[0].type).toBe('warning');
            expect(currentNotifications[0].title).toBe('Warning');
        });

        it('should create info notification', () => {
            const id = NotificationService.info('Info', 'Just so you know');

            const currentNotifications = get(notifications);
            expect(currentNotifications).toHaveLength(1);
            expect(currentNotifications[0].type).toBe('info');
        });

        it('should create loading notification', () => {
            const id = NotificationService.loading('Loading', 'Please wait...');

            const currentNotifications = get(notifications);
            expect(currentNotifications).toHaveLength(1);
            expect(currentNotifications[0].type).toBe('loading');
            expect(currentNotifications[0].dismissible).toBe(false);
        });
    });

    describe('notification management', () => {
        it('should dismiss specific notification', () => {
            const id1 = NotificationService.success('Success 1', 'Message 1');
            const id2 = NotificationService.success('Success 2', 'Message 2');

            expect(get(notifications)).toHaveLength(2);

            NotificationService.dismiss(id1);

            const remaining = get(notifications);
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe(id2);
        });

        it('should dismiss all notifications', () => {
            NotificationService.success('Success 1', 'Message 1');
            NotificationService.error('Error 1', 'Message 2');
            NotificationService.warning('Warning 1', 'Message 3');

            expect(get(notifications)).toHaveLength(3);

            NotificationService.dismissAll();

            expect(get(notifications)).toHaveLength(0);
        });

        it('should dismiss notifications by type', () => {
            NotificationService.success('Success 1', 'Message 1');
            NotificationService.error('Error 1', 'Message 2');
            NotificationService.error('Error 2', 'Message 3');

            expect(get(notifications)).toHaveLength(3);

            NotificationService.dismissByType('error');

            const remaining = get(notifications);
            expect(remaining).toHaveLength(1);
            expect(remaining[0].type).toBe('success');
        });

        it('should auto-dismiss notifications with duration', () => {
            NotificationService.success('Success', 'Message', 1000);

            expect(get(notifications)).toHaveLength(1);

            vi.advanceTimersByTime(1000);

            expect(get(notifications)).toHaveLength(0);
        });
    });

    describe('loading notifications', () => {
        it('should update loading progress', () => {
            const id = NotificationService.loading('Loading', 'Processing...', 0);

            NotificationService.updateProgress(id, 50, 'Half way there...');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].progress).toBe(50);
            expect(currentNotifications[0].message).toBe('Half way there...');
        });

        it('should complete loading notification', () => {
            const id = NotificationService.loading('Loading', 'Processing...');

            NotificationService.completeLoading(id, 'Done!', 'All finished');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('success');
            expect(currentNotifications[0].title).toBe('Done!');
            expect(currentNotifications[0].message).toBe('All finished');
        });

        it('should fail loading notification', () => {
            const id = NotificationService.loading('Loading', 'Processing...');

            NotificationService.failLoading(id, 'Failed!', 'Something went wrong');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('error');
            expect(currentNotifications[0].title).toBe('Failed!');
            expect(currentNotifications[0].message).toBe('Something went wrong');
        });
    });

    describe('operation feedback', () => {
        it('should show success feedback for create operation', () => {
            NotificationService.operationFeedback('create', true, 'Test Book');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('success');
            expect(currentNotifications[0].message).toBe('Test Book added successfully');
        });

        it('should show error feedback for failed operation', () => {
            NotificationService.operationFeedback('update', false, 'Test Book', 'Network error');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('error');
            expect(currentNotifications[0].message).toBe('Network error');
        });
    });

    describe('sync status notifications', () => {
        it('should show syncing status', () => {
            NotificationService.syncStatus('syncing', 'Uploading changes...');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('loading');
            expect(currentNotifications[0].title).toBe('Syncing');
        });

        it('should show synced status', () => {
            NotificationService.syncStatus('synced');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('success');
            expect(currentNotifications[0].title).toBe('Synced');
        });

        it('should show offline status', () => {
            NotificationService.syncStatus('offline');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('warning');
            expect(currentNotifications[0].title).toBe('Offline');
        });

        it('should show error status', () => {
            NotificationService.syncStatus('error');

            const currentNotifications = get(notifications);
            expect(currentNotifications[0].type).toBe('error');
            expect(currentNotifications[0].title).toBe('Sync Failed');
        });
    });
});