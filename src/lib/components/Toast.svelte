<script lang="ts">
    import {
        notifications,
        NotificationService,
    } from "$lib/services/notification-service";
    import type {
        Notification,
        LoadingNotification,
    } from "$lib/services/notification-service";
    import { fly, fade } from "svelte/transition";
    import { flip } from "svelte/animate";

    // Subscribe to notifications store
    $: activeNotifications = $notifications;

    /**
     * Get icon for notification type
     */
    function getIcon(type: Notification["type"]): string {
        switch (type) {
            case "success":
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            case "error":
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            case "warning":
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />`;
            case "info":
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            case "loading":
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />`;
            default:
                return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
        }
    }

    /**
     * Get CSS classes for notification type
     */
    function getAlertClass(type: Notification["type"]): string {
        switch (type) {
            case "success":
                return "alert-success";
            case "error":
                return "alert-error";
            case "warning":
                return "alert-warning";
            case "info":
                return "alert-info";
            case "loading":
                return "alert-info";
            default:
                return "alert-info";
        }
    }

    /**
     * Handle notification dismiss
     */
    function handleDismiss(id: string) {
        NotificationService.dismiss(id);
    }

    /**
     * Handle action button click
     */
    function handleAction(notification: Notification) {
        if (notification.action) {
            notification.action.handler();
        }
    }

    /**
     * Format time ago
     */
    function timeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);

        if (diffSecs < 60) {
            return "just now";
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            return `${diffHours}h ago`;
        }
    }

    /**
     * Check if notification is loading type
     */
    function isLoadingNotification(
        notification: Notification,
    ): notification is LoadingNotification {
        return notification.type === "loading";
    }
</script>

<!-- Toast Container -->
{#if activeNotifications.length > 0}
    <div class="toast toast-top toast-end z-50 max-w-sm">
        {#each activeNotifications as notification (notification.id)}
            <div
                class="alert {getAlertClass(notification.type)} shadow-lg mb-2"
                in:fly={{ x: 300, duration: 300 }}
                out:fly={{ x: 300, duration: 200 }}
                animate:flip={{ duration: 200 }}
                role="alert"
                aria-live="polite"
            >
                <!-- Icon -->
                <div class="flex-shrink-0">
                    {#if notification.type === "loading"}
                        <span class="loading loading-spinner loading-sm"></span>
                    {:else}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            {@html getIcon(notification.type)}
                        </svg>
                    {/if}
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm">
                        {notification.title}
                    </div>
                    <div class="text-xs opacity-90 mt-1 break-words">
                        {notification.message}
                    </div>

                    <!-- Progress bar for loading notifications -->
                    {#if isLoadingNotification(notification) && notification.progress !== undefined}
                        <div class="mt-2">
                            <div class="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{Math.round(notification.progress)}%</span
                                >
                            </div>
                            <progress
                                class="progress progress-primary w-full h-2"
                                value={notification.progress}
                                max="100"
                            ></progress>
                        </div>
                    {/if}

                    <!-- Timestamp -->
                    <div class="text-xs opacity-60 mt-1">
                        {timeAgo(notification.timestamp)}
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex-shrink-0 flex items-center gap-2">
                    <!-- Action button -->
                    {#if notification.action}
                        <button
                            class="btn btn-xs btn-ghost"
                            on:click={() => handleAction(notification)}
                        >
                            {notification.action.label}
                        </button>
                    {/if}

                    <!-- Dismiss button -->
                    {#if notification.dismissible}
                        <button
                            class="btn btn-xs btn-circle btn-ghost"
                            on:click={() => handleDismiss(notification.id)}
                            aria-label="Dismiss notification"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{/if}

<!-- Global dismiss button when there are many notifications -->
{#if activeNotifications.length > 3}
    <div class="fixed top-4 right-4 z-50">
        <button
            class="btn btn-sm btn-ghost bg-base-100 shadow-lg"
            on:click={() => NotificationService.dismissAll()}
            transition:fade
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
            Clear All ({activeNotifications.length})
        </button>
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
    }

    .alert {
        max-width: 24rem;
        word-wrap: break-word;
    }

    @media (max-width: 640px) {
        .toast {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
            max-width: none;
        }

        .alert {
            max-width: none;
        }
    }
</style>
