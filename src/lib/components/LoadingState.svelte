<!-- Skeleton Loading Component -->
<script lang="ts" context="module">
    export interface SkeletonProps {
        lines?: number;
        width?: string;
        height?: string;
        className?: string;
    }
</script>

<script lang="ts">
    export let loading = false;
    export let message = "Loading...";
    export let size: "sm" | "md" | "lg" = "md";
    export let type: "spinner" | "dots" | "ring" | "ball" | "bars" = "spinner";
    export let overlay = false; // Show as overlay over content
    export let inline = false; // Show inline with content
    export let progress: number | undefined = undefined; // 0-100 for progress bar
    export let progressMessage = "";

    $: sizeClass = {
        sm: "loading-sm",
        md: "loading-md",
        lg: "loading-lg",
    }[size];

    $: typeClass = {
        spinner: "loading-spinner",
        dots: "loading-dots",
        ring: "loading-ring",
        ball: "loading-ball",
        bars: "loading-bars",
    }[type];
</script>

{#if loading}
    {#if overlay}
        <!-- Overlay Loading -->
        <div
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="status"
            aria-live="polite"
        >
            <div
                class="bg-base-100 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4"
            >
                <div class="flex flex-col items-center space-y-4">
                    <span class="loading {typeClass} {sizeClass}"></span>
                    <div class="text-center">
                        <div class="font-medium">{message}</div>
                        {#if progress !== undefined}
                            <div class="mt-3 w-full">
                                <div class="flex justify-between text-sm mb-1">
                                    <span>{progressMessage || "Progress"}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <progress
                                    class="progress progress-primary w-full"
                                    value={progress}
                                    max="100"
                                ></progress>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {:else if inline}
        <!-- Inline Loading -->
        <div
            class="flex items-center space-x-2"
            role="status"
            aria-live="polite"
        >
            <span class="loading {typeClass} {sizeClass}"></span>
            <span class="text-sm">{message}</span>
        </div>
    {:else}
        <!-- Block Loading -->
        <div
            class="flex flex-col items-center justify-center p-8 space-y-4"
            role="status"
            aria-live="polite"
        >
            <span class="loading {typeClass} {sizeClass}"></span>
            <div class="text-center">
                <div class="font-medium">{message}</div>
                {#if progress !== undefined}
                    <div class="mt-3 w-full max-w-xs">
                        <div class="flex justify-between text-sm mb-1">
                            <span>{progressMessage || "Progress"}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <progress
                            class="progress progress-primary w-full"
                            value={progress}
                            max="100"
                        ></progress>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
{/if}

<!-- Skeleton Loading for content placeholders -->
{#if $$slots.skeleton}
    <slot name="skeleton" />
{/if}

<!-- Skeleton component can be used separately -->
<div class="skeleton-container" class:hidden={!loading}>
    <slot name="skeleton">
        <!-- Default skeleton -->
        <div class="animate-pulse flex flex-col gap-3">
            <div class="h-4 bg-base-300 rounded w-3/4"></div>
            <div class="h-4 bg-base-300 rounded w-1/2"></div>
            <div class="h-4 bg-base-300 rounded w-5/6"></div>
        </div>
    </slot>
</div>

<style>
    .skeleton-container {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
</style>
